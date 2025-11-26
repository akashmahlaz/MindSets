# 🎨 Mind Sets Design System
## Professional Design Tokens & Guidelines

### Brand Identity
- **App Name:** Mind Sets
- **Tagline:** Your trusted platform for mental wellness
- **Brand Personality:** Calming, Professional, Trustworthy, Supportive

---

## 🎨 Color Palette

### Primary Colors
```css
/* Primary Brand Color - Trust & Calm */
--primary: #4A90E2;
--primary-hover: #357ABD;
--primary-light: #E8F2FC;
--primary-dark: #2E5A8A;

/* Secondary - Growth & Healing */
--secondary: #7FB069;
--secondary-hover: #6A9654;
--secondary-light: #E8F5E3;
--secondary-dark: #5A7A4A;

/* Accent - Warmth & Support */
--accent: #F5A623;
--accent-hover: #D8941F;
--accent-light: #FEF4E6;
--accent-dark: #B8751A;
```

### Semantic Colors
```css
/* Success - Positive Actions */
--success: #27AE60;
--success-light: #D5F4E6;
--success-dark: #1E8449;

/* Error - Alerts */
--error: #E74C3C;
--error-light: #FADBD8;
--error-dark: #C0392B;

/* Warning - Attention */
--warning: #F39C12;
--warning-light: #FEF5E7;
--warning-dark: #D68910;

/* Info - Information */
--info: #3498DB;
--info-light: #EBF5FB;
--info-dark: #2874A6;
```

### Neutral Colors (Light Mode)
```css
--background: #F8F9FA;
--surface: #FFFFFF;
--surface-elevated: #FFFFFF;
--border: #E5E7EB;
--divider: #E5E7EB;

--text-primary: #1F2937;
--text-secondary: #6B7280;
--text-tertiary: #9CA3AF;
--text-disabled: #D1D5DB;
```

### Neutral Colors (Dark Mode)
```css
--background: #141820;
--surface: #1C2128;
--surface-elevated: #252B35;
--border: #2D3441;
--divider: #2D3441;

--text-primary: #F3F4F6;
--text-secondary: #9CA3AF;
--text-tertiary: #6B7280;
--text-disabled: #4B5563;
```

---

## 📝 Typography

### Font Family
- **Primary:** System default (San Francisco on iOS, Roboto on Android)
- **Monospace:** System monospace (for code/technical content)

### Type Scale
```css
/* Headings */
--font-h1: 32px / 40px (Bold, -0.5px letter-spacing)
--font-h2: 24px / 32px (Semibold, -0.3px letter-spacing)
--font-h3: 20px / 28px (Semibold, -0.2px letter-spacing)
--font-h4: 18px / 24px (Semibold)

/* Body */
--font-body-large: 18px / 28px (Regular)
--font-body: 16px / 24px (Regular)
--font-body-small: 14px / 20px (Regular)

/* Labels & Captions */
--font-label: 14px / 20px (Medium)
--font-caption: 12px / 16px (Regular)
--font-caption-small: 11px / 14px (Regular)
```

### Usage Guidelines
- **H1:** Screen titles, major headings (use sparingly)
- **H2:** Section headers, card titles
- **H3:** Subsection headers
- **Body:** Main content, descriptions
- **Caption:** Metadata, timestamps, helper text

---

## 📏 Spacing Scale

Based on 4px grid system:
```css
--space-xs: 4px;    /* Tight spacing */
--space-sm: 8px;    /* Small spacing */
--space-md: 16px;   /* Default spacing */
--space-lg: 24px;   /* Large spacing */
--space-xl: 32px;   /* Extra large spacing */
--space-2xl: 48px;  /* Section spacing */
--space-3xl: 64px;  /* Page spacing */
```

### Usage
- **xs:** Between related elements (icon + text)
- **sm:** Between form fields, list items
- **md:** Default padding, margins
- **lg:** Between sections, card padding
- **xl:** Between major sections
- **2xl/3xl:** Page-level spacing

---

## 🔲 Border Radius

```css
--radius-sm: 4px;   /* Small elements, badges */
--radius-md: 8px;   /* Buttons, inputs */
--radius-lg: 12px;  /* Cards, modals */
--radius-xl: 16px;  /* Large cards */
--radius-full: 9999px; /* Pills, avatars */
```

---

## 📦 Component Specifications

### Buttons

#### Primary Button
```css
Height: 48px
Padding: 0 24px
Border Radius: 12px
Font: 16px Medium
Background: --primary
Text Color: White
Shadow: 0 2px 8px rgba(74, 144, 226, 0.2)
```

#### Secondary Button
```css
Height: 48px
Padding: 0 24px
Border Radius: 12px
Font: 16px Medium
Background: Transparent
Border: 2px solid --primary
Text Color: --primary
```

