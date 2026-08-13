import time, uuid
from sqlalchemy import Boolean, Column, Float, ForeignKey, Integer, String, Text
from .db import Base

def _uid(): return uuid.uuid4().hex
def _now(): return int(time.time())

class Director(Base):
    __tablename__ = 'directors'
    id         = Column(String, primary_key=True, default=_uid)
    name       = Column(String, nullable=False)
    role       = Column(String, default='Non-Executive Director')
    department = Column(String, default='')
    email      = Column(String, default='')
    tenure_yr  = Column(Integer, default=0)
    is_active  = Column(Boolean, default=True)
    created_at = Column(Integer, default=_now)

class Meeting(Base):
    __tablename__ = 'meetings'
    id         = Column(String, primary_key=True, default=_uid)
    title      = Column(String, nullable=False)
    date_ts    = Column(Integer, nullable=False)
    location   = Column(String, default='Virtual')
    agenda     = Column(Text, default='')
    minutes    = Column(Text, default='')
    status     = Column(String, default='Scheduled')  # Scheduled|InProgress|Completed|Cancelled
    created_at = Column(Integer, default=_now)

class Resolution(Base):
    __tablename__ = 'resolutions'
    id          = Column(String, primary_key=True, default=_uid)
    meeting_id  = Column(String, ForeignKey('meetings.id'), nullable=False)
    title       = Column(String, nullable=False)
    description = Column(Text, default='')
    vote_for    = Column(Integer, default=0)
    vote_against= Column(Integer, default=0)
    vote_abstain= Column(Integer, default=0)
    status      = Column(String, default='Pending')   # Pending|Passed|Rejected|Deferred
    created_at  = Column(Integer, default=_now)

class Risk(Base):
    __tablename__ = 'risks'
    id          = Column(String, primary_key=True, default=_uid)
    title       = Column(String, nullable=False)
    category    = Column(String, default='Operational')  # Operational|Financial|Regulatory|Cyber|Reputational|Strategic
    likelihood  = Column(Integer, default=3)   # 1-5
    impact      = Column(Integer, default=3)   # 1-5
    owner       = Column(String, default='')
    mitigation  = Column(Text, default='')
    status      = Column(String, default='Open')  # Open|Mitigated|Accepted|Closed
    created_at  = Column(Integer, default=_now)
    updated_at  = Column(Integer, default=_now)

class Incident(Base):
    __tablename__ = 'incidents'
    id           = Column(String, primary_key=True, default=_uid)
    title        = Column(String, nullable=False)
    severity     = Column(String, default='Medium')  # Critical|High|Medium|Low
    category     = Column(String, default='Security') # Security|Compliance|Operational|Data
    description  = Column(Text, default='')
    status       = Column(String, default='Open')    # Open|Investigating|Contained|Resolved
    detected_at  = Column(Integer, default=_now)
    resolved_at  = Column(Integer, nullable=True)
    assigned_to  = Column(String, default='')
    created_at   = Column(Integer, default=_now)

class ScanResult(Base):
    __tablename__ = 'scan_results'
    id         = Column(String, primary_key=True, default=_uid)
    service    = Column(String, nullable=False)
    target     = Column(String, nullable=False)
    job_id     = Column(String, default='')
    findings   = Column(Integer, default=0)
    high       = Column(Integer, default=0)
    medium     = Column(Integer, default=0)
    low        = Column(Integer, default=0)
    info_count = Column(Integer, default=0)
    raw        = Column(Text, default='')
    created_at = Column(Integer, default=_now)

class AuditLog(Base):
    __tablename__ = 'audit_logs'
    id         = Column(String, primary_key=True, default=_uid)
    action     = Column(String, nullable=False)
    entity     = Column(String, default='')
    entity_id  = Column(String, default='')
    actor      = Column(String, default='admin')
    detail     = Column(Text, default='')
    ip         = Column(String, default='')
    created_at = Column(Integer, default=_now)
