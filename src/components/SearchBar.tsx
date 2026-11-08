import React, { useState, useEffect, useRef } from 'react';
import { Track } from '../types/music';
import { Search, X, Play, Plus, Music, User, Disc } from 'lucide-react';

interface SearchBarProps {
  isOpen: boolean;
  onClose: () => void;
  tracks: Track[];
  onPlayTrack: (track: Track) => void;
  onAddToQueue: (track: Track) => void;
}

export const SearchBar: React.FC<SearchBarProps> = ({
  isOpen,
  onClose,
  tracks,
  onPlayTrack,
  onAddToQueue
}) => {
  const [query, setQuery] = useState('');
  const [filterType, setFilterType] = useState<'all' | 'songs' | 'artists' | 'albums'>('all');
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (isOpen) {
      setTimeout(() => inputRef.current?.focus(), 50);
    } else {
      setQuery('');
    }
  }, [isOpen]);

  // Global shortcut Command+K or Escape
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault();
        if (isOpen) onClose();
      } else if (e.key === 'Escape' && isOpen) {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const normalized = query.toLowerCase().trim();
  const results = tracks.filter((track) => {
    if (!normalized) return true;
    const matchSong = track.title.toLowerCase().includes(normalized);
    const matchArtist = track.artist.toLowerCase().includes(normalized);
    const matchAlbum = track.album.toLowerCase().includes(normalized);

    if (filterType === 'songs') return matchSong;
    if (filterType === 'artists') return matchArtist;
    if (filterType === 'albums') return matchAlbum;
    return matchSong || matchArtist || matchAlbum;
  });

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center pt-20 px-4 bg-black/60 backdrop-blur-md animate-fade-in">
      <div 
        className="w-full max-w-xl rounded-2xl bg-slate-900/80 backdrop-blur-3xl border border-white/20 shadow-2xl overflow-hidden flex flex-col"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Search Input Bar */}
        <div className="relative flex items-center px-4 py-3.5 border-b border-white/10">
          <Search className="w-5 h-5 text-white/50 shrink-0" />
          <input
            ref={inputRef}
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search songs, artists, albums, or lyrics..."
            className="w-full bg-transparent border-none px-3 text-sm text-white placeholder-white/40 focus:outline-hidden"
          />
          {query && (
            <button
              onClick={() => setQuery('')}
              className="p-1 rounded-full text-white/40 hover:text-white"
            >
              <X className="w-4 h-4" />
            </button>
          )}
          <kbd className="hidden sm:inline-block ml-2 px-1.5 py-0.5 text-[10px] text-white/40 font-mono bg-white/10 rounded">
            ESC
          </kbd>
        </div>

        {/* Filter Pills / Segments */}
        <div className="flex items-center gap-2 px-4 py-2 border-b border-white/5 bg-black/20 text-xs">
          <button
            onClick={() => setFilterType('all')}
            className={`px-3 py-1 rounded-lg transition-colors ${
              filterType === 'all' ? 'bg-white/20 text-white font-medium' : 'text-white/50 hover:text-white'
            }`}
          >
            All Results
          </button>
          <button
            onClick={() => setFilterType('songs')}
            className={`px-3 py-1 rounded-lg transition-colors flex items-center gap-1.5 ${
              filterType === 'songs' ? 'bg-white/20 text-white font-medium' : 'text-white/50 hover:text-white'
            }`}
          >
            <Music className="w-3 h-3" /> Songs
          </button>
          <button
            onClick={() => setFilterType('artists')}
            className={`px-3 py-1 rounded-lg transition-colors flex items-center gap-1.5 ${
              filterType === 'artists' ? 'bg-white/20 text-white font-medium' : 'text-white/50 hover:text-white'
            }`}
          >
            <User className="w-3 h-3" /> Artists
          </button>
          <button
            onClick={() => setFilterType('albums')}
            className={`px-3 py-1 rounded-lg transition-colors flex items-center gap-1.5 ${
              filterType === 'albums' ? 'bg-white/20 text-white font-medium' : 'text-white/50 hover:text-white'
            }`}
          >
            <Disc className="w-3 h-3" /> Albums
          </button>
        </div>

        {/* Results List */}
        <div className="max-h-96 overflow-y-auto custom-scrollbar p-2 space-y-1">
          {results.length === 0 ? (
            <div className="py-12 text-center text-white/40 text-sm">
              No matching tracks found for "{query}"
            </div>
          ) : (
            results.map((track) => (
              <div
                key={track.id}
                className="group flex items-center justify-between p-2.5 rounded-xl hover:bg-white/10 transition-colors cursor-pointer"
                onClick={() => {
                  onPlayTrack(track);
                  onClose();
                }}
              >
                <div className="flex items-center gap-3 min-w-0">
                  <div className="relative w-10 h-10 rounded-lg overflow-hidden shrink-0 border border-white/10 bg-slate-800">
                    <img
                      src={track.artworkUrl}
                      alt={track.title}
                      referrerPolicy="no-referrer"
                      className="w-full h-full object-cover"
                    />
                    <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                      <Play className="w-3.5 h-3.5 text-white fill-white ml-0.5" />
                    </div>
                  </div>

                  <div className="min-w-0">
                    <p className="text-xs font-semibold text-white truncate">
                      {track.title}
                    </p>
                    <p className="text-[11px] text-white/60 truncate">
                      {track.artist} · <span className="text-white/40">{track.album}</span>
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-2 shrink-0">
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      onAddToQueue(track);
                    }}
                    title="Add to queue"
                    className="p-1.5 rounded-lg text-white/50 hover:text-white hover:bg-white/10 transition-colors opacity-0 group-hover:opacity-100"
                  >
                    <Plus className="w-4 h-4" />
                  </button>
                  <span className="text-xs font-mono tabular-nums text-white/40">
                    {Math.floor(track.duration / 60)}:{(track.duration % 60).toString().padStart(2, '0')}
                  </span>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
};
