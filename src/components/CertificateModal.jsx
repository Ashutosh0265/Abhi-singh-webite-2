import React, { useState, useEffect } from 'react';

export const ALL_ACHIEVEMENTS = [
  {
    id: 'ace',
    title: 'American Council on Exercise (ACE)',
    subtitle: 'Certified Personal Trainer (CPT) · NCCA Accredited',
    imageSrc: '/assets/ace-certificate.jpg',
    badge: 'NCCA Accredited',
    date: 'Valid through Oct 31, 2028',
    description: 'Gold standard in exercise science, biomechanics, and evidence-based program design.',
  },
  {
    id: 'yoddha',
    title: 'The Yoddha Race Finisher Medal',
    subtitle: 'Finisher Medal · The Ultimate Fitness Challenge',
    imageSrc: '/assets/yoddha-medal.jpg',
    badge: 'Finisher Medal',
    date: 'Official Race Completion',
    description: 'Elite obstacle and physical endurance challenge conquered through disciplined preparation.',
  },
  {
    id: 'hyrox-patch',
    title: 'HYROX Mumbai Open Singles Patch',
    subtitle: 'Official Open Singles Patch · 2026/2027 Season',
    imageSrc: '/assets/hyrox-patch.jpg',
    badge: 'Official Patch',
    date: 'Season 2026/2027',
    description: 'Official finisher patch earned competing in the global fitness racing phenomenon.',
  },
  {
    id: 'hyrox-action',
    title: 'HYROX Mumbai In Action',
    subtitle: "Farmer's Carry · 20 Months of Compound Effort",
    imageSrc: '/assets/hyrox-mumbai.png',
    badge: 'Race Performance',
    date: 'HYROX Mumbai',
    description: 'Live competition photograph during the rigorous heavy kettlebell farmer’s carry segment.',
  },
];

