# LiquidGlass: Cinematic macOS Desktop Music Widget

A floating, translucent macOS desktop music widget inspired by Apple Music and macOS Liquid Glass aesthetics. It features an interactive 3D perspective album carousel, a floating pill-shaped playback dock with real-time audio controls, laptop playback sync (Spotify Connect and Apple Music Web API), a recently played sidebar, live lyrics, and an ambient desktop wallpaper engine.

## User Review & Critical Decisions

> [!IMPORTANT]
> Based on your preferences from Phase 1, we have aligned on the following core design choices:

- **Confirmed Playback & Device Detection**: The widget will actively inspect and poll what music your laptop/desktop is currently playing (via Spotify Web API `/me/player` & `/me/player/queue` live polling and Apple Music MusicKit SDK), with direct access to next queued songs and playback controls. It also includes an instant standalone audio engine with realistic high-fidelity audio streams for instant out-of-the-box immersion.
- **Confirmed Presentation Mode**: Defaults to **Floating Compact Widget Overlay Mode** with authentic macOS window controls (traffic lights: close, minimize, expand/dock), translucent glass borders, drag-to-reposition handles, and quick-toggle between desktop wallpaper backdrop and transparent overlay mode.
- **Confirmed Carousel Navigation**: **Interactive Physics Drag with Mouse Wheel & Keyboard Navigation**, supporting smooth cursor dragging with inertial dampening, trackpad wheel scrolling, keyboard arrow keys (Left/Right to slide, Space to toggle play, Enter to expand), and click-to-center focus.

---

## 1. Overview & Core Concept

- **What It Does**: Transposes the desktop into an immersive acoustic showcase. The center of the screen features a floating 3D album carousel rendered with realistic perspective tilt, depth scaling, and specular glass rim lighting matching the provided reference image. Beneath it sits a floating translucent glass pill player with animated progress scrubber, track metadata, airplay, lyrics, queue, and volume sliders.
- **Target Audience / Persona**: Music enthusiasts and macOS power users who want an aesthetic, always-available desktop music companion that connects directly to their active Spotify or Apple Music sessions on their laptop.
- **Key Value**: Replaces utilitarian music apps with a cinematic, gallery-grade desktop experience that adapts its ambient background colors in real time to the current album art palette.

---

## 2. User Experience & Visual Design

### Key User Flows

1. **Active Laptop Music Sync & Initial Launch**:
   - On opening, the widget loads into the floating overlay mode with the 3D album carousel centered.
   - If connected to Spotify or Apple Music, it polls the active laptop playback state (`/me/player`) to show the real currently playing track, progress, and upcoming queue.
   - If not yet connected, users can tap "Connect Spotify" or "Connect Apple Music" in the quick settings drawer, or immediately enjoy the built-in curated library featuring tracks from the reference image (*Shape of You*, *Levitating*, *Blinding Lights*, *bad guy*, *Believer*) with real streaming audio.
2. **3D Carousel Exploration**:
   - The user drags horizontally, scrolls with the mouse wheel/trackpad, or presses Left/Right arrow keys.
   - The active center album expands with crisp typography (Song Title, Artist, Year) on a frosted lower badge. Surrounding albums recede in Z-space with 3D yaw rotation, optical blur, and subtle opacity attenuation.
   - Clicking any background album smoothly glides it to the center and triggers playback.
3. **Floating Glass Dock Interaction**:
   - Users can pause/play, skip forward/back, scrub the interactive glowing progress bar, adjust volume with mute toggle, switch shuffle/repeat modes, and open the lyrics and queue drawers.
4. **Recently Played Sidebar & Search**:
   - Tapping the sidebar icon reveals an Apple-styled frosted glass panel on the left displaying recently played tracks with active equalizer wave animations.
   - Tapping the search icon opens a translucent floating command bar to search tracks, artists, and albums.
5. **Desktop & Widget Customization**:
   - A dedicated Settings panel allows users to adjust glass blur intensity, carousel scale, 3D tilt sensitivity, ambient background mode (dynamic color glow vs. dark glass wallpaper), and switch between floating widget window and full desktop mode.

### Visual Identity & Theme

- **Aesthetic Direction**: Apple macOS Liquid Glass — dark frosted glass surfaces (`backdrop-blur-2xl`), delicate 1px specular highlight borders (`rgba(255, 255, 255, 0.15)`), soft drop shadows, and subtle ambient reflections.
- **Color Palette & Atmospheric Lighting**:
  - Deep space neutral canvas: `#0b0e14` to `#161b26`.
  - Translucent glass pills: `rgba(255, 255, 255, 0.08)` to `rgba(255, 255, 255, 0.16)`.
  - Dynamic ambient backdrops: Soft multi-point radial gradients sampled from the active album cover (mauve, deep sky blue, warm amber, midnight violet).
  - Text: `#FFFFFF` for primary track titles, `rgba(255, 255, 255, 0.70)` for artists/subtitles, `rgba(255, 255, 255, 0.40)` for metadata.
- **Typography**: Clean geometric typography using `Plus Jakarta Sans` for titles and UI labels, paired with tabular figures (`tabular-nums`) for track duration timers and scrubber timestamps.

---

## 3. Key Product Decisions & Trade-Offs

- **Decision 1: Dual-Mode Playback Engine (Active Laptop Sync + Built-in Audio Player)**
  - *Chosen Approach*: Implement a unified player adapter. When the user connects their Spotify account via OAuth or enters their credentials, the widget continuously polls their laptop's active Spotify playback (`/me/player`) and queue (`/me/player/queue`), sending remote commands (`/me/player/play`, `/next`, `/seek`). Simultaneously, provide a high-fidelity local HTML5 Web Audio fallback engine loaded with real audio preview streams so the widget is immediately functional and interactive without requiring mandatory login upfront.
  - *Why*: Guarantees instant zero-friction delight while fully honoring the user's specific request to check what music their laptop is playing.
