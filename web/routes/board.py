import time
from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel
from sqlalchemy.orm import Session
from typing import Optional
from database.db import get_db
from database.models import Meeting, Resolution, AuditLog
from .auth import require_admin

router = APIRouter(prefix='/api/board', tags=['board'])

# ── Meetings ──
class MeetingIn(BaseModel):
    title: str; date_ts: int; location: str = 'Virtual'; agenda: str = ''

@router.get('/meetings')
def list_meetings(db: Session = Depends(get_db), uid=Depends(require_admin)):
    rows = db.query(Meeting).order_by(Meeting.date_ts.desc()).all()
    return [{'id':r.id,'title':r.title,'date_ts':r.date_ts,'location':r.location,
             'status':r.status,'agenda':r.agenda,'minutes':r.minutes} for r in rows]

@router.post('/meetings')
def create_meeting(body: MeetingIn, db: Session = Depends(get_db), uid=Depends(require_admin)):
    m = Meeting(title=body.title, date_ts=body.date_ts, location=body.location, agenda=body.agenda)
    db.add(m)
    db.add(AuditLog(action='CREATE_MEETING', entity='Meeting', entity_id=m.id,
                    detail=f'Created: {body.title}'))
    db.flush(); return {'id': m.id}

@router.patch('/meetings/{mid}')
def update_meeting(mid: str, body: dict, db: Session = Depends(get_db), uid=Depends(require_admin)):
    m = db.query(Meeting).filter(Meeting.id == mid).first()
    if not m: raise HTTPException(404, 'Not found')
    for k, v in body.items():
        if hasattr(m, k): setattr(m, k, v)
    db.add(AuditLog(action='UPDATE_MEETING', entity='Meeting', entity_id=mid, detail=str(body)))
    return {'ok': True}

@router.delete('/meetings/{mid}')
def delete_meeting(mid: str, db: Session = Depends(get_db), uid=Depends(require_admin)):
    m = db.query(Meeting).filter(Meeting.id == mid).first()
    if not m: raise HTTPException(404, 'Not found')
    db.delete(m); db.add(AuditLog(action='DELETE_MEETING', entity='Meeting', entity_id=mid))
    return {'ok': True}

# ── Resolutions ──
class ResolutionIn(BaseModel):
    meeting_id: str; title: str; description: str = ''

class VoteIn(BaseModel):
    vote_for: int = 0; vote_against: int = 0; vote_abstain: int = 0

@router.get('/resolutions/{meeting_id}')
def list_resolutions(meeting_id: str, db: Session = Depends(get_db), uid=Depends(require_admin)):
    rows = db.query(Resolution).filter(Resolution.meeting_id == meeting_id).all()
    return [{'id':r.id,'title':r.title,'description':r.description,'vote_for':r.vote_for,
             'vote_against':r.vote_against,'vote_abstain':r.vote_abstain,'status':r.status} for r in rows]

@router.post('/resolutions')
def create_resolution(body: ResolutionIn, db: Session = Depends(get_db), uid=Depends(require_admin)):
    r = Resolution(meeting_id=body.meeting_id, title=body.title, description=body.description)
    db.add(r); db.flush()
    db.add(AuditLog(action='CREATE_RESOLUTION', entity='Resolution', entity_id=r.id, detail=body.title))
    return {'id': r.id}

@router.post('/resolutions/{rid}/vote')
def vote_resolution(rid: str, body: VoteIn, db: Session = Depends(get_db), uid=Depends(require_admin)):
    r = db.query(Resolution).filter(Resolution.id == rid).first()
    if not r: raise HTTPException(404, 'Not found')
    r.vote_for = body.vote_for; r.vote_against = body.vote_against; r.vote_abstain = body.vote_abstain
    r.status = 'Passed' if body.vote_for > body.vote_against else ('Rejected' if body.vote_against > body.vote_for else 'Deferred')
    db.add(AuditLog(action='VOTE_RESOLUTION', entity='Resolution', entity_id=rid,
                    detail=f'For:{body.vote_for} Against:{body.vote_against} Abstain:{body.vote_abstain} → {r.status}'))
    return {'status': r.status}
