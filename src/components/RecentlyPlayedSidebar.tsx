import React from 'react';
import { Track } from '../types/music';
import { Clock, Play, Disc3, X } from 'lucide-react';

interface RecentlyPlayedSidebarProps {
  isOpen: boolean;
  onClose: () => void;
  recentTracks: Track[];
  currentTrack: Track;
  isPlaying: boolean;
  onSelectTrack: (track: Track) => void;
}

export const RecentlyPlayedSidebar: React.FC<RecentlyPlayedSidebarProps> = ({
  isOpen,
  onClose,
  recentTracks,
  currentTrack,
  isPlaying,
  onSelectTrack
}) => {
  return (
    <>
      {/* Backdrop overlay on smaller viewports */}
      {isOpen && (
        <div 
          onClick={onClose}
          className="fixed inset-0 bg-black/40 backdrop-blur-xs z-40 lg:hidden"
        />
      )}

      <aside
        className={`fixed top-0 left-0 bottom-0 z-50 w-72 sm:w-80 bg-slate-950/75 backdrop-blur-3xl border-r border-white/10 transition-transform duration-300 ease-in-out flex flex-col ${
          isOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-white/10">
          <div className="flex items-center gap-2">
            <Clock className="w-4 h-4 text-purple-400" />
            <h2 className="text-sm font-bold tracking-tight text-white uppercase text-white/90">
              Recently Played
            </h2>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-md text-white/50 hover:text-white hover:bg-white/10 transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Track List */}
        <div className="flex-1 overflow-y-auto custom-scrollbar p-3 space-y-1.5">
          {recentTracks.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-48 text-center text-white/40 px-4">
              <Disc3 className="w-8 h-8 mb-2 opacity-50 animate-spin-slow" />
              <p className="text-xs">No recent tracks yet. Play music to build your history.</p>
            </div>
          ) : (
            recentTracks.map((track) => {
              const isCurrent = track.id === currentTrack.id;

              return (
                <div
                  key={`${track.id}-${track.year}`}
                  onClick={() => onSelectTrack(track)}
                  className={`group relative flex items-center gap-3 p-2.5 rounded-xl cursor-pointer transition-all ${
                    isCurrent
                      ? 'bg-white/15 border border-white/25 shadow-sm'
                      : 'hover:bg-white/5 border border-transparent'
                  }`}
                >
                  {/* Thumbnail with hover play or live wave */}
                  <div className="relative w-11 h-11 rounded-lg overflow-hidden shrink-0 border border-white/15 bg-slate-800">
                    <img
                      src={track.artworkUrl}
                      alt={track.title}
                      referrerPolicy="no-referrer"
                      className="w-full h-full object-cover transition-transform group-hover:scale-105"
                    />

                    {isCurrent && isPlaying ? (
                      <div className="absolute inset-0 bg-black/50 flex items-center justify-center gap-0.5">
                        <span className="w-0.5 h-3 bg-purple-400 rounded-full animate-pulse" />
                        <span className="w-0.5 h-4 bg-purple-300 rounded-full animate-pulse delay-75" />
                        <span className="w-0.5 h-2.5 bg-purple-400 rounded-full animate-pulse delay-150" />
                      </div>
                    ) : (
                      <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                        <Play className="w-4 h-4 text-white fill-white ml-0.5" />
                      </div>
                    )}
                  </div>

                  {/* Metadata */}
                  <div className="flex-1 min-w-0">
                    <h4 
                      className={`text-xs font-semibold truncate ${
                        isCurrent ? 'text-purple-300' : 'text-white'
                      }`}
                    >
                      {track.title}
                    </h4>
                    <p className="text-[11px] text-white/60 truncate mt-0.5">
                      {track.artist}
                    </p>
                    <span className="text-[10px] text-white/40 block mt-0.5 truncate">
                      {track.album}
                    </span>
                  </div>

                  {/* Duration */}
                  <span className="text-[10px] font-mono tabular-nums text-white/40 shrink-0">
                    {Math.floor(track.duration / 60)}:{(track.duration % 60).toString().padStart(2, '0')}
                  </span>
                </div>
              );
            })
          )}
        </div>

        {/* Footer info */}
        <div className="p-3 border-t border-white/10 bg-black/20 text-center">
          <p className="text-[11px] text-white/40">
            {recentTracks.length} tracks in history
          </p>
        </div>
      </aside>
    </>
  );
};
