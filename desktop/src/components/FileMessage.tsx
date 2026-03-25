import React, { useState, useRef } from 'react';
import { Download, Play, Pause, File } from 'lucide-react';

interface Props {
  fileUrl: string;
  fileType: string;
  fileName?: string;
  content?: string;
  isMe: boolean;
}

function AudioPlayer({ fileUrl }: { fileUrl: string }) {
  const [playing, setPlaying] = useState(false);
  const [progress, setProgress] = useState(0);
  const audioRef = useRef<HTMLAudioElement>(null);

  const toggle = () => {
    if (!audioRef.current) return;
    if (playing) { audioRef.current.pause(); setPlaying(false); }
    else { audioRef.current.play(); setPlaying(true); }
  };

  return (
    <div className="flex items-center gap-3 py-1">
      <audio
        ref={audioRef}
        src={fileUrl}
        onTimeUpdate={() => {
          if (audioRef.current) setProgress((audioRef.current.currentTime / audioRef.current.duration) * 100 || 0);
        }}
        onEnded={() => { setPlaying(false); setProgress(0); }}
      />
      <button onClick={toggle} className="w-8 h-8 rounded-full bg-white/20 flex items-center justify-center hover:bg-white/30 transition-colors shrink-0">
        {playing ? <Pause size={14} /> : <Play size={14} />}
      </button>
      <div className="flex-1 h-1.5 bg-white/20 rounded-full overflow-hidden min-w-[80px]">
        <div className="h-full bg-white/70 rounded-full transition-all" style={{ width: `${progress}%` }} />
      </div>
    </div>
  );
}

export default function FileMessage({ fileUrl, fileType, fileName, content, isMe }: Props) {
  const base = isMe ? 'bg-indigo-600 text-white rounded-tr-sm' : 'bg-zinc-800 text-zinc-200 rounded-tl-sm';

  if (fileType === 'image') {
    return (
      <div className={`rounded-2xl overflow-hidden max-w-xs shadow-sm ${isMe ? 'rounded-tr-sm' : 'rounded-tl-sm'}`}>
        <img
          src={fileUrl}
          alt={fileName || 'image'}
          className="max-w-full max-h-64 object-cover cursor-pointer hover:opacity-90 transition-opacity"
          onClick={() => window.open(fileUrl, '_blank')}
        />
      </div>
    );
  }

  if (fileType === 'audio') {
    return (
      <div className={`px-4 py-2.5 rounded-2xl max-w-xs shadow-sm ${base}`}>
        <div className="text-xs opacity-70 mb-1">🎤 Voice message</div>
        <AudioPlayer fileUrl={fileUrl} />
      </div>
    );
  }

  // Generic file
  return (
    <div className={`px-4 py-3 rounded-2xl max-w-xs shadow-sm ${base}`}>
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 rounded-lg bg-white/10 flex items-center justify-center shrink-0">
          <File size={20} />
        </div>
        <div className="flex-1 min-w-0">
          <div className="text-sm font-medium truncate">{fileName || 'File'}</div>
          {content && <div className="text-xs opacity-70">{content}</div>}
        </div>
        <a href={fileUrl} download={fileName} className="p-1.5 rounded-lg bg-white/10 hover:bg-white/20 transition-colors shrink-0">
          <Download size={14} />
        </a>
      </div>
    </div>
  );
}
