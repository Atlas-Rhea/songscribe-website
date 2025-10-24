# Waveform Sections Feature

## Overview

This document describes the new **Waveform Sections** feature for SongScribe's Magnetic 2.0 recording pane. It enables users to define, label, and interact with multiple regions ("sections") within the audio waveform, such as verses, choruses, and bridges. This feature is designed to align with the Magnetic 2.0 spec and leverages Peaks.js v3 for waveform rendering, with all UI overlays managed in React.

---

## Goals
- Allow users to create, label, and edit multiple sections (regions) on the waveform.
- Sections are visually distinct, non-overlapping, and can be named (e.g., "Verse 1", "Chorus").
- All section overlays are rendered in React, not by Peaks.js default UI.
- Section logic is fully integrated with the WaveformController API and React state.
- No default Peaks.js handles or labels are visible; all UI is custom.

---

## API Contract (Controller)

```ts
interface Section {
  id: string;
  startTime: number;
  endTime: number;
  label?: string;
  color?: string;
}

interface WaveformController {
  // ...existing methods...
  addSection(startTime: number, endTime: number, label?: string, color?: string): string;
  updateSection(id: string, newProps: Partial<Omit<Section, 'id'>>): void;
  removeSection(id: string): void;
  getSections(): Section[];
  onSectionsChange(cb: (sections: Section[]) => void): () => void;
}
```

- All section state is managed in the controller and synchronized with Peaks.js segments (with `editable: false` and `color: 'transparent'`).
- React components subscribe to section changes via `onSectionsChange`.

---

## UI/UX
- Sections are rendered as colored overlays on the waveform canvas (e.g., semi-transparent orange, blue, etc.).
- Section labels are displayed at the start of each region.
- Users can:
  - Click and drag to create a new section.
  - Click a section to select and edit its label or boundaries.
  - Delete a section via context menu or button.
- Section overlays are always above the waveform but below handles and chips.
- No default Peaks.js handles, markers, or labels are visible.

---

## Data Flow
- Peaks.js emits time and segment events.
- WaveformController manages section state and notifies React via `onSectionsChange`.
- React overlay renders all section visuals and handles all user interaction.
- All section add/update/remove actions are routed through the controller API.

---

## Future Considerations
- Section snapping (to beats, bars, or other sections).
- Section color customization.
- Export/import of section metadata with audio files.
- Multi-track support (stacked waveform sections).

---

## References
- [Magnetic 2.0 Spec, Sections & API](#)
- [Peaks.js Segments API](https://bbc.github.io/peaks.js/segments.html)
- [Peaks.js Region Drawing Discussion](https://github.com/bbc/peaks.js/discussions/373)

---

*Document created: 2025-05-30* 