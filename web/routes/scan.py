import asyncio, json, logging, re, socket, ssl, urllib.error, urllib.request, uuid, ipaddress
from fastapi import APIRouter, Depends, HTTPException
from fastapi.responses import StreamingResponse
from sqlalchemy.orm import Session
from database.db import get_db
from database.models import ScanResult, AuditLog
from .auth import require_admin

log = logging.getLogger('nexus.scan')
router = APIRouter(prefix='/api/scan', tags=['scan'])

try:
    import dns.resolver as _res
    import dns.zone as _zone
    import dns.query as _dq
    DNS = True
except ImportError:
    DNS = False

_PRIVATE = [ipaddress.ip_network(n) for n in [
    '127.0.0.0/8','10.0.0.0/8','172.16.0.0/12','192.168.0.0/16','169.254.0.0/16','::1/128']]

def _e(d): return f"data: {json.dumps(d)}\n\n"
async def _p(msg, d=0.3): await asyncio.sleep(d); return _e({'type':'progress','msg':msg})
def _loop(): return asyncio.get_running_loop()
async def _run(fn,*a): return await _loop().run_in_executor(None,fn,*a)

def _ssrf(h):
    h=h.split(':')[0].strip()
    if not h: raise ValueError('Empty host')
    try: ip_s=socket.gethostbyname(h)
    except socket.gaierror: raise ValueError(f'Cannot resolve {h}')
    ip=ipaddress.ip_address(ip_s)
    if any(ip in n for n in _PRIVATE): raise ValueError(f'Private IP blocked: {ip_s}')
    return ip_s

def _http(url,timeout=8):
    try:
        ctx=ssl.create_default_context(); ctx.check_hostname=False; ctx.verify_mode=ssl.CERT_NONE
        r=urllib.request.urlopen(urllib.request.Request(url,headers={'User-Agent':'NEXUS/1.0'}),timeout=timeout,context=ctx)
        return r.status,{k.lower():v for k,v in dict(r.headers).items()},r.read(8192).decode('utf-8','replace')
    except urllib.error.HTTPError as e: return e.code,{k.lower():v for k,v in dict(e.headers).items()},''
    except: return None,{},''

def _ssl_info(h,p=443):
    try:
        ctx=ssl.create_default_context()
        with ctx.wrap_socket(socket.create_connection((h,p),timeout=8),server_hostname=h) as s:
            c=s.getpeercert()
            return {'ver':s.version(),'cipher':s.cipher()[0] if s.cipher() else '','bits':s.cipher()[2] if s.cipher() else 0,
                    'expiry':c.get('notAfter',''),'cn':dict(x[0] for x in c.get('subject',[])).get('commonName',''),
                    'san':[v for _,v in c.get('subjectAltName',[])]}
    except Exception as e: return {'error':str(e)}

def _port_open(ip,port):
    try: socket.create_connection((ip,port),timeout=1.2).close(); return True
    except: return False

def _dns_q(n,t):
    if not DNS: return []
    try: return [str(r) for r in _res.resolve(n,t,lifetime=6)]
    except: return []

def _host(t): return t.replace('https://','').replace('http://','').split('/')[0].split(':')[0].strip()
def _jid(): return uuid.uuid4().hex[:12].upper()

SEC_H=[('strict-transport-security','HSTS','high'),('content-security-policy','CSP','high'),
       ('x-frame-options','X-Frame-Options','medium'),('x-content-type-options','X-Content-Type-Options','medium'),
       ('referrer-policy','Referrer-Policy','low'),('permissions-policy','Permissions-Policy','low')]

PORTS=[(21,'FTP'),(22,'SSH'),(23,'Telnet'),(25,'SMTP'),(53,'DNS'),(80,'HTTP'),
       (110,'POP3'),(143,'IMAP'),(443,'HTTPS'),(445,'SMB'),(3306,'MySQL'),
       (5432,'PostgreSQL'),(6379,'Redis'),(8080,'HTTP-Alt'),(8443,'HTTPS-Alt'),
       (27017,'MongoDB'),(3389,'RDP'),(5900,'VNC')]
DANGER={23,445,3306,5432,6379,27017,3389,5900}

