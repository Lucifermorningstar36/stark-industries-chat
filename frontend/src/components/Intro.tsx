import React, { useRef, useEffect } from 'react';

interface Props {
  onFinish: () => void;
}

export default function Intro({ onFinish }: Props) {
  const videoRef = useRef<HTMLVideoElement>(null);

  useEffect(() => {
    // Failsafe: if video is blocked or stuck, skip after some time
    // Default video is probably a few seconds. We don't want the user stuck forever.
    const fallbackTimeout = setTimeout(() => {
      onFinish();
    }, 15000); // 15 seconds max wait

    return () => clearTimeout(fallbackTimeout);
  }, [onFinish]);

  const handleVideoEnd = () => {
    onFinish();
  };

  const handleSkip = () => {
    onFinish();
  };

  return (
    <div className="fixed inset-0 z-[100] bg-black flex items-center justify-center overflow-hidden">
      <video
        ref={videoRef}
        src="/intro.mp4"
        autoPlay
        muted
        playsInline
        onEnded={handleVideoEnd}
        onClick={handleSkip}
        className="w-full h-full object-cover cursor-pointer"
        style={{ pointerEvents: 'auto' }}
      />
      <div className="absolute bottom-6 text-zinc-600 text-xs tracking-[0.2em] font-medium uppercase font-sans animate-pulse pointer-events-none">
        Initializing JARVIS Protocol...
      </div>
    </div>
  );
}
