import { useRef, useState, Suspense, useEffect, useCallback } from 'react'
import { Canvas, useFrame } from '@react-three/fiber'
import { OrbitControls, Stars, Text, Float, Sparkles, MeshDistortMaterial } from '@react-three/drei'
import * as THREE from 'three'
import {
  Activity, Cpu, RotateCcw, X, Hash, Volume2, Users, MessageSquare,
  Zap, LogOut, Sun, Moon, Mic, ChevronDown, ChevronUp, Terminal, Maximize2
} from 'lucide-react'
import { api } from '../api'
import Dashboard from './Dashboard'
import UsersPage from './Users'
import Channels from './Channels'
import Messages from './Messages'

interface AnalyticsData {
  totalUsers: number; totalMessages: number; totalChannels: number
  messagesLastHour: number; messagesLastDay: number
  nodes: NodeData[]; recentUsers: any[]; serverTime: string; uptime: number
}
interface NodeData {
  id: string; name: string; type: 'TEXT' | 'VOICE'
  messageCount: number; angle: number; radius: number; intensity: number
}

// ─── ARC REACTOR ─────────────────────────────────────────────────────────────
function ArcReactorCore({ pulse }: { pulse: number }) {
  const group = useRef<THREE.Group>(null)
  const ring1 = useRef<THREE.Mesh>(null)
  const ring2 = useRef<THREE.Mesh>(null)
  const core  = useRef<THREE.Mesh>(null)
  useFrame((state: any, delta: number) => {
    const t = state.clock.elapsedTime
    if (ring1.current) ring1.current.rotation.z += delta * 1.2
    if (ring2.current) { ring2.current.rotation.x += delta * 0.7; ring2.current.rotation.y += delta * 1.0 }
    if (core.current)  { core.current.rotation.y += delta * 0.5; core.current.scale.setScalar(1 + Math.sin(t * 2 + pulse) * 0.06) }
    if (group.current) group.current.rotation.y += delta * 0.1
  })
  return (
    <group ref={group}>
      <mesh ref={ring1}><torusGeometry args={[1.4, 0.1, 12, 80]} /><MeshDistortMaterial color="#60a5fa" emissive="#3b82f6" emissiveIntensity={1.8} distort={0.08} speed={3} metalness={0.9} roughness={0.05} /></mesh>
      <mesh ref={ring2}><torusGeometry args={[0.9, 0.07, 8, 60]} /><meshStandardMaterial color="#a5f3fc" emissive="#06b6d4" emissiveIntensity={2.5} metalness={1} roughness={0} /></mesh>
      <mesh><torusGeometry args={[2.0, 0.04, 4, 100]} /><meshStandardMaterial color="#3b82f6" emissive="#3b82f6" emissiveIntensity={1} transparent opacity={0.5} /></mesh>
      <mesh ref={core}><icosahedronGeometry args={[0.32, 2]} /><MeshDistortMaterial color="#e0f2fe" emissive="#38bdf8" emissiveIntensity={4} distort={0.25} speed={4} /></mesh>
      <pointLight color="#6366f1" intensity={5} distance={8} />
      <pointLight color="#06b6d4" intensity={3} distance={5} position={[0, 0, 1]} />
      <Sparkles count={50} scale={4} size={1.2} speed={0.3} color="#818cf8" />
    </group>
  )
}

