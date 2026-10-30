import { supabase as defaultSupabase, isSupabaseConfigured, getSupabase, checkIsSupabaseConfigured } from './supabase.js';
import { products as initialProducts } from '../data/products.js';
import { initialNewsletters } from '../data/newsletters.js';

function getActiveSupabase() {
  if (checkIsSupabaseConfigured()) {
    return getSupabase();
  }
  return null;
}

const supabase = new Proxy({}, {
  get(target, prop) {
    const active = getActiveSupabase();
    if (!active) return undefined;
    const val = active[prop];
    return typeof val === 'function' ? val.bind(active) : val;
  }
});

// Local storage keys for hybrid persistence fallback
const STORAGE_KEYS = {
  PRODUCTS: 'elrx_db_products',
  POSTS: 'elrx_db_posts',
  MEDIA: 'elrx_db_media',
  LEADS: 'elrx_db_leads',
  CONTENT: 'elrx_db_content',
  ADMIN_SESSION: 'elrx_admin_session',
};

// Default initial media assets
const DEFAULT_MEDIA = [
  {
    id: 'med_ace_cert',
    name: 'ace-certificate.jpg',
    filePath: 'assets/ace-certificate.jpg',
    publicUrl: 'assets/ace-certificate.jpg',
    fileType: 'image/jpeg',
    fileSize: 94652,
    altText: 'ACE Certified Personal Trainer Certificate',
    createdAt: new Date().toISOString(),
  },
  {
    id: 'med_hyrox_patch',
    name: 'hyrox-patch.jpg',
    filePath: 'assets/hyrox-patch.jpg',
    publicUrl: 'assets/hyrox-patch.jpg',
    fileType: 'image/jpeg',
    fileSize: 162241,
    altText: 'HYROX Mumbai Open Singles Season Patch',
    createdAt: new Date().toISOString(),
  },
  {
    id: 'med_yoddha_medal',
    name: 'yoddha-medal.jpg',
    filePath: 'assets/yoddha-medal.jpg',
    publicUrl: 'assets/yoddha-medal.jpg',
    fileType: 'image/jpeg',
    fileSize: 149817,
    altText: 'The Yoddha Race Finisher Medal',
    createdAt: new Date().toISOString(),
  },
  {
    id: 'med_hyrox_mumbai',
    name: 'hyrox-mumbai.png',
    filePath: 'assets/hyrox-mumbai.png',
    publicUrl: 'assets/hyrox-mumbai.png',
    fileType: 'image/png',
    fileSize: 1540470,
    altText: "Abhi Singh at HYROX Mumbai Farmer's Carry",
    createdAt: new Date().toISOString(),
  },
  {
    id: 'med_author_photo',
    name: 'author-photo.png',
    filePath: 'assets/author-photo.png',
    publicUrl: 'assets/author-photo.png',
    fileType: 'image/png',
    fileSize: 239911,
    altText: 'Abhi Singh Author Photo',
    createdAt: new Date().toISOString(),
  },
  {
    id: 'med_avatar',
    name: 'avatar.png',
    filePath: 'assets/avatar.png',
    publicUrl: 'assets/avatar.png',
    fileType: 'image/png',
    fileSize: 239911,
    altText: 'Abhi Singh Avatar',
    createdAt: new Date().toISOString(),
  },
];

// Helper to seed or read local fallback store
function getLocalStore(key, defaultData) {
  try {
    const raw = localStorage.getItem(key);
    if (raw) return JSON.parse(raw);
    localStorage.setItem(key, JSON.stringify(defaultData));
    return defaultData;
  } catch (err) {
    console.warn(`[LocalStore] Read error for ${key}:`, err);
    return defaultData;
  }
}

function setLocalStore(key, data) {
  try {
    localStorage.setItem(key, JSON.stringify(data));
  } catch (err) {
    console.warn(`[LocalStore] Write error for ${key}:`, err);
  }
}

async function withTimeout(promise, ms = 3500) {
  let timeoutId;
  const timeoutPromise = new Promise((_, reject) => {
    timeoutId = setTimeout(() => reject(new Error('Database operation timed out')), ms);
  });
  return Promise.race([promise, timeoutPromise]).finally(() => clearTimeout(timeoutId));
}

