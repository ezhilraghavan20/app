import hmac, os, time
from typing import Optional
import jwt
_ALGO='HS256'; _TTL=3600
def _secret():
    v=os.environ.get('JWT_SECRET','')
    if not v: raise RuntimeError('JWT_SECRET not set')
    return v
def check_credentials(u:str, p:str)->bool:
    eu=os.environ.get('ADMIN_USERNAME','admin')
    ep=os.environ.get('ADMIN_PASSWORD','')
    return bool(ep) and hmac.compare_digest(u.strip(),eu) and hmac.compare_digest(p,ep)
def make_token()->str:
    n=int(time.time())
    return jwt.encode({'sub':'admin','iat':n,'exp':n+_TTL},_secret(),algorithm=_ALGO)
def verify_token(tok:str)->Optional[str]:
    try: return jwt.decode(tok,_secret(),algorithms=[_ALGO]).get('sub')
    except jwt.PyJWTError: return None
