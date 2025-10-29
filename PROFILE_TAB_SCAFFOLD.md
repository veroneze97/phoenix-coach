# Profile Tab - UI Scaffold Documentation

## Overview

The Profile tab provides a comprehensive user settings interface with personal information management, daily target configuration, and third-party app integrations. Built with Apple + Phoenix aesthetic (glass effects, gold accents, 20px border radius).

## Component Structure

### ProfileTab.js

Static UI scaffold with the following sections:

1. **Profile Header Card**
2. **Personal Information**
3. **Daily Targets**
4. **Integrations**
5. **Additional Settings**
6. **App Info Footer**

---

## Section Details

### 1. Profile Header Card

**Features:**

- Large circular avatar with user initial
- Gradient background (phoenix-amber → phoenix-gold)
- Edit button overlay (bottom-right corner)
- User name and email display
- Quick stats row:
  - Age (with Calendar icon)
  - Height in cm (with Ruler icon)
  - Weight in kg (with Weight icon)
- Action buttons:
  - "Editar Perfil" (Settings icon)
  - "Sair" (LogOut icon, red accent)

**Animations:**

- Card fade-in from top (y: -20 → 0)
- Avatar hover scale (1 → 1.05)
- Edit button hover scale (1 → 1.1)
- Background gradient overlay

**Static Data:**

```javascript
{
  name: 'Atleta Phoenix',
  email: 'atleta@phoenix.com',
  age: 28,
  height: 175,
  weight: 75,
  goals: ['muscle_gain', 'endurance']
}
```

---

### 2. Personal Information Card

**Features:**

- Form fields (currently read-only):
  - Nome Completo
  - Idade (number input)
  - Altura (cm)
  - Peso (kg)
- Goals selector:
  - 5 goal options with emoji icons
  - Badge style (selected = gold gradient)
  - Multi-select capability (static)

**Goal Options:**

- ⚖️ Perda de Peso (weight_loss)
- 💪 Ganho de Massa (muscle_gain)
- 🏃 Resistência (endurance)
- 🧘 Flexibilidade (flexibility)
- ❤️ Saúde Geral (health)

**Animations:**

- Card fade-in with delay (0.1s)
- Goal badges hover scale (1.05)
- Goal badges tap scale (0.95)

**Styling:**

- Glass card with standard border
- Input fields with secondary background
- Selected goals have gold gradient background
- Unselected goals have outline style

---

### 3. Daily Targets Card

**Features:**

- Three target columns (responsive grid):

  **Calories Target:**
  - Icon: Utensils (orange)
  - Large centered input (2xl text)
  - Unit label: "kcal"
  - Reference scale: 1500 - 2500 - 3500

  **Steps Target:**
  - Icon: Footprints (blue)
  - Large centered input
  - Unit label: "passos"
  - Reference scale: 5k - 10k - 15k

  **Sleep Target:**
  - Icon: Moon (purple)
  - Large centered input
  - Unit label: "horas"
  - Reference scale: 6h - 8h - 10h

- "Salvar Metas" button (full-width, disabled)
  - Gold gradient background
  - Save icon

**Static Targets:**

```javascript
{
  calories: 2500,
  steps: 10000,
  sleep: 8
}
```

**Animations:**

- Card fade-in with delay (0.2s)

**Styling:**

- Icon containers with colored backgrounds
- Large input fields (h-16, 2xl font)
- Reference scales in muted text
- Color-coded per metric (orange, blue, purple)

---

### 4. Integrations Card

**Features:**
Three integration cards (3-column grid):

**Strava:**

- Icon: 🏃
- Color: Orange
- Status: Desconectado
- Description: "Sincronize suas corridas e treinos"
- Button: "Conectar" (gold gradient)

**Google Fit:**

- Icon: 💚
- Color: Green
- Status: Desconectado
- Description: "Importe dados de saúde e atividades"
- Button: "Conectar" (gold gradient)

**iOS Shortcuts:**

- Icon: 📱
- Color: Blue
- Status: Conectado ✓
- Description: "Automatize com Apple Health"
- Button: "Gerenciar" (outline style)

**Badge Styling:**

- Connected: Green badge with CheckCircle icon
- Disconnected: Outline badge (dashed) with Circle icon

**Animations:**

- Card fade-in with delay (0.3s)
- Integration cards staggered entrance (0.1s intervals)
- Cards hover shadow effect

**Styling:**

- Glass cards with colored borders (2px)
- Large emoji icons in colored containers
- Status badges in top-right
- Color-coded per integration
- CTA buttons change based on connection status

---

### 5. Additional Settings Card

**Features:**

- List of setting options (ghost buttons):
  - Preferências de Notificação
  - Privacidade e Dados
  - Unidades de Medida
  - Idioma
  - Excluir Conta (red text)

