import { useEffect, useState } from 'react'
import { Trash2, Search, Folder } from 'lucide-react'
import { api } from '../api'

export default function Messages({ token }: { token: string }) {
  const [messages, setMessages] = useState<any[]>([])
  const [search, setSearch] = useState('')
  const [page, setPage] = useState(1)
  const [total, setTotal] = useState(0)
  const [loading, setLoading] = useState(true)
  const PER_PAGE = 30

  const fetchMessages = (p = page) => {
    setLoading(true)
    api(token).get(`/api/admin/messages?page=${p}&limit=${PER_PAGE}&search=${search}`).then(r => {
      setMessages(r.data.messages)
      setTotal(r.data.total)
      setLoading(false)
    })
  }
  useEffect(() => { fetchMessages(1); setPage(1) }, [search])
  useEffect(() => { fetchMessages(page) }, [page])

  const deleteMsg = async (id: string) => {
    await api(token).delete(`/api/admin/messages/${id}`)
    fetchMessages(page)
  }

  const totalPages = Math.ceil(total / PER_PAGE)

  return (
    <div className="p-8 space-y-6 fade-in">
      <div className="flex items-center justify-between">
        <div>
          <div className="text-[9px] text-slate-400 tracking-[0.3em] mb-1 uppercase">Stark Industries / Surveillance</div>
          <h1 className="text-xl font-bold text-slate-700 tracking-wide">Transmission Log</h1>
          <p className="text-xs text-slate-400 mt-0.5">{total} intercepted transmissions</p>
        </div>
        <div className="relative">
          <Search size={13} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Search transmissions..."
            className="bg-white/40 border border-white/50 rounded-lg py-2 pl-9 pr-4 text-sm text-slate-700 placeholder-slate-400 focus:outline-none focus:border-teal-400/60 w-60 backdrop-blur-sm"
          />
        </div>
      </div>

      <div className="si-panel rounded-lg overflow-hidden">
        <div className="px-5 py-2.5 border-b border-white/30 flex items-center gap-2 bg-white/10">
          <div className="w-1.5 h-1.5 rounded-full bg-teal-500 pulse-teal" />
          <span className="text-[9px] text-slate-400 tracking-widest uppercase">Live Intercept Feed — Classified</span>
        </div>
        <table className="w-full">
          <thead>
            <tr className="border-b border-white/20 bg-white/5">
              <th className="text-left px-5 py-3 text-[9px] font-semibold text-slate-400 uppercase tracking-widest">Agent</th>
              <th className="text-left px-5 py-3 text-[9px] font-semibold text-slate-400 uppercase tracking-widest">Channel</th>
              <th className="text-left px-5 py-3 text-[9px] font-semibold text-slate-400 uppercase tracking-widest">Content</th>
              <th className="text-left px-5 py-3 text-[9px] font-semibold text-slate-400 uppercase tracking-widest">Timestamp</th>
              <th className="px-5 py-3" />
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr><td colSpan={5} className="text-center py-12 text-slate-400 text-sm">Loading transmissions...</td></tr>
            ) : messages.map(m => (
              <tr key={m.id} className="file-row group">
                <td className="px-5 py-3.5">
                  <div className="flex items-center gap-2">
                    <Folder size={14} className="text-slate-400 shrink-0" strokeWidth={1.5} />
                    <div className="w-6 h-6 rounded-full bg-teal-500/20 border border-teal-500/30 flex items-center justify-center text-[9px] font-bold text-teal-700">
                      {m.user?.username?.[0]?.toUpperCase()}
                    </div>
                    <span className="text-sm font-medium text-slate-700">{m.user?.username}</span>
                  </div>
                </td>
                <td className="px-5 py-3.5 text-sm text-slate-500">#{m.channel?.name}</td>
                <td className="px-5 py-3.5 text-sm text-slate-600 max-w-xs truncate">
                  {m.fileType
                    ? <span className="tag-teal text-[9px] px-1.5 py-0.5">[{m.fileType.toUpperCase()}] {m.fileName}</span>
                    : m.content}
                </td>
                <td className="px-5 py-3.5 text-xs text-slate-400">{new Date(m.createdAt).toLocaleString()}</td>
                <td className="px-5 py-3.5">
                  <button onClick={() => deleteMsg(m.id)}
                    className="opacity-0 group-hover:opacity-100 p-1.5 text-slate-400 hover:text-red-500 hover:bg-red-50/30 rounded transition-all">
                    <Trash2 size={12} />
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>

        {totalPages > 1 && (
          <div className="flex items-center justify-between px-5 py-3.5 border-t border-white/20 bg-white/5">
            <span className="text-xs text-slate-400">Page {page} of {totalPages}</span>
            <div className="flex gap-2">
              <button disabled={page === 1} onClick={() => setPage(p => p - 1)}
                className="px-3 py-1.5 text-xs text-slate-500 bg-white/30 hover:bg-white/50 border border-white/40 rounded disabled:opacity-30 transition-colors">← Prev</button>
              <button disabled={page === totalPages} onClick={() => setPage(p => p + 1)}
                className="px-3 py-1.5 text-xs text-slate-500 bg-white/30 hover:bg-white/50 border border-white/40 rounded disabled:opacity-30 transition-colors">Next →</button>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
