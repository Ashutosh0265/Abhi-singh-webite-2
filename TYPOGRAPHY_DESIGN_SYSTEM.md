# Typography Design System: Abhi Singh Brand & CMS

## 1. Design System Philosophy

This design system establishes a unified, editorial-grade typography hierarchy for **abhisingh.me** and its connected **CMS Admin Dashboard**.

It is directly informed by the deep browser inspection of the reference website (**https://noahkagan.com/**) while strictly honoring the project's locked typography rules, approved brand colors, and aesthetic identity:

- **Locked Serif Heading Font:** **Lora** (`font-weight: 500, 600, 700`)
- **Locked Sans-Serif Body & UI Font:** **Arial** (`font-weight: 400, 600, 700`)
- **Primary Text Color:** `#212121` (High-contrast, zero-glare off-black extracted directly from the reference website)
- **Brand Accents:** `#FF6200` (Orange), `#FFE785` (Yellow underline/highlight), `#000000` (Solid contrast black), `#FFFFFF` (White)

---

## 2. Centralized CSS Tokens (`:root`)

```css
:root {
  /* ── 1. Locked Font Families ── */
  --font-heading: "Lora", Georgia, "Times New Roman", serif;
  --font-body:    Arial, "Helvetica Neue", Helvetica, sans-serif;
  --font-display: var(--font-heading);
  --font-main:    var(--font-body);

  /* ── 2. Fluid Type Scale ── */
  --text-h1:       clamp(2.05rem, 1.45rem + 2.4vw, 3.25rem); /* ~42px to 58px */
  --text-h2:       clamp(1.6rem, 1.25rem + 1.4vw, 2.35rem);  /* ~30px to 40px (~65% of H1) */
  --text-h3:       clamp(1.2rem, 1.05rem + 0.6vw, 1.45rem);  /* ~20px to 23px */
  --text-h4:       1.15rem;                                   /* 18.4px */
  --text-h5:       1.05rem;                                   /* 16.8px */
  --text-h6:       0.95rem;                                   /* 15.2px */

  --text-lead:     1.15rem;                                   /* 18.4px editorial lead */
  --text-body:     1rem;                                      /* 16.0px base */
  --text-body-sm:  0.92rem;                                   /* 14.7px */
  --text-caption:  0.82rem;                                   /* 13.1px */
  --text-eyebrow:  0.75rem;                                   /* 12.0px uppercase */

  /* ── 3. Typographic Rhythm & Line Heights ── */
  --line-height-display:    1.15; /* Tight for large H1 hero headings */
  --line-height-heading:    1.20; /* Balanced for H2 section titles */
  --line-height-subheading: 1.28; /* For H3 card titles and H4 */
  --line-height-body:       1.60; /* Relaxed editorial reading pace */
  --line-height-dense:      1.40; /* Form inputs, buttons, badges */

  /* ── 4. Letter Spacing ── */
  --letter-spacing-h1:      -0.02em;
  --letter-spacing-h2:      -0.015em;
  --letter-spacing-h3:      -0.01em;
  --letter-spacing-body:    0;
  --letter-spacing-eyebrow: 0.08em;

  /* ── 5. Reading Width / Measures ── */
  --measure-prose:  68ch; /* 60-75 characters per line standard */
  --measure-narrow: 52ch;

  /* ── 6. Semantic Text Colors ── */
  --text-color:         #212121;
  --text-color-heading: #212121;
  --text-color-muted:   rgba(33, 33, 33, 0.72);
  --text-color-light:   #FFFFFF;
}
```

---

## 3. Typographic Hierarchy & Specifications

### Primary Headings (Lora Serif)

| Level | Token | Desktop Size | Mobile Size | Weight | Line Height | Letter Spacing | Margin Bottom | Usage |
|---|---|---|---|---|---|---|---|---|
| **H1** | `--text-h1` | `3.25rem` (52px) | `2.05rem` (33px) | 700 | 1.15 | `-0.02em` | `1.25rem` (20px) | Page Hero title (1 per page) |
| **H2** | `--text-h2` | `2.35rem` (37.6px) | `1.6rem` (25.6px) | 700 | 1.20 | `-0.015em` | `1.0rem` (16px) | Major Section headers |
| **H3** | `--text-h3` | `1.45rem` (23.2px) | `1.2rem` (19.2px) | 600 | 1.28 | `-0.01em` | `0.65rem` (10px) | Card titles, modal titles, subsection heads |
| **H4** | `--text-h4` | `1.15rem` (18.4px) | `1.15rem` (18.4px) | 600 | 1.30 | `0` | `0.5rem` (8px) | Widget headers, modal section heads |
| **H5** | `--text-h5` | `1.05rem` (16.8px) | `1.05rem` (16.8px) | 600 | 1.35 | `0` | `0.5rem` (8px) | Group headings |
| **H6** | `--text-h6` | `0.95rem` (15.2px) | `0.95rem` (15.2px) | 600 | 1.35 | `0` | `0.4rem` (6px) | Fine detail headers |

> **Critical Rule on Nested Elements:**
> `h1 *, h2 *, h3 *, h4 *, h5 *, h6 * { font-family: inherit !important; }`
> Highlighted spans (such as `.hero-highlight`) nested inside headings must NEVER inherit a sans-serif body font; they stay in Lora.

---

### Body, Prose & Content Blocks (Arial Sans-Serif)

| Role | Token | Font Size | Weight | Line Height | Max Width | Spacing |
|---|---|---|---|---|---|---|
| **Lead / Intro** | `--text-lead` | `1.15rem` (18.4px) | 400 | 1.60 | `68ch` | `margin-bottom: 1.25rem;` |
| **Standard Body** | `--text-body` | `1.00rem` (16.0px) | 400 | 1.60 | `68ch` | `margin-bottom: 1.00rem;` |
| **Small Body** | `--text-body-sm` | `0.92rem` (14.7px) | 400 | 1.55 | `68ch` | `margin-bottom: 0.75rem;` |
| **Caption / Meta** | `--text-caption` | `0.82rem` (13.1px) | 400 | 1.45 | `none` | `margin-bottom: 0.25rem;` |
| **Eyebrow / Badge** | `--text-eyebrow` | `0.75rem` (12.0px) | 700 | 1.20 | `none` | `letter-spacing: 0.08em; text-transform: uppercase;` |

---

### Interactive UI Elements (Arial Sans-Serif)

| UI Element | Size | Weight | Line Height | Transform | Notes |
|---|---|---|---|---|---|
| **Navigation Link** | `0.95rem` | 600 | 1.2 | Uppercase | Letter spacing `0.04em`, orange underline |
| **Nav Brand Logo** | `1.10rem` | 700 | 1.15 | Uppercase | Letter spacing `0.04em` |
| **Primary Button / CTA** | `1.00rem` | 700 | 1.2 | Capitalized / Upper | Consistent across header, hero, cards, and footer |
| **Form Input / Select** | `1.00rem` | 400 | 1.5 | None | Color `#212121`, placeholder `rgba(33,33,33,0.55)` |
| **Form Label** | `0.85rem` | 700 | 1.2 | Uppercase | Letter spacing `0.05em` |

---

## 4. CMS Admin Dashboard Alignment

The CMS Admin Dashboard shares the exact same typography system:
- **Dashboard Headers:** Lora 700 (`--text-h2` for top view titles, `--text-h3` for section card titles).
- **Table Headers & Labels:** Arial 700 (`0.82rem` uppercase with `0.05em` letter-spacing).
- **Table Data Cells & Form Controls:** Arial 400 (`0.95rem`–`1rem` with `line-height: 1.5`).
- **CMS Modals:** Follow public modal typography rules (Lora H3 titles, Arial body).
- **Rich Text Editor:** Renders headings in Lora and prose in Arial, giving the admin a 1:1 preview of how content will appear when published to the live public site.

---

## 5. Responsive Behavior Across Viewports

1. **Desktop (1280px–1440px):**
   - H1 displays at full `clamp` peak (`~52px`).
   - Hero grid: `320px minmax(560px, 1fr)` provides 560px–620px headline column width, allowing the 2-line headline to breathe without awkward single-word wrapping.
   - Lists (`.wi-list`) and Blog cards display in a clean 2-column grid (`repeat(2, 1fr)`).
2. **Tablet (768px–1024px):**
   - H1 scales fluidly to `~38px–44px`.
   - Sections scale vertical padding to `56px–64px`.
3. **Mobile (<768px):**
   - H1 scales fluidly to `~32px–34px` (preventing viewport takeover while retaining strong editorial presence).
   - Lists and blog cards stack naturally in a single column (`1fr`).
   - Modal padding compresses to `20px–24px` with full scrollability.
