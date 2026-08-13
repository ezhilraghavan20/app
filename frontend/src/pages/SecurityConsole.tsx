import { useEffect, useRef, useState } from 'react'
import { Play, Square, ChevronDown, Globe, Network, Mail, Lock, Layers, Cpu, AlertTriangle, CheckCircle2, Info, Clock } from 'lucide-react'
import api, { getToken } from '../api'

const SCANS = [
  { slug:'web-security',     label:'Web Security Scan',       icon:Globe,   desc:'Headers, paths, SSL, disclosure' },
  { slug:'network',          label:'Port & Service Scan',      icon:Network, desc:'18 ports parallel + banners' },
  { slug:'email-security',   label:'Email Security',           icon:Mail,    desc:'SPF, DMARC, DKIM audit' },
  { slug:'ssl-tls',          label:'SSL / TLS Inspector',      icon:Lock,    desc:'Certs, protocols, ciphers, HSTS' },
  { slug:'dns-security',     label:'DNS Security Audit',       icon:Layers,  desc:'DNSSEC, AXFR, CAA, wildcard' },
  { slug:'tech-fingerprint', label:'Technology Fingerprinting',icon:Cpu,     desc:'Stack, CMS, frameworks, CDN' },
]

interface Finding { severity:string;title:string;detail:string }
interface LogLine  { type:string;msg?:string;finding?:Finding;job_id?:string;total?:number;high?:number;medium?:number;low?:number }
interface ScanHist { id:string;service:string;target:string;findings:number;high:number;medium:number;created_at:number }

const SEV_C: Record<string,string> = { high:'sev-high',medium:'sev-medium',low:'sev-low',info:'sev-info',critical:'sev-critical' }
const SEV_IC: Record<string,React.ReactNode> = {
  high:<AlertTriangle className="w-3.5 h-3.5 text-orange-400" />,
  medium:<AlertTriangle className="w-3.5 h-3.5 text-yellow-400" />,
  low:<Info className="w-3.5 h-3.5 text-blue-400" />,
  info:<Info className="w-3.5 h-3.5 text-blue-400" />,
  critical:<AlertTriangle className="w-3.5 h-3.5 text-red-400" />,
}

