import React, { useState, useEffect } from 'react';
import { submitNewsletterSignup } from '../utils/tracking';

export default function NewsletterPopup() {
  const [isOpen, setIsOpen] = useState(false);
  const [email, setEmail] = useState('');
  const [submitted, setSubmitted] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    // Check if user has already dismissed the popup in this session
    const hasDismissed = sessionStorage.getItem('elrx_popup_dismissed');
    if (hasDismissed) return;

    let triggered = false;

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

    // 2. Exit intent listener (mouse leaves top of window)
    const handleMouseLeave = (e) => {
      if (triggered) return;
      if (e.clientY <= 10) {
        triggered = true;
        setIsOpen(true);
      }
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    document.addEventListener('mouseleave', handleMouseLeave);

    return () => {
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
        className="modal-box"
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
          <>
            <h3
              style={{
                fontFamily: 'var(--font-heading)',
                fontSize: '2rem',
                marginBottom: '0.75rem',
                lineHeight: 1.15,
              }}
            >
              Get the <span style={{ color: 'var(--color-orange)' }}>E.L.R.x</span> Weekly
            </h3>
            <p
              style={{
                fontSize: '0.98rem',
                marginBottom: '1.75rem',
                lineHeight: 1.6,
              }}
            >
              Join 1,000+ everyday lifters. One story from my training journey, one actionable kettlebell complex or nutrition principle you can apply this week.
            </p>

            <form onSubmit={handleSubmit} style={{ width: '100%' }}>
              <div className="signup-row" style={{ maxWidth: '100%' }}>
                <input
                  type="email"
                  placeholder="Enter your email address"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                />
                <button type="submit" disabled={isSubmitting}>
                  {isSubmitting ? 'Subscribing…' : 'Subscribe Free →'}
                </button>
              </div>
            </form>

            <p
              style={{
                marginTop: '1rem',
                fontSize: '0.75rem',
                fontWeight: '700',
                letterSpacing: '0.04em',
                textTransform: 'uppercase',
              }}
            >
              No fluff. No spam. Unsubscribe anytime in one click.
            </p>
          </>
        ) : (
          <div style={{ padding: '1.5rem 0' }}>
            <h3
              style={{
                fontFamily: 'var(--font-heading)',
                fontSize: '1.8rem',
                marginBottom: '0.5rem',
                color: 'var(--color-orange)',
              }}
            >
              You're in!
            </h3>
            <p style={{ fontSize: '1rem', lineHeight: 1.6 }}>
              Thank you for subscribing. Check your inbox for the welcome edition and your free complex guide.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}

