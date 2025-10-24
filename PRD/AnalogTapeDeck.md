# PRD: Analog Tape Deck & Magnetic 2.0 Waveform

## 1. Vision & Goal
To integrate a seamless, powerful audio recording, editing, and management system ("Analog Tape Deck") directly within the song-writing view. This system will feature a "Magnetic 2.0" waveform component that allows for precise, mobile-friendly interaction, replacing older implementations. The primary goal is to eliminate workflow friction by allowing songwriters to capture, transcribe, and iterate on musical ideas without leaving the editor.

## 2. Core User Stories

| ID   | Priority | Story                                                                                                              | Source Doc                                         |
| ---- | -------- | ------------------------------------------------------------------------------------------------------------------ | -------------------------------------------------- |
| PL-1 | 💥       | *As a songwriter, I want transport & looping visible while I type lyrics so I can transcribe phrasing on the fly.* | Push‑Up Layout                                     |
| WF-1 | 💥       | *As a writer, I can scroll/zoom the waveform and drag locked handles to loop exact bars while typing lyrics.* | Waveform Rebuild                                   |
| WF-2 | 💥       | *Holding a handle ≥450 ms triggers a pop‑pop flash and locks that edge until tapped again.*                   | Waveform Rebuild                                   |
| WF-3 | 💥       | *Dragging the playhead (scrub) updates audio in real time when Scrub 🔊 is on.*                               | Waveform Rebuild                                   |
| PL-2 | 💥       | *When I tap the Waveform button, the pane should appear only tall enough to show controls, not obscure my text.*   | Push‑Up Layout                                     |
| PL-5 | 💥       | *Selecting a recording auto‑loads it and arms Loop so I can A/B that section instantly.*                           | Push‑Up Layout                                     |
| WF-4 | 🚀       | *I can tap a time chip, type "1:23.456", and the handle/playhead jumps to that exact time.*                   | Waveform Rebuild                                   |
| WF-5 | 🚀       | *Cropping (✂︎) instantly spawns a new clip from the selected region.*                                         | Waveform Rebuild                                   |
| PL-3 | 🚀       | *If I drag the pane taller, the workspace should resize smoothly without hiding input focus.*                      | Push‑Up Layout                                     |
| SC-1 | 🚀       | Highlight a time range and label it (e.g., "Chorus Idea") for later recall.                                          | Clip Manager                                       |
| SC-2 | 🚀       | Trim segments into named clips and reorder them into rough song sketches.                                          | Clip Manager                                       |
| PL-4 | 🚧       | *The right‑hand toolbar can disappear when the pane is expanded to prevent overlap.*                               | Push‑Up Layout                                     |

## 3. Feature Overview & Layout

### 3.1. Push-Up Deck Layout
- The recording pane will be a "push-up deck" that docks at the bottom of the screen, pushing the lyrics editor up instead of overlaying it.
- **Collapsed State:** 56px height, showing only transport controls (Play, Pause, FFW, RWD), Loop toggle, time display, and an expand handle.
- **Expanded State:** Draggable up to 40% of the viewport height. The waveform and other advanced controls are visible in this state.
- **Resize Logic:** The main editor and the deck will be in a flex-column container. The editor will have `flex: 1 1 auto` and the deck `flex: 0 0 deckHeight`.
- **Toolbar Behavior:** The right-hand editor toolbar will slide off-screen when the deck is expanded beyond a certain threshold (e.g., 120px).

### 3.2. Magnetic 2.0 Waveform
- **Rendering:**
    - **Engine:** Headless `Peaks.js v3` for waveform data management, zoom, and segments.
    - **Waveform:** Rendered on a single `<canvas>` element.
    - **UI Overlay:** Handles, time chips, playhead, and other interactive elements will be React DOM components positioned absolutely over the canvas.
- **Visuals & Styling:**
    - **Waveform Colors:**
        - Outside selection: `#666666` (grey)
        - In-selection, played: `#FFB266` (light-orange)
        - In-selection, unplayed: `#C84B31` (dark-orange)
    - **Grab Handles:**
        - **Form:** A pair of slim, vertical, rounded-cap bars (2px thick), spaced 6px apart.
        - **States & Colors:**
            - Loop Off: `#808080 @ 30%` opacity, non-interactive.
            - Loop On/Idle: `#C84B31`.
            - Hover/Drag: Scale up 1.1x.
            - Locked: Flash with `#FFD08A` and scale up 1.25x.
    - **Controls:**
        - **Zoom:** `+` and `-` buttons in the top-left corner.
        - **Scrub Toggle:** An icon in the top-right to enable/disable live audio follow during scrubbing.
- **Interactivity:**
    - **A-B Looping:** Enabled by a toggle. Draggable handles define the loop region.
    - **Pop-Pop Lock:** Holding a handle for >450ms locks it. A tap unlocks it.
    - **Scrubbing:** Dragging the playhead directly.
    - **Time Chips:** Editable time displays for handles and playhead.
    - **Clipping:** A "crop" button (✂︎) to create a new audio clip from the selected region.

## 4. Technical Architecture

- **State Management:**
    - `UIState`: `deckHeight`, `isToolbarHidden`, `activeRecordingId`.
    - `WaveformController`: A controller class/hook that wraps the Peaks.js instance and provides a clean API for the UI components.
- **Component Structure:**
    ```
    <EditorLayout>
      <LyricsEditor />
      <RecordingPane>
        <ResizeHandle />
        <TransportControls />
        <WaveformContainer>
          <canvas id="wave-canvas"/>
          <HandlesOverlay/>
        </WaveformContainer>
        <ClipList />
      </RecordingPane>
    </EditorLayout>
    ```
- **Audio Backend:**
    - A native `<audio>` element as the single source of truth for playback, controlled by the `WaveformController` and synced with Peaks.js.
    - **Recording:** Use `MediaRecorder API`.

## 5. Bivvy Moves (Implementation Plan)

1.  **Project Setup:** Initialize Taskmaster for this feature.
2.  **Layout Refactor:** Implement the "Push-Up Deck" layout. Modify the main editor view to use a flex-column layout to accommodate the deck. Create the `RecordingPane` container that can be resized.
3.  **State Management:** Implement the `UIState` management for `deckHeight` and toolbar visibility.
4.  **WaveformController:** Create a `WaveformController` hook/service that encapsulates Peaks.js logic (loading data, play, pause, seek, zoom).
5.  **Waveform Canvas:** Integrate the canvas into `RecordingPane` and use the `WaveformController` to draw the basic waveform using Peaks.js. Implement the color-coding logic (grey outside, orange inside).
6.  **HandlesOverlay:** Create the `HandlesOverlay.tsx` component.
7.  **Handle Component:** Build the `Handle.tsx` component with the specified visual design and drag logic.
8.  **Pop-Pop Lock:** Implement the "pop-pop" lock state machine within the `Handle` component.
9.  **Time Chips:** Add editable time chips next to the handles.
10. **A-B Looping:** Hook up the handles to the `WaveformController` to control the loop region in Peaks.js.
11. **Scrubbing:** Implement playhead dragging and the live scrub toggle.
12. **Clipping Feature:** Implement the `crop` functionality and UI.
13. **Clip Management:** Implement UI for listing, selecting, and managing clips.
14. **Integration & QA:** Ensure all parts work together, focus is managed correctly, and the experience is smooth. Update `PROJECT_BIBLE.md`. 