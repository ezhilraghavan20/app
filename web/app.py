import os
from fastapi import FastAPI, Request, Response
from fastapi.middleware.cors import CORSMiddleware
from slowapi import Limiter, _rate_limit_exceeded_handler
from slowapi.errors import RateLimitExceeded
from slowapi.util import get_remote_address
from database.db import init_db
from .routes.auth import router as auth_router
from .routes.board import router as board_router
from .routes.risks import router as risks_router
from .routes.incidents import router as incidents_router
from .routes.directors import router as directors_router
from .routes.scan import router as scan_router
from .routes.audit import router as audit_router
from .routes.dashboard import router as dashboard_router

limiter = Limiter(key_func=get_remote_address, default_limits=['300/minute'])

def create_app() -> FastAPI:
    app = FastAPI(title='NEXUS', version='1.0.0')
    app.state.limiter = limiter
    app.add_exception_handler(RateLimitExceeded, _rate_limit_exceeded_handler)
    init_db()
    origins = [o.strip() for o in os.environ.get('ALLOWED_ORIGINS','http://localhost:5173').split(',')]
    app.add_middleware(CORSMiddleware, allow_origins=origins, allow_credentials=True,
                       allow_methods=['*'], allow_headers=['Authorization','Content-Type'])
    @app.middleware('http')
    async def security_headers(req: Request, call_next) -> Response:
        res = await call_next(req)
        res.headers['X-Content-Type-Options'] = 'nosniff'
        res.headers['X-Frame-Options'] = 'DENY'
        return res
    for r in [auth_router, board_router, risks_router, incidents_router,
              directors_router, scan_router, audit_router, dashboard_router]:
        app.include_router(r)
    @app.get('/api/health')
    def health(): return {'ok': True, 'service': 'NEXUS'}
    return app
