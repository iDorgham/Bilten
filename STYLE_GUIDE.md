# Bilten UI/UX Style Guide

## Table of Contents
1. [Design Philosophy](#design-philosophy)
2. [Color System](#color-system)
3. [Typography](#typography)
4. [Spacing & Layout](#spacing--layout)
5. [Frontend Style Guide](#frontend-style-guide)
6. [Admin Dashboard Style Guide](#admin-dashboard-style-guide)
7. [Component Library](#component-library)
8. [Accessibility Guidelines](#accessibility-guidelines)
9. [Responsive Design](#responsive-design)
10. [Animation & Transitions](#animation--transitions)

---

## Design Philosophy

### Core Principles
- **Modern & Clean:** Minimalist design with clear visual hierarchy
- **Accessible:** WCAG 2.1 AA compliance for all users
- **Consistent:** Unified design language across all interfaces
- **Responsive:** Mobile-first approach with seamless scaling
- **Professional:** Trustworthy and reliable appearance

### Brand Identity
- **Primary:** Event management platform for professionals
- **Secondary:** User-friendly interface for attendees
- **Tertiary:** Comprehensive admin tools for organizers

---

## Color System

### Primary Colors
```css
/* Light Mode */
--primary-50: #eff6ff;
--primary-100: #dbeafe;
--primary-200: #bfdbfe;
--primary-300: #93c5fd;
--primary-400: #60a5fa;
--primary-500: #3b82f6;  /* Main Brand Color */
--primary-600: #2563eb;
--primary-700: #1d4ed8;
--primary-800: #1e40af;
--primary-900: #1e3a8a;

/* Dark Mode */
--primary-50: #1e3a8a;
--primary-100: #1e40af;
--primary-200: #1d4ed8;
--primary-300: #2563eb;
--primary-400: #3b82f6;
--primary-500: #60a5fa;  /* Main Brand Color */
--primary-600: #93c5fd;
--primary-700: #bfdbfe;
--primary-800: #dbeafe;
--primary-900: #eff6ff;
```

### Neutral Colors
```css
/* Light Mode */
--neutral-50: #f8fafc;
--neutral-100: #f1f5f9;
--neutral-200: #e2e8f0;
--neutral-300: #cbd5e1;
--neutral-400: #94a3b8;
--neutral-500: #64748b;
--neutral-600: #475569;
--neutral-700: #334155;
--neutral-800: #1e293b;
--neutral-900: #0f172a;

/* Dark Mode */
--neutral-50: #0f172a;
--neutral-100: #1e293b;
--neutral-200: #334155;
--neutral-300: #475569;
--neutral-400: #64748b;
--neutral-500: #94a3b8;
--neutral-600: #cbd5e1;
--neutral-700: #e2e8f0;
--neutral-800: #f1f5f9;
--neutral-900: #f8fafc;
```

### Semantic Colors
```css
/* Success */
--success-50: #f0fdf4;
--success-500: #22c55e;
--success-600: #16a34a;
--success-700: #15803d;

/* Warning */
--warning-50: #fffbeb;
--warning-500: #f59e0b;
--warning-600: #d97706;
--warning-700: #b45309;

/* Error */
--error-50: #fef2f2;
--error-500: #ef4444;
--error-600: #dc2626;
--error-700: #b91c1c;

/* Info */
--info-50: #eff6ff;
--info-500: #3b82f6;
--info-600: #2563eb;
--info-700: #1d4ed8;
```

---

## Typography

### Font Family
```css
/* Primary Font */
font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;

/* Secondary Font (for headings) */
font-family: 'Poppins', 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;

/* Monospace Font */
font-family: 'JetBrains Mono', 'Fira Code', 'Consolas', monospace;
```

### Font Sizes
```css
/* Frontend */
--text-xs: 0.75rem;    /* 12px */
--text-sm: 0.875rem;   /* 14px */
--text-base: 1rem;     /* 16px */
--text-lg: 1.125rem;   /* 18px */
--text-xl: 1.25rem;    /* 20px */
--text-2xl: 1.5rem;    /* 24px */
--text-3xl: 1.875rem;  /* 30px */
--text-4xl: 2.25rem;   /* 36px */

/* Admin Dashboard */
--text-xs: 0.75rem;    /* 12px */
--text-sm: 0.875rem;   /* 14px */
--text-base: 1rem;     /* 16px */
--text-lg: 1.125rem;   /* 18px */
--text-xl: 1.25rem;    /* 20px */
--text-2xl: 1.5rem;    /* 24px */
--text-3xl: 1.875rem;  /* 30px */
--text-4xl: 2.25rem;   /* 36px */
--text-5xl: 3rem;      /* 48px */
```

### Font Weights
```css
--font-light: 300;
--font-normal: 400;
--font-medium: 500;
--font-semibold: 600;
--font-bold: 700;
--font-extrabold: 800;
```

### Line Heights
```css
--leading-tight: 1.25;
--leading-snug: 1.375;
--leading-normal: 1.5;
--leading-relaxed: 1.625;
--leading-loose: 2;
```

---

## Spacing & Layout

### Spacing Scale
```css
--space-0: 0;
--space-1: 0.25rem;   /* 4px */
--space-2: 0.5rem;    /* 8px */
--space-3: 0.75rem;   /* 12px */
--space-4: 1rem;      /* 16px */
--space-5: 1.25rem;   /* 20px */
--space-6: 1.5rem;    /* 24px */
--space-8: 2rem;      /* 32px */
--space-10: 2.5rem;   /* 40px */
--space-12: 3rem;     /* 48px */
--space-16: 4rem;     /* 64px */
--space-20: 5rem;     /* 80px */
--space-24: 6rem;     /* 96px */
```

### Container Max Widths
```css
--container-sm: 640px;
--container-md: 768px;
--container-lg: 1024px;
--container-xl: 1280px;
--container-2xl: 1536px;
```

---

## Frontend Style Guide

### Light Mode

#### Background Colors
```css
/* Main Background */
--bg-primary: #ffffff;
--bg-secondary: #f8fafc;
--bg-tertiary: #f1f5f9;

/* Card Backgrounds */
--bg-card: #ffffff;
--bg-card-hover: #f8fafc;
--bg-card-active: #f1f5f9;

/* Overlay Backgrounds */
--bg-overlay: rgba(0, 0, 0, 0.5);
--bg-backdrop: rgba(0, 0, 0, 0.1);
```

#### Text Colors
```css
/* Primary Text */
--text-primary: #0f172a;
--text-secondary: #475569;
--text-tertiary: #64748b;
--text-muted: #94a3b8;

/* Link Text */
--text-link: #3b82f6;
--text-link-hover: #2563eb;
--text-link-active: #1d4ed8;
```

#### Input Fields
```css
/* Text Input */
--input-bg: #ffffff;
--input-border: #e2e8f0;
--input-border-focus: #3b82f6;
--input-border-error: #ef4444;
--input-text: #0f172a;
--input-placeholder: #94a3b8;
--input-shadow: 0 1px 2px 0 rgba(0, 0, 0, 0.05);
--input-shadow-focus: 0 0 0 3px rgba(59, 130, 246, 0.1);

/* Select Input */
--select-bg: #ffffff;
--select-border: #e2e8f0;
--select-border-focus: #3b82f6;
--select-text: #0f172a;
--select-arrow: #64748b;
```

#### Buttons
```css
/* Primary Button */
--btn-primary-bg: #3b82f6;
--btn-primary-bg-hover: #2563eb;
--btn-primary-bg-active: #1d4ed8;
--btn-primary-text: #ffffff;
--btn-primary-border: transparent;
--btn-primary-shadow: 0 1px 3px 0 rgba(0, 0, 0, 0.1);

/* Secondary Button */
--btn-secondary-bg: #ffffff;
--btn-secondary-bg-hover: #f8fafc;
--btn-secondary-bg-active: #f1f5f9;
--btn-secondary-text: #475569;
--btn-secondary-border: #e2e8f0;
--btn-secondary-shadow: 0 1px 2px 0 rgba(0, 0, 0, 0.05);

/* Ghost Button */
--btn-ghost-bg: transparent;
--btn-ghost-bg-hover: #f1f5f9;
--btn-ghost-bg-active: #e2e8f0;
--btn-ghost-text: #475569;
--btn-ghost-border: transparent;
```

#### Icons
```css
/* Icon Colors */
--icon-primary: #64748b;
--icon-secondary: #94a3b8;
--icon-accent: #3b82f6;
--icon-success: #22c55e;
--icon-warning: #f59e0b;
--icon-error: #ef4444;

/* Icon Sizes */
--icon-xs: 0.75rem;   /* 12px */
--icon-sm: 1rem;      /* 16px */
--icon-md: 1.25rem;   /* 20px */
--icon-lg: 1.5rem;    /* 24px */
--icon-xl: 2rem;      /* 32px */
```

#### Borders & Outlines
```css
/* Border Colors */
--border-light: #f1f5f9;
--border-base: #e2e8f0;
--border-dark: #cbd5e1;
--border-accent: #3b82f6;

/* Border Widths */
--border-0: 0;
--border-1: 1px;
--border-2: 2px;
--border-4: 4px;

/* Border Radius */
--radius-none: 0;
--radius-sm: 0.25rem;   /* 4px */
--radius-base: 0.375rem; /* 6px */
--radius-md: 0.5rem;     /* 8px */
--radius-lg: 0.75rem;    /* 12px */
--radius-xl: 1rem;       /* 16px */
--radius-2xl: 1.5rem;    /* 24px */
--radius-full: 9999px;
```

### Dark Mode

#### Background Colors
```css
/* Main Background */
--bg-primary: #0f172a;
--bg-secondary: #1e293b;
--bg-tertiary: #334155;

/* Card Backgrounds */
--bg-card: #1e293b;
--bg-card-hover: #334155;
--bg-card-active: #475569;

/* Overlay Backgrounds */
--bg-overlay: rgba(0, 0, 0, 0.7);
--bg-backdrop: rgba(0, 0, 0, 0.3);
```

#### Text Colors
```css
/* Primary Text */
--text-primary: #f8fafc;
--text-secondary: #cbd5e1;
--text-tertiary: #94a3b8;
--text-muted: #64748b;

/* Link Text */
--text-link: #60a5fa;
--text-link-hover: #93c5fd;
--text-link-active: #bfdbfe;
```

#### Input Fields
```css
/* Text Input */
--input-bg: #1e293b;
--input-border: #475569;
--input-border-focus: #60a5fa;
--input-border-error: #f87171;
--input-text: #f8fafc;
--input-placeholder: #64748b;
--input-shadow: 0 1px 2px 0 rgba(0, 0, 0, 0.3);
--input-shadow-focus: 0 0 0 3px rgba(96, 165, 250, 0.2);

/* Select Input */
--select-bg: #1e293b;
--select-border: #475569;
--select-border-focus: #60a5fa;
--select-text: #f8fafc;
--select-arrow: #94a3b8;
```

#### Buttons
```css
/* Primary Button */
--btn-primary-bg: #60a5fa;
--btn-primary-bg-hover: #93c5fd;
--btn-primary-bg-active: #bfdbfe;
--btn-primary-text: #0f172a;
--btn-primary-border: transparent;
--btn-primary-shadow: 0 1px 3px 0 rgba(0, 0, 0, 0.3);

/* Secondary Button */
--btn-secondary-bg: #1e293b;
--btn-secondary-bg-hover: #334155;
--btn-secondary-bg-active: #475569;
--btn-secondary-text: #cbd5e1;
--btn-secondary-border: #475569;
--btn-secondary-shadow: 0 1px 2px 0 rgba(0, 0, 0, 0.3);

/* Ghost Button */
--btn-ghost-bg: transparent;
--btn-ghost-bg-hover: #334155;
--btn-ghost-bg-active: #475569;
--btn-ghost-text: #cbd5e1;
--btn-ghost-border: transparent;
```

#### Icons
```css
/* Icon Colors */
--icon-primary: #94a3b8;
--icon-secondary: #64748b;
--icon-accent: #60a5fa;
--icon-success: #4ade80;
--icon-warning: #fbbf24;
--icon-error: #f87171;
```

---

## Admin Dashboard Style Guide

### Light Mode

#### Background Colors
```css
/* Main Background */
--bg-primary: #ffffff;
--bg-secondary: #f8fafc;
--bg-tertiary: #f1f5f9;
--bg-sidebar: #1e293b;
--bg-header: #ffffff;
--bg-content: #f8fafc;

/* Card Backgrounds */
--bg-card: #ffffff;
--bg-card-hover: #f8fafc;
--bg-card-active: #f1f5f9;
--bg-stats-card: #ffffff;
--bg-chart-card: #ffffff;
```

#### Text Colors
```css
/* Primary Text */
--text-primary: #0f172a;
--text-secondary: #475569;
--text-tertiary: #64748b;
--text-muted: #94a3b8;
--text-sidebar: #cbd5e1;
--text-sidebar-active: #ffffff;
```

#### Navigation
```css
/* Sidebar */
--sidebar-bg: #1e293b;
--sidebar-border: #334155;
--sidebar-item-bg: transparent;
--sidebar-item-bg-hover: #334155;
--sidebar-item-bg-active: #3b82f6;
--sidebar-item-text: #cbd5e1;
--sidebar-item-text-hover: #f8fafc;
--sidebar-item-text-active: #ffffff;

/* Header */
--header-bg: #ffffff;
--header-border: #e2e8f0;
--header-text: #0f172a;
```

#### Data Tables
```css
/* Table */
--table-bg: #ffffff;
--table-border: #e2e8f0;
--table-header-bg: #f8fafc;
--table-header-text: #475569;
--table-row-bg: #ffffff;
--table-row-bg-hover: #f8fafc;
--table-row-bg-striped: #f8fafc;
--table-text: #0f172a;
```

#### Charts & Analytics
```css
/* Chart Backgrounds */
--chart-bg: #ffffff;
--chart-border: #e2e8f0;
--chart-grid: #f1f5f9;
--chart-text: #475569;

/* Chart Colors */
--chart-primary: #3b82f6;
--chart-secondary: #10b981;
--chart-tertiary: #f59e0b;
--chart-quaternary: #ef4444;
```

### Dark Mode

#### Background Colors
```css
/* Main Background */
--bg-primary: #0f172a;
--bg-secondary: #1e293b;
--bg-tertiary: #334155;
--bg-sidebar: #020617;
--bg-header: #0f172a;
--bg-content: #1e293b;

/* Card Backgrounds */
--bg-card: #1e293b;
--bg-card-hover: #334155;
--bg-card-active: #475569;
--bg-stats-card: #1e293b;
--bg-chart-card: #1e293b;
```

#### Text Colors
```css
/* Primary Text */
--text-primary: #f8fafc;
--text-secondary: #cbd5e1;
--text-tertiary: #94a3b8;
--text-muted: #64748b;
--text-sidebar: #94a3b8;
--text-sidebar-active: #ffffff;
```

#### Navigation
```css
/* Sidebar */
--sidebar-bg: #020617;
--sidebar-border: #1e293b;
--sidebar-item-bg: transparent;
--sidebar-item-bg-hover: #1e293b;
--sidebar-item-bg-active: #60a5fa;
--sidebar-item-text: #94a3b8;
--sidebar-item-text-hover: #f8fafc;
--sidebar-item-text-active: #ffffff;

/* Header */
--header-bg: #0f172a;
--header-border: #1e293b;
--header-text: #f8fafc;
```

#### Data Tables
```css
/* Table */
--table-bg: #1e293b;
--table-border: #334155;
--table-header-bg: #0f172a;
--table-header-text: #cbd5e1;
--table-row-bg: #1e293b;
--table-row-bg-hover: #334155;
--table-row-bg-striped: #0f172a;
--table-text: #f8fafc;
```

#### Charts & Analytics
```css
/* Chart Backgrounds */
--chart-bg: #1e293b;
--chart-border: #334155;
--chart-grid: #0f172a;
--chart-text: #cbd5e1;

/* Chart Colors */
--chart-primary: #60a5fa;
--chart-secondary: #4ade80;
--chart-tertiary: #fbbf24;
--chart-quaternary: #f87171;
```

---

## Component Library

### Button Variants
```css
/* Primary Button */
.btn-primary {
  background-color: var(--btn-primary-bg);
  color: var(--btn-primary-text);
  border: 1px solid var(--btn-primary-border);
  border-radius: var(--radius-md);
  padding: 0.75rem 1.5rem;
  font-size: var(--text-sm);
  font-weight: var(--font-medium);
  box-shadow: var(--btn-primary-shadow);
  transition: all 0.2s ease-in-out;
}

.btn-primary:hover {
  background-color: var(--btn-primary-bg-hover);
  transform: translateY(-1px);
  box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1);
}

/* Secondary Button */
.btn-secondary {
  background-color: var(--btn-secondary-bg);
  color: var(--btn-secondary-text);
  border: 1px solid var(--btn-secondary-border);
  border-radius: var(--radius-md);
  padding: 0.75rem 1.5rem;
  font-size: var(--text-sm);
  font-weight: var(--font-medium);
  box-shadow: var(--btn-secondary-shadow);
  transition: all 0.2s ease-in-out;
}

/* Ghost Button */
.btn-ghost {
  background-color: var(--btn-ghost-bg);
  color: var(--btn-ghost-text);
  border: 1px solid var(--btn-ghost-border);
  border-radius: var(--radius-md);
  padding: 0.75rem 1.5rem;
  font-size: var(--text-sm);
  font-weight: var(--font-medium);
  transition: all 0.2s ease-in-out;
}
```

### Input Fields
```css
/* Text Input */
.input-text {
  background-color: var(--input-bg);
  border: 1px solid var(--input-border);
  border-radius: var(--radius-md);
  padding: 0.75rem 1rem;
  font-size: var(--text-sm);
  color: var(--input-text);
  box-shadow: var(--input-shadow);
  transition: all 0.2s ease-in-out;
}

.input-text:focus {
  outline: none;
  border-color: var(--input-border-focus);
  box-shadow: var(--input-shadow-focus);
}

.input-text::placeholder {
  color: var(--input-placeholder);
}

/* Select Input */
.input-select {
  background-color: var(--select-bg);
  border: 1px solid var(--select-border);
  border-radius: var(--radius-md);
  padding: 0.75rem 1rem;
  font-size: var(--text-sm);
  color: var(--select-text);
  box-shadow: var(--input-shadow);
  transition: all 0.2s ease-in-out;
  appearance: none;
  background-image: url("data:image/svg+xml,...");
  background-repeat: no-repeat;
  background-position: right 0.75rem center;
  background-size: 1rem;
}
```

### Cards
```css
/* Base Card */
.card {
  background-color: var(--bg-card);
  border: 1px solid var(--border-base);
  border-radius: var(--radius-lg);
  padding: var(--space-6);
  box-shadow: 0 1px 3px 0 rgba(0, 0, 0, 0.1);
  transition: all 0.2s ease-in-out;
}

.card:hover {
  background-color: var(--bg-card-hover);
  box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1);
}

/* Stats Card */
.card-stats {
  background-color: var(--bg-stats-card);
  border: 1px solid var(--border-base);
  border-radius: var(--radius-lg);
  padding: var(--space-6);
  box-shadow: 0 1px 3px 0 rgba(0, 0, 0, 0.1);
}

/* Chart Card */
.card-chart {
  background-color: var(--bg-chart-card);
  border: 1px solid var(--border-base);
  border-radius: var(--radius-lg);
  padding: var(--space-6);
  box-shadow: 0 1px 3px 0 rgba(0, 0, 0, 0.1);
}
```

### Tables
```css
/* Data Table */
.table {
  width: 100%;
  background-color: var(--table-bg);
  border: 1px solid var(--table-border);
  border-radius: var(--radius-lg);
  overflow: hidden;
}

.table-header {
  background-color: var(--table-header-bg);
  color: var(--table-header-text);
  font-weight: var(--font-semibold);
  font-size: var(--text-sm);
  padding: var(--space-4);
  border-bottom: 1px solid var(--table-border);
}

.table-row {
  background-color: var(--table-row-bg);
  transition: background-color 0.2s ease-in-out;
}

.table-row:hover {
  background-color: var(--table-row-bg-hover);
}

.table-row:nth-child(even) {
  background-color: var(--table-row-bg-striped);
}

.table-cell {
  padding: var(--space-4);
  color: var(--table-text);
  font-size: var(--text-sm);
  border-bottom: 1px solid var(--table-border);
}
```

---

## Accessibility Guidelines

### Color Contrast
```css
/* Minimum contrast ratios */
--contrast-primary: 4.5:1;    /* Normal text */
--contrast-secondary: 3:1;    /* Large text */
--contrast-ui: 3:1;           /* UI components */
```

### Focus States
```css
/* Focus outline */
.focus-visible {
  outline: 2px solid var(--primary-500);
  outline-offset: 2px;
}

/* Focus ring for buttons */
.btn:focus-visible {
  outline: 2px solid var(--primary-500);
  outline-offset: 2px;
  box-shadow: 0 0 0 4px rgba(59, 130, 246, 0.1);
}
```

### Screen Reader Support
```css
/* Visually hidden text */
.sr-only {
  position: absolute;
  width: 1px;
  height: 1px;
  padding: 0;
  margin: -1px;
  overflow: hidden;
  clip: rect(0, 0, 0, 0);
  white-space: nowrap;
  border: 0;
}

/* Skip link */
.skip-link {
  position: absolute;
  top: -40px;
  left: 6px;
  background: var(--primary-500);
  color: white;
  padding: 8px;
  text-decoration: none;
  border-radius: var(--radius-md);
  z-index: 1000;
}

.skip-link:focus {
  top: 6px;
}
```

---

## Responsive Design

### Breakpoints
```css
/* Mobile First */
--breakpoint-sm: 640px;
--breakpoint-md: 768px;
--breakpoint-lg: 1024px;
--breakpoint-xl: 1280px;
--breakpoint-2xl: 1536px;
```

### Responsive Typography
```css
/* Fluid typography */
.text-fluid {
  font-size: clamp(1rem, 2.5vw, 1.5rem);
  line-height: 1.5;
}

/* Responsive headings */
.heading-fluid {
  font-size: clamp(1.5rem, 4vw, 3rem);
  line-height: 1.2;
}
```

### Responsive Spacing
```css
/* Responsive padding */
.p-responsive {
  padding: var(--space-4);
}

@media (min-width: 768px) {
  .p-responsive {
    padding: var(--space-6);
  }
}

@media (min-width: 1024px) {
  .p-responsive {
    padding: var(--space-8);
  }
}
```

---

## Animation & Transitions

### Transition Durations
```css
--duration-75: 75ms;
--duration-100: 100ms;
--duration-150: 150ms;
--duration-200: 200ms;
--duration-300: 300ms;
--duration-500: 500ms;
--duration-700: 700ms;
--duration-1000: 1000ms;
```

### Easing Functions
```css
--ease-linear: linear;
--ease-in: cubic-bezier(0.4, 0, 1, 1);
--ease-out: cubic-bezier(0, 0, 0.2, 1);
--ease-in-out: cubic-bezier(0.4, 0, 0.2, 1);
```

### Common Animations
```css
/* Fade in */
@keyframes fadeIn {
  from {
    opacity: 0;
  }
  to {
    opacity: 1;
  }
}

.fade-in {
  animation: fadeIn 0.3s ease-in-out;
}

/* Slide up */
@keyframes slideUp {
  from {
    transform: translateY(20px);
    opacity: 0;
  }
  to {
    transform: translateY(0);
    opacity: 1;
  }
}

.slide-up {
  animation: slideUp 0.3s ease-out;
}

/* Scale in */
@keyframes scaleIn {
  from {
    transform: scale(0.95);
    opacity: 0;
  }
  to {
    transform: scale(1);
    opacity: 1;
  }
}

.scale-in {
  animation: scaleIn 0.2s ease-out;
}
```

### Hover Effects
```css
/* Button hover */
.btn {
  transition: all var(--duration-200) var(--ease-in-out);
}

.btn:hover {
  transform: translateY(-1px);
  box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1);
}

/* Card hover */
.card {
  transition: all var(--duration-200) var(--ease-in-out);
}

.card:hover {
  transform: translateY(-2px);
  box-shadow: 0 10px 15px -3px rgba(0, 0, 0, 0.1);
}
```

---

## Implementation Guidelines

### CSS Custom Properties
```css
/* Define all variables in :root */
:root {
  /* Colors */
  --primary-500: #3b82f6;
  --neutral-900: #0f172a;
  
  /* Typography */
  --text-base: 1rem;
  --font-medium: 500;
  
  /* Spacing */
  --space-4: 1rem;
  
  /* Borders */
  --radius-md: 0.5rem;
  
  /* Transitions */
  --duration-200: 200ms;
  --ease-in-out: cubic-bezier(0.4, 0, 0.2, 1);
}

/* Dark mode overrides */
[data-theme="dark"] {
  --primary-500: #60a5fa;
  --neutral-900: #f8fafc;
}
```

### Tailwind CSS Classes
```css
/* Button classes */
.btn-primary {
  @apply bg-blue-500 hover:bg-blue-600 text-white font-medium px-6 py-3 rounded-md transition-all duration-200 ease-in-out;
}

/* Input classes */
.input-text {
  @apply bg-white border border-gray-300 rounded-md px-4 py-3 text-gray-900 placeholder-gray-500 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 transition-all duration-200;
}

/* Card classes */
.card {
  @apply bg-white border border-gray-200 rounded-lg p-6 shadow-sm hover:shadow-md transition-all duration-200;
}
```

### Component Examples
```jsx
// Button Component
const Button = ({ variant = 'primary', children, ...props }) => {
  const baseClasses = 'font-medium px-6 py-3 rounded-md transition-all duration-200 ease-in-out';
  const variantClasses = {
    primary: 'bg-blue-500 hover:bg-blue-600 text-white',
    secondary: 'bg-gray-100 hover:bg-gray-200 text-gray-900',
    ghost: 'bg-transparent hover:bg-gray-100 text-gray-700'
  };
  
  return (
    <button 
      className={`${baseClasses} ${variantClasses[variant]}`}
      {...props}
    >
      {children}
    </button>
  );
};

// Input Component
const Input = ({ type = 'text', ...props }) => {
  return (
    <input
      type={type}
      className="bg-white border border-gray-300 rounded-md px-4 py-3 text-gray-900 placeholder-gray-500 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 transition-all duration-200"
      {...props}
    />
  );
};
```

---

*This style guide should be used consistently across all components and pages in the Bilten application. Regular reviews and updates ensure the design system remains current and accessible.*