// Normalized initial products list
const normalizedInitialProducts = initialProducts.map((p, idx) => ({
  id: p.id,
  title: p.name,
  slug: p.id,
  category: p.category || 'Book',
  short_description: p.tagline || p.description?.slice(0, 120),
  full_description: p.description || '',
  product_type: p.productType || (p.format?.includes('Skool') ? 'external_link' : 'digital_download'),
  format: p.format || 'PDF (Digital Download)',
  price_inr: p.priceAmount || 0,
  price_usd: Math.round((p.priceAmount || 0) / 80) || 0,
  is_free: p.type === 'free',
  type: p.type || (p.priceAmount > 0 ? 'paid' : 'free'),
  cover_image_url: p.coverUrl || 'assets/author-photo.png',
  file_url: p.downloadUrl || null,
  external_url: p.externalUrl || (p.id === 'prod_skool_guild' ? 'https://www.skool.com/elrx-guild' : null),
  status: p.type === 'waitlist' ? 'published' : 'published',
  badge: p.type === 'waitlist' ? 'Upcoming' : (p.priceAmount === 0 ? 'Free' : 'Popular'),
  whatInside: p.whatInside || [],
  sort_order: idx + 1,
  created_at: new Date().toISOString(),
  updated_at: new Date().toISOString(),
}));

// ============================================================================
// ============================================================================
// 1. PRODUCTS API
// ============================================================================
export async function getProducts(includeDrafts = false) {
  // Enforce server/client authorization: Only authenticated admin can view drafts
  const session = getAdminSession();
  const allowDrafts = Boolean(includeDrafts && session);

  if (getActiveSupabase()) {
    try {
      let query = supabase.from('products').select('*').order('sort_order', { ascending: true });
      if (!allowDrafts) {
        query = query.eq('status', 'published');
      }
      const { data, error } = await query;
      if (!error && data && data.length > 0) {
        return data;
      }
    } catch (err) {
      console.warn('[Supabase] Failed fetching products, falling back to local store:', err);
    }
  }

  // Fallback to local storage
  const stored = getLocalStore(STORAGE_KEYS.PRODUCTS, normalizedInitialProducts);
  return allowDrafts ? stored : stored.filter((p) => p.status === 'published');
}

export async function createProduct(productData) {
  const session = getAdminSession();
  if (!session) {
    throw new Error('Unauthorized: Valid administrator session required to create products.');
  }

  const newProduct = {
    ...productData,
    id: productData.id || `prod_${Date.now()}`,
    slug: productData.slug || (productData.title || productData.name || 'product').toLowerCase().replace(/[^a-z0-9]+/g, '-'),
    name: productData.title || productData.name,
    title: productData.title || productData.name,
    status: productData.status || 'published',
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  };

  if (getActiveSupabase()) {
    try {
      const { data, error } = await supabase.from('products').insert([newProduct]).select().single();
      if (!error && data) return data;
    } catch (err) {
      console.warn('[Supabase] Insert product error, storing locally:', err);
    }
  }

  const items = getLocalStore(STORAGE_KEYS.PRODUCTS, normalizedInitialProducts);
  const updated = [newProduct, ...items];
  setLocalStore(STORAGE_KEYS.PRODUCTS, updated);
  return newProduct;
}

export async function updateProduct(id, updates) {
  const session = getAdminSession();
  if (!session) {
    throw new Error('Unauthorized: Valid administrator session required to update products.');
  }

  const payload = {
    ...updates,
    updated_at: new Date().toISOString(),
  };

  if (getActiveSupabase()) {
    try {
      const { data, error } = await supabase.from('products').update(payload).eq('id', id).select().single();
      if (!error && data) return data;
    } catch (err) {
      console.warn('[Supabase] Update product error, updating locally:', err);
    }
  }

  const items = getLocalStore(STORAGE_KEYS.PRODUCTS, normalizedInitialProducts);
  const updated = items.map((p) => (p.id === id ? { ...p, ...payload } : p));
  setLocalStore(STORAGE_KEYS.PRODUCTS, updated);
  return updated.find((p) => p.id === id);
}

export async function deleteProduct(id) {
  const session = getAdminSession();
  if (!session) {
    throw new Error('Unauthorized: Valid administrator session required to delete products.');
  }

  if (getActiveSupabase()) {
    try {
      await supabase.from('products').delete().eq('id', id);
    } catch (err) {
      console.warn('[Supabase] Delete product error:', err);
    }
  }

  const items = getLocalStore(STORAGE_KEYS.PRODUCTS, normalizedInitialProducts);
  const filtered = items.filter((p) => p.id !== id);
  setLocalStore(STORAGE_KEYS.PRODUCTS, filtered);
  return true;
}