// ─── CHANNEL DATA NODE ────────────────────────────────────────────────────────
function DataNode({ node, selected, onSelect }: { node: NodeData; selected: boolean; onSelect: (n: NodeData) => void }) {
  const mesh = useRef<THREE.Mesh>(null)
  const [hovered, setHovered] = useState(false)
  const x = Math.cos(node.angle) * node.radius
  const z = Math.sin(node.angle) * node.radius
  const baseColor = node.type === 'TEXT' ? '#06b6d4' : '#818cf8'
  const emissiveColor = node.type === 'TEXT' ? '#0891b2' : '#6366f1'
  const intensity = 0.5 + node.intensity * 2.5
  useFrame((state: any, delta: number) => {
    if (!mesh.current) return
    const target = selected ? 1.35 : hovered ? 1.15 : 1.0
    mesh.current.scale.lerp(new THREE.Vector3(target, target, target), 0.1)
    if (selected || hovered) {
      ;(mesh.current.material as THREE.MeshStandardMaterial).emissiveIntensity = intensity + Math.sin(state.clock.elapsedTime * 3) * 0.5
    }
  })
  return (
    <Float speed={1.2} floatIntensity={0.4} rotationIntensity={0.1}>
      <group position={[x, 0, z]}>
        <mesh rotation={[0, -node.angle, 0]}>
          <boxGeometry args={[node.radius - 0.3, 0.008, 0.008]} />
          <meshStandardMaterial color={baseColor} emissive={baseColor} emissiveIntensity={0.8} transparent opacity={0.3} />
        </mesh>
        <mesh ref={mesh} onClick={() => onSelect(node)}
          onPointerOver={() => { setHovered(true); document.body.style.cursor = 'pointer' }}
          onPointerOut={() => { setHovered(false); document.body.style.cursor = 'auto' }}>
          <boxGeometry args={[0.5, 0.5, 0.5]} />
          <meshStandardMaterial color={baseColor} emissive={emissiveColor} emissiveIntensity={intensity} metalness={0.8} roughness={0.1} transparent opacity={selected ? 1 : 0.85} />
        </mesh>
        <Text position={[0, 0.55, 0]} fontSize={0.12} color={selected ? '#ffffff' : '#93c5fd'} anchorX="center" anchorY="bottom" font={undefined}>{node.name.toUpperCase()}</Text>
        <Text position={[0, -0.55, 0]} fontSize={0.09} color="#64748b" anchorX="center" anchorY="top" font={undefined}>{node.messageCount} msgs</Text>
        {selected && <pointLight color={baseColor} intensity={3} distance={3} />}
      </group>
    </Float>
  )
}

// ─── NAV NODE — dış halkada menü kutusu ──────────────────────────────────────
const NAV_ITEMS = [
  { id: 'overview',  label: 'OVERVIEW',     sub: 'sys.dashboard', tag: 'SYS', color: '#06b6d4', emissive: '#0891b2' },
  { id: 'personnel', label: 'PERSONNEL',    sub: 'sys.users',     tag: 'USR', color: '#818cf8', emissive: '#6366f1' },
  { id: 'channels',  label: 'CHANNELS',     sub: 'sys.comms',     tag: 'COM', color: '#34d399', emissive: '#059669' },
  { id: 'messages',  label: 'MESSAGE LOG',  sub: 'sys.archive',   tag: 'LOG', color: '#f59e0b', emissive: '#d97706' },
  { id: 'voice',     label: 'VOICE HIST',   sub: 'sys.voice',     tag: 'VOX', color: '#f472b6', emissive: '#db2777' },
]

function NavNode({ item, index, total, active, onClick }: {
  item: typeof NAV_ITEMS[0]; index: number; total: number; active: boolean; onClick: () => void
}) {
  const mesh = useRef<THREE.Mesh>(null)
  const [hovered, setHovered] = useState(false)
  const angle = (index / total) * Math.PI * 2 - Math.PI / 2
  const radius = 6.5
  const x = Math.cos(angle) * radius
  const z = Math.sin(angle) * radius

  useFrame((state: any, delta: number) => {
    if (!mesh.current) return
    const target = active ? 1.4 : hovered ? 1.2 : 1.0
    mesh.current.scale.lerp(new THREE.Vector3(target, target, target), 0.12)
    const mat = mesh.current.material as THREE.MeshStandardMaterial
    mat.emissiveIntensity = active
      ? 2.5 + Math.sin(state.clock.elapsedTime * 4) * 0.5
      : hovered ? 1.8 : 0.8
  })

  return (
    <Float speed={0.8} floatIntensity={0.3} rotationIntensity={0.05}>
      <group position={[x, 0.5, z]}>
        <mesh ref={mesh} onClick={onClick}
          onPointerOver={() => { setHovered(true); document.body.style.cursor = 'pointer' }}
          onPointerOut={() => { setHovered(false); document.body.style.cursor = 'auto' }}>
          <boxGeometry args={[0.7, 0.7, 0.7]} />
          <meshStandardMaterial color={item.color} emissive={item.emissive} emissiveIntensity={0.8} metalness={0.9} roughness={0.05} transparent opacity={active ? 1 : 0.85} />
        </mesh>
        <Text position={[0, 0.7, 0]} fontSize={0.13} color={active ? '#ffffff' : item.color} anchorX="center" anchorY="bottom" font={undefined}>{item.label}</Text>
        <Text position={[0, -0.65, 0]} fontSize={0.09} color="#475569" anchorX="center" anchorY="top" font={undefined}>{item.sub}</Text>
        {(active || hovered) && <pointLight color={item.color} intensity={2.5} distance={2.5} />}
      </group>
    </Float>
  )
}

