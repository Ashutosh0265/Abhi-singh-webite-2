import React, { useState } from 'react';

/**
 * Interactive credential hover & tap preview.
 * Shows a transient preview card on hover and opens full modal on click/tap.
 */
export default function CredentialPreview({ label, imageSrc, title, subtitle, onOpenModal }) {
  const [isHovered, setIsHovered] = useState(false);

  return (
    <span
      className="credential-preview-trigger"
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      <button
        type="button"
        className="cert-link"
        onClick={() => onOpenModal({ imageSrc, title, subtitle })}
        aria-label={`View ${title}`}
      >
        {label}
      </button>

      {/* Floating Hover Preview Card (Desktop) */}
      {isHovered && (
        <span className="credential-hover-card" role="tooltip">
          <img src={imageSrc} alt={title} className="credential-hover-img" />
          <span className="credential-hover-text">
            <strong>{title}</strong>
            <small>{subtitle} · Click to expand</small>
          </span>
        </span>
      )}
    </span>
  );
}

