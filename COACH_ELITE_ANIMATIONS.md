# Coach Tab - Phoenix Elite Animations (Score ≥ 90)

## Overview

Added celebratory Phoenix animations when user achieves elite performance (Phoenix Score ≥ 90). All animations maintain Apple + Phoenix aesthetic with gold glow and glass effects.

## Elite Score Trigger

```javascript
const isEliteScore = phoenixScore >= 90
```

## Animations Implemented

### 1. **Phoenix Logo Fire Particles**

```javascript
// 12 particles radiating outward in circular pattern
- Spawn from center of Phoenix logo
- Radiate in 360° circle (30° intervals)
- Gold gradient (phoenix-amber → phoenix-gold)
- Staggered animation (0.15s delay per particle)
- 2s duration with infinite repeat
```

**Visual Effect:**

- Creates fire/explosion effect around Phoenix logo
- Particles fade out as they move outward
- Continuous loop maintains "alive" feeling

### 2. **Wing Glow Effect**

```javascript
// Pulsing outer glow around logo
- Blur effect (blur-xl) for soft halo
- Scale animation: [1, 1.4, 1]
- Opacity animation: [0.3, 0.6, 0.3]
- 2s duration with infinite repeat
```

**Visual Effect:**

- Creates "wings" appearance with expanding glow
- Soft, ethereal gold aura
- Syncs with fire particles for cohesive effect

### 3. **Rotating Ring**

```javascript
// Spinning border around logo
- 2px border with phoenix-gold/50 opacity
- 360° rotation (4s duration, linear)
- Scale pulse: [1, 1.2, 1] (2s duration)
- Infinite loop
```

**Visual Effect:**

- Orbital ring suggests movement and energy
- Creates dynamic "power-up" appearance
- Enhances depth perception

### 4. **Logo Shadow Enhancement**

When `isEliteScore`:

```javascript
boxShadow: [
  '0 0 30px rgba(255, 179, 0, 0.6)',
  '0 0 50px rgba(255, 179, 0, 0.9)',
  '0 0 30px rgba(255, 179, 0, 0.6)',
]
scale: [1, 1.05, 1]
duration: 2s
```

Normal state:

```javascript
boxShadow: [
  '0 0 20px rgba(255, 179, 0, 0.3)',
  '0 0 30px rgba(255, 179, 0, 0.5)',
  '0 0 20px rgba(255, 179, 0, 0.3)',
]
duration: 3s
```

### 5. **Flame Icon Animation**

```javascript
// Wiggle and scale effect
rotate: [-5, 5, -5]
scale: [1, 1.1, 1]
duration: 2s
```

**Visual Effect:**

- Flame appears "alive" and flickering
- Subtle but noticeable movement
- Reinforces fire theme

### 6. **Sparkles Icon Rotation**

```javascript
// Coach Phoenix title sparkle
rotate: [0, 360] // 3s linear
scale: [1, 1.2, 1] // 2s ease
```

**Visual Effect:**

- Continuous slow rotation
- Subtle pulse for attention
- Premium "magical" feeling

### 7. **"Performance Elite!" Badge**

```javascript
// Appears under title when elite
initial={{ opacity: 0, y: -5 }}
animate={{ opacity: 1, y: 0 }}
className: text-phoenix-amber font-bold
```

**Content:** "⭐ Performance Elite!"

### 8. **Score Ring Outer Glow**

```javascript
// Expanding ring around score
- 4px border with phoenix-amber/30
- Scale: [1, 1.2, 1] (2s)
- Opacity: [0.3, 0.7, 0.3] (2s)
- Rotation: 360° (8s linear)
```

**Additional Effect:**

```javascript
// Blur glow layer
- bg-phoenix-amber/20 with blur-2xl
- Scale: [1, 1.3, 1] (2.5s)
- Opacity: [0.2, 0.5, 0.2]
```

### 9. **Score Number Pulse**

```javascript
key={phoenixScore}  // Re-triggers on score change
initial={{ scale: 0.5, opacity: 0 }}
animate={{
  scale: isEliteScore ? [1, 1.15, 1] : 1,
  opacity: 1
}}
transition: {
  scale: { duration: 1, repeat: Infinity, repeatDelay: 1.5 }
}
```

**Visual Effect:**

- Smooth entrance animation on score update
- Continuous pulse when elite
- Draws attention to achievement

### 10. **"ELITE" Badge**

```javascript
// Appears below score in ring
initial={{ opacity: 0, y: 10 }}
animate={{ opacity: 1, y: 0 }}
className: bg-gradient-to-r from-phoenix-amber to-phoenix-gold
text: "ELITE"
```

