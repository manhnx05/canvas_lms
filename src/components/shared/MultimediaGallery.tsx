import { useState } from 'react';
import { X, Play, Image as ImageIcon, ChevronLeft, ChevronRight, Maximize2 } from 'lucide-react';

interface MediaItem {
  id: string;
  type: 'image' | 'video';
  url: string;
  title: string;
  thumbnail?: string;
}

interface MultimediaGalleryProps {
  items: MediaItem[];
  title?: string;
}

export function MultimediaGallery({ items, title = 'Thư viện Media' }: MultimediaGalleryProps) {
  const [activeIdx, setActiveIdx] = useState<number | null>(null);

  const open = (idx: number) => setActiveIdx(idx);
  const close = () => setActiveIdx(null);
  const prev = () => setActiveIdx(i => (i !== null ? (i - 1 + items.length) % items.length : 0));
  const next = () => setActiveIdx(i => (i !== null ? (i + 1) % items.length : 0));

  if (items.length === 0) return null;

  return (
    <div className="space-y-4">
      <h3 className="font-extrabold text-slate-800 text-lg flex items-center gap-2">
        <ImageIcon className="w-5 h-5 text-sky-500" />
        {title}
      </h3>

      {/* Grid */}
      <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
        {items.map((item, idx) => (
          <div
            key={item.id}
            onClick={() => open(idx)}
            className="relative group rounded-2xl overflow-hidden aspect-video bg-slate-100 cursor-pointer border-2 border-transparent hover:border-sky-300 transition-all shadow-sm"
          >
            {item.type === 'image' ? (
              <img src={item.url} alt={item.title} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300" />
            ) : (
              <>
                <img src={item.thumbnail || item.url} alt={item.title} className="w-full h-full object-cover" />
                <div className="absolute inset-0 flex items-center justify-center bg-black/20 group-hover:bg-black/30 transition-colors">
                  <div className="w-12 h-12 bg-white/90 rounded-full flex items-center justify-center shadow-lg">
                    <Play className="w-5 h-5 text-sky-600 fill-sky-600 ml-0.5" />
                  </div>
                </div>
              </>
            )}
            <div className="absolute inset-0 bg-black/0 group-hover:bg-black/10 transition-colors" />
            <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity">
              <div className="bg-black/50 rounded-lg p-1">
                <Maximize2 className="w-3.5 h-3.5 text-white" />
              </div>
            </div>
            <div className="absolute bottom-0 left-0 right-0 p-2 bg-gradient-to-t from-black/60 to-transparent opacity-0 group-hover:opacity-100 transition-opacity">
              <p className="text-white text-xs font-medium truncate">{item.title}</p>
            </div>
          </div>
        ))}
      </div>

      {/* Lightbox */}
      {activeIdx !== null && (
        <div className="fixed inset-0 z-50 bg-black/90 flex items-center justify-center p-4" onClick={close}>
          <button onClick={close} className="absolute top-4 right-4 p-2 bg-white/10 hover:bg-white/20 rounded-xl transition-colors">
            <X className="w-6 h-6 text-white" />
          </button>

          <button onClick={e => { e.stopPropagation(); prev(); }} className="absolute left-4 p-2 bg-white/10 hover:bg-white/20 rounded-xl transition-colors">
            <ChevronLeft className="w-6 h-6 text-white" />
          </button>

          <div onClick={e => e.stopPropagation()} className="max-w-4xl w-full">
            {items[activeIdx].type === 'image' ? (
              <img src={items[activeIdx].url} alt={items[activeIdx].title} className="w-full rounded-2xl object-contain max-h-[80vh]" />
            ) : (
              <video src={items[activeIdx].url} controls autoPlay className="w-full rounded-2xl max-h-[80vh]" />
            )}
            <p className="text-white text-center mt-3 font-semibold">{items[activeIdx].title}</p>
            <p className="text-slate-400 text-center text-sm mt-1">{activeIdx + 1} / {items.length}</p>
          </div>

          <button onClick={e => { e.stopPropagation(); next(); }} className="absolute right-4 p-2 bg-white/10 hover:bg-white/20 rounded-xl transition-colors">
            <ChevronRight className="w-6 h-6 text-white" />
          </button>
        </div>
      )}
    </div>
  );
}
