import { useEffect, useState } from 'react'
import { Shield, User, Trash2, Search, UserCheck, UserX, Folder } from 'lucide-react'
import { api } from '../api'

export default function Users({ token }: { token: string }) {
  const [users, setUsers] = useState<any[]>([])
  const [search, setSearch] = useState('')
  const [loading, setLoading] = useState(true)

  const fetchUsers = () => {
    api(token).get('/api/admin/users').then(r => { setUsers(r.data); setLoading(false) })
  }
  useEffect(() => { fetchUsers() }, [token])

  const updateRole = async (id: string, role: 'ADMIN' | 'USER') => {
    await api(token).put(`/api/auth/users/${id}/role`, { role })
    fetchUsers()
  }
  const deleteUser = async (id: string) => {
    if (!confirm('Terminate agent access? This cannot be undone.')) return
    await api(token).delete(`/api/admin/users/${id}`)
    fetchUsers()
  }

  const filtered = users.filter(u =>
    u.username.toLowerCase().includes(search.toLowerCase()) ||
    u.email.toLowerCase().includes(search.toLowerCase())
  )

  return (
    <div className="p-8 space-y-6 fade-in">
      <div className="flex items-center justify-between">
        <div>
          <div className="text-[9px] text-slate-400 tracking-[0.3em] mb-1 uppercase">Stark Industries / Personnel Database</div>
          <h1 className="text-xl font-bold text-slate-700 tracking-wide">Agent Registry</h1>
          <p className="text-xs text-slate-400 mt-0.5">{users.length} registered agents</p>
        </div>
        <div className="relative">
          <Search size={13} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Search personnel..."
            className="bg-white/40 border border-white/50 rounded-lg py-2 pl-9 pr-4 text-sm text-slate-700 placeholder-slate-400 focus:outline-none focus:border-teal-400/60 w-60 backdrop-blur-sm"
          />
        </div>
      </div>

      <div className="si-panel rounded-lg overflow-hidden">
        {/* File list header */}
        <div className="px-5 py-2.5 border-b border-white/30 flex items-center gap-2 bg-white/10">
          <div className="w-1.5 h-1.5 rounded-full bg-teal-500 pulse-teal" />
          <span className="text-[9px] text-slate-400 tracking-widest uppercase">Personnel File — Active Records</span>
        </div>
        <table className="w-full">
          <thead>
            <tr className="border-b border-white/20 bg-white/5">
              <th className="text-left px-5 py-3 text-[9px] font-semibold text-slate-400 uppercase tracking-widest">Agent</th>
              <th className="text-left px-5 py-3 text-[9px] font-semibold text-slate-400 uppercase tracking-widest">Contact</th>
              <th className="text-left px-5 py-3 text-[9px] font-semibold text-slate-400 uppercase tracking-widest">Clearance</th>
              <th className="text-left px-5 py-3 text-[9px] font-semibold text-slate-400 uppercase tracking-widest">Enrolled</th>
              <th className="text-right px-5 py-3 text-[9px] font-semibold text-slate-400 uppercase tracking-widest">Actions</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr><td colSpan={5} className="text-center py-12 text-slate-400 text-sm">Loading records...</td></tr>
            ) : filtered.map(u => (
              <tr key={u.id} className="file-row group">
                <td className="px-5 py-3.5">
                  <div className="flex items-center gap-3">
                    <Folder size={16} className="text-slate-400 shrink-0" strokeWidth={1.5} />
                    {u.avatarUrl
                      ? <img src={u.avatarUrl} alt="" className="w-7 h-7 rounded-full object-cover border border-white/40" />
                      : <div className="w-7 h-7 rounded-full bg-teal-500/20 border border-teal-500/30 flex items-center justify-center text-xs font-bold text-teal-700">{u.username[0].toUpperCase()}</div>}
                    <span className="font-semibold text-slate-700 text-sm">{u.username}</span>
                  </div>
                </td>
                <td className="px-5 py-3.5 text-sm text-slate-500">{u.email}</td>
                <td className="px-5 py-3.5">
                  <span className={`inline-flex items-center gap-1.5 px-2 py-0.5 text-[9px] font-bold tracking-widest ${u.role === 'ADMIN' ? 'tag-teal' : 'bg-white/30 text-slate-500 border border-white/40'}`}>
                    {u.role === 'ADMIN' ? <Shield size={9} /> : <User size={9} />}
                    {u.role === 'ADMIN' ? 'DIRECTOR' : 'AGENT'}
                  </span>
                </td>
                <td className="px-5 py-3.5 text-sm text-slate-400">{new Date(u.createdAt).toLocaleDateString()}</td>
                <td className="px-5 py-3.5">
                  <div className="flex items-center justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                    {u.role === 'USER' ? (
                      <button onClick={() => updateRole(u.id, 'ADMIN')}
                        className="flex items-center gap-1 px-2.5 py-1 text-[10px] font-medium text-teal-700 bg-teal-500/10 hover:bg-teal-500/20 border border-teal-500/30 rounded transition-all">
                        <UserCheck size={11} /> Promote
                      </button>
                    ) : (
                      <button onClick={() => updateRole(u.id, 'USER')}
                        className="flex items-center gap-1 px-2.5 py-1 text-[10px] font-medium text-slate-500 bg-white/30 hover:bg-white/50 border border-white/40 rounded transition-all">
                        <UserX size={11} /> Demote
                      </button>
                    )}
                    <button onClick={() => deleteUser(u.id)}
                      className="p-1.5 text-slate-400 hover:text-red-500 hover:bg-red-50/30 rounded transition-all">
                      <Trash2 size={13} />
                    </button>
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
