import { useEffect, useRef, useState, useCallback } from 'react';
import { Socket } from 'socket.io-client';
import { Mic, MicOff, PhoneOff, Volume2, Users, Video, VideoOff, Monitor, MonitorUp, Maximize, Minimize, VolumeX, Headphones, RefreshCw } from 'lucide-react';

interface VoiceRoomProps {
  socket: Socket | null;
  channelId: string;
  user: any;
  isMinimized?: boolean;
  onDisconnect?: () => void;
}

const ICE_SERVERS = {
  iceServers: [
    { urls: 'stun:stun.l.google.com:19302' },
    { urls: 'stun:stun1.l.google.com:19302' }
  ]
};

const AudioTrackPlayer = ({ track, volume, muted }: { track: MediaStreamTrack, volume: number, muted: boolean }) => {
  const audioRef = useRef<HTMLAudioElement>(null);
  
  useEffect(() => {
    if (audioRef.current && track) {
      audioRef.current.srcObject = new MediaStream([track]);
    }
  }, [track]);

  useEffect(() => {
    if (audioRef.current) {
      audioRef.current.volume = volume;
      audioRef.current.muted = muted;
    }
  }, [volume, muted]);

  return <audio ref={audioRef} autoPlay playsInline className="hidden" />;
};

const VideoPlayer = ({ stream, isLocal, user, isMuted, refreshTrigger, globalMute }: any) => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const [hasVideo, setHasVideo] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);
  
  const [volume, setVolume] = useState(1);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const audioCtxRef = useRef<AudioContext | null>(null);
  const rafRef = useRef<number>(0);

  useEffect(() => {
    if (videoRef.current && stream) {
      videoRef.current.srcObject = stream;
      setHasVideo(stream.getVideoTracks().length > 0);
    }
  }, [stream, refreshTrigger]);

  useEffect(() => {
    if (videoRef.current) videoRef.current.volume = volume;
  }, [volume]);

  useEffect(() => {
    if (!stream || stream.getAudioTracks().length === 0) {
      setIsSpeaking(false);
      return;
    }
    
    try {
      const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
      if (!AudioCtx) return;
      
      const audioCtx = new AudioCtx();
      audioCtxRef.current = audioCtx;
      const analyser = audioCtx.createAnalyser();
      analyser.fftSize = 256;
      
      const source = audioCtx.createMediaStreamSource(stream);
      source.connect(analyser); // Do not connect to destination to avoid echo
      
      const dataArray = new Uint8Array(analyser.frequencyBinCount);
      const checkAudio = () => {
        analyser.getByteFrequencyData(dataArray);
        const sum = dataArray.reduce((acc, val) => acc + val, 0);
        const avg = sum / dataArray.length;
        setIsSpeaking(avg > 10 && (!isLocal || !isMuted));
        rafRef.current = requestAnimationFrame(checkAudio);
      };
      checkAudio();
    } catch (e) {
      console.warn("Audio Context init failed", e);
    }
    
    return () => {
       if (rafRef.current) cancelAnimationFrame(rafRef.current);
       if (audioCtxRef.current?.state !== 'closed') {
         audioCtxRef.current?.close().catch(e => console.error(e));
       }
    };
  }, [stream, isLocal, isMuted, refreshTrigger]);

  useEffect(() => {
    const handleFullscreenChange = () => {
      setIsFullscreen(!!document.fullscreenElement);
    };
    document.addEventListener('fullscreenchange', handleFullscreenChange);
    return () => document.removeEventListener('fullscreenchange', handleFullscreenChange);
  }, []);

  const toggleFullscreen = () => {
    if (!containerRef.current) return;
    if (!document.fullscreenElement) {
      containerRef.current.requestFullscreen().catch(e => console.error(e));
    } else {
      document.exitFullscreen();
    }
  };

  return (
    <div ref={containerRef} className={`bg-zinc-900 border ${isSpeaking ? 'border-blue-500 shadow-[0_0_20px_rgba(59,130,246,0.5)]' : 'border-zinc-800'} transition-all duration-300 rounded-xl flex flex-col items-center justify-center relative overflow-hidden group aspect-video h-full w-full`}>
      <video
        ref={videoRef}
        autoPlay
        playsInline
        muted={true}
        className={`w-full h-full object-cover ${hasVideo ? 'block' : 'hidden'} ${isSpeaking ? 'scale-[1.02]' : 'scale-100'} transition-transform duration-300`}
      />

      {!isLocal && stream && stream.getAudioTracks().map((track: MediaStreamTrack) => (
        <AudioTrackPlayer key={track.id} track={track} volume={volume} muted={globalMute} />
      ))}

      {!hasVideo && (
        <div className="absolute inset-0 flex flex-col items-center justify-center bg-zinc-900/40 backdrop-blur-[2px] z-0">
          {user.avatarUrl ? (
            <img src={user.avatarUrl} alt="Avatar" className={`w-20 h-20 rounded-full object-cover transition-all shadow-xl ${isSpeaking ? 'ring-4 ring-blue-500 ring-offset-4 ring-offset-zinc-900 scale-110' : ''} ${isLocal && !isMuted && !isSpeaking ? 'ring-2 ring-indigo-500/50' : ''}`} />
          ) : (
            <div className={`w-20 h-20 rounded-full flex items-center justify-center text-2xl font-bold bg-zinc-800 text-zinc-300 transition-all ${isSpeaking ? 'ring-4 ring-blue-500 ring-offset-4 ring-offset-zinc-900 scale-110' : ''} ${isLocal && !isMuted && !isSpeaking ? 'ring-2 ring-indigo-500/50' : ''}`}>
              {user.username[0].toUpperCase()}
            </div>
          )}
        </div>
      )}

      <div className="absolute bottom-2 left-2 bg-black/60 backdrop-blur-md px-2 py-1 rounded-md text-xs font-medium text-white flex items-center gap-1.5 z-10 transition-opacity">
        {user.username} {isLocal && '(You)'}
        {(!isLocal && globalMute) || (isLocal && isMuted) ? <MicOff size={10} className="text-red-400" /> : null}
      </div>

      {!isLocal && (
        <div className="absolute bottom-2 right-2 bg-black/60 backdrop-blur-md px-3 py-1.5 rounded-md opacity-0 group-hover:opacity-100 transition-opacity z-20 flex items-center gap-2">
           <Volume2 size={12} className="text-zinc-300" />
           <input 
             type="range" 
             min="0" max="1" step="0.05" 
             value={volume} 
             onChange={e => { e.stopPropagation(); setVolume(parseFloat(e.target.value)); }} 
             className="w-16 sm:w-20 h-1 bg-zinc-700 rounded-lg appearance-none cursor-pointer accent-indigo-500" 
           />
        </div>
      )}

      {hasVideo && (
        <button
          onClick={toggleFullscreen}
          className="absolute top-2 right-2 bg-black/60 backdrop-blur-md p-1.5 rounded-md text-white opacity-0 group-hover:opacity-100 transition-opacity z-10 hover:bg-zinc-700"
          title={isFullscreen ? "Exit Fullscreen" : "Fullscreen"}
        >
          {isFullscreen ? <Minimize size={14} /> : <Maximize size={14} />}
        </button>
      )}
    </div>
  );
};