DKIM_S=['default','google','mail','k1','k2','selector1','selector2','s1','s2','dkim','smtp','email','mailjet','sendgrid']

WAF_SIGS={'Cloudflare':['cf-ray','cf-cache-status'],'AWS CloudFront':['x-amz-cf-id'],
          'Akamai':['akamai-cache-status'],'Fastly':['x-fastly-request-id'],
          'Imperva':['x-iinfo','visid_incap_'],'Azure Front Door':['x-azure-ref'],'Varnish':['x-varnish']}

TECH_S=[(r'wp-content|wp-includes','WordPress','CMS'),(r'drupal\.js','Drupal','CMS'),
        (r'__NEXT_DATA__','Next.js','Framework'),(r'data-reactroot','React','Frontend'),
        (r'ng-version','Angular','Frontend'),(r'vue\.min\.js','Vue.js','Frontend'),
        (r'jquery[.-](\d+\.\d+)','jQuery','JS Library'),(r'bootstrap[.-](\d+)','Bootstrap','CSS'),
        (r'cf-ray|__cflb','Cloudflare','CDN'),(r'laravel_session','Laravel','Backend'),
        (r'csrfmiddlewaretoken','Django','Backend'),(r'__VIEWSTATE','ASP.NET','Backend')]

async def _scan_web(target):
    h=_host(target); findings=[]
    yield await _p(f'SSRF check for {h}...',0.2)
    try: await _run(_ssrf,h)
    except ValueError as e: yield _e({'type':'error','msg':str(e)}); return
    yield await _p('Fetching response...')
    status,hdrs,body=await _run(_http,f'https://{h}')
    scheme='https'
    if status is None:
        yield _e({'type':'progress','msg':'  HTTPS failed, trying HTTP...'})
        status,hdrs,body=await _run(_http,f'http://{h}'); scheme='http'
    if not status: yield _e({'type':'error','msg':'Unreachable'}); return
    yield _e({'type':'progress','msg':f'✓ HTTP {status}'})
    yield await _p('Security headers check...')
    for hdr,label,sev in SEC_H:
        await asyncio.sleep(0.1)
        if hdr not in hdrs:
            f={'severity':sev,'title':f'Missing {label}','detail':f'Add {hdr} header.'}
            findings.append(f); yield _e({'type':'finding','finding':f})
        else: yield _e({'type':'progress','msg':f'  ✓ {label}'})
    for h2 in ('server','x-powered-by'):
        if v:=hdrs.get(h2,''):
            ver=re.search(r'[\d.]{3,}',v)
            f={'severity':'medium' if ver else 'info','title':f'Disclosure: {h2}: {v[:50]}','detail':'Suppress header.'}
            findings.append(f); yield _e({'type':'finding','finding':f})
    yield await _p('TLS check...')
    info=await _run(_ssl_info,h)
    if 'error' in info:
        f={'severity':'high','title':'TLS Error','detail':info['error']}; findings.append(f); yield _e({'type':'finding','finding':f})
    else:
        yield _e({'type':'progress','msg':f"  ✓ {info['ver']} {info['cipher']} ({info['bits']}-bit)"})
    jid=_jid()
    hi=sum(1 for f in findings if f['severity']=='high')
    me=sum(1 for f in findings if f['severity']=='medium')
    lo=sum(1 for f in findings if f['severity'] in ('low','info'))
    yield _e({'type':'done','job_id':jid,'total':len(findings),'high':hi,'medium':me,'low':lo})

async def _scan_network(target):
    h=_host(target); findings=[]
    yield await _p('Resolving target...',0.2)
    try: ip=await _run(_ssrf,h)
    except ValueError as e: yield _e({'type':'error','msg':str(e)}); return
    yield _e({'type':'progress','msg':f'✓ {h} → {ip}'})
    yield await _p(f'Parallel port scan ({len(PORTS)} ports)...')
    async def chk(p,s): return p,s,await _run(_port_open,ip,p)
    results=sorted(await asyncio.gather(*[chk(p,s) for p,s in PORTS]),key=lambda x:x[0])
    opens=[]
    for port,svc,open_ in results:
        await asyncio.sleep(0.02)
        if open_:
            opens.append((port,svc))
            sev='high' if port in DANGER else ('medium' if port not in (80,443,22,53) else 'info')
            f={'severity':sev,'title':f'Port {port}/tcp — {svc}','detail':'Exposed.' + (' Close if not required.' if port in DANGER else '')}
            findings.append(f); yield _e({'type':'finding','finding':f})
        else: yield _e({'type':'progress','msg':f'  · {port}/{svc} closed'})
    jid=_jid(); hi=sum(1 for f in findings if f['severity']=='high')
    yield _e({'type':'done','job_id':jid,'total':len(findings),'high':hi,'medium':0,'low':0,'open':len(opens)})

