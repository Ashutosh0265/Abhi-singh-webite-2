import React from 'react';
import { EditableImage, EditableText } from './live-editor';

export default function AboutGallery({ onOpenLightbox }) {
  const photoItem = {
    id: 'hyrox-action',
    src: '/assets/hyrox-mumbai.png',
    alt: "Abhi Singh at HYROX Mumbai - Farmer's Carry",
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
        <EditableImage
          srcKey="aboutGallery.photo1.src"
          defaultSrc={photoItem.src}
          altKey="aboutGallery.photo1.alt"
          defaultAlt={photoItem.alt}
          className="about-img"
          loading="lazy"
        />
        <div className="about-caption" style={{ marginTop: '0.65rem' }}>
          <EditableText
            as="span"
            contentKey="aboutGallery.photo1.caption"
            defaultValue={photoItem.caption}
          />
        </div>
      </div>
    </div>
  );
}
