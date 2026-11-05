import React, { useState, useEffect } from 'react';
import { submitContactInquiry } from '../utils/tracking';
import { getSiteContent, DEFAULT_SITE_CONTENT } from '../services/db';
import { EditableText, EditableSection, EditableButton } from '../components/live-editor';

const SERVICE_LABELS = {
  coaching: '1:1 Fitness & Kettlebell Coaching',
  'single-session': 'Single Session Kettlebell Intensive',
  workshop: 'Team / Corporate Movement Workshop',
  consulting: 'Training Programming & Consulting',
  other: 'Custom Fitness & Kettlebell Consultation',
};

function formatDisplayName(name) {
  if (!name || typeof name !== 'string') return '';
  return name
    .trim()
    .split(/\s+/)
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
    .join(' ');
}

function getFirstName(name) {
  const formatted = formatDisplayName(name);
  if (!formatted) return 'there';
  return formatted.split(' ')[0] || 'there';
}

export default function WorkWithMePage({ onNavigate }) {
  const [siteContent, setSiteContent] = useState(DEFAULT_SITE_CONTENT);
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    service: 'coaching',
    message: '',
    organisation: '',
    phone: '',
  });

  const [submitted, setSubmitted] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    let isMounted = true;
    const loadContent = async () => {
      try {
        const sc = await getSiteContent();
        if (isMounted && sc) {
          setSiteContent(sc);
        }
      } catch (err) {
        console.warn('[WorkWithMePage] Live sync error:', err);
      }
    };

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

    return () => {
      isMounted = false;
      window.removeEventListener('elrx_data_changed', handleSync);
      window.removeEventListener('storage', handleSync);
      window.removeEventListener('focus', handleSync);
      if (bc) bc.close();
    };
  }, []);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.name || !formData.email) return;

    setIsSubmitting(true);
    // Smooth transition delay so the user experiences the processing state
    await new Promise((resolve) => setTimeout(resolve, 550));
    await submitContactInquiry(formData);
    setIsSubmitting(false);
    setSubmitted(true);
  };

  return (
    <div className="work-with-me-page">
      <div className="page-wrap">
        <EditableSection sectionKey="wwm.main" sectionLabel="Work With Me Section" style={{ paddingBottom: '4rem', paddingTop: '3rem' }}>
          <div className="section-header wwm-header-anim" style={{ marginBottom: '1.25rem' }}>
            <EditableText
              as="h2"
              contentKey="workWithMe.heading"
              defaultValue="Work with me"
              className="section-title-underlined"
              style={{ margin: 0 }}
            />
          </div>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '1rem', marginBottom: '2.5rem' }}>
            <EditableText
              as="p"
              contentKey="workWithMe.subtitle"
              defaultValue="Tell me a little about what you're looking for - I'll get back to you within 24 hours."
              className="wwm-header-anim"
              style={{ fontSize: 'var(--text-body)', color: 'var(--text-color)', margin: 0, maxWidth: 'var(--measure-prose)', lineHeight: 'var(--line-height-body)' }}
            />
            <div style={{ display: 'flex', gap: '0.65rem' }}>
              <a
                href={siteContent?.social?.instagram || 'https://www.instagram.com/abhi.sins?dlrf=Y3o3Y2RzMnVkM2Ru'}
                target="_blank"
                rel="noopener noreferrer"
                className="social-pill-link"
                aria-label="Follow Abhi Singh on Instagram"
              >
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <rect x="2" y="2" width="20" height="20" rx="5" ry="5"></rect>
                  <path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z"></path>
                  <line x1="17.5" y1="6.5" x2="17.51" y2="6.5"></line>
                </svg>
                Instagram
              </a>
              {siteContent?.social?.linkedin ? (
                <a
                  href={siteContent.social.linkedin}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="social-pill-link"
                  aria-label="Connect with Abhi Singh on LinkedIn"
                >
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M16 8a6 6 0 0 1 6 6v7h-4v-7a2 2 0 0 0-2-2 2 2 0 0 0-2 2v7h-4v-7a6 6 0 0 1 6-6z"></path>
                    <rect x="2" y="9" width="4" height="12"></rect>
                    <circle cx="4" cy="4" r="2"></circle>
                  </svg>
                  LinkedIn
                </a>
              ) : null}
            </div>
          </div>

          {!submitted ? (
            <form onSubmit={handleSubmit} className="wwm-form wwm-form-anim" noValidate>
              <div className="wwm-row">
                <div className="wwm-field">
                  <label htmlFor="wwmName">
                    Your Name <span style={{ color: 'var(--orange)' }}>*</span>
                  </label>
                  <input
                    type="text"
                    id="wwmName"
                    name="name"
                    placeholder="Your name"
                    value={formData.name}
                    onChange={handleChange}
                    required
                  />
                </div>
                <div className="wwm-field">
                  <label htmlFor="wwmEmail">
                    Email Address <span style={{ color: 'var(--orange)' }}>*</span>
                  </label>
                  <input
                    type="email"
                    id="wwmEmail"
                    name="email"
                    placeholder="your@email.com"
                    value={formData.email}
                    onChange={handleChange}
                    required
                  />
                </div>
              </div>

              <div className="wwm-field">
                <label htmlFor="wwmService">
                  How can I help? <span style={{ color: 'var(--orange)' }}>*</span>
                </label>
                <select
                  id="wwmService"
                  name="service"
                  value={formData.service}
                  onChange={handleChange}
                  required
                >
                  <option value="coaching">1:1 Fitness &amp; Kettlebell Coaching</option>
                  <option value="single-session">Single Session Kettlebell Intensive</option>
                  <option value="workshop">Team / Corporate Movement Workshop</option>
                  <option value="consulting">Training Programming &amp; Consulting</option>
                  <option value="other">Something else…</option>
                </select>
              </div>

              <div className="wwm-field">
                <label htmlFor="wwmMessage">
                  Add details <span style={{ color: 'var(--orange)' }}>*</span>
                </label>
                <textarea
                  id="wwmMessage"
                  name="message"
                  rows={4}
                  placeholder="Tell me what you have in mind, your goals, or current fitness background…"
                  value={formData.message}
                  onChange={handleChange}
                  required
                />
              </div>

              <div className="wwm-row">
                <div className="wwm-field">
                  <label htmlFor="wwmOrg">Organisation (Optional)</label>
                  <input
                    type="text"
                    id="wwmOrg"
                    name="organisation"
                    placeholder="Company or club"
                    value={formData.organisation}
                    onChange={handleChange}
                  />
                </div>
                <div className="wwm-field">
                  <label htmlFor="wwmPhone">Phone / WhatsApp (Optional)</label>
                  <input
                    type="tel"
                    id="wwmPhone"
                    name="phone"
                    placeholder="+91 …"
                    value={formData.phone}
                    onChange={handleChange}
                  />
                </div>
              </div>

              <div style={{ marginTop: '0.5rem' }}>
                <EditableButton
                  buttonKey="wwm.submit"
                  defaultText="Send Inquiry →"
                  type="submit"
                  className="wwm-submit"
                  disabled={isSubmitting}
                >
                  {isSubmitting ? (
                    <>
                      <span className="btn-spinner" />
                      Sending Inquiry…
                    </>
                  ) : (
                    'Send Inquiry →'
                  )}
                </EditableButton>
              </div>
            </form>
          ) : (
            <div className="wwm-success-card" role="region" aria-live="polite">
              <div className="wwm-success-stripe" />
              <div className="wwm-success-inner">
                {/* Status Pill Row */}
                <div className="wwm-success-badge-row">
                  <span className="wwm-success-pill">
                    <span className="wwm-pulse-dot" />
                    Inquiry Received · Direct Dispatch
                  </span>
                  <span className="wwm-response-time-pill">
                    ⏱️ Response within 24h
                  </span>
                </div>

                {/* Warm Editorial Greeting */}
                <div>
                  <h3 className="wwm-greeting-title">
                    Thank you, {getFirstName(formData.name)}!
                  </h3>
                  <p style={{ marginTop: '0.35rem', color: '#555555', fontSize: '0.94rem' }}>
                    Your message has been delivered directly to my personal inbox.
                  </p>
                </div>

                {/* Personal Stamp from Abhi */}
                <div className="wwm-author-card">
                  <img
                    src="/assets/author-photo.png"
                    alt="Abhi Singh"
                    className="wwm-author-photo"
                    onError={(e) => { e.currentTarget.src = '/assets/avatar.png'; }}
                  />
                  <div className="wwm-author-meta">
                    <span className="wwm-author-name">Abhi Singh</span>
                    <span className="wwm-author-role">Coach &amp; Author · E.L.R.x</span>
                  </div>
                </div>

                <p className="wwm-personal-note">
                  Hi <strong>{getFirstName(formData.name)}</strong>, I review every coaching and workshop inquiry personally. I’m reviewing your notes regarding <strong>{SERVICE_LABELS[formData.service] || 'your training goals'}</strong> and will reply directly to <strong>{formData.email}</strong> within 24 hours.
                </p>

                {/* Inquiry Telemetry & Details Snapshot */}
                <div className="wwm-receipt-box">
                  <div className="wwm-receipt-row">
                    <span className="wwm-receipt-label">Service Focus:</span>
                    <span className="wwm-receipt-value">
                      {SERVICE_LABELS[formData.service] || formData.service}
                    </span>
                  </div>
                  <div className="wwm-receipt-row">
                    <span className="wwm-receipt-label">Reply Destination:</span>
                    <span className="wwm-receipt-value">{formData.email}</span>
                  </div>
                  {formData.organisation && (
                    <div className="wwm-receipt-row">
                      <span className="wwm-receipt-label">Organisation:</span>
                      <span className="wwm-receipt-value">{formData.organisation}</span>
                    </div>
                  )}
                  {formData.phone && (
                    <div className="wwm-receipt-row">
                      <span className="wwm-receipt-label">Phone / WhatsApp:</span>
                      <span className="wwm-receipt-value">{formData.phone}</span>
                    </div>
                  )}
                  {formData.message && (
                    <div className="wwm-receipt-message">
                      &ldquo;{formData.message.length > 180 ? `${formData.message.slice(0, 180)}…` : formData.message}&rdquo;
                    </div>
                  )}
                </div>

                {/* Next Steps / Explore while you wait */}
                <div className="wwm-explore-block">
                  <span className="wwm-explore-title">While you wait, explore free training resources:</span>
                  <div className="wwm-explore-buttons">
                    <button
                      type="button"
                      className="wwm-btn-store"
                      onClick={() => {
                        if (onNavigate) {
                          onNavigate('store');
                        } else {
                          window.location.hash = '#store';
                        }
                      }}
                    >
                      Explore E.L.R.x Store →
                    </button>
                    <button
                      type="button"
                      className="wwm-btn-blog"
                      onClick={() => {
                        if (onNavigate) {
                          onNavigate('home', 'blog');
                        } else {
                          window.location.hash = '#blog';
                        }
                      }}
                    >
                      Read Kettlebell Essays →
                    </button>
                  </div>
                </div>

                {/* Form Reset Link */}
                <button
                  type="button"
                  className="wwm-reset-link"
                  onClick={() => {
                    setSubmitted(false);
                    setFormData({
                      name: '',
                      email: '',
                      service: 'coaching',
                      message: '',
                      organisation: '',
                      phone: '',
                    });
                  }}
                >
                  Need to send another message or update details? Click here.
                </button>
              </div>
            </div>
          )}
        </EditableSection>
      </div>
    </div>
  );
}
