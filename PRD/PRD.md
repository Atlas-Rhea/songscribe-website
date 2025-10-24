# SongScribe Product Requirements Document (PRD)

## Vision
Empower musicians and songwriters to create, edit, and organize lyrics and chords with ease, using a modern, collaborative, and AI-augmented editor that works offline and online.

## Goals
- Provide a seamless lyrics and chord editing experience, optimized for musicians.
- Support chord mode with accurate, position-based chord attachment and editing.
- Preserve formatting (bold, italic) and ensure chords remain visually and functionally attached to words.
- Enable offline-first usage with robust local storage and sync.
- Offer powerful search, organization, and export features.
- Support future AI features for auto-chording, lyric suggestions, and more.

## Features

### Core Editor
- Rich text editing for lyrics (bold, italic, underline, etc.)
- Chord mode: toggle to show/hide and edit chords above words
- Chord picker and removal UI
- Drag-and-drop chord reordering (future)
- Section/verse/chorus structure support

### Chord Management
- Chords are attached by absolute document position (not word index)
- Chord insertion/removal is always position-based
- Chord flags are visually aligned above the first letter of the word
- Chord decorations do not interfere with lyric formatting

### Collaboration & Organization
- Song list and folder/tag organization
- Song metadata: key, tempo, time signature, etc.
- Export to PDF, text, or other formats

### Offline & Sync
- Full offline support (local storage)
- Sync with cloud (future)

### AI/Automation (Future)
- Auto-chord suggestion from lyrics or audio
- Lyric suggestion/completion
- Smart search and filtering

## User Stories

- As a songwriter, I want to quickly add chords above lyrics so I can capture musical ideas as they come.
- As a musician, I want to see chords and lyrics clearly aligned, so I can play and sing without confusion.
- As a collaborator, I want to organize songs by folder/tag and share them with others.
- As a user, I want to work offline and have my changes sync when I'm back online.

## Success Metrics

- Users can add, edit, and remove chords with no data loss or misalignment.
- Chord and lyric formatting is preserved across all editing operations.
- Songs can be exported and shared in standard formats.
- The app is fast and reliable, even offline.

## Constraints & Assumptions

- Must work in modern browsers (desktop and mobile)
- No backend required for core features (offline-first)
- Future AI features will be opt-in and privacy-respecting

--- 