import { useEffect, useState } from 'react'
import { Users, MessageSquare, Hash, Activity, Terminal, FileText } from 'lucide-react'
import { AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer, BarChart, Bar } from 'recharts'
import StatCard from '../components/StatCard'
import { api } from '../api'

const CustomTooltip = ({ active, payload, label }: any) => {
  if (active && payload?.length) {
    return (
      <div className="si-panel rounded px-3 py-2 text-[10px]">
        <div className="text-slate-400 tracking-wider mb-1">{label}</div>
        <div className="text-teal-700 font-bold">{payload[0].value} records</div>
      </div>
    )
  }
  return null
}

export default function Dashboard({ token }: { token: string }) {
  const [stats, setStats] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [termLines, setTermLines] = useState<string[]>([])

  useEffect(() => {
    api(token).get('/api/admin/stats').then(r => {
      setStats(r.data)
      setLoading(false)
      const lines = [
        '> Initializing mainframe connection...',
        `> Personnel records: ${r.data.totalUsers} entries`,
        `> Message archive: ${r.data.totalMessages} records`,
        `> Active channels: ${r.data.totalChannels}`,
        '> All systems nominal. Access granted.',
      ]
      lines.forEach((l, i) => setTimeout(() => setTermLines(p => [...p, l]), i * 280))
    }).catch(() => setLoading(false))
  }, [token])

  return (
    <div className="p-8 space-y-6 fade-in">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div>
          <div className="text-[9px] text-slate-400 tracking-[0.3em] mb-1 uppercase">Stark Industries / Mainframe / Overview</div>
          <h1 className="text-xl font-bold text-slate-700 tracking-wide">System Overview</h1>
        </div>
        <div className="text-right">
          <div className="text-[9px] text-slate-400 tracking-widest uppercase">Session</div>
          <div className="text-[10px] text-slate-500">{new Date().toISOString().slice(0, 10)}</div>
        </div>
      </div>

      {/* Stat cards */}
      <div className="grid grid-cols-2 xl:grid-cols-4 gap-4">
        <StatCard label="Total Personnel" value={loading ? '—' : stats?.totalUsers ?? 0} sub="registered agents" icon={<Users size={16} />} />
        <StatCard label="Active Sessions" value={loading ? '—' : stats?.onlineUsers ?? 0} sub="live connections" icon={<Activity size={16} />} />
        <StatCard label="Message Archive" value={loading ? '—' : stats?.totalMessages ?? 0} sub="total records" icon={<MessageSquare size={16} />} restricted />
        <StatCard label="Comm Channels" value={loading ? '—' : stats?.totalChannels ?? 0} sub="active lines" icon={<Hash size={16} />} />
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
        <div className="si-panel rounded-lg p-5 relative">
          <div className="absolute top-0 left-0 w-3 h-3 bracket-tl" />
          <div className="absolute top-0 right-0 w-3 h-3 bracket-tr" />
          <div className="flex items-center gap-2 mb-4">
            <FileText size={12} className="text-teal-600/60" />
            <span className="text-[9px] text-slate-400 tracking-[0.25em] uppercase">Message Activity — 7 Day Log</span>
          </div>
          <ResponsiveContainer width="100%" height={180}>
            <AreaChart data={stats?.messagesByDay ?? []}>
              <defs>
                <linearGradient id="tealGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%"  stopColor="#0d9488" stopOpacity={0.25} />
                  <stop offset="95%" stopColor="#0d9488" stopOpacity={0} />
                </linearGradient>
              </defs>
              <XAxis dataKey="date" tick={{ fill: '#94a3b8', fontSize: 9 }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fill: '#94a3b8', fontSize: 9 }} axisLine={false} tickLine={false} />
              <Tooltip content={<CustomTooltip />} />
              <Area type="monotone" dataKey="count" stroke="#0d9488" strokeWidth={1.5} fill="url(#tealGrad)" />
            </AreaChart>
          </ResponsiveContainer>
        </div>

        <div className="si-panel rounded-lg p-5 relative">
          <div className="absolute top-0 left-0 w-3 h-3 bracket-tl" />
          <div className="absolute top-0 right-0 w-3 h-3 bracket-tr" />
          <div className="flex items-center gap-2 mb-4">
            <Hash size={12} className="text-teal-600/60" />
            <span className="text-[9px] text-slate-400 tracking-[0.25em] uppercase">Records Per Channel</span>
          </div>
          <ResponsiveContainer width="100%" height={180}>
            <BarChart data={stats?.messagesByChannel ?? []}>
              <XAxis dataKey="name" tick={{ fill: '#94a3b8', fontSize: 9 }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fill: '#94a3b8', fontSize: 9 }} axisLine={false} tickLine={false} />
              <Tooltip content={<CustomTooltip />} />
              <Bar dataKey="count" fill="#0d9488" opacity={0.6} radius={[2, 2, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Terminal + Recent */}
      <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
        <div className="si-panel rounded-lg p-5 relative">
          <div className="absolute top-0 left-0 w-3 h-3 bracket-tl" />
          <div className="absolute bottom-0 right-0 w-3 h-3 bracket-br" />
          <div className="flex items-center gap-2 mb-4">
            <Terminal size={12} className="text-teal-600/60" />
            <span className="text-[9px] text-slate-400 tracking-[0.25em] uppercase">System Terminal</span>
            <div className="ml-auto w-1.5 h-1.5 rounded-full bg-teal-500 pulse-teal" />
          </div>
          <div className="font-mono text-[10px] space-y-1 min-h-[120px] bg-black/5 rounded p-3">
            {termLines.map((l, i) => (
              <div key={i} className={i === termLines.length - 1 ? 'text-teal-700' : 'text-slate-400'}>
                {l}{i === termLines.length - 1 && <span className="blink ml-1">_</span>}
              </div>
            ))}
          </div>
        </div>

        <div className="si-panel rounded-lg p-5 relative">
          <div className="absolute top-0 right-0 w-3 h-3 bracket-tr" />
          <div className="absolute bottom-0 left-0 w-3 h-3 bracket-bl" />
          <div className="flex items-center gap-2 mb-4">
            <MessageSquare size={12} className="text-teal-600/60" />
            <span className="text-[9px] text-slate-400 tracking-[0.25em] uppercase">Recent Transmissions</span>
          </div>
          <div className="space-y-1">
            {(stats?.recentMessages ?? []).slice(0, 6).map((m: any, i: number) => (
              <div key={i} className="flex items-start gap-3 py-2 border-b border-white/20 last:border-0 hover:bg-white/10 transition-colors rounded px-1">
                <div className="w-5 h-5 rounded-full bg-teal-500/20 border border-teal-500/30 flex items-center justify-center text-[9px] font-bold text-teal-700 shrink-0">
                  {m.user?.username?.[0]?.toUpperCase()}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="text-[10px] font-semibold text-slate-600">{m.user?.username}</span>
                    <span className="text-[9px] text-slate-400">#{m.channel?.name}</span>
                  </div>
                  <p className="text-[9px] text-slate-400 truncate">{m.content || `[${m.fileType}]`}</p>
                </div>
                <span className="text-[8px] text-slate-400 shrink-0">{new Date(m.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}
