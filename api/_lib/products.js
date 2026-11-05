/**
 * Canonical Server-Side Product Catalog & Authoritative Price Resolver
 * NEVER TRUSTS CLIENT-SUPPLIED PRICES.
 */

export const CANONICAL_PRODUCTS = [
  {
    id: "habits-email-course",
    slug: "habits-for-physical-and-mental-strength",
    name: "Habits for Physical and Mental Strength",
    type: "free",
    price: "Free",
    priceAmount: 0,
    price_inr: 0,
    price_usd: 0,
    currency: "INR",
    category: "3-Day Email Course",
    format: "Email Course + PDF",
    tagline: "Build unshakeable daily movement habits that survive chaotic work schedules.",
    description: "A free 3-day primer on physical discipline, habit architecture, and mental resilience designed specifically for corporate professionals.",
    ctaText: "Get for FREE",
    file_url: "/assets/downloads/habits-for-physical-and-mental-strength.pdf",
    file_name: "habits-for-physical-and-mental-strength.pdf",
    downloadUrl: "/assets/downloads/habits-for-physical-and-mental-strength.pdf",
    status: "published",
    product_type: "digital_download",
    is_free: true,
  },
  {
    id: "boring-basics-book",
    slug: "24-boring-basics-for-peak-fitness",
    name: "24 Boring Basics for Peak Fitness",
    type: "paid",
    price: "₹499",
    priceAmount: 499,
    price_inr: 499,
    price_usd: 6,
    currency: "INR",
    category: "Book",
    format: "PDF (Digital Download)",
    tagline: "The fundamentals that actually move the needle when novelty wears off.",
    description: "24 tactical, evidence-based basics covering exercise science, sleep optimization, protein synthesis, and joint durability. Zero gimmicks.",
    ctaText: "Get for ₹499",
    file_url: "/assets/downloads/24-boring-basics-peak-fitness.pdf",
    file_name: "24-boring-basics-peak-fitness.pdf",
    downloadUrl: "/assets/downloads/24-boring-basics-peak-fitness.pdf",
    status: "published",
    product_type: "digital_download",
    is_free: false,
  },
  {
    id: "abhis-10-complexes",
    slug: "abhis-10-complexes",
    name: "Abhi's 10 Complexes",
    type: "paid",
    price: "₹499",
    priceAmount: 499,
    price_inr: 499,
    price_usd: 6,
    currency: "INR",
    category: "Program",
    format: "Complete PDF Program + Matrix",
    tagline: "10 field-tested kettlebell complexes for strength, muscle & endurance.",
    description: "The core Eat. Lift. Run. x system. 10 complete complexes designed for 30-minute sessions with single or double kettlebells. Includes the full Goal-Matching Matrix.",
    ctaText: "Get for ₹499",
    file_url: "/assets/downloads/abhis-10-kettlebell-complexes.pdf",
    file_name: "abhis-10-kettlebell-complexes.pdf",
    downloadUrl: "/assets/downloads/abhis-10-kettlebell-complexes.pdf",
    status: "published",
    product_type: "digital_download",
    is_free: false,
  },
  {
    id: "follow-along-cycles",
    slug: "follow-along-6-week-cycles",
    name: "Follow Along 6-Week Cycles",
    type: "paid",
    price: "₹3,999/mo",
    priceAmount: 3999,
    price_inr: 3999,
    price_usd: 49,
    currency: "INR",
    category: "Subscription",
    format: "Video Workouts + Weekly Coaching",
    tagline: "Structured 6-week progressive training cycles led by Abhi Singh.",
    description: "Continuous progressive training with video walkthroughs, form checks, community accountability, and monthly cycle updates.",
    ctaText: "Get for ₹3,999/mo",
    file_url: null,
    file_name: null,
    downloadUrl: "#subscribe-cycles",
    status: "published",
    product_type: "course",
    is_free: false,
  },
  {
    id: "play-the-long-game-mobility",
    slug: "play-the-long-game-mobility",
    name: "Play the Long Game with Better Mobility",
    type: "waitlist",
    price: "Coming Soon",
    priceAmount: 0,
    price_inr: 0,
    price_usd: 0,
    currency: "INR",
    category: "Program",
    format: "Mobility Protocol (Upcoming)",
    tagline: "Protect your hips, thoracic spine, and ankles for lifelong performance.",
    description: "A comprehensive joint-restoration framework designed to counteract the postural damage of corporate desk work.",
    ctaText: "Join the Waitlist",
    file_url: null,
    file_name: null,
    downloadUrl: "#waitlist-mobility",
    status: "draft",
    product_type: "digital_download",
    is_free: false,
  }
];

/**
 * Look up authoritative product by ID or slug
 * @param {string} productId
 * @returns {object|null}
 */
export function getProductById(productId) {
  if (!productId) return null;
  const cleanId = String(productId).trim().toLowerCase();
  return (
    CANONICAL_PRODUCTS.find(
      (p) => p.id.toLowerCase() === cleanId || (p.slug && p.slug.toLowerCase() === cleanId)
    ) || null
  );
}

/**
 * Check whether product has valid PDF attached
 * @param {object} product
 * @returns {boolean}
 */
export function hasValidPdfDeliverable(product) {
  if (!product) return false;
  if (product.product_type === 'course' || product.type === 'waitlist') return true;
  return Boolean(product.file_url || product.downloadUrl);
}

/**
 * Convert INR price to supported USD currency for PayPal
 * @param {number} priceInr
 * @returns {string} Formatted USD string
 */
export function inrToUsd(priceInr) {
  if (!priceInr || priceInr <= 0) return '0.00';
  // Standard conversion rate: 1 USD ≈ 83 INR, rounded to nearest 0.50
  const usd = Math.max(1, Math.round((priceInr / 83) * 2) / 2);
  return usd.toFixed(2);
}