// ============================================================================
// 2. BLOG & ARCHIVE POSTS API
// ============================================================================
export async function getPosts(includeDrafts = false) {
  // Enforce server/client authorization: Only authenticated admin can view drafts
  const session = getAdminSession();
  const allowDrafts = Boolean(includeDrafts && session);

  if (getActiveSupabase()) {
    try {
      let query = supabase.from('posts').select('*').order('created_at', { ascending: false });
      if (!allowDrafts) {
        query = query.eq('status', 'published');
      }
      const { data, error } = await query;
      if (!error && data && data.length > 0) {
        return data;
      }
    } catch (err) {
      console.warn('[Supabase] Failed fetching posts, falling back to local store:', err);
    }
  }

  const stored = getLocalStore(STORAGE_KEYS.POSTS, initialNewsletters);
  return allowDrafts ? stored : stored.filter((p) => p.status === 'published');
}

export async function createPost(postData) {
  const session = getAdminSession();
  if (!session) {
    throw new Error('Unauthorized: Valid administrator session required to create posts.');
  }

  const newPost = {
    ...postData,
    id: postData.id || `post_${Date.now()}`,
    slug: postData.slug || (postData.title || 'post').toLowerCase().replace(/[^a-z0-9]+/g, '-'),
    status: postData.status || 'published',
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  };

  if (getActiveSupabase()) {
    try {
      const { data, error } = await supabase.from('posts').insert([newPost]).select().single();
      if (!error && data) return data;
    } catch (err) {
      console.warn('[Supabase] Insert post error, storing locally:', err);
    }
  }

  const posts = getLocalStore(STORAGE_KEYS.POSTS, initialNewsletters);
  const updated = [newPost, ...posts];
  setLocalStore(STORAGE_KEYS.POSTS, updated);
  return newPost;
}

export async function updatePost(id, updates) {
  const session = getAdminSession();
  if (!session) {
    throw new Error('Unauthorized: Valid administrator session required to update posts.');
  }

  const payload = {
    ...updates,
    updated_at: new Date().toISOString(),
  };

  if (getActiveSupabase()) {
    try {
      const { data, error } = await supabase.from('posts').update(payload).eq('id', id).select().single();
      if (!error && data) return data;
    } catch (err) {
      console.warn('[Supabase] Update post error, updating locally:', err);
    }
  }

  const posts = getLocalStore(STORAGE_KEYS.POSTS, initialNewsletters);
  const updated = posts.map((p) => (p.id === id ? { ...p, ...payload } : p));
  setLocalStore(STORAGE_KEYS.POSTS, updated);
  return updated.find((p) => p.id === id);
}

export async function deletePost(id) {
  const session = getAdminSession();
  if (!session) {
    throw new Error('Unauthorized: Valid administrator session required to delete posts.');
  }

  if (getActiveSupabase()) {
    try {
      await supabase.from('posts').delete().eq('id', id);
    } catch (err) {
      console.warn('[Supabase] Delete post error:', err);
    }
  }

  const posts = getLocalStore(STORAGE_KEYS.POSTS, initialNewsletters);
  const filtered = posts.filter((p) => p.id !== id);
  setLocalStore(STORAGE_KEYS.POSTS, filtered);
  return true;
}

// ============================================================================
// 3. MEDIA ASSETS API
// ============================================================================
const ALLOWED_MEDIA_EXTENSIONS = ['jpg', 'jpeg', 'png', 'webp', 'gif', 'avif', 'pdf'];
const ALLOWED_MEDIA_MIME_TYPES = [
  'image/jpeg',
  'image/png',
  'image/webp',
  'image/gif',
  'image/avif',
  'application/pdf',
];
const MAX_FILE_SIZE_BYTES = 10 * 1024 * 1024; // 10MB limit

export async function getMediaAssets() {
  if (getActiveSupabase()) {
    try {
      const { data, error } = await supabase.from('media_assets').select('*').order('created_at', { ascending: false });
      if (!error && data && data.length > 0) return data;
    } catch (err) {
      console.warn('[Supabase] Failed fetching media, using local store:', err);
    }
  }
  return getLocalStore(STORAGE_KEYS.MEDIA, DEFAULT_MEDIA);
}

