# NEXUS — Start Guide

## First-time setup

**Backend (Terminal 1):**
```powershell
python -m venv venv
.\venv\Scripts\Activate.ps1        # Windows
# source venv/bin/activate          # Mac/Linux
pip install -r requirements.txt
python seed.py                      # optional: loads demo data
python server.py
```
Backend runs on http://localhost:8000
API docs at http://localhost:8000/docs

**Frontend (Terminal 2):**
```powershell
cd frontend
npm install
npm run dev
```
App runs on http://localhost:5173

## After first setup
```powershell
# Terminal 1
.\venv\Scripts\Activate.ps1
python server.py

# Terminal 2
cd frontend
npm run dev
```

## Login credentials
Credentials are in `.env`:
- Username: `admin`
- Password: `Nexus@Board2026`

To change them, edit `.env`:
```
ADMIN_USERNAME=your_username
ADMIN_PASSWORD=your_password
```

## Pages
| URL | Description |
|-----|-------------|
| `/` | Landing page |
| `/login` | Admin login |
| `/dashboard` | Command centre — security score, KPIs, heat map |
| `/board` | Board room — meetings, resolutions, votes |
| `/risks` | Risk register — CRUD + heat map |
| `/security` | Security console — 6 live scan engines |
| `/incidents` | Incident tracker |
| `/directors` | Board of directors |
| `/audit` | Immutable audit ledger |
