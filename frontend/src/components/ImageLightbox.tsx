import { useEffect } from 'react';
import { X, Download, ZoomIn } from 'lucide-react';

interface Props {
  src: string;
  fileName?: string;
  onClose: () => void;
}

export default function ImageLightbox({ src, fileName, onClose }: Props) {
  useEffect(() => {
    const handler = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose(); };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [onClose]);

  const handleDownload = () => {
    const a = document.createElement('a');
    a.href = src;
    a.download = fileName || 'image';
    a.target = '_blank';
    a.click();
  };

  return (
    <div
      className="fixed inset-0 z-[300] flex items-center justify-center bg-black/90 backdrop-blur-sm"
      onClick={onClose}
    >
      <div className="absolute top-4 right-4 flex gap-2 z-10">
        <button
          onClick={e => { e.stopPropagation(); handleDownload(); }}
          className="p-2.5 rounded-lg bg-white/10 hover:bg-white/20 text-white transition-colors"
          title="İndir"
        >
          <Download size={18} />
        </button>
        <button
          onClick={onClose}
          className="p-2.5 rounded-lg bg-white/10 hover:bg-white/20 text-white transition-colors"
        >
          <X size={18} />
        </button>
      </div>

      <div className="relative max-w-[90vw] max-h-[90vh]" onClick={e => e.stopPropagation()}>
        <img
          src={src}
          alt={fileName || 'image'}
          className="max-w-full max-h-[90vh] object-contain rounded-lg shadow-2xl"
        />
        {fileName && (
          <div className="absolute bottom-0 left-0 right-0 px-4 py-2 bg-black/60 rounded-b-lg text-xs text-white/70 text-center truncate">
            {fileName}
          </div>
        )}
      </div>
    </div>
  );
}
