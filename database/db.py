import os
from sqlalchemy import create_engine
from sqlalchemy.orm import DeclarativeBase, sessionmaker
URL = os.environ.get('DATABASE_URL','sqlite:///./nexus.db')
_kw = {'check_same_thread':False} if URL.startswith('sqlite') else {}
engine = create_engine(URL, connect_args=_kw, future=True)
Session = sessionmaker(bind=engine, autoflush=False, autocommit=False, future=True)
class Base(DeclarativeBase): pass
def init_db():
    from . import models  # noqa
    Base.metadata.create_all(engine)
def get_db():
    db = Session()
    try: yield db; db.commit()
    except: db.rollback(); raise
    finally: db.close()
