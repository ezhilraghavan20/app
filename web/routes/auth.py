from fastapi import APIRouter, Depends, HTTPException, Request
from pydantic import BaseModel
from auth.admin import check_credentials, make_token, verify_token

router = APIRouter(prefix='/api/auth', tags=['auth'])

def require_admin(request: Request) -> str:
    tok = request.headers.get('Authorization','').removeprefix('Bearer ').strip()
    uid = verify_token(tok)
    if uid != 'admin': raise HTTPException(401, 'Unauthorized')
    return uid

class LoginIn(BaseModel):
    username: str
    password: str

@router.post('/login')
def login(body: LoginIn):
    if not check_credentials(body.username, body.password):
        raise HTTPException(401, 'Invalid credentials')
    return {'access_token': make_token(), 'role': 'admin'}

@router.get('/me')
def me(uid: str = Depends(require_admin)):
    return {'uid': uid, 'role': 'admin'}
