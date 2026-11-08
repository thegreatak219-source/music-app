import React from 'react';
import { Track } from '../types/music';
import { ListMusic, X, Play, Trash2, Laptop } from 'lucide-react';

interface QueueModalProps {
  isOpen: boolean;
  onClose: () => void;
  queue: Track[];
  currentTrack: Track;
  isLaptopSync: boolean;
  onPlayTrack: (track: Track) => void;
  onRemoveFromQueue: (trackId: string) => void;
  onClearQueue: () => void;
}

export const QueueModal: React.FC<QueueModalProps> = ({
  isOpen,
  onClose,
  queue,
  currentTrack,
  isLaptopSync,
  onPlayTrack,
  onRemoveFromQueue,
  onClearQueue
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 bg-black/60 backdrop-blur-md animate-fade-in">
      <div 
        className="w-full max-w-lg rounded-2xl bg-slate-900/85 backdrop-blur-3xl border border-white/20 shadow-2xl overflow-hidden flex flex-col max-h-[580px]"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-white/10 bg-white/5">
          <div className="flex items-center gap-2.5">
            <ListMusic className="w-5 h-5 text-purple-400" />
            <div>
              <h3 className="text-sm font-bold text-white flex items-center gap-2">
                Up Next / Play Queue
                {isLaptopSync && (
                  <span className="flex items-center gap-1 text-[10px] px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 font-normal">
                    <Laptop className="w-3 h-3" /> Laptop Synced
                  </span>
                )}
              </h3>
              <p className="text-[11px] text-white/50">
                {queue.length} upcoming songs
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {queue.length > 0 && (
              <button
                onClick={onClearQueue}
                title="Clear queue"
                className="text-xs text-rose-400/80 hover:text-rose-300 px-2 py-1 rounded hover:bg-rose-500/10 transition-colors"
              >
                Clear
              </button>
            )}
            <button
              onClick={onClose}
              className="p-1 rounded-full text-white/50 hover:text-white hover:bg-white/10"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Currently Playing Track Banner */}
        <div className="px-5 py-3 bg-white/5 border-b border-white/5 flex items-center gap-3">
          <div className="w-10 h-10 rounded-lg overflow-hidden shrink-0 border border-white/20 bg-slate-800">
            <img src={currentTrack.artworkUrl} alt={currentTrack.title} className="w-full h-full object-cover" />
          </div>
          <div className="flex-1 min-w-0">
            <span className="text-[10px] text-purple-300 font-bold uppercase tracking-wider block">
              Now Playing
            </span>
            <p className="text-xs font-semibold text-white truncate">{currentTrack.title}</p>
            <p className="text-[11px] text-white/60 truncate">{currentTrack.artist}</p>
          </div>
        </div>

        {/* Upcoming List */}
        <div className="flex-1 overflow-y-auto custom-scrollbar p-3 space-y-1">
          {queue.length === 0 ? (
            <div className="py-12 text-center text-white/40 text-xs">
              Your queue is empty. Use Search or Carousel to add upcoming tracks.
            </div>
          ) : (
            queue.map((track, index) => (
              <div
                key={`${track.id}-${index}`}
                className="group flex items-center justify-between p-2 rounded-xl hover:bg-white/10 transition-colors"
              >
                <div 
                  onClick={() => onPlayTrack(track)}
                  className="flex items-center gap-3 flex-1 min-w-0 cursor-pointer"
                >
                  <span className="text-[11px] font-mono text-white/30 w-4 text-center shrink-0">
                    {index + 1}
                  </span>
                  <div className="w-9 h-9 rounded-md overflow-hidden shrink-0 border border-white/15 bg-slate-800 relative">
                    <img src={track.artworkUrl} alt={track.title} className="w-full h-full object-cover" />
                    <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 flex items-center justify-center">
                      <Play className="w-3.5 h-3.5 text-white fill-white ml-0.5" />
                    </div>
                  </div>
                  <div className="min-w-0">
                    <p className="text-xs font-medium text-white truncate">{track.title}</p>
                    <p className="text-[11px] text-white/50 truncate">{track.artist}</p>
                  </div>
                </div>

                <div className="flex items-center gap-2 shrink-0">
                  <span className="text-[11px] font-mono tabular-nums text-white/40">
                    {Math.floor(track.duration / 60)}:{(track.duration % 60).toString().padStart(2, '0')}
                  </span>
                  <button
                    onClick={() => onRemoveFromQueue(track.id)}
                    className="p-1 rounded text-white/30 hover:text-rose-400 opacity-0 group-hover:opacity-100 transition-opacity"
                    title="Remove from queue"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
};
