import { useState, useRef } from 'react';
import { Download, Play, Pause, File, ZoomIn } from 'lucide-react';
import ImageLightbox from './ImageLightbox';

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
  const [lightbox, setLightbox] = useState(false);

  if (fileType === 'image') {
    return (
      <>
        <div
          className="relative group rounded-xl overflow-hidden max-w-xs shadow-sm cursor-pointer"
          style={{ border: '1px solid var(--border)' }}
          onClick={() => setLightbox(true)}
        >
          <img
            src={fileUrl}
            alt={fileName || 'image'}
            className="max-w-full max-h-64 object-cover transition-opacity group-hover:opacity-90"
          />
          {/* Hover overlay */}
          <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity bg-black/30">
            <div className="p-2 rounded-full bg-black/50">
              <ZoomIn size={20} className="text-white" />
            </div>
          </div>
          {/* Download button */}
          <a
            href={fileUrl}
            download={fileName}
            onClick={e => e.stopPropagation()}
            className="absolute bottom-2 right-2 p-1.5 rounded-lg bg-black/50 text-white opacity-0 group-hover:opacity-100 transition-opacity hover:bg-black/70"
          >
            <Download size={13} />
          </a>
        </div>
        {lightbox && <ImageLightbox src={fileUrl} fileName={fileName} onClose={() => setLightbox(false)} />}
      </>
    );
  }

  if (fileType === 'audio') {
    return (
      <div className="px-4 py-2.5 rounded-2xl max-w-xs shadow-sm backdrop-blur-sm"
        style={{
          background: isMe ? 'var(--msg-me-bg)' : 'var(--msg-other-bg)',
          border: `1px solid ${isMe ? 'var(--msg-me-border)' : 'var(--msg-other-border)'}`,
          color: isMe ? 'var(--msg-me-text)' : 'var(--msg-other-text)',
        }}>
        <div className="text-xs opacity-70 mb-1">🎤 Ses mesajı</div>
        <AudioPlayer fileUrl={fileUrl} />
      </div>
    );
  }

  // Generic file
  return (
    <div className="px-4 py-3 rounded-xl max-w-xs shadow-sm backdrop-blur-sm"
      style={{
        background: isMe ? 'var(--msg-me-bg)' : 'var(--msg-other-bg)',
        border: `1px solid ${isMe ? 'var(--msg-me-border)' : 'var(--msg-other-border)'}`,
        color: isMe ? 'var(--msg-me-text)' : 'var(--msg-other-text)',
      }}>
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 rounded-lg flex items-center justify-center shrink-0" style={{ background: 'var(--accent-bg)', border: '1px solid var(--border-accent)' }}>
          <File size={20} style={{ color: 'var(--text-accent)' }} />
        </div>
        <div className="flex-1 min-w-0">
          <div className="text-sm font-medium truncate">{fileName || 'Dosya'}</div>
          {content && <div className="text-xs opacity-70">{content}</div>}
        </div>
        <a href={fileUrl} download={fileName} target="_blank" rel="noreferrer"
          className="p-1.5 rounded-lg transition-colors hover:opacity-80 shrink-0"
          style={{ background: 'var(--accent-bg)', border: '1px solid var(--border-accent)', color: 'var(--text-accent)' }}>
          <Download size={14} />
        </a>
      </div>
    </div>
  );
}
