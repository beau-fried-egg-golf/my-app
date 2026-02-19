# FEGC Web Design System
## Bridging thefriedegg.com and the Fried Egg Golf Club App for Web

> **Purpose**: This document is the source of truth for rendering the FEGC app as a web experience that feels native to the Fried Egg brand ecosystem. It is designed to be consumed by Claude Code (or any LLM-based coding tool) and translated directly into React component styles, CSS custom properties, and interaction patterns.

---

## 1. Brand Architecture

The Fried Egg operates two connected but intentionally distinct brands:

| Property | The Fried Egg (Content) | Fried Egg Golf Club (Community/Action) |
|---|---|---|
| **Primary Color** | Yellow `#FFEE54` | Orange `#FE4D12` |
| **Mode** | Consumption — reading, browsing, discovery | Action — booking, chatting, joining, playing |
| **Platform** | Webflow site (thefriedegg.com) | React/Expo app (web + mobile) |
| **Typefaces** | Grey LL + Stanley | Grey LL only (currently) |

The FEGC web experience should feel like **walking from the pro shop into the clubhouse** — a different room, but unmistakably the same place. The transition is intentional, not accidental.

---

## 2. Color System

### 2.1 Core Palette (shared across both brands)

Adopt the thefriedegg.com palette as the foundation. The FEGC app's current pure-black/pure-white palette should shift to the warmer, more editorial tones of the parent brand.

```css
:root {
  /* ── Base Colors (from thefriedegg.com) ── */
  --color-black: #1b1a1a;           /* Warm near-black — replaces app's #000000 */
  --color-white: #ffffff;
  --color-cream: #f3f1e7;           /* Warm off-white background — NEW for app */
  --color-grey-100: #666666;        /* Secondary text */

  /* ── Brand Colors ── */
  --color-brand-yellow: #ffee54;    /* The Fried Egg brand — content/editorial */
  --color-brand-orange: #fe4d12;    /* FEGC brand — action/community */

  /* ── Extended Palette (from thefriedegg.com) ── */
  --color-brick: #9b221a;
  --color-maroon: #630f2c;
  --color-forest: #24440a;
  --color-moss: #8e9e74;
  --color-navy: #062b4e;
  --color-sky: #caeeff;

  /* ── Semantic Colors ── */
  --color-verified: #22c55e;        /* Verified badge green (keep from app) */
  --color-stripe: #635bff;          /* Stripe payment purple (keep from app) */
  --color-error: #dc2626;
  --color-warning: #d97706;
  --color-success: #155724;
}
```

### 2.2 Migration: What Changes from the Current App

| Current App Value | New Web Value | Rationale |
|---|---|---|
| `Colors.black` = `#000000` | `--color-black` = `#1b1a1a` | Match TFE warm near-black; less harsh on screen |
| `Colors.white` = `#FFFFFF` (backgrounds) | `--color-cream` = `#f3f1e7` for page bg, `--color-white` for cards/surfaces | Cream backgrounds create warmth + editorial feel |
| `Colors.lightGray` = `#E5E5E5` (borders) | Use `--color-black` at reduced opacity or `--border-width-main` pattern | TFE uses black borders (~1.5px) rather than gray hairlines |
| `Colors.darkGray` = `#333333` (body text) | `--color-black` = `#1b1a1a` | Simplify to one text color; near-black is already soft enough |
| `Colors.gray` = `#888888` (secondary) | `--color-grey-100` = `#666666` | Slightly darker secondary text for better contrast on cream |

### 2.3 Theme System

thefriedegg.com supports section-level theming. The FEGC web app should adopt this for visual variety across sections.

```css
/* ── Default theme (cream background — most screens) ── */
[data-theme="default"] {
  --theme-bg: var(--color-cream);
  --theme-bg-surface: var(--color-white);
  --theme-text: var(--color-black);
  --theme-text-secondary: var(--color-grey-100);
  --theme-border: var(--color-black);
  --theme-brand: var(--color-brand-orange);
}

/* ── Dark theme (black background — hero sections, experiences) ── */
[data-theme="dark"] {
  --theme-bg: var(--color-black);
  --theme-bg-surface: rgba(255, 255, 255, 0.1);
  --theme-text: var(--color-white);
  --theme-text-secondary: rgba(255, 255, 255, 0.6);
  --theme-border: var(--color-white);
  --theme-brand: var(--color-brand-orange);
}

/* ── Brand theme (orange background — CTAs, featured sections) ── */
[data-theme="brand"] {
  --theme-bg: var(--color-brand-orange);
  --theme-bg-surface: rgba(255, 255, 255, 0.2);
  --theme-text: var(--color-white);
  --theme-text-secondary: rgba(255, 255, 255, 0.8);
  --theme-border: var(--color-white);
  --theme-brand: var(--color-brand-yellow);
}
```

---

## 3. Typography

### 3.1 Font Families

