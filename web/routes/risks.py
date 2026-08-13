import time
from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel
from sqlalchemy.orm import Session
from database.db import get_db
from database.models import Risk, AuditLog
from .auth import require_admin

router = APIRouter(prefix='/api/risks', tags=['risks'])

class RiskIn(BaseModel):
    title: str; category: str = 'Operational'; likelihood: int = 3; impact: int = 3
    owner: str = ''; mitigation: str = ''; status: str = 'Open'

@router.get('')
def list_risks(db: Session = Depends(get_db), uid=Depends(require_admin)):
    rows = db.query(Risk).order_by(Risk.created_at.desc()).all()
    return [{'id':r.id,'title':r.title,'category':r.category,'likelihood':r.likelihood,
             'impact':r.impact,'score':r.likelihood*r.impact,'owner':r.owner,
             'mitigation':r.mitigation,'status':r.status,'created_at':r.created_at} for r in rows]

@router.post('')
def create_risk(body: RiskIn, db: Session = Depends(get_db), uid=Depends(require_admin)):
    r = Risk(**body.model_dump())
    db.add(r); db.flush()
    db.add(AuditLog(action='CREATE_RISK', entity='Risk', entity_id=r.id, detail=body.title))
    return {'id': r.id}

@router.patch('/{rid}')
def update_risk(rid: str, body: dict, db: Session = Depends(get_db), uid=Depends(require_admin)):
    r = db.query(Risk).filter(Risk.id == rid).first()
    if not r: raise HTTPException(404, 'Not found')
    for k,v in body.items():
        if hasattr(r,k): setattr(r,k,v)
    r.updated_at = int(time.time())
    db.add(AuditLog(action='UPDATE_RISK', entity='Risk', entity_id=rid, detail=str(body)))
    return {'ok': True}

@router.delete('/{rid}')
def delete_risk(rid: str, db: Session = Depends(get_db), uid=Depends(require_admin)):
    r = db.query(Risk).filter(Risk.id == rid).first()
    if not r: raise HTTPException(404, 'Not found')
    db.delete(r); db.add(AuditLog(action='DELETE_RISK', entity='Risk', entity_id=rid))
    return {'ok': True}