export async function uploadMediaAsset(file, customAltText = '') {
  // Authorization check: Admin role required for file uploads
  const session = getAdminSession();
  if (!session) {
    throw new Error('Unauthorized: Administrator authentication required to upload media.');
  }

  if (!file) {
    throw new Error('Validation Error: No file provided.');
  }

  // Size limit validation (OWASP File Upload Protection)
  if (file.size > MAX_FILE_SIZE_BYTES) {
    throw new Error(`Validation Error: File size (${(file.size / (1024 * 1024)).toFixed(1)}MB) exceeds maximum limit of 10MB.`);
  }

  // Extension & MIME verification against strict allowlist
  const rawExt = (file.name || '').split('.').pop()?.toLowerCase();
  if (!ALLOWED_MEDIA_EXTENSIONS.includes(rawExt) || !ALLOWED_MEDIA_MIME_TYPES.includes(file.type)) {
    throw new Error('Validation Error: Disallowed file type. Permitted formats: JPEG, PNG, WEBP, GIF, AVIF, PDF.');
  }

  // Sanitize filename against directory traversal, null bytes, and malicious characters
  const cleanBase = (file.name || 'file')
    .replace(/\.[^/.]+$/, '')
    .replace(/[^a-zA-Z0-9_-]/g, '_')
    .slice(0, 40);
  const safeFileName = `${cleanBase}_${Date.now()}.${rawExt}`;

  // If Supabase Storage is configured, upload to 'media' bucket
  if (getActiveSupabase()) {
    try {
      const filePath = `uploads/${safeFileName}`;
      const { error: uploadError } = await supabase.storage.from('media').upload(filePath, file);

      if (!uploadError) {
        const { data: { publicUrl } } = supabase.storage.from('media').getPublicUrl(filePath);

        const assetRecord = {
          name: safeFileName,
          file_path: filePath,
          public_url: publicUrl,
          bucket: 'media',
          file_type: file.type,
          file_size: file.size,
          alt_text: customAltText || cleanBase,
          created_at: new Date().toISOString(),
        };

        const { data: insertedAsset } = await supabase.from('media_assets').insert([assetRecord]).select().single();
        if (insertedAsset) return insertedAsset;
      }
    } catch (err) {
      console.warn('[Supabase] Media upload failed, falling back to local base64/objectURL:', err);
    }
  }

  // Local fallback: generate base64/object URL
  return new Promise((resolve) => {
    const reader = new FileReader();
    reader.onload = () => {
      const assetRecord = {
        id: `med_${Date.now()}`,
        name: safeFileName,
        filePath: safeFileName,
        publicUrl: reader.result,
        fileType: file.type,
        fileSize: file.size,
        altText: customAltText || cleanBase,
        createdAt: new Date().toISOString(),
      };
      const existing = getLocalStore(STORAGE_KEYS.MEDIA, DEFAULT_MEDIA);
      const updated = [assetRecord, ...existing];
      setLocalStore(STORAGE_KEYS.MEDIA, updated);
      resolve(assetRecord);
    };
    reader.readAsDataURL(file);
  });
}

export async function deleteMediaAsset(id) {
  const session = getAdminSession();
  if (!session) {
    throw new Error('Unauthorized: Administrator authentication required to delete media.');
  }

  if (getActiveSupabase()) {
    try {
      await supabase.from('media_assets').delete().eq('id', id);
    } catch (err) {
      console.warn('[Supabase] Delete media error:', err);
    }
  }

  const existing = getLocalStore(STORAGE_KEYS.MEDIA, DEFAULT_MEDIA);
  const updated = existing.filter((m) => m.id !== id);
  setLocalStore(STORAGE_KEYS.MEDIA, updated);
  return true;
}

// ============================================================================
// 4. CRM LEADS & INQUIRIES API
// ============================================================================
export async function getLeads() {
  // Authorization check: Only authenticated administrators can read customer records
  const session = getAdminSession();
  if (!session) {
    console.warn('[Security] Unauthorized access to CRM leads blocked.');
    return [];
  }

  if (getActiveSupabase()) {
    try {
      const { data, error } = await supabase.from('leads').select('*').order('created_at', { ascending: false });
      if (!error && data) return data;
    } catch (err) {
      console.warn('[Supabase] Failed fetching leads, reading local store:', err);
    }
  }
  return getLocalStore(STORAGE_KEYS.LEADS, []);
}

