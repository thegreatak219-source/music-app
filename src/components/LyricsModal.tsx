import React, { useEffect, useRef } from 'react';
import { Track } from '../types/music';
import { X, Mic2 } from 'lucide-react';

interface LyricsModalProps {
  isOpen: boolean;
  onClose: () => void;
  track: Track;
  currentTime: number;
}

export const LyricsModal: React.FC<LyricsModalProps> = ({
  isOpen,
  onClose,
  track,
  currentTime
}) => {
  const containerRef = useRef<HTMLDivElement>(null);

  if (!isOpen) return null;

  const lyrics = track.lyrics || [
    "No synchronized lyrics available for this song.",
    "Enjoy the cinematic music experience."
  ];

  // Calculate simulated active line based on playback progress
  const lineDuration = track.duration > 0 ? track.duration / lyrics.length : 10;
  const currentLineIndex = Math.min(lyrics.length - 1, Math.max(0, Math.floor(currentTime / lineDuration)));

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 bg-black/70 backdrop-blur-2xl animate-fade-in">
      <div 
        className="relative w-full max-w-2xl h-[560px] rounded-3xl bg-slate-950/80 border border-white/20 shadow-2xl flex flex-col overflow-hidden"
        style={{
          boxShadow: `0 30px 80px rgba(0,0,0,0.8), 0 0 60px -15px ${track.accentColor}44`
        }}
      >
        {/* Top Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-white/10 bg-white/5 backdrop-blur-md">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-lg overflow-hidden border border-white/20 shrink-0">
              <img src={track.artworkUrl} alt={track.title} className="w-full h-full object-cover" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-white flex items-center gap-1.5">
                <Mic2 className="w-4 h-4 text-purple-400" />
                {track.title}
              </h3>
              <p className="text-xs text-white/60">{track.artist}</p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 rounded-full text-white/50 hover:text-white hover:bg-white/10 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Lyrics Scrollable Area */}
        <div 
          ref={containerRef}
          className="flex-1 overflow-y-auto custom-scrollbar p-6 sm:p-10 space-y-6 text-center select-text"
        >
          {lyrics.map((line, idx) => {
            const isActive = idx === currentLineIndex;
            const isNear = Math.abs(idx - currentLineIndex) <= 2;

            return (
              <p
                key={idx}
                className={`transition-all duration-300 font-semibold cursor-pointer ${
                  isActive
                    ? 'text-2xl sm:text-3xl text-white scale-105 font-bold drop-shadow-[0_0_15px_rgba(255,255,255,0.6)]'
                    : isNear
                    ? 'text-lg sm:text-xl text-white/60 hover:text-white/80'
                    : 'text-base sm:text-lg text-white/25 hover:text-white/40'
                }`}
              >
                {line}
              </p>
            );
          })}
        </div>

        {/* Bottom Ambient Glow Line */}
        <div 
          className="h-1.5 w-full bg-gradient-to-r from-transparent via-purple-500 to-transparent opacity-60" 
        />
      </div>
    </div>
  );
};
