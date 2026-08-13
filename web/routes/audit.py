from fastapi import APIRouter, Depends, Query
from sqlalchemy.orm import Session
from database.db import get_db
from database.models import AuditLog
from .auth import require_admin

router = APIRouter(prefix='/api/audit', tags=['audit'])

@router.get('')
def list_audit(limit: int = Query(100, le=500), offset: int = 0,
               db: Session = Depends(get_db), uid=Depends(require_admin)):
    total = db.query(AuditLog).count()
    rows  = db.query(AuditLog).order_by(AuditLog.created_at.desc()).offset(offset).limit(limit).all()
    return {
        'total': total,
        'items': [{'id':r.id,'action':r.action,'entity':r.entity,'entity_id':r.entity_id,
                   'actor':r.actor,'detail':r.detail,'created_at':r.created_at} for r in rows]
    }
