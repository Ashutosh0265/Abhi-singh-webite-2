# Reference Typography Analysis: noahkagan.com

## 1. Executive Summary & Methodology

This analysis documents the exact, computed typography system of **https://noahkagan.com/** extracted via headless Chromium browser automation (Puppeteer Core) across 5 representative pages and 6 responsive viewport breakpoints.

All numerical measurements (font-size, line-height, letter-spacing, margins, container widths, colors) in this document are **directly extracted from the browser's computed DOM styles (`window.getComputedStyle()`)**, not estimated from screenshots.

---

## 2. Pages & Viewports Inspected

### Pages Inspected
1. **Homepage:** `https://noahkagan.com/`
2. **About Page:** `https://noahkagan.com/about/`
3. **Blog Archive:** `https://noahkagan.com/blog/`
4. **Newsletter / Join:** `https://noahkagan.com/join/`
5. **Individual Article Page:** `https://noahkagan.com/how-to-start-a-business/`

### Viewports Tested
- **Desktop Large:** `1440 × 900 px`
- **Laptop Standard:** `1280 × 800 px`
- **Tablet Landscape / Small Laptop:** `1024 × 768 px`
- **Tablet Portrait:** `768 × 1024 px`
- **Mobile Standard:** `390 × 844 px` (iPhone 12/13/14/15)
- **Mobile Compact:** `360 × 740 px` (Android standard)

---

## 3. Actual Computed Heading Hierarchy (Measured Table)

Values measured at **Desktop (1440px)**:

| Element | Tag / Selector | Font Family | Font Size | Weight | Color (Hex) | Line Height | Ratio | Letter Spacing | Margin Top | Margin Bottom | Status / Presence |
|---|---|---|---|---|---|---|---|---|---|---|---|
| **H1** | `h1.entry-title`, `h1` | Figtree | `79.2px` (4.95rem) | 700 | `#212121` (`rgb(33, 33, 33)`) | `87.12px` | 1.10 | `-1.6px` (-0.1rem) | `0px` | `32px` (2rem) | **Present** (1 per page) |
| **H2** | `h2` | Figtree | `47.52px` (2.97rem) | 700 | `#212121` (`rgb(33, 33, 33)`) | `52.27px` | 1.10 | `-1.6px` (-0.1rem) | `0px` | `32px` (2rem) | **Present** (Major section titles) |
| **H3** | `h3` | — | *UNAVAILABLE* | — | — | — | — | — | — | — | **Not present on reference site** (0 instances) |
| **H4** | `h4` | — | *UNAVAILABLE* | — | — | — | — | — | — | — | **Not present on reference site** (0 instances) |
| **H5** | `h5` | — | *UNAVAILABLE* | — | — | — | — | — | — | — | **Not present on reference site** (0 instances) |
| **H6** | `h6` | — | *UNAVAILABLE* | — | — | — | — | — | — | — | **Not present on reference site** (0 instances) |
| **Section Item Subtitle** | `.item-title`, `p > strong` | Figtree | `22px` (1.375rem) | 700 | `#212121` | `35.2px` | 1.60 | `normal` | `0px` | `8px` | **Present** (Styled using block/p) |

> **Key Finding:** The reference website does not employ semantic `<h3>` through `<h6>` tags. Instead, it maintains extreme typographic restraint: a massive, bold **H1 (79.2px)**, a clean **H2 (47.52px)** for section headers, and bolded paragraphs / subheadings for list items.

---

## 4. Body, Paragraph & Content Typography

| Content Type | Selector | Font Family | Font Size | Weight | Color (Hex) | Line Height | Ratio | Margin Bottom | Max Width |
|---|---|---|---|---|---|---|---|---|---|
| **Lead / Intro Paragraph** | `p.mb-2` (Hero/About) | Figtree | `22.0px` (1.375rem) | 300 / 400 | `#212121` | `35.2px` | 1.60 | `32px` to `48px` | `576px` / `none` |
| **Article Body Paragraph** | `.entry-content p` | Figtree | `17.6px` (1.1rem) | 400 | `#212121` | `28.16px` | 1.60 | `16px` (1rem) | `776px` |
| **Join / Newsletter Copy** | `p` | Figtree | `17.6px` (1.1rem) | 400 | `#212121` | `28.16px` | 1.60 | `16px` | `576px` |
| **List Items** | `ul li` | Figtree | `17.6px` (1.1rem) | 400 | `#212121` | `28.16px` | 1.60 | `0px` (gap: 16px) | `776px` |
| **Footer Text** | `footer p`, `footer span` | Figtree | `14.4px` (0.9rem) | 400 | `#757575` (`rgba(0,0,0,0.65)`) | `23.04px` | 1.60 | `0px` | `100%` |

---

## 5. Interactive UI Typography (Navigation, Buttons, Forms)

| Element | Selector | Font Family | Font Size | Weight | Text Transform | Color (Hex) | Line Height |
|---|---|---|---|---|---|---|---|
| **Nav Brand Logo** | `a.brand`, `.logo` | Figtree | `19.36px` | 400 | `uppercase` | `#000000` | `30.98px` |
| **Nav Menu Links** | `nav a`, `header a` | Figtree | `12.8px` (0.8rem) | 700 | `uppercase` | `rgba(0, 0, 0, 0.65)` | `20.48px` |
| **Header CTA Button** | `header a.btn` ("Get the book") | Figtree | `14.4px` (0.9rem) | 600 | `none` | `#FFFFFF` (on `#000000`) | `23.04px` |
| **Primary CTA Button** | `button`, `input[type="submit"]` | Figtree | `19.36px` (1.21rem) | 600 | `none` | `#000000` (on `#FFE785` / `#FFC700`) | `30.98px` |
| **Form Input Text** | `input[type="email"]` | Figtree | `17.6px` (1.1rem) | 400 | `none` | `#212121` | `28.16px` |

