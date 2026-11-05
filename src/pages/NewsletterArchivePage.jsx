import React, { useState, useEffect, useMemo } from 'react';
import DOMPurify from 'dompurify';
import { parseMarkdownToHtml } from '../utils/markdown';
import { initialNewsletters } from '../data/newsletters';
import { getPosts, getCategories } from '../services/db';
import { submitNewsletterSignup } from '../utils/tracking';
import useScrollReveal from '../hooks/useScrollReveal';
import { ArticleVideoPlayer } from '../components/ArticleVideoPlayer';
import { formatArticleThumbnailUrl, DEFAULT_BLOG_COVER } from '../utils/mediaHelper';
import { EditableText, EditableSection, EditableButton } from '../components/live-editor';

export default function NewsletterArchivePage({ selectedEditionId, onSelectEdition }) {
  const [activeEditionId, setActiveEditionId] = useState(selectedEditionId || null);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [categoriesList, setCategoriesList] = useState(['All', 'Framework', 'Endurance', 'Nutrition', 'Kettlebells', 'Habits']);
  const [email, setEmail] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [signupStatus, setSignupStatus] = useState(null);
  const [allArticles, setAllArticles] = useState(initialNewsletters);

  useEffect(() => {
    let isMounted = true;
    async function loadPosts() {
      try {
        const [livePosts, liveCategories] = await Promise.all([
          getPosts(false),
          getCategories(),
        ]);
        if (isMounted) {
          if (livePosts) {
            const normalized = livePosts.map((n) => ({
              id: n.id,
              title: n.title,
              category: n.category || 'Framework',
              date: n.published_date || n.date || 'November 2026',
              readTime: n.read_time || n.readTime || '4 min read',
              summary: n.summary || '',
              excerpt: n.excerpt || '',
              content: n.content || '',
              thumbnail: n.thumbnail_url || n.thumbnail || '',
              video_url: n.video_url || n.videoUrl || '',
              status: n.status || 'published',
            }));
            setAllArticles(normalized);
          }
          if (liveCategories && liveCategories.length > 0) {
            setCategoriesList(['All', ...liveCategories]);
          }
        }
      } catch (err) {
        console.warn('Failed loading live archive articles & categories:', err);
      }
    }
    loadPosts();

    // Real-time synchronization listeners
    const handleSync = () => loadPosts();
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

  const categories = categoriesList;

  const filteredArticles = useMemo(() => {
    return allArticles.filter((item) => {
      // Only show published articles in public archive
      if (item.status === 'draft') return false;

      const matchesCategory = selectedCategory === 'All' || item.category === selectedCategory;
      const matchesSearch =
        searchQuery === '' ||
        item.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        item.summary.toLowerCase().includes(searchQuery.toLowerCase());
      return matchesCategory && matchesSearch;
    });
  }, [allArticles, selectedCategory, searchQuery]);

  useScrollReveal([allArticles, activeEditionId, filteredArticles]);

  const activeEdition = allArticles.find((n) => n.id === activeEditionId);

  const handleSignup = async (e) => {
    e.preventDefault();
    if (!email || !email.includes('@')) return;

    setIsSubmitting(true);
    await submitNewsletterSignup(email, 'archive_reading_view');
    setIsSubmitting(false);
    setSignupStatus('success');
    setEmail('');
  };

  return (
    <div className="newsletter-archive-page">
      <div className="page-wrap">
        <EditableSection sectionKey="archive.main" sectionLabel="Newsletter Archive Section" style={{ paddingTop: '3.5rem', paddingBottom: '4.5rem' }}>

          {/* ── 1. ARTICLE DETAIL VIEW ── */}
          {activeEdition ? (
            <div className="article-detail-view" style={{ textAlign: 'left' }}>
              <div style={{ marginBottom: '1.75rem' }}>
                <button
                  type="button"
                  className="btn-card btn-free"
                  style={{ width: 'auto', display: 'inline-flex', alignItems: 'center', gap: '0.5rem', padding: '0.45rem 1.1rem', fontSize: '0.85rem' }}
                  onClick={() => {
                    setActiveEditionId(null);
                    window.scrollTo({ top: 0, behavior: 'smooth' });
                  }}
                >
                  ← Back to All Resources
                </button>
              </div>

              <article
                style={{
                  border: '1px solid var(--black)',
                  padding: '2.5rem 2.25rem',
                  borderRadius: '6px',
                  backgroundColor: 'var(--white)',
                  boxShadow: '3px 3px 0 var(--black)',
                  marginBottom: '3rem',
                }}
              >
                <div style={{ display: 'flex', gap: '0.75rem', alignItems: 'center', marginBottom: '0.75rem', flexWrap: 'wrap' }}>
                  <span className="card-tag launch" style={{ margin: 0 }}>
                    {activeEdition.category || 'Article'}
                  </span>
                  <span style={{ fontSize: '0.82rem', fontWeight: '700', color: 'var(--black)' }}>
                    {activeEdition.date} · {activeEdition.readTime}
                  </span>
                </div>

                <h1
                  style={{
                    fontFamily: 'var(--font-heading)',
                    fontSize: 'var(--text-h1)',
                    lineHeight: 'var(--line-height-display)',
                    letterSpacing: 'var(--letter-spacing-h1)',
                    marginBottom: '1.5rem',
                    paddingBottom: '0.75rem',
                    borderBottom: '3px solid var(--yellow)',
                  }}
                >
                  {activeEdition.title}
                </h1>

                {/* Video Player or Thumbnail Image */}
                {(activeEdition.video_url || activeEdition.videoUrl) ? (
                  <ArticleVideoPlayer
                    videoUrl={activeEdition.video_url || activeEdition.videoUrl}
                    title={activeEdition.title}
                    style={{ marginBottom: '2rem' }}
                  />
                ) : (
                  (activeEdition.thumbnail || activeEdition.thumbnail_url) && (
                    <div style={{ marginBottom: '2rem', border: '1px solid var(--black)', borderRadius: '4px', overflow: 'hidden', maxHeight: '380px' }}>
                      <img
                        src={formatArticleThumbnailUrl(activeEdition.thumbnail || activeEdition.thumbnail_url)}
                        alt={activeEdition.title}
                        onError={(e) => { e.currentTarget.src = DEFAULT_BLOG_COVER; }}
                        style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }}
                      />
                    </div>
                  )
                )}

                <div
                  className="edition-body"
                  style={{ fontSize: 'var(--text-body)', lineHeight: 'var(--line-height-body)', color: 'var(--text-color)', maxWidth: 'var(--measure-prose)' }}
                  dangerouslySetInnerHTML={{
                    __html: DOMPurify.sanitize(parseMarkdownToHtml(activeEdition.content), {
                      ALLOWED_TAGS: [
                        'p', 'br', 'strong', 'b', 'em', 'i', 'u', 's', 'h1', 'h2', 'h3', 'h4', 'h5', 'h6',
                        'ul', 'ol', 'li', 'blockquote', 'a', 'img', 'hr', 'code', 'pre', 'span', 'div'
                      ],
                      ALLOWED_ATTR: ['href', 'src', 'alt', 'title', 'class', 'style', 'target', 'rel'],
                      ADD_ATTR: ['target', 'rel'],
                    }),
                  }}
                />

                {/* Author Card */}
                <div
                  style={{
                    borderTop: '1px solid var(--black)',
                    marginTop: '2.5rem',
                    paddingTop: '1.75rem',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '1.25rem',
                  }}
                >
                  <img
                    src="assets/author-photo.png"
                    alt="Abhi Singh"
                    style={{ width: '56px', height: '56px', borderRadius: '4px', border: '1px solid var(--black)' }}
                  />
                  <div>
                    <strong style={{ display: 'block', fontSize: '1rem', fontFamily: 'var(--font-heading)', color: 'var(--text-color)' }}>
                      Written by Abhi Singh
                    </strong>
                    <span style={{ fontSize: '0.88rem', color: 'var(--text-color)' }}>
                      ACE Certified Personal Trainer · Creator of Eat. Lift. Run. x
                    </span>
                  </div>
                </div>
              </article>

              {/* Newsletter signup at the bottom of the article per Design Instructions 5.4 */}
              <div
                style={{
                  border: '1px solid var(--black)',
                  padding: '2.25rem',
                  borderRadius: '6px',
                  backgroundColor: 'var(--white)',
                  boxShadow: '3px 3px 0 var(--yellow)',
                  maxWidth: '640px',
                  margin: '0 auto',
                }}
              >
                <h3
                  style={{
                    fontFamily: 'var(--font-heading)',
                    fontSize: 'var(--text-h2)',
                    lineHeight: 'var(--line-height-heading)',
                    letterSpacing: 'var(--letter-spacing-h2)',
                    marginBottom: '0.5rem',
                    color: 'var(--text-color)',
                  }}
                >
                  Get protocols like this in your inbox
                </h3>
                <p style={{ fontSize: '0.95rem', marginBottom: '1.5rem', lineHeight: 1.6 }}>
                  1,000+ everyday lifters. No fluff, no toxic gym culture. One actionable kettlebell framework or nutrition rule sent when it's worth sending.
                </p>

                {signupStatus !== 'success' ? (
                  <form onSubmit={handleSignup} className="signup-row">
                    <input
                      type="email"
                      placeholder="Your Email Address"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      required
                    />
                    <button type="submit" disabled={isSubmitting}>
                      {isSubmitting ? 'Joining…' : 'Subscribe Free →'}
                    </button>
                  </form>
                ) : (
                  <div
                    style={{
                      backgroundColor: 'var(--yellow)',
                      border: '1px solid var(--black)',
                      padding: '0.85rem 1.25rem',
                      fontWeight: '700',
                      borderRadius: '4px',
                    }}
                  >
                    ✓ You're in! Check your inbox for upcoming editions.
                  </div>
                )}
              </div>
            </div>
          ) : (
            /* ── 2. ARCHIVE / RESOURCES LIST VIEW ── */
            <div>
              <div className="section-header" style={{ marginBottom: '1rem' }}>
                <h1 className="section-title-underlined" style={{ margin: 0 }}>
                  <EditableText
                    as="span"
                    contentKey="archive.heading"
                    defaultValue="Content Archive & Resources"
                  />
                </h1>
              </div>
              <EditableText
                as="p"
                contentKey="archive.subtitle"
                defaultValue="Field-tested kettlebell complexes, physical training breakdowns, and nutrition principles. Published directly from my weekly journal."
                style={{ fontSize: 'var(--text-body)', color: 'var(--text-color)', marginBottom: '2rem', maxWidth: 'var(--measure-prose)', lineHeight: 'var(--line-height-body)' }}
              />

              {/* Search & Filter Bar */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem', marginBottom: '2.5rem' }}>
                <div style={{ maxWidth: '480px', width: '100%' }}>
                  <input
                    type="search"
                    placeholder="Search articles, protocols, complexes…"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    style={{
                      width: '100%',
                      border: '1px solid var(--black)',
                      borderRadius: '4px',
                      padding: '0.8rem 1rem',
                      fontFamily: 'var(--font-body)',
                      fontSize: '0.95rem',
                      outline: 'none',
                      boxShadow: '1px 1px 0 rgba(33, 33, 33, 0.12)',
                    }}
                  />
                </div>

                {/* Category Pills */}
                <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
                  {categories.map((cat) => (
                    <button
                      key={cat}
                      type="button"
                      className={`btn-card ${selectedCategory === cat ? 'btn-paid' : 'btn-free'}`}
                      style={{ width: 'auto', padding: '0.35rem 0.9rem', fontSize: '0.78rem', boxShadow: '1.5px 1.5px 0 var(--black)' }}
                      onClick={() => setSelectedCategory(cat)}
                    >
                      {cat}
                    </button>
                  ))}
                </div>
              </div>

              {/* Articles Grid / List */}
              <div className="reveal-stagger" style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
                {filteredArticles.length > 0 ? (
                  filteredArticles.map((edition) => (
                    <article
                      key={edition.id}
                      className="product-card"
                      style={{
                        padding: '1.75rem',
                        cursor: 'pointer',
                        display: 'flex',
                        flexDirection: 'row',
                        gap: '1.5rem',
                        alignItems: 'center',
                      }}
                      onClick={() => {
                        setActiveEditionId(edition.id);
                        window.scrollTo({ top: 0, behavior: 'smooth' });
                      }}
                    >
                      {edition.thumbnail && (
                        <div
                          style={{
                            width: '130px',
                            height: '110px',
                            flexShrink: 0,
                            borderRadius: '4px',
                            border: '1px solid var(--black)',
                            overflow: 'hidden',
                            position: 'relative',
                          }}
                          className="hide-mobile"
                        >
                          <img
                            src={formatArticleThumbnailUrl(edition.thumbnail || edition.thumbnail_url)}
                            alt={edition.title}
                            onError={(e) => { e.currentTarget.src = DEFAULT_BLOG_COVER; }}
                            style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                          />
                          {(edition.video_url || edition.videoUrl) && (
                            <span
                              style={{
                                position: 'absolute',
                                bottom: '6px',
                                right: '6px',
                                background: 'rgba(33, 33, 33, 0.88)',
                                color: '#FFFFFF',
                                fontSize: '0.65rem',
                                fontWeight: 700,
                                padding: '2px 6px',
                                borderRadius: '3px',
                                display: 'inline-flex',
                                alignItems: 'center',
                                gap: '3px',
                              }}
                            >
                              <span style={{ color: 'var(--orange)', fontSize: '0.6rem' }}>▶</span> Video
                            </span>
                          )}
                        </div>
                      )}

                      <div style={{ flex: 1 }}>
                        <div style={{ display: 'flex', gap: '0.75rem', alignItems: 'center', marginBottom: '0.4rem' }}>
                          <span className="card-tag launch" style={{ margin: 0 }}>
                            {edition.category || 'Article'}
                          </span>
                          <span style={{ fontSize: '0.78rem', fontWeight: '700', color: 'var(--black)' }}>
                            {edition.date} · {edition.readTime}
                          </span>
                        </div>

                        <h3
                          style={{
                            fontFamily: 'var(--font-heading)',
                            fontSize: 'var(--text-h3)',
                            fontWeight: 600,
                            lineHeight: 'var(--line-height-subheading)',
                            letterSpacing: 'var(--letter-spacing-h3)',
                            marginBottom: '0.5rem',
                            color: 'var(--black)',
                          }}
                        >
                          {edition.title}
                        </h3>

                        <p style={{ fontSize: 'var(--text-body)', color: 'var(--black)', lineHeight: 'var(--line-height-body)', margin: 0 }}>
                          {edition.summary}
                        </p>

                        <div style={{ marginTop: '0.85rem' }}>
                          <span style={{ fontSize: '0.85rem', fontWeight: '700', color: 'var(--orange)', textDecoration: 'underline' }}>
                            Read Full Edition →
                          </span>
                        </div>
                      </div>
                    </article>
                  ))
                ) : (
                  <div
                    style={{
                      border: '1px dashed var(--black)',
                      padding: '2.5rem',
                      textAlign: 'center',
                      borderRadius: '6px',
                    }}
                  >
                    <p style={{ fontSize: '1rem', color: 'var(--black)', margin: 0 }}>
                      No articles found matching "{searchQuery}".
                    </p>
                  </div>
                )}
              </div>
            </div>
          )}

        </EditableSection>
      </div>
    </div>
  );
}