async def _scan_email(target):
    domain=_host(target); findings=[]
    yield await _p(f'Email security for {domain}...',0.2)
    mx=await _run(_dns_q,domain,'MX')
    if not mx:
        f={'severity':'medium','title':'No MX Records','detail':f'No mail exchange for {domain}.'}
        findings.append(f); yield _e({'type':'finding','finding':f})
    else:
        for m in mx[:3]: yield _e({'type':'progress','msg':f'  ✓ MX: {m}'}); await asyncio.sleep(0.08)
    txt=await _run(_dns_q,domain,'TXT')
    spf=[r for r in txt if 'v=spf1' in r]
    if not spf:
        f={'severity':'high','title':'No SPF Record','detail':'Domain can be spoofed. Add SPF with -all.'}
        findings.append(f); yield _e({'type':'finding','finding':f})
    else:
        s=spf[0]; yield _e({'type':'progress','msg':f'  ✓ SPF: {s[:60]}'})
        if '~all' in s:
            f={'severity':'medium','title':'SPF SoftFail','detail':'Upgrade to -all.'}; findings.append(f); yield _e({'type':'finding','finding':f})
    dt=await _run(_dns_q,f'_dmarc.{domain}','TXT')
    dm=next((r for r in dt if 'v=DMARC1' in r),None)
    if not dm:
        f={'severity':'high','title':'No DMARC','detail':f'Add: v=DMARC1; p=reject; rua=mailto:dmarc@{domain}'}
        findings.append(f); yield _e({'type':'finding','finding':f})
    else:
        yield _e({'type':'progress','msg':f'  ✓ DMARC: {dm[:60]}'})
        if 'p=none' in dm:
            f={'severity':'high','title':'DMARC p=none','detail':'Upgrade to p=reject.'}; findings.append(f); yield _e({'type':'finding','finding':f})
    found_dkim=[]
    for sel in DKIM_S:
        r=await _run(_dns_q,f'{sel}._domainkey.{domain}','TXT')
        if any('p=' in x for x in r): found_dkim.append(sel)
        await asyncio.sleep(0.06)
    if not found_dkim:
        f={'severity':'high','title':'No DKIM','detail':'Configure DKIM with your mail provider.'}
        findings.append(f); yield _e({'type':'finding','finding':f})
    else: yield _e({'type':'progress','msg':f'  ✓ DKIM: {", ".join(found_dkim)}'})
    jid=_jid(); hi=sum(1 for f in findings if f['severity']=='high')
    yield _e({'type':'done','job_id':jid,'total':len(findings),'high':hi,'medium':0,'low':0})

