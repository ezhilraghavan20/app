import time
from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel
from sqlalchemy.orm import Session
from typing import Optional
from database.db import get_db
from database.models import Incident, AuditLog
from .auth import require_admin

router = APIRouter(prefix='/api/incidents', tags=['incidents'])

class IncidentIn(BaseModel):
    title: str; severity: str = 'Medium'; category: str = 'Security'
    description: str = ''; assigned_to: str = ''; status: str = 'Open'

@router.get('')
def list_incidents(db: Session = Depends(get_db), uid=Depends(require_admin)):
    rows = db.query(Incident).order_by(Incident.created_at.desc()).all()
    return [{'id':r.id,'title':r.title,'severity':r.severity,'category':r.category,
             'description':r.description,'status':r.status,'detected_at':r.detected_at,
             'resolved_at':r.resolved_at,'assigned_to':r.assigned_to} for r in rows]

@router.post('')
def create_incident(body: IncidentIn, db: Session = Depends(get_db), uid=Depends(require_admin)):
    inc = Incident(**body.model_dump())
    db.add(inc); db.flush()
    db.add(AuditLog(action='CREATE_INCIDENT', entity='Incident', entity_id=inc.id, detail=body.title))
    return {'id': inc.id}

@router.patch('/{iid}')
def update_incident(iid: str, body: dict, db: Session = Depends(get_db), uid=Depends(require_admin)):
    inc = db.query(Incident).filter(Incident.id == iid).first()
    if not inc: raise HTTPException(404, 'Not found')
    if body.get('status') == 'Resolved' and not inc.resolved_at:
        inc.resolved_at = int(time.time())
    for k,v in body.items():
        if hasattr(inc,k): setattr(inc,k,v)
    db.add(AuditLog(action='UPDATE_INCIDENT', entity='Incident', entity_id=iid, detail=str(body)))
    return {'ok': True}

@router.delete('/{iid}')
def delete_incident(iid: str, db: Session = Depends(get_db), uid=Depends(require_admin)):
    inc = db.query(Incident).filter(Incident.id == iid).first()
    if not inc: raise HTTPException(404, 'Not found')
    db.delete(inc); db.add(AuditLog(action='DELETE_INCIDENT', entity='Incident', entity_id=iid))
    return {'ok': True}
