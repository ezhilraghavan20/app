"""Optional: seeds demo data so the dashboard looks populated on first run."""
import sys, os, time
from pathlib import Path
sys.path.insert(0, str(Path(__file__).parent))
from dotenv import load_dotenv
load_dotenv(Path(__file__).parent / '.env')
from database.db import init_db, Session
from database.models import Director, Risk, Incident, Meeting, Resolution

init_db()
db = Session()

def add(**kw): return kw

now = int(time.time())
DAY = 86400

# Directors
if db.query(Director).count() == 0:
    for d in [
        dict(name='Alexandra Reid',    role='Chairman',                   department='Executive',          email='a.reid@nexus.corp',    tenure_yr=8),
        dict(name='James Thornton',    role='Chief Executive Officer',    department='Executive',          email='j.thornton@nexus.corp', tenure_yr=5),
        dict(name='Sarah Chen',        role='Chief Financial Officer',    department='Finance',            email='s.chen@nexus.corp',    tenure_yr=4),
        dict(name='Marcus Webb',       role='Chief Technology Officer',   department='Technology',         email='m.webb@nexus.corp',    tenure_yr=3),
        dict(name='Priya Sharma',      role='Chief Security Officer',     department='Technology',         email='p.sharma@nexus.corp',  tenure_yr=2),
        dict(name='David Okafor',      role='Independent Director',       department='Risk Management',   email='d.okafor@nexus.corp',  tenure_yr=6),
        dict(name='Elena Vasquez',     role='Non-Executive Director',     department='Legal & Compliance', email='e.vasquez@nexus.corp', tenure_yr=4),
    ]:
        db.add(Director(**d))
    print("✓ Directors seeded")

# Risks
if db.query(Risk).count() == 0:
    for r in [
        dict(title='Ransomware attack on core infrastructure', category='Cyber',         likelihood=4, impact=5, owner='CSO',        status='Open',      mitigation='EDR deployed, offline backups, IR plan in place'),
        dict(title='Regulatory non-compliance (GDPR breach)', category='Regulatory',     likelihood=3, impact=5, owner='Legal',       status='Open',      mitigation='DPO appointed, DPIA in progress'),
        dict(title='Key person dependency — CTO',             category='Operational',    likelihood=3, impact=4, owner='CEO',         status='Open',      mitigation='Knowledge transfer programme initiated'),
        dict(title='Third-party vendor data exposure',        category='Cyber',         likelihood=3, impact=4, owner='CSO',        status='Mitigated', mitigation='Vendor security assessments completed'),
        dict(title='Market volatility impact on revenue',     category='Financial',      likelihood=4, impact=3, owner='CFO',         status='Accepted',  mitigation='Hedging strategy in place'),
        dict(title='Cloud provider outage (single region)',   category='Operational',    likelihood=2, impact=4, owner='CTO',         status='Open',      mitigation='Multi-region failover being implemented'),
        dict(title='Insider threat — privileged access',      category='Cyber',         likelihood=2, impact=5, owner='CSO',        status='Open',      mitigation='PAM tool deployed, access reviews quarterly'),
        dict(title='Reputational damage from media incident', category='Reputational',   likelihood=2, impact=4, owner='CEO',         status='Open',      mitigation='Crisis communications plan updated'),
    ]:
        db.add(Risk(**r))
    print("✓ Risks seeded")

# Incidents
if db.query(Incident).count() == 0:
    for i in [
        dict(title='Phishing campaign targeting finance team',   severity='High',     category='Security',    status='Investigating', description='Sophisticated spear-phishing emails impersonating CFO. 3 staff clicked links.', assigned_to='p.sharma@nexus.corp', detected_at=now-2*DAY),
        dict(title='Unauthorised login attempt — admin portal',  severity='Critical', category='Security',    status='Open',          description='Multiple failed login attempts from Eastern European IPs.', assigned_to='p.sharma@nexus.corp', detected_at=now-DAY//2),
        dict(title='SSL certificate expiring in 12 days',        severity='Medium',   category='Operational', status='Open',          description='Production wildcard certificate *.nexus.corp expires in 12 days.', assigned_to='m.webb@nexus.corp', detected_at=now-3*DAY),
        dict(title='Vendor API key exposed in public repo',      severity='High',     category='Data',        status='Contained',     description='API key committed to public GitHub repo. Key rotated immediately.', assigned_to='m.webb@nexus.corp', detected_at=now-7*DAY),
        dict(title='DDoS probe detected on edge nodes',          severity='Low',      category='Security',    status='Resolved',      description='Brief DDoS probe mitigated by Cloudflare. No impact.', assigned_to='m.webb@nexus.corp', detected_at=now-14*DAY, resolved_at=now-13*DAY),
    ]:
        db.add(Incident(**i))
    print("✓ Incidents seeded")

# Meetings
if db.query(Meeting).count() == 0:
    m1 = Meeting(title='Q4 Board Review — Strategy & Security', date_ts=now+7*DAY, location='Boardroom A, HQ',
                 agenda='1. Q3 financial results\n2. Security posture review\n3. Risk register update\n4. Q4 strategy approval\n5. AOB',
                 status='Scheduled')
    m2 = Meeting(title='Emergency Security Briefing', date_ts=now+2*DAY, location='Virtual (Teams)',
                 agenda='1. Ransomware threat intelligence update\n2. Incident response status\n3. Board sign-off on emergency budget',
                 status='Scheduled')
    m3 = Meeting(title='Q3 Audit Committee', date_ts=now-30*DAY, location='Boardroom B, HQ',
                 agenda='1. Q3 audit findings\n2. Compliance status\n3. Internal controls review',
                 status='Completed', minutes='Meeting convened at 14:00. All committee members present. Q3 audit findings reviewed and accepted. Two minor findings escalated for remediation. Controls deemed adequate. Meeting closed 16:30.')
    db.add(m1); db.add(m2); db.add(m3); db.flush()
    # Add a resolution to the completed meeting
    res = Resolution(meeting_id=m3.id, title='Accept Q3 Audit Report', description='Board to formally accept the Q3 internal audit report and approve remediation timeline.',
                     vote_for=6, vote_against=0, vote_abstain=1, status='Passed')
    db.add(res)
    print("✓ Meetings + resolutions seeded")

db.commit()
db.close()
print("\n✅ Seed complete — start the backend and log in to see the demo data.")
