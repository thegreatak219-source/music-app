import { Track, LaptopPlaybackState } from '../types/music';

export interface SpotifyCurrentlyPlayingResponse {
  device?: {
    id: string;
    is_active: boolean;
    name: string;
    type: string;
    volume_percent: number;
  };
  is_playing: boolean;
  progress_ms: number;
  item?: {
    id: string;
    name: string;
    duration_ms: number;
    artists: Array<{ name: string }>;
    album: {
      name: string;
      release_date: string;
      images: Array<{ url: string; height: number; width: number }>;
    };
    external_urls?: {
      spotify: string;
    };
  };
}

export interface SpotifyQueueResponse {
  currently_playing?: SpotifyCurrentlyPlayingResponse['item'];
  queue?: Array<SpotifyCurrentlyPlayingResponse['item']>;
}

export class SpotifyService {
  private accessToken: string | null = null;
  private clientId: string = '';

  constructor() {
    this.accessToken = localStorage.getItem('liquidglass_spotify_token');
    this.clientId = localStorage.getItem('liquidglass_spotify_client_id') || '';
  }

  setToken(token: string) {
    this.accessToken = token.trim();
    if (this.accessToken) {
      localStorage.setItem('liquidglass_spotify_token', this.accessToken);
    } else {
      localStorage.removeItem('liquidglass_spotify_token');
    }
  }

  getToken(): string | null {
    return this.accessToken;
  }

  setClientId(clientId: string) {
    this.clientId = clientId.trim();
    if (this.clientId) {
      localStorage.setItem('liquidglass_spotify_client_id', this.clientId);
    } else {
      localStorage.removeItem('liquidglass_spotify_client_id');
    }
  }

  getClientId(): string {
    return this.clientId;
  }

  isConnected(): boolean {
    return Boolean(this.accessToken && this.accessToken.length > 10);
  }

  disconnect() {
    this.accessToken = null;
    localStorage.removeItem('liquidglass_spotify_token');
  }

  /**
   * Generates Spotify Web Auth URL (Implicit Grant / Token flow)
   */
  getAuthorizeUrl(redirectUri: string): string {
    const scopes = [
      'user-read-playback-state',
      'user-modify-playback-state',
      'user-read-currently-playing',
      'user-read-recently-played',
      'user-read-playback-position'
    ].join('%20');

    const clientId = this.clientId || 'f8c05763a8a3493db62f6d2f3424ba7b'; // Fallback developer ID or custom
    return `https://accounts.spotify.com/authorize?client_id=${encodeURIComponent(clientId)}&response_type=token&redirect_uri=${encodeURIComponent(redirectUri)}&scope=${scopes}&show_dialog=true`;
  }

  /**
   * Fetches the currently playing song from the user's laptop / active Spotify device
   */
  async getCurrentlyPlaying(): Promise<{
    track: Track | null;
    isPlaying: boolean;
    progressSec: number;
    laptopState: LaptopPlaybackState;
  }> {
    if (!this.accessToken) {
      return {
        track: null,
        isPlaying: false,
        progressSec: 0,
        laptopState: { isConnected: false, service: 'spotify', isLaptopActive: false }
      };
    }

    try {
      const response = await fetch('https://api.spotify.com/v1/me/player', {
        headers: {
          Authorization: `Bearer ${this.accessToken}`
        }
      });

      if (response.status === 204) {
        // Active device is idle or paused
        return {
          track: null,
          isPlaying: false,
          progressSec: 0,
          laptopState: {
            isConnected: true,
            service: 'spotify',
            isLaptopActive: false,
            deviceName: 'Laptop (Idle)'
          }
        };
      }

      if (response.status === 401) {
        this.disconnect();
        throw new Error('Spotify session expired. Please reconnect.');
      }

      if (!response.ok) {
        throw new Error(`Spotify API error: ${response.statusText}`);
      }

      const data: SpotifyCurrentlyPlayingResponse = await response.json();

      if (!data.item) {
        return {
          track: null,
          isPlaying: false,
          progressSec: 0,
          laptopState: {
            isConnected: true,
            service: 'spotify',
            isLaptopActive: false
          }
        };
      }

      const item = data.item;
      const artwork = item.album.images?.[0]?.url || 'https://images.unsplash.com/photo-1514525253161-7a46d19cd819?w=800&auto=format&fit=crop&q=80';
      const year = parseInt(item.album.release_date?.substring(0, 4), 10) || 2024;

      const track: Track = {
        id: item.id,
        title: item.name,
        artist: item.artists.map(a => a.name).join(', '),
        album: item.album.name,
        year,
        artworkUrl: artwork,
        duration: Math.round(item.duration_ms / 1000),
        accentColor: '#1db954',
        secondaryColor: '#191414',
        externalUrl: item.external_urls?.spotify
      };

      const laptopState: LaptopPlaybackState = {
        isConnected: true,
        service: 'spotify',
        deviceName: data.device?.name || 'MacBook Pro',
        deviceType: data.device?.type || 'Computer',
        isLaptopActive: data.device?.is_active ?? true,
        lastSyncedAt: Date.now()
      };

      return {
        track,
        isPlaying: data.is_playing,
        progressSec: Math.round(data.progress_ms / 1000),
        laptopState
      };
    } catch (error) {
      console.warn('Spotify currently-playing error:', error);
      throw error;
    }
  }

