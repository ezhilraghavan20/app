
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
