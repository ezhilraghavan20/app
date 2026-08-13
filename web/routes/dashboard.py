import time
from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from sqlalchemy import func
from database.db import get_db
from database.models import Risk, Incident, Meeting, ScanResult, Resolution
from .auth import require_admin

router = APIRouter(prefix='/api/dashboard', tags=['dashboard'])

@router.get('/summary')
def summary(db: Session = Depends(get_db), uid: str = Depends(require_admin)):
    now = int(time.time())
    open_risks       = db.query(Risk).filter(Risk.status == 'Open').count()
    critical_risks   = db.query(Risk).filter(Risk.status == 'Open', Risk.likelihood * Risk.impact >= 15).count()
    open_incidents   = db.query(Incident).filter(Incident.status.in_(['Open','Investigating'])).count()
    critical_inc     = db.query(Incident).filter(Incident.status.in_(['Open','Investigating']), Incident.severity == 'Critical').count()
    upcoming_mtgs    = db.query(Meeting).filter(Meeting.date_ts > now, Meeting.status == 'Scheduled').count()
    total_scans      = db.query(ScanResult).count()
    recent_findings  = db.query(func.sum(ScanResult.high)).scalar() or 0
    risk_rows        = db.query(Risk).filter(Risk.status == 'Open').all()
    heat = [[0]*5 for _ in range(5)]
    for r in risk_rows:
        heat[r.impact-1][r.likelihood-1] += 1
    # Security score: start 100, deduct per finding
    score = max(0, 100 - (critical_inc * 15) - (open_incidents * 5) - (critical_risks * 10) - (open_risks * 2) - (int(recent_findings) * 3))
    recent_incidents = [{
        'id':i.id,'title':i.title,'severity':i.severity,'status':i.status,'detected_at':i.detected_at
    } for i in db.query(Incident).order_by(Incident.created_at.desc()).limit(5).all()]
    upcoming = [{
        'id':m.id,'title':m.title,'date_ts':m.date_ts,'status':m.status,'location':m.location
    } for m in db.query(Meeting).filter(Meeting.date_ts > now).order_by(Meeting.date_ts).limit(5).all()]
    return {
        'security_score': score,
        'open_risks': open_risks,
        'critical_risks': critical_risks,
        'open_incidents': open_incidents,
        'critical_incidents': critical_inc,
        'upcoming_meetings': upcoming_mtgs,
        'total_scans': total_scans,
        'risk_heat_map': heat,
        'recent_incidents': recent_incidents,
        'upcoming_meetings_list': upcoming,
    }
