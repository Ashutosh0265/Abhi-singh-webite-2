# Eat. Lift. Run. x — Brand Typography, Spacing & Design System Guide
**Client Reference Document | Design Tokens, Spacing Scale & Content Architecture**

---

## 1. Design Vision & Brand Positioning

The **Eat. Lift. Run. x** website is engineered with an editorial, minimal, and high-performance visual aesthetic. It is built to communicate with precision, confidence, and calm authority.

### Core Principles
- **Visual First, Text Second:** Visitors understand the core message within 3–5 seconds through clear hierarchy.
- **Scannable Architecture:** Visual → Heading → Short description → Action.
- **Content Density Target:** ~30% text / ~70% structural, visual, and interactive whitespace.
- **Editorial Human Feel:** Clean typography, sharp borders, warm paper background tones, and deliberate contrast.

---

## 2. Typography System

### Primary Typefaces
1. **Primary Body & Interface Font:** **Schbisted Grotesk**
   - High legibility, neutral grotesk proportions, balanced x-height.
   - Fallback stack: `-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif`.
2. **Display & Editorial Heading Font:** **Cabinet Grotesk** / **Editorial Serif Accents**
   - Distinctive geometric character with strong editorial rhythm.

---

## 3. Global Responsive Typography Hierarchy

All font sizes, line heights, weights, and letter-spacing values across Desktop, Tablet, and Mobile devices follow this standardized scale:

| Element | Desktop Size | Tablet Size | Mobile Size | Weight | Line Height | Letter Spacing |
| :--- | :--- | :--- | :--- | :--- | :--- | :--- |
| **Page Display / H1** | `64px – 76px` | `52px – 60px` | `40px – 48px` | 600 – 700 | `0.98 – 1.05` | `-0.025em` |
| **Section Title / H2** | `42px – 52px` | `36px – 44px` | `30px – 36px` | 600 – 700 | `1.05 – 1.15` | `-0.02em` |
| **Subheading / H3** | `24px – 30px` | `22px – 26px` | `20px – 24px` | 600 | `1.15 – 1.25` | `-0.015em` |
| **Minor Header / H4** | `20px – 24px` | `18px – 22px` | `18px – 20px` | 600 | `1.20 – 1.30` | `0` |
| **Body Large (Lead)** | `18px – 20px` | `17px – 18px` | `16px – 17px` | 400 | `1.55 – 1.65` | `0` |
| **Body Regular** | `16px – 18px` | `16px – 17px` | `15px – 16px` | 400 | `1.55 – 1.70` | `0` |
| **Small Supporting** | `13px – 15px` | `13px – 14px` | `13px – 14px` | 400 – 500 | `1.40 – 1.50` | `+0.01em` |
| **Eyebrow / Section Label** | `12px – 14px` | `12px – 13px` | `12px` | 700 – 800 | `1.20 – 1.30` | `+0.10em` (Caps) |
| **Navigation Link** | `14px – 15px` | `14px` | `14px` | 500 – 600 | `1.20 – 1.30` | `0` |
| **Buttons & Action CTAs** | `14px – 16px` | `14px – 15px` | `14px` | 600 – 700 | `1.20 – 1.30` | `+0.02em` |

---

## 4. Line Length & Text Width Controls

To maintain optimal scanning comfort (50–75 characters per line), text containers are strictly bound by maximum measures:

| Content Block | Recommended Max-Width | Purpose |
| :--- | :--- | :--- |
| **Hero Tagline / Subtitle** | `480px – 600px` | Prevents long lines under large display titles |
| **Section Descriptions** | `500px – 650px` | Ensures comfortable scanning before content grids |
| **Editorial Prose / Paragraphs** | `520px – 680px` | Natural reading rhythm without eye strain |
| **Article Detail Body** | `640px – 720px` | Book-length reading readability |
| **Card Description Snippets** | `280px – 420px` | Compact previews on products and blog cards |

---

## 5. Spacing System Scale

The layout uses a mathematical 4px / 8px spacing scale across all components and containers:

