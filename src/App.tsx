import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Track, WidgetSettings, LaptopPlaybackState, PlaybackSource } from './types/music';
import { CURATED_TRACKS } from './data/curatedTracks';
import { spotifyService } from './services/spotifyService';
import { audioEngine } from './services/audioEngine';
import { nativeMacService } from './services/nativeMacService';

import { AlbumCarousel3D } from './components/AlbumCarousel3D';
import { MusicDock } from './components/MusicDock';
import { RecentlyPlayedSidebar } from './components/RecentlyPlayedSidebar';
import { SearchBar } from './components/SearchBar';
import { LyricsModal } from './components/LyricsModal';
import { QueueModal } from './components/QueueModal';
import { SettingsModal } from './components/SettingsModal';
import { AmbientBackground } from './components/AmbientBackground';
import { DesktopWindow } from './components/DesktopWindow';

export default function App() {
  const [tracks] = useState<Track[]>(CURATED_TRACKS);
  // Shape of You is index 2, perfectly matching the center card in the reference image
  const [currentTrack, setCurrentTrack] = useState<Track>(CURATED_TRACKS[2]);
  const [isPlaying, setIsPlaying] = useState<boolean>(false);
  const [currentTime, setCurrentTime] = useState<number>(38);
  const [duration, setDuration] = useState<number>(CURATED_TRACKS[2].duration);
  const [volume, setVolume] = useState<number>(0.85);
  const [isMuted, setIsMuted] = useState<boolean>(false);
  const [isShuffle, setIsShuffle] = useState<boolean>(false);
  const [repeatMode, setRepeatMode] = useState<'off' | 'all' | 'one'>('off');

  // Laptop sync state
  const [laptopState, setLaptopState] = useState<LaptopPlaybackState>({
    isConnected: false,
    service: 'spotify',
    deviceName: 'MacBook Pro',
    isLaptopActive: false
  });

  // Queue and history
  const [queue, setQueue] = useState<Track[]>(CURATED_TRACKS.slice(1, 5));
  const [recentlyPlayed, setRecentlyPlayed] = useState<Track[]>([
    CURATED_TRACKS[1],
    CURATED_TRACKS[2],
    CURATED_TRACKS[3]
  ]);

  // Modal and drawer visibility
  const [isSidebarOpen, setIsSidebarOpen] = useState<boolean>(false);
  const [isSearchOpen, setIsSearchOpen] = useState<boolean>(false);
  const [isLyricsOpen, setIsLyricsOpen] = useState<boolean>(false);
  const [isQueueOpen, setIsQueueOpen] = useState<boolean>(false);
  const [isSettingsOpen, setIsSettingsOpen] = useState<boolean>(false);

  // Widget settings
  const [settings, setSettings] = useState<WidgetSettings>({
    displayMode: 'compact',
    glassBlur: 'high',
    dynamicBackground: true,
    carouselScale: 1.0,
    alwaysOnTop: true,
    sidebarOpen: false,
    autoSyncLaptop: true,
    spotifyAccessToken: spotifyService.getToken() || '',
    spotifyClientId: spotifyService.getClientId() || ''
  });

  // Track playback time update loop for HTML5 local player
  useEffect(() => {
    audioEngine.setCallbacks({
      onTimeUpdate: (cur, dur) => {
        if (!laptopState.isConnected) {
          setCurrentTime(cur);
          if (dur > 0) setDuration(dur);
        }
      },
      onEnded: () => {
        handleNextTrack();
      }
    });
  }, [laptopState.isConnected]);

  // Check URL hash for Spotify OAuth token redirection on return
  useEffect(() => {
    const hash = window.location.hash;
    if (hash && hash.includes('access_token=')) {
      const params = new URLSearchParams(hash.substring(1));
      const token = params.get('access_token');
      if (token) {
        spotifyService.setToken(token);
        setSettings(prev => ({ ...prev, spotifyAccessToken: token }));
        setLaptopState({
          isConnected: true,
          service: 'spotify',
          deviceName: 'MacBook Pro',
          isLaptopActive: true
        });
        window.history.replaceState(null, '', window.location.pathname);
      }
    }
  }, []);

  // Laptop Playback Polling Loop (checks what music laptop is playing currently)
  useEffect(() => {
    let isMounted = true;
    const pollLaptopPlayback = async () => {
      try {
        // 1. If running as native macOS desktop app (Tauri / Electron), check native Spotify.app / Music.app directly
        if (nativeMacService.isNativeDesktop()) {
          const nativeState = await nativeMacService.getNativePlaybackState();
          if (isMounted && nativeState && nativeState.track) {
            setCurrentTrack(nativeState.track);
            setIsPlaying(nativeState.isPlaying);
            setCurrentTime(nativeState.currentTime);
            setDuration(nativeState.track.duration);
            setLaptopState(nativeState.laptopState);
            return;
          }
        }

        // 2. Otherwise check Spotify Web API if user connected token
        if (laptopState.isConnected && settings.autoSyncLaptop) {
          const { track, isPlaying: laptopPlaying, progressSec, laptopState: state } = 
            await spotifyService.getCurrentlyPlaying();

          if (!isMounted) return;

          if (track) {
            setCurrentTrack(track);
            setIsPlaying(laptopPlaying);
            setCurrentTime(progressSec);
            setDuration(track.duration);
            setLaptopState(state);

            const laptopQueue = await spotifyService.getQueue();
            if (isMounted && laptopQueue.length > 0) {
              setQueue(laptopQueue);
            }
          }
        }
      } catch (err) {
        console.warn('Laptop polling tick failed:', err);
      }
    };

    pollLaptopPlayback();
    const interval = setInterval(pollLaptopPlayback, 2500);
    return () => {
      isMounted = false;
      clearInterval(interval);
    };
  }, [laptopState.isConnected, settings.autoSyncLaptop]);

  // Play / Pause toggle handler
  const handleTogglePlay = async () => {
    if (nativeMacService.isNativeDesktop()) {
      await nativeMacService.sendCommand('toggle');
      setIsPlaying(prev => !prev);
      return;
    }

    if (laptopState.isConnected) {
      if (isPlaying) {
        await spotifyService.pause();
        setIsPlaying(false);
      } else {
        await spotifyService.play();
        setIsPlaying(true);
      }
    } else {
      if (isPlaying) {
        audioEngine.pause();
        setIsPlaying(false);
      } else {
        if (currentTrack.audioUrl) {
          await audioEngine.loadAndPlay(currentTrack.audioUrl, currentTime);
        } else {
          audioEngine.play();
        }
        setIsPlaying(true);
      }
    }
  };

  // Select track from carousel or search
  const handleSelectTrack = useCallback(async (track: Track) => {
    // Add old currentTrack to recentlyPlayed
    setRecentlyPlayed(prev => {
      const filtered = prev.filter(t => t.id !== currentTrack.id);
      return [currentTrack, ...filtered].slice(0, 15);
    });

    setCurrentTrack(track);
    setCurrentTime(0);
    setDuration(track.duration);

    if (laptopState.isConnected) {
      // In remote Spotify mode
      setIsPlaying(true);
      await spotifyService.play();
    } else {
      if (track.audioUrl) {
        await audioEngine.loadAndPlay(track.audioUrl, 0);
        setIsPlaying(true);
      }
    }
  }, [currentTrack, laptopState.isConnected]);

  // Next Track handler
  const handleNextTrack = async () => {
    if (nativeMacService.isNativeDesktop()) {
      await nativeMacService.sendCommand('next');
      return;
    }

    if (laptopState.isConnected) {
      await spotifyService.next();
      return;
    }

    if (queue.length > 0) {
      const nextTrack = queue[0];
      setQueue(prev => prev.slice(1));
      handleSelectTrack(nextTrack);
    } else {
      // Cycle through tracks
      const currentIdx = tracks.findIndex(t => t.id === currentTrack.id);
      let nextIdx = (currentIdx + 1) % tracks.length;
      if (isShuffle) {
        nextIdx = Math.floor(Math.random() * tracks.length);
      }
      handleSelectTrack(tracks[nextIdx]);
    }
  };

  // Prev Track handler
  const handlePrevTrack = async () => {
    if (nativeMacService.isNativeDesktop()) {
      await nativeMacService.sendCommand('previous');
      return;
    }

    if (laptopState.isConnected) {
      await spotifyService.previous();
      return;
    }

    if (currentTime > 3) {
      // Seek to beginning if track has been playing for a few seconds
      handleSeek(0);
      return;
    }

    const currentIdx = tracks.findIndex(t => t.id === currentTrack.id);
    const prevIdx = (currentIdx - 1 + tracks.length) % tracks.length;
    handleSelectTrack(tracks[prevIdx]);
  };

  // Seek handler
  const handleSeek = async (timeInSec: number) => {
    setCurrentTime(timeInSec);
    if (laptopState.isConnected) {
      await spotifyService.seek(timeInSec);
    } else {
      audioEngine.seek(timeInSec);
    }
  };

  // Volume change handler
  const handleVolumeChange = (vol: number) => {
    setVolume(vol);
    setIsMuted(false);
    if (laptopState.isConnected) {
      spotifyService.setVolume(vol * 100);
    } else {
      audioEngine.setVolume(vol);
    }
  };

  // Toggle Mute
  const handleToggleMute = () => {
    if (isMuted) {
      setIsMuted(false);
      audioEngine.setVolume(volume);
    } else {
      setIsMuted(true);
      audioEngine.setVolume(0);
    }
  };

  // Add to Queue
  const handleAddToQueue = (track: Track) => {
    setQueue(prev => [...prev, track]);
  };

  // Connect Spotify Token
  const handleConnectSpotifyToken = (token: string, clientId?: string) => {
    spotifyService.setToken(token);
    if (clientId) spotifyService.setClientId(clientId);
    setSettings(prev => ({
      ...prev,
      spotifyAccessToken: token,
      spotifyClientId: clientId || prev.spotifyClientId
    }));
    setLaptopState({
      isConnected: true,
      service: 'spotify',
      deviceName: 'MacBook Pro',
      isLaptopActive: true,
      lastSyncedAt: Date.now()
    });
  };

  // Disconnect Spotify
  const handleDisconnectSpotify = () => {
    spotifyService.disconnect();
    setSettings(prev => ({ ...prev, spotifyAccessToken: '' }));
    setLaptopState({
      isConnected: false,
      service: 'spotify',
      isLaptopActive: false
    });
  };

  // Test Laptop Sync simulation
  const handleSimulateLaptopState = () => {
    setLaptopState({
      isConnected: true,
      service: 'spotify',
      deviceName: "Akshath's MacBook Air (Demo)",
      isLaptopActive: true,
      lastSyncedAt: Date.now()
    });
    // Populate realistic upcoming queue
    setQueue([CURATED_TRACKS[1], CURATED_TRACKS[3], CURATED_TRACKS[4]]);
  };

  return (
    <div className="relative min-h-screen w-full flex flex-col justify-between overflow-x-hidden select-none">
      {/* Cinematic Ambient Background */}
      <AmbientBackground
        currentTrack={currentTrack}
        dynamic={settings.dynamicBackground}
        blurLevel={settings.glassBlur}
      />

      {/* macOS Host Window Chrome & Layout */}
      <DesktopWindow
        settings={settings}
        laptopState={laptopState}
        onToggleSidebar={() => setIsSidebarOpen(prev => !prev)}
        onOpenSearch={() => setIsSearchOpen(true)}
        onOpenSettings={() => setIsSettingsOpen(true)}
        onToggleDisplayMode={() => setSettings(prev => ({
          ...prev,
          displayMode: prev.displayMode === 'compact' ? 'wallpaper' : 'compact'
        }))}
      >
        {/* Centerpiece: Floating 3D Album Carousel */}
        <div className="w-full flex-1 flex flex-col items-center justify-center my-auto">
          <AlbumCarousel3D
            tracks={tracks}
            currentTrack={currentTrack}
            isPlaying={isPlaying}
            onSelectTrack={handleSelectTrack}
            onTogglePlay={handleTogglePlay}
            scale={settings.carouselScale}
          />
        </div>

        {/* Floating Translucent Liquid Glass Music Player Dock */}
        <div className="w-full pb-4 sm:pb-6 z-20">
          <MusicDock
            currentTrack={currentTrack}
            isPlaying={isPlaying}
            currentTime={currentTime}
            duration={duration}
            volume={volume}
            isMuted={isMuted}
            onTogglePlay={handleTogglePlay}
            onPrev={handlePrevTrack}
            onNext={handleNextTrack}
            onSeek={handleSeek}
            onVolumeChange={handleVolumeChange}
            onToggleMute={handleToggleMute}
            onOpenLyrics={() => setIsLyricsOpen(true)}
            onOpenQueue={() => setIsQueueOpen(true)}
            onOpenOptions={() => setIsSettingsOpen(true)}
          />
        </div>
      </DesktopWindow>

      {/* Recently Played Left Sidebar */}
      <RecentlyPlayedSidebar
        isOpen={isSidebarOpen}
        onClose={() => setIsSidebarOpen(false)}
        recentTracks={recentlyPlayed}
        currentTrack={currentTrack}
        isPlaying={isPlaying}
        onSelectTrack={handleSelectTrack}
      />

      {/* Translucent Search Bar Modal */}
      <SearchBar
        isOpen={isSearchOpen}
        onClose={() => setIsSearchOpen(false)}
        tracks={tracks}
        onPlayTrack={handleSelectTrack}
        onAddToQueue={handleAddToQueue}
      />

      {/* Lyrics Modal */}
      <LyricsModal
        isOpen={isLyricsOpen}
        onClose={() => setIsLyricsOpen(false)}
        track={currentTrack}
        currentTime={currentTime}
      />

      {/* Queue Modal */}
      <QueueModal
        isOpen={isQueueOpen}
        onClose={() => setIsQueueOpen(false)}
        queue={queue}
        currentTrack={currentTrack}
        isLaptopSync={laptopState.isConnected}
        onPlayTrack={handleSelectTrack}
        onRemoveFromQueue={(id) => setQueue(prev => prev.filter(t => t.id !== id))}
        onClearQueue={() => setQueue([])}
      />

      {/* Settings & Connection Modal */}
      <SettingsModal
        isOpen={isSettingsOpen}
        onClose={() => setIsSettingsOpen(false)}
        settings={settings}
        onUpdateSettings={(newSettings) => setSettings(prev => ({ ...prev, ...newSettings }))}
        laptopState={laptopState}
        onConnectSpotifyToken={handleConnectSpotifyToken}
        onDisconnectSpotify={handleDisconnectSpotify}
        onSimulateLaptopState={handleSimulateLaptopState}
      />
    </div>
  );
}
