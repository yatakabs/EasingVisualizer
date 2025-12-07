# Planning Guide

A visual comparison tool for LED brightness control (Lチカ) that displays multiple animated panels side-by-side, each demonstrating different time-output functions for PWM brightness modulation.

**Experience Qualities**:
1. **Technical** - Precise visualization of mathematical functions applied to LED brightness control with clear labeling
2. **Educational** - Easy to understand differences between various control functions through simultaneous animation
3. **Smooth** - Fluid animations that accurately represent real-world LED brightness transitions

**Complexity Level**: Light Application (multiple features with basic state)
This app displays multiple animated panels with play/pause controls and function selection. It maintains simple state for animation timing and user preferences but doesn't require complex data management or multiple views.

## Essential Features

**Animated LED Panels**
- Functionality: Display multiple LED-like circular panels that animate brightness according to mathematical functions
- Purpose: Provide visual comparison of different brightness control algorithms
- Trigger: Auto-starts on page load
- Progression: Page loads → Panels display in grid → All animate simultaneously → Loop continuously
- Success criteria: Smooth 60fps animation with synchronized timing across all panels

**Function Comparison**
- Functionality: Support multiple bidirectional time-output functions (Linear, Sine, Exponential, Quadratic, Pulse Width) that cycle 0→1→0
- Purpose: Demonstrate how different mathematical approaches affect perceived brightness in round-trip cycles
- Trigger: Panels display preset functions on load
- Progression: User views panels → Observes brightness patterns → Understands function differences
- Success criteria: Each function produces visually distinct bidirectional brightness patterns

**Playback Controls**
- Functionality: Play/pause all animations and adjust animation speed
- Purpose: Allow users to study specific moments in the animation cycle
- Trigger: Click play/pause button or speed slider
- Progression: User clicks control → All animations pause/resume → User adjusts speed → Animation rate changes
- Success criteria: Immediate response to controls affecting all panels simultaneously

**Function Customization**
- Functionality: Add/remove panels with different functions
- Purpose: Let users create custom comparisons
- Trigger: Click add/remove buttons
- Progression: User clicks add → Dialog appears → Selects function → New panel appears
- Success criteria: Panels can be added up to 12, removed individually

## Edge Case Handling

- **No Panels**: Display helpful empty state with "Add Panel" button
- **Many Panels**: Responsive grid layout adapts from 1-4 columns based on screen size
- **Browser Performance**: Limit maximum panels to 12 to maintain smooth animation
- **Reduced Motion**: Respect prefers-reduced-motion by slowing or pausing animations

## Design Direction

The design should evoke a technical laboratory aesthetic - clean, precise, and scientific. Think oscilloscope displays and electronic engineering tools. The interface should feel like professional measurement equipment with clear data visualization.

## Color Selection

A dark technical theme with bright accent colors for the LED panels.

- **Primary Color**: Deep Navy `oklch(0.2 0.05 250)` - Communicates technical precision and depth
- **Secondary Colors**: Slate Gray `oklch(0.35 0.02 250)` for panels and cards - Creates depth separation
- **Accent Color**: Electric Cyan `oklch(0.75 0.15 200)` - High-tech LED glow effect for active elements
- **Foreground/Background Pairings**: 
  - Background (Deep Navy #1a1d3a): Light Cyan text `oklch(0.95 0.02 200)` - Ratio 11.2:1 ✓
  - Secondary (Slate): White text `oklch(0.98 0 0)` - Ratio 9.8:1 ✓
  - Accent (Electric Cyan): Dark Navy text `oklch(0.15 0.05 250)` - Ratio 8.5:1 ✓

## Font Selection

The typeface should convey technical precision and readability in a scientific context, using JetBrains Mono for code/data and Space Grotesk for UI labels.

- **Typographic Hierarchy**:
  - H1 (Page Title): Space Grotesk Bold/32px/tight letter spacing/-0.02em
  - H2 (Panel Function Name): Space Grotesk SemiBold/18px/normal
  - Body (Controls/Labels): Space Grotesk Regular/14px/normal
  - Code (Function Formulas): JetBrains Mono Regular/13px/0.05em letter spacing

## Animations

Animations should be smooth and purposeful - the LED brightness transitions are the star. Use 60fps requestAnimationFrame for LED pulsing. Control interactions should have subtle 200ms transitions. The overall feel should be like watching precise instrumentation with fluid but technical motion.

## Component Selection

- **Components**:
  - Card: Frame each LED panel with function name and formula display
  - Button: Play/pause controls and add/remove panel actions
  - Slider: Animation speed control
  - Dialog: Function selection when adding new panels
  - Badge: Display current animation state and FPS counter
  - ScrollArea: For function formula displays if they're long
  
- **Customizations**:
  - LED Panel: Custom SVG-based circular gradient elements with radial glow effects
  - Function Graph: Custom canvas or SVG mini-graph showing the time-output curve
  - Animation Engine: Custom requestAnimationFrame loop with time-based interpolation
  
- **States**:
  - Buttons: Hover shows electric cyan glow, active state slightly depresses, disabled is muted
  - LED panels: Brightness varies smoothly based on function, inactive panels are dimmed
  - Cards: Subtle hover lift effect to indicate interactivity
  
- **Icon Selection**:
  - Play/Pause: Standard phosphor icons
  - Plus/Minus: For adding/removing panels
  - Lightning: To indicate PWM/electrical theme
  - Function: Mathematical function icon for dialog
  
- **Spacing**:
  - Grid gap: 6 (1.5rem) between LED panel cards
  - Card padding: 6 for content area
  - Control bar padding: 4
  - Consistent 4-unit spacing between related controls
  
- **Mobile**:
  - Single column grid on mobile (<640px)
  - Two columns on tablet (640-1024px)
  - Three columns on desktop (1024-1536px)
  - Four columns on large desktop (>1536px)
  - Controls stack vertically on mobile
  - Touch-friendly 44px minimum hit targets for all buttons