export async function createLead(leadData) {
  // Public submissions for contact form and newsletter are permitted
  const newLead = {
    ...leadData,
    id: leadData.id || `lead_${Date.now()}`,
    status: leadData.status || 'new',
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  };

  if (getActiveSupabase()) {
    try {
      const { data, error } = await supabase.from('leads').insert([newLead]).select().single();
      if (!error && data) return data;
    } catch (err) {
      console.warn('[Supabase] Insert lead error, recording locally:', err);
    }
  }

  const leads = getLocalStore(STORAGE_KEYS.LEADS, []);
  const updated = [newLead, ...leads];
  setLocalStore(STORAGE_KEYS.LEADS, updated);
  return newLead;
}

export async function updateLeadStatus(id, newStatus) {
  const session = getAdminSession();
  if (!session) {
    throw new Error('Unauthorized: Administrator authentication required to update lead status.');
  }

  if (getActiveSupabase()) {
    try {
      const { data, error } = await supabase
        .from('leads')
        .update({ status: newStatus, updated_at: new Date().toISOString() })
        .eq('id', id)
        .select()
        .single();
      if (!error && data) return data;
    } catch (err) {
      console.warn('[Supabase] Update lead status error:', err);
    }
  }

  const leads = getLocalStore(STORAGE_KEYS.LEADS, []);
  const updated = leads.map((l) => (l.id === id ? { ...l, status: newStatus, updated_at: new Date().toISOString() } : l));
  setLocalStore(STORAGE_KEYS.LEADS, updated);
  return updated.find((l) => l.id === id);
}

export async function deleteLead(id) {
  const session = getAdminSession();
  if (!session) {
    throw new Error('Unauthorized: Administrator authentication required to delete leads.');
  }

  if (getActiveSupabase()) {
    try {
      await supabase.from('leads').delete().eq('id', id);
    } catch (err) {
      console.warn('[Supabase] Delete lead error:', err);
    }
  }

  const leads = getLocalStore(STORAGE_KEYS.LEADS, []);
  const updated = leads.filter((l) => l.id !== id);
  setLocalStore(STORAGE_KEYS.LEADS, updated);
  return true;
}

// ============================================================================
// 5. SITE CONTENT API (Controlled fields)
// ============================================================================
const DEFAULT_SITE_CONTENT = {
  hero: {
    headline: 'Train your strength, muscle & endurance every day',
    subheadline: "I'm an ordinary guy — sales professional, not an athlete — who figured out a simple kettlebell system that fits around a full life.",
    bookTitle: 'Eat. Lift. Run. x',
    bookSubtitle: '10 KETTLEBELL COMPLEXES FOR EVERYDAY PEOPLE',
    ctaText: 'Get the complexes →',
  },
  credentials: {
    yoddha: {
      title: 'The Yoddha Race',
      subtitle: 'Finisher Medal · The Ultimate Fitness Challenge',
      image: '/assets/yoddha-medal.jpg',
    },
    hyrox: {
      title: 'HYROX Mumbai',
      subtitle: 'Official Open Singles Patch · 2026/2027',
      image: '/assets/hyrox-patch.jpg',
    },
    ace: {
      title: 'American Council on Exercise',
      subtitle: 'Certified Personal Trainer · NCCA Accredited',
      image: '/assets/ace-certificate.jpg',
    },
  },
};

export async function getSiteContent() {
  if (getActiveSupabase()) {
    try {
      const { data, error } = await supabase.from('site_content').select('*');
      if (!error && data && data.length > 0) {
        const mapped = {};
        data.forEach((row) => {
          mapped[row.key] = row.data;
        });
        return { ...DEFAULT_SITE_CONTENT, ...mapped };
      }
    } catch (err) {
      console.warn('[Supabase] Failed fetching site content, using default:', err);
    }
  }
  return getLocalStore(STORAGE_KEYS.CONTENT, DEFAULT_SITE_CONTENT);
}

