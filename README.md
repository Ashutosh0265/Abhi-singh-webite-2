# Abhi Singh Website (abhisingh.me)

Official personal brand and digital product store website for **Abhi Singh (Abhimanyu VS)** — fitness and lifestyle coach, ACE Certified Personal Trainer (CPT).

---

## 1. Project Overview & Architecture

This project is built with **React** and **Vite**, adhering strictly to:
1. `BRAND_GUIDELINES.md` — 4 colors only (Orange, Yellow, White, Black; zero grey), 2 fonts only (Lora & Arial), yellow underlines on section titles, orange underlined links, yellow buttons for free items, orange buttons for paid items.
2. `CLIENT_REQUIREMENTS.md` — Strict 3 main pages (Home, E.L.R.x Store, Work With Me) plus Newsletter Archive, product-first hero, certificate hover popup, exit-intent newsletter popup, Zoho Campaigns source/UTM tracking, and Razorpay/PayPal ready checkout.
3. `DESIGN_INSTRUCTIONS.md` — Global center-aligned layout, generous white space (96–140px), responsive breakpoints (Mobile, Tablet, Desktop, TV).

---

## 2. Directory Structure

```text
├── public/
│   └── assets/
│       ├── avatar.png           # Abhi Singh nav avatar
│       ├── author-photo.png     # Author photo on book cover
│       ├── hyrox-mumbai.png     # HYROX Mumbai Farmer's Carry photo
│       └── certificate.svg      # Verified ACE CPT credential preview
├── src/
│   ├── components/
│   │   ├── BookCover.jsx        # 3D orange-themed Eat. Lift. Run. x book cover
│   │   ├── CertificateModal.jsx # ACE CPT credential hover/tap viewer
│   │   ├── CheckoutModal.jsx    # Product detail & checkout flow with email fulfillment
│   │   ├── Footer.jsx           # Clean minimal footer with brand links
│   │   ├── Navbar.jsx           # Sticky nav with mobile hamburger and CTA
│   │   └── NewsletterPopup.jsx  # 75% scroll & exit-intent modal with tracking
│   ├── data/
│   │   ├── newsletters.js       # Top 5 homepage editions + past archive editions
│   │   └── products.js          # Free & paid digital products + waitlist item
│   ├── pages/
│   │   ├── HomePage.jsx         # 7-section approved landing page flow
│   │   ├── StorePage.jsx        # Page 2: 3-column digital product store
│   │   ├── WorkWithMePage.jsx   # Page 3: Dedicated contact destination
│   │   └── NewsletterArchivePage.jsx # Archive listing + full edition reader
│   ├── utils/
│   │   └── tracking.js          # Zoho Campaigns UTM, tag, and timestamp handler
│   ├── App.jsx                  # Main application router and state management
│   ├── index.css                # Global design system tokens and strict rules
│   └── main.jsx                 # React root entry point
├── dist/                        # Production build ready for Hostinger
├── index.html                   # HTML entry point with AI SEO / AEO Schema.org
├── package.json
└── vite.config.js
```

---

## 3. How to Run Locally

### Prerequisites
- Node.js (v18+)

### Development Server
```bash
npm run dev
```
Open `http://localhost:3000` in your browser.

### Production Build
```bash
npm run build
```
The optimized static build is generated in the `dist/` directory.

### Preview Production Build
```bash
npm run preview
```

---

## 4. Deploying to Hostinger

Hostinger hosting accepts standard static website files:
1. Run `npm run build` locally.
2. In Hostinger hPanel, navigate to **File Manager** (or connect via SFTP/FTP).
3. Open the `public_html/` folder for `abhisingh.me`.
4. Upload all files and folders located inside the `dist/` directory directly into `public_html/`:
   - `index.html`
   - `assets/` (all JS, CSS, PNG, and SVG files)
5. Visit `https://abhisingh.me` to confirm the site is live.

---

## 5. Connecting External Services

- **Zoho Campaigns**: When API credentials or form webhook URLs are ready, configure the endpoint inside `src/utils/tracking.js` (`submitNewsletterSignup`). Form submissions already automatically collect `tag`, `timestamp`, `utm_source`, `utm_medium`, `utm_campaign`, and `referrer`.
- **Payment Gateway (Razorpay / PayPal)**: Connect client API keys inside `src/components/CheckoutModal.jsx` (`handleSubmit`). Multi-currency selection is already wired.

