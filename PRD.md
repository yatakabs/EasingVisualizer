# Planning Guide

A visual comparison tool for easing functions (Easing Visualizer) that displays multiple animated panels side-by-side, each demonstrating different mathematical easing functions for camera movements, animations, and value interpolation. Designed for Beat Saber modding and general animation workflows.

**Experience Qualities**:
1. **Technical** - Precise visualization of mathematical easing functions applied to camera movements and animations with clear labeling
2. **Educational** - Easy to understand differences between various easing functions through simultaneous animation and 3D camera preview
3. **Smooth** - Fluid animations that accurately represent real-world motion and interpolation curves

**Complexity Level**: Light Application (multiple features with basic state)
This app displays multiple animated panels with play/pause controls and function selection. It maintains simple state for animation timing and user preferences but doesn't require complex data management or multiple views.

## Essential Features

**Animated Preview Panels**
- Functionality: Display multiple preview panels with 4 visualization types: Glow (光度プレビュー), Graph (2Dグラフ), Camera (3Dカメラビュー), and Value (数値表示)
- Purpose: Provide visual comparison of different easing functions through multiple representation modes
- Trigger: Auto-starts on page load
- Progression: Page loads → Panels display in grid → All animate simultaneously → Loop continuously
- Success criteria: Smooth 60fps animation with synchronized timing across all panels

**Function Comparison**
- Functionality: Support 16 easing functions (Linear, Sine, Quadratic, Cubic, Quartic, Quintic, Exponential, Circular, Square Root, Back, Elastic, Bounce, Hermite, Bezier, Parabolic, Trigonometric) with built-in easing transformations (EaseIn, EaseOut, EaseBoth) that can be selected per panel
- Purpose: Demonstrate how different mathematical functions and easing transformations affect motion curves for camera and animation control
- Trigger: Panels display preset functions with EaseIn on load; users can toggle between easing types for each panel
- Progression: User views panels → Observes motion patterns → Toggles easing type on individual panels → Compares different easing behaviors for same base function
- Success criteria: Each function produces visually distinct motion patterns; easing toggles update visualization immediately; all three easing types (EaseIn, EaseOut, EaseBoth) work correctly for every function

**Playback Controls**
- Functionality: Play/pause all animations and adjust animation speed
- Purpose: Allow users to study specific moments in the animation cycle
- Trigger: Click play/pause button or speed slider
- Progression: User clicks control → All animations pause/resume → User adjusts speed → Animation rate changes
- Success criteria: Immediate response to controls affecting all panels simultaneously

**Function Customization**
- Functionality: Add/remove panels with different functions; each panel has its own easing type selector (EaseIn, EaseOut, EaseBoth) to control how the function is applied; drag-and-drop panel reordering
- Purpose: Let users create custom comparisons and observe how easing transformations affect each mathematical function independently
- Trigger: Click add/remove buttons or easing toggle buttons on each panel
- Progression: User clicks add → Dialog appears → Selects function → New panel appears with EaseIn default; OR User clicks easing toggle on existing panel → Output visualization updates to show new easing behavior
- Success criteria: Panels can be added up to 24, removed individually; easing can be changed per panel; each easing type correctly transforms the base mathematical function (EaseIn = direct function, EaseOut = inverted function, EaseBoth = symmetric combination)

**Camera 3D Preview**
- Functionality: Visualize easing functions as camera movement in 3D space with configurable start/end positions (x, y, z coordinates)
- Purpose: Show how easing functions translate to actual camera motion for Beat Saber and animation workflows
- Trigger: Enable camera preview in panel settings
- Progression: User enables camera preview → 3D viewport shows camera position animating along the easing curve → Coordinate system can be toggled (left/right-handed)
- Success criteria: Camera position accurately reflects easing function output; aspect ratio configurable (16:9, etc.); smooth 60fps rendering

**Input Modes**
- Functionality: Support 6 input wave types (Triangle, Linear, Sawtooth, Sine, Square, Ease In-Out) plus manual direct input mode (手動制御/直接入力)
- Purpose: Allow testing easing functions with different input patterns and manual control for precise evaluation
- Trigger: Select input mode from control panel
- Progression: User selects input mode → All panels use selected input wave → Manual mode allows direct value input
- Success criteria: All input modes correctly drive the easing function evaluation

**URL State Sharing**
- Functionality: Persist panel configuration, function selections, and settings in URL for sharing
- Purpose: Allow users to share specific visualizations and restore previous sessions
- Trigger: Configuration changes automatically update URL; share button copies URL
- Success criteria: URL accurately restores all panel configurations when loaded

**Output Filtering System**
- Functionality: Apply configurable filters (e.g., gamma correction) to function outputs before visualization
- Purpose: Demonstrate how post-processing transforms raw mathematical functions for real-world applications
- Trigger: Toggle filter switches in control panel
- Progression: User enables filter → All visualizations update to show filtered output → Original output shown as dotted reference line on graphs
- Success criteria: Filters apply consistently across all visualization types (LED, graph, combined); original vs filtered output clearly distinguished

## Edge Case Handling

- **No Panels**: Display helpful empty state with "Add Panel" button
- **Many Panels**: Responsive grid layout adapts from 1-4 columns based on screen size
- **Browser Performance**: Limit maximum panels to 24 to maintain smooth animation
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