async def _scan_ssl(target):
    h=_host(target); findings=[]
    yield await _p(f'TLS handshake with {h}...',0.2)
    info=await _run(_ssl_info,h)
    if 'error' in info: yield _e({'type':'error','msg':info['error']}); return
    yield _e({'type':'progress','msg':f"✓ {info['ver']} · {info['cipher']} ({info['bits']}-bit)"})
    yield _e({'type':'progress','msg':f"  CN: {info['cn']}  SANs: {len(info['san'])}"})
    import datetime
    if info.get('expiry'):
        try:
            exp=datetime.datetime.strptime(info['expiry'],'%b %d %H:%M:%S %Y %Z')
            days=(exp-datetime.datetime.utcnow()).days
            if days<30:
                f={'severity':'high' if days<14 else 'medium','title':f'Cert expires in {days}d','detail':str(exp.date())}
                findings.append(f); yield _e({'type':'finding','finding':f})
            else: yield _e({'type':'progress','msg':f'  ✓ Cert valid {days}d'})
        except: pass
    V=ssl.TLSVersion
    for name,mv,xv,sev in [
        ('TLS 1.3',getattr(V,'TLSv1_3',None),getattr(V,'TLSv1_3',None),None),
        ('TLS 1.2',getattr(V,'TLSv1_2',None),getattr(V,'TLSv1_2',None),None),
        ('TLS 1.1',getattr(V,'TLSv1_1',None),getattr(V,'TLSv1_1',None),'high'),
        ('TLS 1.0',getattr(V,'TLSv1',None),getattr(V,'TLSv1',None),'high'),
    ]:
        if mv is None: continue
        try:
            ctx=ssl.SSLContext(ssl.PROTOCOL_TLS_CLIENT); ctx.check_hostname=False; ctx.verify_mode=ssl.CERT_NONE
            ctx.minimum_version=mv; ctx.maximum_version=xv
            ok=await _run(lambda: __import__('contextlib').suppress(Exception)().__enter__() or True)
            with socket.create_connection((h,443),timeout=4) as s2:
                try: ctx.wrap_socket(s2,server_hostname=h).close(); ok=True
                except: ok=False
        except: ok=False
        await asyncio.sleep(0.2)
        if ok and sev:
            f={'severity':sev,'title':f'{name} Offered (Deprecated)','detail':'Disable via server config.'}
            findings.append(f); yield _e({'type':'finding','finding':f})
        elif ok: yield _e({'type':'progress','msg':f'  ✓ {name}'})
        elif not sev: yield _e({'type':'progress','msg':f'  · {name} not offered'})
        else: yield _e({'type':'progress','msg':f'  ✓ {name} disabled'})
    jid=_jid(); hi=sum(1 for f in findings if f['severity']=='high')
    yield _e({'type':'done','job_id':jid,'total':len(findings),'high':hi,'medium':0,'low':0})

async def _scan_dns(target):
    domain=_host(target); findings=[]
    yield await _p(f'DNS audit for {domain}...',0.2)
    ns=await _run(_dns_q,domain,'NS')
    if not ns:
        f={'severity':'high','title':'No NS Records','detail':f'No nameservers for {domain}.'}
        findings.append(f); yield _e({'type':'finding','finding':f})
    else:
        yield _e({'type':'progress','msg':f'  ✓ NS: {", ".join(ns[:3])}'})
        if len(ns)<2:
            f={'severity':'medium','title':'Single Nameserver','detail':'Add secondary NS.'}
            findings.append(f); yield _e({'type':'finding','finding':f})
    xfr=False
    if DNS and ns:
        for s in ns[:2]:
            try:
                z=_zone.from_xfr(_dq.xfr(s.rstrip('.'),domain,timeout=5))
                if z: xfr=True; f={'severity':'high','title':f'Zone Transfer ALLOWED via {s}','detail':'Restrict AXFR immediately.'}; findings.append(f); yield _e({'type':'finding','finding':f}); break
            except: pass
    if not xfr: yield _e({'type':'progress','msg':'  ✓ Zone transfer blocked'})
    dk=await _run(_dns_q,domain,'DNSKEY')
    if dk: yield _e({'type':'progress','msg':f'  ✓ DNSSEC: {len(dk)} key(s)'})
    else:
        f={'severity':'medium','title':'DNSSEC not configured','detail':'Enable via registrar.'}
        findings.append(f); yield _e({'type':'finding','finding':f})
    caa=await _run(_dns_q,domain,'CAA')
    if caa: yield _e({'type':'progress','msg':f'  ✓ CAA: {caa[0]}'})
    else:
        f={'severity':'low','title':'No CAA records','detail':'Add CAA to restrict certificate issuance.'}
        findings.append(f); yield _e({'type':'finding','finding':f})
    probe=f'nexus-{uuid.uuid4().hex[:6]}'
    try:
        wip=await _run(socket.gethostbyname,f'{probe}.{domain}')
        f={'severity':'medium','title':f'Wildcard DNS → {wip}','detail':'Can mask subdomain takeover.'}
        findings.append(f); yield _e({'type':'finding','finding':f})
    except socket.gaierror: yield _e({'type':'progress','msg':'  ✓ No wildcard DNS'})
    jid=_jid(); hi=sum(1 for f in findings if f['severity']=='high')
    yield _e({'type':'done','job_id':jid,'total':len(findings),'high':hi,'medium':0,'low':0})

