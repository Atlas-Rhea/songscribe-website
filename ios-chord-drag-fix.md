# iOS Chord Drag Fix - Inline Node Architecture

## Problem Summary
The original iOS chord dragging issue was caused by a fundamental architectural mismatch:
- **Widget Decorations**: Chords were rendered as ProseMirror widget decorations floating above text
- **Coordinate Mapping Failure**: `posAtCoords` couldn't map touch coordinates to document positions because widget decorations interfered with coordinate space
- **Mobile Safari Issues**: Touch coordinate system didn't align with ProseMirror's coordinate system
- **Result**: Chords always snapped to position 3-4 (beginning of line) regardless of drop location

## Root Cause Analysis
The core issue was that `posAtCoords` method:
1. **Wasn't designed for widget decorations** - it expects clean text content
2. **Doesn't work with mobile touch events** - designed for desktop mouse coordinates  
3. **Creates coordinate mapping conflicts** - widget decorations create "dead zones" in coordinate space
4. **Fundamentally incompatible** with the overlay approach on mobile Safari

## Solution: Inline Node Architecture

### Key Changes Made
- **Replaced Widget Decorations**: Moved from DOM-only overlay widgets to proper inline chord nodes in ProseMirror schema
- **Custom NodeView Implementation**: Created `ChordNode.tsx` that renders an inline `span.chord-node__label` anchored to document flow
- **Direct Event Handling**: Events now happen on actual chord nodes, not coordinate translation
- **Pointer Capture**: Uses `setPointerCapture` for reliable touch tracking on mobile
- **Clean Separation**: Overlays are purely decorative (`pointer-events: none`), events on document nodes

### Technical Implementation
```typescript
// Before: Coordinate-based approach (broken)
const dropPos = view.posAtCoords({ left: touchX, top: touchY }); // Always returned 3-4

// After: Node-based approach (working)
// Events handled directly on chord nodes with pointer capture
// No coordinate translation needed
```

### Architecture Benefits
1. **No Coordinate Translation**: Events happen on actual chord nodes
2. **Proper Touch Handling**: `setPointerCapture` ensures reliable touch tracking
3. **Clean Event Flow**: No widget decoration interference
4. **Better Performance**: Direct node manipulation instead of coordinate calculations
5. **Maintainable**: Clear separation between visual overlays and functional nodes

## Files Modified
- **`src/tiptap/ChordNode.tsx`**: New NodeView implementation with pointer capture
- **`src/styles/chord-overlay.css`**: Updated styles for NodeView architecture
- **`src/tiptap/extensions/ChordInteractivityExt.ts`**: Simplified to lightweight click handler
- **`src/components/LyricsEditor.tsx`**: Updated editor wiring for ChordNode
- **`e2e/` specs**: Updated to target `.chord-node__label` instead of `.chord-overlay`

## Verification
- **Manual Testing**: Drag chords on iOS Safari - they should land exactly where you drop them
- **Desktop Compatibility**: Pointer dragging works the same as before
- **Event Handling**: Quick taps still open chord picker when chord mode is disabled
- **Performance**: No coordinate calculation overhead

## Why This Solution Works
This approach **bypasses the fundamental coordinate mapping issues** by:
- Making chords actual document nodes (not decorations)
- Handling events on the nodes themselves (not coordinate translation)
- Using proper pointer capture for reliable touch tracking
- Eliminating the need for `posAtCoords` entirely for mobile touch events

The solution addresses the **root architectural problem** rather than trying to work around it with coordinate system fallbacks and offset adjustments.