The FEGC app already uses Grey LL. The key addition for web is **Stanley** — the serif display typeface from thefriedegg.com — which adds editorial personality and creates a direct visual link to the content site.

```css
:root {
  /* Primary — Grey LL (sans-serif, used for all UI text) */
  --font-primary: 'Grey LL', 'Grey', Georgia, system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;

  /* Secondary — Stanley (serif, used for display/editorial headings) */
  --font-secondary: 'Stanley', Georgia, 'Times New Roman', serif;

  /* Font weights — Grey LL */
  --font-weight-regular: 400;
  --font-weight-medium: 500;
  --font-weight-semibold: 600;   /* NEW — available in TFE, not used in app yet */
  --font-weight-bold: 700;

  /* Font weights — Stanley */
  --font-weight-stanley-regular: 400;
  --font-weight-stanley-bold: 700;
  /* Stanley also has a "Poster" variant (heavier display weight) */
}
```

### 3.2 Font Files Required

```
Stanley-Regular.woff2    (from TFE Webflow CDN)
Stanley-Bold.woff2       (from TFE Webflow CDN)
Stanley-Poster.woff2     (from TFE Webflow CDN)
GreyLLTT-Regular.ttf     (already in app: public/fonts/)
GreyLLTT-Medium.ttf      (already in app: public/fonts/)
GreyLLTT-Bold.ttf        (already in app: public/fonts/)
```

**Action**: Download Stanley fonts from the Webflow CDN URLs in the CSS and add them to the app's `public/fonts/` directory. Register them with `@font-face` in the web build's global CSS.

### 3.3 Type Scale

Adopt the TFE type scale (rem-based) for web. This replaces the app's current px-based ad-hoc sizing.

```css
:root {
  /* ── Heading Scale (Stanley or Grey LL Bold) ── */
  --text-h1: 5rem;        /* 80px — hero headlines, Stanley Poster */
  --text-h2: 4rem;        /* 64px — section headings, Stanley Bold */
  --text-h3: 3rem;        /* 48px — subsection headings, Stanley Bold */
  --text-h4: 2rem;        /* 32px — card titles, Grey LL Bold */
  --text-h5: 1.5rem;      /* 24px — component headings, Grey LL Bold */
  --text-h6: 1rem;        /* 16px — labels, Grey LL Bold uppercase */

  /* ── Body Scale (Grey LL) ── */
  --text-large: 1.25rem;  /* 20px — lead paragraphs, intros */
  --text-medium: 1.125rem;/* 18px — featured body text */
  --text-main: 1rem;      /* 16px — standard body text */
  --text-small: 0.875rem; /* 14px — captions, meta, secondary */
  --text-tiny: 0.75rem;   /* 12px — timestamps, badges, labels */

  /* ── Line Heights ── */
  --leading-none: 1;
  --leading-tight: 1.2;
  --leading-snug: 1.3;
  --leading-normal: 1.4;
  --leading-relaxed: 1.6;

  /* ── Letter Spacing ── */
  --tracking-tight: -0.03em;   /* Large headings */
  --tracking-normal: -0.02em;  /* Medium headings */
  --tracking-none: 0em;        /* Body text */
  --tracking-wide: 0.08em;     /* Uppercase labels, LetterSpacedHeader */

  /* ── Font Trim (for Webflow-style vertical rhythm) ── */
  --font-trim-primary-top: 0.35em;
  --font-trim-primary-bottom: 0.36em;
  --font-trim-secondary-top: 0.5em;
}
```

### 3.4 Heading Assignments

| Level | Font | Weight | Size | Line Height | Letter Spacing | Usage |
|---|---|---|---|---|---|---|
| H1 | Stanley Poster | 700 | `--text-h1` (5rem) | `--leading-tight` (1.2) | `--tracking-tight` (-0.03em) | Page heroes, landing sections |
| H2 | Stanley Bold | 700 | `--text-h2` (4rem) | `--leading-tight` (1.2) | `--tracking-tight` (-0.03em) | Major section headings |
| H3 | Stanley Bold | 700 | `--text-h3` (3rem) | `--leading-snug` (1.3) | `--tracking-normal` (-0.02em) | Card group titles, features |
| H4 | Grey LL Bold | 700 | `--text-h4` (2rem) | `--leading-snug` (1.3) | `--tracking-normal` (-0.02em) | Component headings |
| H5 | Grey LL Bold | 700 | `--text-h5` (1.5rem) | `--leading-normal` (1.4) | `--tracking-none` (0em) | List item titles, nav |
| H6 | Grey LL Bold | 700 | `--text-h6` (1rem) | `--leading-normal` (1.4) | `--tracking-none` (0em) | Labels, small headings |

**Key decision**: Stanley headings create the editorial connection to thefriedegg.com. Use Stanley for H1-H3 (display/section-level), Grey LL Bold for H4-H6 (component/UI-level). This creates a natural hierarchy where the page "feels editorial" at the top and "feels app-like" in the interactive details.

