import React from 'react';
import { Track } from '../types/music';

interface AmbientBackgroundProps {
  currentTrack: Track;
  dynamic: boolean;
  blurLevel: 'low' | 'medium' | 'high' | 'ultra';
}

export const AmbientBackground: React.FC<AmbientBackgroundProps> = ({
  currentTrack,
  dynamic
}) => {
  const primary = currentTrack.accentColor || '#4f7fff';
  const secondary = currentTrack.secondaryColor || '#9333ea';

  return (
    <div className="fixed inset-0 pointer-events-none overflow-hidden -z-10 select-none bg-[#0a0d16]">
      {/* 1. Base Authentic Blurred Atmospheric Background from reference image */}
      <img
        src="/assets/aistudio/cinematic_bg_smooth.jpg"
        alt="Atmospheric Background"
        className="absolute inset-0 w-full h-full object-cover scale-105 filter blur-xs"
      />

      {/* 2. Soft Dynamic Color Bloom (Adapts subtly to current track) */}
      {dynamic && (
        <>
          {/* Top Magenta / Rose glow */}
          <div 
            className="absolute -top-24 left-1/4 w-[800px] h-[600px] rounded-full opacity-40 mix-blend-screen filter blur-[100px] transition-all duration-1000"
            style={{
              background: `radial-gradient(circle, ${secondary} 0%, transparent 70%)`
            }}
          />

          {/* Center-Left Blue / Indigo glow */}
          <div 
            className="absolute top-1/4 -left-32 w-[700px] h-[700px] rounded-full opacity-35 mix-blend-screen filter blur-[110px] transition-all duration-1000"
            style={{
              background: `radial-gradient(circle, ${primary} 0%, transparent 70%)`
            }}
          />
        </>
      )}

      {/* 3. Subtle Vignette and Depth Gradient matching reference */}
      <div className="absolute inset-0 bg-radial from-transparent via-black/10 to-black/35" />
    </div>
  );
};
