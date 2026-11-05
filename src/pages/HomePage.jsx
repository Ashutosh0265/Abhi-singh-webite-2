import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import BookCover from '../components/BookCover';
import CredentialPreview from '../components/CredentialPreview';
import AboutGallery from '../components/AboutGallery';
import { initialNewsletters } from '../data/newsletters';
import { getPosts, getSiteContent, DEFAULT_SITE_CONTENT } from '../services/db';
import DOMPurify from 'dompurify';
import { parseMarkdownToHtml } from '../utils/markdown';
import { submitNewsletterSignup } from '../utils/tracking';
import useScrollReveal from '../hooks/useScrollReveal';
import { ArticleVideoPlayer } from '../components/ArticleVideoPlayer';
import {
  formatArticleThumbnailUrl,
  DEFAULT_BLOG_COVER,
  calculateReadingTime,
  formatPublicationDate,
} from '../utils/mediaHelper';
import {
  EditableText,
  EditableImage,
  EditableVideo,
  EditableButton,
  EditableSection,
} from '../components/live-editor';

export default function HomePage({ onNavigate, onOpenCertificate }) {
  useScrollReveal([]);
  const [content, setContent] = useState(DEFAULT_SITE_CONTENT);
  const [heroEmail, setHeroEmail] = useState('');
  const [footerEmail, setFooterEmail] = useState('');
  const [heroSignupStatus, setHeroSignupStatus] = useState(null);
  const [footerSignupStatus, setFooterSignupStatus] = useState(null);
  const [isSubmittingHero, setIsSubmittingHero] = useState(false);
  const [isSubmittingFooter, setIsSubmittingFooter] = useState(false);
  const [posts, setPosts] = useState(() =>
    initialNewsletters.map((n) => ({
      ...n,
      date: formatPublicationDate(n.date),
      readTime: calculateReadingTime(n.content, n.summary, n.readTime),
    }))
  );
  const [activeArticle, setActiveArticle] = useState(null);
  const [currentPage, setCurrentPage] = useState(1);
  const POSTS_PER_PAGE = 9;

  useEffect(() => {
    const publishedCount = posts.filter((p) => (p.status || 'published') === 'published').length;
    const total = Math.max(1, Math.ceil(publishedCount / POSTS_PER_PAGE));
    if (currentPage > total) {
      setCurrentPage(total);
    }
  }, [posts, currentPage]);

  useEffect(() => {
    let isMounted = true;
    async function loadLiveData() {
      try {
        const [live, sc] = await Promise.all([
          getPosts(false),
          getSiteContent(),
        ]);
        if (isMounted) {
          if (sc) setContent(sc);
          if (live) {
            const normalized = live.map((n) => {
              const formattedDate = formatPublicationDate(n.published_date || n.date);
              const calculatedReadTime = calculateReadingTime(n.content, n.summary, n.read_time || n.readTime);
              return {
                id: n.id,
                title: n.title,
                category: n.category || 'Framework',
                date: formattedDate,
                readTime: calculatedReadTime,
                summary: n.summary || '',
                content: n.content || '',
                thumbnail: n.thumbnail_url || n.thumbnail || '',
                video_url: n.video_url || n.videoUrl || '',
                videoUrl: n.video_url || n.videoUrl || '',
                status: n.status || 'published',
                slug: n.slug,
                featured: Boolean(n.featured),
                featured_order: Number(n.featured_order !== undefined && n.featured_order !== null ? n.featured_order : 999),
              };
            });

            // Sort featured posts first on homepage (by featured_order ascending)
            const sorted = [...normalized].sort((a, b) => {
              if (a.featured && !b.featured) return -1;
              if (!a.featured && b.featured) return 1;
              if (a.featured && b.featured) {
                return a.featured_order - b.featured_order;
              }
              return 0;
            });
            setPosts(sorted);
          }
        }
      } catch (err) {
        console.warn('[HomePage] Failed fetching live data, using fallback:', err);
      }
    }
    loadLiveData();

    // Real-time synchronization listeners (instant updates without reload)
    const handleSync = () => loadLiveData();
    window.addEventListener('elrx_data_changed', handleSync);
    window.addEventListener('storage', handleSync);
    window.addEventListener('focus', handleSync);

    let bc = null;
    try {
      if ('BroadcastChannel' in window) {
        bc = new BroadcastChannel('elrx_live_sync');
        bc.onmessage = handleSync;
      }
    } catch {}

    return () => {
      isMounted = false;
      window.removeEventListener('elrx_data_changed', handleSync);
      window.removeEventListener('storage', handleSync);
      window.removeEventListener('focus', handleSync);
      if (bc) bc.close();
    };
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
        <EditableSection id="book" sectionKey="home.hero" sectionLabel="Hero Book Section" className="scroll-reveal">
          <div className="book-section">
            {/* Left: Book Cover */}
            <div className="book-col reveal-left">
              <BookCover />
            </div>

            {/* Right: Book Content */}
            <div className="book-content reveal-right">
              <h1 className="hero-headline">
                <EditableText
                  as="span"
                  contentKey="hero.line1"
                  defaultValue="Train your"
                  className="hero-line hero-highlight"
                />{' '}
                <span className="hero-line hero-highlight">
                  <EditableText
                    as="span"
                    contentKey="hero.line2"
                    defaultValue="strength, muscle"
                    className="hero-highlight"
                  />
                </span>{' '}
                <EditableText
                  as="span"
                  contentKey="hero.line3"
                  defaultValue="& endurance every day"
                  className="hero-line hero-highlight"
                />
              </h1>
              <EditableText
                as="p"
                contentKey="hero.subheadline1"
                defaultValue="I'm an ordinary guy - sales professional, not an athlete - who figured out a simple kettlebell system that fits around a full life. 10 complexes. No programming headaches. No gym required. Just work that compounds."
              />
              <EditableText
                as="p"
                contentKey="hero.subheadline2"
                defaultValue="Eat. Lift. Run. x is the system I built - and it's become the book I wish I'd had at 30. A framework for people who think in systems, not slogans."
              />

              <div className="book-cta-row">
                {heroSignupStatus !== 'success' ? (
                  <form onSubmit={handleHeroSignup} className="signup-row book-signup">
                    <input
                      type="email"
                      placeholder={content?.hero?.emailPlaceholder || "Your Email Address"}
                      value={heroEmail}
                      onChange={(e) => setHeroEmail(e.target.value)}
                      required
                    />
                    <EditableButton
                      buttonKey="hero.cta"
                      defaultText="Get the complexes →"
                      type="submit"
                      disabled={isSubmittingHero}
                    />
                  </form>
                ) : (
                  <div
                    style={{
                      border: '1px solid #212121',
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
        </EditableSection>

        {/* ── 2. WHAT'S INSIDE ── */}
        <EditableSection className="whats-inside scroll-reveal" id="whats-inside" sectionKey="home.whatsInside" sectionLabel="What's Inside Section">
          <EditableText
            as="h2"
            contentKey="whatsInside.heading"
            defaultValue="What's inside"
          />
          <ul className="wi-list reveal-stagger">
            <li>
              <EditableText as="strong" contentKey="whatsInside.point1Title" defaultValue="2 strength complexes" />
              <EditableText as="span" contentKey="whatsInside.point1Desc" defaultValue="Earth to Sky (crossing ladder, 2 bells or 1) and Sun and Shadow (3×3 rule, get-up flow, 1 bell)" />
            </li>
            <li>
              <EditableText as="strong" contentKey="whatsInside.point2Title" defaultValue="2 power complexes" />
              <EditableText as="span" contentKey="whatsInside.point2Desc" defaultValue="Thunderclap (dead-stop snatch chain, 1 bell) and Crouching Tiger (clean-to-squat + push press, 2 bells or 1)" />
            </li>
            <li>
              <EditableText as="strong" contentKey="whatsInside.point3Title" defaultValue="3 muscle complexes" />
              <EditableText as="span" contentKey="whatsInside.point3Desc" defaultValue="Turning Seasons (rotating reps, density format), Full Circle (drop sets, hypertrophy), and Still Water (single-leg work, joint durability)" />
            </li>
            <li>
              <EditableText as="strong" contentKey="whatsInside.point4Title" defaultValue="3 endurance complexes" />
              <EditableText as="span" contentKey="whatsInside.point4Desc" defaultValue="Mountain Stream (Pat Flynn 9-min template), Rising Tide (escalating density), and Banyan Roots (carry and hold finisher)" />
            </li>
            <li>
              <EditableText as="strong" contentKey="whatsInside.point5Title" defaultValue="The Goal-Matching Matrix" />
              <EditableText as="span" contentKey="whatsInside.point5Desc" defaultValue="how to pick any complex for strength, power, hypertrophy, or stamina" />
            </li>
            <li>
              <EditableText as="strong" contentKey="whatsInside.point6Title" defaultValue="The 3-Day Rule" />
              <EditableText as="span" contentKey="whatsInside.point6Desc" defaultValue="how to structure these around running, work, and life without burning out" />
            </li>
          </ul>
          <div>
            <EditableButton
              buttonKey="whatsInside.cta"
              defaultText="Download The Free Program Now →"
              defaultHref="#book"
              className="btn-primary-yellow"
              onClick={(e) => {
                if (!window.location.search.includes('edit=true')) {
                  e.preventDefault();
                  window.scrollTo({ top: 0, behavior: 'smooth' });
                }
              }}
            />
          </div>
        </EditableSection>

        {/* ── 3. WHO IS ABHI SINGH / ABOUT ── */}
        <EditableSection className="about-section scroll-reveal" id="about" sectionKey="home.about" sectionLabel="Who is Abhi Singh Section">
          <div className="about-bio reveal-left">
            <EditableText
              as="h2"
              contentKey="about.heading"
              defaultValue="Who Is Abhi Singh?"
            />
            <EditableText
              as="p"
              contentKey="about.p1"
              defaultValue="Hola, I'm Abhi Singh. Sales and marketing professional turned fitness and lifestyle coach. I transformed myself and got to peak fitness and mental health at 35."
            />
            <p>
              I completed{' '}
              <CredentialPreview
                label="Yoddha Race"
                imageSrc="/assets/yoddha-medal.jpg"
                title={content?.credentials?.yoddha?.title || 'The Yoddha Race'}
                subtitle={content?.credentials?.yoddha?.subtitle || 'Finisher Medal · The Ultimate Fitness Challenge'}
                onOpenModal={onOpenCertificate}
              />{' '}
              and{' '}
              <CredentialPreview
                label="HYROX Mumbai"
                imageSrc="/assets/hyrox-patch.jpg"
                title={content?.credentials?.hyrox?.title || 'HYROX Mumbai'}
                subtitle={content?.credentials?.hyrox?.subtitle || 'Official Open Singles Patch · 2026/2027'}
                onOpenModal={onOpenCertificate}
              />, trained consistently for 20 months without missed weeks, and earned my{' '}
              <CredentialPreview
                label="ACE CPT certification"
                imageSrc="/assets/ace-certificate.jpg"
                title={content?.credentials?.ace?.title || 'American Council on Exercise'}
                subtitle={content?.credentials?.ace?.subtitle || 'Certified Personal Trainer · NCCA Accredited'}
                onOpenModal={onOpenCertificate}
              />{' '}
              - the gold standard in exercise science and personal training.
            </p>
            <EditableText
              as="p"
              contentKey="about.p3"
              defaultValue="This site is what I learned doing it. No guru posturing. No toxic gym culture. Read a few things, learn the mechanics, and then go train."
            />
          </div>
          <div className="about-photo-col reveal-right">
            <AboutGallery onOpenLightbox={onOpenCertificate} />
          </div>
        </EditableSection>

        {/* ── 4. BLOG & ESSAYS SECTION ── */}
        <EditableSection className="blog-section scroll-reveal" id="blog" sectionKey="home.blog" sectionLabel="Essays & Frameworks Section">
          <div className="section-header">
            <EditableText
              as="span"
              contentKey="blog.eyebrow"
              defaultValue="ESSAYS & FRAMEWORKS"
              className="section-eyebrow"
            />
            <EditableText
              as="h2"
              contentKey="blog.heading"
              defaultValue="From The Blog"
            />
            <EditableText
              as="p"
              contentKey="blog.subtitle"
              defaultValue="Practical, evidence-based essays on kettlebell mechanics, sustainable habits, and building lasting physical capacity."
              className="section-subtext"
            />
          </div>

          {(() => {
            const publishedPosts = posts.filter((p) => (p.status || 'published') === 'published');
            const totalPages = Math.max(1, Math.ceil(publishedPosts.length / POSTS_PER_PAGE));
            const safeCurrentPage = Math.min(Math.max(1, currentPage), totalPages);
            const startIndex = (safeCurrentPage - 1) * POSTS_PER_PAGE;
            const currentPosts = publishedPosts.slice(startIndex, startIndex + POSTS_PER_PAGE);

            const handlePageChange = (newPage) => {
              if (newPage < 1 || newPage > totalPages || newPage === safeCurrentPage) return;
              setCurrentPage(newPage);

              const blogElem = document.getElementById('blog');
              if (blogElem) {
                const rect = blogElem.getBoundingClientRect();
                if (rect.top < 0 || rect.top > 250) {
                  if (window.__lenis) {
                    window.__lenis.scrollTo('#blog', { offset: -84, duration: 0.8 });
                  } else {
                    blogElem.scrollIntoView({ behavior: 'smooth', block: 'start' });
                  }
                }
              }
            };

            const getPaginationRange = (curr, total) => {
              if (total <= 7) {
                return Array.from({ length: total }, (_, i) => i + 1);
              }
              if (curr <= 4) {
                return [1, 2, 3, 4, 5, '...', total];
              }
              if (curr >= total - 3) {
                return [1, '...', total - 4, total - 3, total - 2, total - 1, total];
              }
              return [1, '...', curr - 1, curr, curr + 1, '...', total];
            };

            const pageRange = getPaginationRange(safeCurrentPage, totalPages);

            return (
              <>
                <div className="blog-cards-grid reveal-stagger">
                  {currentPosts.length === 0 ? (
                    <div
                      className="blog-empty-state"
                      style={{
                        gridColumn: '1 / -1',
                        textAlign: 'center',
                        padding: '3rem 1rem',
                        color: 'var(--text-color)',
                        opacity: 0.75,
                      }}
                    >
                      <p style={{ fontSize: '1rem', fontFamily: 'var(--font-body)' }}>No published articles found.</p>
                    </div>
                  ) : (
                    currentPosts.map((post) => {
                      const thumbUrl = formatArticleThumbnailUrl(post.thumbnail || post.thumbnail_url);
                      const displayDate = formatPublicationDate(post.date || post.published_date);
                      const displayReadTime = calculateReadingTime(post.content, post.summary, post.readTime || post.read_time);

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
                              onError={(e) => { e.currentTarget.src = DEFAULT_BLOG_COVER; }}
                            />
                            <span className="blog-card-category-badge">{post.category || 'Framework'}</span>
                            {(post.video_url || post.videoUrl) && (
                              <span className="blog-card-video-badge" aria-label="Video essay">
                                <span className="video-icon" aria-hidden="true">▶</span> Video
                              </span>
                            )}
                          </div>

                          <div className="blog-card-content">
                            <div className="blog-card-meta-line">
                              <span className="blog-card-date">{displayDate}</span>
                              <span className="blog-card-divider" aria-hidden="true">·</span>
                              <span className="blog-card-readtime">{displayReadTime}</span>
                            </div>

                            <h3 className="blog-card-title">{post.title}</h3>

                            <p className="blog-card-summary">
                              {post.summary || ''}
                            </p>

                            <div className="blog-card-action">
                              <span className="blog-card-link-text">Read Full Essay →</span>
                            </div>
                          </div>
                        </article>
                      );
                    })
                  )}
                </div>

                {/* Google-Style Dynamic Numbered Pagination */}
                <div className="blog-pagination-wrap" role="navigation" aria-label="Blog articles pagination">
                  <button
                    type="button"
                    className="blog-pagination-nav-btn blog-pagination-prev"
                    onClick={() => handlePageChange(safeCurrentPage - 1)}
                    disabled={safeCurrentPage <= 1}
                    aria-label="Previous Page"
                  >
                    ← Previous
                  </button>

                  <div className="blog-pagination-numbers">
                    {pageRange.map((pageItem, idx) => {
                      if (pageItem === '...') {
                        return (
                          <span key={`ellipsis-${idx}`} className="blog-pagination-ellipsis" aria-hidden="true">
                            …
                          </span>
                        );
                      }
                      return (
                        <button
                          key={`page-${pageItem}`}
                          type="button"
                          className={`blog-pagination-num-btn ${safeCurrentPage === pageItem ? 'active' : ''}`}
                          onClick={() => handlePageChange(pageItem)}
                          aria-current={safeCurrentPage === pageItem ? 'page' : undefined}
                          aria-label={`Page ${pageItem}`}
                        >
                          {pageItem}
                        </button>
                      );
                    })}
                  </div>

                  <button
                    type="button"
                    className="blog-pagination-nav-btn blog-pagination-next"
                    onClick={() => handlePageChange(safeCurrentPage + 1)}
                    disabled={safeCurrentPage >= totalPages}
                    aria-label="Next Page"
                  >
                    Next →
                  </button>
                </div>
              </>
            );
          })()}
        </EditableSection>

        {/* ── 5. WHAT I AM WORKING ON NOW ── */}
        <EditableSection className="working-on scroll-reveal" sectionKey="home.workingOn" sectionLabel="What I Am Working On Section">
          <EditableText
            as="h2"
            contentKey="workingOn.heading"
            defaultValue="What I am working on now"
          />
          <ul className="working-list reveal-stagger">
            <li>
              <EditableText as="div" contentKey="workingOn.bookLabel" defaultValue="The Book" className="item-label" />
              <EditableText as="div" contentKey="workingOn.bookTitle" defaultValue="Eat. Lift. Run. x" className="item-title" />
              <EditableText
                as="div"
                contentKey="workingOn.bookDesc"
                defaultValue="The system I used to go from unfit to completing HYROX and Yoddha Race - written so you can follow it without guessing. Building in public."
                className="item-desc"
              />
              <div>
                <EditableButton
                  buttonKey="workingOn.bookCta"
                  defaultText="Get early access →"
                  defaultHref="#book"
                  onClick={(e) => {
                    if (!window.location.search.includes('edit=true')) {
                      e.preventDefault();
                      const bookEl = document.getElementById('book');
                      if (bookEl) {
                        bookEl.scrollIntoView({ behavior: 'smooth' });
                      } else {
                        window.scrollTo({ top: 0, behavior: 'smooth' });
                      }
                    }
                  }}
                />
              </div>
            </li>
            <li>
              <EditableText as="div" contentKey="workingOn.newsLabel" defaultValue="The Newsletter" className="item-label" />
              <EditableText as="div" contentKey="workingOn.newsTitle" defaultValue="E.L.R.x Weekly" className="item-title" />
              <EditableText
                as="div"
                contentKey="workingOn.newsDesc"
                defaultValue="1,000+ millennials. One story from my training life, one thing you can use this week. No schedule - sent when it's worth sending."
                className="item-desc"
              />
              <div>
                <EditableButton
                  buttonKey="workingOn.newsCta"
                  defaultText="Join here →"
                  defaultHref="#newsletter"
                  onClick={(e) => {
                    if (!window.location.search.includes('edit=true')) {
                      e.preventDefault();
                      document.getElementById('newsletter')?.scrollIntoView({ behavior: 'smooth' });
                    }
                  }}
                />
              </div>
            </li>
          </ul>
        </EditableSection>

      </div>{/* /page-wrap */}

      {/* ── 6. FOOTER SIGNUP ── */}
      <EditableSection className="footer-signup scroll-reveal" id="newsletter" sectionKey="home.newsletter" sectionLabel="Newsletter Signup Section">
        <div className="page-wrap">
          <div className="footer-signup-text reveal-left">
            <h2>
              <em>Free</em><br />
              <EditableText
                as="span"
                contentKey="newsletter.heading"
                defaultValue="E.L.R.x Newsletter"
                className="footer-newsletter-underline"
              />
            </h2>
            <EditableText
              as="p"
              contentKey="newsletter.sub"
              defaultValue="Join 1,000+ millennials. One story from my journey, one thing you can apply this week. Sent when it's worth sending."
              className="sub"
            />
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
                <EditableButton
                  buttonKey="newsletter.cta"
                  defaultText="Sign me up →"
                  type="submit"
                  disabled={isSubmittingFooter}
                />
              </form>
            ) : (
              <div
                style={{
                  border: '1px solid var(--black)',
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
            <EditableText
              as="p"
              contentKey="newsletter.tagline"
              defaultValue="No fluff. No toxic gym culture. Just what works. 🔥"
              className="hero-tagline"
            />
          </div>
        </div>
      </EditableSection>

      {/* ── ARTICLE READER MODAL (EDITORIAL SCANNABLE FORMAT) ── */}
      {activeArticle && typeof document !== 'undefined' && createPortal(
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
          >
            <button
              className="modal-close-btn"
              onClick={() => setActiveArticle(null)}
              aria-label="Close Article"
            >
              ✕
            </button>

            <div className="modal-reader-header">
              <div className="modal-reader-meta">
                <span className="modal-reader-category">
                  {activeArticle.category || 'Framework'}
                </span>
                <span className="modal-reader-time">
                  {activeArticle.readTime || activeArticle.read_time || '2 min read'} · {activeArticle.date || activeArticle.published_date || 'October 2026'}
                </span>
              </div>

              <h2 className="modal-reader-title">
                {activeArticle.title}
              </h2>
            </div>

            {/* Video Player or Thumbnail Banner */}
            {(activeArticle.video_url || activeArticle.videoUrl) ? (
              <ArticleVideoPlayer
                videoUrl={activeArticle.video_url || activeArticle.videoUrl}
                title={activeArticle.title}
                style={{ marginBottom: '1.5rem' }}
              />
            ) : (
              (activeArticle.thumbnail || activeArticle.thumbnail_url) && (
                <div className="modal-reader-banner">
                  <img
                    src={formatArticleThumbnailUrl(activeArticle.thumbnail || activeArticle.thumbnail_url)}
                    alt={activeArticle.title}
                    onError={(e) => { e.currentTarget.src = DEFAULT_BLOG_COVER; }}
                  />
                </div>
              )
            )}

            <div
              className="article-reader-content"
              dangerouslySetInnerHTML={{
                __html: DOMPurify.sanitize(parseMarkdownToHtml(activeArticle.content), {
                  ALLOWED_TAGS: [
                    'p', 'br', 'strong', 'b', 'em', 'i', 'u', 's', 'h1', 'h2', 'h3', 'h4', 'h5', 'h6',
                    'ul', 'ol', 'li', 'blockquote', 'a', 'img', 'hr', 'code', 'pre', 'span', 'div'
                  ],
                  ALLOWED_ATTR: ['href', 'src', 'alt', 'title', 'class', 'style', 'target', 'rel'],
                  ADD_ATTR: ['target', 'rel'],
                }),
              }}
            />

            {/* Clean, Minimal Author Footer */}
            <div className="modal-author-box">
              <div className="modal-author-info">
                <img
                  src="/assets/author-photo.png"
                  alt="Abhi Singh"
                  className="modal-author-avatar"
                />
                <div>
                  <strong className="modal-author-name">
                    Written by Abhi Singh
                  </strong>
                  <span className="modal-author-bio">
                    ACE Certified Personal Trainer · Creator of Eat. Lift. Run. x
                  </span>
                </div>
              </div>
              <button
                type="button"
                className="modal-reader-close-action"
                onClick={() => setActiveArticle(null)}
              >
                Close Essay
              </button>
            </div>
          </div>
        </div>,
        document.body
      )}
    </div>
  );
}
