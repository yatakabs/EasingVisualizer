# Mobile Support

EasingVisualizer is fully responsive and works on mobile devices with touch-optimized controls.

## Mobile-Optimized Layout

On smaller screens, the interface adapts automatically:

- **Single-column layout** - Panels stack vertically for easy scrolling
- **Larger touch targets** - Buttons and controls are sized for finger taps
- **Collapsible sections** - Advanced settings stay hidden until needed
- **Optimized typography** - Text scales appropriately for readability

## Touch Controls

### Gestures

| Gesture | Action |
|---------|--------|
| Tap | Select panel, toggle controls |
| Swipe | Scroll through panels |
| Pinch (graph preview) | Zoom in/out on graph |

### Panel Interaction

- Tap a panel to see its details
- Use the panel menu (⋮) for actions
- Long-press for additional options on supported devices

## Mobile Control Sheet

On mobile devices, the control panel transforms into a **bottom sheet**:

1. **Collapsed state** - Shows minimal controls at bottom of screen
2. **Expanded state** - Pull up to reveal full settings
3. **Quick access** - Speed slider always visible

### Opening the Control Sheet

- Tap the control bar at the bottom
- Swipe up from the bottom edge
- Tap the settings icon

### Available Controls

- Speed adjustment slider
- Input function selector
- Preview type switcher
- Share button
- Advanced settings accordion

## Responsive Panel Grid

The panel grid automatically adjusts based on screen width:

| Screen Size | Columns | Notes |
|-------------|---------|-------|
| < 640px | 1 | Mobile phones |
| 640-1024px | 2 | Tablets, small laptops |
| 1024-1440px | 3-4 | Desktop |
| > 1440px | 4-6 | Large monitors |

### Portrait vs Landscape

- **Portrait**: Prioritizes vertical scrolling with full-width panels
- **Landscape**: Uses horizontal space with 2+ columns

## Performance on Mobile

The app is optimized for mobile performance:

- **60 FPS animations** - Smooth easing previews
- **Efficient rendering** - Only visible panels are animated
- **Reduced memory usage** - Three.js resources are pooled

### Tips for Best Performance

1. Close unused browser tabs
2. Use fewer panels simultaneously
3. Consider using simpler preview types (glow, value) over camera

## Browser Support

### Recommended Mobile Browsers

- Safari (iOS 14+)
- Chrome (Android 10+)
- Firefox Mobile
- Samsung Internet

### Known Limitations

- Three.js camera preview requires WebGL support
- Very old devices may experience reduced frame rates
- Some gestures may conflict with browser gestures

## Related Pages

- [[Getting-Started]]
- [[Preview-Types]]
- [[Keyboard-Shortcuts]] - Desktop-focused but useful reference
