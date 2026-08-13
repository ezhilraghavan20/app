import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Eye, EyeOff, Loader2, Lock } from 'lucide-react'
import api, { setToken } from '../api'

export default function Login() {
  const nav = useNavigate()
  const [u, setU] = useState('')
  const [p, setP] = useState('')
  const [show, setShow] = useState(false)
  const [loading, setLoading] = useState(false)
  const [err, setErr] = useState('')

  const submit = async () => {
    if (!u || !p) return
    setLoading(true); setErr('')
    try {
      const res = await api.post('/api/auth/login', { username: u, password: p })
      setToken(res.data.access_token)
      nav('/dashboard')
    } catch {
      setErr('Invalid credentials. Access denied.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-void flex items-center justify-center px-4">
      <div className="fixed inset-0 pointer-events-none">
        <div className="absolute top-1/4 left-1/2 -translate-x-1/2 w-96 h-96 bg-gold/6 rounded-full blur-3xl" />
      </div>

      <div className="relative z-10 w-full max-w-sm">
        {/* Logo */}
        <div className="text-center mb-8">
          <div className="w-14 h-14 rounded-2xl bg-gold/15 border border-glass-border flex items-center justify-center mx-auto mb-4 shadow-gold">
            <Lock className="w-6 h-6 text-gold" />
          </div>
          <h1 className="text-2xl font-bold text-white">NEXUS</h1>
          <p className="text-sm text-white/40 mt-1">Corporate Intelligence Platform</p>
        </div>

        {/* Card */}
        <div className="glass-card p-8">
          <h2 className="text-lg font-semibold mb-6 text-white/90">Board Access</h2>

          {err && (
            <div className="mb-4 px-4 py-3 rounded-xl bg-red-500/10 border border-red-500/25 text-red-400 text-sm">
              {err}
            </div>
          )}

          <div className="space-y-4">
            <div>
              <label className="block text-xs text-white/50 font-medium mb-2 uppercase tracking-wider">Username</label>
              <input
                value={u} onChange={e => setU(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && submit()}
                className="nx-input" placeholder="Enter username" autoComplete="username"
              />
            </div>
            <div>
              <label className="block text-xs text-white/50 font-medium mb-2 uppercase tracking-wider">Password</label>
              <div className="relative">
                <input
                  type={show ? 'text' : 'password'}
                  value={p} onChange={e => setP(e.target.value)}
                  onKeyDown={e => e.key === 'Enter' && submit()}
                  className="nx-input pr-10" placeholder="Enter password" autoComplete="current-password"
                />
                <button type="button" onClick={() => setShow(s => !s)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-white/30 hover:text-white/60 transition">
                  {show ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>
            <button
              onClick={submit} disabled={!u || !p || loading}
              className="btn-gold w-full flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed">
              {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Authenticate'}
            </button>
          </div>

          <p className="mt-6 text-center text-xs text-white/25 font-mono">
            AUTHORISED PERSONNEL ONLY
          </p>
        </div>
      </div>
    </div>
  )
}
