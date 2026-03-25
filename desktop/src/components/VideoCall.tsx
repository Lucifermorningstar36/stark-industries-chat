import React, { useEffect, useRef, useState } from 'react';
import { Socket } from 'socket.io-client';
import { Video, Mic, PhoneOff, MonitorUp } from 'lucide-react';

interface VideoCallProps {
  socket: Socket | null;
  channelId: string | null;
}

export default function VideoCall({ socket, channelId }: VideoCallProps) {
  const [inCall, setInCall] = useState(false);
  const localVideoRef = useRef<HTMLVideoElement>(null);
  const remoteVideoRef = useRef<HTMLVideoElement>(null);
  const peerConnection = useRef<RTCPeerConnection | null>(null);

  useEffect(() => {
    if (!socket) return;
    
    socket.on('offer', async (offer) => {
      // Basic answering logic...
      console.log('Received offer', offer);
    });

    return () => {
      socket.off('offer');
    }
  }, [socket]);

  const startCall = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: true, audio: true });
      if (localVideoRef.current) localVideoRef.current.srcObject = stream;
      setInCall(true);
      socket?.emit('join-room', channelId);
      // Initialize peer connection and create offer...
    } catch (e) {
      console.error('Failed to get media devices.', e);
      alert('Camera/Microphone access denied or unavailable.');
    }
  };

  const endCall = () => {
    setInCall(false);
    if (localVideoRef.current?.srcObject) {
      const tracks = (localVideoRef.current.srcObject as MediaStream).getTracks();
      tracks.forEach(t => t.stop());
    }
    peerConnection.current?.close();
  };

  return (
    <div className="bg-zinc-950 p-4 border-l border-zinc-800 flex flex-col gap-4 w-72">
      <h3 className="font-bold text-zinc-100 flex items-center gap-2">
        <Video size={18} className="text-indigo-400" />
        Comm Link
      </h3>

      <div className="bg-zinc-900 rounded-xl overflow-hidden aspect-video relative border border-zinc-800">
        <video ref={localVideoRef} autoPlay muted playsInline className="w-full h-full object-cover" />
        {!inCall && (
          <div className="absolute inset-0 flex items-center justify-center text-zinc-600 text-sm">
            Local Camera Off
          </div>
        )}
      </div>

      <div className="bg-zinc-900 rounded-xl overflow-hidden aspect-video relative border border-zinc-800">
        <video ref={remoteVideoRef} autoPlay playsInline className="w-full h-full object-cover" />
        <div className="absolute inset-0 flex items-center justify-center text-zinc-600 text-sm">
          Waiting for peer...
        </div>
      </div>

      <div className="flex justify-center gap-2 mt-2">
        {!inCall ? (
          <button onClick={startCall} className="p-3 bg-indigo-600 hover:bg-indigo-500 rounded-full text-white transition-colors">
            <Video size={20} />
          </button>
        ) : (
          <>
            <button className="p-3 bg-zinc-800 hover:bg-zinc-700 rounded-full text-white transition-colors">
              <Mic size={20} />
            </button>
            <button className="p-3 bg-zinc-800 hover:bg-zinc-700 rounded-full text-zinc-300 transition-colors">
              <MonitorUp size={20} />
            </button>
            <button onClick={endCall} className="p-3 bg-red-600 hover:bg-red-500 rounded-full text-white transition-colors shadow-[0_0_15px_rgba(220,38,38,0.5)]">
              <PhoneOff size={20} />
            </button>
          </>
        )}
      </div>
    </div>
  );
}
