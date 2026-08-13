from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel
from sqlalchemy.orm import Session
from database.db import get_db
from database.models import Director, AuditLog
from .auth import require_admin

router = APIRouter(prefix='/api/directors', tags=['directors'])

class DirectorIn(BaseModel):
    name: str; role: str = 'Non-Executive Director'; department: str = ''
    email: str = ''; tenure_yr: int = 0

@router.get('')
def list_directors(db: Session = Depends(get_db), uid=Depends(require_admin)):
    rows = db.query(Director).filter(Director.is_active == True).order_by(Director.name).all()
    return [{'id':r.id,'name':r.name,'role':r.role,'department':r.department,
             'email':r.email,'tenure_yr':r.tenure_yr} for r in rows]

@router.post('')
def create_director(body: DirectorIn, db: Session = Depends(get_db), uid=Depends(require_admin)):
    d = Director(**body.model_dump())
    db.add(d); db.flush()
    db.add(AuditLog(action='CREATE_DIRECTOR', entity='Director', entity_id=d.id, detail=body.name))
    return {'id': d.id}

@router.patch('/{did}')
def update_director(did: str, body: dict, db: Session = Depends(get_db), uid=Depends(require_admin)):
    d = db.query(Director).filter(Director.id == did).first()
    if not d: raise HTTPException(404, 'Not found')
    for k,v in body.items():
        if hasattr(d,k): setattr(d,k,v)
    db.add(AuditLog(action='UPDATE_DIRECTOR', entity='Director', entity_id=did))
    return {'ok': True}

@router.delete('/{did}')
def delete_director(did: str, db: Session = Depends(get_db), uid=Depends(require_admin)):
    d = db.query(Director).filter(Director.id == did).first()
    if not d: raise HTTPException(404, 'Not found')
    d.is_active = False
    db.add(AuditLog(action='REMOVE_DIRECTOR', entity='Director', entity_id=did, detail=d.name))
    return {'ok': True}