export async function updateSiteContent(key, data) {
  const session = getAdminSession();
  if (!session) {
    throw new Error('Unauthorized: Administrator authentication required to update site content.');
  }

  if (getActiveSupabase()) {
    try {
      await supabase
        .from('site_content')
        .upsert({ key, data, updated_at: new Date().toISOString() });
    } catch (err) {
      console.warn('[Supabase] Upsert site content error:', err);
    }
  }

  const current = getLocalStore(STORAGE_KEYS.CONTENT, DEFAULT_SITE_CONTENT);
  const updated = { ...current, [key]: data };
  setLocalStore(STORAGE_KEYS.CONTENT, updated);
  return updated;
}

// ============================================================================
// 6. DASHBOARD OVERVIEW METRICS
// ============================================================================
export async function getDashboardMetrics() {
  const session = getAdminSession();
  if (!session) {
    console.warn('[Security] Unauthorized access to dashboard metrics blocked.');
    return {
      totalProducts: 0,
      publishedProducts: 0,
      draftProducts: 0,
      totalPosts: 0,
      publishedPosts: 0,
      draftPosts: 0,
      totalLeads: 0,
      newLeads: 0,
      recentActivity: [],
    };
  }

  const [products, posts, leads] = await Promise.all([
    getProducts(true),
    getPosts(true),
    getLeads(),
  ]);

  const publishedProducts = products.filter((p) => p.status === 'published').length;
  const draftProducts = products.filter((p) => p.status === 'draft').length;
  const publishedPosts = posts.filter((p) => p.status !== 'draft').length;
  const draftPosts = posts.filter((p) => p.status === 'draft').length;
  const totalLeads = leads.length;
  const newLeads = leads.filter((l) => l.status === 'new').length;

  return {
    totalProducts: products.length,
    publishedProducts,
    draftProducts,
    totalPosts: posts.length,
    publishedPosts,
    draftPosts,
    totalLeads,
    newLeads,
    recentActivity: [
      ...leads.slice(0, 4).map((l) => ({
        type: l.lead_type === 'contact_inquiry' ? 'Inquiry' : 'Signup',
        title: `${l.name || l.email} - ${l.lead_type === 'contact_inquiry' ? 'Work With Me' : 'Newsletter'}`,
        time: l.created_at,
      })),
      ...products.slice(0, 3).map((p) => ({
        type: 'Product',
        title: `${p.title || p.name} (${p.status})`,
        time: p.updated_at || p.created_at,
      })),
    ].sort((a, b) => new Date(b.time) - new Date(a.time)).slice(0, 6),
  };
}

// ============================================================================
// 7. ADMIN AUTHENTICATION (Hardened against Brute Force & Secret Exposure)
// ============================================================================

// Secret cryptographic salt for PBKDF2 offline fallback authentication
const AUTH_SALT = 'elrx_abhi_singh_sec_salt_2026';

// PBKDF2 100,000-iteration SHA-256 hashes of authorized administrative credentials
// Plaintext passwords are NEVER stored in source code or client bundles.
const AUTHORIZED_CREDENTIAL_HASHES = [
  '023baf26a152974af18032c47cb3e36d858c5e9071c3162ac1c3167dec89ba18', // Primary Admin 2026
  'b7165a7cd8f03e3613ca5cfe542fabebd5c59de0a4a405266ab8cb08b9df3489', // Secondary Rotation Hash
];

// In-memory rate limiting and brute force protection
let failedAttemptsCount = 0;
let lockoutExpiryTimestamp = 0;

/**
 * Computes salted PBKDF2 SHA-256 hash using Web Crypto API
 */
async function computePasswordHash(password, salt) {
  try {
    if (typeof crypto !== 'undefined' && crypto.subtle) {
      const enc = new TextEncoder();
      const keyMaterial = await crypto.subtle.importKey(
        'raw',
        enc.encode(password),
        { name: 'PBKDF2' },
        false,
        ['deriveBits']
      );
      const derivedBits = await crypto.subtle.deriveBits(
        {
          name: 'PBKDF2',
          salt: enc.encode(salt),
          iterations: 100000,
          hash: 'SHA-256',
        },
        keyMaterial,
        256
      );
      return Array.from(new Uint8Array(derivedBits))
        .map((b) => b.toString(16).padStart(2, '0'))
        .join('');
    }
  } catch (err) {
    console.warn('[Crypto] PBKDF2 derivation warning:', err);
  }
  return '';
}

/**
 * Generates a cryptographically strong session token via CSPRNG
 */
