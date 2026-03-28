import { useState, useEffect, useRef } from 'react'
import { io, Socket } from 'socket.io-client'
import axios from 'axios'
import { Send, Zap, CheckCircle, XCircle, Clock, ChevronRight, Terminal, Users, Activity } from 'lucide-react'

const API = (import.meta as any).env?.VITE_API_URL || ''

interface Agent { id: string; name: string; role: string; color: string; icon: string }
interface LogEntry { id: string; agentId: string; agentName: string; message: string; type: string; timestamp: string }
interface Task { id: string; title: string; status: string; createdAt: string; logs?: LogEntry[]; subtasks?: any[] }

export default function App() {
  const [agents, setAgents] = useState<Agent[]>([])
  const [tasks, setTasks] = useState<Task[]>([])
  const [activeTask, setActiveTask] = useState<Task | null>(null)
  const [input, setInput] = useState('')
  const [loading, setLoading] = useState(false)
  const [socket, setSocket] = useState<Socket | null>(null)
  const logsEndRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    axios.get(`${API}/api/agents`).then(r => setAgents(r.data)).catch(() => {})

    const s = io(API || window.location.origin.replace(':5175', ':5176'))
    setSocket(s)

    s.on('tasks:init', (list: Task[]) => setTasks(list))
    s.on('task:created', (t: Task) => setTasks(prev => [t, ...prev]))
    s.on('task:update', ({ taskId, status }: any) => {
      setTasks(prev => prev.map(t => t.id === taskId ? { ...t, status } : t))
      setActiveTask(prev => prev && prev.id === taskId ? { ...prev, status } : prev)
    })
    s.on('task:log', ({ taskId, log }: any) => {
      setActiveTask(prev => {
        if (!prev || prev.id !== taskId) return prev
        return { ...prev, logs: [...(prev.logs || []), log] }
      })
    })

    return () => { s.close() }
  }, [])

  useEffect(() => {
    logsEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [activeTask?.logs])

  const submitTask = async () => {
    if (!input.trim() || loading) return
    setLoading(true)
    try {
      const res = await axios.post(`${API}/api/tasks`, { title: input.trim() })
      const newTask: Task = { ...res.data, logs: [], subtasks: [] }
      setActiveTask(newTask)
      setInput('')
    } catch (e) {
      alert('API bağlantısı yok')
    }
    setLoading(false)
  }

  const loadTask = async (id: string) => {
    try {
      const res = await axios.get(`${API}/api/tasks/${id}`)
      setActiveTask(res.data)
    } catch {}
  }

  const statusIcon = (s: string) => {
    if (s === 'done') return <CheckCircle size={13} className="text-green-400" />
    if (s === 'error') return <XCircle size={13} className="text-red-400" />
    if (s === 'running') return <Activity size={13} className="text-blue-400 animate-pulse" />
    return <Clock size={13} className="text-yellow-400" />
  }

  const logColor = (type: string) => {
    if (type === 'error') return 'text-red-400'
    if (type === 'success') return 'text-green-400'
    if (type === 'code') return 'text-yellow-300'
    return 'text-blue-200'
  }

  return (
    <div className="h-screen flex flex-col overflow-hidden" style={{ background: 'var(--bg)' }}>
      <div className="scanline" />

      {/* TOP BAR */}
      <div className="flex items-center justify-between px-6 py-3 shrink-0 z-10"
        style={{ borderBottom: '1px solid var(--border)', background: 'var(--panel)', backdropFilter: 'blur(10px)' }}>
        <div className="flex items-center gap-3">
          <svg width="28" height="28" viewBox="0 0 40 40" fill="none">
            <circle cx="20" cy="20" r="18.5" stroke="#06b6d4" strokeWidth="1.5" opacity="0.7"/>
            <circle cx="20" cy="20" r="12" stroke="#06b6d4" strokeWidth="1" opacity="0.5"/>
            <circle cx="20" cy="20" r="3.5" fill="#06b6d4" opacity="0.9"/>
            <line x1="20" y1="1" x2="20" y2="7" stroke="#06b6d4" strokeWidth="2" strokeLinecap="round"/>
            <line x1="20" y1="33" x2="20" y2="39" stroke="#06b6d4" strokeWidth="2" strokeLinecap="round"/>
            <line x1="1" y1="20" x2="7" y2="20" stroke="#06b6d4" strokeWidth="2" strokeLinecap="round"/>
            <line x1="33" y1="20" x2="39" y2="20" stroke="#06b6d4" strokeWidth="2" strokeLinecap="round"/>
          </svg>
          <div>
            <div className="text-sm font-bold tracking-widest uppercase text-cyan-300">STARK COMMAND</div>
            <div className="text-[8px] tracking-widest text-blue-400/40">AI AGENT ORCHESTRATION v0.1</div>
          </div>
        </div>
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-1.5">
            <Users size={12} className="text-blue-400/50" />
            <span className="text-[10px] text-blue-400/50">{agents.length} AGENTS</span>
          </div>
          <div className="flex items-center gap-1.5">
            <Terminal size={12} className="text-blue-400/50" />
            <span className="text-[10px] text-blue-400/50">{tasks.length} TASKS</span>
          </div>
        </div>
      </div>

      <div className="flex flex-1 overflow-hidden">

        {/* LEFT — Agents + Task List */}
        <div className="w-72 shrink-0 flex flex-col" style={{ borderRight: '1px solid var(--border)', background: 'rgba(2,4,9,0.6)' }}>

          {/* Agents */}
          <div className="p-4" style={{ borderBottom: '1px solid var(--border)' }}>
            <div className="text-[9px] tracking-widest text-blue-400/40 uppercase mb-3">Active Agents</div>
            <div className="space-y-2">
              {agents.map(a => (
                <div key={a.id} className="flex items-center gap-2.5 px-3 py-2 rounded-lg"
                  style={{ background: 'rgba(59,130,246,0.05)', border: '1px solid rgba(59,130,246,0.1)' }}>
                  <span className="text-base">{a.icon}</span>
                  <div className="flex-1 min-w-0">
                    <div className="text-[10px] font-bold truncate" style={{ color: a.color }}>{a.name}</div>
                    <div className="text-[8px] text-blue-400/30 truncate">{a.role}</div>
                  </div>
                  <div className="w-1.5 h-1.5 rounded-full bg-green-400 animate-pulse" />
                </div>
              ))}
            </div>
          </div>

          {/* Task List */}
          <div className="flex-1 overflow-y-auto p-4">
            <div className="text-[9px] tracking-widest text-blue-400/40 uppercase mb-3">Task History</div>
            {tasks.length === 0 && (
              <div className="text-[10px] text-blue-400/20 text-center py-8">Henüz görev yok</div>
            )}
            {tasks.map(t => (
              <div key={t.id} onClick={() => loadTask(t.id)}
                className="flex items-center gap-2 px-3 py-2.5 mb-1.5 rounded-lg cursor-pointer transition-all"
                style={{
                  background: activeTask?.id === t.id ? 'rgba(6,182,212,0.1)' : 'rgba(59,130,246,0.04)',
                  border: `1px solid ${activeTask?.id === t.id ? 'rgba(6,182,212,0.3)' : 'rgba(59,130,246,0.08)'}`,
                }}>
                {statusIcon(t.status)}
                <div className="flex-1 min-w-0">
                  <div className="text-[10px] truncate text-blue-200">{t.title}</div>
                  <div className="text-[8px] text-blue-400/30">{new Date(t.createdAt).toLocaleTimeString()}</div>
                </div>
                <ChevronRight size={11} className="text-blue-400/30 shrink-0" />
              </div>
            ))}
          </div>
        </div>

        {/* RIGHT — Mission Control */}
        <div className="flex-1 flex flex-col overflow-hidden">

          {/* Task Input */}
          <div className="p-4 shrink-0" style={{ borderBottom: '1px solid var(--border)' }}>
            <div className="text-[9px] tracking-widest text-blue-400/40 uppercase mb-2">New Mission</div>
            <div className="flex gap-2">
              <input
                value={input}
                onChange={e => setInput(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && submitTask()}
                placeholder="Görevi tanımla... (örn: Login sayfasına dark mode ekle)"
                className="flex-1 px-4 py-2.5 text-sm rounded-lg outline-none"
                style={{ background: 'rgba(59,130,246,0.06)', border: '1px solid rgba(59,130,246,0.2)', color: '#93c5fd' }}
              />
              <button onClick={submitTask} disabled={loading || !input.trim()}
                className="flex items-center gap-2 px-5 py-2.5 rounded-lg text-sm font-bold transition-all disabled:opacity-40"
                style={{ background: 'rgba(6,182,212,0.15)', border: '1px solid rgba(6,182,212,0.4)', color: '#06b6d4' }}>
                {loading ? <Activity size={15} className="animate-spin" /> : <Zap size={15} />}
                DEPLOY
              </button>
            </div>
          </div>

          {/* Live Log */}
          {activeTask ? (
            <div className="flex-1 overflow-y-auto p-4">
              <div className="flex items-center gap-3 mb-4">
                {statusIcon(activeTask.status)}
                <div>
                  <div className="text-sm font-bold text-blue-200">{activeTask.title}</div>
                  <div className="text-[9px] text-blue-400/40 uppercase tracking-widest">{activeTask.status}</div>
                </div>
              </div>

              <div className="space-y-2">
                {(activeTask.logs || []).map(log => {
                  const agent = agents.find(a => a.id === log.agentId)
                  return (
                    <div key={log.id} className="flex gap-3 p-3 rounded-lg"
                      style={{ background: 'rgba(59,130,246,0.04)', border: '1px solid rgba(59,130,246,0.08)' }}>
                      <div className="shrink-0 mt-0.5">
                        <span className="text-sm">{agent?.icon || '🤖'}</span>
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                          <span className="text-[9px] font-bold tracking-wider" style={{ color: agent?.color || '#60a5fa' }}>
                            {log.agentName}
                          </span>
                          <span className="text-[8px] text-blue-400/30">
                            {new Date(log.timestamp).toLocaleTimeString()}
                          </span>
                        </div>
                        <pre className={`text-[11px] whitespace-pre-wrap break-words font-mono ${logColor(log.type)}`}>
                          {log.message}
                        </pre>
                      </div>
                    </div>
                  )
                })}
                <div ref={logsEndRef} />
              </div>
            </div>
          ) : (
            <div className="flex-1 flex flex-col items-center justify-center gap-4 text-blue-400/20">
              <svg width="60" height="60" viewBox="0 0 40 40" fill="none">
                <circle cx="20" cy="20" r="18.5" stroke="#06b6d4" strokeWidth="1" opacity="0.3"/>
                <circle cx="20" cy="20" r="12" stroke="#06b6d4" strokeWidth="0.8" opacity="0.2"/>
                <circle cx="20" cy="20" r="3.5" fill="#06b6d4" opacity="0.3"/>
              </svg>
              <div className="text-[11px] tracking-widest uppercase">Görev gir, ajanlar çalışsın</div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
