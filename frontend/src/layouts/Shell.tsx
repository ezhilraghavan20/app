import { useState, useEffect } from 'react'
import { Link, Navigate, Outlet, useLocation } from 'react-router-dom'
import {
  LayoutDashboard, Users, ShieldAlert, Globe, AlertTriangle,
  BookOpen, ClipboardList, LogOut, ChevronLeft, ChevronRight, Menu
} from 'lucide-react'
import { getToken, clearToken } from '../api'

const NAV = [
  { path:'/dashboard', label:'Command Centre',   icon:LayoutDashboard },
  { path:'/board',     label:'Board Room',       icon:BookOpen },
  { path:'/risks',     label:'Risk Register',    icon:AlertTriangle },
  { path:'/security',  label:'Security Console', icon:Globe },
  { path:'/incidents', label:'Incidents',        icon:ShieldAlert },
  { path:'/directors', label:'Directors',        icon:Users },
  { path:'/audit',     label:'Audit Ledger',     icon:ClipboardList },
]

export default function Shell() {
  const token = getToken()
  const loc = useLocation()
  const [collapsed, setCollapsed] = useState(false)
  const [mobileOpen, setMobileOpen] = useState(false)

  useEffect(() => { setMobileOpen(false) }, [loc.pathname])

  if (!token) return <Navigate to="/login" replace />

  return (
    <div className="flex h-screen overflow-hidden bg-void">
      {mobileOpen && (
        <div className="fixed inset-0 bg-black/60 z-20 md:hidden" onClick={() => setMobileOpen(false)} />
      )}

      {/* Sidebar */}
      <aside className={`
        fixed md:static inset-y-0 left-0 z-30 flex flex-col
        ${collapsed ? 'w-16' : 'w-56'} transition-all duration-300
        ${mobileOpen ? 'translate-x-0' : '-translate-x-full md:translate-x-0'}
        bg-navy-card border-r border-glass-border backdrop-blur-xl
      `}>
        <div className="flex items-center gap-3 px-4 py-5 border-b border-glass-border">
          <div className="w-8 h-8 flex-shrink-0 rounded-lg bg-gold/20 border border-glass-border flex items-center justify-center">
            <span className="font-bold text-gold-bright text-sm">N</span>
          </div>
          {!collapsed && <span className="font-bold text-gold-bright tracking-widest text-sm">NEXUS</span>}
        </div>

        <nav className="flex-1 py-4 space-y-1 px-2 overflow-y-auto">
          {NAV.map(({ path, label, icon: Icon }) => {
            const active = loc.pathname === path
            return (
              <Link key={path} to={path} className={`
                flex items-center gap-3 px-3 py-2.5 rounded-xl transition-all group
                ${active ? 'bg-gold/15 border border-glass-border text-gold-bright' : 'text-white/50 hover:text-white/80 hover:bg-white/5'}
              `}>
                <Icon className={`w-4 h-4 flex-shrink-0 ${active ? 'text-gold' : ''}`} />
                {!collapsed && <span className="text-sm font-medium truncate">{label}</span>}
              </Link>
            )
          })}
        </nav>

        <div className="p-2 border-t border-glass-border space-y-1">
          <button onClick={() => setCollapsed(c => !c)}
            className="w-full flex items-center gap-3 px-3 py-2 rounded-xl text-white/40 hover:text-white/60 hover:bg-white/5 transition">
            {collapsed
              ? <ChevronRight className="w-4 h-4" />
              : <><ChevronLeft className="w-4 h-4" />{!collapsed && <span className="text-sm">Collapse</span>}</>}
          </button>
          <button onClick={() => { clearToken(); window.location.href = '/login' }}
            className="w-full flex items-center gap-3 px-3 py-2 rounded-xl text-white/40 hover:text-red-400 hover:bg-red-500/8 transition">
            <LogOut className="w-4 h-4 flex-shrink-0" />
            {!collapsed && <span className="text-sm">Sign Out</span>}
          </button>
        </div>
      </aside>

      <div className="flex-1 flex flex-col overflow-hidden">
        <header className="flex items-center justify-between px-6 py-4 border-b border-glass-border/50 bg-navy-card backdrop-blur-sm flex-shrink-0">
          <div className="flex items-center gap-4">
            <button className="md:hidden text-white/50" onClick={() => setMobileOpen(m => !m)}>
              <Menu className="w-5 h-5" />
            </button>
            <div>
              <p className="text-xs text-white/40 font-mono uppercase tracking-widest">NEXUS Platform</p>
              <p className="text-sm font-semibold text-white capitalize">
                {NAV.find(n => n.path === loc.pathname)?.label || 'Dashboard'}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-2 h-2 rounded-full bg-green-400 animate-pulse" />
            <span className="text-xs text-white/40 font-mono">ADMIN</span>
          </div>
        </header>
        <main className="flex-1 overflow-y-auto p-6">
          <Outlet />
        </main>
      </div>
    </div>
  )
}
