import { useEffect, useState } from 'react'
import { Plus, Trash2, Pencil, X, Check } from 'lucide-react'
import api from '../api'

interface Risk { id:string;title:string;category:string;likelihood:number;impact:number;score:number;owner:string;mitigation:string;status:string;created_at:number }

const CATS = ['Operational','Financial','Regulatory','Cyber','Reputational','Strategic']
const STATS = ['Open','Mitigated','Accepted','Closed']
const SEV = (s:number) => s>=20?'sev-critical':s>=12?'sev-high':s>=6?'sev-medium':'sev-low'
const SEV_L = (s:number) => s>=20?'Critical':s>=12?'High':s>=6?'Medium':'Low'
const HEAT_C = ['','bg-yellow-500/20','bg-yellow-500/30','bg-orange-500/40','bg-red-500/40','bg-red-500/60']

const EMPTY = { title:'',category:'Cyber',likelihood:3,impact:3,owner:'',mitigation:'',status:'Open' }

export default function RiskRegister() {
  const [risks, setRisks] = useState<Risk[]>([])
  const [showForm, setShowForm] = useState(false)
  const [editId, setEditId] = useState<string|null>(null)
  const [form, setForm] = useState({ ...EMPTY })
  const [filter, setFilter] = useState('All')

  const load = () => api.get<Risk[]>('/api/risks').then(r => setRisks(r.data))
  useEffect(() => { load() }, [])

  const save = async () => {
    if (!form.title) return
    if (editId) { await api.patch(`/api/risks/${editId}`, form); setEditId(null) }
    else await api.post('/api/risks', form)
    setForm({...EMPTY}); setShowForm(false); load()
  }

  const del = async (id:string) => {
    if (!confirm('Delete risk?')) return
    await api.delete(`/api/risks/${id}`); load()
  }

  const startEdit = (r:Risk) => {
    setForm({ title:r.title,category:r.category,likelihood:r.likelihood,impact:r.impact,owner:r.owner,mitigation:r.mitigation,status:r.status })
    setEditId(r.id); setShowForm(true)
  }

  const filtered = filter==='All' ? risks : risks.filter(r => r.category===filter || r.status===filter)

  // Heat map: 5x5 grid, y=impact(1-5), x=likelihood(1-5)
  const heatGrid = Array.from({length:5},(_,i)=>Array.from({length:5},(_,j)=>
    risks.filter(r=>r.status==='Open'&&r.likelihood===j+1&&r.impact===5-i).length
  ))

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white">Risk Register</h1>
          <p className="text-sm text-white/40 mt-0.5">{risks.filter(r=>r.status==='Open').length} open risks</p>
        </div>
        <button onClick={()=>{setShowForm(s=>!s);setEditId(null);setForm({...EMPTY})}} className="btn-gold flex items-center gap-2">
          <Plus className="w-4 h-4" /> Add Risk
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Risk list */}
        <div className="lg:col-span-2 space-y-4">
          {/* Add/Edit form */}
          {showForm && (
            <div className="glass-card p-5">
              <h3 className="text-sm font-semibold text-white mb-4">{editId ? 'Edit Risk' : 'New Risk'}</h3>
              <div className="grid grid-cols-2 gap-3">
                <div className="col-span-2">
                  <label className="text-xs text-white/50 uppercase tracking-wider block mb-1.5">Title *</label>
                  <input className="nx-input" placeholder="Risk description..." value={form.title} onChange={e=>setForm(p=>({...p,title:e.target.value}))} />
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
                  <label className="text-xs text-white/50 uppercase tracking-wider block mb-1.5">Likelihood (1-5): {form.likelihood}</label>
                  <input type="range" min="1" max="5" className="w-full accent-yellow-400" value={form.likelihood} onChange={e=>setForm(p=>({...p,likelihood:+e.target.value}))} />
                </div>
                <div>
                  <label className="text-xs text-white/50 uppercase tracking-wider block mb-1.5">Impact (1-5): {form.impact}</label>
                  <input type="range" min="1" max="5" className="w-full accent-red-400" value={form.impact} onChange={e=>setForm(p=>({...p,impact:+e.target.value}))} />
                </div>
                <div>
                  <label className="text-xs text-white/50 uppercase tracking-wider block mb-1.5">Owner</label>
                  <input className="nx-input" placeholder="Risk owner..." value={form.owner} onChange={e=>setForm(p=>({...p,owner:e.target.value}))} />
                </div>
                <div>
                  <label className="text-xs text-white/50 uppercase tracking-wider block mb-1.5">Mitigation</label>
                  <input className="nx-input" placeholder="Mitigation actions..." value={form.mitigation} onChange={e=>setForm(p=>({...p,mitigation:e.target.value}))} />
                </div>
              </div>
              <div className="flex gap-3 mt-4">
                <button onClick={save} className="btn-gold flex items-center gap-2"><Check className="w-4 h-4" /> {editId?'Update':'Create'}</button>
                <button onClick={()=>{setShowForm(false);setEditId(null)}} className="btn-ghost flex items-center gap-2"><X className="w-4 h-4" /> Cancel</button>
              </div>
            </div>
          )}

          {/* Filter tabs */}
          <div className="flex gap-2 flex-wrap">
            {['All','Open','Mitigated','Accepted',...CATS].map(f=>(
              <button key={f} onClick={()=>setFilter(f)}
                className={`text-xs px-3 py-1.5 rounded-pill border transition ${filter===f?'bg-gold/15 border-glass-border text-gold':'border-glass-border/40 text-white/40 hover:text-white/60'}`}>
                {f}
              </button>
            ))}
          </div>

          {/* Table */}
          <div className="glass-card overflow-hidden">
            <table className="nx-table">
              <thead>
                <tr><th>Risk</th><th>Category</th><th>Score</th><th>Owner</th><th>Status</th><th></th></tr>
              </thead>
              <tbody>
                {filtered.length === 0 && (
                  <tr><td colSpan={6} className="text-center py-8 text-white/30 text-sm">No risks found</td></tr>
                )}
                {filtered.map(r => (
                  <tr key={r.id}>
                    <td>
                      <p className="font-medium text-white/90">{r.title}</p>
                      {r.mitigation && <p className="text-xs text-white/30 mt-0.5 truncate max-w-xs">{r.mitigation}</p>}
                    </td>
                    <td><span className="text-xs text-white/50 bg-white/5 px-2 py-1 rounded">{r.category}</span></td>
                    <td>
                      <div className="flex items-center gap-2">
                        <span className={`text-xs px-2 py-0.5 rounded-pill border font-bold ${SEV(r.score)}`}>{r.score}</span>
                        <span className={`text-xs ${SEV(r.score)}`}>{SEV_L(r.score)}</span>
                      </div>
                      <p className="text-xs text-white/25 mt-0.5">L{r.likelihood}×I{r.impact}</p>
                    </td>
                    <td><span className="text-xs text-white/60">{r.owner||'—'}</span></td>
                    <td><span className={`text-xs px-2 py-0.5 rounded-pill border ${r.status==='Open'?'sev-medium':r.status==='Mitigated'?'sev-low':'text-white/40 bg-white/5 border-white/10'}`}>{r.status}</span></td>
                    <td>
                      <div className="flex gap-2">
                        <button onClick={()=>startEdit(r)} className="text-white/30 hover:text-gold transition p-1"><Pencil className="w-3.5 h-3.5" /></button>
                        <button onClick={()=>del(r.id)} className="text-white/30 hover:text-red-400 transition p-1"><Trash2 className="w-3.5 h-3.5" /></button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Heat map + stats */}
        <div className="space-y-4">
          <div className="glass-card p-5">
            <h3 className="text-sm font-semibold text-white mb-4">Risk Heat Map</h3>
            <div className="flex gap-2">
              <div className="flex flex-col gap-1 items-end justify-between py-1">
                {['5','4','3','2','1'].map(n=><span key={n} className="text-xs text-white/30 w-4 text-right">{n}</span>)}
              </div>
              <div className="flex-1">
                <div className="grid grid-cols-5 gap-1">
                  {heatGrid.flat().map((v,i)=>(
                    <div key={i} className={`aspect-square rounded flex items-center justify-center text-xs font-bold text-white/80 ${HEAT_C[Math.min(v,5)]||'bg-white/4'}`}>
                      {v>0?v:''}
                    </div>
                  ))}
                </div>
                <div className="flex justify-between mt-1">
                  {['1','2','3','4','5'].map(n=><span key={n} className="text-xs text-white/30 flex-1 text-center">{n}</span>)}
                </div>
                <p className="text-xs text-white/20 text-center mt-1">← Likelihood →</p>
              </div>
            </div>
          </div>

          <div className="glass-card p-5 space-y-3">
            <h3 className="text-sm font-semibold text-white mb-2">By Category</h3>
            {CATS.map(c=>{
              const count = risks.filter(r=>r.category===c&&r.status==='Open').length
              if (!count) return null
              return (
                <div key={c} className="flex items-center justify-between">
                  <span className="text-xs text-white/60">{c}</span>
                  <div className="flex items-center gap-2">
                    <div className="w-24 h-1.5 bg-white/8 rounded-full overflow-hidden">
                      <div className="h-full bg-gold/60 rounded-full" style={{width:`${(count/Math.max(risks.filter(r=>r.status==='Open').length,1))*100}%`}} />
                    </div>
                    <span className="text-xs text-white/40 w-4 text-right">{count}</span>
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
