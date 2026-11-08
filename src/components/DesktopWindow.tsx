import React from 'react';
import { WidgetSettings, LaptopPlaybackState } from '../types/music';
import { 
  Laptop, 
  Search, 
  History, 
  Settings, 
  Sparkles,
  Maximize2,
  Minimize2
} from 'lucide-react';

interface DesktopWindowProps {
  children: React.ReactNode;
  settings: WidgetSettings;
  laptopState: LaptopPlaybackState;
  onToggleSidebar: () => void;
  onOpenSearch: () => void;
  onOpenSettings: () => void;
  onToggleDisplayMode: () => void;
}

export const DesktopWindow: React.FC<DesktopWindowProps> = ({
  children,
  settings,
  laptopState,
  onToggleSidebar,
  onOpenSearch,
  onOpenSettings,
  onToggleDisplayMode
}) => {
  const isFramed = settings.displayMode === 'compact' && false; // Keep default borderless floating as in reference

  return (
    <div className="relative min-h-screen w-full flex flex-col justify-between overflow-hidden">
      {/* Floating macOS Top-Left Traffic Lights (Discreet & Non-Intrusive) */}
      <div className="fixed top-6 left-7 z-40 flex items-center gap-2 group opacity-75 hover:opacity-100 transition-opacity">
        <button 
          onClick={() => alert('LiquidGlass floats persistently on your macOS desktop.')}
          className="w-3 h-3 rounded-full bg-[#ff5f56] border border-[#e0443e] hover:scale-110 active:scale-95 transition-transform" 
          title="Close / Hide"
        />
        <button 
          onClick={onToggleDisplayMode}
          className="w-3 h-3 rounded-full bg-[#ffbd2e] border border-[#dea123] hover:scale-110 active:scale-95 transition-transform" 
          title="Minimize to Dock"
        />
        <button 
          onClick={onToggleDisplayMode}
          className="w-3 h-3 rounded-full bg-[#27c93f] border border-[#1aab29] hover:scale-110 active:scale-95 transition-transform" 
          title="Toggle Fullscreen"
        />
      </div>

      {/* Floating macOS Top-Right Utilities Bar (Liquid Glass Pill) */}
      <div className="fixed top-6 right-7 z-40 flex items-center gap-1.5 p-1 rounded-full bg-white/10 backdrop-blur-xl border border-white/20 shadow-lg opacity-70 hover:opacity-100 transition-all">
        {/* Laptop Sync Status */}
        {laptopState.isConnected && (
          <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-emerald-500/20 text-emerald-300 text-[10px] font-mono border border-emerald-500/30 mr-1">
            <Laptop className="w-3 h-3" />
            <span className="truncate max-w-[100px]">{laptopState.deviceName || 'MacBook'}</span>
          </div>
        )}

        {/* Recently Played */}
        <button
          onClick={onToggleSidebar}
          title="Recently Played"
          className="p-1.5 rounded-full text-white/80 hover:text-white hover:bg-white/15 transition-colors"
        >
          <History className="w-4 h-4" />
        </button>

        {/* Search */}
        <button
          onClick={onOpenSearch}
          title="Search Music (⌘K)"
          className="p-1.5 rounded-full text-white/80 hover:text-white hover:bg-white/15 transition-colors"
        >
          <Search className="w-4 h-4" />
        </button>

        {/* Settings */}
        <button
          onClick={onOpenSettings}
          title="Settings & Connect"
          className="p-1.5 rounded-full text-white/80 hover:text-white hover:bg-white/15 transition-colors"
        >
          <Settings className="w-4 h-4" />
        </button>
      </div>

      {/* Main Floating Showcase Area */}
      <main className="relative flex-1 flex flex-col justify-between py-6 sm:py-10 z-10">
        {children}
      </main>
    </div>
  );
};