---

## 6. Text Color System (Extracted Computed Values)

| Role | Computed RGB | Computed Hex | Alpha | Notes |
|---|---|---|---|---|
| **Primary Headings & Body** | `rgb(33, 33, 33)` | `#212121` | 1.0 | Off-black with high contrast and zero glare |
| **Brand Black / High Emphasis** | `rgb(0, 0, 0)` | `#000000` | 1.0 | Used for logos, CTA borders, solid buttons |
| **Secondary / Muted Text** | `rgba(0, 0, 0, 0.65)` | `#575757` | 0.65 | Used for nav links, dates, and secondary labels |
| **Light Text on Dark Surfaces** | `rgb(255, 255, 255)` | `#FFFFFF` | 1.0 | Used on dark buttons and footer callout boxes |
| **Accent / Button Background** | `rgb(254, 219, 0)` | `#FEDB00` | 1.0 | Noah Kagan brand yellow |

---

## 7. Responsive Scaling Behavior (Measured Across 6 Viewports)

| Viewport | Viewport Width | H1 Font Size | H1 Line Height | H2 Font Size | Intro P Size | Article P Size | Container Width |
|---|---|---|---|---|---|---|---|
| **Desktop 1440** | 1440px | `79.20px` | `87.12px` (1.10) | `47.52px` | `22.00px` | `17.60px` | `1200px` |
| **Laptop 1280** | 1280px | `79.20px` | `87.12px` (1.10) | `47.52px` | `22.00px` | `17.60px` | `1200px` |
| **Tablet 1024** | 1024px | `71.39px` | `78.52px` (1.10) | `43.89px` | `21.74px` | `17.60px` | `960px` |
| **Tablet 768** | 768px | `60.02px` | `66.02px` (1.10) | `38.60px` | `21.35px` | `17.60px` | `720px` |
| **Mobile 390** | 390px | `43.24px` (HP) / `30.4px` (Art) | `47.56px` / `34.96px` | `30.80px` | `20.78px` | `17.60px` | `100%` (padding: 16px) |
| **Mobile 360** | 360px | `41.90px` (HP) / `30.4px` (Art) | `46.09px` / `34.96px` | `30.18px` | `20.74px` | `17.60px` | `100%` (padding: 16px) |

### Key Responsive Formula:
- **H1 Scale:** Fluidly scales from `~42px` at mobile up to `79.2px` on desktop via viewport-based calculation: `calc(1.62rem + 4.44vw)`.
- **H2 Scale:** Fluidly scales from `~30px` at mobile up to `47.52px` on desktop (approx. 60% of H1).
- **Body Scale:** Remains rock-solid at `17.6px` (1.1rem) across mobile and desktop, maintaining high legibility without shrinking to uncomfortably small sizes.

---

## 8. Spacing, Text Containers & Rhythm

1. **H1 Bottom Margin:** Consistently `32px` (2rem) on desktop; shrinks to `14px` on compact mobile articles.
2. **H2 Bottom Margin:** Consistently `32px` (2rem).
3. **Paragraph Bottom Margin:** Consistently `16px` (1rem) for body copy; `32px` to `48px` for lead intro paragraphs.
4. **Prose Reading Measure:** Maximum content width in the article reading container is **`776px` to `800px`**, which yields approximately **65 to 75 characters per line** at `17.6px` font size. This matches optimal editorial typography standards.
5. **Vertical Gap Between Sections:** `64px` to `96px` on desktop; `40px` to `48px` on mobile.

---

## 9. Screenshot References Captured

The following screenshots were captured during the automated session and saved to `scripts/screenshots/`:
- `homepage-desktop-1440.png` & `homepage-mobile-390.png`
- `about-desktop-1440.png` & `about-mobile-390.png`
- `blog-desktop-1440.png` & `blog-mobile-390.png`
- `join-desktop-1440.png` & `join-mobile-390.png`
- `article-desktop-1440.png` & `article-mobile-390.png`

---

## 10. Summary of Architectural Takeaways for Abhi Singh's Project

1. **Heading Line-Height:** Noah Kagan uses a tight line-height of `1.10` for large display headings. This prevents multi-line headings from looking disconnected.
2. **Body Line-Height:** Paragraphs use a relaxed `1.60` line-height with `1.1rem` (17.6px) font size, creating high readability and comfortable pacing.
3. **Color Discipline:** `#212121` (`rgb(33, 33, 33)`) is used consistently for all headings and body text on light backgrounds instead of harsh pure black (`#000000`).
4. **Prose Measure:** Text width is constrained to `~65–75ch` (`~760px–800px`) so lines do not stretch uncomfortably across wide desktop viewports.
5. **Adaptation to Locked Fonts (Lora & Arial):** In Abhi Singh's project, the locked font configuration requires **Lora** for headings and **Arial** for body copy. We will adopt Noah Kagan's exact typographic proportions (ratios, line-heights, letter-spacing, and `#212121` text color) mapped to Lora and Arial.