async def _scan_tech(target):
    h=_host(target); findings=[]
    yield await _p(f'Fetching {h}...',0.2)
    status,hdrs,body=await _run(_http,f'https://{h}')
    if status is None: status,hdrs,body=await _run(_http,f'http://{h}')
    if not status: yield _e({'type':'error','msg':'Unreachable'}); return
    yield _e({'type':'progress','msg':f'✓ HTTP {status} — {len(body)}b'})
    all_=(' '.join(f'{k}:{v}' for k,v in hdrs.items())+body).lower()
    for h2 in ('server','x-powered-by'):
        if v:=hdrs.get(h2,''):
            ver=re.search(r'[\d.]{3,}',v)
            f={'severity':'medium' if ver else 'info','title':f'{h2}: {v[:50]}','detail':'Version disclosed.' if ver else 'Suppress.'}
            findings.append(f); yield _e({'type':'finding','finding':f})
    seen=set()
    for pattern,tech,cat in TECH_S:
        if tech in seen: continue
        m=re.search(pattern,all_,re.I)
        if m:
            seen.add(tech); ver=m.group(1) if m.lastindex and m.lastindex>=1 else ''
            f={'severity':'medium' if ver else 'info','title':f'Detected: {tech} {ver} [{cat}]'.strip(),
               'detail':'Version exposed.' if ver else 'Identified.'}
            findings.append(f); yield _e({'type':'finding','finding':f})
        await asyncio.sleep(0.05)
    gm=re.search(r"<meta[^>]+name=[\"']generator[\"'][^>]+content=[\"']([^\"']+)[\"']",body,re.I)
    if gm:
        f={'severity':'medium','title':f'Generator tag: {gm.group(1)}','detail':'Remove <meta generator>.'}
        findings.append(f); yield _e({'type':'finding','finding':f})
    jid=_jid(); hi=sum(1 for f in findings if f['severity']=='high')
    yield _e({'type':'done','job_id':jid,'total':len(findings),'high':hi,'medium':0,'low':0,'techs':len(seen)})

SCANNERS = {
    'web-security':     _scan_web,
    'network':          _scan_network,
    'email-security':   _scan_email,
    'ssl-tls':          _scan_ssl,
    'dns-security':     _scan_dns,
    'tech-fingerprint': _scan_tech,
}

@router.get('/history')
def scan_history(db: Session = Depends(get_db), uid=Depends(require_admin)):
    rows=db.query(ScanResult).order_by(ScanResult.created_at.desc()).limit(50).all()
    return [{'id':r.id,'service':r.service,'target':r.target,'findings':r.findings,
             'high':r.high,'medium':r.medium,'created_at':r.created_at} for r in rows]

@router.get('/{slug}')
async def run_scan(slug: str, target: str = '', uid=Depends(require_admin), db: Session = Depends(get_db)):
    if slug not in SCANNERS: raise HTTPException(404, f'Unknown scan: {slug}')
    if not target.strip(): raise HTTPException(400, 'target required')
    findings_acc = []; done_data = {}

    async def stream():
        nonlocal findings_acc, done_data
        try:
            async for line in SCANNERS[slug](target.strip()):
                yield line
                try:
                    d = json.loads(line.removeprefix('data: ').strip())
                    if d.get('type') == 'finding': findings_acc.append(d['finding'])
                    if d.get('type') == 'done': done_data = d
                except: pass
        except Exception:
            log.exception('scan error slug=%s',slug)
            yield _e({'type':'error','msg':'Internal error'})
        finally:
            if done_data:
                sr=ScanResult(service=slug,target=target.strip(),
                              job_id=done_data.get('job_id',''),
                              findings=done_data.get('total',0),
                              high=done_data.get('high',0),
                              medium=done_data.get('medium',0),
                              raw=json.dumps(findings_acc[:50]))
                s2=Session(); s2.add(sr); s2.add(AuditLog(action='RUN_SCAN',entity='Scan',detail=f'{slug}:{target}')); s2.commit(); s2.close()

    return StreamingResponse(stream(), media_type='text/event-stream',
                             headers={'Cache-Control':'no-cache','X-Accel-Buffering':'no'})
