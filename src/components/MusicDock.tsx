import React, { useState, useRef } from 'react';
import { Track } from '../types/music';
import { 
  Volume2, 
  VolumeX, 
  Volume1,
  MessageSquareQuote, 
  ListMusic, 
  Cast, 
  MoreHorizontal
} from 'lucide-react';

interface MusicDockProps {
  currentTrack: Track;
  isPlaying: boolean;
  currentTime: number;
  duration: number;
  volume: number;
  isMuted: boolean;
  onTogglePlay: () => void;
  onPrev: () => void;
  onNext: () => void;
  onSeek: (timeInSec: number) => void;
  onVolumeChange: (volume0to1: number) => void;
  onToggleMute: () => void;
  onOpenLyrics: () => void;
  onOpenQueue: () => void;
  onOpenOptions: () => void;
}

export const MusicDock: React.FC<MusicDockProps> = ({
  currentTrack,
  isPlaying,
  currentTime,
  duration,
  volume,
  isMuted,
  onTogglePlay,
  onPrev,
  onNext,
  onSeek,
  onVolumeChange,
  onToggleMute,
  onOpenLyrics,
  onOpenQueue,
  onOpenOptions
}) => {
  const [showVolumeSlider, setShowVolumeSlider] = useState(false);
  const progressBarRef = useRef<HTMLDivElement>(null);

  const effectiveDuration = duration > 0 ? duration : currentTrack.duration || 200;
  const progressPercent = Math.min(100, Math.max(0, (currentTime / effectiveDuration) * 100));

  const handleProgressClick = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!progressBarRef.current) return;
    const rect = progressBarRef.current.getBoundingClientRect();
    const clickX = e.clientX - rect.left;
    const ratio = Math.max(0, Math.min(1, clickX / rect.width));
    onSeek(ratio * effectiveDuration);
  };

  return (
    <div className="relative w-full max-w-3xl mx-auto px-4">
      {/* Floating Pill Capsule Dock (Exact Reference Match) */}
      <div 
        className="relative flex items-center justify-between gap-4 sm:gap-8 px-6 sm:px-8 py-3.5 rounded-full select-none"
        style={{
          background: 'rgba(255, 255, 255, 0.12)',
          backdropFilter: 'blur(45px) saturate(200%)',
          WebkitBackdropFilter: 'blur(45px) saturate(200%)',
          border: '1.5px solid rgba(255, 255, 255, 0.32)',
          boxShadow: '0 25px 65px -10px rgba(0, 0, 0, 0.55), inset 0 1px 1.5px rgba(255, 255, 255, 0.5), inset 0 -1px 1px rgba(0, 0, 0, 0.2)'
        }}
      >
        
        {/* Left Transport Controls: Prev, Play/Pause, Next */}
        <div className="flex items-center gap-5 sm:gap-6 shrink-0 text-white">
          {/* Rewind (<< Double Triangle) */}
          <button
            onClick={onPrev}
            title="Previous"
            className="p-1 hover:opacity-100 opacity-85 transition-opacity active:scale-95 flex items-center justify-center cursor-pointer"
          >
            <svg width="22" height="18" viewBox="0 0 24 24" fill="currentColor">
              <path d="M11 5L1 12L11 19V5Z" />
              <path d="M22 5L12 12L22 19V5Z" />
            </svg>
          </button>

          {/* Pause / Play (|| Two vertical rounded bars or play triangle) */}
          <button
            onClick={onTogglePlay}
            title={isPlaying ? "Pause" : "Play"}
            className="p-1 hover:opacity-100 opacity-95 transition-all active:scale-95 flex items-center justify-center cursor-pointer"
          >
            {isPlaying ? (
              <div className="flex items-center gap-1.5 h-5">
                <span className="w-1.5 h-5 bg-white rounded-full shadow-xs" />
                <span className="w-1.5 h-5 bg-white rounded-full shadow-xs" />
              </div>
            ) : (
              <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
                <path d="M5 3L19 12L5 21V3Z" />
              </svg>
            )}
          </button>

          {/* Fast-Forward (>> Double Triangle) */}
          <button
            onClick={onNext}
            title="Next"
            className="p-1 hover:opacity-100 opacity-85 transition-opacity active:scale-95 flex items-center justify-center cursor-pointer"
          >
            <svg width="22" height="18" viewBox="0 0 24 24" fill="currentColor">
              <path d="M13 5L23 12L13 19V5Z" />
              <path d="M2 5L12 12L2 19V5Z" />
            </svg>
          </button>
        </div>

        {/* Center Mini-Card Island (Darker Inset Frosted Capsule) */}
        <div 
          className="flex-1 max-w-[270px] sm:max-w-[320px] relative px-3 py-2 rounded-2xl flex flex-col justify-between"
          style={{
            background: 'rgba(12, 16, 26, 0.52)',
            backdropFilter: 'blur(25px)',
            WebkitBackdropFilter: 'blur(25px)',
            border: '1px solid rgba(255, 255, 255, 0.16)',
            boxShadow: 'inset 0 1px 3px rgba(0, 0, 0, 0.4)'
          }}
        >
          <div className="flex items-center gap-2.5">
            {/* Small Square Artwork Thumbnail */}
            <div className="relative w-8 h-8 rounded-lg overflow-hidden shrink-0 border border-white/25 bg-slate-900 shadow-sm">
              <img
                src={currentTrack.artworkUrl}
                alt={currentTrack.title}
                referrerPolicy="no-referrer"
                className="w-full h-full object-cover"
              />
            </div>

            {/* Title & Artist */}
            <div className="flex-1 min-w-0 pr-1">
              <p className="text-xs sm:text-[13px] font-semibold text-white truncate leading-tight">
                {currentTrack.title}
              </p>
              <p className="text-[11px] text-white/70 truncate leading-tight mt-0.5">
                {currentTrack.artist}
              </p>
            </div>

            {/* AirPlay & More Icons */}
            <div className="flex items-center gap-1 shrink-0 text-white/75">
              <button 
                onClick={onOpenOptions}
                title="AirPlay & Devices"
                className="p-1 hover:text-white transition-colors"
              >
                <Cast className="w-3.5 h-3.5" />
              </button>
              <button 
                onClick={onOpenOptions}
                title="Options"
                className="p-1 hover:text-white transition-colors"
              >
                <MoreHorizontal className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>

          {/* Glowing Playback Progress Bar */}
          <div 
            ref={progressBarRef}
            onClick={handleProgressClick}
            className="group relative w-full h-1.5 mt-2 flex items-center cursor-pointer"
          >
            {/* Rail */}
            <div className="w-full h-0.5 bg-white/25 rounded-full overflow-hidden">
              <div 
                className="h-full bg-white rounded-full shadow-[0_0_6px_rgba(255,255,255,0.9)]"
                style={{ width: `${progressPercent}%` }}
              />
            </div>

            {/* Glowing Scrubber Head */}
            <div 
              className="absolute w-2 h-2 rounded-full bg-white shadow-[0_0_8px_rgba(255,255,255,1)] pointer-events-none -translate-x-1/2"
              style={{ left: `${progressPercent}%` }}
            />
          </div>
        </div>

        {/* Right Utilities: Lyrics, Queue, Volume */}
        <div className="flex items-center gap-4 sm:gap-5 shrink-0 text-white/80">
          {/* Lyrics Icon (Speech bubble with quotes ❝) */}
          <button
            onClick={onOpenLyrics}
            title="Lyrics"
            className="p-1 hover:text-white hover:opacity-100 opacity-85 transition-opacity"
          >
            <MessageSquareQuote className="w-5 h-5" />
          </button>

          {/* Queue / Playlist Icon (Bulleted list) */}
          <button
            onClick={onOpenQueue}
            title="Up Next & Queue"
            className="p-1 hover:text-white hover:opacity-100 opacity-85 transition-opacity"
          >
            <ListMusic className="w-5 h-5" />
          </button>

          {/* Volume Icon with Popover Slider */}
          <div 
            className="relative flex items-center"
            onMouseEnter={() => setShowVolumeSlider(true)}
            onMouseLeave={() => setShowVolumeSlider(false)}
          >
            <button
              onClick={onToggleMute}
              title={isMuted ? "Unmute" : "Mute"}
              className="p-1 hover:text-white hover:opacity-100 opacity-85 transition-opacity"
            >
              {isMuted || volume === 0 ? (
                <VolumeX className="w-5 h-5 text-rose-300" />
              ) : volume < 0.5 ? (
                <Volume1 className="w-5 h-5" />
              ) : (
                <Volume2 className="w-5 h-5" />
              )}
            </button>

            {/* Floating Volume Slider */}
            {showVolumeSlider && (
              <div 
                className="absolute bottom-full mb-3 left-1/2 -translate-x-1/2 p-3 rounded-2xl backdrop-blur-2xl border border-white/20 shadow-2xl flex flex-col items-center gap-2 w-9 h-32 z-50"
                style={{ background: 'rgba(15, 20, 32, 0.85)' }}
              >
                <input
                  type="range"
                  min="0"
                  max="1"
                  step="0.01"
                  value={isMuted ? 0 : volume}
                  onChange={(e) => onVolumeChange(parseFloat(e.target.value))}
                  className="w-20 h-1 accent-white rounded-lg appearance-none cursor-pointer -rotate-90 my-auto bg-white/30"
                />
              </div>
            )}
          </div>
        </div>

      </div>
    </div>
  );
};
