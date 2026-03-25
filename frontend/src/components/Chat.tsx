import React, { useState, useEffect, useRef, useCallback } from 'react';
import axios from 'axios';
import { io, Socket } from 'socket.io-client';
import { Send, Hash, Settings, LogOut, Volume2, Plus, Edit2, Trash2, Menu, Users, MessageSquare, Headphones, Paperclip, Mic, MicOff, AlertTriangle, Sun, Moon, Monitor, Reply, X, Upload } from 'lucide-react';
import ActiveUsersList from './ActiveUsersList';
import SettingsModal from './SettingsModal';
import ChannelModal from './ChannelModal';
import VoiceRoom from './VoiceRoom';
import UserProfileModal from './UserProfileModal';
import DirectMessage from './DirectMessage';
import FileMessage from './FileMessage';
import MessageContextMenu from './MessageContextMenu';

interface ChatProps {
  token: string;
  user: any;
  onLogout: () => void;
  dark: boolean;
  onToggleTheme: () => void;
}

export default function Chat({ token, user: initialUser, onLogout, dark, onToggleTheme }: ChatProps) {
  const [user, setUser] = useState(initialUser);
  const [socket, setSocket] = useState<Socket | null>(null);
  const [channels, setChannels] = useState<any[]>([]);
  const [activeChannelId, setActiveChannelId] = useState<string | null>(null);
  const [voiceChannelId, setVoiceChannelId] = useState<string | null>(null);
  const [messages, setMessages] = useState<any[]>([]);
  const [input, setInput] = useState('');
  const [activeUsers, setActiveUsers] = useState<any[]>([]);
  const [allUsers, setAllUsers] = useState<any[]>([]);
  const [typingUsers, setTypingUsers] = useState<Map<string, Set<string>>>(new Map());
  const typingTimeoutRef = useRef<number | null>(null);
  const [voiceRoomsInfo, setVoiceRoomsInfo] = useState<Map<string, any[]>>(new Map());
  const [showSettings, setShowSettings] = useState(false);
  const [showChannelModal, setShowChannelModal] = useState(false);
  const [editingChannel, setEditingChannel] = useState<any>(null);
  const [selectedUserId, setSelectedUserId] = useState<string | null>(null);
  const [dmTargetUser, setDmTargetUser] = useState<any>(null);
  const [showMobileSidebar, setShowMobileSidebar] = useState(false);
  const [showMobileUsers, setShowMobileUsers] = useState(false);
  const [isRecording, setIsRecording] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [replyTo, setReplyTo] = useState<any>(null);
  const [contextMenu, setContextMenu] = useState<{ x: number; y: number; msg: any } | null>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const API_URL = window.location.hostname === 'localhost' ? 'http://localhost:5000' : '';

  const fetchChannels = async () => {
    try {
      const res = await axios.get(`${API_URL}/api/chat/channels`, { headers: { Authorization: `Bearer ${token}` } });
      setChannels(res.data);
      if (res.data.length > 0 && !activeChannelId) setActiveChannelId(res.data[0].id);
    } catch (e) { console.error('Channel fetch failed', e); }
  };

  const fetchAllUsers = async () => {
    try {
      const res = await axios.get(`${API_URL}/api/auth/users`, { headers: { Authorization: `Bearer ${token}` } });
      setAllUsers(res.data);
    } catch (e) { console.error('Users fetch failed', e); }
  };

  useEffect(() => {
    fetchChannels();
    fetchAllUsers();
    const newSocket = io(API_URL, { auth: { token } });
    setSocket(newSocket);
    return () => { newSocket.close(); };
  }, [token]);

  useEffect(() => {
    if (!socket) return;
    socket.on('new-message', (data) => {
      if (data.channelId === activeChannelId) {
        setMessages(prev => [...prev, data]);
        setTimeout(() => messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' }), 100);
      }
    });
    socket.on('active-users', (users: any[]) => setActiveUsers(users));
    socket.on('voice-rooms-update', (roomsArray: any[]) => setVoiceRoomsInfo(new Map(roomsArray)));
    socket.on('user-typing', (data: { channelId: string; username: string }) => {
      setTypingUsers(prev => {
        const next = new Map(prev);
        if (!next.has(data.channelId)) next.set(data.channelId, new Set());
        next.get(data.channelId)!.add(data.username);
        return next;
      });
    });
    socket.on('user-stop-typing', (data: { channelId: string; username: string }) => {
      setTypingUsers(prev => {
        const next = new Map(prev);
        next.get(data.channelId)?.delete(data.username);
        return next;
      });
    });
    return () => {
      socket.off('new-message'); socket.off('active-users');
      socket.off('voice-rooms-update'); socket.off('user-typing'); socket.off('user-stop-typing');
    };
  }, [socket, activeChannelId]);

  useEffect(() => {
    if (!activeChannelId) return;
    const ch = channels.find(c => c.id === activeChannelId);
    if (ch?.type === 'TEXT') {
      axios.get(`${API_URL}/api/chat/channels/${activeChannelId}/messages`, { headers: { Authorization: `Bearer ${token}` } })
        .then(res => { setMessages(res.data); setTimeout(() => messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' }), 100); });
    }
  }, [activeChannelId, token, channels]);

  // Gerçek dosya upload — VDS'ye kaydeder
  const uploadFile = async (file: File): Promise<{ url: string; fileType: string; fileName: string } | null> => {
    setUploading(true);
    try {
      const formData = new FormData();
      formData.append('file', file);
      const res = await axios.post(`${API_URL}/api/upload`, formData, {
        headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'multipart/form-data' },
      });
      return { url: res.data.url, fileType: res.data.fileType, fileName: res.data.originalName };
    } catch (e) {
      alert('Dosya yüklenemedi. Max 50MB.');
      return null;
    } finally {
      setUploading(false);
    }
  };

  const sendFileMessage = (fileUrl: string, fileType: string, fileName: string) => {
    if (!activeChannelId || !socket) return;
    const replyContent = replyTo ? `[Yanıt: ${replyTo.user?.username}] ` : '';
    socket.emit('send-message', { channelId: activeChannelId, content: replyContent, fileUrl, fileType, fileName });
    setReplyTo(null);
  };

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const result = await uploadFile(file);
    if (result) sendFileMessage(result.url, result.fileType, result.fileName);
    e.target.value = '';
  };

  const toggleRecording = async () => {
    if (isRecording) { mediaRecorderRef.current?.stop(); setIsRecording(false); return; }
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mr = new MediaRecorder(stream);
      audioChunksRef.current = [];
      mr.ondataavailable = e => audioChunksRef.current.push(e.data);
      mr.onstop = async () => {
        const blob = new Blob(audioChunksRef.current, { type: 'audio/webm' });
        stream.getTracks().forEach(t => t.stop());
        const file = new File([blob], 'voice-message.webm', { type: 'audio/webm' });
        const result = await uploadFile(file);
        if (result) sendFileMessage(result.url, 'audio', 'voice-message.webm');
      };
      mr.start(); mediaRecorderRef.current = mr; setIsRecording(true);
    } catch { alert('Mikrofon erişimi reddedildi'); }
  };

  const handleSend = (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() || !activeChannelId || !socket) return;
    const content = replyTo ? `[Yanıt: @${replyTo.user?.username}]: ${input}` : input;
    socket.emit('send-message', { channelId: activeChannelId, content });
    setInput('');
    setReplyTo(null);
    socket.emit('stop-typing', { channelId: activeChannelId, username: user.username });
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setInput(e.target.value);
    if (!socket || !activeChannelId) return;
    socket.emit('typing', { channelId: activeChannelId, username: user.username });
    if (typingTimeoutRef.current) window.clearTimeout(typingTimeoutRef.current);
    typingTimeoutRef.current = window.setTimeout(() => {
      socket.emit('stop-typing', { channelId: activeChannelId, username: user.username });
    }, 2000);
  };

  const handleDeleteChannel = async (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (!window.confirm('Bu kanalı sil?')) return;
    try {
      await axios.delete(`${API_URL}/api/chat/channels/${id}`, { headers: { Authorization: `Bearer ${token}` } });
      fetchChannels();
      if (activeChannelId === id) setActiveChannelId(null);
      if (voiceChannelId === id) setVoiceChannelId(null);
    } catch { alert('Kanal silinemedi'); }
  };

  const handleJoinVoice = (channelId: string) => {
    if (voiceChannelId && voiceChannelId !== channelId) socket?.emit('leave-voice', voiceChannelId);
    setActiveChannelId(channelId);
    setVoiceChannelId(channelId);
    setShowMobileSidebar(false);
  };

  const handleMessageUserClick = (username?: string) => {
    if (!username) return;
    const tUser = allUsers.find(u => u.username === username);
    if (tUser) setSelectedUserId(tUser.id);
  };

  const handleContextMenu = (e: React.MouseEvent, msg: any) => {
    e.preventDefault();
    setContextMenu({ x: e.clientX, y: e.clientY, msg });
  };

  const handleLongPress = useCallback((msg: any) => {
    // Mobil için long press
    setContextMenu({ x: window.innerWidth / 2 - 100, y: window.innerHeight / 2 - 150, msg });
  }, []);

  const textChannels = channels.filter(c => c.type === 'TEXT');
  const voiceChannels = channels.filter(c => c.type === 'VOICE');
  const activeChannel = channels.find(c => c.id === activeChannelId);

  return (
    <div className="flex flex-col h-[100dvh] overflow-hidden si-grid-bg" style={{ background: 'var(--bg-base)', color: 'var(--text-primary)' }}
      onClick={() => contextMenu && setContextMenu(null)}>
      <div className="scanline" />
      <div className="flex flex-1 overflow-hidden relative">

        {(showMobileSidebar || showMobileUsers) && (
          <div className="fixed inset-0 bg-black/50 z-40 md:hidden backdrop-blur-sm"
            onClick={() => { setShowMobileSidebar(false); setShowMobileUsers(false); }} />
        )}

        {/* ── LEFT SIDEBAR ── */}
        <div className={`fixed inset-y-0 left-0 z-50 transform transition-transform duration-300 md:relative md:translate-x-0 w-64 flex flex-col ${showMobileSidebar ? 'translate-x-0' : '-translate-x-full'} sidebar-glass`}
          style={{ borderRight: '1px solid var(--border)' }}>

          <div className="px-5 py-4 flex items-center gap-2" style={{ borderBottom: '1px solid var(--border)' }}>
            <div className="w-2 h-2 rounded-full pulse-teal shrink-0" style={{ background: 'var(--accent)' }} />
            <div className="flex-1">
              <div className="text-sm font-black tracking-widest uppercase" style={{ color: 'var(--text-accent)' }}>STARK NET</div>
              <div className="text-[9px] tracking-widest" style={{ color: 'var(--text-muted)' }}>SECURE COMM LINK</div>
            </div>
            <button onClick={onToggleTheme} className="theme-toggle" title={dark ? 'Light mode' : 'Dark mode'}>
              {dark ? <Sun size={14} /> : <Moon size={14} />}
            </button>
          </div>

          <div className="px-5 py-2.5" style={{ borderBottom: '1px solid var(--border)' }}>
            <div className="text-[9px] tracking-widest mb-1.5 uppercase" style={{ color: 'var(--text-muted)' }}>System Status</div>
            {['MAINFRAME', 'ENCRYPTION', 'FIREWALL'].map(s => (
              <div key={s} className="flex items-center justify-between py-0.5">
                <span className="text-[9px] tracking-wider" style={{ color: 'var(--text-muted)' }}>{s}</span>
                <span className="text-[9px] font-bold tracking-wider" style={{ color: 'var(--text-accent)' }}>ONLINE</span>
              </div>
            ))}
          </div>

          <div className="flex-1 overflow-y-auto py-2 custom-scrollbar">
            <div className="text-[9px] tracking-[0.3em] px-5 py-2 uppercase" style={{ color: 'var(--text-muted)', borderBottom: '1px solid var(--border)' }}>Directory</div>

            <div className="mt-1">
              <div className="px-4 py-1.5 flex items-center justify-between">
                <span className="text-[9px] font-bold uppercase tracking-widest" style={{ color: 'var(--text-muted)' }}>Text Channels</span>
                <button onClick={() => { setEditingChannel(null); setShowChannelModal(true); }} className="transition-colors hover:opacity-80" style={{ color: 'var(--text-accent)' }}><Plus size={13} /></button>
              </div>
              {textChannels.map(ch => (
                <div key={ch.id} onClick={() => { setActiveChannelId(ch.id); setShowMobileSidebar(false); }}
                  className={`px-4 py-2.5 mx-2 cursor-pointer flex items-center justify-between group transition-all border-l-2 ${activeChannelId === ch.id ? 'nav-active' : 'file-row border-transparent'}`}
                  style={{ color: activeChannelId === ch.id ? 'var(--nav-active-text)' : 'var(--text-secondary)' }}>
                  <div className="flex items-center gap-2 truncate">
                    <Hash size={13} style={{ color: activeChannelId === ch.id ? 'var(--accent)' : 'var(--text-muted)' }} />
                    <span className="truncate text-xs font-medium">{ch.name}</span>
                  </div>
                  <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                    <button onClick={e => { e.stopPropagation(); setEditingChannel(ch); setShowChannelModal(true); }} className="p-1 hover:opacity-80" style={{ color: 'var(--text-accent)' }}><Edit2 size={11} /></button>
                    <button onClick={e => handleDeleteChannel(ch.id, e)} className="p-1 text-red-400 hover:text-red-500"><Trash2 size={11} /></button>
                  </div>
                </div>
              ))}
            </div>

            <div className="mt-2">
              <div className="px-4 py-1.5 flex items-center justify-between">
                <span className="text-[9px] font-bold uppercase tracking-widest" style={{ color: 'var(--text-muted)' }}>Voice Channels</span>
                <button onClick={() => { setEditingChannel(null); setShowChannelModal(true); }} className="transition-colors hover:opacity-80" style={{ color: 'var(--text-accent)' }}><Plus size={13} /></button>
              </div>
              {voiceChannels.map(ch => {
                const participants = voiceRoomsInfo.get(ch.id) || [];
                const isActive = voiceChannelId === ch.id;
                return (
                  <div key={ch.id}>
                    <div onClick={() => handleJoinVoice(ch.id)}
                      className={`px-4 py-2.5 mx-2 cursor-pointer flex items-center justify-between group transition-all border-l-2 ${activeChannelId === ch.id ? 'nav-active' : 'file-row border-transparent'}`}
                      style={{ color: activeChannelId === ch.id ? 'var(--nav-active-text)' : 'var(--text-secondary)' }}>
                      <div className="flex items-center gap-2 truncate">
                        <Volume2 size={13} style={{ color: activeChannelId === ch.id ? 'var(--accent)' : 'var(--text-muted)' }} />
                        <span className="truncate text-xs font-medium">{ch.name}</span>
                        {isActive && <div className="w-1.5 h-1.5 bg-green-500 rounded-full animate-pulse ml-1" />}
                      </div>
                      <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                        <button onClick={e => { e.stopPropagation(); setEditingChannel(ch); setShowChannelModal(true); }} className="p-1 hover:opacity-80" style={{ color: 'var(--text-accent)' }}><Edit2 size={11} /></button>
                        <button onClick={e => handleDeleteChannel(ch.id, e)} className="p-1 text-red-400 hover:text-red-500"><Trash2 size={11} /></button>
                      </div>
                    </div>
                    {participants.length > 0 && (
                      <div className="pl-9 pr-4 py-1 space-y-1">
                        {participants.map((p: any) => (
                          <div key={p.socketId} className="flex items-center gap-2 text-[10px]" style={{ color: 'var(--text-muted)' }}>
                            {p.user.avatarUrl
                              ? <img src={p.user.avatarUrl} alt="" className="w-4 h-4 rounded-full object-cover" style={{ border: '1px solid var(--border-accent)' }} />
                              : <div className="w-4 h-4 rounded flex items-center justify-center text-[9px]" style={{ border: '1px solid var(--border-accent)', background: 'var(--accent-bg)', color: 'var(--text-accent)' }}>{p.user.username[0].toUpperCase()}</div>}
                            <span className="truncate">{p.user.username}</span>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>

          <a href="/download" className="mx-3 mb-2 flex items-center justify-center gap-2 py-2 rounded-lg text-[10px] font-bold tracking-widest uppercase transition-all"
            style={{ background: 'var(--accent-bg)', border: '1px solid var(--border-accent)', color: 'var(--text-accent)' }}>
            <Monitor size={12} /> PC UYGULAMASI
          </a>

          <div className="p-3 flex items-center justify-between" style={{ borderTop: '1px solid var(--border)', background: 'var(--bg-panel)' }}>
            <div className="flex items-center gap-2.5">
              <div className="relative">
                {user?.avatarUrl
                  ? <img src={user.avatarUrl} alt="" className="w-8 h-8 rounded object-cover" style={{ border: '1px solid var(--border-accent)' }} />
                  : <div className="w-8 h-8 rounded flex items-center justify-center text-xs font-bold" style={{ border: '1px solid var(--border-accent)', background: 'var(--accent-bg)', color: 'var(--text-accent)' }}>{user?.username?.[0]?.toUpperCase()}</div>}
                <div className="absolute -bottom-0.5 -right-0.5 w-2.5 h-2.5 bg-green-500 rounded-full border-2" style={{ borderColor: 'var(--bg-base)' }} />
              </div>
              <div>
                <div className="text-xs font-bold" style={{ color: 'var(--text-primary)' }}>{user.username}</div>
                <div className="text-[9px] tracking-wider" style={{ color: 'var(--text-muted)' }}>ONLINE</div>
              </div>
            </div>
            <div className="flex gap-1">
              <button onClick={() => setShowSettings(true)} className="p-1.5 transition-colors hover:opacity-80" style={{ color: 'var(--text-muted)' }}><Settings size={15} /></button>
              <button onClick={onLogout} className="p-1.5 transition-colors text-red-400 hover:text-red-500"><LogOut size={15} /></button>
            </div>
          </div>
        </div>

        {/* ── MAIN AREA ── */}
        <div className="flex-1 flex flex-col relative overflow-hidden"
          style={{ backgroundImage: 'url(/chat-arka-plan.png)', backgroundSize: 'cover', backgroundPosition: 'center' }}>
          <div className="absolute inset-0 pointer-events-none" style={{ background: dark ? 'rgba(13,17,23,0.82)' : 'rgba(200,208,216,0.78)' }} />

          {/* Header */}
          <div className="h-14 flex justify-between items-center px-4 md:px-5 z-10 shrink-0 backdrop-blur-sm"
            style={{ borderBottom: '1px solid var(--border)', background: 'var(--header-bg)' }}>
            <div className="flex items-center gap-3">
              <button onClick={() => setShowMobileSidebar(true)} className="md:hidden p-1.5" style={{ color: 'var(--text-muted)' }}><Menu size={20} /></button>
              {activeChannel?.type === 'TEXT'
                ? <Hash size={16} className="hidden md:block" style={{ color: 'var(--text-muted)' } as any} />
                : <Volume2 size={16} className="hidden md:block" style={{ color: 'var(--text-muted)' } as any} />}
              <span className="font-medium text-sm truncate max-w-[150px] sm:max-w-xs" style={{ color: 'var(--text-primary)' }}>{activeChannel?.name || '—'}</span>
              {activeChannel?.type === 'VOICE' && voiceChannelId === activeChannelId && (
                <span className="px-2 py-0.5 text-green-400 text-[9px] border border-green-500/20 bg-green-500/10 tracking-widest">CONNECTED</span>
              )}
            </div>
            <div className="flex items-center gap-3">
              <div className="hidden md:flex items-center gap-1.5">
                <AlertTriangle size={10} style={{ color: 'var(--text-muted)' }} />
                <span className="text-[9px] tracking-wider" style={{ color: 'var(--text-muted)' }}>ENCRYPTED</span>
              </div>
              <button onClick={onToggleTheme} className="theme-toggle hidden md:flex" title={dark ? 'Light mode' : 'Dark mode'}>
                {dark ? <Sun size={14} /> : <Moon size={14} />}
              </button>
              <button onClick={() => setShowMobileUsers(true)} className="md:hidden p-1.5" style={{ color: 'var(--text-muted)' }}><Users size={20} /></button>
            </div>
          </div>

          {/* Messages */}
          {activeChannel?.type === 'TEXT' ? (
            <>
              <div className="flex-1 overflow-y-auto p-3 md:p-5 space-y-3 z-10 custom-scrollbar">
                {messages.length === 0 && (
                  <div className="flex flex-col items-center justify-center h-full space-y-3" style={{ color: 'var(--text-muted)' }}>
                    <Hash size={40} className="opacity-20" />
                    <p className="text-xs tracking-widest">CHANNEL CLEAR — BEGIN TRANSMISSION</p>
                  </div>
                )}
                {messages.map((m, i) => {
                  const isMe = m.user?.username === user.username;
                  return (
                    <MessageRow
                      key={m.id || i}
                      m={m}
                      isMe={isMe}
                      user={user}
                      onUserClick={handleMessageUserClick}
                      onContextMenu={handleContextMenu}
                      onLongPress={handleLongPress}
                      onReply={setReplyTo}
                    />
                  );
                })}
                <div ref={messagesEndRef} />
              </div>

              {/* Typing indicator */}
              <div className="px-5 h-5 z-10 flex items-center">
                {activeChannelId && typingUsers.has(activeChannelId) && typingUsers.get(activeChannelId)!.size > 0 && (
                  <div className="text-[10px] flex items-center gap-2" style={{ color: 'var(--text-muted)' }}>
                    <span className="flex gap-0.5">
                      {[0, 150, 300].map(d => <span key={d} className="w-1 h-1 rounded-full animate-bounce" style={{ background: 'var(--accent)', animationDelay: `${d}ms` }} />)}
                    </span>
                    {Array.from(typingUsers.get(activeChannelId)!).join(', ')} yazıyor...
                  </div>
                )}
              </div>

              {/* Reply preview */}
              {replyTo && (
                <div className="mx-4 mb-1 px-3 py-2 rounded-lg flex items-center justify-between z-10"
                  style={{ background: 'var(--bg-panel)', border: '1px solid var(--border-accent)' }}>
                  <div className="flex items-center gap-2 min-w-0">
                    <Reply size={12} style={{ color: 'var(--text-accent)', flexShrink: 0 }} />
                    <span className="text-xs truncate" style={{ color: 'var(--text-muted)' }}>
                      <span style={{ color: 'var(--text-accent)' }}>@{replyTo.user?.username}</span>: {replyTo.content || '[dosya]'}
                    </span>
                  </div>
                  <button onClick={() => setReplyTo(null)} className="p-1 shrink-0" style={{ color: 'var(--text-muted)' }}><X size={12} /></button>
                </div>
              )}

              {/* Input */}
              <div className="p-3 md:p-4 z-10" style={{ borderTop: '1px solid var(--border)' }}>
                <input type="file" ref={fileInputRef} onChange={handleFileSelect} className="hidden"
                  accept="image/*,audio/*,video/*,.pdf,.doc,.docx,.txt,.zip,.rar" />
                <form onSubmit={handleSend} className="flex items-center gap-2">
                  <button type="button" onClick={() => fileInputRef.current?.click()} disabled={uploading}
                    className="p-2 transition-colors hover:opacity-80 shrink-0 disabled:opacity-50" style={{ color: 'var(--text-muted)' }}>
                    {uploading ? <Upload size={16} className="animate-pulse" style={{ color: 'var(--text-accent)' }} /> : <Paperclip size={16} />}
                  </button>
                  <button type="button" onClick={toggleRecording}
                    className={`p-2 transition-colors shrink-0 ${isRecording ? 'text-red-400 animate-pulse' : ''}`}
                    style={!isRecording ? { color: 'var(--text-muted)' } : {}}>
                    {isRecording ? <MicOff size={16} /> : <Mic size={16} />}
                  </button>
                  <div className="relative flex-1">
                    <input
                      ref={inputRef}
                      type="text" value={input} onChange={handleInputChange}
                      placeholder={`#${activeChannel.name} kanalına mesaj gönder`}
                      className="w-full py-3 pl-4 pr-12 text-sm rounded-lg focus:outline-none transition-colors backdrop-blur-sm"
                      style={{ background: 'var(--bg-input)', border: '1px solid var(--border)', color: 'var(--text-primary)' }}
                    />
                    <button type="submit" disabled={!input.trim()}
                      className="absolute right-2 top-1.5 p-1.5 rounded transition-all disabled:opacity-0"
                      style={{ background: 'var(--accent-bg)', border: '1px solid var(--border-accent)', color: 'var(--text-accent)' }}>
                      <Send size={15} />
                    </button>
                  </div>
                </form>
              </div>
            </>
          ) : activeChannel?.type === 'VOICE' ? null : (
            <div className="flex-1 flex items-center justify-center text-xs tracking-widest" style={{ color: 'var(--text-muted)' }}>
              SELECT A CHANNEL TO BEGIN
            </div>
          )}

          {voiceChannelId && (
            <VoiceRoom socket={socket} channelId={voiceChannelId} user={user}
              isMinimized={activeChannelId !== voiceChannelId}
              onDisconnect={() => { setVoiceChannelId(null); if (activeChannelId === voiceChannelId) setActiveChannelId(null); }} />
          )}
        </div>

        {/* ── RIGHT SIDEBAR ── */}
        <div className={`fixed inset-y-0 right-0 z-50 transform transition-transform duration-300 md:relative md:translate-x-0 ${showMobileUsers ? 'translate-x-0' : 'translate-x-full'}`}>
          <ActiveUsersList activeUsers={activeUsers} allUsers={allUsers}
            onUserClick={(id) => { setSelectedUserId(id); setShowMobileUsers(false); }}
            onDMClick={(targetUser) => { setDmTargetUser(targetUser); setShowMobileUsers(false); }}
            dark={dark} />
        </div>
      </div>

      {/* Mobile bottom nav */}
      <div className="md:hidden h-14 shrink-0 flex items-center justify-around px-2 z-[60]"
        style={{ borderTop: '1px solid var(--border)', background: 'var(--header-bg)' }}>
        {[
          { icon: MessageSquare, label: 'COMMS', action: () => { setShowMobileSidebar(true); setShowMobileUsers(false); }, active: showMobileSidebar },
          { icon: Headphones, label: 'VOICE', action: () => { if (voiceChannelId) setActiveChannelId(voiceChannelId); else setShowMobileSidebar(true); }, active: activeChannelId === voiceChannelId && !!voiceChannelId },
          { icon: Users, label: 'AGENTS', action: () => { setShowMobileUsers(true); setShowMobileSidebar(false); }, active: showMobileUsers },
          { icon: Settings, label: 'CONFIG', action: () => setShowSettings(true), active: showSettings },
        ].map(({ icon: Icon, label, action, active }) => (
          <button key={label} onClick={action} className="flex flex-col items-center p-2 transition-colors"
            style={{ color: active ? 'var(--text-accent)' : 'var(--text-muted)' }}>
            <Icon size={20} className="mb-0.5" />
            <span className="text-[9px] tracking-widest">{label}</span>
          </button>
        ))}
      </div>

      {/* Context menu */}
      {contextMenu && (
        <MessageContextMenu
          x={contextMenu.x} y={contextMenu.y} message={contextMenu.msg}
          isMe={contextMenu.msg.user?.username === user.username}
          onClose={() => setContextMenu(null)}
          onReply={(msg) => { setReplyTo(msg); setContextMenu(null); inputRef.current?.focus(); }}
          onCopy={(text) => { navigator.clipboard.writeText(text); setContextMenu(null); }}
        />
      )}

      {dmTargetUser && <DirectMessage token={token} user={user} targetUser={dmTargetUser} socket={socket} onClose={() => setDmTargetUser(null)} dark={dark} />}
      {selectedUserId && allUsers.find(u => u.id === selectedUserId) && (
        <UserProfileModal token={token} currentUser={user} targetUser={allUsers.find(u => u.id === selectedUserId)} onClose={() => setSelectedUserId(null)} onRoleUpdated={fetchAllUsers} onDMClick={(targetUser) => { setSelectedUserId(null); setDmTargetUser(targetUser); }} dark={dark} />
      )}
      {showSettings && <SettingsModal token={token} user={user} onClose={() => setShowSettings(false)} onUpdateUser={(u) => setUser(u)} dark={dark} />}
      {showChannelModal && <ChannelModal token={token} editChannel={editingChannel} onClose={() => { setShowChannelModal(false); setEditingChannel(null); }} onSaved={fetchChannels} dark={dark} />}
    </div>
  );
}

// ── MessageRow — ayrı component, context menu + long press ──
function MessageRow({ m, isMe, user, onUserClick, onContextMenu, onLongPress, onReply }: {
  m: any; isMe: boolean; user: any;
  onUserClick: (u?: string) => void;
  onContextMenu: (e: React.MouseEvent, msg: any) => void;
  onLongPress: (msg: any) => void;
  onReply: (msg: any) => void;
}) {
  const longPressTimer = useRef<number | null>(null);

  const handleTouchStart = () => {
    longPressTimer.current = window.setTimeout(() => onLongPress(m), 500);
  };
  const handleTouchEnd = () => {
    if (longPressTimer.current) window.clearTimeout(longPressTimer.current);
  };

  return (
    <div
      className={`flex flex-col group ${isMe ? 'items-end' : 'items-start'}`}
      onContextMenu={e => onContextMenu(e, m)}
      onTouchStart={handleTouchStart}
      onTouchEnd={handleTouchEnd}
      onTouchMove={handleTouchEnd}
    >
      {/* Username + time */}
      <div className="flex items-baseline gap-2 mb-1 px-1">
        {!isMe && (
          <div className="flex items-center gap-1.5 cursor-pointer hover:opacity-80" onClick={() => onUserClick(m.user?.username)}>
            {m.user?.avatarUrl
              ? <img src={m.user.avatarUrl} alt="" className="w-4 h-4 rounded object-cover" style={{ border: '1px solid var(--border-accent)' }} />
              : <div className="w-4 h-4 rounded flex items-center justify-center text-[9px]" style={{ border: '1px solid var(--border-accent)', background: 'var(--accent-bg)', color: 'var(--text-accent)' }}>{m.user?.username?.[0]?.toUpperCase()}</div>}
            <span className="font-semibold text-xs" style={{ color: 'var(--text-accent)' }}>{m.user?.username}</span>
          </div>
        )}
        <span className="text-[9px]" style={{ color: 'var(--text-muted)' }}>{new Date(m.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
        {isMe && (
          <div className="flex items-center gap-1.5 cursor-pointer hover:opacity-80" onClick={() => onUserClick(m.user?.username)}>
            <span className="font-semibold text-xs" style={{ color: 'var(--text-accent)' }}>{m.user?.username}</span>
            {user?.avatarUrl
              ? <img src={user.avatarUrl} alt="" className="w-4 h-4 rounded object-cover" style={{ border: '1px solid var(--border-accent)' }} />
              : <div className="w-4 h-4 rounded flex items-center justify-center text-[9px]" style={{ border: '1px solid var(--border-accent)', background: 'var(--accent-bg)', color: 'var(--text-accent)' }}>{user?.username?.[0]?.toUpperCase()}</div>}
          </div>
        )}
      </div>

      {/* Message bubble + quick reply */}
      <div className="flex items-end gap-1.5 max-w-[85%] md:max-w-2xl">
        {isMe && (
          <button onClick={() => onReply(m)} className="opacity-0 group-hover:opacity-100 transition-opacity p-1 rounded" style={{ color: 'var(--text-muted)' }}>
            <Reply size={13} />
          </button>
        )}
        {m.fileUrl ? (
          <FileMessage fileUrl={m.fileUrl} fileType={m.fileType} fileName={m.fileName} content={m.content} isMe={isMe} />
        ) : (
          <div className="px-4 py-2.5 leading-relaxed text-sm rounded-lg backdrop-blur-sm"
            style={{
              background: isMe ? 'var(--msg-me-bg)' : 'var(--msg-other-bg)',
              border: `1px solid ${isMe ? 'var(--msg-me-border)' : 'var(--msg-other-border)'}`,
              color: isMe ? 'var(--msg-me-text)' : 'var(--msg-other-text)',
              wordBreak: 'break-word',
            }}>
            {m.content?.startsWith('[Yanıt:') ? (
              <div>
                <div className="text-[10px] opacity-60 mb-1 border-l-2 pl-2" style={{ borderColor: 'var(--accent)' }}>
                  {m.content.split(']:')[0].replace('[Yanıt: ', '') + ']'}
                </div>
                <div>{m.content.split(']: ').slice(1).join(']: ')}</div>
              </div>
            ) : m.content}
          </div>
        )}
        {!isMe && (
          <button onClick={() => onReply(m)} className="opacity-0 group-hover:opacity-100 transition-opacity p-1 rounded" style={{ color: 'var(--text-muted)' }}>
            <Reply size={13} />
          </button>
        )}
      </div>
    </div>
  );
}
