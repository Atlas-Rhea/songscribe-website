# Mobile Chord Builder

## Overview
The Mobile Chord Builder provides a mobile-optimized interface for creating and editing chords within the SongScribe application. It features a responsive design that adapts to mobile screen sizes and orientations, with special handling for portrait and landscape modes.

## Key Features

### Responsive Design
- **Portrait Mode**: Optimized for vertical mobile screens with compact controls
- **Landscape Mode**: Utilizes full screen width for enhanced chord visualization
- **Touch-Friendly Interface**: Large buttons and intuitive touch interactions

### Chord Construction
- **Root Note Selection**: Easy selection from C, D, E, F, G, A, B
- **Accidental Support**: Natural (♮), Sharp (♯), Flat (♭)
- **Chord Qualities**: Major, Minor, Diminished, Augmented, Sus2, Sus4
- **Extensions**: 7th, Major 7th, 9th, 11th, 13th
- **Alterations**: Add9, Add11, and other custom chord modifications

### Visual Feedback
- **Real-time Chord Display**: Shows current chord name as user builds it
- **Fullscreen Fretboard**: Large, rotatable fretboard diagram for chord visualization
- **Color-coded Interface**: Consistent with SongScribe's design tokens

## Technical Implementation

### Component Structure
```typescript
interface MobileChordBuilderProps {
  isOpen?: boolean;
  onSelectChord: (chord: string) => void;
  onRemoveChord?: () => void;
  onChordChange?: (chordName: string) => void;
  currentInstrument: 'guitar' | 'bass' | 'piano';
  initialChordLabel?: string;
}
```

### Responsive Dimension Calculations

#### Portrait Mobile Challenge
The primary technical challenge was displaying a guitar fretboard on portrait-oriented mobile devices. Since fretboards are typically wider than tall, but mobile portrait screens are taller than wide, a 90-degree rotation was implemented.

**Key Insight**: On portrait mobile (375px wide × 667px tall):
- `viewportWidth * 0.85 = 319px` → becomes visual HEIGHT after rotation
- `viewportHeight * 0.9 = 600px` → becomes visual WIDTH after rotation

```typescript
// For fullscreen with 90deg rotation: swap dimensions
// width becomes height after rotation, height becomes width
// To get wide result after rotation, height must use viewportHeight
const fullscreenWidth = Math.min(viewportWidth * 0.85, 600);
const fullscreenHeight = Math.min(viewportHeight * 0.9, 1000);
```

### CSS Wrapper Implementation

```css
.fretboard-mobile-fullscreen .fretboard-html-wrapper {
  /* Rotate the fretboard wrapper created by fretboard.js */
  transform: rotate(90deg);
  transform-origin: center center;
  /* Wrapper needs dimensions to be visible - make them generous */
  width: 100vh !important;
  height: 100vw !important;
  display: flex;
  align-items: center;
  justify-content: center;
}
```

### Integration with fretboard.js

The component integrates with the `fretboard.js` library to render interactive chord diagrams:

- **Dynamic Sizing**: Responsive dimensions based on viewport
- **Touch Interactions**: Mobile-optimized dot sizes and touch targets
- **Color Theming**: Consistent with SongScribe's orange/teal color scheme
- **Chord Data Integration**: Uses ChordsDbService for accurate chord positions

## Development History

### Initial Implementation
- Basic mobile-responsive chord builder interface
- Integration with existing chord selection logic
- Touch-friendly button layouts

### Fretboard Display Challenges
Multiple iterations were required to solve the mobile fretboard display:

1. **Rotation Math**: Understanding that 90° rotation swaps width/height visually
2. **Viewport Calculations**: Using correct viewport dimensions for desired visual result
3. **CSS Wrapper Constraints**: Ensuring wrapper doesn't limit SVG display
4. **Responsive Sizing**: Adapting to different mobile screen sizes

### Final Solution
- **Dimension Swapping**: Use `viewportHeight` for width calculation, `viewportWidth` for height
- **Generous CSS Wrapper**: 100vh × 100vw with flexbox centering
- **Responsive Percentages**: 85% width, 90% height utilization

## Usage

### Basic Chord Building
1. Select root note (C, D, E, F, G, A, B)
2. Choose accidental (natural, sharp, flat)
3. Select chord quality (major, minor, diminished, etc.)
4. Add extensions (7th, 9th, 11th, 13th)
5. Apply alterations (add9, sus4, etc.)
6. View fullscreen diagram or insert chord

### Mobile-Specific Features
- **Fullscreen Mode**: Tap "View Diagram" for large, rotatable fretboard
- **Touch Optimization**: Large buttons and intuitive gestures
- **Responsive Layout**: Adapts to screen orientation automatically

## Future Enhancements

### Potential Improvements
- **Multi-touch Gestures**: Pinch-to-zoom fretboard diagrams
- **Chord Library Integration**: Save and recall custom chord voicings
- **Instrument Selection**: Support for different tunings and instruments
- **Accessibility**: Screen reader support and keyboard navigation

### Technical Debt
- **Performance Optimization**: Reduce bundle size for mobile loading
- **Caching**: Cache chord diagrams and position data
- **Error Handling**: Better handling of edge cases and invalid chord combinations

## Testing

### Mobile Compatibility
- **iOS Safari**: Tested on iPhone SE and iPhone 12 Pro
- **Android Chrome**: Tested on Pixel 4 and Samsung Galaxy S21
- **Responsive Breakpoints**: 320px to 768px mobile range

### Known Limitations
- **Very Small Screens**: <320px width may require further optimization
- **Landscape Orientation**: Fullscreen mode optimized for portrait
- **Touch Precision**: Very small buttons may be challenging on tiny screens

## Related Files
- `src/components/MobileChordBuilder.tsx` - Main component implementation
- `src/styles/fretboard-custom.css` - Mobile fretboard styling
- `src/services/chordsDbService.ts` - Chord data and position calculations