function OrbitRings() {
  const r1 = useRef<THREE.Mesh>(null); const r2 = useRef<THREE.Mesh>(null); const r3 = useRef<THREE.Mesh>(null)
  useFrame((_: any, d: number) => {
    if (r1.current) r1.current.rotation.z += d * 0.25
    if (r2.current) r2.current.rotation.x += d * 0.15
    if (r3.current) r3.current.rotation.y += d * 0.1
  })
  return (<>
    <mesh ref={r1} rotation={[0.3, 0, 0]}><torusGeometry args={[3.5, 0.012, 4, 120]} /><meshStandardMaterial color="#3b82f6" emissive="#3b82f6" emissiveIntensity={1.2} transparent opacity={0.4} /></mesh>
    <mesh ref={r2} rotation={[1.1, 0, 0]}><torusGeometry args={[4.2, 0.01, 4, 120]} /><meshStandardMaterial color="#6366f1" emissive="#6366f1" emissiveIntensity={1} transparent opacity={0.3} /></mesh>
    <mesh ref={r3} rotation={[0.7, 0, 0]}><torusGeometry args={[5.0, 0.008, 4, 120]} /><meshStandardMaterial color="#06b6d4" emissive="#06b6d4" emissiveIntensity={0.8} transparent opacity={0.25} /></mesh>
  </>)
}

function HoloFloor() {
  return (<>
    <gridHelper args={[30, 30, '#1e3a8a', '#0f172a']} position={[0, -3.2, 0]} />
    <mesh position={[0, -3.21, 0]} rotation={[-Math.PI / 2, 0, 0]}><planeGeometry args={[30, 30]} /><meshStandardMaterial color="#1e40af" transparent opacity={0.04} /></mesh>
  </>)
}

function Particles() {
  const ref = useRef<THREE.Points>(null)
  const count = 600
  const pos = new Float32Array(count * 3)
  for (let i = 0; i < count; i++) {
    const r = 5 + Math.random() * 10; const theta = Math.random() * Math.PI * 2; const phi = Math.random() * Math.PI
    pos[i*3] = r*Math.sin(phi)*Math.cos(theta); pos[i*3+1] = (Math.random()-0.5)*12; pos[i*3+2] = r*Math.sin(phi)*Math.sin(theta)
  }
  useFrame((_: any, d: number) => { if (ref.current) ref.current.rotation.y += d * 0.025 })
  return (
    <points ref={ref}>
      <bufferGeometry><bufferAttribute attach="attributes-position" args={[pos, 3]} /></bufferGeometry>
      <pointsMaterial size={0.035} color="#60a5fa" transparent opacity={0.6} sizeAttenuation />
    </points>
  )
}

const JARVIS_LINES = [
  'All systems nominal, Mr. Stark.',
  'Arc reactor output: 3 gigajoules per second.',
  'Structural integrity at 100%.',
  'Network latency: 2ms. Encryption: active.',
  'Running diagnostics on Mark II...',
  'Click outer nodes to access system modules.',
]

function useJarvis() {
  const [idx, setIdx] = useState(0); const [typed, setTyped] = useState('')
  useEffect(() => {
    const target = JARVIS_LINES[idx]; let i = 0; setTyped('')
    const iv = setInterval(() => { i++; setTyped(target.slice(0, i)); if (i >= target.length) { clearInterval(iv); setTimeout(() => setIdx(n => (n+1) % JARVIS_LINES.length), 2200) } }, 38)
    return () => clearInterval(iv)
  }, [idx])
  return typed
}

