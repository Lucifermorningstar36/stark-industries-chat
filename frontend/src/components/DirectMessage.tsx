import React, { useState, useEffect, useRef } from 'react';
import axios from 'axios';
import { Socket } from 'socket.io-client';
import { X, Send, Paperclip, Mic, MicOff } from 'lucide-react';
import FileMessage from './FileMessage';

interface Props {
  token: string; user: any; targetUser: any; socket: Socket | null; onClose: () => void; dark?: boolean;
}

export default function DirectMessage({ token, user, targetUser, socket, onClose }: Props) {
  const [messages, setMessages] = useState<any[]>([]);
  const [input, setInput] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [isRecording, setIsRecording] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const typingTimeoutRef = useRef<number | null>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const API_URL = window.location.hostname === 'localhost' ? 'http://localhost:5000' : '';

  useEffect(() => {
    axios.get(`${API_URL}/api/chat/dm/${targetUser.id}`, { headers: { Authorization: `Bearer ${token}` } })
      .then(res => { setMessages(res.data); setTimeout(() => messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' }), 100); });
  }, [targetUser.id]);

  useEffect(() => {
    if (!socket) return;
    const handleNewDM = (dm: any) => {
      const relevant = (dm.senderId === user.id && dm.receiverId === targetUser.id) || (dm.senderId === targetUser.id && dm.receiverId === user.id);
      if (relevant) { setMessages(prev => [...prev, dm]); setTimeout(() => messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' }), 100); }
    };
    socket.on('new-dm', handleNewDM);
    socket.on('dm-user-typing', (d: any) => { if (d.username === targetUser.username) setIsTyping(true); });
    socket.on('dm-user-stop-typing', (d: any) => { if (d.username === targetUser.username) setIsTyping(false); });
    return () => { socket.off('new-dm', handleNewDM); socket.off('dm-user-typing'); socket.off('dm-user-stop-typing'); };
  }, [socket, targetUser.id]);

  const sendMessage = (content: string, fileUrl?: string, fileType?: string, fileName?: string) => {
    socket?.emit('send-dm', { receiverId: targetUser.id, content, fileUrl, fileType, fileName });
  };

  const handleSend = (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim()) return;
    sendMessage(input.trim()); setInput('');
    socket?.emit('dm-stop-typing', { receiverId: targetUser.id, username: user.username });
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setInput(e.target.value);
    socket?.emit('dm-typing', { receiverId: targetUser.id, username: user.username });
    if (typingTimeoutRef.current) window.clearTimeout(typingTimeoutRef.current);
    typingTimeoutRef.current = window.setTimeout(() => {
      socket?.emit('dm-stop-typing', { receiverId: targetUser.id, username: user.username });
    }, 2000);
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 10 * 1024 * 1024) { alert('Max 10MB'); return; }
    const reader = new FileReader();
    reader.onloadend = () => sendMessage('', reader.result as string, file.type.startsWith('image/') ? 'image' : 'file', file.name);
    reader.readAsDataURL(file); e.target.value = '';
  };

  const toggleRecording = async () => {
    if (isRecording) { mediaRecorderRef.current?.stop(); setIsRecording(false); return; }
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mr = new MediaRecorder(stream);
      audioChunksRef.current = [];
      mr.ondataavailable = e => audioChunksRef.current.push(e.data);
      mr.onstop = () => {
        const blob = new Blob(audioChunksRef.current, { type: 'audio/webm' });
        stream.getTracks().forEach(t => t.stop());
        const reader = new FileReader();
        reader.onloadend = () => sendMessage('🎤', reader.result as string, 'audio', 'voice-message.webm');
        reader.readAsDataURL(blob);
      };
      mr.start(); mediaRecorderRef.current = mr; setIsRecording(true);
    } catch { alert('Microphone access denied'); }
  };

  return (
    <div className="fixed inset-0 z-[70] flex items-center justify-center p-4" style={{ background: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(8px)' }}>
      <div className="w-full max-w-lg h-[80vh] flex flex-col overflow-hidden rounded-xl shadow-2xl"
        style={{ background: 'var(--modal-bg)', border: '1px solid var(--modal-border)' }}>

        {/* Header */}
        <div className="px-5 py-3.5 flex items-center justify-between shrink-0" style={{ borderBottom: '1px solid var(--border)', background: 'var(--bg-panel)' }}>
          <div className="flex items-center gap-3">
            {targetUser.avatarUrl
              ? <img src={targetUser.avatarUrl} alt="" className="w-8 h-8 rounded object-cover" style={{ border: '1px solid var(--border-accent)' }} />
              : <div className="w-8 h-8 rounded flex items-center justify-center text-sm font-bold" style={{ border: '1px solid var(--border-accent)', background: 'var(--accent-bg)', color: 'var(--text-accent)' }}>{targetUser.username[0].toUpperCase()}</div>}
            <div>
              <div className="font-semibold text-sm" style={{ color: 'var(--text-primary)' }}>{targetUser.username}</div>
              <div className="text-[9px] tracking-widest" style={{ color: 'var(--text-muted)' }}>DIRECT TRANSMISSION</div>
            </div>
          </div>
          <button onClick={onClose} className="p-1.5 transition-colors rounded" style={{ color: 'var(--text-muted)' }}><X size={16} /></button>
        </div>

        {/* Messages */}
        <div className="flex-1 overflow-y-auto p-4 space-y-3 custom-scrollbar">
          {messages.length === 0 && (
            <div className="flex flex-col items-center justify-center h-full text-xs tracking-widest" style={{ color: 'var(--text-muted)' }}>SECURE CHANNEL OPEN</div>
          )}
          {messages.map((m, i) => {
            const isMe = m.senderId === user.id;
            return (
              <div key={i} className={`flex flex-col ${isMe ? 'items-end' : 'items-start'}`}>
                <div className="flex items-baseline gap-2 mb-1 px-1">
                  {!isMe && <span className="font-semibold text-xs" style={{ color: 'var(--text-accent)' }}>{m.sender?.username}</span>}
                  <span className="text-[9px]" style={{ color: 'var(--text-muted)' }}>{new Date(m.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                  {isMe && <span className="font-semibold text-xs" style={{ color: 'var(--text-accent)' }}>YOU</span>}
                </div>
                {m.fileUrl
                  ? <FileMessage fileUrl={m.fileUrl} fileType={m.fileType} fileName={m.fileName} content={m.content} isMe={isMe} />
                  : <div className="px-4 py-2.5 max-w-xs leading-relaxed text-sm rounded-lg"
                      style={{ background: isMe ? 'var(--msg-me-bg)' : 'var(--msg-other-bg)', border: `1px solid ${isMe ? 'var(--msg-me-border)' : 'var(--msg-other-border)'}`, color: isMe ? 'var(--msg-me-text)' : 'var(--msg-other-text)' }}>{m.content}</div>}
              </div>
            );
          })}
          {isTyping && (
            <div className="flex items-center gap-2 text-[10px]" style={{ color: 'var(--text-muted)' }}>
              <span className="flex gap-0.5">{[0,150,300].map(d => <span key={d} className="w-1 h-1 rounded-full animate-bounce" style={{ background: 'var(--accent)', animationDelay: `${d}ms` }} />)}</span>
              {targetUser.username} is typing...
            </div>
          )}
          <div ref={messagesEndRef} />
        </div>

        {/* Input */}
        <div className="p-3 shrink-0" style={{ borderTop: '1px solid var(--border)' }}>
          <form onSubmit={handleSend} className="flex items-center gap-2">
            <input type="file" ref={fileInputRef} onChange={handleFileSelect} className="hidden" accept="image/*,audio/*,.pdf,.doc,.docx,.txt,.zip" />
            <button type="button" onClick={() => fileInputRef.current?.click()} className="p-1.5 transition-colors" style={{ color: 'var(--text-muted)' }}><Paperclip size={15} /></button>
            <button type="button" onClick={toggleRecording} className={`p-1.5 transition-colors ${isRecording ? 'text-red-400 animate-pulse' : ''}`} style={!isRecording ? { color: 'var(--text-muted)' } : {}}>
              {isRecording ? <MicOff size={15} /> : <Mic size={15} />}
            </button>
            <input type="text" value={input} onChange={handleInputChange} placeholder={`Message ${targetUser.username}`}
              className="flex-1 py-2 px-3 text-xs rounded-lg focus:outline-none transition-colors"
              style={{ background: 'var(--bg-input)', border: '1px solid var(--border)', color: 'var(--text-primary)' }} />
            <button type="submit" disabled={!input.trim()} className="p-2 rounded transition-all disabled:opacity-20"
              style={{ background: 'var(--accent-bg)', border: '1px solid var(--border-accent)', color: 'var(--text-accent)' }}>
              <Send size={14} />
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
