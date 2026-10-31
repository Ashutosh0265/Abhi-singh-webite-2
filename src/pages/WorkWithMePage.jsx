import React, { useState } from 'react';
import { submitContactInquiry } from '../utils/tracking';

export default function WorkWithMePage() {
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
        <section style={{ paddingBottom: '4rem', paddingTop: '3rem' }}>
          <div className="section-header wwm-header-anim" style={{ marginBottom: '1.25rem' }}>
            <h2 className="section-title-underlined" style={{ margin: 0 }}>
              Work with me
            </h2>
          </div>
          <p className="wwm-header-anim" style={{ fontSize: 'var(--text-body)', color: 'var(--text-color)', marginBottom: '2.5rem', maxWidth: 'var(--measure-prose)', lineHeight: 'var(--line-height-body)' }}>
            Tell me a little about what you're looking for — I'll get back to you within 24 hours.
          </p>

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
                <button type="submit" className="wwm-submit" disabled={isSubmitting}>
                  {isSubmitting ? (
                    <>
                      <span className="btn-spinner" />
                      Sending Inquiry…
                    </>
                  ) : (
                    'Send Inquiry →'
                  )}
                </button>
              </div>
            </form>
          ) : (
            <div
              className="wwm-success-box"
              style={{
                border: '2px solid var(--black)',
                backgroundColor: 'var(--yellow)',
                padding: '2.5rem',
                borderRadius: '6px',
                boxShadow: '4px 4px 0 var(--black)',
                maxWidth: '540px',
              }}
            >
              <h3 style={{ fontSize: '1.4rem', marginBottom: '0.75rem', fontFamily: 'var(--font-display)', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <span style={{ color: 'var(--orange)', fontSize: '1.6rem' }}>✓</span> Message received!
              </h3>
              <p style={{ fontSize: '1rem', color: 'var(--black)', lineHeight: 1.6 }}>
                Thanks <strong>{formData.name}</strong> for reaching out. I'll review your inquiry and reply to <strong>{formData.email}</strong> within 24 hours.
              </p>
            </div>
          )}
        </section>
      </div>
    </div>
  );
}