// ─── VDS TERMINAL ─────────────────────────────────────────────────────────────
function VdsTerminal({ onClose }: { onClose: () => void }) {
  const [lines, setLines] = useState<string[]>(['Connecting to VDS 213.142.151.173...', 'Type commands below.'])
  const [input, setInput] = useState('')
  const [connected, setConnected] = useState(false)
  const bottomRef = useRef<HTMLDivElement>(null)
  const API_URL = ''

  useEffect(() => {
    // Simulated connection — real SSH needs backend websocket proxy
    setTimeout(() => {
      setLines(l => [...l, 'Connected. root@ubuntu:~/stark-industries-chat#'])
      setConnected(true)
    }, 800)
  }, [])

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [lines])

  const runCommand = async (cmd: string) => {
    setLines(l => [...l, `$ ${cmd}`])
    try {
      const res = await fetch(`${API_URL}/api/admin/terminal`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ command: cmd })
      })
      if (res.ok) {
        const data = await res.json()
        setLines(l => [...l, ...(data.output || 'Done').split('\n')])
      } else {
        setLines(l => [...l, 'Error: command failed'])
      }
    } catch {
      setLines(l => [...l, 'Error: cannot reach backend terminal endpoint'])
    }
  }

  const handleKey = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && input.trim()) {
      runCommand(input.trim())
      setInput('')
    }
  }

  return (
    <div className="flex flex-col h-full">
      <div className="flex items-center justify-between px-4 py-2 shrink-0" style={{ borderBottom: '1px solid rgba(59,130,246,0.2)', background: 'rgba(2,4,9,0.9)' }}>
        <div className="flex items-center gap-2">
          <Terminal size={13} className="text-blue-400" />
          <span className="text-[10px] font-mono text-blue-300 tracking-widest">VDS TERMINAL — 213.142.151.173</span>
          <div className={`w-1.5 h-1.5 rounded-full ${connected ? 'bg-green-400' : 'bg-yellow-400 animate-pulse'}`} />
        </div>
        <button onClick={onClose} className="p-1 text-blue-400/40 hover:text-white transition-colors"><X size={14} /></button>
      </div>
      <div className="flex-1 overflow-y-auto p-3 font-mono text-[11px] text-green-400 bg-black/80 space-y-0.5">
        {lines.map((l, i) => <div key={i} className={l.startsWith('$') ? 'text-blue-300' : l.startsWith('Error') ? 'text-red-400' : 'text-green-400'}>{l}</div>)}
        <div ref={bottomRef} />
      </div>
      <div className="flex items-center gap-2 px-3 py-2 shrink-0" style={{ borderTop: '1px solid rgba(59,130,246,0.15)', background: 'rgba(0,0,0,0.6)' }}>
        <span className="text-blue-400 font-mono text-[11px]">$</span>
        <input
          value={input}
          onChange={e => setInput(e.target.value)}
          onKeyDown={handleKey}
          placeholder="komut gir..."
          className="flex-1 bg-transparent text-green-300 font-mono text-[11px] outline-none placeholder-green-900"
          autoFocus
        />
      </div>
    </div>
  )
}