- **Decision 2: 3D Carousel Architecture via CSS 3D Transforms with Hardware Acceleration**
  - *Chosen Approach*: Use CSS 3D perspective transforms (`perspective: 1200px`, `transform-style: preserve-3d`, `rotateY`, `translateZ`, `scale3d`) driven by React state and physics damping.
  - *Why*: Delivers crisp text rendering, pixel-perfect glass reflections, and smooth 60 FPS performance without WebGL canvas overhead or text blurring, while matching the exact visual angle and curvature from the reference screenshot.
- **Decision 3: Floating Compact Widget Container with macOS Window Chrome**
  - *Chosen Approach*: Frame the application in an authentic macOS desktop widget window with functional traffic light buttons (close, minimize, maximize), drag handle bar, and a toggle between "Compact Floating Widget" and "Full Cinematic Desktop Wallpaper".
  - *Why*: Fulfills the user's explicit preference for compact floating overlay mode while preserving the option to expand into the full immersive wallpaper view.

---

## 4. Technical Architecture & Data Strategy

### System Architecture Diagram

```
┌────────────────────────────────────────────────────────────────────────┐
│                        macOS Desktop Host Layer                        │
│   ┌────────────────────────────────────────────────────────────────┐   │
│   │  Traffic Lights  │  Widget Title  │  Overlay / Desktop Switch  │   │
│   └────────────────────────────────────────────────────────────────┘   │
└───────────────────────────────────┬────────────────────────────────────┘
                                    │
    ┌───────────────────────────────┴───────────────────────────────┐
    │                                                               │
    ▼                                                               ▼
┌─────────────────────────┐                     ┌─────────────────────────┐
│  Recently Played Dock   │                     │  Translucent Search     │
│  - Track list history   │                     │  - Live search filter   │
│  - Live play indicator  │                     │  - Instant queue add    │
└───────────┬─────────────┘                     └─────────────┬───────────┘
            │                                                 │
            └───────────────────────┬─────────────────────────┘
                                    │
                                    ▼
┌─────────────────────────────────────────────────────────────────────────┐
│                      3D Floating Album Carousel                         │
│  - Perspective 1200px container                                         │
│  - Interactive physics drag, mouse wheel listener, arrow key navigation │
│  - Curved yaw rotation, depth scaling & specular rim lighting           │
│  - Frosted label card with title, artist, year                          │
└───────────────────────────────────┬─────────────────────────────────────┘
                                    │
                                    ▼
┌─────────────────────────────────────────────────────────────────────────┐
│                    Floating Liquid Glass Music Dock                     │
│  - Transport controls: Prev, Play/Pause, Next, Shuffle, Repeat          │
│  - Central mini-card: Thumbnail, Song Title, Artist, AirPlay, Menu      │
│  - Glowing scrubber progress bar with live elapsed/remaining timers     │
│  - Right utilities: Lyrics Drawer, Queue Drawer, Volume Slider & Mute   │
└───────────────────────────────────┬─────────────────────────────────────┘
                                    │
                                    ▼
┌─────────────────────────────────────────────────────────────────────────┐
│                   Unified Audio & Playback Controller                   │
│   ┌──────────────────────────────────┬───────────────────────────────┐  │
│   │     Spotify Web API Client       │     HTML5 Audio Engine        │  │
│   │ - GET /me/player (Polling)       │ - Real preview streams        │  │
│   │ - GET /me/player/queue           │ - AudioContext spectrum       │  │
│   │ - PUT /me/player/play, pause     │ - Zero-latency playback       │  │
│   │ - POST /me/player/next, previous │ - Fallback & offline ready    │  │
│   └──────────────────────────────────┴───────────────────────────────┘  │
└─────────────────────────────────────────────────────────────────────────┘
```

### Data Model & State Strategy

- **Track Model**:
  ```ts
  interface Track {
    id: string;
    title: string;
    artist: string;
    album: string;
    year: number;
    artworkUrl: string;
    duration: number; // in seconds
    audioUrl?: string;
    lyrics?: string[];
    accentColor: string; // for ambient dynamic glow
  }
  ```
- **Playback State**:
  - `currentTrack`: Active track object.
  - `isPlaying`: Boolean status.
  - `currentTime`: Current playback progress in seconds.
  - `volume`: 0 to 1 float with mute toggle.
  - `isShuffle` & `repeatMode`: Off / All / One.
  - `source`: `'local'` | `'spotify'` | `'apple'`.
  - `activeQueue`: Array of upcoming tracks.
  - `recentlyPlayed`: Array of past played tracks.

### Key Sequences

1. **Carousel Navigation Sequence**:
   - User inputs drag or wheel event $\to$ updates `targetIndex` with momentum bounds.
   - Smooth interpolation updates `offset = (index - activeIndex)`.
   - Card transforms calculate:
     - `translateX = offset * 220px`
     - `translateZ = -Math.abs(offset) * 120px`
     - `rotateY = -offset * 18deg`
     - `scale = 1 - Math.min(Math.abs(offset) * 0.12, 0.35)`
   - Center active card receives prominent forward Z-elevation, active glow, and bottom metadata badge.
2. **Laptop Playback Sync Loop**:
   - Polling interval runs every 2.5 seconds when Spotify/Apple service is connected.
   - Updates track title, artwork, progress bar position, and upcoming queue seamlessly.
