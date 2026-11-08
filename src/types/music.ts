export interface Track {
  id: string;
  title: string;
  artist: string;
  album: string;
  year: number;
  artworkUrl: string;
  duration: number; // in seconds
  audioUrl?: string;
  lyrics?: string[];
  accentColor: string; // hex or rgba
  secondaryColor?: string;
  genre?: string;
  externalUrl?: string;
}

export type PlaybackSource = 'local' | 'spotify' | 'apple';

export interface LaptopPlaybackState {
  isConnected: boolean;
  service: PlaybackSource;
  deviceName?: string;
  deviceType?: string;
  isLaptopActive: boolean;
  lastSyncedAt?: number;
}

export interface PlaybackState {
  currentTrack: Track;
  isPlaying: boolean;
  currentTime: number; // in seconds
  duration: number; // in seconds
  volume: number; // 0 to 1
  isMuted: boolean;
  isShuffle: boolean;
  repeatMode: 'off' | 'all' | 'one';
  source: PlaybackSource;
  laptopSync: LaptopPlaybackState;
  queue: Track[];
  recentlyPlayed: Track[];
}

export interface WidgetSettings {
  displayMode: 'compact' | 'wallpaper';
  glassBlur: 'low' | 'medium' | 'high' | 'ultra';
  dynamicBackground: boolean;
  carouselScale: number; // 0.8 to 1.2
  alwaysOnTop: boolean;
  sidebarOpen: boolean;
  autoSyncLaptop: boolean;
  spotifyAccessToken: string;
  spotifyClientId: string;
}
