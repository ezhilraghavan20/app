import { Link } from 'react-router-dom'
import { motion } from 'framer-motion'
import { Shield, BarChart2, Users, Lock, AlertTriangle, Globe, ChevronRight } from 'lucide-react'

const FEATURES = [
  { icon: BarChart2,    title: 'Command Centre',     desc: 'Real-time security score, risk heat map, KPIs, and live incidents on a single executive dashboard.' },
  { icon: Users,        title: 'Board Room',         desc: 'Manage meetings, agenda, resolutions, and votes. Full minutes and decision audit trail.' },
  { icon: AlertTriangle,title: 'Risk Register',      desc: 'Full CRUD risk register with 5×5 heat map. Likelihood × impact scoring with owner accountability.' },
  { icon: Globe,        title: 'Security Console',   desc: '6 live scan engines — web, network, email, SSL/TLS, DNS, tech fingerprinting. Streaming results.' },
  { icon: Shield,       title: 'Incident Tracker',   desc: 'Log, assign, escalate and resolve security incidents. Severity-based triage and response tracking.' },
  { icon: Lock,         title: 'Audit Ledger',       desc: 'Immutable audit trail of every action. Every decision, scan, vote, and update logged with timestamp.' },
]

export default function Landing() {
  return (
    <div className="min-h-screen bg-void text-white overflow-hidden">
      {/* Ambient glow */}
      <div className="fixed inset-0 pointer-events-none">
        <div className="absolute top-0 left-1/4 w-96 h-96 bg-gold/5 rounded-full blur-3xl" />
        <div className="absolute bottom-1/4 right-1/4 w-80 h-80 bg-blue-500/5 rounded-full blur-3xl" />
      </div>

      {/* Nav */}
      <nav className="relative z-10 flex items-center justify-between px-8 py-5 border-b border-glass-border/40">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-gold/20 border border-glass-border flex items-center justify-center">
            <span className="font-bold text-gold-bright text-sm">N</span>
          </div>
          <span className="font-bold text-gold-bright tracking-widest text-sm">NEXUS</span>
        </div>
        <Link to="/login"
          className="flex items-center gap-2 px-5 py-2 rounded-pill btn-gold text-sm">
          Board Access <ChevronRight className="w-4 h-4" />
        </Link>
      </nav>

      {/* Hero */}
      <section className="relative z-10 max-w-6xl mx-auto px-8 pt-24 pb-16 text-center">
        <motion.div initial={{ opacity:0, y:24 }} animate={{ opacity:1, y:0 }} transition={{ duration:0.6 }}>
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-pill border border-glass-border bg-gold/8 text-gold text-xs font-mono tracking-widest uppercase mb-8">
            <Shield className="w-3 h-3" /> Corporate Intelligence Platform
          </div>

          <h1 className="text-6xl lg:text-7xl font-bold leading-tight tracking-tight mb-6">
            Govern with{' '}
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-gold-bright to-gold">
              intelligence.
            </span>
            <br />Secure with{' '}
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-gold to-gold-dim">
              precision.
            </span>
          </h1>

          <p className="text-white/50 text-lg max-w-2xl mx-auto leading-relaxed mb-10">
            NEXUS unifies board governance, risk management, and live security intelligence
            on a single platform — built for directors and security experts who need the
            full picture without the noise.
          </p>

          <div className="flex items-center justify-center gap-4">
            <Link to="/login" className="btn-gold px-8 py-3 text-base flex items-center gap-2">
              Access Platform <ChevronRight className="w-4 h-4" />
            </Link>
          </div>
        </motion.div>

        {/* Hero visual — executive dashboard mockup */}
        <motion.div
          initial={{ opacity:0, y:40 }} animate={{ opacity:1, y:0 }} transition={{ delay:0.3, duration:0.7 }}
          className="mt-16 glass-card p-6 text-left max-w-4xl mx-auto"
        >
          <div className="flex items-center gap-2 mb-4">
            {['bg-red-400','bg-yellow-400','bg-green-400'].map(c => <div key={c} className={`w-3 h-3 rounded-full ${c} opacity-70`} />)}
            <span className="ml-2 text-xs text-white/30 font-mono">NEXUS — Command Centre</span>
          </div>
          <div className="grid grid-cols-4 gap-3 mb-4">
            {[
              { label:'Security Score', val:'82', sub:'↑ 4 pts this week', color:'text-green-400' },
              { label:'Open Risks',     val:'7',  sub:'2 critical',         color:'text-yellow-400' },
              { label:'Incidents',      val:'3',  sub:'1 critical',         color:'text-red-400' },
              { label:'Board Meetings', val:'2',  sub:'Next: Thu 14:00',    color:'text-gold' },
            ].map(k => (
              <div key={k.label} className="bg-navy-light/40 rounded-xl p-3 border border-glass-border/50">
                <p className="text-xs text-white/40 mb-1">{k.label}</p>
                <p className={`text-2xl font-bold ${k.color}`}>{k.val}</p>
                <p className="text-xs text-white/30 mt-1">{k.sub}</p>
              </div>
            ))}
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="bg-navy-light/40 rounded-xl p-3 border border-glass-border/50">
              <p className="text-xs text-gold/70 font-mono uppercase mb-2">Risk Heat Map</p>
              <div className="grid grid-cols-5 gap-1">
                {Array.from({length:25},(_,i)=>{
                  const v=[0,0,1,0,0, 0,1,2,1,0, 1,2,3,1,0, 0,1,1,0,0, 0,0,1,0,0][i]||0
                  return <div key={i} className={`h-6 rounded ${v===3?'bg-red-500/60':v===2?'bg-orange-500/50':v===1?'bg-yellow-500/40':'bg-white/5'}`} />
                })}
              </div>
            </div>
            <div className="bg-navy-light/40 rounded-xl p-3 border border-glass-border/50">
              <p className="text-xs text-gold/70 font-mono uppercase mb-2">Recent Incidents</p>
              {[{t:'Phishing attempt detected',s:'High',c:'text-orange-400'},{t:'Unauthorized login attempt',s:'Critical',c:'text-red-400'},{t:'SSL cert expiry in 14 days',s:'Medium',c:'text-yellow-400'}].map(i=>(
                <div key={i.t} className="flex items-center justify-between py-1.5 border-b border-white/5 last:border-0">
                  <span className="text-xs text-white/70 truncate pr-2">{i.t}</span>
                  <span className={`text-xs font-medium ${i.c} flex-shrink-0`}>{i.s}</span>
                </div>
              ))}
            </div>
          </div>
        </motion.div>
      </section>

      {/* Features */}
      <section className="relative z-10 max-w-6xl mx-auto px-8 pb-24">
        <div className="text-center mb-12">
          <p className="text-xs text-gold/60 font-mono uppercase tracking-widest mb-3">Platform Modules</p>
          <h2 className="text-3xl font-bold">Everything the board and security team need</h2>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {FEATURES.map(({ icon: Icon, title, desc }, i) => (
            <motion.div key={title}
              initial={{ opacity:0, y:20 }} animate={{ opacity:1, y:0 }}
              transition={{ delay:0.1*i, duration:0.4 }}
              className="glass-card glass-card-hover p-6"
            >
              <div className="w-10 h-10 rounded-xl bg-gold/12 border border-glass-border flex items-center justify-center mb-4">
                <Icon className="w-5 h-5 text-gold" />
              </div>
              <h3 className="font-semibold text-white mb-2">{title}</h3>
              <p className="text-sm text-white/50 leading-relaxed">{desc}</p>
            </motion.div>
          ))}
        </div>
      </section>

      <footer className="relative z-10 text-center py-8 border-t border-glass-border/30">
        <p className="text-xs text-white/25 font-mono">© 2026 NEXUS Corporate Intelligence Platform</p>
      </footer>
    </div>
  )
}