function generateCSPRNGToken() {
  if (typeof crypto !== 'undefined' && crypto.getRandomValues) {
    const bytes = new Uint8Array(32);
    crypto.getRandomValues(bytes);
    return Array.from(bytes).map((b) => b.toString(16).padStart(2, '0')).join('');
  }
  return `sec_auth_${Date.now()}`;
}

export async function adminLogin(email, password) {
  const now = Date.now();
  // Brute force lockout check: 5 failed attempts = 60s cooldown
  if (lockoutExpiryTimestamp > now) {
    const remainingSecs = Math.ceil((lockoutExpiryTimestamp - now) / 1000);
    return {
      success: false,
      error: `Too many failed login attempts. Account temporarily locked. Please wait ${remainingSecs} seconds.`,
    };
  }

  // Strict input hygiene
  const cleanEmail = (email || '').trim().toLowerCase();
  const cleanPass = (password || '').trim();

  if (!cleanEmail || !cleanPass) {
    return {
      success: false,
      error: 'Please enter both email and password.',
    };
  }

  // Primary Path: Supabase Auth server-side verification
  if (getActiveSupabase()) {
    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email: cleanEmail,
        password: cleanPass,
      });

      if (!error && data?.session) {
        // Verify administrator authorization in admin_users table
        const { data: adminRecord } = await supabase
          .from('admin_users')
          .select('role, full_name')
          .eq('id', data.user.id)
          .single();

        const session = {
          user: {
            id: data.user.id,
            email: data.user.email,
            fullName: adminRecord?.full_name || 'Abhi Singh',
            role: adminRecord?.role || 'admin',
          },
          token: data.session.access_token,
          expiresAt: data.session.expires_at,
        };

        // Reset brute-force counter on success
        failedAttemptsCount = 0;
        lockoutExpiryTimestamp = 0;

        sessionStorage.setItem(STORAGE_KEYS.ADMIN_SESSION, JSON.stringify(session));
        return { success: true, session };
      }
    } catch (err) {
      console.warn('[Supabase Auth] Sign in error:', err);
    }
  }

  // Secondary Path: Salted PBKDF2 hash comparison (Offline Fallback)
  const isAuthorizedEmail =
    cleanEmail === 'abhi@abhisingh.me' ||
    cleanEmail === 'admin@abhisingh.me' ||
    cleanEmail === 'abhi';

  if (isAuthorizedEmail) {
    const computedHash = await computePasswordHash(cleanPass, AUTH_SALT);
    const isValidHash = AUTHORIZED_CREDENTIAL_HASHES.includes(computedHash);

    if (isValidHash) {
      // Reset rate-limiting counter
      failedAttemptsCount = 0;
      lockoutExpiryTimestamp = 0;

      const session = {
        user: {
          id: 'admin_abhi_singh',
          email: cleanEmail.includes('@') ? cleanEmail : 'abhi@abhisingh.me',
          fullName: 'Abhi Singh',
          role: 'super_admin',
        },
        token: generateCSPRNGToken(),
        expiresAt: Date.now() + 86400000, // 24 hours
      };
      sessionStorage.setItem(STORAGE_KEYS.ADMIN_SESSION, JSON.stringify(session));
      return { success: true, session };
    }
  }

  // Record failed attempt for rate limiting
  failedAttemptsCount += 1;
  if (failedAttemptsCount >= 5) {
    lockoutExpiryTimestamp = Date.now() + 60000; // 60-second cooldown
    failedAttemptsCount = 0;
    return {
      success: false,
      error: 'Too many consecutive failed login attempts. Temporarily locked out for 60 seconds.',
    };
  }

  return {
    success: false,
    error: 'Invalid email or password. Please verify credentials.',
  };
}

export function getAdminSession() {
  try {
    const raw = sessionStorage.getItem(STORAGE_KEYS.ADMIN_SESSION);
    if (!raw) return null;
    const session = JSON.parse(raw);
    // Verify session expiration
    if (session.expiresAt && Date.now() > session.expiresAt) {
      sessionStorage.removeItem(STORAGE_KEYS.ADMIN_SESSION);
      return null;
    }
    return session;
  } catch {
    return null;
  }
}

export async function adminLogout() {
  if (getActiveSupabase()) {
    try {
      await supabase.auth.signOut();
    } catch (err) {
      console.warn('[Supabase Auth] Sign out error:', err);
    }
  }
  sessionStorage.removeItem(STORAGE_KEYS.ADMIN_SESSION);
}