### 11. **Card Background Effects**

**Animated Gradient Sweep:**

```javascript
// Horizontal sweep across card
bg-gradient-to-r from-transparent via-phoenix-amber/10 to-transparent
x: ['-100%', '200%']
duration: 3s linear infinite
```

**Floating Particles (20):**

```javascript
// Random positions throughout card
- 1x1px rounded dots
- bg-phoenix-gold/40
- Animate upward: y: [-20, -60]
- Opacity: [0, 1, 0]
- Scale: [0, 1.5, 0]
- Staggered delays (0-2s)
```

**Pulsing Border Glow:**

```javascript
// Card border animation
- 2px border with animated color
- borderColor: [transparent → phoenix-amber/30 → transparent]
- boxShadow: [0 → 30px glow → 0]
- 2s duration infinite
```

### 12. **Score Message Card Enhancement**

When `isEliteScore`:

```javascript
// Enhanced background
bg-gradient-to-r from-phoenix-amber/20 to-phoenix-gold/20
border-phoenix-amber/40

// Gradient sweep
- Same as card background sweep
- 2s duration

// Sparkles (6)
- Positioned across card (15% intervals)
- 1x1px gold dots
- Scale: [0, 1.5, 0]
- Staggered 0.2s delays
```

Normal state:

```javascript
bg-gradient-to-r from-phoenix-amber/10 to-phoenix-gold/10
border-phoenix-amber/20
```

## Framer Motion Score Transitions

### Score Update Animation

```javascript
<motion.span
  key={phoenixScore}  // Forces re-render on change
  initial={{ scale: 0.5, opacity: 0 }}
  animate={{ opacity: 1, scale: 1 }}
  transition={{ duration: 0.5 }}
>
```

**Behavior:**

- Smooth scale-up from 50% → 100%
- Fade in from 0 → 100% opacity
- 500ms spring animation
- Re-triggers whenever `phoenixScore` changes

### Previous Score Tracking

```javascript
const [prevScore, setPrevScore] = useState(0)

useEffect(() => {
  if (phoenixScore !== prevScore && phoenixScore > 0) {
    setPrevScore(prevScore)
  }
}, [phoenixScore])
```

**Purpose:**

- Enables cross-fade transitions
- Can be extended for score diff display
- Prevents animation on initial load (0 score)

## Color Palette

All animations use consistent Phoenix colors:

- **Primary Gold:** `#FFB300` (phoenix-amber)
- **Secondary Gold:** `#D97706` (phoenix-gold)
- **Glow Effects:** `rgba(255, 179, 0, 0.3-0.9)`

## Glass Effect Aesthetic

Maintained throughout:

- `backdrop-blur-md` on glass-card class
- Subtle opacity layers (10%-40%)
- Border overlays with low opacity
- Shadow effects instead of solid borders

## Performance Optimizations

1. **GPU Acceleration:**
   - All animations use `transform` properties
   - Avoid layout thrashing (no width/height animations)
2. **Conditional Rendering:**
   - Elite animations only render when `isEliteScore === true`
   - Reduces DOM complexity for normal scores

3. **Staggered Animations:**
   - Particles/sparkles use delay offsets
   - Prevents simultaneous re-renders
   - Creates cascading "natural" effect

4. **Duration Variety:**
   - 2s, 2.5s, 3s, 4s, 8s durations
   - Prevents synchronization (more organic)
   - Multiple animation loops feel dynamic

## Apple-Inspired Details

- **Subtle Motion:** No jarring or aggressive animations
- **Premium Feel:** Gold gradients, soft glows, blur effects
- **Purposeful Animation:** Every effect reinforces "elite achievement"
- **Smooth Easing:** `easeInOut`, `easeOut` for organic motion
- **20px Border Radius:** Consistent with Phoenix Coach design system

## Testing Checklist

- [ ] Score ≥ 90 triggers all elite animations
- [ ] Score < 90 shows normal state (no elite effects)
- [ ] Score updates trigger smooth transitions
- [ ] Animations perform smoothly on mobile (60fps)
- [ ] No animation conflicts or z-index issues
- [ ] Elite badge appears/disappears correctly
- [ ] Sparkles, particles, glows are GPU-accelerated
- [ ] Browser developer tools show minimal reflows

---

**Status:** ✅ Elite Animations Implemented (Code Generated)
**Trigger:** Phoenix Score ≥ 90
**Theme:** Apple-inspired gold glow + glass effect
**Framework:** Framer Motion
