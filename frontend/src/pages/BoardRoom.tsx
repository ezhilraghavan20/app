import { useEffect, useState } from 'react'
import { Plus, Calendar, Vote, ChevronDown, ChevronUp, Trash2 } from 'lucide-react'
import api from '../api'

interface Meeting { id:string;title:string;date_ts:number;location:string;status:string;agenda:string;minutes:string }
interface Resolution { id:string;title:string;description:string;vote_for:number;vote_against:number;vote_abstain:number;status:string }

const STATUS_C: Record<string,string> = {
  Scheduled:'text-blue-400 bg-blue-400/10 border-blue-400/25',
  InProgress:'text-yellow-400 bg-yellow-400/10 border-yellow-400/25',
  Completed:'text-green-400 bg-green-400/10 border-green-400/25',
  Cancelled:'text-red-400 bg-red-400/10 border-red-400/25',
  Passed:'text-green-400 bg-green-400/10 border-green-400/25',
  Rejected:'text-red-400 bg-red-400/10 border-red-400/25',
  Pending:'text-white/50 bg-white/5 border-white/10',
}

export default function BoardRoom() {
  const [meetings, setMeetings] = useState<Meeting[]>([])
  const [expanded, setExpanded] = useState<string|null>(null)
  const [resolutions, setResolutions] = useState<Record<string,Resolution[]>>({})
  const [showNew, setShowNew] = useState(false)
  const [form, setForm] = useState({ title:'', date:'', time:'14:00', location:'Virtual', agenda:'' })
  const [resForm, setResForm] = useState({ title:'', description:'' })
  const [voteForm, setVoteForm] = useState<Record<string,{for:number;against:number;abstain:number}>>({})

  const load = () => api.get<Meeting[]>('/api/board/meetings').then(r => setMeetings(r.data))
  const loadRes = (mid: string) => api.get<Resolution[]>(`/api/board/resolutions/${mid}`).then(r => setResolutions(p => ({...p,[mid]:r.data})))

  useEffect(() => { load() }, [])

  const toggle = (id: string) => {
    if (expanded === id) { setExpanded(null); return }
    setExpanded(id); loadRes(id)
  }

  const create = async () => {
    if (!form.title || !form.date) return
    const date_ts = Math.floor(new Date(`${form.date}T${form.time}`).getTime() / 1000)
    await api.post('/api/board/meetings', { title:form.title, date_ts, location:form.location, agenda:form.agenda })
    setForm({ title:'',date:'',time:'14:00',location:'Virtual',agenda:'' }); setShowNew(false); load()
  }

  const deleteMeeting = async (id: string) => {
    if (!confirm('Delete this meeting?')) return
    await api.delete(`/api/board/meetings/${id}`); load()
  }

  const createRes = async (mid: string) => {
    if (!resForm.title) return
    await api.post('/api/board/resolutions', { meeting_id:mid, ...resForm })
    setResForm({ title:'', description:'' }); loadRes(mid)
  }

  const vote = async (rid: string, mid: string) => {
    const v = voteForm[rid] || { for:0, against:0, abstain:0 }
    await api.post(`/api/board/resolutions/${rid}/vote`, { vote_for:v.for, vote_against:v.against, vote_abstain:v.abstain })
    loadRes(mid)
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white">Board Room</h1>
          <p className="text-sm text-white/40 mt-0.5">Meetings, resolutions, and decisions</p>
        </div>
        <button onClick={() => setShowNew(s=>!s)} className="btn-gold flex items-center gap-2">
          <Plus className="w-4 h-4" /> New Meeting
        </button>
      </div>

      {/* New meeting form */}
      {showNew && (
        <div className="glass-card p-6">
          <h3 className="text-sm font-semibold text-white mb-4">Schedule Meeting</h3>
          <div className="grid grid-cols-2 gap-4 mb-4">
            <div className="col-span-2">
              <label className="text-xs text-white/50 uppercase tracking-wider block mb-1.5">Title</label>
              <input className="nx-input" placeholder="Q4 Board Review" value={form.title} onChange={e=>setForm(p=>({...p,title:e.target.value}))} />
            </div>
            <div>
              <label className="text-xs text-white/50 uppercase tracking-wider block mb-1.5">Date</label>
              <input type="date" className="nx-input" value={form.date} onChange={e=>setForm(p=>({...p,date:e.target.value}))} />
            </div>
            <div>
              <label className="text-xs text-white/50 uppercase tracking-wider block mb-1.5">Time</label>
              <input type="time" className="nx-input" value={form.time} onChange={e=>setForm(p=>({...p,time:e.target.value}))} />
            </div>
            <div>
              <label className="text-xs text-white/50 uppercase tracking-wider block mb-1.5">Location</label>
              <input className="nx-input" placeholder="Virtual / Boardroom" value={form.location} onChange={e=>setForm(p=>({...p,location:e.target.value}))} />
            </div>
            <div>
              <label className="text-xs text-white/50 uppercase tracking-wider block mb-1.5">Agenda</label>
              <input className="nx-input" placeholder="Key agenda items..." value={form.agenda} onChange={e=>setForm(p=>({...p,agenda:e.target.value}))} />
            </div>
          </div>
          <div className="flex gap-3">
            <button onClick={create} className="btn-gold">Schedule</button>
            <button onClick={()=>setShowNew(false)} className="btn-ghost">Cancel</button>
          </div>
        </div>
      )}

      {/* Meeting list */}
      <div className="space-y-3">
        {meetings.length === 0 && (
          <div className="glass-card p-12 text-center text-white/30 text-sm">
            No meetings scheduled. Create the first board meeting.
          </div>
        )}
        {meetings.map(m => {
          const d = new Date(m.date_ts * 1000)
          const isExp = expanded === m.id
          const res = resolutions[m.id] || []
          return (
            <div key={m.id} className="glass-card overflow-hidden">
              <div className="flex items-center justify-between p-5 cursor-pointer" onClick={() => toggle(m.id)}>
                <div className="flex items-center gap-4">
                  <div className="w-10 h-10 rounded-xl bg-gold/12 border border-glass-border flex items-center justify-center flex-shrink-0">
                    <Calendar className="w-5 h-5 text-gold" />
                  </div>
                  <div>
                    <p className="font-semibold text-white">{m.title}</p>
                    <p className="text-xs text-white/40 mt-0.5">
                      {d.toLocaleDateString('en-GB',{weekday:'short',day:'numeric',month:'long',year:'numeric'})} · {m.location}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <span className={`text-xs px-2.5 py-1 rounded-pill border font-medium ${STATUS_C[m.status]||'text-white/50'}`}>{m.status}</span>
                  <button onClick={e=>{e.stopPropagation();deleteMeeting(m.id)}} className="text-white/20 hover:text-red-400 transition p-1">
                    <Trash2 className="w-4 h-4" />
                  </button>
                  {isExp ? <ChevronUp className="w-4 h-4 text-white/30" /> : <ChevronDown className="w-4 h-4 text-white/30" />}
                </div>
              </div>

              {isExp && (
                <div className="border-t border-glass-border/50 p-5 space-y-5">
                  {m.agenda && <p className="text-sm text-white/60 bg-white/3 rounded-xl p-4"><span className="text-gold/60 text-xs uppercase tracking-wider block mb-1">Agenda</span>{m.agenda}</p>}

                  <div>
                    <div className="flex items-center justify-between mb-3">
                      <h4 className="text-xs font-semibold text-gold/70 uppercase tracking-wider flex items-center gap-2"><Vote className="w-3 h-3" /> Resolutions ({res.length})</h4>
                    </div>
                    <div className="space-y-3">
                      {res.map(r => {
                        const v = voteForm[r.id] || { for:r.vote_for, against:r.vote_against, abstain:r.vote_abstain }
                        const total = r.vote_for + r.vote_against + r.vote_abstain
                        return (
                          <div key={r.id} className="p-4 rounded-xl bg-white/3 border border-glass-border/40">
                            <div className="flex items-center justify-between mb-2">
                              <p className="text-sm font-medium text-white">{r.title}</p>
                              <span className={`text-xs px-2 py-0.5 rounded-pill border ${STATUS_C[r.status]||''}`}>{r.status}</span>
                            </div>
                            {r.description && <p className="text-xs text-white/40 mb-3">{r.description}</p>}
                            {total > 0 && (
                              <div className="flex gap-4 mb-3 text-xs">
                                <span className="text-green-400">For: {r.vote_for}</span>
                                <span className="text-red-400">Against: {r.vote_against}</span>
                                <span className="text-white/40">Abstain: {r.vote_abstain}</span>
                              </div>
                            )}
                            <div className="flex gap-2 items-center">
                              {(['for','against','abstain'] as const).map(k => (
                                <input key={k} type="number" min="0" max="20"
                                  className="nx-input w-16 text-xs text-center py-1.5"
                                  placeholder={k.charAt(0).toUpperCase()+k.slice(1)}
                                  value={(voteForm[r.id]||{})[k]??0}
                                  onChange={e=>setVoteForm(p=>({...p,[r.id]:{...p[r.id]||{for:0,against:0,abstain:0},[k]:+e.target.value}}))} />
                              ))}
                              <button onClick={()=>vote(r.id,m.id)} className="btn-gold py-1.5 px-3 text-xs">Record Vote</button>
                            </div>
                          </div>
                        )
                      })}
                      {/* Add resolution */}
                      <div className="p-4 rounded-xl border border-dashed border-glass-border/40 space-y-2">
                        <input className="nx-input text-sm" placeholder="Resolution title..." value={resForm.title} onChange={e=>setResForm(p=>({...p,title:e.target.value}))} />
                        <input className="nx-input text-sm" placeholder="Description (optional)..." value={resForm.description} onChange={e=>setResForm(p=>({...p,description:e.target.value}))} />
                        <button onClick={()=>createRes(m.id)} className="btn-ghost text-xs py-1.5">+ Add Resolution</button>
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>
          )
        })}
      </div>
    </div>
  )
}
