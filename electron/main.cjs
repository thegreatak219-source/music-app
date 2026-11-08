const { app, BrowserWindow, ipcMain } = require('electron');
const path = require('path');
const { exec } = require('child_process');

let mainWindow = null;

function createWindow() {
  mainWindow = new BrowserWindow({
    width: 1100,
    height: 760,
    minWidth: 800,
    minHeight: 600,
    frame: false,
    transparent: true,
    hasShadow: false,
    backgroundColor: '#00000000',
    vibrancy: 'under-window', // macOS native liquid glass vibrancy
    visualEffectState: 'active',
    titleBarStyle: 'customButtonsOnHover',
    webPreferences: {
      preload: path.join(__dirname, 'preload.cjs'),
      nodeIntegration: false,
      contextIsolation: true
    }
  });

  // Always on top / desktop pin toggle
  mainWindow.setAlwaysOnTop(true, 'floating');

  const startUrl = process.env.ELECTRON_START_URL || `file://${path.join(__dirname, '../dist/index.html')}`;
  mainWindow.loadURL(startUrl);

  mainWindow.on('closed', () => {
    mainWindow = null;
  });
}

// AppleScript helper for native macOS Spotify & Apple Music
function runAppleScript(script) {
  return new Promise((resolve, reject) => {
    exec(`osascript -e '${script}'`, (error, stdout) => {
      if (error) {
        resolve({ error: error.message });
      } else {
        resolve({ output: stdout.trim() });
      }
    });
  });
}

// IPC: Get currently playing from macOS Spotify or Apple Music
ipcMain.handle('get-native-playback', async () => {
  // 1. Try Spotify first
  const spotifyScript = `
    if application "Spotify" is running then
      tell application "Spotify"
        set tName to name of current track
        set tArtist to artist of current track
        set tAlbum to album of current track
        set tDuration to (duration of current track) / 1000
        set tPos to player position
        set tState to player state as string
        set tArt to artwork url of current track
        return tName & "|||" & tArtist & "|||" & tAlbum & "|||" & tDuration & "|||" & tPos & "|||" & tState & "|||" & tArt
      end tell
    else
      return "NOT_RUNNING"
    end if
  `;

  const spotifyRes = await runAppleScript(spotifyScript);
  if (spotifyRes.output && spotifyRes.output !== 'NOT_RUNNING') {
    const [name, artist, album, duration, pos, state, art] = spotifyRes.output.split('|||');
    return {
      isAvailable: true,
      appRunning: true,
      service: 'spotify',
      trackName: name,
      artist: artist,
      album: album,
      durationSec: Math.round(parseFloat(duration) || 200),
      positionSec: Math.round(parseFloat(pos) || 0),
      playerState: state,
      artworkUrl: art || ''
    };
  }

  // 2. Try native Apple Music (Music.app)
  const musicScript = `
    if application "Music" is running then
      tell application "Music"
        set tName to name of current track
        set tArtist to artist of current track
        set tAlbum to album of current track
        set tDuration to duration of current track
        set tPos to player position
        set tState to player state as string
        return tName & "|||" & tArtist & "|||" & tAlbum & "|||" & tDuration & "|||" & tPos & "|||" & tState
      end tell
    else
      return "NOT_RUNNING"
    end if
  `;

  const musicRes = await runAppleScript(musicScript);
  if (musicRes.output && musicRes.output !== 'NOT_RUNNING') {
    const [name, artist, album, duration, pos, state] = musicRes.output.split('|||');
    return {
      isAvailable: true,
      appRunning: true,
      service: 'apple',
      trackName: name,
      artist: artist,
      album: album,
      durationSec: Math.round(parseFloat(duration) || 200),
      positionSec: Math.round(parseFloat(pos) || 0),
      playerState: state,
      artworkUrl: ''
    };
  }

  return { isAvailable: false, appRunning: false };
});

// IPC: Control native macOS playback
ipcMain.handle('send-native-command', async (event, command) => {
  let appName = 'Spotify';
  const checkRes = await runAppleScript('if application "Spotify" is running then return "YES"');
  if (checkRes.output !== 'YES') {
    appName = 'Music';
  }

  let script = '';
  switch (command) {
    case 'play':
      script = `tell application "${appName}" to play`;
      break;
    case 'pause':
      script = `tell application "${appName}" to pause`;
      break;
    case 'toggle':
      script = `tell application "${appName}" to playpause`;
      break;
    case 'next':
      script = `tell application "${appName}" to next track`;
      break;
    case 'previous':
      script = `tell application "${appName}" to previous track`;
      break;
    default:
      return false;
  }

  await runAppleScript(script);
  return true;
});

// Window controls
ipcMain.on('window-close', () => mainWindow?.close());
ipcMain.on('window-minimize', () => mainWindow?.minimize());
ipcMain.on('window-toggle-pin', (event, isPinned) => {
  mainWindow?.setAlwaysOnTop(isPinned, 'floating');
});

app.whenReady().then(createWindow);

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') app.quit();
});

app.on('activate', () => {
  if (BrowserWindow.getAllWindows().length === 0) createWindow();
});
