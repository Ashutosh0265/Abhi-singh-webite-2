import React, { useState, useRef } from 'react';

/**
 * Reusable Media Upload & Picker Component for Images and Videos
 */
function MediaPickerField({
  label,
  helperText,
  value,
  onChange,
  mediaType = 'image', // 'image' | 'video'
  mediaList = [],
  uploadMediaAsset,
  showToast,
  onReset,
  resetLabel = 'Reset to Default',
}) {
  const fileInputRef = useRef(null);
  const [isUploading, setIsUploading] = useState(false);

  const handleFileChange = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsUploading(true);
    try {
      showToast(`Uploading ${mediaType === 'video' ? 'video' : 'image'}...`, 'info');
      const asset = await uploadMediaAsset(file);
      const url = asset.publicUrl || asset.public_url;
      if (url) {
        onChange(url);
        showToast(`${mediaType === 'video' ? 'Video' : 'Image'} uploaded successfully!`);
      } else {
        throw new Error('No public URL returned from upload.');
      }
    } catch (err) {
      showToast(`Upload failed: ${err.message}`, 'error');
    } finally {
      setIsUploading(false);
      if (e.target) e.target.value = '';
    }
  };

  const isVideo = mediaType === 'video';

  return (
    <div className="admin-form-group" style={{ marginBottom: '1.5rem' }}>
      <label style={{ display: 'block', fontWeight: 600, fontSize: '0.85rem', marginBottom: '0.4rem' }}>
        {label}
      </label>
      {helperText && (
        <span style={{ display: 'block', fontSize: '0.78rem', color: 'var(--admin-text-muted)', marginBottom: '0.65rem' }}>
          {helperText}
        </span>
      )}

      {/* Asset Preview & Action Area */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: value ? '140px 1fr' : '1fr',
          gap: '1rem',
          alignItems: 'start',
          padding: '1rem',
          background: '#F9FAFB',
          border: '1px solid #E5E7EB',
          borderRadius: '8px',
        }}
      >
        {/* Preview */}
        {value && (
          <div style={{ position: 'relative', borderRadius: '6px', overflow: 'hidden', border: '1px solid #D1D5DB', background: '#000' }}>
            {isVideo ? (
              <video
                src={value}
                controls
                style={{ width: '100%', height: '110px', objectFit: 'cover', display: 'block' }}
              />
            ) : (
              <img
                src={value}
                alt={label}
                style={{ width: '100%', height: '110px', objectFit: 'contain', background: '#fff', display: 'block' }}
                onError={(e) => {
                  e.currentTarget.style.display = 'none';
                }}
              />
            )}
          </div>
        )}

        {/* Controls */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.65rem' }}>
          {/* Direct URL input */}
          <div style={{ display: 'flex', gap: '0.5rem' }}>
            <input
              type="text"
              className="admin-input"
              placeholder={isVideo ? 'https://... or /assets/video.mp4' : 'https://... or /assets/image.jpg'}
              value={value || ''}
              onChange={(e) => onChange(e.target.value)}
              style={{ fontSize: '0.85rem', padding: '0.55rem 0.75rem' }}
            />
          </div>

          {/* Action Buttons Row */}
          <div style={{ display: 'flex', gap: '0.6rem', flexWrap: 'wrap', alignItems: 'center' }}>
            {/* Hidden file input */}
            <input
              ref={fileInputRef}
              type="file"
              accept={isVideo ? 'video/mp4,video/webm' : 'image/*'}
              style={{ display: 'none' }}
              onChange={handleFileChange}
            />

            <button
              type="button"
              className="admin-btn-secondary"
              disabled={isUploading}
              onClick={() => fileInputRef.current?.click()}
              style={{
                width: 'auto',
                padding: '0.45rem 0.85rem',
                fontSize: '0.82rem',
                display: 'inline-flex',
                alignItems: 'center',
                gap: '0.35rem',
              }}
            >
              <span>{isUploading ? '⏳ Uploading...' : (isVideo ? '🎥 Upload Video (MP4/WebM)' : '📷 Upload New Image')}</span>
            </button>

            {/* Select from Media Assets */}
            {mediaList && mediaList.length > 0 && (
              <select
                className="admin-input"
                style={{
                  width: 'auto',
                  padding: '0.45rem 0.75rem',
                  fontSize: '0.82rem',
                  maxWidth: '220px',
                  background: '#fff',
                }}
                onChange={(e) => {
                  if (e.target.value) {
                    onChange(e.target.value);
                    showToast('Selected media asset applied.');
                  }
                }}
                value=""
              >
                <option value="">Choose from Media Assets...</option>
                {mediaList
                  .filter((m) => {
                    const isVid = m.type === 'video' || (m.name && m.name.match(/\.(mp4|webm)$/i));
                    return isVideo ? isVid : !isVid;
                  })
                  .map((m) => (
                    <option key={m.id} value={m.publicUrl || m.public_url}>
                      {m.name || m.title || m.id}
                    </option>
                  ))}
              </select>
            )}

            {/* Reset or Clear */}
            {onReset && (
              <button
                type="button"
                className="admin-btn-secondary"
                onClick={onReset}
                style={{
                  width: 'auto',
                  padding: '0.45rem 0.85rem',
                  fontSize: '0.82rem',
                  color: 'var(--admin-text-muted)',
                }}
              >
                {resetLabel}
              </button>
            )}

            {value && !onReset && (
              <button
                type="button"
                className="admin-btn-secondary"
                onClick={() => onChange('')}
                style={{
                  width: 'auto',
                  padding: '0.45rem 0.85rem',
                  fontSize: '0.82rem',
                  color: '#DC2626',
                }}
              >
                Remove
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

/**
 * Section Visibility Control Switch
 */
function SectionVisibilityToggle({ isVisible, onToggle, sectionName }) {
  return (
    <div
      style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: '0.85rem 1.25rem',
        background: isVisible ? '#F0FDF4' : '#FEF2F2',
        border: `1px solid ${isVisible ? '#BBF7D0' : '#FECACA'}`,
        borderRadius: '8px',
        marginBottom: '1.75rem',
      }}
    >
      <div>
        <div style={{ fontWeight: 700, fontSize: '0.92rem', color: isVisible ? '#166534' : '#991B1B' }}>
          {sectionName} Visibility
        </div>
        <div style={{ fontSize: '0.8rem', color: isVisible ? '#15803D' : '#B91C1C' }}>
          {isVisible
            ? '✓ This section is published and live on the public homepage.'
            : '✕ This section is hidden from public visitors (visible only in Admin Editor mode).'}
        </div>
      </div>

      <label
        style={{
          display: 'inline-flex',
          alignItems: 'center',
          gap: '0.5rem',
          cursor: 'pointer',
          fontWeight: 700,
          fontSize: '0.85rem',
          userSelect: 'none',
        }}
      >
        <input
          type="checkbox"
          checked={isVisible}
          onChange={(e) => onToggle(e.target.checked)}
          style={{ width: '18px', height: '18px', accentColor: '#16A34A', cursor: 'pointer' }}
        />
        <span style={{ color: isVisible ? '#166534' : '#DC2626' }}>
          {isVisible ? 'Published' : 'Hidden'}
        </span>
      </label>
    </div>
  );
}

/**
 * Section Action Footer with Save Button
 */
function SectionFooterBar({ onSave, isSaving, sectionName }) {
  return (
    <div
      style={{
        display: 'flex',
        justifyContent: 'flex-end',
        alignItems: 'center',
        gap: '1rem',
        marginTop: '2rem',
        paddingTop: '1.25rem',
        borderTop: '1px solid #E5E7EB',
      }}
    >
      <span style={{ fontSize: '0.82rem', color: 'var(--admin-text-muted)' }}>
        Changes take effect immediately on public site upon saving.
      </span>
      <button
        type="button"
        className="admin-btn-primary"
        style={{ width: 'auto', padding: '0.65rem 1.5rem', fontWeight: 700 }}
        onClick={onSave}
        disabled={isSaving}
      >
        {isSaving ? 'Saving...' : `Save ${sectionName}`}
      </button>
    </div>
  );
}

/**
 * Main Website Content CMS Manager Component
 */
export default function WebsiteContentManager({
  siteContent,
  setSiteContentState,
  contentSubTab,
  setContentSubTab,
  mediaList = [],
  postsList = [],
  uploadMediaAsset,
  updateSiteContent,
  updateAllSiteContent,
  refreshAllData,
  showToast,
  setLoading,
}) {
  const [isSaving, setIsSaving] = useState(false);

  // Safe accessor helpers
  const hero = siteContent?.hero || {};
  const whatsInside = siteContent?.whatsInside || {};
  const about = siteContent?.about || {};
  const credentials = siteContent?.credentials || {};
  const aboutGallery = siteContent?.aboutGallery || {};
  const blog = siteContent?.blog || {};
  const workingOn = siteContent?.workingOn || {};
  const newsletter = siteContent?.newsletter || {};
  const popups = siteContent?.popups || {};

  // Handlers for updating deep state
  const updateSectionState = (sectionKey, updatedSection) => {
    setSiteContentState((prev) => ({
      ...prev,
      [sectionKey]: updatedSection,
    }));
  };

  // Section Save Handler
  const handleSaveSection = async (sectionKey, sectionName) => {
    setIsSaving(true);
    try {
      if (sectionKey === 'hero') {
        await updateSiteContent('hero', hero);
      } else if (sectionKey === 'whatsInside') {
        await updateSiteContent('whatsInside', whatsInside);
      } else if (sectionKey === 'about') {
        await updateSiteContent('about', about);
        await updateSiteContent('credentials', credentials);
        await updateSiteContent('aboutGallery', aboutGallery);
      } else if (sectionKey === 'blog') {
        await updateSiteContent('blog', blog);
      } else if (sectionKey === 'workingOn') {
        await updateSiteContent('workingOn', workingOn);
      } else if (sectionKey === 'newsletter') {
        await updateSiteContent('newsletter', newsletter);
      } else if (sectionKey === 'popups') {
        await updateSiteContent('popups', popups);
      }
      showToast(`${sectionName} saved successfully!`);
      if (refreshAllData) refreshAllData();
    } catch (err) {
      showToast(`Save failed: ${err.message}`, 'error');
    } finally {
      setIsSaving(false);
    }
  };

  // Save All Changes Handler
  const handleSaveAll = async () => {
    setIsSaving(true);
    try {
      await updateAllSiteContent(siteContent);
      showToast('All homepage website content saved and published successfully!');
      if (refreshAllData) refreshAllData();
    } catch (err) {
      showToast(`Save failed: ${err.message}`, 'error');
    } finally {
      setIsSaving(false);
    }
  };

  const tabsConfig = [
    { id: 'hero', label: '1. Hero & Book', icon: '📖', visible: hero.visible !== false },
    { id: 'whatsInside', label: "2. What's Inside", icon: '📋', visible: whatsInside.visible !== false },
    { id: 'about', label: '3. About Abhi Singh', icon: '👤', visible: about.visible !== false },
    { id: 'blog', label: '4. From The Blog', icon: '✍️', visible: blog.visible !== false },
    { id: 'workingOn', label: '5. What I Am Working On', icon: '🔨', visible: workingOn.visible !== false },
    { id: 'newsletter', label: '6. Weekly Signal', icon: '✉️', visible: newsletter.visible !== false },
    { id: 'popups', label: '7. Modals & Popups', icon: '💬', visible: true },
  ];

  return (
    <div className="admin-table-card">
      {/* ── TOP HEADER ── */}
      <div className="admin-table-header" style={{ flexWrap: 'wrap', gap: '1rem', borderBottom: '1px solid #E5E7EB' }}>
        <div>
          <h3 className="admin-table-title" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <span>📝</span> Homepage Content &amp; Section Manager
          </h3>
          <span style={{ fontSize: '0.82rem', color: 'var(--admin-text-muted)' }}>
            Manage copy, headings, buttons, images, videos, and section visibility across all 6 homepage sections.
          </span>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', flexWrap: 'wrap' }}>
          <a
            href="/?edit=true#home"
            target="_blank"
            rel="noopener noreferrer"
            className="admin-btn-secondary"
            style={{
              textDecoration: 'none',
              padding: '0.55rem 1rem',
              fontSize: '0.84rem',
              fontWeight: 600,
              display: 'inline-flex',
              alignItems: 'center',
              gap: '0.4rem',
              color: 'var(--admin-text)',
            }}
            title="Open live website in inline visual editing mode"
          >
            <span>👁️</span> Open Live Preview
          </a>

          <button
            type="button"
            className="admin-btn-primary"
            style={{ width: 'auto', padding: '0.55rem 1.35rem', fontWeight: 700 }}
            onClick={handleSaveAll}
            disabled={isSaving}
          >
            {isSaving ? 'Publishing...' : '💾 Save All Sections'}
          </button>
        </div>
      </div>

      {/* ── SUBTABS NAVIGATION BAR ── */}
      <div
        style={{
          display: 'flex',
          gap: '0.5rem',
          padding: '1rem 1.75rem',
          background: '#F9FAFB',
          borderBottom: '1px solid #E5E7EB',
          overflowX: 'auto',
          flexWrap: 'nowrap',
          scrollbarWidth: 'thin',
        }}
      >
        {tabsConfig.map((tab) => {
          const isActive = contentSubTab === tab.id;
          return (
            <button
              key={tab.id}
              type="button"
              onClick={() => setContentSubTab(tab.id)}
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '0.45rem',
                padding: '0.55rem 0.95rem',
                borderRadius: '6px',
                fontSize: '0.84rem',
                fontWeight: isActive ? 700 : 500,
                border: isActive ? '1px solid var(--admin-orange)' : '1px solid #E5E7EB',
                background: isActive ? 'rgba(255, 98, 0, 0.08)' : '#FFFFFF',
                color: isActive ? 'var(--admin-orange)' : 'var(--admin-text)',
                cursor: 'pointer',
                whiteSpace: 'nowrap',
                transition: 'all 0.15s ease',
              }}
            >
              <span>{tab.icon}</span>
              <span>{tab.label}</span>
              {tab.id !== 'popups' && (
                <span
                  style={{
                    display: 'inline-block',
                    width: '8px',
                    height: '8px',
                    borderRadius: '50%',
                    background: tab.visible ? '#10B981' : '#9CA3AF',
                    marginLeft: '0.25rem',
                  }}
                  title={tab.visible ? 'Section is visible on homepage' : 'Section is hidden on homepage'}
                />
              )}
            </button>
          );
        })}
      </div>

      {/* ── SUBTAB 1: HERO & BOOK SECTION ── */}
      {contentSubTab === 'hero' && (
        <div style={{ padding: '1.75rem' }}>
          <SectionVisibilityToggle
            sectionName="Hero Book Section"
            isVisible={hero.visible !== false}
            onToggle={(checked) => updateSectionState('hero', { ...hero, visible: checked })}
          />

          <h4 style={{ fontFamily: 'var(--font-main)', fontSize: '1.15rem', marginBottom: '1.25rem' }}>
            Hero Headline &amp; Subheadings
          </h4>

          {/* Main Headline */}
          <div className="admin-form-group" style={{ marginBottom: '1.5rem' }}>
            <label style={{ fontWeight: 600, fontSize: '0.85rem' }}>
              Main Headline (multiline supported)
            </label>
            <span style={{ display: 'block', fontSize: '0.78rem', color: 'var(--admin-text-muted)', marginBottom: '0.4rem' }}>
              Enter each line separated by a newline (Enter). Renders as the primary H1 heading.
            </span>
            <textarea
              className="admin-input"
              rows={3}
              value={hero.headline || ''}
              onChange={(e) => updateSectionState('hero', { ...hero, headline: e.target.value })}
              placeholder="Train your&#10;strength, muscle&#10;& endurance every day"
              style={{ fontFamily: 'monospace', fontSize: '0.95rem' }}
            />
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '1.25rem', marginBottom: '1.5rem' }}>
            {/* Subheadline 1 */}
            <div className="admin-form-group">
              <label style={{ fontWeight: 600, fontSize: '0.85rem' }}>Subheadline 1 (Author Story)</label>
              <textarea
                className="admin-input"
                rows={4}
                value={hero.subheadline1 || ''}
                onChange={(e) => updateSectionState('hero', { ...hero, subheadline1: e.target.value })}
                placeholder="I'm an ordinary guy - sales professional, not an athlete..."
              />
            </div>

            {/* Subheadline 2 */}
            <div className="admin-form-group">
              <label style={{ fontWeight: 600, fontSize: '0.85rem' }}>Subheadline 2 (Framework Description)</label>
              <textarea
                className="admin-input"
                rows={4}
                value={hero.subheadline2 || ''}
                onChange={(e) => updateSectionState('hero', { ...hero, subheadline2: e.target.value })}
                placeholder="Eat. Lift. Run. x is the system I built..."
              />
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '1.25rem', marginBottom: '2rem' }}>
            {/* Email Input Placeholder */}
            <div className="admin-form-group">
              <label style={{ fontWeight: 600, fontSize: '0.85rem' }}>Email Input Placeholder</label>
              <input
                type="text"
                className="admin-input"
                value={hero.emailPlaceholder || ''}
                onChange={(e) => updateSectionState('hero', { ...hero, emailPlaceholder: e.target.value })}
                placeholder="Your Email Address"
              />
            </div>

            {/* Primary CTA Button Text */}
            <div className="admin-form-group">
              <label style={{ fontWeight: 600, fontSize: '0.85rem' }}>Primary CTA Button Text</label>
              <input
                type="text"
                className="admin-input"
                value={hero.ctaText || hero.cta || ''}
                onChange={(e) => updateSectionState('hero', { ...hero, ctaText: e.target.value, cta: e.target.value })}
                placeholder="Get the complexes →"
              />
            </div>
          </div>

          <h4 style={{ fontFamily: 'var(--font-main)', fontSize: '1.15rem', marginBottom: '1.25rem', paddingTop: '1rem', borderTop: '1px solid #E5E7EB' }}>
            Book Cover Image &amp; Details
          </h4>

          {/* Book Cover Image Upload & Picker */}
          <MediaPickerField
            label="Book Cover Image (Optional Custom Cover)"
            helperText="Upload a custom cover image or pick from Media Assets. If left empty, the original 3D CSS book cover is displayed."
            value={hero.bookImage || ''}
            onChange={(url) => updateSectionState('hero', { ...hero, bookImage: url || null })}
            mediaType="image"
            mediaList={mediaList}
            uploadMediaAsset={uploadMediaAsset}
            showToast={showToast}
            onReset={() => updateSectionState('hero', { ...hero, bookImage: null })}
            resetLabel="Restore Default 3D Cover"
          />

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '1.25rem', marginBottom: '2rem' }}>
            <div className="admin-form-group">
              <label style={{ fontWeight: 600, fontSize: '0.85rem' }}>Book Title on Cover</label>
              <input
                type="text"
                className="admin-input"
                value={hero.bookTitle || ''}
                onChange={(e) => updateSectionState('hero', { ...hero, bookTitle: e.target.value })}
                placeholder="Eat. Lift. Run. x"
              />
            </div>

            <div className="admin-form-group">
              <label style={{ fontWeight: 600, fontSize: '0.85rem' }}>Book Subtitle on Cover</label>
              <input
                type="text"
                className="admin-input"
                value={hero.bookSubtitle || ''}
                onChange={(e) => updateSectionState('hero', { ...hero, bookSubtitle: e.target.value })}
                placeholder="10 KETTLEBELL COMPLEXES FOR EVERYDAY PEOPLE"
              />
            </div>
          </div>

          {/* Hero Video Asset */}
          <h4 style={{ fontFamily: 'var(--font-main)', fontSize: '1.15rem', marginBottom: '1.25rem', paddingTop: '1rem', borderTop: '1px solid #E5E7EB' }}>
            Hero Video Asset (Optional)
          </h4>
          <MediaPickerField
            label="Hero Background or Intro Video"
            helperText="Upload an MP4 or WebM video file, or enter an external video URL."
            value={hero.videoUrl || ''}
            onChange={(url) => updateSectionState('hero', { ...hero, videoUrl: url })}
            mediaType="video"
            mediaList={mediaList}
            uploadMediaAsset={uploadMediaAsset}
            showToast={showToast}
          />

          <SectionFooterBar
            sectionName="Hero Section"
            isSaving={isSaving}
            onSave={() => handleSaveSection('hero', 'Hero Section')}
          />
        </div>
      )}

      {/* ── SUBTAB 2: WHAT'S INSIDE SECTION ── */}
      {contentSubTab === 'whatsInside' && (
        <div style={{ padding: '1.75rem' }}>
          <SectionVisibilityToggle
            sectionName="What's Inside Section"
            isVisible={whatsInside.visible !== false}
            onToggle={(checked) => updateSectionState('whatsInside', { ...whatsInside, visible: checked })}
          />

          <h4 style={{ fontFamily: 'var(--font-main)', fontSize: '1.15rem', marginBottom: '1.25rem' }}>
            Section Headings &amp; CTA
          </h4>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '1.25rem', marginBottom: '2rem' }}>
            <div className="admin-form-group">
              <label style={{ fontWeight: 600, fontSize: '0.85rem' }}>Section Eyebrow</label>
              <input
                type="text"
                className="admin-input"
                value={whatsInside.eyebrow || ''}
                onChange={(e) => updateSectionState('whatsInside', { ...whatsInside, eyebrow: e.target.value })}
                placeholder="THE FRAMEWORK"
              />
            </div>

            <div className="admin-form-group">
              <label style={{ fontWeight: 600, fontSize: '0.85rem' }}>Section Heading</label>
              <input
                type="text"
                className="admin-input"
                value={whatsInside.heading || ''}
                onChange={(e) => updateSectionState('whatsInside', { ...whatsInside, heading: e.target.value })}
                placeholder="What's inside"
              />
            </div>

            <div className="admin-form-group">
              <label style={{ fontWeight: 600, fontSize: '0.85rem' }}>CTA Button Text</label>
              <input
                type="text"
                className="admin-input"
                value={whatsInside.ctaText || whatsInside.cta || ''}
                onChange={(e) => updateSectionState('whatsInside', { ...whatsInside, ctaText: e.target.value, cta: e.target.value })}
                placeholder="Download The Free Program Now →"
              />
            </div>

            <div className="admin-form-group">
              <label style={{ fontWeight: 600, fontSize: '0.85rem' }}>CTA Destination URL / Anchor</label>
              <input
                type="text"
                className="admin-input"
                value={whatsInside.ctaHref || '#book'}
                onChange={(e) => updateSectionState('whatsInside', { ...whatsInside, ctaHref: e.target.value })}
                placeholder="#book"
              />
            </div>
          </div>

          <h4 style={{ fontFamily: 'var(--font-main)', fontSize: '1.15rem', marginBottom: '1.25rem', paddingTop: '1rem', borderTop: '1px solid #E5E7EB' }}>
            The 6 Repeatable Complexes &amp; Rules
          </h4>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '1.5rem', marginBottom: '2rem' }}>
            {[
              { num: 1, titleKey: 'point1Title', descKey: 'point1Desc', defaultTitle: '2 strength complexes', defaultDesc: 'Earth to Sky (crossing ladder, 2 bells or 1)...' },
              { num: 2, titleKey: 'point2Title', descKey: 'point2Desc', defaultTitle: '2 power complexes', defaultDesc: 'Thunderclap (dead-stop snatch chain, 1 bell)...' },
              { num: 3, titleKey: 'point3Title', descKey: 'point3Desc', defaultTitle: '3 muscle complexes', defaultDesc: 'Turning Seasons (rotating reps, density format)...' },
              { num: 4, titleKey: 'point4Title', descKey: 'point4Desc', defaultTitle: '3 endurance complexes', defaultDesc: 'Mountain Stream (Pat Flynn 9-min template)...' },
              { num: 5, titleKey: 'point5Title', descKey: 'point5Desc', defaultTitle: 'The Goal-Matching Matrix', defaultDesc: 'how to pick any complex for strength, power...' },
              { num: 6, titleKey: 'point6Title', descKey: 'point6Desc', defaultTitle: 'The 3-Day Rule', defaultDesc: 'how to structure these around running, work...' },
            ].map((p) => (
              <div
                key={p.num}
                style={{
                  border: '1px solid #E5E7EB',
                  background: '#F9FAFB',
                  padding: '1.25rem',
                  borderRadius: '8px',
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.75rem' }}>
                  <span
                    style={{
                      background: 'var(--admin-orange)',
                      color: '#fff',
                      width: '24px',
                      height: '24px',
                      borderRadius: '50%',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      fontSize: '0.75rem',
                      fontWeight: 700,
                    }}
                  >
                    {p.num}
                  </span>
                  <strong style={{ fontSize: '0.9rem' }}>Complex / Point #{p.num}</strong>
                </div>

                <div className="admin-form-group" style={{ marginBottom: '0.85rem' }}>
                  <label style={{ fontSize: '0.8rem' }}>Title</label>
                  <input
                    type="text"
                    className="admin-input"
                    value={whatsInside[p.titleKey] || ''}
                    onChange={(e) => updateSectionState('whatsInside', { ...whatsInside, [p.titleKey]: e.target.value })}
                    placeholder={p.defaultTitle}
                    style={{ fontSize: '0.85rem', padding: '0.55rem 0.75rem' }}
                  />
                </div>

                <div className="admin-form-group" style={{ marginBottom: 0 }}>
                  <label style={{ fontSize: '0.8rem' }}>Description</label>
                  <textarea
                    className="admin-input"
                    rows={2}
                    value={whatsInside[p.descKey] || ''}
                    onChange={(e) => updateSectionState('whatsInside', { ...whatsInside, [p.descKey]: e.target.value })}
                    placeholder={p.defaultDesc}
                    style={{ fontSize: '0.85rem', padding: '0.55rem 0.75rem' }}
                  />
                </div>
              </div>
            ))}
          </div>

          <SectionFooterBar
            sectionName="What's Inside Section"
            isSaving={isSaving}
            onSave={() => handleSaveSection('whatsInside', "What's Inside Section")}
          />
        </div>
      )}

      {/* ── SUBTAB 3: ABOUT ABHI SINGH SECTION ── */}
      {contentSubTab === 'about' && (
        <div style={{ padding: '1.75rem' }}>
          <SectionVisibilityToggle
            sectionName="About Section"
            isVisible={about.visible !== false}
            onToggle={(checked) => updateSectionState('about', { ...about, visible: checked })}
          />

          <h4 style={{ fontFamily: 'var(--font-main)', fontSize: '1.15rem', marginBottom: '1.25rem' }}>
            Section Headings &amp; Biography Copy
          </h4>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '1.25rem', marginBottom: '1.5rem' }}>
            <div className="admin-form-group">
              <label style={{ fontWeight: 600, fontSize: '0.85rem' }}>Section Eyebrow</label>
              <input
                type="text"
                className="admin-input"
                value={about.eyebrow || ''}
                onChange={(e) => updateSectionState('about', { ...about, eyebrow: e.target.value })}
                placeholder="ABOUT THE AUTHOR"
              />
            </div>

            <div className="admin-form-group">
              <label style={{ fontWeight: 600, fontSize: '0.85rem' }}>Section Heading</label>
              <input
                type="text"
                className="admin-input"
                value={about.heading || ''}
                onChange={(e) => updateSectionState('about', { ...about, heading: e.target.value })}
                placeholder="Who Is Abhi Singh?"
              />
            </div>
          </div>

          <div className="admin-form-group" style={{ marginBottom: '1.25rem' }}>
            <label style={{ fontWeight: 600, fontSize: '0.85rem' }}>Paragraph 1 (Personal Background &amp; Transformation)</label>
            <textarea
              className="admin-input"
              rows={3}
              value={about.p1 || ''}
              onChange={(e) => updateSectionState('about', { ...about, p1: e.target.value })}
              placeholder="Hola, I'm Abhi Singh. Sales and marketing professional turned fitness and lifestyle coach..."
            />
          </div>

          <div className="admin-form-group" style={{ marginBottom: '1.25rem' }}>
            <label style={{ fontWeight: 600, fontSize: '0.85rem' }}>Paragraph 2 (Consistency &amp; Certifications Connector)</label>
            <textarea
              className="admin-input"
              rows={3}
              value={about.p2 || ''}
              onChange={(e) => updateSectionState('about', { ...about, p2: e.target.value })}
              placeholder="trained consistently for 20 months without missed weeks, and earned my certifications..."
            />
          </div>

          <div className="admin-form-group" style={{ marginBottom: '2rem' }}>
            <label style={{ fontWeight: 600, fontSize: '0.85rem' }}>Paragraph 3 (Philosophy &amp; Mission)</label>
            <textarea
              className="admin-input"
              rows={3}
              value={about.p3 || ''}
              onChange={(e) => updateSectionState('about', { ...about, p3: e.target.value })}
              placeholder="This site is what I learned doing it. No guru posturing. No toxic gym culture..."
            />
          </div>

          {/* Official Credentials Cards */}
          <h4 style={{ fontFamily: 'var(--font-main)', fontSize: '1.15rem', marginBottom: '1.25rem', paddingTop: '1rem', borderTop: '1px solid #E5E7EB' }}>
            Official Credentials &amp; Certifications
          </h4>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '1.5rem', marginBottom: '2rem' }}>
            {/* 1. Yoddha Race */}
            <div style={{ border: '1px solid #E5E7EB', background: '#F9FAFB', padding: '1.25rem', borderRadius: '8px' }}>
              <strong style={{ display: 'block', marginBottom: '0.85rem', color: '#111827' }}>1. The Yoddha Race</strong>
              <div className="admin-form-group">
                <label style={{ fontSize: '0.8rem' }}>Credential Title</label>
                <input
                  type="text"
                  className="admin-input"
                  value={credentials?.yoddha?.title || ''}
                  onChange={(e) =>
                    updateSectionState('credentials', {
                      ...credentials,
                      yoddha: { ...credentials.yoddha, title: e.target.value },
                    })
                  }
                  placeholder="The Yoddha Race"
                  style={{ fontSize: '0.85rem' }}
                />
              </div>
              <div className="admin-form-group">
                <label style={{ fontSize: '0.8rem' }}>Subtitle / Medal Details</label>
                <input
                  type="text"
                  className="admin-input"
                  value={credentials?.yoddha?.subtitle || ''}
                  onChange={(e) =>
                    updateSectionState('credentials', {
                      ...credentials,
                      yoddha: { ...credentials.yoddha, subtitle: e.target.value },
                    })
                  }
                  placeholder="Finisher Medal · The Ultimate Fitness Challenge"
                  style={{ fontSize: '0.85rem' }}
                />
              </div>
              <MediaPickerField
                label="Medal / Badge Image"
                value={credentials?.yoddha?.image || ''}
                onChange={(url) =>
                  updateSectionState('credentials', {
                    ...credentials,
                    yoddha: { ...credentials.yoddha, image: url },
                  })
                }
                mediaType="image"
                mediaList={mediaList}
                uploadMediaAsset={uploadMediaAsset}
                showToast={showToast}
              />
            </div>

            {/* 2. HYROX Mumbai */}
            <div style={{ border: '1px solid #E5E7EB', background: '#F9FAFB', padding: '1.25rem', borderRadius: '8px' }}>
              <strong style={{ display: 'block', marginBottom: '0.85rem', color: '#111827' }}>2. HYROX Mumbai</strong>
              <div className="admin-form-group">
                <label style={{ fontSize: '0.8rem' }}>Credential Title</label>
                <input
                  type="text"
                  className="admin-input"
                  value={credentials?.hyrox?.title || ''}
                  onChange={(e) =>
                    updateSectionState('credentials', {
                      ...credentials,
                      hyrox: { ...credentials.hyrox, title: e.target.value },
                    })
                  }
                  placeholder="HYROX Mumbai"
                  style={{ fontSize: '0.85rem' }}
                />
              </div>
              <div className="admin-form-group">
                <label style={{ fontSize: '0.8rem' }}>Subtitle / Patch Details</label>
                <input
                  type="text"
                  className="admin-input"
                  value={credentials?.hyrox?.subtitle || ''}
                  onChange={(e) =>
                    updateSectionState('credentials', {
                      ...credentials,
                      hyrox: { ...credentials.hyrox, subtitle: e.target.value },
                    })
                  }
                  placeholder="Official Open Singles Patch · 2026/2027"
                  style={{ fontSize: '0.85rem' }}
                />
              </div>
              <MediaPickerField
                label="Patch / Badge Image"
                value={credentials?.hyrox?.image || ''}
                onChange={(url) =>
                  updateSectionState('credentials', {
                    ...credentials,
                    hyrox: { ...credentials.hyrox, image: url },
                  })
                }
                mediaType="image"
                mediaList={mediaList}
                uploadMediaAsset={uploadMediaAsset}
                showToast={showToast}
              />
            </div>

            {/* 3. ACE Certification */}
            <div style={{ border: '1px solid #E5E7EB', background: '#F9FAFB', padding: '1.25rem', borderRadius: '8px' }}>
              <strong style={{ display: 'block', marginBottom: '0.85rem', color: '#111827' }}>3. ACE CPT Certification</strong>
              <div className="admin-form-group">
                <label style={{ fontSize: '0.8rem' }}>Credential Title</label>
                <input
                  type="text"
                  className="admin-input"
                  value={credentials?.ace?.title || ''}
                  onChange={(e) =>
                    updateSectionState('credentials', {
                      ...credentials,
                      ace: { ...credentials.ace, title: e.target.value },
                    })
                  }
                  placeholder="American Council on Exercise"
                  style={{ fontSize: '0.85rem' }}
                />
              </div>
              <div className="admin-form-group">
                <label style={{ fontSize: '0.8rem' }}>Subtitle / Certificate Details</label>
                <input
                  type="text"
                  className="admin-input"
                  value={credentials?.ace?.subtitle || ''}
                  onChange={(e) =>
                    updateSectionState('credentials', {
                      ...credentials,
                      ace: { ...credentials.ace, subtitle: e.target.value },
                    })
                  }
                  placeholder="Certified Personal Trainer · NCCA Accredited"
                  style={{ fontSize: '0.85rem' }}
                />
              </div>
              <MediaPickerField
                label="Certificate Document Image"
                value={credentials?.ace?.image || ''}
                onChange={(url) =>
                  updateSectionState('credentials', {
                    ...credentials,
                    ace: { ...credentials.ace, image: url },
                  })
                }
                mediaType="image"
                mediaList={mediaList}
                uploadMediaAsset={uploadMediaAsset}
                showToast={showToast}
              />
            </div>
          </div>

          {/* About Gallery Photo & Video */}
          <h4 style={{ fontFamily: 'var(--font-main)', fontSize: '1.15rem', marginBottom: '1.25rem', paddingTop: '1rem', borderTop: '1px solid #E5E7EB' }}>
            About Photo Gallery &amp; Training Video
          </h4>

          <div style={{ border: '1px solid #E5E7EB', background: '#F9FAFB', padding: '1.25rem', borderRadius: '8px', marginBottom: '1.5rem' }}>
            <strong style={{ display: 'block', marginBottom: '0.85rem' }}>Primary Action Photo (HYROX Farmer's Carry)</strong>
            <MediaPickerField
              label="Photo Image File"
              value={aboutGallery?.photo1?.src || '/assets/hyrox-mumbai.png'}
              onChange={(url) =>
                updateSectionState('aboutGallery', {
                  ...aboutGallery,
                  photo1: { ...aboutGallery.photo1, src: url },
                })
              }
              mediaType="image"
              mediaList={mediaList}
              uploadMediaAsset={uploadMediaAsset}
              showToast={showToast}
            />
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '1rem' }}>
              <div className="admin-form-group">
                <label style={{ fontSize: '0.8rem' }}>Image Alt Text</label>
                <input
                  type="text"
                  className="admin-input"
                  value={aboutGallery?.photo1?.alt || ''}
                  onChange={(e) =>
                    updateSectionState('aboutGallery', {
                      ...aboutGallery,
                      photo1: { ...aboutGallery.photo1, alt: e.target.value },
                    })
                  }
                  placeholder="Abhi Singh at HYROX Mumbai - Farmer's Carry"
                  style={{ fontSize: '0.85rem' }}
                />
              </div>
              <div className="admin-form-group">
                <label style={{ fontSize: '0.8rem' }}>Image Caption</label>
                <input
                  type="text"
                  className="admin-input"
                  value={aboutGallery?.photo1?.caption || ''}
                  onChange={(e) =>
                    updateSectionState('aboutGallery', {
                      ...aboutGallery,
                      photo1: { ...aboutGallery.photo1, caption: e.target.value },
                    })
                  }
                  placeholder="Farmer's Carry · 20 Months of Compound Effort"
                  style={{ fontSize: '0.85rem' }}
                />
              </div>
            </div>
          </div>

          <MediaPickerField
            label="About Training Video (Optional)"
            helperText="Upload an MP4 or WebM video of training or movement demonstrations."
            value={about.videoUrl || ''}
            onChange={(url) => updateSectionState('about', { ...about, videoUrl: url })}
            mediaType="video"
            mediaList={mediaList}
            uploadMediaAsset={uploadMediaAsset}
            showToast={showToast}
          />

          <SectionFooterBar
            sectionName="About Section"
            isSaving={isSaving}
            onSave={() => handleSaveSection('about', 'About Section')}
          />
        </div>
      )}

      {/* ── SUBTAB 4: FROM THE BLOG SECTION ── */}
      {contentSubTab === 'blog' && (
        <div style={{ padding: '1.75rem' }}>
          <SectionVisibilityToggle
            sectionName="Blog Section"
            isVisible={blog.visible !== false}
            onToggle={(checked) => updateSectionState('blog', { ...blog, visible: checked })}
          />

          <h4 style={{ fontFamily: 'var(--font-main)', fontSize: '1.15rem', marginBottom: '1.25rem' }}>
            Section Headings &amp; Intro Copy
          </h4>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '1.25rem', marginBottom: '1.5rem' }}>
            <div className="admin-form-group">
              <label style={{ fontWeight: 600, fontSize: '0.85rem' }}>Section Eyebrow</label>
              <input
                type="text"
                className="admin-input"
                value={blog.eyebrow || ''}
                onChange={(e) => updateSectionState('blog', { ...blog, eyebrow: e.target.value })}
                placeholder="ESSAYS & FRAMEWORKS"
              />
            </div>

            <div className="admin-form-group">
              <label style={{ fontWeight: 600, fontSize: '0.85rem' }}>Section Heading</label>
              <input
                type="text"
                className="admin-input"
                value={blog.heading || ''}
                onChange={(e) => updateSectionState('blog', { ...blog, heading: e.target.value })}
                placeholder="From The Blog"
              />
            </div>
          </div>

          <div className="admin-form-group" style={{ marginBottom: '1.5rem' }}>
            <label style={{ fontWeight: 600, fontSize: '0.85rem' }}>Section Subtitle</label>
            <textarea
              className="admin-input"
              rows={3}
              value={blog.subtitle || ''}
              onChange={(e) => updateSectionState('blog', { ...blog, subtitle: e.target.value })}
              placeholder="Practical, evidence-based essays on kettlebell mechanics, sustainable habits, and building lasting physical capacity."
            />
          </div>

          {/* Dynamic Content Integration Info Card */}
          <div
            style={{
              padding: '1.25rem',
              background: '#F9FAFB',
              border: '1px solid #E5E7EB',
              borderRadius: '8px',
              marginBottom: '1.5rem',
            }}
          >
            <div style={{ fontWeight: 700, fontSize: '0.92rem', marginBottom: '0.4rem', color: '#111827' }}>
              📚 Dynamic Essay Collection
            </div>
            <p style={{ fontSize: '0.84rem', color: 'var(--admin-text-muted)', lineHeight: 1.5, margin: 0, marginBottom: '0.85rem' }}>
              Articles displayed in this section on the live homepage are dynamically populated and paginated from your published blog articles in the Blog &amp; Archive database.
            </p>
            <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', flexWrap: 'wrap' }}>
              <span
                style={{
                  background: 'rgba(255, 98, 0, 0.1)',
                  color: 'var(--admin-orange)',
                  padding: '0.35rem 0.75rem',
                  borderRadius: '20px',
                  fontWeight: 700,
                  fontSize: '0.82rem',
                }}
              >
                {postsList.filter((p) => (p.status || 'published') === 'published').length} Published Essays
              </span>
            </div>
          </div>

          <SectionFooterBar
            sectionName="Blog Section"
            isSaving={isSaving}
            onSave={() => handleSaveSection('blog', 'Blog Section')}
          />
        </div>
      )}

      {/* ── SUBTAB 5: WHAT I AM WORKING ON NOW SECTION ── */}
      {contentSubTab === 'workingOn' && (
        <div style={{ padding: '1.75rem' }}>
          <SectionVisibilityToggle
            sectionName="What I Am Working On Section"
            isVisible={workingOn.visible !== false}
            onToggle={(checked) => updateSectionState('workingOn', { ...workingOn, visible: checked })}
          />

          <h4 style={{ fontFamily: 'var(--font-main)', fontSize: '1.15rem', marginBottom: '1.25rem' }}>
            Section Title
          </h4>

          <div className="admin-form-group" style={{ marginBottom: '2rem' }}>
            <label style={{ fontWeight: 600, fontSize: '0.85rem' }}>Section Heading</label>
            <input
              type="text"
              className="admin-input"
              value={workingOn.heading || ''}
              onChange={(e) => updateSectionState('workingOn', { ...workingOn, heading: e.target.value })}
              placeholder="What I am working on now"
            />
          </div>

          <h4 style={{ fontFamily: 'var(--font-main)', fontSize: '1.15rem', marginBottom: '1.25rem', paddingTop: '1rem', borderTop: '1px solid #E5E7EB' }}>
            Active Projects (Cards)
          </h4>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '1.5rem', marginBottom: '2rem' }}>
            {/* Project 1: The Book */}
            <div style={{ border: '1px solid #E5E7EB', background: '#F9FAFB', padding: '1.25rem', borderRadius: '8px' }}>
              <strong style={{ display: 'block', marginBottom: '0.85rem', color: '#111827' }}>Card 1: The Book Project</strong>

              <div className="admin-form-group">
                <label style={{ fontSize: '0.8rem' }}>Badge Label</label>
                <input
                  type="text"
                  className="admin-input"
                  value={workingOn.bookLabel || ''}
                  onChange={(e) => updateSectionState('workingOn', { ...workingOn, bookLabel: e.target.value })}
                  placeholder="The Book"
                  style={{ fontSize: '0.85rem' }}
                />
              </div>

              <div className="admin-form-group">
                <label style={{ fontSize: '0.8rem' }}>Card Title</label>
                <input
                  type="text"
                  className="admin-input"
                  value={workingOn.bookTitle || ''}
                  onChange={(e) => updateSectionState('workingOn', { ...workingOn, bookTitle: e.target.value })}
                  placeholder="Eat. Lift. Run. x"
                  style={{ fontSize: '0.85rem' }}
                />
              </div>

              <div className="admin-form-group">
                <label style={{ fontSize: '0.8rem' }}>Card Description</label>
                <textarea
                  className="admin-input"
                  rows={3}
                  value={workingOn.bookDesc || ''}
                  onChange={(e) => updateSectionState('workingOn', { ...workingOn, bookDesc: e.target.value })}
                  placeholder="The system I used to go from unfit to completing HYROX and Yoddha Race..."
                  style={{ fontSize: '0.85rem' }}
                />
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
                <div className="admin-form-group" style={{ marginBottom: 0 }}>
                  <label style={{ fontSize: '0.8rem' }}>Button Text</label>
                  <input
                    type="text"
                    className="admin-input"
                    value={workingOn.bookCta || ''}
                    onChange={(e) => updateSectionState('workingOn', { ...workingOn, bookCta: e.target.value })}
                    placeholder="Get early access →"
                    style={{ fontSize: '0.85rem' }}
                  />
                </div>
                <div className="admin-form-group" style={{ marginBottom: 0 }}>
                  <label style={{ fontSize: '0.8rem' }}>Destination URL / Anchor</label>
                  <input
                    type="text"
                    className="admin-input"
                    value={workingOn.bookHref || '#book'}
                    onChange={(e) => updateSectionState('workingOn', { ...workingOn, bookHref: e.target.value })}
                    placeholder="#book"
                    style={{ fontSize: '0.85rem' }}
                  />
                </div>
              </div>
            </div>

            {/* Project 2: The Newsletter */}
            <div style={{ border: '1px solid #E5E7EB', background: '#F9FAFB', padding: '1.25rem', borderRadius: '8px' }}>
              <strong style={{ display: 'block', marginBottom: '0.85rem', color: '#111827' }}>Card 2: The Newsletter Project</strong>

              <div className="admin-form-group">
                <label style={{ fontSize: '0.8rem' }}>Badge Label</label>
                <input
                  type="text"
                  className="admin-input"
                  value={workingOn.newsLabel || ''}
                  onChange={(e) => updateSectionState('workingOn', { ...workingOn, newsLabel: e.target.value })}
                  placeholder="The Newsletter"
                  style={{ fontSize: '0.85rem' }}
                />
              </div>

              <div className="admin-form-group">
                <label style={{ fontSize: '0.8rem' }}>Card Title</label>
                <input
                  type="text"
                  className="admin-input"
                  value={workingOn.newsTitle || ''}
                  onChange={(e) => updateSectionState('workingOn', { ...workingOn, newsTitle: e.target.value })}
                  placeholder="E.L.R.x Weekly"
                  style={{ fontSize: '0.85rem' }}
                />
              </div>

              <div className="admin-form-group">
                <label style={{ fontSize: '0.8rem' }}>Card Description</label>
                <textarea
                  className="admin-input"
                  rows={3}
                  value={workingOn.newsDesc || ''}
                  onChange={(e) => updateSectionState('workingOn', { ...workingOn, newsDesc: e.target.value })}
                  placeholder="1,000+ millennials. One story from my training life, one thing you can use this week..."
                  style={{ fontSize: '0.85rem' }}
                />
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
                <div className="admin-form-group" style={{ marginBottom: 0 }}>
                  <label style={{ fontSize: '0.8rem' }}>Button Text</label>
                  <input
                    type="text"
                    className="admin-input"
                    value={workingOn.newsCta || ''}
                    onChange={(e) => updateSectionState('workingOn', { ...workingOn, newsCta: e.target.value })}
                    placeholder="Join here →"
                    style={{ fontSize: '0.85rem' }}
                  />
                </div>
                <div className="admin-form-group" style={{ marginBottom: 0 }}>
                  <label style={{ fontSize: '0.8rem' }}>Destination URL / Anchor</label>
                  <input
                    type="text"
                    className="admin-input"
                    value={workingOn.newsHref || '#newsletter'}
                    onChange={(e) => updateSectionState('workingOn', { ...workingOn, newsHref: e.target.value })}
                    placeholder="#newsletter"
                    style={{ fontSize: '0.85rem' }}
                  />
                </div>
              </div>
            </div>
          </div>

          <SectionFooterBar
            sectionName="What I Am Working On Section"
            isSaving={isSaving}
            onSave={() => handleSaveSection('workingOn', 'What I Am Working On Section')}
          />
        </div>
      )}

      {/* ── SUBTAB 6: NEWSLETTER SIGNUP ("GET THE WEEKLY SIGNAL") ── */}
      {contentSubTab === 'newsletter' && (
        <div style={{ padding: '1.75rem' }}>
          <SectionVisibilityToggle
            sectionName="Weekly Signal Newsletter Section"
            isVisible={newsletter.visible !== false}
            onToggle={(checked) => updateSectionState('newsletter', { ...newsletter, visible: checked })}
          />

          <h4 style={{ fontFamily: 'var(--font-main)', fontSize: '1.15rem', marginBottom: '1.25rem' }}>
            Newsletter Copy &amp; Opt-in Form
          </h4>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '1.25rem', marginBottom: '1.5rem' }}>
            <div className="admin-form-group">
              <label style={{ fontWeight: 600, fontSize: '0.85rem' }}>Eyebrow Badge</label>
              <input
                type="text"
                className="admin-input"
                value={newsletter.eyebrow || 'FREE'}
                onChange={(e) => updateSectionState('newsletter', { ...newsletter, eyebrow: e.target.value })}
                placeholder="Free"
              />
            </div>

            <div className="admin-form-group">
              <label style={{ fontWeight: 600, fontSize: '0.85rem' }}>Main Heading</label>
              <input
                type="text"
                className="admin-input"
                value={newsletter.heading || ''}
                onChange={(e) => updateSectionState('newsletter', { ...newsletter, heading: e.target.value })}
                placeholder="Get the Weekly Signal."
              />
            </div>
          </div>

          <div className="admin-form-group" style={{ marginBottom: '1.5rem' }}>
            <label style={{ fontWeight: 600, fontSize: '0.85rem' }}>Description Subtext</label>
            <textarea
              className="admin-input"
              rows={3}
              value={newsletter.sub || ''}
              onChange={(e) => updateSectionState('newsletter', { ...newsletter, sub: e.target.value })}
              placeholder="One kettlebell complex, one training principle, one honest update every Sunday morning. No sponsors, no spam, unsubscribe in one click."
            />
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '1.25rem', marginBottom: '2rem' }}>
            <div className="admin-form-group">
              <label style={{ fontWeight: 600, fontSize: '0.85rem' }}>Social Proof / Guarantee Tagline</label>
              <input
                type="text"
                className="admin-input"
                value={newsletter.tagline || ''}
                onChange={(e) => updateSectionState('newsletter', { ...newsletter, tagline: e.target.value })}
                placeholder="1,000+ everyday lifters read it. Zero guru nonsense."
              />
            </div>

            <div className="admin-form-group">
              <label style={{ fontWeight: 600, fontSize: '0.85rem' }}>Email Placeholder</label>
              <input
                type="text"
                className="admin-input"
                value={newsletter.placeholder || 'Your Email Address'}
                onChange={(e) => updateSectionState('newsletter', { ...newsletter, placeholder: e.target.value })}
                placeholder="Your Email Address"
              />
            </div>

            <div className="admin-form-group">
              <label style={{ fontWeight: 600, fontSize: '0.85rem' }}>Submit Button Text</label>
              <input
                type="text"
                className="admin-input"
                value={newsletter.cta || ''}
                onChange={(e) => updateSectionState('newsletter', { ...newsletter, cta: e.target.value })}
                placeholder="Sign me up →"
              />
            </div>
          </div>

          <SectionFooterBar
            sectionName="Weekly Signal Newsletter Section"
            isSaving={isSaving}
            onSave={() => handleSaveSection('newsletter', 'Weekly Signal Section')}
          />
        </div>
      )}

      {/* ── SUBTAB 7: MODALS & POPUPS ── */}
      {contentSubTab === 'popups' && (
        <div style={{ padding: '1.75rem' }}>
          <h4 style={{ fontFamily: 'var(--font-main)', fontSize: '1.15rem', marginBottom: '1.25rem' }}>
            Store Checkout &amp; PDF Delivery Popups
          </h4>

          {/* Free Checkout Modal */}
          <div style={{ border: '1px solid #E5E7EB', background: '#F9FAFB', padding: '1.25rem', borderRadius: '8px', marginBottom: '1.5rem' }}>
            <strong style={{ display: 'block', marginBottom: '0.85rem', color: '#111827' }}>
              1. Free Digital Product Delivery Popup
            </strong>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '1rem', marginBottom: '1rem' }}>
              <div className="admin-form-group">
                <label style={{ fontSize: '0.8rem' }}>Heading</label>
                <input
                  type="text"
                  className="admin-input"
                  value={popups?.freeCheckout?.heading || ''}
                  onChange={(e) =>
                    updateSectionState('popups', {
                      ...popups,
                      freeCheckout: { ...popups.freeCheckout, heading: e.target.value },
                    })
                  }
                  placeholder="Get Instant Free Access"
                  style={{ fontSize: '0.85rem' }}
                />
              </div>

              <div className="admin-form-group">
                <label style={{ fontSize: '0.8rem' }}>Button Text</label>
                <input
                  type="text"
                  className="admin-input"
                  value={popups?.freeCheckout?.cta || ''}
                  onChange={(e) =>
                    updateSectionState('popups', {
                      ...popups,
                      freeCheckout: { ...popups.freeCheckout, cta: e.target.value },
                    })
                  }
                  placeholder="Send My Free PDF →"
                  style={{ fontSize: '0.85rem' }}
                />
              </div>
            </div>

            <div className="admin-form-group" style={{ marginBottom: '1rem' }}>
              <label style={{ fontSize: '0.8rem' }}>Subtitle</label>
              <input
                type="text"
                className="admin-input"
                value={popups?.freeCheckout?.sub || ''}
                onChange={(e) =>
                  updateSectionState('popups', {
                    ...popups,
                    freeCheckout: { ...popups.freeCheckout, sub: e.target.value },
                  })
                }
                placeholder="Enter your name and email to receive the full PDF in your inbox."
                style={{ fontSize: '0.85rem' }}
              />
            </div>

            <div className="admin-form-group" style={{ marginBottom: 0 }}>
              <label style={{ fontSize: '0.8rem' }}>Success Confirmation Message</label>
              <input
                type="text"
                className="admin-input"
                value={popups?.freeCheckout?.successTitle || ''}
                onChange={(e) =>
                  updateSectionState('popups', {
                    ...popups,
                    freeCheckout: { ...popups.freeCheckout, successTitle: e.target.value },
                  })
                }
                placeholder="Your PDF is on its way! Please check your inbox."
                style={{ fontSize: '0.85rem' }}
              />
            </div>
          </div>

          {/* Paid Checkout Modal */}
          <div style={{ border: '1px solid #E5E7EB', background: '#F9FAFB', padding: '1.25rem', borderRadius: '8px', marginBottom: '1.5rem' }}>
            <strong style={{ display: 'block', marginBottom: '0.85rem', color: '#111827' }}>
              2. Paid Digital Product Checkout Popup
            </strong>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '1rem', marginBottom: '1rem' }}>
              <div className="admin-form-group">
                <label style={{ fontSize: '0.8rem' }}>Heading</label>
                <input
                  type="text"
                  className="admin-input"
                  value={popups?.paidCheckout?.heading || ''}
                  onChange={(e) =>
                    updateSectionState('popups', {
                      ...popups,
                      paidCheckout: { ...popups.paidCheckout, heading: e.target.value },
                    })
                  }
                  placeholder="Complete Your Purchase"
                  style={{ fontSize: '0.85rem' }}
                />
              </div>

              <div className="admin-form-group">
                <label style={{ fontSize: '0.8rem' }}>Pay Button Text</label>
                <input
                  type="text"
                  className="admin-input"
                  value={popups?.paidCheckout?.cta || ''}
                  onChange={(e) =>
                    updateSectionState('popups', {
                      ...popups,
                      paidCheckout: { ...popups.paidCheckout, cta: e.target.value },
                    })
                  }
                  placeholder="Pay & Get My PDF →"
                  style={{ fontSize: '0.85rem' }}
                />
              </div>
            </div>

            <div className="admin-form-group" style={{ marginBottom: '1rem' }}>
              <label style={{ fontSize: '0.8rem' }}>Subtitle</label>
              <input
                type="text"
                className="admin-input"
                value={popups?.paidCheckout?.sub || ''}
                onChange={(e) =>
                  updateSectionState('popups', {
                    ...popups,
                    paidCheckout: { ...popups.paidCheckout, sub: e.target.value },
                  })
                }
                placeholder="Secure checkout with automatic PDF delivery to your inbox."
                style={{ fontSize: '0.85rem' }}
              />
            </div>

            <div className="admin-form-group" style={{ marginBottom: 0 }}>
              <label style={{ fontSize: '0.8rem' }}>Success Confirmation Message</label>
              <input
                type="text"
                className="admin-input"
                value={popups?.paidCheckout?.successTitle || ''}
                onChange={(e) =>
                  updateSectionState('popups', {
                    ...popups,
                    paidCheckout: { ...popups.paidCheckout, successTitle: e.target.value },
                  })
                }
                placeholder="Payment successful! Your PDF has been sent to your email address."
                style={{ fontSize: '0.85rem' }}
              />
            </div>
          </div>

          {/* Guarantee & Trust Badges */}
          <div style={{ border: '1px solid #E5E7EB', background: '#F9FAFB', padding: '1.25rem', borderRadius: '8px' }}>
            <strong style={{ display: 'block', marginBottom: '0.85rem', color: '#111827' }}>
              3. Guarantee &amp; Security Badges
            </strong>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '1rem', marginBottom: '1rem' }}>
              <div className="admin-form-group">
                <label style={{ fontSize: '0.8rem' }}>Guarantee Title</label>
                <input
                  type="text"
                  className="admin-input"
                  value={popups?.guarantee?.title || ''}
                  onChange={(e) =>
                    updateSectionState('popups', {
                      ...popups,
                      guarantee: { ...popups.guarantee, title: e.target.value },
                    })
                  }
                  placeholder="Personal Guarantee from Abhi Singh"
                  style={{ fontSize: '0.85rem' }}
                />
              </div>

              <div className="admin-form-group">
                <label style={{ fontSize: '0.8rem' }}>Trust Badge Line</label>
                <input
                  type="text"
                  className="admin-input"
                  value={popups?.trustBadge || ''}
                  onChange={(e) =>
                    updateSectionState('popups', {
                      ...popups,
                      trustBadge: e.target.value,
                    })
                  }
                  placeholder="🔒 256-bit Secure Encryption · Direct Email Delivery"
                  style={{ fontSize: '0.85rem' }}
                />
              </div>
            </div>

            <div className="admin-form-group" style={{ marginBottom: 0 }}>
              <label style={{ fontSize: '0.8rem' }}>Guarantee Description</label>
              <input
                type="text"
                className="admin-input"
                value={popups?.guarantee?.desc || ''}
                onChange={(e) =>
                  updateSectionState('popups', {
                    ...popups,
                    guarantee: { ...popups.guarantee, desc: e.target.value },
                  })
                }
                placeholder="Direct email delivery. No fluff, no spam, actionable guidance."
                style={{ fontSize: '0.85rem' }}
              />
            </div>
          </div>

          <SectionFooterBar
            sectionName="Modals & Popups"
            isSaving={isSaving}
            onSave={() => handleSaveSection('popups', 'Modals & Popups')}
          />
        </div>
      )}
    </div>
  );
}