#### Text Button
```css
Height: 44px
Padding: 0 16px
Font: 16px Medium
Background: Transparent
Text Color: --primary
```

### Cards

#### Standard Card
```css
Background: --surface
Border: 1px solid --border
Border Radius: 12px
Padding: 16px
Shadow: 0 1px 3px rgba(0, 0, 0, 0.1)
```

#### Elevated Card
```css
Background: --surface-elevated
Border: 1px solid --border
Border Radius: 16px
Padding: 24px
Shadow: 0 4px 12px rgba(0, 0, 0, 0.15)
```

### Inputs

#### Text Input
```css
Height: 48px
Padding: 0 16px
Border: 1px solid --border
Border Radius: 12px
Font: 16px Regular
Background: --surface
Focus Border: 2px solid --primary
```

### Avatars

#### Sizes
```css
--avatar-xs: 24px
--avatar-sm: 32px
--avatar-md: 40px
--avatar-lg: 56px
--avatar-xl: 80px
```

---

## 🎯 Icon Guidelines

### Sizes
```css
--icon-xs: 16px
--icon-sm: 20px
--icon-md: 24px
--icon-lg: 32px
--icon-xl: 48px
```

### Usage
- **xs:** Inline with small text
- **sm:** In buttons, form fields
- **md:** Default size, list items
- **lg:** Section headers, feature icons
- **xl:** Empty states, hero sections

### Stroke Width
- **Default:** 1.5px
- **Bold:** 2px (for emphasis)

---

## 🌓 Dark Mode Guidelines

### Principles
1. **Never use pure black (#000000)** - Use `#141820` instead
2. **Maintain contrast ratios** - WCAG AA minimum
3. **Adapt all colors** - Don't use hard-coded colors
4. **Test both modes** - Every screen in both themes

### Color Adaptation
- Light backgrounds → Dark surfaces
- Dark text → Light text
- Adjust opacity for borders/dividers
- Use subtle shadows in dark mode

---

## ♿ Accessibility Standards

### Contrast Ratios (WCAG AA)
- **Normal text:** 4.5:1 minimum
- **Large text (18px+):** 3:1 minimum
- **UI components:** 3:1 minimum

### Touch Targets
- **Minimum size:** 44x44px
- **Recommended:** 48x48px
- **Spacing between:** 8px minimum

### Focus States
- **Visible outline:** 2px solid --primary
- **Offset:** 2px from element
- **High contrast:** Always visible

---

## 🎬 Animation Guidelines

### Duration
```css
--duration-fast: 150ms    /* Micro-interactions */
--duration-normal: 250ms  /* Default transitions */
--duration-slow: 350ms    /* Page transitions */
```

### Easing
```css
--ease-in: cubic-bezier(0.4, 0, 1, 1)
--ease-out: cubic-bezier(0, 0, 0.2, 1)
--ease-in-out: cubic-bezier(0.4, 0, 0.2, 1)
```

### Usage
- **Hover states:** 150ms ease-out
- **Page transitions:** 250ms ease-in-out
- **Modal animations:** 350ms ease-out
- **Loading states:** 500ms ease-in-out (loop)

---

## 📱 Layout Guidelines

### Screen Padding
```css
--screen-padding: 16px (mobile)
--screen-padding-tablet: 24px
--screen-padding-desktop: 32px
```

### Content Width
```css
--content-max-width: 1200px
--content-padding: 24px
```

### Grid System
- **Mobile:** Single column
- **Tablet:** 2 columns
- **Desktop:** 3-4 columns

---

## 🎨 Visual Hierarchy

### Z-Index Scale
```css
--z-base: 0
--z-dropdown: 1000
--z-sticky: 1020
--z-fixed: 1030
--z-modal-backdrop: 1040
--z-modal: 1050
--z-popover: 1060
--z-tooltip: 1070
```

### Elevation (Shadows)
```css
--elevation-1: 0 1px 3px rgba(0, 0, 0, 0.1)
--elevation-2: 0 2px 8px rgba(0, 0, 0, 0.12)
--elevation-3: 0 4px 12px rgba(0, 0, 0, 0.15)
--elevation-4: 0 8px 24px rgba(0, 0, 0, 0.18)
```

---

## ✅ Implementation Checklist

- [ ] Replace all hard-coded colors with design tokens
- [ ] Implement consistent spacing scale
- [ ] Standardize typography across all screens
- [ ] Create reusable component library
- [ ] Test all components in light and dark mode
- [ ] Ensure WCAG AA compliance
- [ ] Add proper focus states
- [ ] Implement consistent animations
- [ ] Create style guide documentation
- [ ] Train team on design system usage

---

**Last Updated:** 2024  
**Version:** 1.0  
**Status:** Ready for Implementation

