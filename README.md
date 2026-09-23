<div align="center">

```
███╗   ██╗███████╗██╗  ██╗██╗   ██╗███████╗
████╗  ██║██╔════╝╚██╗██╔╝██║   ██║██╔════╝
██╔██╗ ██║█████╗   ╚███╔╝ ██║   ██║███████╗
██║╚██╗██║██╔══╝   ██╔██╗ ██║   ██║╚════██║
██║ ╚████║███████╗██╔╝ ██╗╚██████╔╝███████║
╚═╝  ╚═══╝╚══════╝╚═╝  ╚═╝ ╚═════╝ ╚══════╝
```

**Govern with intelligence. Secure with precision.**

[![FastAPI](https://img.shields.io/badge/FastAPI-0.115-009688?style=flat-square&logo=fastapi)](https://fastapi.tiangolo.com)
[![React](https://img.shields.io/badge/React-18-61DAFB?style=flat-square&logo=react)](https://react.dev)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.7-3178C6?style=flat-square&logo=typescript)](https://typescriptlang.org)
[![Tailwind](https://img.shields.io/badge/Tailwind-3.4-38BDF8?style=flat-square&logo=tailwindcss)](https://tailwindcss.com)
[![License: MIT](https://img.shields.io/badge/License-MIT-gold?style=flat-square)](LICENSE)

*One platform. Every threat. Full board visibility.*

</div>

---

## What is NEXUS?

NEXUS is a **corporate security intelligence platform** that gives executives and security teams a single pane of glass — live security scanning, risk management, board governance, and an immutable audit trail, all in one dark-mode dashboard.

No enterprise bloat. No SIEM subscription. Just a self-hosted FastAPI + React app that actually tells you what's wrong.

---

## ⚡ Features at a glance

```
┌─────────────────────────────────────────────────────────────────┐
│  COMMAND CENTRE   →  Security score, heat map, live KPIs        │
│  BOARD ROOM       →  Meetings, agendas, resolutions, votes       │
│  RISK REGISTER    →  5×5 heat map, CRUD, owner accountability    │
│  SECURITY CONSOLE →  6 live scan engines, streaming results      │
│  INCIDENT TRACKER →  Log, triage, assign, escalate, resolve      │
│  DIRECTORS        →  Board member profiles and tenure            │
│  AUDIT LEDGER     →  Immutable log — every action, forever       │
└─────────────────────────────────────────────────────────────────┘
```

### 🔍 6 Live Scan Engines

| Engine | What it hunts |
|---|---|
| 🌐 **Web Security** | Missing security headers, cookie flags, path disclosure |
| 🔌 **Port & Service** | 18 ports in parallel — banners, exposed databases, RDP, VNC |
| 📧 **Email Security** | SPF, DMARC, DKIM (10+ selectors) |
| 🔒 **SSL / TLS** | Cert expiry, weak ciphers, HSTS, protocol version |
| 🗂️ **DNS Audit** | Zone transfer (AXFR), DNSSEC, CAA records, wildcard DNS |
| 🧬 **Tech Fingerprint** | CMS, frameworks, CDN, version disclosure, generator tags |

> All results stream live to the UI via **Server-Sent Events**. Watch findings land in real time.

---

## 🛠️ Tech Stack

```
Backend                          Frontend
───────────────────────────      ────────────────────────────
FastAPI 0.115  (Python API)      React 18 + TypeScript
Uvicorn        (ASGI server)     Vite 6
SQLAlchemy 2   (ORM / SQLite)    Tailwind CSS 3 (custom theme)
PyJWT + bcrypt (auth)            Framer Motion (animations)
SlowAPI        (rate limiting)   Axios + React Router v6
dnspython      (DNS audits)      Lucide React (icons)
```

---

## 🚀 Quick Start

### 1 — Clone & configure

```bash
git clone https://github.com/your-username/nexus.git
cd nexus
cp .env.example .env
```

Open `.env` and set your secrets:

```env
JWT_SECRET=<run: python -c "import secrets; print(secrets.token_hex(32))">
ADMIN_USERNAME=admin
ADMIN_PASSWORD=your_password_here
ALLOWED_ORIGINS=http://localhost:5173
```

### 2 — Backend

```bash
python -m venv venv
source venv/bin/activate        # Windows: .\venv\Scripts\Activate.ps1

pip install -r requirements.txt
python seed.py                  # optional: load demo data
python server.py
```

→ API live at `http://localhost:8000`  
→ Swagger docs at `http://localhost:8000/docs`

### 3 — Frontend

```bash
cd frontend
npm install
npm run dev
```

→ App live at `http://localhost:5173`

**Login** with the credentials from your `.env` file.

---

## 📁 Project Structure

```
nexus/
├── server.py              # Entry point (Uvicorn)
├── seed.py                # Demo data
├── requirements.txt
├── .env.example
│
├── auth/                  # JWT token logic
├── database/
│   ├── db.py              # SQLAlchemy engine
│   └── models.py          # All ORM models
│
├── web/
│   ├── app.py             # App factory (CORS, rate limiter, middleware)
│   └── routes/
│       ├── auth.py
│       ├── dashboard.py
│       ├── board.py
│       ├── risks.py
│       ├── incidents.py
│       ├── directors.py
│       ├── scan.py        # ← The 6 scan engines live here
│       └── audit.py
│
└── frontend/src/
    ├── pages/             # One file per page
    ├── layouts/Shell.tsx  # Sidebar + nav
    └── api.ts             # Axios + JWT helper
```

---

## 🔐 Security Design

- **SSRF protection** — scan targets are resolved and checked against RFC 1918 / loopback ranges before any outbound connection
- **Rate limiting** — 300 req/min per IP via SlowAPI
- **JWT auth** — stateless, bcrypt-hashed passwords
- **Security headers** — `X-Frame-Options: DENY`, `X-Content-Type-Options: nosniff` on every response
- **CORS** — restricted to `ALLOWED_ORIGINS`

---

## 🌐 Routes

| URL | Page |
|---|---|
| `/` | Landing |
| `/login` | Admin login |
| `/dashboard` | Command centre |
| `/board` | Board room |
| `/risks` | Risk register |
| `/security` | Security console |
| `/incidents` | Incident tracker |
| `/directors` | Directors |
| `/audit` | Audit ledger |

---

## 📦 Production

```bash
# Build frontend
cd frontend && npm run build   # outputs to dist/

# Run backend in production mode
ENV=production python server.py
```

Serve `dist/` with nginx, proxy `/api/*` to Uvicorn on `localhost:8000`. For persistence, swap SQLite for PostgreSQL by setting `DATABASE_URL` in `.env`.

---

## 📄 License

MIT — see [LICENSE](LICENSE).

---

<div align="center">

Built with FastAPI · React · Tailwind CSS

</div>
