import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { AlertTriangle, Shield, ShieldAlert, CalendarDays, TrendingUp, ChevronRight } from 'lucide-react'
import api from '../api'

interface Summary {
  security_score: number
  open_risks: number; critical_risks: number
  open_incidents: number; critical_incidents: number
  upcoming_meetings: number; total_scans: number
  risk_heat_map: number[][]
  recent_incidents: {id:string;title:string;severity:string;status:string;detected_at:number}[]
  upcoming_meetings_list: {id:string;title:string;date_ts:number;location:string}[]
}

const SEV_C: Record<string,string> = { Critical:'sev-critical',High:'sev-high',Medium:'sev-medium',Low:'sev-low' }
const HEAT_C = ['bg-white/5','bg-yellow-500/30','bg-orange-500/40','bg-red-500/50','bg-red-600/70']

function ScoreGauge({ score }: { score: number }) {
  const color = score >= 80 ? '#22C55E' : score >= 60 ? '#EAB308' : score >= 40 ? '#F97316' : '#EF4444'
  const r = 56; const circ = 2 * Math.PI * r; const dash = (score / 100) * circ
  return (
    <div className="flex flex-col items-center">
      <svg width="140" height="140" viewBox="0 0 140 140">
        <circle cx="70" cy="70" r={r} fill="none" stroke="rgba(255,255,255,0.06)" strokeWidth="10" />
        <circle cx="70" cy="70" r={r} fill="none" stroke={color} strokeWidth="10"
          strokeDasharray={`${dash} ${circ}`} strokeLinecap="round"
          transform="rotate(-90 70 70)" style={{ transition:'stroke-dasharray 1s ease' }} />
        <text x="70" y="65" textAnchor="middle" fill={color} fontSize="28" fontWeight="bold" fontFamily="Inter">{score}</text>
        <text x="70" y="84" textAnchor="middle" fill="rgba(255,255,255,0.4)" fontSize="11" fontFamily="Inter">/100</text>
      </svg>
      <p className="text-xs text-white/50 mt-1 font-mono uppercase tracking-widest">Security Score</p>
    </div>
  )
}

