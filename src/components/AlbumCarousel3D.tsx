import React, { useRef, useState, useEffect, useCallback } from 'react';
import { Track } from '../types/music';

interface AlbumCarousel3DProps {
  tracks: Track[];
  currentTrack: Track;
  isPlaying: boolean;
  onSelectTrack: (track: Track) => void;
  onTogglePlay: () => void;
  scale?: number;
}

export const AlbumCarousel3D: React.FC<AlbumCarousel3DProps> = ({
  tracks,
  currentTrack,
  isPlaying,
  onSelectTrack,
  onTogglePlay,
  scale = 1.0
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  
  // Find index of currentTrack in tracks list
  const initialIndex = tracks.findIndex(t => t.id === currentTrack.id);
  const [activeIndex, setActiveIndex] = useState(initialIndex >= 0 ? initialIndex : 2);
  
  // For smooth drag physics
  const [dragOffset, setDragOffset] = useState(0);
  const [isDragging, setIsDragging] = useState(false);
  const dragStartXRef = useRef(0);
  const dragVelocityRef = useRef(0);
  const lastDragTimeRef = useRef(0);

  // Sync activeIndex with currentTrack if changed externally
  useEffect(() => {
    const idx = tracks.findIndex(t => t.id === currentTrack.id);
    if (idx >= 0 && idx !== activeIndex && !isDragging) {
      setActiveIndex(idx);
    }
  }, [currentTrack.id, tracks, activeIndex, isDragging]);

  const snapToIndex = useCallback((target: number) => {
    const clamped = Math.max(0, Math.min(tracks.length - 1, Math.round(target)));
    setActiveIndex(clamped);
    setDragOffset(0);
    const selected = tracks[clamped];
    if (selected && selected.id !== currentTrack.id) {
      onSelectTrack(selected);
    }
  }, [tracks, currentTrack.id, onSelectTrack]);

  // Keyboard navigation
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (['INPUT', 'TEXTAREA'].includes((e.target as HTMLElement)?.tagName)) {
        return;
      }

      if (e.key === 'ArrowLeft') {
        e.preventDefault();
        snapToIndex(activeIndex - 1);
      } else if (e.key === 'ArrowRight') {
        e.preventDefault();
        snapToIndex(activeIndex + 1);
      } else if (e.key === ' ' || e.key === 'Spacebar') {
        e.preventDefault();
        onTogglePlay();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [activeIndex, snapToIndex, onTogglePlay]);

  // Trackpad / Mouse wheel horizontal scroll
  const handleWheel = (e: React.WheelEvent) => {
    if (Math.abs(e.deltaX) > Math.abs(e.deltaY)) {
      e.preventDefault();
      const delta = e.deltaX * 0.003;
      const nextIndex = Math.max(0, Math.min(tracks.length - 1, activeIndex + delta));
      setActiveIndex(nextIndex);
    } else if (Math.abs(e.deltaY) > 25) {
      const direction = e.deltaY > 0 ? 1 : -1;
      snapToIndex(activeIndex + direction);
    }
  };

  // Mouse / Touch drag handlers
  const handleMouseDown = (e: React.MouseEvent) => {
    setIsDragging(true);
    dragStartXRef.current = e.clientX;
    lastDragTimeRef.current = Date.now();
    dragVelocityRef.current = 0;
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!isDragging) return;
    const now = Date.now();
    const dt = Math.max(1, now - lastDragTimeRef.current);
    const dx = e.clientX - dragStartXRef.current;
    dragVelocityRef.current = dx / dt;
    lastDragTimeRef.current = now;
    dragStartXRef.current = e.clientX;

    setDragOffset(prev => prev - dx / 220);
  };

  const handleMouseUp = () => {
    if (!isDragging) return;
    setIsDragging(false);
    const momentum = dragVelocityRef.current * 0.2;
    const target = activeIndex + dragOffset - momentum;
    snapToIndex(target);
  };

  const handleTouchStart = (e: React.TouchEvent) => {
    setIsDragging(true);
    dragStartXRef.current = e.touches[0].clientX;
    lastDragTimeRef.current = Date.now();
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    if (!isDragging) return;
    const touchX = e.touches[0].clientX;
    const dx = touchX - dragStartXRef.current;
    dragStartXRef.current = touchX;
    setDragOffset(prev => prev - dx / 200);
  };

  const handleTouchEnd = () => {
    if (!isDragging) return;
    setIsDragging(false);
    snapToIndex(activeIndex + dragOffset);
  };

  const effectiveIndex = activeIndex + dragOffset;

  return (
    <div 
      ref={containerRef}
      onWheel={handleWheel}
      onMouseDown={handleMouseDown}
      onMouseMove={handleMouseMove}
      onMouseUp={handleMouseUp}
      onMouseLeave={handleMouseUp}
      onTouchStart={handleTouchStart}
      onTouchMove={handleTouchMove}
      onTouchEnd={handleTouchEnd}
      className="relative w-full h-[480px] sm:h-[520px] md:h-[560px] flex items-center justify-center cursor-grab active:cursor-grabbing select-none overflow-visible preserve-3d"
      style={{
        perspective: '1400px',
        transform: `scale(${scale})`
      }}
    >
      {/* 3D Stage Container */}
      <div className="relative w-full max-w-6xl h-full flex items-center justify-center preserve-3d">
        {tracks.map((track, idx) => {
          const diff = idx - effectiveIndex;
          const absDiff = Math.abs(diff);

          // Visible neighborhood: 5 cards (diff between -2.5 and +2.5)
          if (absDiff > 2.8) return null;

          const isCenter = absDiff < 0.4;

          // Precise geometry matching reference image:
          // Center card: x=0, z=40, rotateY=0
          // 1st neighbors: x=±175px, z=-50px, rotateY=±18deg, scale=0.88
          // 2nd neighbors: x=±330px, z=-110px, rotateY=±28deg, scale=0.76
          const translateX = diff * 175;
          const translateZ = -absDiff * 60 + (isCenter ? 35 : 0);
          const rotateY = -Math.sign(diff) * (absDiff <= 1 ? absDiff * 18 : 18 + (absDiff - 1) * 11);
          const cardScale = Math.max(0.72, 1 - absDiff * 0.12);
          const opacity = Math.max(0.65, 1 - absDiff * 0.15);
          const zIndex = Math.round(30 - absDiff * 8);

          return (
            <div
              key={track.id}
              onClick={(e) => {
                e.stopPropagation();
                if (isCenter) {
                  onTogglePlay();
                } else {
                  snapToIndex(idx);
                }
              }}
              className="absolute top-1/2 left-1/2 w-[270px] sm:w-[305px] md:w-[335px] aspect-[1/1.28] rounded-[32px] overflow-hidden transition-all duration-350 ease-out preserve-3d group cursor-pointer"
              style={{
                transform: `translate3d(calc(-50% + ${translateX}px), -50%, ${translateZ}px) rotateY(${rotateY}deg) scale(${cardScale})`,
                zIndex,
                opacity,
                filter: isCenter 
                  ? 'drop-shadow(0 30px 65px rgba(0,0,0,0.65))' 
                  : 'drop-shadow(0 20px 40px rgba(0,0,0,0.5))'
              }}
            >
              {/* Outer Card with Specular Frosted Rim (Exact Reference Match) */}
              <div 
                className={`relative w-full h-full rounded-[32px] overflow-hidden flex flex-col justify-between transition-all duration-300 ${
                  isCenter 
                    ? 'border-[2.5px] border-white/45' 
                    : 'border-[2px] border-white/25 hover:border-white/40'
                }`}
                style={{
                  boxShadow: isCenter
                    ? '0 25px 70px -15px rgba(0,0,0,0.7), inset 0 1.5px 2px rgba(255,255,255,0.6), inset 0 -1.5px 2px rgba(0,0,0,0.3)'
                    : '0 15px 40px rgba(0,0,0,0.5), inset 0 1px 1.5px rgba(255,255,255,0.35)',
                  background: 'rgba(255, 255, 255, 0.05)'
                }}
              >
                {/* Artwork Area (Top ~72%) */}
                <div className="relative w-full flex-1 overflow-hidden bg-slate-900">
                  <img
                    src={track.artworkUrl}
                    alt={`${track.title} by ${track.artist}`}
                    referrerPolicy="no-referrer"
                    className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-103"
                  />

                  {/* Top Specular Sheen Gradient */}
                  <div className="absolute inset-0 bg-gradient-to-b from-white/20 via-transparent to-transparent pointer-events-none" />

                  {/* Center Subtle Play Icon on Hover for Center Card */}
                  {isCenter && (
                    <div className="absolute inset-0 flex items-center justify-center bg-black/15 opacity-0 group-hover:opacity-100 transition-opacity duration-200">
                      <div className="w-14 h-14 rounded-full bg-white/25 backdrop-blur-xl border border-white/50 flex items-center justify-center shadow-xl">
                        {isPlaying ? (
                          <div className="flex gap-1.5 items-center">
                            <span className="w-1.5 h-6 bg-white rounded-full animate-pulse" />
                            <span className="w-1.5 h-6 bg-white rounded-full animate-pulse delay-75" />
                          </div>
                        ) : (
                          <div className="w-0 h-0 border-y-8 border-y-transparent border-l-[14px] border-l-white ml-1" />
                        )}
                      </div>
                    </div>
                  )}
                </div>

                {/* Frosted Glass Lower Badge (Exact Reference Match) */}
                <div 
                  className="relative w-full py-4 px-4 flex flex-col items-center justify-center text-center backdrop-blur-3xl border-t border-white/20"
                  style={{
                    background: isCenter 
                      ? 'linear-gradient(180deg, rgba(195, 160, 205, 0.40) 0%, rgba(135, 110, 155, 0.55) 100%)' 
                      : 'linear-gradient(180deg, rgba(255, 255, 255, 0.16) 0%, rgba(120, 130, 150, 0.35) 100%)'
                  }}
                >
                  <h3 
                    className={`font-bold tracking-tight text-white leading-tight drop-shadow-sm truncate w-full ${
                      isCenter ? 'text-lg sm:text-xl' : 'text-sm sm:text-base opacity-95'
                    }`}
                  >
                    {track.title}
                  </h3>
                  <p 
                    className={`font-medium tracking-normal text-white/85 leading-tight truncate w-full mt-1 ${
                      isCenter ? 'text-xs sm:text-sm text-purple-100/90' : 'text-xs text-white/70'
                    }`}
                  >
                    {track.artist}
                  </p>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