// ─── VOICE HISTORY MODAL ──────────────────────────────────────────────────────
function VoiceHistoryModal({ token, onClose }: { token: string; onClose: () => void }) {
  const [history, setHistory] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  useEffect(() => {
    api(token).get('/api/admin/voice-history').then(r => { setHistory(r.data); setLoading(false) }).catch(() => setLoading(false))
  }, [token])
  return (
    <div className="fixed inset-0 z-[200] flex items-center justify-center bg-black/70 backdrop-blur-sm">
      <div className="w-full max-w-2xl mx-4 rounded-xl overflow-hidden shadow-2xl" style={{ background: '#020409', border: '1px solid rgba(59,130,246,0.2)' }}>
        <div className="flex items-center justify-between px-6 py-4 border-b border-blue-900/30">
          <div className="flex items-center gap-2">
            <Mic size={14} className="text-blue-400" />
            <span className="text-blue-300 font-mono text-sm tracking-widest">VOICE CHANNEL HISTORY</span>
          </div>
          <button onClick={onClose} className="p-1 text-blue-400/40 hover:text-white transition-colors"><X size={16} /></button>
        </div>
        <div className="p-6 max-h-[60vh] overflow-y-auto">
          {loading ? <div className="text-center text-blue-400/40 font-mono text-sm py-8">Loading...</div>
          : history.length === 0 ? <div className="text-center text-blue-400/40 font-mono text-sm py-8">No voice history.</div>
          : history.map((h: any, i: number) => (
            <div key={i} className="flex items-center justify-between py-3 border-b border-blue-900/20 last:border-0">
              <div className="flex items-center gap-3">
                <Volume2 size={13} className="text-blue-400/50" />
                <div>
                  <div className="text-blue-300 text-xs font-mono">{h.channelName}</div>
                  <div className="text-blue-400/40 text-[10px] font-mono">{h.username}</div>
                </div>
              </div>
              <div className="text-[9px] text-blue-400/30 font-mono">{new Date(h.joinedAt || h.createdAt).toLocaleString()}</div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}

// ─── MAIN EXPORT ──────────────────────────────────────────────────────────────
export default function Scene3D({ token, admin, onLogout }: { token?: string; admin?: any; onLogout?: () => void }) {
  const [data, setData] = useState<AnalyticsData | null>(null)
  const [selectedNode, setSelectedNode] = useState<NodeData | null>(null)
  const [loading, setLoading] = useState(true)
  const [lastRefresh, setLastRefresh] = useState(new Date())
  const [activeModal, setActiveModal] = useState<string | null>(null)
  const [whiteMode, setWhiteMode] = useState(false)
  const [hudOpen, setHudOpen] = useState(true)
  const [terminalOpen, setTerminalOpen] = useState(false)
  const [terminalHeight, setTerminalHeight] = useState(220)
  const jarvisText = useJarvis()

  const fetchData = useCallback(async () => {
    if (!token) return
    try {
      const res = await api(token).get('/api/admin/analytics')
      setData(res.data); setLastRefresh(new Date())
    } catch (e) { console.error(e) }
    finally { setLoading(false) }
  }, [token])

  useEffect(() => {
    fetchData()
    const interval = setInterval(fetchData, 15000)
    return () => clearInterval(interval)
  }, [fetchData])

  const handleSelectNode = useCallback((node: NodeData) => {
    setSelectedNode((prev: NodeData | null) => prev?.id === node.id ? null : node)
  }, [])

  const borderColor = whiteMode ? 'rgba(0,180,200,0.3)' : 'rgba(59,130,246,0.2)'
  const panelBg = whiteMode ? 'rgba(255,255,255,0.7)' : 'rgba(2,4,9,0.88)'
  const textColor = whiteMode ? '#1e293b' : '#93c5fd'

  return (
    <div className="h-screen flex flex-col overflow-hidden" style={{ background: whiteMode ? 'linear-gradient(135deg,#b8c4ce,#d0d8e0)' : '#020409' }}>

      {/* ── TOP BAR ── */}
      <div className="flex items-center justify-between px-4 md:px-6 py-2.5 shrink-0 z-20"
        style={{ borderBottom: `1px solid ${borderColor}`, background: panelBg, backdropFilter: 'blur(10px)' }}>
        <div className="flex items-center gap-3">
          {/* Logo */}
          <svg width="28" height="28" viewBox="0 0 28 28" fill="none">
            <circle cx="14" cy="14" r="13" stroke="#60a5fa" strokeWidth="1.5" opacity="0.6"/>
            <circle cx="14" cy="14" r="8" stroke="#06b6d4" strokeWidth="1" opacity="0.8"/>
            <circle cx="14" cy="14" r="3.5" fill="#38bdf8" opacity="0.9"/>
            <line x1="14" y1="1" x2="14" y2="5" stroke="#60a5fa" strokeWidth="1.5"/>
            <line x1="14" y1="23" x2="14" y2="27" stroke="#60a5fa" strokeWidth="1.5"/>
            <line x1="1" y1="14" x2="5" y2="14" stroke="#60a5fa" strokeWidth="1.5"/>
            <line x1="23" y1="14" x2="27" y2="14" stroke="#60a5fa" strokeWidth="1.5"/>
          </svg>
          <div>
            <div className="font-bold text-xs tracking-widest uppercase" style={{ color: textColor }}>S.I. MAINFRAME</div>
            <div className="text-[8px] tracking-widest hidden md:block" style={{ color: whiteMode ? '#94a3b8' : 'rgba(96,165,250,0.4)' }}>HOLOGRAPHIC INTERFACE</div>
          </div>
          {loading && <div className="w-1.5 h-1.5 rounded-full bg-blue-400 animate-pulse" />}
        </div>

        <div className="flex items-center gap-2">
          <span className="text-[9px] font-mono hidden md:block" style={{ color: 'rgba(96,165,250,0.3)' }}>{lastRefresh.toLocaleTimeString()}</span>
          <button onClick={fetchData} className="flex items-center gap-1 px-2.5 py-1.5 text-[10px] font-mono transition-all"
            style={{ color: 'rgba(96,165,250,0.6)', border: `1px solid ${borderColor}` }}>
            <RotateCcw size={10} /> <span className="hidden md:inline">REFRESH</span>
          </button>
          <button onClick={() => setTerminalOpen(t => !t)} className="flex items-center gap-1 px-2.5 py-1.5 text-[10px] font-mono transition-all"
            style={{ color: terminalOpen ? '#34d399' : 'rgba(96,165,250,0.6)', border: `1px solid ${terminalOpen ? 'rgba(52,211,153,0.4)' : borderColor}` }}>
            <Terminal size={10} /> <span className="hidden md:inline">TERMINAL</span>
          </button>
          <button onClick={() => setWhiteMode((w: boolean) => !w)} className="p-1.5 transition-colors" style={{ color: whiteMode ? '#0d9488' : '#60a5fa', border: `1px solid ${borderColor}` }}>
            {whiteMode ? <Moon size={12} /> : <Sun size={12} />}
          </button>
          <div className="flex items-center gap-1.5 px-2 py-1 rounded" style={{ background: 'rgba(59,130,246,0.05)', border: `1px solid ${borderColor}` }}>
            <div className="w-5 h-5 rounded-full flex items-center justify-center text-[9px] font-bold" style={{ background: 'rgba(59,130,246,0.2)', color: textColor }}>
              {admin?.username?.[0]?.toUpperCase()}
            </div>
            <span className="text-[9px] font-mono hidden md:block" style={{ color: textColor }}>{admin?.username?.toUpperCase()}</span>
          </div>
          <button onClick={onLogout} className="p-1.5 text-red-400/50 hover:text-red-400 transition-colors" style={{ border: `1px solid ${borderColor}` }}>
            <LogOut size={12} />
          </button>
        </div>
      </div>

      {/* ── 3D CANVAS ── */}
      <div className="flex-1 relative overflow-hidden">
        <Canvas camera={{ position: [0, 4, 14], fov: 52 }} gl={{ antialias: true, alpha: false }}>
          <color attach="background" args={[whiteMode ? '#c8d4dc' : '#020409']} />
          <fog attach="fog" args={[whiteMode ? '#c8d4dc' : '#020409', 22, 48]} />
          <ambientLight intensity={whiteMode ? 0.5 : 0.08} color={whiteMode ? '#ffffff' : '#1e40af'} />
          <directionalLight position={[5, 8, 5]} intensity={whiteMode ? 1 : 0.25} color={whiteMode ? '#ffffff' : '#60a5fa'} />
          <Suspense fallback={null}>
            <Stars radius={70} depth={60} count={3000} factor={2} saturation={0} fade speed={0.25} />
            <ArcReactorCore pulse={data?.messagesLastHour ?? 0} />
            <OrbitRings />
            {data?.nodes.map(node => (
              <DataNode key={node.id} node={node} selected={selectedNode?.id === node.id} onSelect={handleSelectNode} />
            ))}
            {NAV_ITEMS.map((item, i) => (
              <NavNode key={item.id} item={item} index={i} total={NAV_ITEMS.length}
                active={activeModal === item.id}
                onClick={() => setActiveModal(activeModal === item.id ? null : item.id)} />
            ))}
            <HoloFloor />
            <Particles />
          </Suspense>
          <OrbitControls enablePan={false} minDistance={5} maxDistance={24} maxPolarAngle={Math.PI / 1.75}
            autoRotate={!selectedNode && !activeModal} autoRotateSpeed={0.2} />
        </Canvas>

        {/* Left HUD */}
        <div className="absolute top-4 left-4 pointer-events-none space-y-2.5">
          {[
            { label: 'TOTAL USERS',    value: data?.totalUsers ?? '—',       icon: Users,         color: whiteMode ? '#0d9488' : '#60a5fa' },
            { label: 'TOTAL MESSAGES', value: data?.totalMessages ?? '—',    icon: MessageSquare, color: whiteMode ? '#0891b2' : '#22d3ee' },
            { label: 'CHANNELS',       value: data?.totalChannels ?? '—',    icon: Hash,          color: whiteMode ? '#6366f1' : '#818cf8' },
            { label: 'MSGS/HOUR',      value: data?.messagesLastHour ?? '—', icon: Zap,           color: whiteMode ? '#059669' : '#34d399' },
          ].map(({ label, value, icon: Icon, color }) => (
            <div key={label} className="flex items-center gap-2">
              <div className="w-px h-7" style={{ background: 'rgba(59,130,246,0.3)' }} />
              <div>
                <div className="text-[8px] font-mono tracking-widest" style={{ color: 'rgba(96,165,250,0.5)' }}>{label}</div>
                <div className="text-xs font-mono font-bold flex items-center gap-1" style={{ color }}>
                  <Icon size={10} className="opacity-60" /> {value}
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Right HUD — açılır/kapanır */}
        <div className="absolute top-4 right-4 pointer-events-auto">
          <button onClick={() => setHudOpen(h => !h)} className="flex items-center gap-1.5 px-3 py-1.5 mb-1 text-[9px] font-mono transition-all ml-auto"
            style={{ background: panelBg, border: `1px solid ${borderColor}`, color: textColor, backdropFilter: 'blur(8px)' }}>
            {hudOpen ? <ChevronUp size={10} /> : <ChevronDown size={10} />}
            SYS INFO
          </button>
          {hudOpen && (
            <div className="text-right space-y-2" style={{ pointerEvents: 'none' }}>
              {[
                { label: 'MARK', value: 'II' },
                { label: 'VERSION', value: '2.6.1' },
                { label: 'UPTIME', value: data ? Math.floor(data.uptime/3600)+'h '+Math.floor((data.uptime%3600)/60)+'m' : '—' },
                { label: 'STATUS', value: 'ACTIVE' },
              ].map(({ label, value }) => (
                <div key={label} className="flex items-center justify-end gap-2">
                  <div>
                    <div className="text-[8px] font-mono tracking-widest" style={{ color: 'rgba(96,165,250,0.5)' }}>{label}</div>
                    <div className="text-xs font-mono font-bold" style={{ color: whiteMode ? '#1e40af' : '#93c5fd' }}>{value}</div>
                  </div>
                  <div className="w-px h-7" style={{ background: 'rgba(59,130,246,0.3)' }} />
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Node detail */}
        {selectedNode && (
          <div className="absolute top-4 right-4 w-64 pointer-events-auto" style={{ top: hudOpen ? '180px' : '60px' }}>
            <div className="rounded-xl overflow-hidden shadow-2xl" style={{ background: 'rgba(2,4,9,0.92)', border: '1px solid rgba(59,130,246,0.2)', backdropFilter: 'blur(16px)' }}>
              <div className="flex items-center justify-between px-4 py-3" style={{ borderBottom: '1px solid rgba(59,130,246,0.1)' }}>
                <div>
                  <div className="text-xs font-bold text-white">{selectedNode.name}</div>
                  <div className="text-[9px] font-mono text-blue-400/50">{selectedNode.type} CHANNEL</div>
                </div>
                <button onClick={() => setSelectedNode(null)} className="p-1 text-blue-400/40 hover:text-white"><X size={13} /></button>
              </div>
              <div className="p-3 space-y-2">
                {[
                  { label: 'Messages', value: selectedNode.messageCount, icon: MessageSquare },
                  { label: 'Activity', value: `${(selectedNode.intensity*100).toFixed(1)}%`, icon: Activity },
                  { label: 'Angle', value: `${(selectedNode.angle*180/Math.PI).toFixed(1)}°`, icon: Cpu },
                ].map(({ label, value, icon: Icon }) => (
                  <div key={label} className="flex items-center justify-between">
                    <div className="flex items-center gap-1.5 text-[10px] text-blue-400/60"><Icon size={10} />{label}</div>
                    <div className="text-[10px] font-mono font-bold text-blue-300">{value}</div>
                  </div>
                ))}
                <div className="h-1 rounded-full overflow-hidden mt-1" style={{ background: '#1e3a8a' }}>
                  <div className="h-full rounded-full" style={{ width: `${selectedNode.intensity*100}%`, background: selectedNode.type === 'TEXT' ? 'linear-gradient(90deg,#0891b2,#06b6d4)' : 'linear-gradient(90deg,#4f46e5,#818cf8)' }} />
                </div>
              </div>
            </div>
          </div>
        )}

        {/* JARVIS bar */}
        <div className="absolute bottom-0 left-0 right-0 pointer-events-none px-4 pb-3">
          <div className="rounded-xl px-4 py-2.5 flex items-center gap-4" style={{ background: 'rgba(2,4,9,0.75)', border: '1px solid rgba(59,130,246,0.15)', backdropFilter: 'blur(8px)' }}>
            <div className="flex items-center gap-1.5 shrink-0">
              <div className="flex gap-0.5">
                {[0,1,2].map(i => <div key={i} className="w-0.5 bg-blue-400 rounded-full animate-pulse" style={{ height: `${8+i*3}px`, animationDelay: `${i*120}ms` }} />)}
              </div>
              <span className="text-[9px] text-blue-500/70 font-mono tracking-widest">J.A.R.V.I.S.</span>
            </div>
            <span className="text-[9px] text-blue-400/50 font-mono flex-1 truncate">{jarvisText}<span className="animate-pulse">_</span></span>
            <span className="text-[8px] text-blue-400/20 font-mono shrink-0 hidden md:block">CLICK OUTER NODES</span>
          </div>
        </div>

        {/* Corner decos */}
        {['top-0 left-0 border-t border-l','top-0 right-0 border-t border-r','bottom-0 left-0 border-b border-l','bottom-0 right-0 border-b border-r'].map((cls, i) => (
          <div key={i} className={`absolute ${cls} w-6 h-6 border-blue-500/30 pointer-events-none`} />
        ))}
      </div>

      {/* ── VDS TERMINAL (alt panel) ── */}
      {terminalOpen && (
        <div className="shrink-0 z-20" style={{ height: terminalHeight, borderTop: '1px solid rgba(52,211,153,0.3)', background: 'rgba(0,0,0,0.95)' }}>
          <VdsTerminal onClose={() => setTerminalOpen(false)} />
        </div>
      )}

      {/* ── MODALS ── */}
      {activeModal && activeModal !== 'voice' && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 backdrop-blur-sm" onClick={() => setActiveModal(null)}>
          <div className="relative w-full max-w-5xl max-h-[85vh] mx-4 rounded-xl overflow-hidden shadow-2xl flex flex-col"
            style={{ background: whiteMode ? 'linear-gradient(135deg,#b8c4ce,#d0d8e0)' : '#0a0f1a', border: `1px solid ${borderColor}` }}
            onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between px-6 py-3 shrink-0" style={{ borderBottom: `1px solid ${borderColor}`, background: panelBg }}>
              <div className="flex items-center gap-2">
                <div className="w-1.5 h-1.5 rounded-full bg-blue-400 animate-pulse" />
                <span className="font-mono text-xs tracking-widest uppercase" style={{ color: textColor }}>
                  {NAV_ITEMS.find(n => n.id === activeModal)?.label}
                </span>
              </div>
              <button onClick={() => setActiveModal(null)} className="p-1 transition-colors text-blue-400/40 hover:text-white"><X size={16} /></button>
            </div>
            <div className="flex-1 overflow-y-auto">
              {activeModal === 'overview'  && <Dashboard token={token!} />}
              {activeModal === 'personnel' && <UsersPage token={token!} />}
              {activeModal === 'channels'  && <Channels token={token!} />}
              {activeModal === 'messages'  && <Messages token={token!} />}
            </div>
          </div>
        </div>
      )}

      {activeModal === 'voice' && token && (
        <VoiceHistoryModal token={token} onClose={() => setActiveModal(null)} />
      )}
    </div>
  )
}