export default function Dashboard() {
  const [data, setData] = useState<Summary | null>(null)

  useEffect(() => {
    api.get<Summary>('/api/dashboard/summary').then(r => setData(r.data)).catch(() => {})
  }, [])

  if (!data) return (
    <div className="flex items-center justify-center h-64">
      <div className="text-white/30 font-mono text-sm animate-pulse">Loading intelligence...</div>
    </div>
  )

  const KPI_CARDS = [
    { label:'Open Risks',      val:data.open_risks,      sub:`${data.critical_risks} critical`,      icon:AlertTriangle, color:'text-yellow-400', href:'/risks' },
    { label:'Active Incidents',val:data.open_incidents,  sub:`${data.critical_incidents} critical`,  icon:ShieldAlert,   color:'text-red-400',    href:'/incidents' },
    { label:'Upcoming Meetings',val:data.upcoming_meetings,sub:'Board calendar',                     icon:CalendarDays,  color:'text-gold',        href:'/board' },
    { label:'Scans Run',       val:data.total_scans,     sub:'Lifetime total',                       icon:TrendingUp,    color:'text-blue-400',   href:'/security' },
  ]

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white">Command Centre</h1>
          <p className="text-sm text-white/40 mt-0.5">Board-level security and governance overview</p>
        </div>
        <span className="text-xs text-white/30 font-mono">{new Date().toLocaleDateString('en-GB',{weekday:'long',year:'numeric',month:'long',day:'numeric'})}</span>
      </div>

      {/* Top row: score + KPIs */}
      <div className="grid grid-cols-1 lg:grid-cols-5 gap-4">
        <div className="glass-card p-6 flex flex-col items-center justify-center lg:col-span-1">
          <ScoreGauge score={data.security_score} />
        </div>
        <div className="lg:col-span-4 grid grid-cols-2 lg:grid-cols-4 gap-4">
          {KPI_CARDS.map(({ label, val, sub, icon: Icon, color, href }) => (
            <Link key={label} to={href} className="glass-card glass-card-hover p-5 flex flex-col gap-3">
              <div className="flex items-center justify-between">
                <Icon className={`w-5 h-5 ${color}`} />
                <ChevronRight className="w-3 h-3 text-white/20" />
              </div>
              <div>
                <p className={`text-3xl font-bold ${color}`}>{val}</p>
                <p className="text-xs text-white/50 mt-1">{label}</p>
                <p className="text-xs text-white/30">{sub}</p>
              </div>
            </Link>
          ))}
        </div>
      </div>

      {/* Heat map + Incidents + Meetings */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* Risk Heat Map */}
        <div className="glass-card p-5">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-sm font-semibold text-white">Risk Heat Map</h3>
            <Link to="/risks" className="text-xs text-gold/60 hover:text-gold transition">View Register →</Link>
          </div>
          <div className="flex items-end gap-2">
            <div className="flex flex-col gap-1 text-right pr-2">
              {['5','4','3','2','1'].map(n => <span key={n} className="text-xs text-white/30 h-8 flex items-center justify-end">{n}</span>)}
            </div>
            <div className="flex-1">
              <div className="grid grid-cols-5 gap-1">
                {data.risk_heat_map.slice().reverse().flatMap((row, ri) =>
                  row.map((v, ci) => (
                    <div key={`${ri}-${ci}`}
                      className={`h-8 rounded-md transition-colors ${HEAT_C[Math.min(v, 4)]} relative group`}>
                      {v > 0 && (
                        <span className="absolute inset-0 flex items-center justify-center text-white text-xs font-bold opacity-80">{v}</span>
                      )}
                    </div>
                  ))
                )}
              </div>
              <div className="flex gap-1 mt-1">
                {['1','2','3','4','5'].map(n => <span key={n} className="text-xs text-white/30 flex-1 text-center">{n}</span>)}
              </div>
              <div className="flex justify-between text-xs text-white/25 mt-1">
                <span>← Likelihood →</span>
                <span className="hidden">Impact ↑</span>
              </div>
            </div>
          </div>
          <div className="flex gap-3 mt-3">
            {[['bg-yellow-500/30','Low'],['bg-orange-500/40','Med'],['bg-red-500/50','High'],['bg-red-600/70','Crit']].map(([c,l])=>(
              <div key={l} className="flex items-center gap-1">
                <div className={`w-3 h-3 rounded ${c}`} />
                <span className="text-xs text-white/30">{l}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Recent Incidents */}
        <div className="glass-card p-5">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-sm font-semibold text-white">Recent Incidents</h3>
            <Link to="/incidents" className="text-xs text-gold/60 hover:text-gold transition">View All →</Link>
          </div>
          <div className="space-y-3">
            {data.recent_incidents.length === 0 && (
              <p className="text-xs text-white/30 py-4 text-center">No active incidents</p>
            )}
            {data.recent_incidents.map(inc => (
              <div key={inc.id} className="flex items-start gap-3 p-3 rounded-xl bg-white/3 border border-glass-border/40">
                <span className={`text-xs px-2 py-0.5 rounded-pill flex-shrink-0 ${SEV_C[inc.severity] || 'sev-info'}`}>
                  {inc.severity}
                </span>
                <div className="min-w-0">
                  <p className="text-sm text-white/80 truncate">{inc.title}</p>
                  <p className="text-xs text-white/30 mt-0.5">{inc.status}</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Upcoming Meetings */}
        <div className="glass-card p-5">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-sm font-semibold text-white">Upcoming Meetings</h3>
            <Link to="/board" className="text-xs text-gold/60 hover:text-gold transition">Board Room →</Link>
          </div>
          <div className="space-y-3">
            {data.upcoming_meetings_list.length === 0 && (
              <p className="text-xs text-white/30 py-4 text-center">No upcoming meetings</p>
            )}
            {data.upcoming_meetings_list.map(m => {
              const d = new Date(m.date_ts * 1000)
              return (
                <div key={m.id} className="p-3 rounded-xl bg-white/3 border border-glass-border/40">
                  <p className="text-sm text-white/80 font-medium truncate">{m.title}</p>
                  <div className="flex items-center gap-2 mt-1">
                    <span className="text-xs text-gold/70">{d.toLocaleDateString('en-GB',{day:'numeric',month:'short'})}</span>
                    <span className="text-xs text-white/30">·</span>
                    <span className="text-xs text-white/40">{m.location}</span>
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      </div>
    </div>
  )
}