export default function SecurityConsole() {
  const [slug, setSlug] = useState('web-security')
  const [target, setTarget] = useState('')
  const [status, setStatus] = useState<'idle'|'running'|'done'|'error'>('idle')
  const [lines, setLines] = useState<LogLine[]>([])
  const [findings, setFindings] = useState<Finding[]>([])
  const [doneData, setDoneData] = useState<LogLine|null>(null)
  const [history, setHistory] = useState<ScanHist[]>([])
  const [tab, setTab] = useState<'live'|'history'>('live')
  const logRef = useRef<HTMLDivElement>(null)
  const abortRef = useRef<AbortController|null>(null)

  const loadHistory = () => api.get<ScanHist[]>('/api/scan/history').then(r => setHistory(r.data))
  useEffect(() => { loadHistory() }, [])

  const run = async () => {
    if (!target.trim()) return
    setStatus('running'); setLines([]); setFindings([]); setDoneData(null); setTab('live')
    abortRef.current = new AbortController()
    const base = import.meta.env.VITE_API_URL || 'http://localhost:8000'
    const url = `${base}/api/scan/${slug}?target=${encodeURIComponent(target.trim())}`
    try {
      const res = await fetch(url, { headers:{ Authorization:`Bearer ${getToken()}` }, signal:abortRef.current.signal })
      if (!res.ok) { setStatus('error'); return }
      const reader = res.body!.getReader()
      const dec = new TextDecoder()
      let buf = ''
      while (true) {
        const { value, done } = await reader.read()
        if (done) break
        buf += dec.decode(value, { stream:true })
        const parts = buf.split('\n\n')
        buf = parts.pop() || ''
        for (const part of parts) {
          const line = part.replace(/^data:\s*/,'').trim()
          if (!line) continue
          try {
            const d: LogLine = JSON.parse(line)
            setLines(p => [...p, d])
            if (d.type === 'finding' && d.finding) setFindings(p => [...p, d.finding!])
            if (d.type === 'done') { setDoneData(d); setStatus('done'); loadHistory() }
            if (d.type === 'error') setStatus('error')
          } catch {}
        }
      }
      if (status === 'running') setStatus('done')
    } catch (e: any) {
      if (e?.name !== 'AbortError') setStatus('error')
    }
  }

  const stop = () => { abortRef.current?.abort(); setStatus('idle') }

  useEffect(() => { if (logRef.current) logRef.current.scrollTop = logRef.current.scrollHeight }, [lines])

  const scan = SCANS.find(s => s.slug === slug)!

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-white">Security Console</h1>
        <p className="text-sm text-white/40 mt-0.5">Live scan engines — results stream in real time</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Config panel */}
        <div className="space-y-4">
          <div className="glass-card p-5">
            <h3 className="text-sm font-semibold text-white mb-3">Scan Engine</h3>
            <div className="space-y-2">
              {SCANS.map(s => {
                const Icon = s.icon
                return (
                  <button key={s.slug} onClick={() => setSlug(s.slug)}
                    className={`w-full flex items-center gap-3 p-3 rounded-xl border text-left transition ${slug===s.slug?'bg-gold/12 border-glass-border text-gold':'border-transparent text-white/50 hover:bg-white/4 hover:text-white/70'}`}>
                    <Icon className="w-4 h-4 flex-shrink-0" />
                    <div className="min-w-0">
                      <p className="text-xs font-medium truncate">{s.label}</p>
                      <p className="text-xs text-white/30 truncate">{s.desc}</p>
                    </div>
                  </button>
                )
              })}
            </div>
          </div>

          <div className="glass-card p-5">
            <h3 className="text-sm font-semibold text-white mb-3">Target</h3>
            <input className="nx-input mb-3" placeholder={slug.includes('email')||slug.includes('dns')?'example.com':'example.com or https://...'}
              value={target} onChange={e => setTarget(e.target.value)}
              onKeyDown={e => e.key==='Enter' && status==='idle' && run()} />
            {status === 'running'
              ? <button onClick={stop} className="btn-danger w-full flex items-center justify-center gap-2"><Square className="w-4 h-4" /> Stop Scan</button>
              : <button onClick={run} disabled={!target.trim()}
                  className="btn-gold w-full flex items-center justify-center gap-2 disabled:opacity-40 disabled:cursor-not-allowed">
                  <Play className="w-4 h-4" /> Run {scan.label}
                </button>
            }
          </div>

          {doneData && (
            <div className="glass-card p-5">
              <h3 className="text-sm font-semibold text-white mb-3">Results</h3>
              <div className="grid grid-cols-2 gap-2">
                {[
                  { l:'Total',   v:doneData.total||0,   c:'text-white' },
                  { l:'High',    v:doneData.high||0,    c:'text-orange-400' },
                  { l:'Medium',  v:doneData.medium||0,  c:'text-yellow-400' },
                  { l:'Job ID',  v:doneData.job_id||'', c:'text-gold font-mono text-xs' },
                ].map(({ l,v,c }) => (
                  <div key={l} className="bg-white/4 rounded-xl p-3">
                    <p className="text-xs text-white/40">{l}</p>
                    <p className={`text-lg font-bold ${c}`}>{v}</p>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Output panel */}
        <div className="lg:col-span-2 glass-card flex flex-col overflow-hidden" style={{height:'600px'}}>
          {/* Tabs */}
          <div className="flex border-b border-glass-border/50">
            {[['live','Live Feed'],['history','Scan History']].map(([t,l]) => (
              <button key={t} onClick={() => setTab(t as any)}
                className={`px-5 py-3 text-sm font-medium border-b-2 transition ${tab===t?'border-gold text-gold':'border-transparent text-white/40 hover:text-white/60'}`}>
                {l}
              </button>
            ))}
            <div className="flex-1 flex items-center justify-end px-4">
              {status === 'running' && <span className="flex items-center gap-2 text-xs text-gold"><Clock className="w-3 h-3 animate-spin" /> Scanning...</span>}
              {status === 'done' && <span className="flex items-center gap-2 text-xs text-green-400"><CheckCircle2 className="w-3 h-3" /> Complete</span>}
              {status === 'error' && <span className="text-xs text-red-400">Error occurred</span>}
            </div>
          </div>

          {tab === 'live' && (
            <div ref={logRef} className="flex-1 overflow-y-auto p-4 font-mono text-xs space-y-1">
              {lines.length === 0 && status === 'idle' && (
                <div className="text-white/20 text-center py-16">Configure a target and run a scan</div>
              )}
              {lines.map((l,i) => {
                if (l.type === 'progress') return (
                  <div key={i} className="text-white/50">{l.msg}</div>
                )
                if (l.type === 'finding' && l.finding) return (
                  <div key={i} className={`flex items-start gap-2 p-2 rounded-lg ${
                    l.finding.severity==='high'?'bg-orange-500/8':
                    l.finding.severity==='medium'?'bg-yellow-500/8':
                    l.finding.severity==='critical'?'bg-red-500/10':'bg-blue-500/6'}`}>
                    {SEV_IC[l.finding.severity]||<Info className="w-3.5 h-3.5 text-blue-400" />}
                    <div>
                      <span className={`${SEV_C[l.finding.severity]||'sev-info'} px-1.5 py-0.5 rounded text-xs mr-2`}>{l.finding.severity?.toUpperCase()}</span>
                      <span className="text-white/80">{l.finding.title}</span>
                      {l.finding.detail && <p className="text-white/40 mt-0.5 text-xs">{l.finding.detail}</p>}
                    </div>
                  </div>
                )
                if (l.type === 'done') return (
                  <div key={i} className="border-t border-glass-border/40 pt-2 mt-2 text-green-400">
                    ✓ Scan complete — {l.total} findings (High: {l.high}, Med: {l.medium}) · Job: {l.job_id}
                  </div>
                )
                if (l.type === 'error') return (
                  <div key={i} className="text-red-400">✗ Error: {l.msg}</div>
                )
                return null
              })}
            </div>
          )}

          {tab === 'history' && (
            <div className="flex-1 overflow-y-auto">
              <table className="nx-table">
                <thead><tr><th>Service</th><th>Target</th><th>Findings</th><th>High</th><th>Date</th></tr></thead>
                <tbody>
                  {history.length===0&&<tr><td colSpan={5} className="text-center py-8 text-white/30 text-sm">No scans yet</td></tr>}
                  {history.map(h => (
                    <tr key={h.id}>
                      <td><span className="text-xs text-gold/70 font-mono">{h.service}</span></td>
                      <td><span className="text-xs text-white/70 font-mono">{h.target}</span></td>
                      <td><span className="text-sm font-bold text-white">{h.findings}</span></td>
                      <td><span className={`text-xs font-bold ${h.high>0?'text-orange-400':'text-white/30'}`}>{h.high}</span></td>
                      <td><span className="text-xs text-white/40">{new Date(h.created_at*1000).toLocaleString()}</span></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