**Animations:**

- Card fade-in with delay (0.6s)

**Styling:**

- Ghost button style (left-aligned)
- Red accent for destructive action
- Hover effects on all buttons

---

### 6. App Info Footer

**Features:**

- Version number: "Phoenix Coach v1.0.0"
- Footer links (separated by bullets):
  - Termos de Uso
  - Política de Privacidade
  - Suporte

**Animations:**

- Card fade-in with delay (0.7s)

**Styling:**

- Dashed border card
- Center-aligned text
- Muted foreground colors
- Link hover → phoenix-amber transition

---

## Design System Compliance

### Apple + Phoenix Aesthetic

**Glass Effect:**

- `glass-card` class on all major cards
- Backdrop blur and transparency
- Subtle gradient overlays

**Gold Accents:**

- Primary: `#FFB300` (phoenix-amber)
- Secondary: `#D97706` (phoenix-gold)
- Used for:
  - Gradients (avatar, buttons, selected badges)
  - Icon highlights
  - Interactive element accents

**Border Radius:**

- 20px on cards (via glass-card class)
- Rounded-full on avatar and buttons
- Rounded-lg on inputs and badges

**Shadows:**

- Soft shadows on elevated elements
- Hover shadow enhancement on cards
- Gold glow on interactive elements

### Color Palette

**Integration Colors:**

- Orange: Strava, Calories
- Green: Google Fit
- Blue: iOS Shortcuts, Steps
- Purple: Sleep

**Semantic Colors:**

- Success: Green (connected status)
- Danger: Red (destructive actions)
- Muted: Gray tones for secondary text

---

## Framer Motion Animations

### Entrance Animations

**Stagger Pattern:**

```javascript
delay: 0.0s - Profile Header
delay: 0.1s - Personal Info
delay: 0.2s - Daily Targets
delay: 0.3s - Integrations
delay: 0.6s - Settings
delay: 0.7s - App Info
```

**Standard Entrance:**

```javascript
initial={{ opacity: 0, y: 20 }}
animate={{ opacity: 1, y: 0 }}
transition={{ duration: 0.5 }}
```

**Header Variation:**

```javascript
initial={{ opacity: 0, y: -20 }}
animate={{ opacity: 1, y: 0 }}
```

### Interactive Animations

**Avatar Edit Button:**

```javascript
whileHover={{ scale: 1.1 }}
whileTap={{ scale: 0.95 }}
```

**Goal Badges:**

```javascript
whileHover={{ scale: 1.05 }}
whileTap={{ scale: 0.95 }}
```

---

## Static Data Structure

### User Object

```javascript
{
  name: string,
  email: string,
  age: number,
  height: number (cm),
  weight: number (kg),
  goals: string[] (goal IDs)
}
```

### Targets Object

```javascript
{
  calories: number,
  steps: number,
  sleep: number (hours)
}
```

### Integration Object

```javascript
{
  id: string,
  name: string,
  description: string,
  icon: string (emoji),
  connected: boolean,
  color: string (Tailwind class),
  bgColor: string (Tailwind class),
  borderColor: string (Tailwind class)
}
```

---

## Future Backend Integration

When connecting to Supabase:

1. **User Data:**
   - Fetch from `users` table
   - Enable edit mode for personal info fields
   - Implement profile picture upload

2. **Daily Targets:**
   - Store in user profile or separate `user_targets` table
   - Add slider inputs for adjusting values
   - Implement save functionality

3. **Integrations:**
   - OAuth flows for Strava, Google Fit
   - Store connection status in `user_integrations` table
   - Webhook endpoints for data sync
   - iOS Shortcut setup guide modal

4. **Settings:**
   - Implement each setting option
   - Create dedicated settings pages
   - Add notification preferences UI

---

## Responsive Design

**Breakpoints:**

- Mobile: Single column layout
- Tablet/Desktop: Grid layouts
  - Personal Info: 2 columns
  - Daily Targets: 3 columns
  - Integrations: 3 columns

**Mobile Optimizations:**

- Stack avatar and info vertically
- Hide action buttons or move to menu
- Simplify quick stats layout

---

## Accessibility

- Proper label associations
- Icon + text for all actions
- Keyboard navigation support
- Color contrast compliance
- Screen reader friendly structure

---

## Files Created

- `/app/components/ProfileTab.js` - Main profile component
- `/app/PROFILE_TAB_SCAFFOLD.md` - This documentation

## Status

✅ Static UI Scaffold Complete
🔄 Backend Integration Pending
🔄 Real Data Connection Pending
🔄 Form Validation Pending
🔄 OAuth Flows Pending

---

**Design Philosophy:** Premium, minimalist, user-focused interface that balances functionality with aesthetic appeal. Every element serves a purpose while maintaining the Phoenix Coach brand identity.