### 3.5 Where to Use Stanley vs Grey LL

| Stanley (editorial/display) | Grey LL (UI/functional) |
|---|---|
| Page titles and hero headlines | Navigation labels |
| Section headings (Feed, Courses, etc.) | Button text |
| Course names on detail pages | Form labels and inputs |
| Meetup and group names (large display) | Chat messages |
| Empty state titles | Timestamps, metadata |
| Marketing/promotional content | Badges, tags, pill labels |
| Pull quotes | Tab labels |
| Experiences package names | Table headers and data |

### 3.6 Replacing LetterSpacedHeader

The app's current `LetterSpacedHeader` component (each letter in a colored box) is distinctive on mobile but doesn't feel web-native. For the web version, replace it with a **Stanley-based heading** paired with a subtle brand accent.

**Option A — Stanley heading with orange underline accent:**
```css
.section-heading {
  font-family: var(--font-secondary);
  font-weight: var(--font-weight-stanley-bold);
  font-size: var(--text-h3);
  line-height: var(--leading-tight);
  letter-spacing: var(--tracking-tight);
  color: var(--theme-text);
  padding-bottom: var(--space-3);
  border-bottom: 3px solid var(--color-brand-orange);
  display: inline-block;
}
```

**Option B — Stanley heading with small orange WordHighlight tag above it:**
Keep a small `WordHighlight`-style label (e.g., "COMMUNITY" or "COURSES") above a Stanley heading for section context. This preserves the block-letter brand identity at a smaller scale.

```css
.section-label {
  /* Small block-letter label — descendant of LetterSpacedHeader */
  font-family: var(--font-primary);
  font-weight: var(--font-weight-bold);
  font-size: var(--text-tiny);
  letter-spacing: var(--tracking-wide);
  text-transform: uppercase;
  background: var(--color-brand-orange);
  color: var(--color-white);
  padding: 0.25em 0.5em;
  display: inline-block;
  margin-bottom: var(--space-2);
}
```

**Recommendation**: Use Option B. It preserves brand recognition (the orange block-letter DNA) while feeling web-appropriate, and pairs naturally with the Stanley heading below it.

---

## 4. Spacing System

Adopt the TFE spacing scale (rem-based, systematic) to replace the app's ad-hoc pixel values.

```css
:root {
  /* ── Component Spacing ── */
  --space-1: 0.25rem;     /* 4px — tight gaps, icon margins */
  --space-2: 0.5rem;      /* 8px — inline spacing, small gaps */
  --space-3: 0.625rem;    /* 10px — list gaps, small padding */
  --space-4: 1rem;        /* 16px — standard padding, card gutters */
  --space-5: 1.25rem;     /* 20px — content padding, gutter */
  --space-6: 1.875rem;    /* 30px — section sub-spacing */
  --space-7: 2.5rem;      /* 40px — large component gaps */
  --space-8: 4rem;        /* 64px — section internal spacing */

  /* ── Section Spacing (vertical rhythm between major sections) ── */
  --section-none: 0;
  --section-tiny: 3rem;       /* 48px */
  --section-small: 5rem;      /* 80px */
  --section-main: 7.5rem;     /* 120px */
  --section-large: 10rem;     /* 160px */

  /* ── Layout ── */
  --site-width: 90rem;         /* 1440px max content width */
  --site-gutter: 1.25rem;     /* 20px grid gutter */
  --content-max-width: 52.5rem;/* 840px — readable content column */
  --sidebar-width: 15rem;     /* 240px — desktop sidebar */
  --nav-height: 4rem;         /* 64px — navigation bar height */
}
```

### 4.1 Migration from App Spacing

| App Pattern | Web Replacement |
|---|---|
| `paddingHorizontal: 16` | `padding-inline: var(--space-4)` |
| `gap: 12` | `gap: var(--space-3)` |
| Content max-width `720px` | `--content-max-width: 52.5rem` (840px — wider for web) |
| Sidebar `220px` | `--sidebar-width: 15rem` (240px — slightly wider) |

---

## 5. Border & Radius System

### 5.1 Borders

thefriedegg.com uses a distinctive thin-but-visible border style — `~1.5px solid black` — that gives everything a deliberate, almost printed quality. This replaces the app's lighter gray hairlines.

```css
:root {
  --border-width-main: 0.094rem;   /* ~1.5px — the TFE signature border */
  --border-color: var(--theme-border);
  --border-main: var(--border-width-main) solid var(--border-color);
}
```

### 5.2 Border Radius

Adopt TFE's tighter, more intentional radius scale. The app's current rounded corners (10-28px) should get crisper.

