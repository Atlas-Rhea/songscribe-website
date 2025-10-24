# SongScribe – Waveform Crop & Loop UX

## Visual Goal
Replicate the familiar **iOS Photos video-trim bar**, but on an
audio waveform:

│ grey-fade │ █ yellow-highlight █ │ grey-fade │
            ▲ left handle   ▲ right handle

* Full recording is always visible; the currently-selected loop
  range is the **yellow highlight** (brand-orange #FBBF24 @ 60 %).
* Outside the range, the waveform is faded to 20 % opacity.
* Two drag handles sit INSIDE the range, flush to its edges:
  ▸ 8 px wide, 32 px tall, rounded-rect, brand-orange fill,
    subtle inner shadow.
* The range itself can be dragged as a block (moves both A & B).

## Interaction Flow
1. **Initial state** — Entire take pre-selected (range = 0-end).
2. **Drag left/right handle** — Resizes start/end; realtime loop
   preview (playhead shuttles with mouse/touch).
3. **Drag inside highlight** — Moves range; keeps width constant.
4. **Double-tap highlight** — Resets to full-length.
5. **⌥ Option-drag** handle — Fine control (×0.1 scrub speed).
6. **Keyboard**  
   * ← / →  nudge start  
   * ⇧← / ⇧→  nudge end  
   * ⌘L  toggle loop

## Accessibility
* Handles are `<button role="slider">` with `aria-valuenow`
  (milliseconds).
* 44 × 44 px hit targets.

## Assets
See `/design/reference/ios_crop_bar.png` for visual.
