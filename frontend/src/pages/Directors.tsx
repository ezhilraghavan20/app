import { useEffect, useState } from 'react'
import { Plus, Pencil, Trash2, X, Check, User, Mail, Briefcase, Clock } from 'lucide-react'
import api from '../api'

interface Director { id:string;name:string;role:string;department:string;email:string;tenure_yr:number }

const ROLES = ['Chairman','Chief Executive Officer','Chief Financial Officer','Chief Technology Officer','Chief Security Officer','Non-Executive Director','Independent Director','Executive Director','Company Secretary']
const DEPTS = ['Executive','Finance','Technology','Operations','Legal & Compliance','Risk Management','Human Resources','Strategy']

const EMPTY = { name:'',role:'Non-Executive Director',department:'',email:'',tenure_yr:0 }

export default function Directors() {
  const [directors, setDirectors] = useState<Director[]>([])
  const [showForm, setShowForm] = useState(false)
  const [editId, setEditId] = useState<string|null>(null)
  const [form, setForm] = useState({...EMPTY})

  const load = () => api.get<Director[]>('/api/directors').then(r => setDirectors(r.data))
  useEffect(() => { load() }, [])

  const save = async () => {
    if (!form.name) return
    if (editId) await api.patch(`/api/directors/${editId}`, form)
    else await api.post('/api/directors', form)
    setForm({...EMPTY}); setShowForm(false); setEditId(null); load()
  }

  const del = async (id:string) => {
    if (!confirm('Remove this director?')) return
    await api.delete(`/api/directors/${id}`); load()
  }

  const startEdit = (d:Director) => {
    setForm({ name:d.name,role:d.role,department:d.department,email:d.email,tenure_yr:d.tenure_yr })
    setEditId(d.id); setShowForm(true)
  }

  const initials = (n:string) => n.split(' ').map(p=>p[0]).join('').slice(0,2).toUpperCase()

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white">Board of Directors</h1>
          <p className="text-sm text-white/40 mt-0.5">{directors.length} active board members</p>
        </div>
        <button onClick={()=>{setShowForm(s=>!s);setEditId(null);setForm({...EMPTY})}} className="btn-gold flex items-center gap-2">
          <Plus className="w-4 h-4" /> Add Director
        </button>
      </div>

      {/* Form */}
      {showForm && (
        <div className="glass-card p-5">
          <h3 className="text-sm font-semibold text-white mb-4">{editId?'Edit Director':'Add Director'}</h3>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs text-white/50 uppercase tracking-wider block mb-1.5">Full Name *</label>
              <input className="nx-input" placeholder="Director name..." value={form.name} onChange={e=>setForm(p=>({...p,name:e.target.value}))} />
            </div>
            <div>
              <label className="text-xs text-white/50 uppercase tracking-wider block mb-1.5">Role / Title</label>
              <select className="nx-input" value={form.role} onChange={e=>setForm(p=>({...p,role:e.target.value}))}>
                {ROLES.map(r=><option key={r} value={r}>{r}</option>)}
              </select>
            </div>
            <div>
              <label className="text-xs text-white/50 uppercase tracking-wider block mb-1.5">Department</label>
              <select className="nx-input" value={form.department} onChange={e=>setForm(p=>({...p,department:e.target.value}))}>
                <option value="">Select...</option>
                {DEPTS.map(d=><option key={d} value={d}>{d}</option>)}
              </select>
            </div>
            <div>
              <label className="text-xs text-white/50 uppercase tracking-wider block mb-1.5">Email</label>
              <input type="email" className="nx-input" placeholder="director@company.com" value={form.email} onChange={e=>setForm(p=>({...p,email:e.target.value}))} />
            </div>
            <div>
              <label className="text-xs text-white/50 uppercase tracking-wider block mb-1.5">Tenure (years)</label>
              <input type="number" min="0" max="50" className="nx-input" value={form.tenure_yr} onChange={e=>setForm(p=>({...p,tenure_yr:+e.target.value}))} />
            </div>
          </div>
          <div className="flex gap-3 mt-4">
            <button onClick={save} className="btn-gold flex items-center gap-2"><Check className="w-4 h-4" /> {editId?'Update':'Add'}</button>
            <button onClick={()=>{setShowForm(false);setEditId(null)}} className="btn-ghost flex items-center gap-2"><X className="w-4 h-4" /> Cancel</button>
          </div>
        </div>
      )}

      {/* Director cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
        {directors.length === 0 && (
          <div className="col-span-full glass-card p-12 text-center text-white/30 text-sm">
            No directors added. Add the first board member.
          </div>
        )}
        {directors.map(d => (
          <div key={d.id} className="glass-card glass-card-hover p-5">
            <div className="flex items-start justify-between mb-4">
              <div className="flex items-center gap-3">
                <div className="w-11 h-11 rounded-xl bg-gradient-to-br from-gold/30 to-gold/10 border border-glass-border flex items-center justify-center flex-shrink-0">
                  <span className="text-gold font-bold text-sm">{initials(d.name)}</span>
                </div>
                <div>
                  <p className="font-semibold text-white">{d.name}</p>
                  <p className="text-xs text-gold/70 mt-0.5">{d.role}</p>
                </div>
              </div>
              <div className="flex gap-1">
                <button onClick={()=>startEdit(d)} className="text-white/25 hover:text-gold transition p-1.5"><Pencil className="w-3.5 h-3.5" /></button>
                <button onClick={()=>del(d.id)} className="text-white/25 hover:text-red-400 transition p-1.5"><Trash2 className="w-3.5 h-3.5" /></button>
              </div>
            </div>

            <div className="space-y-2">
              {d.department && (
                <div className="flex items-center gap-2 text-xs text-white/50">
                  <Briefcase className="w-3.5 h-3.5 text-white/25" />
                  {d.department}
                </div>
              )}
              {d.email && (
                <div className="flex items-center gap-2 text-xs text-white/50">
                  <Mail className="w-3.5 h-3.5 text-white/25" />
                  {d.email}
                </div>
              )}
              {d.tenure_yr > 0 && (
                <div className="flex items-center gap-2 text-xs text-white/50">
                  <Clock className="w-3.5 h-3.5 text-white/25" />
                  {d.tenure_yr} year{d.tenure_yr!==1?'s':''} tenure
                </div>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