export default function CertificateModal({ isOpen, item, onClose }) {
  const [selectedId, setSelectedId] = useState('ace');
  const [imgLoading, setImgLoading] = useState(true);
  const [imgError, setImgError] = useState(false);

  // Sync selected credential whenever item prop changes
  useEffect(() => {
    if (item?.id) {
      setSelectedId(item.id);
    } else if (item?.imageSrc?.includes('yoddha')) {
      setSelectedId('yoddha');
    } else if (item?.imageSrc?.includes('patch')) {
      setSelectedId('hyrox-patch');
    } else if (item?.imageSrc?.includes('mumbai') || item?.src?.includes('mumbai')) {
      setSelectedId('hyrox-action');
    } else {
      setSelectedId('ace');
    }
    setImgLoading(true);
    setImgError(false);
  }, [item, isOpen]);

  if (!isOpen) return null;

  const currentItem =
    ALL_ACHIEVEMENTS.find((a) => a.id === selectedId) || ALL_ACHIEVEMENTS[0];

  const handleSelectTab = (id) => {
    setSelectedId(id);
    setImgLoading(true);
    setImgError(false);
  };

  return (
    <div
      className="modal-backdrop"
      onClick={onClose}
      role="dialog"
      aria-modal="true"
      aria-label={currentItem.title}
      data-lenis-prevent
    >
      <div
        className="modal-box modal-box-media"
        onClick={(e) => e.stopPropagation()}
        data-lenis-prevent
        style={{ maxWidth: '720px', width: '95%' }}
      >
        <button
          className="modal-close-btn"
          onClick={onClose}
          aria-label="Close Preview"
        >
          ✕
        </button>

        {/* Modal Header */}
        <div className="modal-header-compact">
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.35rem', flexWrap: 'wrap' }}>
            <span className="badge-verified">✓ Verified Authentic</span>
            <span style={{ fontSize: '0.78rem', fontWeight: 700, color: 'var(--orange)' }}>
              {currentItem.badge}
            </span>
          </div>
          <h3 className="modal-title-lora" style={{ margin: '0.2rem 0' }}>
            {currentItem.title}
          </h3>
          <p className="modal-subtitle-text">
            {currentItem.subtitle} · {currentItem.date}
          </p>
        </div>

        {/* Quick Achievement Switcher Tabs */}
        <div
          style={{
            display: 'flex',
            gap: '0.5rem',
            overflowX: 'auto',
            paddingBottom: '0.65rem',
            marginBottom: '1rem',
            borderBottom: '2px solid var(--black)',
          }}
        >
          {ALL_ACHIEVEMENTS.map((ach) => (
            <button
              key={ach.id}
              type="button"
              onClick={() => handleSelectTab(ach.id)}
              style={{
                padding: '0.45rem 0.85rem',
                fontSize: '0.78rem',
                fontWeight: 700,
                border: '2px solid var(--black)',
                borderRadius: '4px',
                background: selectedId === ach.id ? 'var(--orange)' : 'var(--white)',
                color: selectedId === ach.id ? 'var(--white)' : 'var(--black)',
                boxShadow: selectedId === ach.id ? '2px 2px 0 var(--black)' : 'none',
                cursor: 'pointer',
                whiteSpace: 'nowrap',
                transition: 'all 0.15s ease',
              }}
            >
              {ach.id === 'ace' && 'ACE CPT Certificate'}
              {ach.id === 'yoddha' && 'Yoddha Finisher Medal'}
              {ach.id === 'hyrox-patch' && 'HYROX Patch'}
              {ach.id === 'hyrox-action' && 'HYROX Race Action'}
            </button>
          ))}
        </div>

        {/* Media Frame with Anti-Blank Safeguards */}
        <div
          className="credential-modal-frame"
          style={{
            minHeight: '300px',
            maxHeight: '60vh',
            position: 'relative',
            background: 'var(--white)',
            border: '2px solid var(--black)',
            borderRadius: '4px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            overflow: 'hidden',
          }}
        >
          {imgLoading && (
            <div
              style={{
                position: 'absolute',
                inset: 0,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '0.5rem',
                fontSize: '0.9rem',
                fontWeight: 700,
                color: 'var(--black)',
                background: 'var(--white)',
                zIndex: 2,
              }}
            >
              <span className="btn-spinner" style={{ borderColor: 'rgba(0,0,0,0.15)', borderTopColor: 'var(--orange)' }} />
              Loading {currentItem.title}…
            </div>
          )}

          {!imgError ? (
            <img
              src={currentItem.imageSrc}
              alt={currentItem.title}
              className="credential-full-img"
              onLoad={() => setImgLoading(false)}
              onError={(e) => {
                console.warn('Image load error on modal, fallback:', currentItem.imageSrc);
                setImgLoading(false);
                setImgError(true);
              }}
              style={{
                display: imgLoading ? 'none' : 'block',
                maxWidth: '100%',
                maxHeight: '58vh',
                objectFit: 'contain',
                margin: '0 auto',
              }}
            />
          ) : (
            <div style={{ padding: '2.5rem 1.5rem', textAlign: 'center', background: 'var(--yellow)', width: '100%' }}>
              <div style={{ fontSize: '3rem', marginBottom: '0.5rem' }}>🏅</div>
              <strong style={{ display: 'block', fontSize: '1.2rem', marginBottom: '0.5rem', fontFamily: 'Lora, serif' }}>
                {currentItem.title}
              </strong>
              <p style={{ fontSize: '0.9rem', color: 'var(--black)', maxWidth: '440px', margin: '0 auto', lineHeight: 1.5 }}>
                {currentItem.description}
              </p>
            </div>
          )}
        </div>

        {/* Description & Close */}
        <div className="credential-modal-footer" style={{ marginTop: '1rem' }}>
          <p style={{ fontSize: '0.82rem', color: 'var(--black)', margin: 0, flex: 1, lineHeight: 1.5 }}>
            {currentItem.description}
          </p>
          <button
            type="button"
            className="btn-primary-yellow"
            style={{ width: 'auto', padding: '0.5rem 1.25rem', fontSize: '0.82rem', margin: 0 }}
            onClick={onClose}
          >
            Close Viewer
          </button>
        </div>
      </div>
    </div>
  );
}
