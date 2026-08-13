import { useEffect, useState } from 'react'
import { ClipboardList, RefreshCw } from 'lucide-react'
import api from '../api'

interface AuditItem { id:string;action:string;entity:string;entity_id:string;actor:string;detail:string;created_at:number }

const ACTION_C: Record<string,string> = {
  CREATE_MEETING:'text-blue-400',CREATE_RESOLUTION:'text-blue-400',VOTE_RESOLUTION:'text-purple-400',
  DELETE_MEETING:'text-red-400',UPDATE_MEETING:'text-yellow-400',
  CREATE_RISK:'text-orange-400',UPDATE_RISK:'text-yellow-400',DELETE_RISK:'text-red-400',
  CREATE_INCIDENT:'text-red-400',UPDATE_INCIDENT:'text-yellow-400',DELETE_INCIDENT:'text-red-400',
  CREATE_DIRECTOR:'text-green-400',UPDATE_DIRECTOR:'text-yellow-400',REMOVE_DIRECTOR:'text-red-400',
  RUN_SCAN:'text-gold',
}

export default function AuditLog() {
  const [items, setItems] = useState<AuditItem[]>([])
  const [total, setTotal] = useState(0)
  const [loading, setLoading] = useState(false)
  const [offset, setOffset] = useState(0)
  const PAGE = 50

  const load = async (off=0) => {
    setLoading(true)
    try {
      const r = await api.get<{total:number;items:AuditItem[]}>(`/api/audit?limit=${PAGE}&offset=${off}`)
      setItems(r.data.items); setTotal(r.data.total); setOffset(off)
    } finally { setLoading(false) }
  }

  useEffect(() => { load() }, [])

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white">Audit Ledger</h1>
          <p className="text-sm text-white/40 mt-0.5">{total.toLocaleString()} immutable records</p>
        </div>
        <button onClick={() => load(0)} className="btn-ghost flex items-center gap-2">
          <RefreshCw className={`w-4 h-4 ${loading?'animate-spin':''}`} /> Refresh
        </button>
      </div>

      <div className="glass-card overflow-hidden">
        <table className="nx-table">
          <thead>
            <tr>
              <th>Timestamp</th>
              <th>Action</th>
              <th>Entity</th>
              <th>Actor</th>
              <th>Detail</th>
            </tr>
          </thead>
          <tbody>
            {items.length===0 && (
              <tr><td colSpan={5} className="text-center py-12 text-white/25">
                {loading ? 'Loading...' : <div className="flex flex-col items-center gap-2"><ClipboardList className="w-8 h-8 opacity-20" /><span>No audit records yet</span></div>}
              </td></tr>
            )}
            {items.map(it => (
              <tr key={it.id}>
                <td>
                  <span className="text-xs text-white/40 font-mono block">{new Date(it.created_at*1000).toLocaleDateString('en-GB',{day:'2-digit',month:'short',year:'numeric'})}</span>
                  <span className="text-xs text-white/25 font-mono">{new Date(it.created_at*1000).toLocaleTimeString('en-GB',{hour:'2-digit',minute:'2-digit',second:'2-digit'})}</span>
                </td>
                <td>
                  <span className={`text-xs font-mono font-semibold ${ACTION_C[it.action]||'text-white/50'}`}>{it.action}</span>
                </td>
                <td>
                  <span className="text-xs text-white/50">{it.entity}</span>
                  {it.entity_id && <span className="text-xs text-white/25 font-mono block">{it.entity_id.slice(0,8)}</span>}
                </td>
                <td><span className="text-xs text-gold/60 font-mono">{it.actor}</span></td>
                <td><span className="text-xs text-white/40 max-w-xs truncate block">{it.detail||'—'}</span></td>
              </tr>
            ))}
          </tbody>
        </table>

        {total > PAGE && (
          <div className="flex items-center justify-between px-4 py-3 border-t border-glass-border/40">
            <span className="text-xs text-white/30">Showing {offset+1}–{Math.min(offset+PAGE,total)} of {total}</span>
            <div className="flex gap-2">
              <button disabled={offset===0} onClick={()=>load(Math.max(0,offset-PAGE))} className="btn-ghost text-xs py-1.5 disabled:opacity-40">← Prev</button>
              <button disabled={offset+PAGE>=total} onClick={()=>load(offset+PAGE)} className="btn-ghost text-xs py-1.5 disabled:opacity-40">Next →</button>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