  /**
   * Fetches the upcoming songs queue from the laptop
   */
  async getQueue(): Promise<Track[]> {
    if (!this.accessToken) return [];

    try {
      const response = await fetch('https://api.spotify.com/v1/me/player/queue', {
        headers: {
          Authorization: `Bearer ${this.accessToken}`
        }
      });

      if (!response.ok) return [];

      const data: SpotifyQueueResponse = await response.json();
      if (!data.queue || !Array.isArray(data.queue)) return [];

      return data.queue
        .slice(0, 15)
        .filter((item): item is NonNullable<typeof item> => Boolean(item && item.id))
        .map(item => ({
          id: item.id,
          title: item.name,
          artist: item.artists ? item.artists.map(a => a.name).join(', ') : 'Unknown Artist',
          album: item.album?.name || 'Unknown Album',
          year: parseInt(item.album?.release_date?.substring(0, 4) || '2024', 10) || 2024,
          artworkUrl: item.album?.images?.[0]?.url || '',
          duration: Math.round((item.duration_ms || 180000) / 1000),
          accentColor: '#1db954',
          externalUrl: item.external_urls?.spotify
        }));
    } catch (e) {
      console.warn('Failed to fetch Spotify queue:', e);
      return [];
    }
  }

  async play(): Promise<boolean> {
    if (!this.accessToken) return false;
    try {
      const res = await fetch('https://api.spotify.com/v1/me/player/play', {
        method: 'PUT',
        headers: { Authorization: `Bearer ${this.accessToken}` }
      });
      return res.ok;
    } catch {
      return false;
    }
  }

  async pause(): Promise<boolean> {
    if (!this.accessToken) return false;
    try {
      const res = await fetch('https://api.spotify.com/v1/me/player/pause', {
        method: 'PUT',
        headers: { Authorization: `Bearer ${this.accessToken}` }
      });
      return res.ok;
    } catch {
      return false;
    }
  }

  async next(): Promise<boolean> {
    if (!this.accessToken) return false;
    try {
      const res = await fetch('https://api.spotify.com/v1/me/player/next', {
        method: 'POST',
        headers: { Authorization: `Bearer ${this.accessToken}` }
      });
      return res.ok;
    } catch {
      return false;
    }
  }

  async previous(): Promise<boolean> {
    if (!this.accessToken) return false;
    try {
      const res = await fetch('https://api.spotify.com/v1/me/player/previous', {
        method: 'POST',
        headers: { Authorization: `Bearer ${this.accessToken}` }
      });
      return res.ok;
    } catch {
      return false;
    }
  }

  async seek(positionSec: number): Promise<boolean> {
    if (!this.accessToken) return false;
    try {
      const positionMs = Math.round(positionSec * 1000);
      const res = await fetch(`https://api.spotify.com/v1/me/player/seek?position_ms=${positionMs}`, {
        method: 'PUT',
        headers: { Authorization: `Bearer ${this.accessToken}` }
      });
      return res.ok;
    } catch {
      return false;
    }
  }

  async setVolume(volume0to100: number): Promise<boolean> {
    if (!this.accessToken) return false;
    try {
      const vol = Math.min(100, Math.max(0, Math.round(volume0to100)));
      const res = await fetch(`https://api.spotify.com/v1/me/player/volume?volume_percent=${vol}`, {
        method: 'PUT',
        headers: { Authorization: `Bearer ${this.accessToken}` }
      });
      return res.ok;
    } catch {
      return false;
    }
  }
}

export const spotifyService = new SpotifyService();
