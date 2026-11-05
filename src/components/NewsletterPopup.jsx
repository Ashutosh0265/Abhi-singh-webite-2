import React, { useState, useEffect } from 'react';
import { submitNewsletterSignup } from '../utils/tracking';
import { getSiteContent, DEFAULT_SITE_CONTENT } from '../services/db';
import { EditableText } from './live-editor';

export default function NewsletterPopup() {
  const [isOpen, setIsOpen] = useState(false);
  const [email, setEmail] = useState('');
  const [submitted, setSubmitted] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [popupContent, setPopupContent] = useState(DEFAULT_SITE_CONTENT.newsletterPopup);

  useEffect(() => {
    let isMounted = true;
    const loadContent = () => {
      getSiteContent().then((sc) => {
        if (isMounted && sc && sc.newsletterPopup) {
          setPopupContent(sc.newsletterPopup);
        }
      }).catch(() => {});
    };

    // Load initial site content
    loadContent();

    // Real-time zero-reload sync listeners
    const handleSync = () => loadContent();
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

    // Check if user has already dismissed the popup in this session
    const hasDismissed = sessionStorage.getItem('elrx_popup_dismissed');
    if (hasDismissed) {
      return () => {
        isMounted = false;
        window.removeEventListener('elrx_data_changed', handleSync);
        window.removeEventListener('storage', handleSync);
        window.removeEventListener('focus', handleSync);
        if (bc) bc.close();
      };
    }

    let triggered = false;
    const pageOpenTime = Date.now();

    // 1. Scroll listener for 75% scroll
    const handleScroll = () => {
      if (triggered) return;
      const scrollHeight = document.documentElement.scrollHeight - window.innerHeight;
      if (scrollHeight > 0) {
        const scrolledPercent = (window.scrollY / scrollHeight) * 100;
        if (scrolledPercent >= 75) {
          triggered = true;
          setIsOpen(true);
        }
      }
    };

    // 2. Exit intent listener (mouse leaves top of window, with 6s initial grace period)
    const handleMouseLeave = (e) => {
      if (triggered) return;
      if (Date.now() - pageOpenTime < 6000) return; // Prevent premature popup on initial page load
      if (e.clientY <= 10) {
        triggered = true;
        setIsOpen(true);
      }
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    document.addEventListener('mouseleave', handleMouseLeave);

    return () => {
      isMounted = false;
      window.removeEventListener('elrx_data_changed', handleSync);
      window.removeEventListener('storage', handleSync);
      window.removeEventListener('focus', handleSync);
      if (bc) bc.close();
      window.removeEventListener('scroll', handleScroll);
      document.removeEventListener('mouseleave', handleMouseLeave);
    };
  }, []);

  const handleClose = () => {
    setIsOpen(false);
    sessionStorage.setItem('elrx_popup_dismissed', 'true');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!email || !email.includes('@')) return;

    setIsSubmitting(true);
    await submitNewsletterSignup(email, 'exit_intent_popup');
    setIsSubmitting(false);
    setSubmitted(true);

    setTimeout(() => {
      handleClose();
    }, 2500);
  };

  if (!isOpen) return null;

  return (
    <div
      className="modal-backdrop"
      onClick={handleClose}
      role="dialog"
      aria-modal="true"
      aria-label="Newsletter Subscription"
    >
      <div
        className="modal-box newsletter-popup-modal"
        onClick={(e) => e.stopPropagation()}
      >
        <button
          className="modal-close-btn"
          onClick={handleClose}
          aria-label="Close Newsletter Popup"
        >
          ✕
        </button>

        {!submitted ? (
          <div className="newsletter-popup-grid">
            {/* Left Column: Abhi Singh Client Photo & Coach Credential */}
            <div className="newsletter-popup-visual">
              <div className="newsletter-popup-img-wrap">
                <img
                  src="/assets/author-photo.png"
                  alt="Abhi Singh"
                  className="newsletter-popup-img"
                  onError={(e) => { e.currentTarget.src = '/assets/avatar.png'; }}
                />
              </div>
              <div className="newsletter-popup-author-info">
                <strong className="newsletter-popup-author-name">Abhi Singh</strong>
                <span className="newsletter-popup-author-sub">ACE Certified Coach</span>
                <span className="newsletter-popup-tag">Creator, Eat. Lift. Run. x</span>
              </div>
            </div>

            {/* Right Column: Editorial Copy & Signup Form */}
            <div className="newsletter-popup-content">
              <EditableText
                as="span"
                contentKey="newsletterPopup.eyebrow"
                defaultValue="FREE WEEKLY NEWSLETTER"
                className="newsletter-popup-eyebrow"
              />
              <EditableText
                as="h3"
                contentKey="newsletterPopup.heading"
                defaultValue="Get the E.L.R.x Weekly"
                className="newsletter-popup-heading"
              />
              <EditableText
                as="p"
                contentKey="newsletterPopup.description"
                defaultValue="Join 1,000+ everyday lifters. One story from my training journey, one actionable kettlebell complex or nutrition principle you can apply this week."
                className="newsletter-popup-desc"
              />

              <form onSubmit={handleSubmit} style={{ width: '100%' }}>
                <div className="signup-row newsletter-popup-form-row">
                  <input
                    type="email"
                    placeholder="Enter your email address"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                    className="newsletter-popup-input"
                  />
                  <EditableText
                    as="button"
                    contentKey="newsletterPopup.ctaText"
                    defaultValue="Subscribe Free →"
                    type="submit"
                    disabled={isSubmitting}
                    className="newsletter-popup-btn"
                  />
                </div>
              </form>

              <EditableText
                as="p"
                contentKey="newsletterPopup.guaranteeText"
                defaultValue="No fluff. No spam. Unsubscribe anytime in one click."
                className="newsletter-popup-guarantee"
              />
            </div>
          </div>
        ) : (
          <div className="newsletter-popup-success">
            <h3
              style={{
                fontFamily: 'var(--font-heading)',
                fontSize: '2rem',
                marginBottom: '0.75rem',
                color: 'var(--color-orange)',
              }}
            >
              You're in!
            </h3>
            <p style={{ fontSize: '1.05rem', lineHeight: 1.6, color: 'var(--text-color)', maxWidth: '480px', margin: '0 auto' }}>
              Thank you for subscribing. Check your inbox for the welcome edition and your free complex guide.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}

