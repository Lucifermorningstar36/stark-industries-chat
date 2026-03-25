import { useEffect, useState } from 'react'
import { Hash, Volume2, Trash2, Plus, MessageSquare, Folder } from 'lucide-react'
import { api } from '../api'

export default function Channels({ token }: { token: string }) {
  const [channels, setChannels] = useState<any[]>([])
  const [newName, setNewName] = useState('')
  const [newType, setNewType] = useState<'TEXT' | 'VOICE'>('TEXT')
  const [loading, setLoading] = useState(true)

  const fetchChannels = () => {
    api(token).get('/api/admin/channels').then(r => { setChannels(r.data); setLoading(false) })
  }
  useEffect(() => { fetchChannels() }, [token])

  const createChannel = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!newName.trim()) return
    await api(token).post('/api/chat/channels', { name: newName.toLowerCase().replace(/\s/g, '-'), type: newType })
    setNewName('')
    fetchChannels()
  }
  const deleteChannel = async (id: string) => {
    if (!confirm('Delete this channel and all messages?')) return
    await api(token).delete(`/api/chat/channels/${id}`)
    fetchChannels()
  }

  const text = channels.filter(c => c.type === 'TEXT')
  const voice = channels.filter(c => c.type === 'VOICE')

  return (
    <div className="p-8 space-y-6 fade-in">
      <div>
        <div className="text-[9px] text-slate-400 tracking-[0.3em] mb-1 uppercase">Stark Industries / Comm Network</div>
        <h1 className="text-xl font-bold text-slate-700 tracking-wide">Channel Control</h1>
        <p className="text-xs text-slate-400 mt-0.5">{channels.length} active channels</p>
      </div>

      {/* Create form */}
      <form onSubmit={createChannel} className="si-panel rounded-lg p-5 flex items-end gap-4">
        <div className="flex-1">
          <label className="block text-[9px] text-slate-400 uppercase tracking-widest mb-2">Channel Name</label>
          <input
            value={newName}
            onChange={e => setNewName(e.target.value)}
            placeholder="new-channel"
            className="w-full bg-white/40 border border-white/50 rounded-lg py-2.5 px-4 text-slate-700 placeholder-slate-400 focus:outline-none focus:border-teal-400/60 text-sm backdrop-blur-sm"
          />
        </div>
        <div>
          <label className="block text-[9px] text-slate-400 uppercase tracking-widest mb-2">Type</label>
          <div className="flex gap-2">
            {(['TEXT', 'VOICE'] as const).map(t => (
              <button key={t} type="button" onClick={() => setNewType(t)}
                className={`px-4 py-2.5 rounded-lg text-sm flex items-center gap-2 border transition-all ${newType === t ? 'bg-teal-500/15 text-teal-700 border-teal-500/40' : 'bg-white/30 text-slate-500 border-white/40 hover:text-slate-700'}`}>
                {t === 'TEXT' ? <Hash size={13} /> : <Volume2 size={13} />} {t}
              </button>
            ))}
          </div>
        </div>
        <button type="submit"
          className="flex items-center gap-2 px-5 py-2.5 bg-teal-500/15 hover:bg-teal-500/25 text-teal-700 border border-teal-500/30 hover:border-teal-500/50 rounded-lg transition-all text-sm font-medium">
          <Plus size={15} /> Create
        </button>
      </form>

      {/* Channel lists */}
      <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
        {[
          { label: 'Text Channels', list: text, icon: Hash, tag: 'TXT' },
          { label: 'Voice Channels', list: voice, icon: Volume2, tag: 'VOX' },
        ].map(({ label, list, icon: Icon, tag }) => (
          <div key={label} className="si-panel rounded-lg overflow-hidden">
            <div className="px-5 py-3 border-b border-white/20 flex items-center gap-2 bg-white/10">
              <Icon size={13} className="text-teal-600/70" />
              <span className="text-xs font-semibold text-slate-600">{label}</span>
              <span className="ml-auto tag-teal text-[8px] font-bold tracking-widest px-1.5 py-0.5">{list.length} {tag}</span>
            </div>
            <div>
              {loading ? (
                <div className="py-8 text-center text-slate-400 text-sm">Loading...</div>
              ) : list.length === 0 ? (
                <div className="py-8 text-center text-slate-400 text-sm">No channels</div>
              ) : list.map(ch => (
                <div key={ch.id} className="flex items-center justify-between px-5 py-3 file-row group">
                  <div className="flex items-center gap-3">
                    <Folder size={15} className="text-slate-400 shrink-0" strokeWidth={1.5} />
                    <span className="text-sm font-medium text-slate-600">{ch.name}</span>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className="text-xs text-slate-400 flex items-center gap-1">
                      <MessageSquare size={11} /> {ch._count?.messages ?? 0}
                    </span>
                    <button onClick={() => deleteChannel(ch.id)}
                      className="opacity-0 group-hover:opacity-100 p-1.5 text-slate-400 hover:text-red-500 hover:bg-red-50/30 rounded transition-all">
                      <Trash2 size={12} />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