```css
:root {
  --radius-tiny: 0.25rem;   /* 4px — tags, small badges */
  --radius-xsmall: 0.4rem;  /* 6.4px — buttons, nav items, inputs */
  --radius-small: 0.5rem;   /* 8px — cards, nav list, dropdowns */
  --radius-main: 1rem;       /* 16px — modals, panels, larger cards */
  --radius-large: 1.5rem;   /* 24px — hero sections, feature cards */
  --radius-xlarge: 3rem;    /* 48px — pill buttons, large decorative */
  --radius-round: 100vw;    /* Full pill shape — avatars, search bars */
}
```

### 5.3 Migration

| App Element | Current Radius | New Radius |
|---|---|---|
| Cards | `10-12px` | `--radius-small` (8px) |
| Modals | `12px` | `--radius-main` (16px) |
| Buttons | `varies` | `--radius-xsmall` (6.4px) |
| Tab bar pill | `28px` | `--radius-round` |
| Avatar | `50%` | `--radius-round` |
| Nav items | `8px` | `--radius-small` (8px) |
| Search bar | `22px` | `--radius-round` |
| Input fields | `varies` | `--radius-xsmall` (6.4px) |

---

## 6. Shadows

Replace the app's current React Native shadows with CSS box-shadows. Keep them subtle — TFE relies more on borders than shadows for hierarchy.

```css
:root {
  /* ── Use sparingly — borders are the primary hierarchy tool ── */
  --shadow-sm: 0 1px 4px rgba(27, 26, 26, 0.08);     /* Buttons, pills */
  --shadow-md: 0 2px 8px rgba(27, 26, 26, 0.08);      /* Cards on hover */
  --shadow-lg: 0 4px 16px rgba(27, 26, 26, 0.12);     /* Floating elements, dropdowns */
  --shadow-xl: 0 8px 32px rgba(27, 26, 26, 0.16);     /* Modals, overlays */
}
```

**Key change**: The app currently uses shadows as the primary way to convey elevation (floating tab bar, FABs, search bars). On web, **borders replace shadows** as the main hierarchy signal, matching TFE's aesthetic. Shadows are reserved for hover states and overlays.

---

## 7. Layout System

### 7.1 Grid

Adopt TFE's 12-column grid for the FEGC web layout, replacing the app's single-column 720px approach.

```css
.grid {
  display: grid;
  grid-template-columns: repeat(12, minmax(0, 1fr));
  gap: var(--site-gutter);
  max-width: var(--site-width);
  margin-inline: auto;
  padding-inline: var(--site-gutter);
}

/* Content column (typical article/feed width) */
.grid-content {
  grid-column: 4 / span 6;     /* 6 of 12 columns — centered */
}

/* Wide content (courses list, meetups, etc.) */
.grid-content-wide {
  grid-column: 3 / span 8;     /* 8 of 12 columns */
}

/* Full width */
.grid-content-full {
  grid-column: 1 / -1;
}

/* Sidebar + content pattern */
.grid-sidebar-content {
  grid-column: 1 / span 3;     /* Sidebar: 3 columns */
}
.grid-main-content {
  grid-column: 4 / span 9;     /* Main: 9 columns */
}
```

### 7.2 Container

```css
.container {
  width: 100%;
  max-width: var(--site-width);
  margin-inline: auto;
  padding-inline: var(--site-gutter);
}

.container-small {
  max-width: var(--content-max-width);  /* 840px — readable text */
}
```

### 7.3 Breakpoints

```css
/* Keep the app's existing breakpoint but add TFE's tablet breakpoint */
--breakpoint-mobile: 479px;
--breakpoint-tablet: 767px;
--breakpoint-desktop: 991px;
--breakpoint-wide: 1440px;

@media (max-width: 991px) { /* Tablet: collapse to 2-column, hide sidebar */ }
@media (max-width: 767px) { /* Mobile: single column, bottom nav returns */ }
@media (max-width: 479px) { /* Small mobile: tighter spacing */ }
```

### 7.4 Desktop Navigation: Sidebar Redesign

Replace the current `DesktopSidebar` (220px, basic list) with a TFE-inspired navigation that feels like part of the website.

**Structure:**
```
┌──────────────────────────────────────────────────────┐
│  [FE Logo]          [Nav List (pill bar)]   [Icons]  │  ← Fixed top nav
├──────────────────────────────────────────────────────┤
│                                                      │
│  ┌────────────────────────────────────────────────┐  │
│  │                                                │  │
│  │              Page Content                      │  │
│  │           (grid-based layout)                  │  │
│  │                                                │  │
│  └────────────────────────────────────────────────┘  │
│                                                      │
└──────────────────────────────────────────────────────┘
```

**The nav should:**
- Be a **fixed top bar** (not a left sidebar) — this matches thefriedegg.com's pattern and is more web-native
- Use the FE logo (not FEGC-specific) on the left
- Have a **pill-shaped nav list** in the center (cream bg, black border, small radius) — directly from TFE's `.nav_list_wrap` pattern
- Show action icons (notifications, messages, profile) on the right
- The nav list items should be compact pill-shaped buttons within the nav bar