```
4px   (0.25rem)  — Micro gaps, tight badge paddings
8px   (0.50rem)  — Small component gaps, icon spacing
12px  (0.75rem)  — Input padding, compact card gaps
16px  (1.00rem)  — Standard component padding, gutter base
24px  (1.50rem)  — Standard card padding, medium grid gaps
32px  (2.00rem)  — Large card padding, heading-to-body margin
40px  (2.50rem)  — Medium section sub-blocks, layout separators
48px  (3.00rem)  — Major card gaps, content block separation
64px  (4.00rem)  — Section breathing room, tablet section rhythm
80px  (5.00rem)  — Desktop section top/bottom padding
96px  (6.00rem)  — Major section break
120px (7.50rem)  — Maximum hero and page-wrap vertical spacing
```

---

## 6. Vertical Rhythm & Section Spacing

Consistent vertical breathing room gives the portfolio its premium, unhurried, editorial feel:

### Section Padding
- **Desktop (Viewport > 1024px):** `80px – 120px` vertical padding between sections.
- **Tablet (Viewport 768px – 1023px):** `64px – 96px` vertical padding.
- **Mobile (Viewport < 768px):** `48px – 72px` vertical padding.

### Stack Relationship
```
Section Eyebrow
  ↓ 12px – 16px
Section Heading (H2)
  ↓ 16px – 20px
Short Description (1–3 lines)
  ↓ 36px – 48px
Content / Grid / Visuals / Cards
  ↓ 32px – 40px
Action CTA Button (Optional)
```

---

## 7. Color System Tokens

The color palette is built around high contrast, warm neutral surfaces, and punchy athletic accents:

| Token Name | Hex Code | Visual Application |
| :--- | :--- | :--- |
| `--orange` | `#FF6200` | Primary brand accent, primary CTA buttons, active states, badges |
| `--black` | `#212121` | High-contrast text, borders, structural outlines, drop shadows |
| `--light-gray` | `#F6F6F4` | Global page background surface (warm off-white editorial paper) |
| `--white` | `#FFFFFF` | Card surfaces, modal containers, inputs, contrasting tiles |
| `--yellow` | `#FFE873` | Highlight underlines, secondary CTA buttons, callout boxes |
| `--border-color` | `#212121` | 1px or 1.5px solid tactile borders throughout layout |
| `--muted-gray` | `#6B7280` | Subtitle descriptions, secondary timestamps, metadata |

---

## 8. Button & Interactive Component Design

### Primary Action CTA (`btn-primary-yellow` / `.hero-cta-btn`)
- **Background:** Accent Yellow (`#FFE873`) or Radiant Orange (`#FF6200`)
- **Text:** Solid Black (`#212121`) or Pure White (`#FFFFFF`)
- **Border:** 1.5px solid `#212121`
- **Box Shadow:** `2px 2px 0 #212121`
- **Hover State:** `transform: translateY(-2px); box-shadow: 4px 4px 0 #212121;`
- **Active State:** `transform: translateY(1px); box-shadow: 1px 1px 0 #212121;`

### Editorial Link Buttons (e.g. "Read Full Essay →", "Get early access →")
- **Default State:** Black text with an Orange underline (`text-decoration-color: var(--orange)`), offset 4px.
- **Hover State:** Smooth color shift from black to radiant orange (`#FF6200`) with a `+5px` rightwards slide animation.

---

## 9. Editorial Rules & Punctuation Policy

1. **Hyphens vs Em Dashes:**
   - Standard hyphens (`-`) are strictly used across all headlines, subheads, essays, and metadata.
   - Em dashes (`—`) are completely prohibited to maintain a clean digital look.
2. **Heading Underlines:**
   - Hero headlines and major newsletter headers use the signature **Yellow Underline** (`text-decoration: underline; text-decoration-color: var(--yellow); text-decoration-thickness: 4px; text-underline-offset: 6px;`) across all lines for high-impact visual unity.
3. **No AI Clutter:**
   - Zero random floating blobs, excessive glassy gradients, neon glows, or arbitrary shapes. Every element has an editorial and functional purpose.

---

*Document version: 2.1 — Prepared for Eat. Lift. Run. x (Abhi Singh).*

