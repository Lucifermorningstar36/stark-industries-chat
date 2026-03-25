import { useRef, useState, Suspense, useEffect, useCallback } from 'react'
import { Canvas, useFrame } from '@react-three/fiber'
import { OrbitControls, Stars, Text, Float, Sparkles, MeshDistortMaterial } from '@react-three/drei'
import * as THREE from 'three'
import {
  Activity, Cpu, Layers, RotateCcw, X, Hash, Volume2, Users, MessageSquare,
  Zap, Server, LayoutDashboard, Shield, LogOut, Sun, Moon, Folder, Mic
} from 'lucide-react'
import { api } from '../api'
import Dashboard from './Dashboard'
import UsersPage from './Users'
import Channels from './Channels'
import Messages from './Messages'

// ─── TYPES ───────────────────────────────────────────────────────────────────
interface AnalyticsData {
  totalUsers: number; totalMessages: number; totalChannels: number
  messagesLastHour: number; messagesLastDay: number
  nodes: NodeData[]; recentUsers: any[]; serverTime: string; uptime: number
}
interface NodeData {
  id: string; name: string; type: 'TEXT' | 'VOICE'
  messageCount: number; angle: number; radius: number; intensity: number
}

// ─── 3D COMPONENTS ───────────────────────────────────────────────────────────
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
    <gridHelper args={[24, 24, '#1e3a8a', '#0f172a']} position={[0, -3.2, 0]} />
    <mesh position={[0, -3.21, 0]} rotation={[-Math.PI / 2, 0, 0]}><planeGeometry args={[24, 24]} /><meshStandardMaterial color="#1e40af" transparent opacity={0.04} /></mesh>
  </>)
}