**Nav bar CSS pattern (from TFE):**
```css
.nav-component {
  position: fixed;
  top: 0;
  width: 100%;
  z-index: 100;
  padding: var(--site-gutter);
  pointer-events: none;           /* Only interactive children are clickable */
  color: var(--color-black);
}

.nav-layout {
  display: flex;
  justify-content: space-between;
  align-items: center;
  min-height: var(--nav-height);
}

.nav-list-wrap {
  pointer-events: auto;
  display: flex;
  gap: 0.125rem;
  border: var(--border-main);
  border-radius: var(--radius-small);
  background: var(--color-cream);
  padding: 0.125rem;
}

.nav-list-item {
  border-radius: var(--radius-xsmall);
  padding: 0.5rem 0.875rem;
  font-family: var(--font-primary);
  font-weight: var(--font-weight-medium);
  font-size: var(--text-small);
  color: var(--color-black);
  cursor: pointer;
  transition: background-color 0.2s, color 0.2s;
}

.nav-list-item:hover {
  background: rgba(27, 26, 26, 0.06);
}

.nav-list-item.active {
  background: var(--color-brand-orange);
  color: var(--color-white);
}
```

**Mobile nav**: On screens < 991px, collapse to a hamburger that opens an **overlay menu panel** (matching TFE's pattern): max-width ~41rem, cream background, black border, slides/fades in with the nav items staggering in via GSAP.

---

## 8. Component Patterns

### 8.1 Buttons

Replace the app's simple TouchableOpacity/Pressable buttons with TFE-style bordered buttons that have clear hover transitions.

**Primary Button** (main CTA — "Join Meetup", "Book Now", etc.):
```css
.btn-primary {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  min-height: 2.875rem;                    /* 46px */
  padding: 0 var(--space-5);              /* 1.125rem horizontal */
  border: var(--border-main);
  border-radius: var(--radius-xsmall);
  background: var(--color-black);
  color: var(--color-white);
  font-family: var(--font-primary);
  font-weight: var(--font-weight-medium);
  font-size: var(--text-small);
  cursor: pointer;
  transition: background-color 0.2s ease, color 0.2s ease, border-color 0.2s ease;
}

.btn-primary:hover {
  background: var(--color-white);
  color: var(--color-brand-yellow);       /* Yellow text on hover — TFE signature */
  border-color: var(--color-black);
}

/* Icon inside button (e.g., arrow) */
.btn-primary .btn-icon {
  color: var(--color-brand-yellow);        /* Yellow icon — brand accent */
  transition: color 0.2s ease;
}

.btn-primary:hover .btn-icon {
  color: var(--color-brand-yellow);
}
```

**Secondary Button** (alternative CTA — "Learn More", "View All"):
```css
.btn-secondary {
  /* Same dimensions as primary */
  min-height: 2.875rem;
  padding: 0 var(--space-5);
  border: var(--border-main);
  border-radius: var(--radius-xsmall);
  font-family: var(--font-primary);
  font-weight: var(--font-weight-medium);
  font-size: var(--text-small);
  cursor: pointer;
  transition: background-color 0.2s ease, color 0.2s ease, border-color 0.2s ease;
  /* Secondary specific */
  background: var(--color-brand-yellow);
  color: var(--color-black);
  border-color: var(--color-brand-yellow);
}

.btn-secondary:hover {
  background: var(--color-black);
  color: var(--color-white);
  border-color: var(--color-black);
}
```

**Orange/FEGC Button** (community action — "Follow", "RSVP"):
```css
.btn-orange {
  min-height: 2.875rem;
  padding: 0 var(--space-5);
  border: var(--border-main);
  border-radius: var(--radius-xsmall);
  background: var(--color-brand-orange);
  color: var(--color-black);
  border-color: var(--color-brand-orange);
  font-family: var(--font-primary);
  font-weight: var(--font-weight-medium);
  font-size: var(--text-small);
  cursor: pointer;
  transition: background-color 0.2s ease, color 0.2s ease, border-color 0.2s ease;
}

.btn-orange:hover {
  background: var(--color-black);
  color: var(--color-white);
  border-color: var(--color-black);
}
```

**Text Button / Link** (inline actions):
```css
.btn-text {
  display: inline-flex;
  align-items: center;
  gap: var(--space-2);
  background: transparent;
  border: none;
  color: var(--color-black);
  font-family: var(--font-primary);
  font-weight: var(--font-weight-medium);
  font-size: var(--text-small);
  cursor: pointer;
  transition: color 0.2s ease;
}

.btn-text:hover {
  color: var(--color-brand-orange);
}

.btn-text .btn-icon {
  color: var(--color-brand-orange);
}
```

### 8.2 Cards

Replace the app's white-bg + shadow cards with TFE-style bordered cards on cream backgrounds.

```css
.card {
  background: var(--color-white);
  border: var(--border-main);
  border-radius: var(--radius-small);
  overflow: hidden;
  transition: border-color 0.2s ease;
}

.card:hover {
  border-color: var(--color-brand-orange);
}

/* Card with image */
.card-visual {
  aspect-ratio: 3 / 2;
  overflow: hidden;
  border-radius: var(--radius-small);
}

.card-visual img {
  width: 100%;
  height: 100%;
  object-fit: cover;
  transition: transform 0.3s ease;
}

.card:hover .card-visual img {
  transform: scale(1.02);
}

.card-body {
  padding: var(--space-5);
}
```

### 8.3 Input Fields

```css
.input {
  width: 100%;
  min-height: 2.875rem;
  padding: var(--space-3) var(--space-4);
  border: var(--border-main);
  border-radius: var(--radius-xsmall);
  background: var(--color-white);
  font-family: var(--font-primary);
  font-size: var(--text-main);
  color: var(--color-black);
  transition: border-color 0.2s ease;
}

.input:focus {
  outline: none;
  border-color: var(--color-brand-orange);
}

.input::placeholder {
  color: var(--color-grey-100);
}
```

### 8.4 Tabs / Segmented Control

Replace the app's bottom-border tabs with TFE-style opacity-based tabs.

```css
.tabs {
  display: flex;
  gap: var(--space-6);
  padding-bottom: var(--space-4);
}

.tab {
  background: transparent;
  border: none;
  padding: var(--space-2) 0;
  font-family: var(--font-primary);
  font-weight: var(--font-weight-regular);
  font-size: var(--text-large);
  color: var(--color-black);
  opacity: 0.5;
  cursor: pointer;
  transition: opacity 0.2s ease;
}

.tab:hover {
  opacity: 0.75;
}

.tab.active {
  opacity: 1;
}
```

### 8.5 Badges & Tags (WordHighlight Evolution)

The app's `WordHighlight` (orange bg, black text) translates well to web. Keep it but add variants.

```css
.tag {
  display: inline-flex;
  align-items: center;
  padding: 0.25em 0.5em;
  font-family: var(--font-primary);
  font-weight: var(--font-weight-bold);
  font-size: var(--text-tiny);
  letter-spacing: var(--tracking-wide);
  text-transform: uppercase;
  line-height: 1;
}

.tag-orange {
  background: var(--color-brand-orange);
  color: var(--color-white);
}

.tag-yellow {
  background: var(--color-brand-yellow);
  color: var(--color-black);
}

.tag-outline {
  background: transparent;
  border: var(--border-main);
  color: var(--color-black);
}
```

---

## 9. Animation & Interaction System

### 9.1 Core Timing

Adopt TFE's transition timing as the standard. The site uses GSAP (3.14.2) for complex animations and CSS transitions for micro-interactions.

```css
:root {
  /* ── Timing ── */
  --duration-fast: 0.15s;       /* Micro: hover color, opacity */
  --duration-normal: 0.2s;      /* Standard: button state, border color */
  --duration-medium: 0.3s;      /* Moderate: panel open, nav transition */
  --duration-slow: 0.4s;        /* Emphasis: width changes, reveals */
  --duration-dramatic: 0.6s;    /* Major: menu open, page transitions */

  /* ── Easing ── */
  --ease-default: ease;
  --ease-out: cubic-bezier(0.25, 0.1, 0.25, 1);
  --ease-in-out: cubic-bezier(0.645, 0.045, 0.355, 1);  /* TFE's nav easing */
  --ease-spring: cubic-bezier(0.34, 1.56, 0.64, 1);      /* Bouncy for playful elements */
}
```

### 9.2 Hover Interactions

Every interactive element should have a hover state. This is the single biggest gap in the current FEGC web experience.

```css
/* ── Link hover (underline slide-in) ── */
.link {
  position: relative;
  text-decoration: none;
  color: var(--color-black);
  transition: color var(--duration-normal) var(--ease-default);
}

.link::after {
  content: '';
  position: absolute;
  bottom: 0;
  left: 0;
  width: 0;
  height: 1px;
  background: var(--color-brand-orange);
  transition: width var(--duration-medium) var(--ease-in-out);
}

.link:hover {
  color: var(--color-brand-orange);
}

.link:hover::after {
  width: 100%;
}

/* ── Card hover (lift + border color) ── */
.card {
  transition:
    border-color var(--duration-normal) var(--ease-default),
    transform var(--duration-normal) var(--ease-default);
}

.card:hover {
  border-color: var(--color-brand-orange);
  transform: translateY(-2px);
}

/* ── Image hover (subtle scale) ── */
.card-visual img {
  transition: transform var(--duration-medium) var(--ease-out);
}

.card:hover .card-visual img {
  transform: scale(1.03);
}

/* ── Nav item hover (background fill) ── */
.nav-list-item {
  transition: background-color var(--duration-normal) var(--ease-default);
}

.nav-list-item:hover {
  background: rgba(27, 26, 26, 0.06);
}

/* ── Avatar hover (orange ring) ── */
.avatar {
  border: 2px solid transparent;
  transition: border-color var(--duration-normal) var(--ease-default);
}

.avatar:hover {
  border-color: var(--color-brand-orange);
}
```

### 9.3 Navigation Animation (TFE Pattern)

The TFE nav menu unfolds from the top bar. Replicate this for the FEGC mobile/tablet nav:

```
1. Menu is invisible (opacity: 0, pointer-events: none)
2. User clicks hamburger toggle
3. Menu fill (cream bg with border) expands from nav bar height to full panel
4. Nav content fades in (opacity 0→1) with staggered delay on each item
5. Close reverses the sequence
```

**Implementation with GSAP** (TFE uses GSAP 3.14.2):
```javascript
// Install: npm install gsap
import gsap from 'gsap';

function openMenu() {
  const tl = gsap.timeline();

  // 1. Expand the menu fill
  tl.to('.nav-menu-fill', {
    height: 'auto',
    duration: 0.4,
    ease: 'power2.inOut',
  });

  // 2. Fade in content
  tl.to('.nav-menu-contain', {
    opacity: 1,
    pointerEvents: 'auto',
    duration: 0.3,
    ease: 'power2.out',
  }, '-=0.15');

  // 3. Stagger nav links
  tl.from('.nav-menu-link', {
    y: 20,
    opacity: 0,
    duration: 0.3,
    stagger: 0.05,
    ease: 'power2.out',
  }, '-=0.2');
}

function closeMenu() {
  const tl = gsap.timeline();

  tl.to('.nav-menu-link', { opacity: 0, duration: 0.15, stagger: 0.03 });
  tl.to('.nav-menu-contain', { opacity: 0, pointerEvents: 'none', duration: 0.2 });
  tl.to('.nav-menu-fill', { height: 'var(--nav-height)', duration: 0.3, ease: 'power2.inOut' });
}
```

### 9.4 Page/Section Transitions

Use GSAP ScrollTrigger for scroll-based animations (TFE does this):

```javascript
import { ScrollTrigger } from 'gsap/ScrollTrigger';
gsap.registerPlugin(ScrollTrigger);

// Fade-up for content sections
gsap.from('.section-content', {
  y: 40,
  opacity: 0,
  duration: 0.6,
  ease: 'power2.out',
  stagger: 0.1,
  scrollTrigger: {
    trigger: '.section-content',
    start: 'top 85%',
  },
});
```

### 9.5 Cursor

Add cursor: pointer to all interactive elements (the app currently has no hover cursors).

```css
a, button, [role="button"], .card, .nav-list-item, .tab, .avatar {
  cursor: pointer;
}
```

---

## 10. Specific Screen Adaptations

### 10.1 Feed / Newsfeed

**Current**: Single-column FlatList with ActivityItem cards, floating FAB, mobile LetterSpacedHeader.

**Web redesign:**
- Page-level Stanley heading ("Feed" or "Clubhouse") with section label
- 2-column layout on desktop: main feed (8 cols) + sidebar (4 cols)
- Sidebar: "Members to Follow" section, upcoming meetups, quick create buttons
- Cards: white bg, black border, cream page bg
- Inline create bar at top (already exists as DesktopCreateBar — restyle with new tokens)
- Remove FAB entirely; create actions live in the create bar and sidebar

### 10.2 Courses Directory

**Current**: FlatList with filter toolbar, list/map toggle, floating search.

**Web redesign:**
- Stanley heading "Courses"
- Full-width filter bar with TFE-style bordered filter pills
- Map view: full-width map with overlay list panel (not split view)
- List view: 3-column card grid (each card: image, name, location, review count)
- Cards use hover: border turns orange, image subtly scales
- Search: integrated into filter bar (not floating pill)

### 10.3 Course Detail

**Current**: Hero image, LetterSpacedHeader title, tab navigator (Reviews/Photos/Meetups).

**Web redesign:**
- Full-width hero image with gradient overlay
- Stanley Poster heading for course name
- WordHighlight tags for attributes (keep this component — it works well)
- TFE-style opacity tabs for Reviews/Photos/Meetups
- Two-column layout: content (8 cols) + sidebar (4 cols) with "At a Glance" card
- EggRating display with prominent placement in sidebar

### 10.4 Chat / Conversations

**Current**: Full-screen chat with custom message bubbles.

**Web redesign:**
- Master-detail layout: conversation list (4 cols) + active chat (8 cols)
- Messages in a scrollable container with proper web scrollbar styling
- Input bar at bottom of chat column with proper keyboard handling
- Hover states on messages for reaction/reply actions (not long-press)

### 10.5 Experiences

**Current**: Hero banner, featured packages, browse tiles.

**Web redesign:**
- This section should feel the most "editorial" — it's aspirational content
- Full-bleed hero with Stanley Poster headline
- Featured packages as large image cards in a 3-column grid
- Location pages use magazine-style layouts (asymmetric grid, large images)
- Booking flows use clean, focused single-column layouts with clear step progression

---

## 11. Implementation Checklist for Claude Code

### Phase 1: Foundation (do this first)
- [ ] Add CSS custom properties from this document to a global `web-theme.css` or theme constants file
- [ ] Download and register Stanley font files (`@font-face`)
- [ ] Update `Colors` constant: change `black` to `#1b1a1a`
- [ ] Add `cream` color `#f3f1e7` to the color constants
- [ ] Update `Fonts` web fallback stack to include `Stanley` for secondary
- [ ] Install GSAP: `npm install gsap`

### Phase 2: Navigation
- [ ] Replace `DesktopSidebar` with fixed top navigation bar
- [ ] Implement nav pill list (cream bg, black border, items as pills)
- [ ] Move notification/message/profile icons to nav bar right side
- [ ] Implement mobile hamburger menu with GSAP open/close animation
- [ ] Add orange active state for current nav item
- [ ] Add hover states to all nav items

### Phase 3: Typography & Headings
- [ ] Replace `LetterSpacedHeader` on web with section-label + Stanley heading pattern
- [ ] Apply Stanley to page-level headings (H1-H3)
- [ ] Apply Grey LL Bold to component-level headings (H4-H6)
- [ ] Update body text to use rem-based sizing from type scale

### Phase 4: Cards & Lists
- [ ] Update card components: white bg, black border, cream page bg
- [ ] Add hover states (border color change, subtle lift, image scale)
- [ ] Update list separators from lightGray to use border-main pattern
- [ ] Implement 2/3-column card grids for courses, meetups, groups

### Phase 5: Buttons & Inputs
- [ ] Restyle all buttons per the button system (primary/secondary/orange/text)
- [ ] Add hover transitions to all buttons
- [ ] Update input fields: black border, orange focus state
- [ ] Update tab/segmented controls to opacity-based pattern

### Phase 6: Layout & Spacing
- [ ] Implement 12-column grid system for desktop layouts
- [ ] Add sidebar patterns for feed, course detail, member profile
- [ ] Update section spacing to use section-spacing scale
- [ ] Implement master-detail pattern for conversations

### Phase 7: Animation & Polish
- [ ] Add GSAP-based scroll-triggered fade-up animations to sections
- [ ] Add hover underline animations to links
- [ ] Add cursor: pointer to all interactive elements
- [ ] Implement page transition animations between routes
- [ ] Polish form interactions (focus states, validation styling)

---

## 12. What NOT to Change

These elements should remain as-is from the FEGC app because they work well or serve a distinct purpose:

- **Orange brand color `#FE4D12`** — this IS the FEGC identity, don't change it
- **WordHighlight component** — works well for tags/attributes on web
- **EggRating component** — unique brand element, keep it
- **PassportBook/PassportStamp** — distinctive, keep the SVG stamps
- **Chat bubble pattern** — own messages black, others light gray works well
- **Custom SVG icons** — keep the golf-specific icon set
- **Supabase/Stripe integrations** — purely backend, no design impact
- **Data models and state management** — no change needed
- **Mobile tab bar** — keep floating pill for mobile web (< 767px)

---

## 13. Summary: The Design Bridge

The FEGC web experience sits at the intersection of two brands. Here's how each design decision creates that bridge:

| Design Element | From thefriedegg.com | From FEGC App | Bridge Effect |
|---|---|---|---|
| **Background** | Cream `#f3f1e7` | — | Warm editorial feel |
| **Text** | Near-black `#1b1a1a` | — | Softer, premium |
| **Borders** | Thin black borders | — | Printed, intentional quality |
| **Stanley font** | Display headings | — | Editorial DNA |
| **Grey LL** | Body text | All text | Shared foundation |
| **Orange `#FE4D12`** | Accent | Primary | Action-oriented CTAs |
| **Yellow `#FFEE54`** | Brand primary | Featured badge | Hover accents, brand echoes |
| **Hover states** | Full system | None currently | Web-native feel |
| **GSAP animations** | Nav, scroll reveals | — | Playful motion |
| **Top nav bar** | Fixed top nav | Sidebar | Web-standard pattern |
| **12-col grid** | Site grid | — | Multi-column layouts |
| **Card borders** | Border-first hierarchy | Shadow-first | Matches editorial aesthetic |
| **LetterSpacedHeader** | — | Orange block letters | Preserved as small section labels |

The result: a web experience that is unmistakably Fried Egg in its editorial warmth and typographic personality, unmistakably FEGC in its orange-accented action-oriented community features, and unmistakably web in its hover states, grid layouts, and navigation patterns.
