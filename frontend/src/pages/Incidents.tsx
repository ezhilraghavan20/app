import { useEffect, useState } from 'react'
import { Plus, Pencil, Trash2, X, Check } from 'lucide-react'
import api from '../api'

interface Incident { id:string;title:string;severity:string;category:string;description:string;status:string;detected_at:number;resolved_at:number|null;assigned_to:string }

const SEVS = ['Critical','High','Medium','Low']
const CATS = ['Security','Compliance','Operational','Data']
const STATS = ['Open','Investigating','Contained','Resolved']
const SEV_C: Record<string,string> = { Critical:'sev-critical',High:'sev-high',Medium:'sev-medium',Low:'sev-low' }
const STAT_C: Record<string,string> = { Open:'text-red-400 bg-red-400/10 border-red-400/25',Investigating:'text-yellow-400 bg-yellow-400/10 border-yellow-400/25',Contained:'text-blue-400 bg-blue-400/10 border-blue-400/25',Resolved:'text-green-400 bg-green-400/10 border-green-400/25' }

const EMPTY = { title:'',severity:'Medium',category:'Security',description:'',assigned_to:'',status:'Open' }

export default function Incidents() {
  const [incidents, setIncidents] = useState<Incident[]>([])
  const [showForm, setShowForm] = useState(false)
  const [editId, setEditId] = useState<string|null>(null)
  const [form, setForm] = useState({...EMPTY})
  const [filterSev, setFilterSev] = useState('All')
  const [filterStat, setFilterStat] = useState('All')

  const load = () => api.get<Incident[]>('/api/incidents').then(r => setIncidents(r.data))
  useEffect(() => { load() }, [])

  const save = async () => {
    if (!form.title) return
    if (editId) await api.patch(`/api/incidents/${editId}`, form)
    else await api.post('/api/incidents', form)
    setForm({...EMPTY}); setShowForm(false); setEditId(null); load()
  }

  const del = async (id:string) => {
    if (!confirm('Delete incident?')) return
    await api.delete(`/api/incidents/${id}`); load()
  }

  const resolve = async (id:string) => {
    await api.patch(`/api/incidents/${id}`, { status:'Resolved' }); load()
  }

  const startEdit = (inc:Incident) => {
    setForm({ title:inc.title,severity:inc.severity,category:inc.category,description:inc.description,assigned_to:inc.assigned_to,status:inc.status })
    setEditId(inc.id); setShowForm(true)
  }

  const filtered = incidents.filter(i =>
    (filterSev==='All'||i.severity===filterSev) &&
    (filterStat==='All'||i.status===filterStat)
  )

  const counts = SEVS.reduce((a,s) => ({...a,[s]:incidents.filter(i=>i.severity===s&&i.status!=='Resolved').length}),{} as Record<string,number>)

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white">Incident Tracker</h1>
          <p className="text-sm text-white/40 mt-0.5">{incidents.filter(i=>i.status!=='Resolved').length} active incidents</p>
        </div>
        <button onClick={()=>{setShowForm(s=>!s);setEditId(null);setForm({...EMPTY})}} className="btn-gold flex items-center gap-2">
          <Plus className="w-4 h-4" /> Log Incident
        </button>
      </div>

      {/* Summary cards */}
      <div className="grid grid-cols-4 gap-4">
        {SEVS.map(s => (
          <button key={s} onClick={()=>setFilterSev(filterSev===s?'All':s)}
            className={`glass-card p-4 text-left transition border ${filterSev===s?'border-glass-border':'border-transparent'}`}>
            <p className={`text-2xl font-bold ${SEV_C[s]}`}>{(counts as any)[s]}</p>
            <p className="text-xs text-white/50 mt-1">{s}</p>
          </button>
        ))}
      </div>

      {/* Form */}
      {showForm && (
        <div className="glass-card p-5">
          <h3 className="text-sm font-semibold text-white mb-4">{editId?'Edit Incident':'Log New Incident'}</h3>
          <div className="grid grid-cols-2 gap-3">
            <div className="col-span-2">
              <label className="text-xs text-white/50 uppercase tracking-wider block mb-1.5">Title *</label>
              <input className="nx-input" placeholder="Incident description..." value={form.title} onChange={e=>setForm(p=>({...p,title:e.target.value}))} />
            </div>
            <div>
              <label className="text-xs text-white/50 uppercase tracking-wider block mb-1.5">Severity</label>
              <select className="nx-input" value={form.severity} onChange={e=>setForm(p=>({...p,severity:e.target.value}))}>
                {SEVS.map(s=><option key={s} value={s}>{s}</option>)}
              </select>
            </div>
            <div>
              <label className="text-xs text-white/50 uppercase tracking-wider block mb-1.5">Category</label>
              <select className="nx-input" value={form.category} onChange={e=>setForm(p=>({...p,category:e.target.value}))}>
                {CATS.map(c=><option key={c} value={c}>{c}</option>)}
              </select>
            </div>
            <div>
              <label className="text-xs text-white/50 uppercase tracking-wider block mb-1.5">Status</label>
              <select className="nx-input" value={form.status} onChange={e=>setForm(p=>({...p,status:e.target.value}))}>
                {STATS.map(s=><option key={s} value={s}>{s}</option>)}
              </select>
            </div>
            <div>
              <label className="text-xs text-white/50 uppercase tracking-wider block mb-1.5">Assigned To</label>
              <input className="nx-input" placeholder="Assignee..." value={form.assigned_to} onChange={e=>setForm(p=>({...p,assigned_to:e.target.value}))} />
            </div>
            <div className="col-span-2">
              <label className="text-xs text-white/50 uppercase tracking-wider block mb-1.5">Description</label>
              <textarea className="nx-input" rows={2} placeholder="Incident details..." value={form.description} onChange={e=>setForm(p=>({...p,description:e.target.value}))} />
            </div>
          </div>
          <div className="flex gap-3 mt-4">
            <button onClick={save} className="btn-gold flex items-center gap-2"><Check className="w-4 h-4" /> {editId?'Update':'Create'}</button>
            <button onClick={()=>{setShowForm(false);setEditId(null)}} className="btn-ghost flex items-center gap-2"><X className="w-4 h-4" /> Cancel</button>
          </div>
        </div>
      )}

      {/* Filters */}
      <div className="flex gap-2 flex-wrap items-center">
        <span className="text-xs text-white/30">Status:</span>
        {['All',...STATS].map(s=>(
          <button key={s} onClick={()=>setFilterStat(s)}
            className={`text-xs px-3 py-1.5 rounded-pill border transition ${filterStat===s?'bg-gold/12 border-glass-border text-gold':'border-glass-border/40 text-white/40 hover:text-white/60'}`}>
            {s}
          </button>
        ))}
      </div>

      {/* Table */}
      <div className="glass-card overflow-hidden">
        <table className="nx-table">
          <thead><tr><th>Incident</th><th>Severity</th><th>Category</th><th>Status</th><th>Detected</th><th>Assigned</th><th></th></tr></thead>
          <tbody>
            {filtered.length===0&&<tr><td colSpan={7} className="text-center py-8 text-white/30 text-sm">No incidents</td></tr>}
            {filtered.map(inc=>(
              <tr key={inc.id}>
                <td>
                  <p className="font-medium text-white/90">{inc.title}</p>
                  {inc.description&&<p className="text-xs text-white/30 mt-0.5 truncate max-w-xs">{inc.description}</p>}
                </td>
                <td><span className={`text-xs px-2 py-0.5 rounded-pill border font-medium ${SEV_C[inc.severity]||'sev-info'}`}>{inc.severity}</span></td>
                <td><span className="text-xs text-white/50 bg-white/5 px-2 py-1 rounded">{inc.category}</span></td>
                <td><span className={`text-xs px-2.5 py-1 rounded-pill border ${STAT_C[inc.status]||''}`}>{inc.status}</span></td>
                <td><span className="text-xs text-white/40">{new Date(inc.detected_at*1000).toLocaleDateString('en-GB',{day:'numeric',month:'short'})}</span></td>
                <td><span className="text-xs text-white/50">{inc.assigned_to||'—'}</span></td>
                <td>
                  <div className="flex gap-1.5">
                    {inc.status!=='Resolved'&&<button onClick={()=>resolve(inc.id)} className="text-xs px-2 py-1 rounded bg-green-500/10 text-green-400 border border-green-500/25 hover:bg-green-500/20 transition">Resolve</button>}
                    <button onClick={()=>startEdit(inc)} className="text-white/30 hover:text-gold transition p-1"><Pencil className="w-3.5 h-3.5" /></button>
                    <button onClick={()=>del(inc.id)} className="text-white/30 hover:text-red-400 transition p-1"><Trash2 className="w-3.5 h-3.5" /></button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}