export default function VoiceRoom({ socket, channelId, user, isMinimized, onDisconnect }: VoiceRoomProps) {
  const [participants, setParticipants] = useState<any[]>([]);
  const [inCall, setInCall] = useState(false);

  const [isMuted, setIsMuted] = useState(false);
  const [isVideoOn, setIsVideoOn] = useState(false);
  const [isScreenSharing, setIsScreenSharing] = useState(false);
  const [isDeafened, setIsDeafened] = useState(false);
  const [facingMode, setFacingMode] = useState<'user' | 'environment'>('user');

  const [focusedStreamId, setFocusedStreamId] = useState<string | null>(null);

  const [renderTick, setRenderTick] = useState(0);

  const localStreamRef = useRef<MediaStream | null>(null);
  const screenStreamRef = useRef<MediaStream | null>(null);
  const peersRef = useRef<{ [socketId: string]: RTCPeerConnection }>({});
  const remoteStreamsRef = useRef<{ [socketId: string]: MediaStream }>({});

  const cleanupAll = useCallback(() => {
    if (localStreamRef.current) {
      localStreamRef.current.getTracks().forEach(t => t.stop());
      localStreamRef.current = null;
    }
    if (screenStreamRef.current) {
      screenStreamRef.current.getTracks().forEach(t => t.stop());
      screenStreamRef.current = null;
    }
    Object.values(peersRef.current).forEach(peer => peer.close());
    peersRef.current = {};
    remoteStreamsRef.current = {};
    setParticipants([]);
    setInCall(false);
    setIsVideoOn(false);
    setIsScreenSharing(false);
    setIsMuted(false);
    setIsDeafened(false);
  }, []);

  useEffect(() => {
    if (!socket) return;

    const handleVoiceParticipants = (parts: any[]) => {
      const filtered = parts.filter(p => p.user.id !== user.id);
      setParticipants(filtered);
    };

    const handleUserJoined = async ({ socketId, user: joinedUser }: any) => {
      if (joinedUser.id === user.id) return;

      setParticipants(p => {
        const existing = p.find(x => x.socketId === socketId);
        if (existing) return p;
        return [...p, { socketId, user: joinedUser }];
      });

      if (inCall) {
        const peer = createPeer(socketId);
        const offer = await peer.createOffer();
        await peer.setLocalDescription(offer);
        socket.emit('webrtc-signal', { target: socketId, caller: socket.id, signal: { type: 'offer', sdp: offer } });
      }
    };

    const handleUserLeft = (socketId: string) => {
      setParticipants(p => p.filter(x => x.socketId !== socketId));
      if (peersRef.current[socketId]) {
        peersRef.current[socketId].close();
        delete peersRef.current[socketId];
      }
      delete remoteStreamsRef.current[socketId];
      setRenderTick(t => t + 1);
    };

    const handleSignal = async (data: { caller: string, signal: any }) => {
      if (!inCall) return;
      const sender = data.caller;
      const sig = data.signal;

      let peer = peersRef.current[sender];

      try {
        if (sig.type === 'offer') {
          if (!peer) peer = createPeer(sender);
          await peer.setRemoteDescription(new RTCSessionDescription(sig.sdp));
          const answer = await peer.createAnswer();
          await peer.setLocalDescription(answer);
          socket.emit('webrtc-signal', { target: sender, caller: socket.id, signal: { type: 'answer', sdp: answer } });
        } else if (sig.type === 'answer') {
          if (peer) {
            await peer.setRemoteDescription(new RTCSessionDescription(sig.sdp));
          }
        } else if (sig.type === 'candidate') {
          if (peer && sig.candidate) {
            await peer.addIceCandidate(new RTCIceCandidate(sig.candidate));
          }
        }
      } catch (err) {
        console.error("Signal Handling Error:", err);
      }
    };

    const handleStreamState = ({ socketId, isStreaming }: any) => {
      setParticipants(p => p.map(x => x.socketId === socketId ? { ...x, isStreaming } : x));
    };

    socket.on('voice-participants', handleVoiceParticipants);
    socket.on('user-joined-voice', handleUserJoined);
    socket.on('user-left-voice', handleUserLeft);
    socket.on('webrtc-signal', handleSignal);
    socket.on('user-stream-state', handleStreamState);

    return () => {
      socket.off('voice-participants', handleVoiceParticipants);
      socket.off('user-joined-voice', handleUserJoined);
      socket.off('user-left-voice', handleUserLeft);
      socket.off('webrtc-signal', handleSignal);
      socket.off('user-stream-state', handleStreamState);
    };
  }, [socket, channelId, inCall]);

  const createPeer = (targetSocketId: string) => {
    const peer = new RTCPeerConnection(ICE_SERVERS);
    peersRef.current[targetSocketId] = peer;

    peer.onicecandidate = (event) => {
      if (event.candidate) {
        socket?.emit('webrtc-signal', { target: targetSocketId, caller: socket?.id, signal: { type: 'candidate', candidate: event.candidate } });
      }
    };

    peer.ontrack = (event) => {
      if (!remoteStreamsRef.current[targetSocketId]) {
        remoteStreamsRef.current[targetSocketId] = new MediaStream();
      }
      remoteStreamsRef.current[targetSocketId].addTrack(event.track);
      setRenderTick(t => t + 1);
    };

    if (localStreamRef.current) {
      localStreamRef.current.getTracks().forEach(t => peer.addTrack(t, localStreamRef.current!));
    }

    peer.onnegotiationneeded = async () => {
      try {
        const offer = await peer.createOffer();
        await peer.setLocalDescription(offer);
        socket?.emit('webrtc-signal', { target: targetSocketId, caller: socket?.id, signal: { type: 'offer', sdp: peer.localDescription } });
      } catch (err) {
        console.error("Negotiation Error:", err);
      }
    };

    return peer;
  };

  const joinVoice = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true, video: false });
      localStreamRef.current = stream;
      setInCall(true);
      socket?.emit('join-voice', channelId);
      setRenderTick(t => t + 1);
    } catch (e) {
      console.error(e);
      alert('Microphone access denied. Please allow permissions.');
    }
  };

  const endCall = () => {
    socket?.emit('leave-voice', channelId);
    cleanupAll();
    if (onDisconnect) onDisconnect();
  };

  useEffect(() => {
    return () => {
      socket?.emit('leave-voice', channelId);
      cleanupAll();
      // Only call onDisconnect if user initiates, not on unmount to avoid state update loops
    };
  }, [socket, channelId, cleanupAll]);

  const replaceTrackInPeers = (newTrack: MediaStreamTrack) => {
    Object.values(peersRef.current).forEach(peer => {
      const senders = peer.getSenders();
      const sender = senders.find(s => s.track?.kind === newTrack.kind);
      if (sender) {
        sender.replaceTrack(newTrack);
      } else if (localStreamRef.current) {
        peer.addTrack(newTrack, localStreamRef.current);
      }
    });
  };

  const removeTrackFromPeers = (track: MediaStreamTrack) => {
    Object.values(peersRef.current).forEach(peer => {
      const senders = peer.getSenders();
      const sender = senders.find(s => s.track === track);
      if (sender) {
        peer.removeTrack(sender);
      }
    });
  };

  const toggleMute = () => {
    if (localStreamRef.current) {
      const audioTrack = localStreamRef.current.getAudioTracks()[0];
      if (audioTrack) {
        audioTrack.enabled = !audioTrack.enabled;
        setIsMuted(!audioTrack.enabled);
      }
    }
  };

  const toggleVideo = async () => {
    if (!localStreamRef.current) return;
    try {
      if (isVideoOn) {
        const videoTrack = localStreamRef.current.getVideoTracks()[0];
        if (videoTrack) {
          videoTrack.stop();
          localStreamRef.current.removeTrack(videoTrack);
          removeTrackFromPeers(videoTrack);
        }
        setIsVideoOn(false);
      } else {
        const stream = await navigator.mediaDevices.getUserMedia({ video: true });
        const videoTrack = stream.getVideoTracks()[0];
        localStreamRef.current.addTrack(videoTrack);
        replaceTrackInPeers(videoTrack);
        setIsVideoOn(true);
      }
      setRenderTick(t => t + 1);
    } catch (e) { console.error("Video error", e); }
  };

  const toggleDeafen = () => {
    setIsDeafened(prev => !prev);
  };

  const toggleCameraFlip = async () => {
    if (!isVideoOn || !localStreamRef.current) return;
    const newMode = facingMode === 'user' ? 'environment' : 'user';
    const videoTrack = localStreamRef.current.getVideoTracks()[0];
    if (videoTrack) {
        videoTrack.stop();
        localStreamRef.current.removeTrack(videoTrack);
    }
    
    try {
        const stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: newMode } });
        const newTrack = stream.getVideoTracks()[0];
        localStreamRef.current.addTrack(newTrack);
        replaceTrackInPeers(newTrack);
        setFacingMode(newMode);
        setRenderTick(t => t + 1);
    } catch(e) {
        console.error("Camera flip failed", e);
    }
  };

  const toggleScreenShare = async () => {
    if (!localStreamRef.current) return;
    try {
      if (isScreenSharing && screenStreamRef.current) {
        screenStreamRef.current.getTracks().forEach(t => {
          t.stop();
          removeTrackFromPeers(t);
        });
        screenStreamRef.current = null;
        setIsScreenSharing(false);
        socket?.emit('set-stream-state', { roomId: channelId, isStreaming: false });
        if (isVideoOn) {
          const stream = await navigator.mediaDevices.getUserMedia({ video: true });
          const videoTrack = stream.getVideoTracks()[0];
          localStreamRef.current.addTrack(videoTrack);
          replaceTrackInPeers(videoTrack);
        }
      } else {
        const screenStream = await navigator.mediaDevices.getDisplayMedia({ video: true, audio: true });
        screenStreamRef.current = screenStream;
        const screenVideoTrack = screenStream.getVideoTracks()[0];
        const screenAudioTrack = screenStream.getAudioTracks()[0];

        if (isVideoOn) {
          const videoTrack = localStreamRef.current.getVideoTracks()[0];
          if (videoTrack) {
            videoTrack.stop();
            localStreamRef.current.removeTrack(videoTrack);
            removeTrackFromPeers(videoTrack);
          }
          setIsVideoOn(false);
        }

        replaceTrackInPeers(screenVideoTrack);
        if (screenAudioTrack) {
          Object.values(peersRef.current).forEach(peer => peer.addTrack(screenAudioTrack, screenStream));
        }
        
        socket?.emit('set-stream-state', { roomId: channelId, isStreaming: true });

        screenVideoTrack.onended = () => {
          setIsScreenSharing(false);
          socket?.emit('set-stream-state', { roomId: channelId, isStreaming: false });
          if (screenAudioTrack) removeTrackFromPeers(screenAudioTrack);
          removeTrackFromPeers(screenVideoTrack);
        };
        setIsScreenSharing(true);
      }
      setRenderTick(t => t + 1);
    } catch (e) { console.error("Screen share error", e); }
  };

  if (isMinimized) {
    if (!inCall) return null;
    return (
      <div className="fixed top-20 left-1/2 -translate-x-1/2 bg-indigo-950/90 backdrop-blur-xl border border-indigo-500/30 px-5 py-2.5 rounded-full shadow-[0_5px_30px_rgba(99,102,241,0.4)] z-[60] flex items-center gap-4 cursor-pointer hover:bg-indigo-900 transition-colors">
         <div className="flex items-center gap-2">
           <div className="w-2.5 h-2.5 bg-green-500 rounded-full animate-pulse shadow-[0_0_10px_rgba(34,197,94,0.6)]"></div>
           <span className="text-[13px] font-bold text-indigo-100 tracking-wide uppercase hidden sm:block">Voice Active</span>
         </div>
         <div className="w-px h-5 bg-indigo-500/50 mx-1"></div>
         <div className="flex items-center gap-3">
           <button onClick={(e) => { e.stopPropagation(); toggleMute(); }} className="text-white hover:text-indigo-200 transition-colors p-1">
             {isMuted ? <MicOff size={18} className="text-red-400" /> : <Mic size={18} />}
           </button>
           <button onClick={(e) => { e.stopPropagation(); toggleVideo(); }} className="text-white hover:text-indigo-200 transition-colors p-1" disabled={isScreenSharing}>
             {isVideoOn ? <Video size={18} className="text-indigo-400" /> : <VideoOff size={18} />}
           </button>
           <button onClick={(e) => { e.stopPropagation(); endCall(); }} className="text-red-400 hover:text-red-300 transition-colors p-1 bg-red-500/10 rounded-full">
             <PhoneOff size={18} />
           </button>
         </div>
      </div>
    );
  }

  return (
    <div className="flex-1 flex flex-col bg-zinc-950 overflow-hidden relative">
      <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/cubes.png')] opacity-[0.02] pointer-events-none z-0"></div>

      {!inCall ? (
        <div className="flex-1 flex flex-col items-center justify-center p-8 z-10">
          <div className="max-w-3xl w-full text-center mb-12">
            <div className="inline-flex items-center justify-center w-20 h-20 rounded-full bg-indigo-500/10 mb-6 border border-indigo-500/20 shadow-[0_0_30px_rgba(99,102,241,0.15)]">
              <Volume2 size={40} className="text-indigo-400" />
            </div>
            <h2 className="text-3xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-blue-400 to-indigo-500 mb-4">Voice Comm Link</h2>
            <p className="text-zinc-400 max-w-lg mx-auto leading-relaxed">
              Connect to the secure Stark Industries voice network. Communications are end-to-end encrypted.
            </p>
          </div>
          <button
            onClick={joinVoice}
            className="group relative px-8 py-4 bg-indigo-600 hover:bg-indigo-500 text-white font-bold rounded-xl transition-all shadow-[0_0_20px_rgba(79,70,229,0.4)] hover:shadow-[0_0_30px_rgba(79,70,229,0.6)] flex items-center gap-3 overflow-hidden"
          >
            <div className="absolute inset-0 bg-gradient-to-r from-blue-400/0 via-white/20 to-indigo-500/0 -translate-x-full group-hover:translate-x-full transition-transform duration-1000"></div>
            <Mic size={22} />
            Establish Connection
          </button>
        </div>
      ) : (
        <div className="flex-1 flex flex-col p-6 z-10 w-full h-full max-h-screen">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-bold flex items-center gap-2 text-zinc-100">
              <Users size={18} className="text-indigo-400" />
              Connected Agents ({participants.length + 1})
            </h3>
            <div className="px-3 py-1 bg-green-500/10 border border-green-500/20 text-green-400 rounded-full text-xs font-bold tracking-wider uppercase animate-pulse">
              Network Active
            </div>
          </div>

          {focusedStreamId ? (
            <div className="flex-1 flex flex-col md:flex-row gap-4 mb-20">
               <div className="flex-1 md:w-3/4 flex rounded-2xl overflow-hidden bg-black shadow-2xl relative group h-[40vh] md:h-full">
                  {participants.filter(p => p.socketId === focusedStreamId).map(p => (
                     <VideoPlayer
                       key={`focused-${p.socketId}`}
                       stream={remoteStreamsRef.current[p.socketId]}
                       isLocal={false}
                       user={p.user}
                       refreshTrigger={renderTick}
                       globalMute={isDeafened}
                       isStreaming={p.isStreaming}
                       isWatching={true}
                       isFocused={true}
                       onUnwatch={() => setFocusedStreamId(null)}
                     />
                  ))}
               </div>
               <div className="flex flex-row md:flex-col gap-2 w-full md:w-64 overflow-x-auto md:overflow-y-auto hide-scrollbar">
                  <div className="w-1/2 md:w-full shrink-0 h-32 md:h-auto md:aspect-video">
                    <VideoPlayer
                      stream={isScreenSharing ? screenStreamRef.current : localStreamRef.current}
                      isLocal={true}
                      user={user}
                      isMuted={isMuted}
                      refreshTrigger={`${isVideoOn}-${isScreenSharing}-${renderTick}`}
                    />
                  </div>
                  {participants.filter(p => p.socketId !== focusedStreamId).map(p => (
                    <div key={p.socketId} className="w-1/2 md:w-full shrink-0 h-32 md:h-auto md:aspect-video">
                      <VideoPlayer
                        stream={remoteStreamsRef.current[p.socketId]}
                        isLocal={false}
                        user={p.user}
                        refreshTrigger={renderTick}
                        globalMute={isDeafened}
                        isStreaming={p.isStreaming}
                        isWatching={false}
                        onWatch={() => setFocusedStreamId(p.socketId)}
                      />
                    </div>
                  ))}
               </div>
            </div>
          ) : (
            <div className={`flex-1 grid gap-4 mb-20 ${participants.length === 0 ? 'grid-cols-1 md:w-3/4 mx-auto' : participants.length === 1 ? 'grid-cols-2' : participants.length <= 3 ? 'grid-cols-2 lg:grid-cols-2' : 'grid-cols-3'}`}>
              <VideoPlayer
                stream={isScreenSharing ? screenStreamRef.current : localStreamRef.current}
                isLocal={true}
                user={user}
                isMuted={isMuted}
                refreshTrigger={`${isVideoOn}-${isScreenSharing}-${renderTick}`}
              />
              {participants.map(p => {
                const isWatching = !p.isStreaming;
                return (
                  <VideoPlayer
                    key={p.socketId}
                    stream={remoteStreamsRef.current[p.socketId]}
                    isLocal={false}
                    user={p.user}
                    refreshTrigger={renderTick}
                    globalMute={isDeafened}
                    isStreaming={p.isStreaming}
                    isWatching={isWatching}
                    onWatch={() => setFocusedStreamId(p.socketId)}
                  />
                )
              })}
            </div>
          )}

          <div className="absolute bottom-6 left-1/2 -translate-x-1/2 w-[95%] sm:w-auto overflow-x-auto bg-zinc-900/90 backdrop-blur-xl border border-zinc-800 rounded-2xl px-4 sm:px-6 py-3 shadow-[0_10px_40px_-10px_rgba(0,0,0,0.5)] flex items-center justify-center gap-2 sm:gap-4 z-50 flex-nowrap hide-scrollbar">
            <button
               onClick={toggleDeafen}
               className={`p-3 rounded-xl transition-all flex items-center justify-center hover:scale-105 ${isDeafened ? 'bg-red-500/20 text-red-500 border border-red-500/30' : 'bg-zinc-800/80 text-zinc-200 hover:bg-zinc-700 border border-zinc-700/50'}`}
               title={isDeafened ? "Undeafen" : "Deafen"}
            >
               {isDeafened ? <VolumeX size={22} /> : <Headphones size={22} />}
            </button>
            <button
              onClick={toggleMute}
              className={`p-3 rounded-xl transition-all flex items-center justify-center hover:scale-105 ${isMuted ? 'bg-red-500/20 text-red-500 border border-red-500/30' : 'bg-zinc-800/80 text-zinc-200 hover:bg-zinc-700 border border-zinc-700/50'}`}
              title={isMuted ? "Unmute" : "Mute"}
            >
              {isMuted ? <MicOff size={22} /> : <Mic size={22} />}
            </button>
            <button
              onClick={toggleVideo}
              disabled={isScreenSharing}
              className={`p-3 rounded-xl transition-all flex items-center justify-center hover:scale-105 ${isVideoOn ? 'bg-indigo-500/20 text-indigo-400 border border-indigo-500/30' : 'bg-zinc-800/80 text-zinc-200 hover:bg-zinc-700 border border-zinc-700/50'} disabled:opacity-50 disabled:hover:scale-100`}
              title={isVideoOn ? "Turn off camera" : "Turn on camera"}
            >
              {isVideoOn ? <Video size={22} /> : <VideoOff size={22} />}
            </button>
            {isVideoOn && (
              <button
                onClick={toggleCameraFlip}
                className="p-3 rounded-xl transition-all flex items-center justify-center hover:scale-105 bg-zinc-800/80 text-zinc-200 hover:bg-zinc-700 border border-zinc-700/50 md:hidden"
                title="Flip Camera (Mobile)"
              >
                <RefreshCw size={22} className="hover:rotate-180 transition-transform duration-500" />
              </button>
            )}
            <button
              onClick={toggleScreenShare}
              className={`hidden md:flex p-3 rounded-xl transition-all items-center justify-center hover:scale-105 ${isScreenSharing ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30' : 'bg-zinc-800/80 text-zinc-200 hover:bg-zinc-700 border border-zinc-700/50'}`}
              title={isScreenSharing ? "Stop sharing" : "Share screen"}
            >
              {isScreenSharing ? <MonitorUp size={22} /> : <Monitor size={22} />}
            </button>

            <div className="w-px h-8 bg-zinc-800 mx-2"></div>

            <button
              onClick={endCall}
              className="px-6 py-3 bg-red-600 hover:bg-red-500 text-white font-bold rounded-xl transition-all shadow-[0_0_15px_rgba(220,38,38,0.3)] hover:shadow-[0_0_25px_rgba(220,38,38,0.5)] flex items-center gap-2 hover:scale-105"
            >
              <PhoneOff size={20} />
              Disconnect
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
