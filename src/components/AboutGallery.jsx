import React from 'react';

export default function AboutGallery({ onOpenLightbox }) {
  const photoItem = {
    id: 'hyrox-action',
    src: '/assets/hyrox-mumbai.png',
    alt: "Abhi Singh at HYROX Mumbai — Farmer's Carry",
    title: "HYROX Mumbai",
    caption: "Farmer's Carry · 20 Months of Compound Effort",
  };

  return (
    <div className="about-photo-wrap" aria-label="Abhi Singh at HYROX Mumbai">
      <div
        className="about-single-photo"
        onClick={() => onOpenLightbox && onOpenLightbox(photoItem)}
        role="button"
        tabIndex={0}
        onKeyDown={(e) => e.key === 'Enter' && onOpenLightbox && onOpenLightbox(photoItem)}
        style={{ cursor: 'pointer' }}
        aria-label="View larger: Abhi Singh at HYROX Mumbai"
      >
        <img
          src={photoItem.src}
          alt={photoItem.alt}
          className="about-img"
          loading="lazy"
        />
        <div className="about-caption" style={{ marginTop: '0.65rem' }}>
          {photoItem.caption}
        </div>
      </div>
    </div>
  );
}
