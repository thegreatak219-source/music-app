import React, { useState } from 'react';
import { WidgetSettings, LaptopPlaybackState } from '../types/music';
import { 
  X, 
  Settings, 
  Laptop, 
  Layers, 
  Radio, 
  CheckCircle2, 
  ExternalLink, 
  RefreshCw,
  Sparkles,
  Sliders,
  AppWindow,
  Monitor
} from 'lucide-react';

interface SettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  settings: WidgetSettings;
  onUpdateSettings: (newSettings: Partial<WidgetSettings>) => void;
  laptopState: LaptopPlaybackState;
  onConnectSpotifyToken: (token: string, clientId?: string) => void;
  onDisconnectSpotify: () => void;
  onSimulateLaptopState: () => void;
}

export const SettingsModal: React.FC<SettingsModalProps> = ({
  isOpen,
  onClose,
  settings,
  onUpdateSettings,
  laptopState,
  onConnectSpotifyToken,
  onDisconnectSpotify,
  onSimulateLaptopState
}) => {
  const [activeTab, setActiveTab] = useState<'service' | 'appearance' | 'widget'>('service');
  const [tokenInput, setTokenInput] = useState(settings.spotifyAccessToken || '');
  const [clientIdInput, setClientIdInput] = useState(settings.spotifyClientId || '');
  const [authStatusMsg, setAuthStatusMsg] = useState('');

  if (!isOpen) return null;

  const handleSaveSpotify = () => {
    if (!tokenInput.trim()) {
      setAuthStatusMsg('Please enter a valid Spotify token or client ID.');
      return;
    }
    onConnectSpotifyToken(tokenInput.trim(), clientIdInput.trim());
    setAuthStatusMsg('Connected to Spotify! Polling active laptop playback...');
  };

  const handleLaunchAuthPopup = () => {
    const clientId = clientIdInput.trim() || 'f8c05763a8a3493db62f6d2f3424ba7b';
    const redirectUri = window.location.origin;
    const scopes = encodeURIComponent('user-read-playback-state user-read-currently-playing user-modify-playback-state user-read-recently-played');
    const authUrl = `https://accounts.spotify.com/authorize?client_id=${clientId}&response_type=token&redirect_uri=${encodeURIComponent(redirectUri)}&scope=${scopes}&show_dialog=true`;

    window.open(authUrl, '_blank', 'width=600,height=750');
    setAuthStatusMsg('Spotify login opened. Authorize, copy the access_token in the redirected URL bar, and paste here.');
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 bg-black/65 backdrop-blur-xl animate-fade-in">
      <div 
        className="w-full max-w-xl rounded-3xl bg-slate-900/90 backdrop-blur-3xl border border-white/20 shadow-2xl overflow-hidden flex flex-col max-h-[640px]"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Modal Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-white/10 bg-white/5">
          <div className="flex items-center gap-2.5">
            <Settings className="w-5 h-5 text-purple-400" />
            <h2 className="text-base font-bold text-white tracking-tight">
              Widget Settings & Connections
            </h2>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-full text-white/50 hover:text-white hover:bg-white/10 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tab Switcher */}
        <div className="flex items-center gap-1 px-6 pt-3 pb-2 border-b border-white/10 bg-black/20 text-xs">
          <button
            onClick={() => setActiveTab('service')}
            className={`px-3.5 py-1.5 rounded-xl font-medium transition-colors flex items-center gap-1.5 ${
              activeTab === 'service' ? 'bg-white/20 text-white shadow-sm' : 'text-white/60 hover:text-white'
            }`}
          >
            <Laptop className="w-3.5 h-3.5" /> Laptop Music Sync
          </button>
          <button
            onClick={() => setActiveTab('appearance')}
            className={`px-3.5 py-1.5 rounded-xl font-medium transition-colors flex items-center gap-1.5 ${
              activeTab === 'appearance' ? 'bg-white/20 text-white shadow-sm' : 'text-white/60 hover:text-white'
            }`}
          >
            <Layers className="w-3.5 h-3.5" /> Appearance & Glass
          </button>
          <button
            onClick={() => setActiveTab('widget')}
            className={`px-3.5 py-1.5 rounded-xl font-medium transition-colors flex items-center gap-1.5 ${
              activeTab === 'widget' ? 'bg-white/20 text-white shadow-sm' : 'text-white/60 hover:text-white'
            }`}
          >
            <AppWindow className="w-3.5 h-3.5" /> macOS Desktop
          </button>
        </div>

        {/* Tab Content */}
        <div className="flex-1 overflow-y-auto custom-scrollbar p-6 space-y-6">
          {activeTab === 'service' && (
            <div className="space-y-5">
              {/* Active Connection Status Card */}
              <div className="p-4 rounded-2xl bg-white/5 border border-white/10 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${
                    laptopState.isConnected ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30' : 'bg-white/10 text-white/50'
                  }`}>
                    <Radio className="w-5 h-5" />
                  </div>
                  <div>
                    <h4 className="text-sm font-semibold text-white flex items-center gap-2">
                      {laptopState.isConnected ? 'Active Laptop Connection' : 'Curated Audio Engine Active'}
                      {laptopState.isConnected && (
                        <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                      )}
                    </h4>
                    <p className="text-xs text-white/60">
                      {laptopState.isConnected 
                        ? `Connected to ${laptopState.deviceName || 'MacBook Pro'} (${laptopState.service})`
                        : 'Currently running high-fidelity curated audio library with instant playback.'}
                    </p>
                  </div>
                </div>

                {laptopState.isConnected ? (
                  <button
                    onClick={onDisconnectSpotify}
                    className="px-3 py-1.5 rounded-lg text-xs font-medium text-rose-300 bg-rose-500/15 border border-rose-500/30 hover:bg-rose-500/25 transition-colors"
                  >
                    Disconnect
                  </button>
                ) : (
                  <button
                    onClick={onSimulateLaptopState}
                    title="Simulate MacBook active player"
                    className="px-3 py-1.5 rounded-lg text-xs font-medium text-purple-300 bg-purple-500/15 border border-purple-500/30 hover:bg-purple-500/25 transition-colors flex items-center gap-1"
                  >
                    <RefreshCw className="w-3 h-3" /> Test Laptop Sync
                  </button>
                )}
              </div>

              {/* Spotify Connection Box */}
              <div className="p-4 rounded-2xl bg-black/30 border border-white/10 space-y-3">
                <div className="flex items-center justify-between">
                  <h4 className="text-xs font-bold uppercase tracking-wider text-purple-300 flex items-center gap-1.5">
                    Connect Spotify Account
                  </h4>
                  <a
                    href="https://developer.spotify.com/dashboard"
                    target="_blank"
                    rel="noreferrer"
                    className="text-[11px] text-white/50 hover:text-white flex items-center gap-1"
                  >
                    Spotify Dashboard <ExternalLink className="w-3 h-3" />
                  </a>
                </div>

                <p className="text-xs text-white/70 leading-relaxed">
                  To stream what your laptop is playing right now, enter your Spotify User Access Token (from Spotify Web API Console) or your Client ID to authenticate:
                </p>

                <div className="space-y-2">
                  <input
                    type="text"
                    value={tokenInput}
                    onChange={(e) => setTokenInput(e.target.value)}
                    placeholder="Paste Spotify OAuth Access Token..."
                    className="w-full px-3.5 py-2.5 rounded-xl bg-white/5 border border-white/15 text-xs text-white placeholder-white/30 focus:outline-hidden focus:border-purple-400"
                  />

                  <div className="flex items-center gap-2">
                    <button
                      onClick={handleSaveSpotify}
                      className="flex-1 py-2 rounded-xl text-xs font-semibold bg-emerald-600 hover:bg-emerald-500 text-white transition-colors"
                    >
                      Connect & Poll Laptop
                    </button>
                    <button
                      onClick={handleLaunchAuthPopup}
                      className="px-3.5 py-2 rounded-xl text-xs font-medium bg-white/10 hover:bg-white/20 text-white border border-white/15 transition-colors"
                    >
                      Authorize via Web
                    </button>
                  </div>
                </div>

                {authStatusMsg && (
                  <p className="text-[11px] text-purple-300 font-mono">
                    {authStatusMsg}
                  </p>
                )}
              </div>

              {/* Auto-poll interval toggle */}
              <div className="flex items-center justify-between p-3 rounded-xl bg-white/5">
                <div>
                  <h5 className="text-xs font-medium text-white">Auto-Sync Laptop Playback</h5>
                  <p className="text-[11px] text-white/50">Poll current track and queue every 2.5 seconds</p>
                </div>
                <input
                  type="checkbox"
                  checked={settings.autoSyncLaptop}
                  onChange={(e) => onUpdateSettings({ autoSyncLaptop: e.target.checked })}
                  className="w-4 h-4 accent-purple-500 rounded"
                />
              </div>
            </div>
          )}

          {activeTab === 'appearance' && (
            <div className="space-y-5">
              {/* Dynamic Background Toggle */}
              <div className="flex items-center justify-between p-3.5 rounded-2xl bg-white/5 border border-white/10">
                <div className="flex items-center gap-3">
                  <Sparkles className="w-5 h-5 text-amber-400" />
                  <div>
                    <h5 className="text-xs font-semibold text-white">Dynamic Album Art Ambience</h5>
                    <p className="text-[11px] text-white/50">Smoothly adapt background colors to match active album</p>
                  </div>
                </div>
                <input
                  type="checkbox"
                  checked={settings.dynamicBackground}
                  onChange={(e) => onUpdateSettings({ dynamicBackground: e.target.checked })}
                  className="w-4 h-4 accent-purple-500 rounded"
                />
              </div>

              {/* Glass Blur Level */}
              <div className="space-y-2">
                <label className="text-xs font-semibold text-white/80 block">
                  Liquid Glass Blur Intensity
                </label>
                <div className="grid grid-cols-4 gap-2">
                  {(['low', 'medium', 'high', 'ultra'] as const).map((blur) => (
                    <button
                      key={blur}
                      onClick={() => onUpdateSettings({ glassBlur: blur })}
                      className={`py-2 rounded-xl text-xs capitalize transition-all border ${
                        settings.glassBlur === blur
                          ? 'bg-purple-600/30 border-purple-400 text-white font-semibold'
                          : 'bg-white/5 border-white/10 text-white/60 hover:text-white'
                      }`}
                    >
                      {blur}
                    </button>
                  ))}
                </div>
              </div>

              {/* Carousel Scale */}
              <div className="space-y-2">
                <div className="flex justify-between items-center text-xs">
                  <span className="font-semibold text-white/80">Album Carousel Size</span>
                  <span className="font-mono text-purple-300">{Math.round(settings.carouselScale * 100)}%</span>
                </div>
                <input
                  type="range"
                  min="0.8"
                  max="1.2"
                  step="0.05"
                  value={settings.carouselScale}
                  onChange={(e) => onUpdateSettings({ carouselScale: parseFloat(e.target.value) })}
                  className="w-full h-1.5 accent-purple-500 rounded-lg cursor-pointer bg-white/20"
                />
              </div>
            </div>
          )}

          {activeTab === 'widget' && (
            <div className="space-y-5">
              {/* Display Mode Switcher */}
              <div className="space-y-2">
                <label className="text-xs font-semibold text-white/80 block">
                  Desktop Presentation Mode
                </label>
                <div className="grid grid-cols-2 gap-3">
                  <button
                    onClick={() => onUpdateSettings({ displayMode: 'compact' })}
                    className={`p-4 rounded-2xl text-left border transition-all ${
                      settings.displayMode === 'compact'
                        ? 'bg-purple-600/20 border-purple-400 text-white shadow-lg'
                        : 'bg-white/5 border-white/10 text-white/60 hover:text-white'
                    }`}
                  >
                    <div className="flex items-center gap-2 mb-1.5">
                      <AppWindow className="w-4 h-4 text-purple-400" />
                      <span className="text-xs font-bold">Floating Widget</span>
                    </div>
                    <p className="text-[11px] text-white/50 leading-relaxed">
                      macOS style window with traffic light controls and delicate glass chrome.
                    </p>
                  </button>

                  <button
                    onClick={() => onUpdateSettings({ displayMode: 'wallpaper' })}
                    className={`p-4 rounded-2xl text-left border transition-all ${
                      settings.displayMode === 'wallpaper'
                        ? 'bg-purple-600/20 border-purple-400 text-white shadow-lg'
                        : 'bg-white/5 border-white/10 text-white/60 hover:text-white'
                    }`}
                  >
                    <div className="flex items-center gap-2 mb-1.5">
                      <Monitor className="w-4 h-4 text-purple-400" />
                      <span className="text-xs font-bold">Cinematic Desktop</span>
                    </div>
                    <p className="text-[11px] text-white/50 leading-relaxed">
                      Full-screen wallpaper immersion with edge-to-edge floating music stage.
                    </p>
                  </button>
                </div>
              </div>

              {/* Window Properties */}
              <div className="space-y-3 p-4 rounded-2xl bg-white/5 border border-white/10">
                <div className="flex items-center justify-between">
                  <div>
                    <h5 className="text-xs font-medium text-white">Always-on-Top Floating Mode</h5>
                    <p className="text-[11px] text-white/50">Stay visible above other desktop applications</p>
                  </div>
                  <input
                    type="checkbox"
                    checked={settings.alwaysOnTop}
                    onChange={(e) => onUpdateSettings({ alwaysOnTop: e.target.checked })}
                    className="w-4 h-4 accent-purple-500 rounded"
                  />
                </div>

                <div className="flex items-center justify-between pt-3 border-t border-white/5">
                  <div>
                    <h5 className="text-xs font-medium text-white">Sidebar Persistent Open</h5>
                    <p className="text-[11px] text-white/50">Keep Recently Played sidebar visible by default</p>
                  </div>
                  <input
                    type="checkbox"
                    checked={settings.sidebarOpen}
                    onChange={(e) => onUpdateSettings({ sidebarOpen: e.target.checked })}
                    className="w-4 h-4 accent-purple-500 rounded"
                  />
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-6 py-3.5 border-t border-white/10 bg-black/40 flex justify-end">
          <button
            onClick={onClose}
            className="px-5 py-2 rounded-xl text-xs font-semibold bg-white text-slate-900 hover:bg-white/90 transition-colors shadow-sm"
          >
            Done
          </button>
        </div>
      </div>
    </div>
  );
};
