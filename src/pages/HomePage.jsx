import React, { useState, useEffect } from 'react';
import BookCover from '../components/BookCover';
import CredentialPreview from '../components/CredentialPreview';
import AboutGallery from '../components/AboutGallery';
import { initialNewsletters } from '../data/newsletters';
import { getPosts } from '../services/db';
import DOMPurify from 'dompurify';
import { submitNewsletterSignup } from '../utils/tracking';
import useScrollReveal from '../hooks/useScrollReveal';

export default function HomePage({ onNavigate, onOpenCertificate }) {
  useScrollReveal([]);
  const [heroEmail, setHeroEmail] = useState('');
  const [footerEmail, setFooterEmail] = useState('');
  const [heroSignupStatus, setHeroSignupStatus] = useState(null);
  const [footerSignupStatus, setFooterSignupStatus] = useState(null);
  const [isSubmittingHero, setIsSubmittingHero] = useState(false);
  const [isSubmittingFooter, setIsSubmittingFooter] = useState(false);
  const [posts, setPosts] = useState(initialNewsletters);
  const [activeArticle, setActiveArticle] = useState(null);
  const [visiblePostCount, setVisiblePostCount] = useState(4);

  useEffect(() => {
    let isMounted = true;
    async function loadLivePosts() {
      try {
        const live = await getPosts(false);
        if (isMounted && live && live.length > 0) {
          const normalized = live.map((n) => ({
            id: n.id,
            title: n.title,
            category: n.category || 'Framework',
            date: n.published_date || n.date || 'October 2026',
            readTime: n.read_time || n.readTime || '4 min read',
            summary: n.summary || '',
            content: n.content || '',
            thumbnail: n.thumbnail_url || n.thumbnail || '/assets/author-photo.png',
            status: n.status || 'published',
            slug: n.slug,
          }));
          setPosts(normalized);
        }
      } catch (err) {
        console.warn('[HomePage] Failed fetching live posts, using static fallback:', err);
      }
    }
    loadLivePosts();
    return () => { isMounted = false; };
  }, []);

  const handleHeroSignup = async (e) => {
    e.preventDefault();
    if (!heroEmail || !heroEmail.includes('@')) return;

    setIsSubmittingHero(true);
    await submitNewsletterSignup(heroEmail, 'hero_get_complexes');
    setIsSubmittingHero(false);
    setHeroSignupStatus('success');
    setHeroEmail('');
  };

  const handleFooterSignup = async (e) => {
    e.preventDefault();
    if (!footerEmail || !footerEmail.includes('@')) return;

    setIsSubmittingFooter(true);
    await submitNewsletterSignup(footerEmail, 'home_footer_newsletter');
    setIsSubmittingFooter(false);
    setFooterSignupStatus('success');
    setFooterEmail('');
  };

  return (
    <div className="home-page-root">
      <div className="page-wrap">

        {/* ── 1. BOOK HERO SECTION ── */}
        <section id="book" className="scroll-reveal">
          <div className="book-section">
            {/* Left: Book Cover */}
            <div className="book-cover-wrap reveal-left">
              <BookCover />
            </div>

            {/* Right: Book Content */}
            <div className="book-content reveal-right">
              <h2>
                Train your <span className="hero-highlight">strength, muscle</span><br />
                &amp; endurance <span className="hero-highlight">every day</span>
              </h2>
              <p>
                I'm an ordinary guy — sales professional, not an athlete — who figured out a simple kettlebell system that fits around a full life. 10 complexes. No programming headaches. No gym required. Just work that compounds.
              </p>
              <p>
                <em>Eat. Lift. Run. x</em> is the system I built — and it's become the book I wish I'd had at 30. A framework for people who think in systems, not slogans.
              </p>

              <div className="book-cta-row">
                {heroSignupStatus !== 'success' ? (
                  <form onSubmit={handleHeroSignup} className="signup-row book-signup">
                    <input
                      type="email"
                      placeholder="Your Email Address"
                      value={heroEmail}
                      onChange={(e) => setHeroEmail(e.target.value)}
                      required
                    />
                    <button type="submit" disabled={isSubmittingHero}>
                      {isSubmittingHero ? 'Sending…' : 'Get the complexes →'}
                    </button>
                  </form>
                ) : (
                  <div
                    style={{
                      border: '2px solid var(--black)',
                      backgroundColor: 'var(--yellow)',
                      padding: '0.85rem 1.25rem',
                      borderRadius: '4px',
                      fontWeight: '700',
                      fontSize: '0.95rem',
                      width: '100%',
                      maxWidth: '460px',
                    }}
                  >
                    ✓ Complexes sent! Check your inbox for the PDF download link.
                  </div>
                )}
              </div>
            </div>
          </div>
        </section>

        {/* ── 2. WHAT'S INSIDE ── */}
        <section className="whats-inside scroll-reveal" id="whats-inside">
          <h2>What's inside</h2>
          <ul className="wi-list reveal-stagger">
            <li>
              <strong>2 strength complexes</strong>
              <span>Earth to Sky (crossing ladder, 2 bells or 1) and Sun and Shadow (3×3 rule, get-up flow, 1 bell)</span>
            </li>
            <li>
              <strong>2 power complexes</strong>
              <span>Thunderclap (dead-stop snatch chain, 1 bell) and Crouching Tiger (clean-to-squat + push press, 2 bells or 1)</span>
            </li>
            <li>
              <strong>3 muscle complexes</strong>
              <span>Turning Seasons (rotating reps, density format), Full Circle (drop sets, hypertrophy), and Still Water (single-leg work, joint durability)</span>
            </li>
            <li>
              <strong>3 endurance complexes</strong>
              <span>Mountain Stream (Pat Flynn 9-min template), Rising Tide (escalating density), and Banyan Roots (carry and hold finisher)</span>
            </li>
            <li>
              <strong>The Goal-Matching Matrix</strong>
              <span>how to pick any complex for strength, power, hypertrophy, or stamina</span>
            </li>
            <li>
              <strong>The 3-Day Rule</strong>
              <span>how to structure these around running, work, and life without burning out</span>
            </li>
          </ul>
          <div>
            <a
              href="#book"
              className="btn-primary-yellow"
              onClick={(e) => {
                e.preventDefault();
                window.scrollTo({ top: 0, behavior: 'smooth' });
              }}
            >
              Download The Free Program Now →
            </a>
          </div>
        </section>

        {/* ── 3. WHO IS ABHI SINGH / ABOUT ── */}
        <section className="about-section scroll-reveal" id="about">
          <div className="about-bio reveal-left">
            <h2>Who Is Abhi Singh?</h2>
            <p>
              Hola, I'm Abhi Singh. Sales and marketing professional turned fitness and lifestyle coach. I transformed myself and got to peak fitness and mental health at 35.
            </p>
            <p>
              I completed{' '}
              <CredentialPreview
                label="Yoddha Race"
                imageSrc="/assets/yoddha-medal.jpg"
                title="The Yoddha Race"
                subtitle="Finisher Medal · The Ultimate Fitness Challenge"
                onOpenModal={onOpenCertificate}
              />{' '}
              and{' '}
              <CredentialPreview
                label="HYROX Mumbai"
                imageSrc="/assets/hyrox-patch.jpg"
                title="HYROX Mumbai"
                subtitle="Official Open Singles Patch · 2026/2027"
                onOpenModal={onOpenCertificate}
              />, trained consistently for 20 months without missed weeks, and earned my{' '}
              <CredentialPreview
                label="ACE CPT certification"
                imageSrc="/assets/ace-certificate.jpg"
                title="American Council on Exercise"
                subtitle="Certified Personal Trainer · NCCA Accredited"
                onOpenModal={onOpenCertificate}
              />{' '}
              — the gold standard in exercise science and personal training.
            </p>
            <p>
              This site is what I learned doing it. No guru posturing. No toxic gym culture. Read a few things, learn the mechanics, and then go train.
            </p>
          </div>
          <div className="about-photo-col reveal-right">
            <AboutGallery onOpenLightbox={onOpenCertificate} />
          </div>
        </section>

        {/* ── 4. BLOG & ESSAYS SECTION ── */}
        <section className="blog-section scroll-reveal" id="blog">
          <div className="section-header">
            <span className="section-eyebrow">ESSAYS &amp; FRAMEWORKS</span>
            <h2>From The Blog</h2>
            <p className="section-subtext">
              Practical, evidence-based essays on kettlebell mechanics, sustainable habits, and building lasting physical capacity.
            </p>
          </div>

          <div className="blog-cards-grid reveal-stagger">
            {posts.slice(0, visiblePostCount).map((post) => {
              const rawThumb = post.thumbnail || post.thumbnail_url;
              const thumbUrl = !rawThumb 
                ? '/assets/author-photo.png' 
                : (rawThumb.startsWith('http') || rawThumb.startsWith('/') ? rawThumb : '/' + rawThumb);

              return (
                <article
                  key={post.id}
                  className="blog-card"
                  onClick={() => setActiveArticle(post)}
                  role="button"
                  tabIndex={0}
                  onKeyDown={(e) => e.key === 'Enter' && setActiveArticle(post)}
                  aria-label={`Read essay: ${post.title}`}
                >
                  <div className="blog-card-media">
                    <img 
                      src={thumbUrl} 
                      alt={post.title} 
                      className="blog-card-img" 
                      loading="lazy" 
                      onError={(e) => { e.currentTarget.src = '/assets/author-photo.png'; }}
                    />
                    <span className="blog-card-category-badge">{post.category || 'Framework'}</span>
                  </div>

                  <div className="blog-card-content">
                    <div className="blog-card-meta-line">
                      <span className="blog-card-date">{post.date || post.published_date || 'October 2026'}</span>
                      <span className="blog-card-divider">·</span>
                      <span className="blog-card-readtime">{post.readTime || post.read_time || '4 min read'}</span>
                    </div>

                    <h3 className="blog-card-title">{post.title}</h3>

                    <p className="blog-card-summary">
                      {post.summary}
                    </p>

                    <div className="blog-card-action">
                      <span className="blog-card-link-text">Read Full Essay →</span>
                    </div>
                  </div>
                </article>
              );
            })}
          </div>

          {posts.length > 4 && (
            <div className="blog-more-wrap">
              <button
                type="button"
                className="btn-primary-yellow blog-more-btn"
                onClick={() => setVisiblePostCount((prev) => (prev <= 4 ? posts.length : 4))}
                aria-expanded={visiblePostCount > 4}
              >
                {visiblePostCount <= 4
                  ? `Show More Articles (${posts.length - 4} more) ↓`
                  : 'Show Fewer Articles ↑'}
              </button>
            </div>
          )}
        </section>

        {/* ── 5. WHAT I AM WORKING ON NOW ── */}
        <section className="working-on scroll-reveal">
          <h2>What I am working on now</h2>
          <ul className="working-list reveal-stagger">
            <li>
              <div className="item-label">The Book</div>
              <div className="item-title">Eat. Lift. Run. x</div>
              <div className="item-desc">
                The system I used to go from unfit to completing HYROX and Yoddha Race — written so you can follow it without guessing. Building in public.
              </div>
              <div>
                <a
                  href="#book"
                  onClick={(e) => {
                    e.preventDefault();
                    window.scrollTo({ top: 0, behavior: 'smooth' });
                  }}
                >
                  Get early access →
                </a>
              </div>
            </li>
            <li>
              <div className="item-label">The Newsletter</div>
              <div className="item-title">E.L.R.x Weekly</div>
              <div className="item-desc">
                1,000+ millennials. One story from my training life, one thing you can use this week. No schedule — sent when it's worth sending.
              </div>
              <div>
                <a
                  href="#newsletter"
                  onClick={(e) => {
                    e.preventDefault();
                    document.getElementById('newsletter')?.scrollIntoView({ behavior: 'smooth' });
                  }}
                >
                  Join here →
                </a>
              </div>
            </li>
          </ul>
        </section>

        {/* ── 5. START HERE / CONTENT ── */}
        <section className="start-here scroll-reveal" id="content">
          <h2>Welcome to my world</h2>
          <ul className="start-here-list reveal-stagger" style={{ marginTop: '1.25rem' }}>
            <li>
              <span className="num">1.</span>
              <a
                href="#blog"
                onClick={(e) => {
                  e.preventDefault();
                  const found = posts.find((p) => p.slug?.includes('what-is-elrx') || p.id === 'edition-5') || posts[0];
                  setActiveArticle(found);
                }}
              >
                What is E.L.R.x — and is it for you?
              </a>
            </li>
            <li>
              <span className="num">2.</span>
              <a
                href="#blog"
                onClick={(e) => {
                  e.preventDefault();
                  const found = posts.find((p) => p.slug?.includes('zero-to-hyrox') || p.id === 'edition-4') || posts[1];
                  setActiveArticle(found);
                }}
              >
                How I went from zero to HYROX in 20 months
              </a>
            </li>
            <li>
              <span className="num">3.</span>
              <a
                href="#blog"
                onClick={(e) => {
                  e.preventDefault();
                  const found = posts.find((p) => p.slug?.includes('fat-loss') || p.id === 'edition-3') || posts[2];
                  setActiveArticle(found);
                }}
              >
                The only 3 things that actually drive fat loss
              </a>
            </li>
            <li>
              <span className="num">4.</span>
              <a
                href="#blog"
                onClick={(e) => {
                  e.preventDefault();
                  const found = posts.find((p) => p.slug?.includes('workout') || p.id === 'edition-2') || posts[3];
                  setActiveArticle(found);
                }}
              >
                Why your workout isn't working (and the fix)
              </a>
            </li>
            <li>
              <span className="num">5.</span>
              <a
                href="#blog"
                onClick={(e) => {
                  e.preventDefault();
                  const found = posts.find((p) => p.slug?.includes('habit') || p.id === 'edition-1') || posts[4];
                  setActiveArticle(found);
                }}
              >
                How to build a habit that doesn't break
              </a>
            </li>
          </ul>
          <div style={{ fontSize: '0.98rem', marginTop: '1.25rem' }}>
            <a
              href="#store"
              onClick={(e) => {
                e.preventDefault();
                onNavigate('store');
              }}
            >
              Check out all the resources here →
            </a>
          </div>
        </section>

      </div>{/* /page-wrap */}

      {/* ── 6. FOOTER SIGNUP ── */}
      <section className="footer-signup scroll-reveal" id="newsletter">
        <div className="page-wrap">
          <div className="footer-signup-text reveal-left">
            <h2>
              <em>Free</em><br />
              E.L.R.x Newsletter
            </h2>
            <p className="sub">
              Join 1,000+ millennials. One story from my journey, one thing you can apply this week. Sent when it's worth sending.
            </p>
          </div>
          <div className="footer-signup-cta reveal-right">
            {footerSignupStatus !== 'success' ? (
              <form onSubmit={handleFooterSignup} className="signup-row">
                <input
                  type="email"
                  placeholder="Your Email Address"
                  value={footerEmail}
                  onChange={(e) => setFooterEmail(e.target.value)}
                  required
                />
                <button type="submit" disabled={isSubmittingFooter}>
                  {isSubmittingFooter ? 'Submitting…' : 'Sign me up →'}
                </button>
              </form>
            ) : (
              <div
                style={{
                  border: '2px solid var(--black)',
                  backgroundColor: 'var(--yellow)',
                  padding: '0.85rem 1.25rem',
                  borderRadius: '4px',
                  fontWeight: '700',
                  fontSize: '0.95rem',
                }}
              >
                ✓ You're signed up! Check your inbox for confirmation.
              </div>
            )}
            <p className="hero-tagline">
              No fluff. No toxic gym culture.<br />
              Just what works. 🔥
            </p>
          </div>
        </div>
      </section>

      {/* ── INTERACTIVE ARTICLE READER MODAL (INLINE ON HOMEPAGE) ── */}
      {activeArticle && (
        <div
          className="modal-backdrop"
          onClick={() => setActiveArticle(null)}
          role="dialog"
          aria-modal="true"
          aria-label={activeArticle.title}
          data-lenis-prevent
        >
          <div
            className="modal-box modal-box-reader"
            onClick={(e) => e.stopPropagation()}
            data-lenis-prevent
            style={{
              maxWidth: '740px',
              width: '95%',
              maxHeight: '86vh',
              overflowY: 'auto',
              textAlign: 'left',
              background: 'var(--white)',
              border: '2px solid var(--black)',
              boxShadow: '6px 6px 0 var(--yellow)',
              padding: 'clamp(1.25rem, 3vw, 2.25rem)',
              position: 'relative',
            }}
          >
            <button
              className="modal-close-btn"
              onClick={() => setActiveArticle(null)}
              aria-label="Close Article"
            >
              ✕
            </button>

            <div style={{ marginBottom: '1.25rem' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem', marginBottom: '0.5rem', flexWrap: 'wrap' }}>
                <span
                  style={{
                    background: 'var(--yellow)',
                    color: 'var(--black)',
                    fontSize: '0.72rem',
                    fontWeight: 800,
                    letterSpacing: '0.08em',
                    textTransform: 'uppercase',
                    padding: '0.2rem 0.6rem',
                    border: '1.5px solid var(--black)',
                    borderRadius: '3px',
                  }}
                >
                  {activeArticle.category || 'Framework'}
                </span>
                <span style={{ fontSize: '0.8rem', fontWeight: 600, color: 'var(--orange)' }}>
                  {activeArticle.readTime || activeArticle.read_time || '4 min read'} · {activeArticle.date || activeArticle.published_date || 'October 2026'}
                </span>
              </div>

              <h2
                style={{
                  fontFamily: 'var(--font-display)',
                  fontSize: 'clamp(1.4rem, 2.5vw, 1.95rem)',
                  lineHeight: 1.25,
                  margin: '0.5rem 0',
                  color: 'var(--black)',
                }}
              >
                {activeArticle.title}
              </h2>
            </div>

            {activeArticle.thumbnail && (
              <div style={{ marginBottom: '1.5rem', border: '2px solid var(--black)', borderRadius: '4px', overflow: 'hidden', maxHeight: '320px' }}>
                <img
                  src={activeArticle.thumbnail.startsWith('/') ? activeArticle.thumbnail : `/${activeArticle.thumbnail}`}
                  alt={activeArticle.title}
                  style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }}
                />
              </div>
            )}

            <div
              className="article-reader-content"
              style={{ fontSize: '0.96rem', lineHeight: '1.7', color: 'var(--black)' }}
              dangerouslySetInnerHTML={{
                __html: DOMPurify.sanitize(activeArticle.content, {
                  ALLOWED_TAGS: [
                    'p', 'br', 'strong', 'b', 'em', 'i', 'u', 's', 'h1', 'h2', 'h3', 'h4', 'h5', 'h6',
                    'ul', 'ol', 'li', 'blockquote', 'a', 'img', 'hr', 'code', 'pre', 'span', 'div'
                  ],
                  ALLOWED_ATTR: ['href', 'src', 'alt', 'title', 'class', 'style', 'target', 'rel'],
                  ADD_ATTR: ['target', 'rel'],
                }),
              }}
            />

            {/* Author Bio Box */}
            <div
              style={{
                borderTop: '2px solid var(--black)',
                marginTop: '2rem',
                display: 'flex',
                alignItems: 'center',
                gap: '1rem',
                background: 'var(--yellow)',
                padding: '1rem',
                borderRadius: '4px',
                border: '2px solid var(--black)',
              }}
            >
              <img
                src="/assets/author-photo.png"
                alt="Abhi Singh"
                style={{ width: '52px', height: '52px', borderRadius: '4px', border: '2px solid var(--black)', objectFit: 'cover' }}
              />
              <div>
                <strong style={{ display: 'block', fontSize: '0.98rem', fontFamily: 'var(--font-display)', color: 'var(--black)' }}>
                  Written by Abhi Singh
                </strong>
                <span style={{ fontSize: '0.82rem', color: 'var(--black)' }}>
                  ACE Certified Personal Trainer · Creator of Eat. Lift. Run. x
                </span>
              </div>
            </div>

            <div style={{ marginTop: '1.5rem', textAlign: 'right' }}>
              <button
                type="button"
                className="btn-primary-yellow"
                style={{ width: 'auto', padding: '0.55rem 1.5rem', fontSize: '0.85rem' }}
                onClick={() => setActiveArticle(null)}
              >
                Close Essay
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