function Particles() {
  const ref = useRef<THREE.Points>(null)
  const count = 600
  const pos = new Float32Array(count * 3)
  for (let i = 0; i < count; i++) {
    const r = 4 + Math.random() * 9; const theta = Math.random() * Math.PI * 2; const phi = Math.random() * Math.PI
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
  'Repulsor array calibrated.',
  'Running diagnostics on Mark II...',
  'Network latency: 2ms.',
  'Encryption protocols: active.',
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

// ─── VOICE HISTORY MODAL ─────────────────────────────────────────────────────
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
          {loading ? (
            <div className="text-center text-blue-400/40 font-mono text-sm py-8">Loading records...</div>
          ) : history.length === 0 ? (
            <div className="text-center text-blue-400/40 font-mono text-sm py-8">No voice history found.</div>
          ) : history.map((h: any, i: number) => (
            <div key={i} className="flex items-center justify-between py-3 border-b border-blue-900/20 last:border-0">
              <div className="flex items-center gap-3">
                <Volume2 size={13} className="text-blue-400/50" />
                <div>
                  <div className="text-blue-300 text-xs font-mono">{h.channelName || h.channelId}</div>
                  <div className="text-blue-400/40 text-[10px] font-mono">{h.username} — {h.duration ? `${Math.floor(h.duration/60)}m ${h.duration%60}s` : 'session'}</div>
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

// ─── SIDEBAR NAV ITEMS ────────────────────────────────────────────────────────
const NAV_ITEMS = [
  { id: 'overview',  icon: LayoutDashboard, label: 'OVERVIEW',     sub: 'sys.dashboard', tag: 'SYS' },
  { id: 'personnel', icon: Users,           label: 'PERSONNEL',    sub: 'sys.users',     tag: 'USR' },
  { id: 'channels',  icon: Hash,            label: 'CHANNELS',     sub: 'sys.comms',     tag: 'COM' },
  { id: 'messages',  icon: MessageSquare,   label: 'MESSAGE LOG',  sub: 'sys.archive',   tag: 'LOG' },
  { id: 'voice',     icon: Volume2,         label: 'VOICE HISTORY',sub: 'sys.voice',     tag: 'VOX' },
]

// ─── MAIN EXPORT ──────────────────────────────────────────────────────────────
export default function Scene3D({ token, admin, onLogout }: { token?: string; admin?: any; onLogout?: () => void }) {
  const [data, setData] = useState<AnalyticsData | null>(null)
  const [selectedNode, setSelectedNode] = useState<NodeData | null>(null)
  const [loading, setLoading] = useState(true)
  const [lastRefresh, setLastRefresh] = useState(new Date())
  const [activeModal, setActiveModal] = useState<string | null>(null)
  const [whiteMode, setWhiteMode] = useState(false)
  const jarvisText = useJarvis()

  const fetchData = useCallback(async () => {
    if (!token) return
    try {
      const res = await api(token).get('/api/admin/analytics')
      setData(res.data); setLastRefresh(new Date())
    } catch (e) { console.error('Analytics fetch failed', e) }
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

  const openModal = (id: string) => {
    if (id === 'voice') { setActiveModal('voice'); return }
    setActiveModal(id)
  }

  const bg = whiteMode ? 'linear-gradient(135deg, #b8c4ce 0%, #c8d4dc 40%, #d0d8e0 100%)' : '#020409'
  const textColor = whiteMode ? '#1e293b' : '#93c5fd'
  const borderColor = whiteMode ? 'rgba(0,180,200,0.3)' : 'rgba(59,130,246,0.2)'
  const panelBg = whiteMode ? 'rgba(255,255,255,0.6)' : 'rgba(2,4,9,0.85)'

  return (
    <div className="h-screen flex overflow-hidden" style={{ background: bg }}>

      {/* ── SIDEBAR ── */}
      <aside className="w-64 shrink-0 flex flex-col" style={{ background: panelBg, borderRight: `1px solid ${borderColor}`, backdropFilter: 'blur(12px)' }}>
        {/* Logo */}
        <div className="px-5 py-5" style={{ borderBottom: `1px solid ${borderColor}` }}>
          <div className="flex items-center gap-2 mb-1">
            <div className="w-2 h-2 rounded-full bg-blue-400 shadow-[0_0_8px_rgba(96,165,250,0.8)]" />
            <span className="text-[9px] tracking-[0.3em] uppercase font-medium" style={{ color: whiteMode ? '#64748b' : 'rgba(96,165,250,0.5)' }}>Stark Industries</span>
          </div>
          <div className="font-bold text-base tracking-widest uppercase" style={{ color: textColor }}>S.I. MAINFRAME</div>
          <div className="text-[9px] tracking-widest mt-0.5" style={{ color: whiteMode ? '#94a3b8' : 'rgba(59,130,246,0.4)' }}>RESTRICTED — LEVEL 7</div>
        </div>

        {/* Status */}
        <div className="px-5 py-3" style={{ borderBottom: `1px solid ${borderColor}` }}>
          <div className="text-[9px] tracking-widest mb-2 uppercase" style={{ color: whiteMode ? '#94a3b8' : 'rgba(96,165,250,0.4)' }}>System Status</div>
          {['MAINFRAME', 'ENCRYPTION', 'FIREWALL'].map(s => (
            <div key={s} className="flex items-center justify-between py-0.5">
              <span className="text-[9px] tracking-wider" style={{ color: whiteMode ? '#94a3b8' : 'rgba(96,165,250,0.3)' }}>{s}</span>
              <span className="text-[9px] font-bold tracking-wider" style={{ color: whiteMode ? '#0d9488' : '#60a5fa' }}>ONLINE</span>
            </div>
          ))}
        </div>

        {/* Nav */}
        <nav className="flex-1 overflow-y-auto">
          <div className="text-[9px] tracking-[0.3em] px-5 py-3 uppercase" style={{ color: whiteMode ? '#94a3b8' : 'rgba(96,165,250,0.4)', borderBottom: `1px solid ${borderColor}` }}>Directory</div>
          {NAV_ITEMS.map(({ id, icon: Icon, label, sub, tag }) => (
            <button key={id} onClick={() => openModal(id)}
              className="w-full flex items-center gap-3 px-4 py-3 transition-all duration-150 text-left hover:opacity-80"
              style={{ borderLeft: activeModal === id ? `2px solid ${whiteMode ? '#0d9488' : '#60a5fa'}` : '2px solid transparent', background: activeModal === id ? (whiteMode ? 'rgba(13,148,136,0.08)' : 'rgba(59,130,246,0.08)') : 'transparent' }}>
              <Folder size={18} style={{ color: whiteMode ? '#94a3b8' : 'rgba(96,165,250,0.4)', flexShrink: 0 }} strokeWidth={1.5} />
              <div className="flex-1 min-w-0">
                <div className="text-xs font-semibold tracking-wide truncate" style={{ color: textColor }}>{label}</div>
                <div className="text-[9px] tracking-wider truncate" style={{ color: whiteMode ? '#94a3b8' : 'rgba(96,165,250,0.3)' }}>{sub}</div>
              </div>
              <span className="text-[8px] font-bold tracking-widest px-1.5 py-0.5 shrink-0"
                style={{ background: whiteMode ? 'rgba(13,148,136,0.1)' : 'rgba(59,130,246,0.1)', color: whiteMode ? '#0d9488' : '#60a5fa', border: `1px solid ${whiteMode ? 'rgba(13,148,136,0.3)' : 'rgba(59,130,246,0.2)'}` }}>
                {tag}
              </span>
            </button>
          ))}
        </nav>

        {/* User + controls */}
        <div className="p-4" style={{ borderTop: `1px solid ${borderColor}` }}>
          <div className="flex items-center gap-2 mb-3 p-2 rounded-lg" style={{ background: whiteMode ? 'rgba(255,255,255,0.5)' : 'rgba(59,130,246,0.05)', border: `1px solid ${borderColor}` }}>
            <div className="w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold" style={{ background: whiteMode ? 'rgba(13,148,136,0.2)' : 'rgba(59,130,246,0.2)', border: `1px solid ${borderColor}`, color: textColor }}>
              {admin?.username?.[0]?.toUpperCase()}
            </div>
            <div className="flex-1 min-w-0">
              <div className="text-xs font-bold truncate" style={{ color: textColor }}>{admin?.username?.toUpperCase()}</div>
              <div className="flex items-center gap-1 text-[9px]" style={{ color: whiteMode ? '#94a3b8' : 'rgba(96,165,250,0.4)' }}>
                <Shield size={8} style={{ color: whiteMode ? '#0d9488' : '#60a5fa' }} /> CLEARANCE LVL 7
              </div>
            </div>
            {/* White/Black toggle */}
            <button onClick={() => setWhiteMode(w => !w)} className="p-1.5 rounded transition-colors" style={{ color: whiteMode ? '#0d9488' : '#60a5fa' }} title="Toggle theme">
              {whiteMode ? <Moon size={14} /> : <Sun size={14} />}
            </button>
          </div>
          <button onClick={onLogout} className="w-full flex items-center justify-center gap-2 py-2 text-[10px] rounded transition-all tracking-widest"
            style={{ color: whiteMode ? '#94a3b8' : 'rgba(96,165,250,0.3)', border: `1px solid ${borderColor}` }}
            onMouseEnter={e => { e.currentTarget.style.color = '#f87171'; e.currentTarget.style.borderColor = 'rgba(248,113,113,0.3)' }}
            onMouseLeave={e => { e.currentTarget.style.color = whiteMode ? '#94a3b8' : 'rgba(96,165,250,0.3)'; e.currentTarget.style.borderColor = borderColor }}>
            <LogOut size={12} /> TERMINATE SESSION
          </button>
        </div>
      </aside>

      {/* ── 3D CANVAS ── */}
      <div className="flex-1 flex flex-col relative overflow-hidden">
        {/* Top bar */}
        <div className="flex items-center justify-between px-6 py-3 shrink-0" style={{ borderBottom: `1px solid ${borderColor}`, background: panelBg, backdropFilter: 'blur(8px)' }}>
          <div className="flex items-center gap-3">
            <div className="w-2 h-2 bg-blue-400 rounded-full animate-pulse shadow-[0_0_8px_rgba(96,165,250,0.8)]" />
            <span className="font-mono text-xs tracking-widest uppercase" style={{ color: textColor }}>Holographic Interface — Active</span>
            {loading && <span className="text-[9px] font-mono" style={{ color: 'rgba(96,165,250,0.5)' }}>Loading...</span>}
          </div>
          <div className="flex items-center gap-4">
            <span className="text-[9px] font-mono" style={{ color: 'rgba(96,165,250,0.3)' }}>Last sync: {lastRefresh.toLocaleTimeString()}</span>
            <button onClick={fetchData} className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-mono transition-all"
              style={{ color: 'rgba(96,165,250,0.6)', border: `1px solid ${borderColor}` }}
              onMouseEnter={e => e.currentTarget.style.color = '#93c5fd'}
              onMouseLeave={e => e.currentTarget.style.color = 'rgba(96,165,250,0.6)'}>
              <RotateCcw size={11} /> REFRESH
            </button>
            {selectedNode && (
              <button onClick={() => setSelectedNode(null)} className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-mono transition-all"
                style={{ color: 'rgba(96,165,250,0.6)', border: `1px solid ${borderColor}` }}>
                <Layers size={11} /> DESELECT
              </button>
            )}
          </div>
        </div>

        {/* Canvas */}
        <div className="flex-1 relative">
          <Canvas camera={{ position: [0, 3, 10], fov: 52 }} gl={{ antialias: true, alpha: false }}>
            <color attach="background" args={[whiteMode ? '#c8d4dc' : '#020409']} />
            <fog attach="fog" args={[whiteMode ? '#c8d4dc' : '#020409', 20, 40]} />
            <ambientLight intensity={whiteMode ? 0.5 : 0.08} color={whiteMode ? '#ffffff' : '#1e40af'} />
            <directionalLight position={[5, 8, 5]} intensity={whiteMode ? 1 : 0.25} color={whiteMode ? '#ffffff' : '#60a5fa'} />
            <Suspense fallback={null}>
              <Stars radius={70} depth={60} count={3000} factor={2} saturation={0} fade speed={0.25} />
              <ArcReactorCore pulse={data?.messagesLastHour ?? 0} />
              <OrbitRings />
              {data?.nodes.map(node => (
                <DataNode key={node.id} node={node} selected={selectedNode?.id === node.id} onSelect={handleSelectNode} />
              ))}
              <HoloFloor />
              <Particles />
            </Suspense>
            <OrbitControls enablePan={false} minDistance={4} maxDistance={20} maxPolarAngle={Math.PI / 1.75} autoRotate={!selectedNode} autoRotateSpeed={0.25} />
          </Canvas>

          {/* HUD */}
          <LeftHUD data={data} whiteMode={whiteMode} />
          {!selectedNode && <RightHUD data={data} whiteMode={whiteMode} />}
          {selectedNode && <NodeDetailPanel node={selectedNode} onClose={() => setSelectedNode(null)} />}

          {/* Activity log */}
          <div className="absolute bottom-5 left-5 right-5 pointer-events-none">
            <div className="rounded-xl px-5 py-3 flex items-center gap-6" style={{ background: 'rgba(2,4,9,0.7)', border: '1px solid rgba(59,130,246,0.15)', backdropFilter: 'blur(8px)' }}>
              <div className="flex items-center gap-2 shrink-0">
                <div className="flex gap-0.5">
                  {[0,1,2].map(i => <div key={i} className="w-0.5 bg-blue-400 rounded-full animate-pulse" style={{ height: `${8+i*3}px`, animationDelay: `${i*120}ms` }} />)}
                </div>
                <span className="text-[9px] text-blue-500/70 font-mono tracking-widest">J.A.R.V.I.S.</span>
              </div>
              <div className="flex-1 overflow-hidden">
                <span className="text-[9px] text-blue-400/50 font-mono tracking-wide">{jarvisText}<span className="animate-pulse">_</span></span>
              </div>
              {data && (
                <div className="text-[8px] text-blue-400/20 font-mono tracking-widest shrink-0 text-right">
                  <div>{data.nodes.length} NODES ACTIVE</div>
                  <div>DRAG TO ROTATE</div>
                </div>
              )}
            </div>
          </div>

          {/* Corner decos */}
          {['top-0 left-0 border-t border-l','top-0 right-0 border-t border-r','bottom-0 left-0 border-b border-l','bottom-0 right-0 border-b border-r'].map((cls, i) => (
            <div key={i} className={`absolute ${cls} w-8 h-8 border-blue-500/40 pointer-events-none`} />
          ))}
        </div>
      </div>

      {/* ── MODALS ── */}
      {activeModal && activeModal !== 'voice' && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 backdrop-blur-sm" onClick={() => setActiveModal(null)}>
          <div className="relative w-full max-w-5xl max-h-[85vh] mx-4 rounded-xl overflow-hidden shadow-2xl flex flex-col"
            style={{ background: whiteMode ? 'linear-gradient(135deg, #b8c4ce, #d0d8e0)' : '#0a0f1a', border: `1px solid ${borderColor}` }}
            onClick={e => e.stopPropagation()}>
            {/* Modal header */}
            <div className="flex items-center justify-between px-6 py-3 shrink-0" style={{ borderBottom: `1px solid ${borderColor}`, background: panelBg }}>
              <div className="flex items-center gap-2">
                <div className="w-1.5 h-1.5 rounded-full bg-blue-400 animate-pulse" />
                <span className="font-mono text-xs tracking-widest uppercase" style={{ color: textColor }}>
                  {NAV_ITEMS.find(n => n.id === activeModal)?.label}
                </span>
              </div>
              <button onClick={() => setActiveModal(null)} className="p-1 transition-colors" style={{ color: 'rgba(96,165,250,0.4)' }}
                onMouseEnter={e => e.currentTarget.style.color = '#ffffff'}
                onMouseLeave={e => e.currentTarget.style.color = 'rgba(96,165,250,0.4)'}>
                <X size={16} />
              </button>
            </div>
            {/* Modal content */}
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

// ─── HUD COMPONENTS ───────────────────────────────────────────────────────────
function LeftHUD({ data, whiteMode }: { data: AnalyticsData | null; whiteMode: boolean }) {
  const items = [
    { label: 'TOTAL USERS',    value: data?.totalUsers ?? '—',       icon: Users,         color: whiteMode ? '#0d9488' : '#60a5fa' },
    { label: 'TOTAL MESSAGES', value: data?.totalMessages ?? '—',    icon: MessageSquare, color: whiteMode ? '#0891b2' : '#22d3ee' },
    { label: 'ACTIVE CHANNELS',value: data?.totalChannels ?? '—',    icon: Hash,          color: whiteMode ? '#6366f1' : '#818cf8' },
    { label: 'MSGS / HOUR',    value: data?.messagesLastHour ?? '—', icon: Zap,           color: whiteMode ? '#059669' : '#34d399' },
  ]
  return (
    <div className="absolute top-5 left-5 pointer-events-none space-y-3">
      {items.map(({ label, value, icon: Icon, color }) => (
        <div key={label} className="flex items-center gap-3">
          <div className="w-px h-8" style={{ background: 'rgba(59,130,246,0.3)' }} />
          <div>
            <div className="text-[9px] font-mono tracking-widest" style={{ color: 'rgba(96,165,250,0.5)' }}>{label}</div>
            <div className="text-sm font-mono font-bold flex items-center gap-1.5" style={{ color }}>
              <Icon size={11} className="opacity-60" /> {value}
            </div>
          </div>
        </div>
      ))}
    </div>
  )
}

function RightHUD({ data, whiteMode }: { data: AnalyticsData | null; whiteMode: boolean }) {
  const uptime = data ? Math.floor(data.uptime / 3600) + 'h ' + Math.floor((data.uptime % 3600) / 60) + 'm' : '—'
  const items = [{ label: 'MARK', value: 'II' }, { label: 'VERSION', value: '2.6.1' }, { label: 'UPTIME', value: uptime }, { label: 'STATUS', value: 'ACTIVE' }]
  return (
    <div className="absolute top-5 right-5 pointer-events-none text-right space-y-3">
      {items.map(({ label, value }) => (
        <div key={label} className="flex items-center justify-end gap-3">
          <div>
            <div className="text-[9px] font-mono tracking-widest" style={{ color: 'rgba(96,165,250,0.5)' }}>{label}</div>
            <div className="text-sm font-mono font-bold" style={{ color: whiteMode ? '#1e40af' : '#93c5fd' }}>{value}</div>
          </div>
          <div className="w-px h-8" style={{ background: 'rgba(59,130,246,0.3)' }} />
        </div>
      ))}
    </div>
  )
}

function NodeDetailPanel({ node, onClose }: { node: NodeData; onClose: () => void }) {
  const isText = node.type === 'TEXT'
  const Icon = isText ? Hash : Volume2
  return (
    <div className="absolute top-5 right-5 w-72 pointer-events-auto animate-in fade-in slide-in-from-right-4 duration-200">
      <div className="rounded-xl overflow-hidden shadow-2xl" style={{ background: 'rgba(2,4,9,0.9)', border: '1px solid rgba(59,130,246,0.2)', backdropFilter: 'blur(16px)' }}>
        <div className="flex items-center justify-between px-4 py-3" style={{ borderBottom: '1px solid rgba(59,130,246,0.1)' }}>
          <div className="flex items-center gap-2">
            <div className="p-1.5 rounded border" style={{ background: isText ? 'rgba(6,182,212,0.1)' : 'rgba(129,140,248,0.1)', borderColor: isText ? 'rgba(6,182,212,0.3)' : 'rgba(129,140,248,0.3)', color: isText ? '#22d3ee' : '#818cf8' }}><Icon size={12} /></div>
            <div>
              <div className="text-xs font-bold text-white tracking-wide">{node.name}</div>
              <div className="text-[9px] font-mono tracking-widest" style={{ color: 'rgba(96,165,250,0.5)' }}>{node.type} CHANNEL</div>
            </div>
          </div>
          <button onClick={onClose} className="p-1 transition-colors" style={{ color: 'rgba(96,165,250,0.4)' }}><X size={14} /></button>
        </div>
        <div className="p-4 space-y-3">
          {[
            { label: 'Total Messages', value: node.messageCount, icon: MessageSquare },
            { label: 'Activity Level', value: `${(node.intensity * 100).toFixed(1)}%`, icon: Activity },
            { label: 'Node Angle', value: `${(node.angle * 180 / Math.PI).toFixed(1)}°`, icon: Cpu },
          ].map(({ label, value, icon: Icon }) => (
            <div key={label} className="flex items-center justify-between">
              <div className="flex items-center gap-2 text-[10px]" style={{ color: 'rgba(96,165,250,0.6)' }}><Icon size={11} /> {label}</div>
              <div className="text-xs font-mono font-bold" style={{ color: '#93c5fd' }}>{value}</div>
            </div>
          ))}
          <div className="mt-2">
            <div className="text-[9px] tracking-widest mb-1.5" style={{ color: 'rgba(96,165,250,0.4)' }}>ACTIVITY LEVEL</div>
            <div className="h-1.5 rounded-full overflow-hidden" style={{ background: '#1e3a8a' }}>
              <div className="h-full rounded-full transition-all duration-1000" style={{ width: `${node.intensity * 100}%`, background: isText ? 'linear-gradient(90deg, #0891b2, #06b6d4)' : 'linear-gradient(90deg, #4f46e5, #818cf8)' }} />
            </div>
          </div>
        </div>
        <div className="px-4 py-2.5" style={{ borderTop: '1px solid rgba(59,130,246,0.1)', background: 'rgba(30,58,138,0.2)' }}>
          <div className="text-[8px] font-mono tracking-widest" style={{ color: 'rgba(96,165,250,0.3)' }}>NODE ID: {node.id.slice(0, 8).toUpperCase()}</div>
        </div>
      </div>
    </div>
  )
}
