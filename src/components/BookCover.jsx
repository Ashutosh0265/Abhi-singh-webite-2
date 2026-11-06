import React from 'react';
import { useLiveEditor } from './live-editor/LiveEditorContext';

export default function BookCover() {
  const { isAdmin, isEditing, activeContent, updateField, openMediaModal } = useLiveEditor();

  const customCover = activeContent?.hero?.bookImage || null;

  const handleCoverClick = (e) => {
    if (!isAdmin || !isEditing) return;
    e.preventDefault();
    e.stopPropagation();
    openMediaModal('hero.bookImage', customCover || '', 'Eat. Lift. Run. Book Cover', '');
  };

  const handleResetCover = (e) => {
    e.preventDefault();
    e.stopPropagation();
    if (window.confirm('Restore the original Eat. Lift. Run. book cover design?')) {
      updateField('hero.bookImage', null);
    }
  };

  return (
    <div
      className={`book-cover-wrap ${isAdmin && isEditing ? 'live-editable-book-cover' : ''}`}
      onClick={handleCoverClick}
      style={{ position: 'relative', cursor: isAdmin && isEditing ? 'pointer' : 'default' }}
      title={isAdmin && isEditing ? 'Click to replace book cover via CMS Media Library' : 'Eat. Lift. Run. x'}
    >
      <div className="book-cover" aria-label="Eat. Lift. Run. x - 10 kettlebell complexes for everyday people">
        {customCover ? (
          <div className="book-cover-img-container" style={{ width: '100%', height: 'auto', overflow: 'visible' }}>
            <img
              src={customCover}
              alt="Eat. Lift. Run. x Book Cover"
              style={{
                width: '100%',
                height: 'auto',
                objectFit: 'contain',
                display: 'block',
                borderRadius: '3px 6px 6px 3px',
              }}
            />
          </div>
        ) : (
          <>
            <div className="cover-title-block">
              <div className="cover-title">
                Eat.<br />
                Lift.<br />
                Run.<em>x</em>
              </div>
            </div>
            <div className="cover-bottom">
              <div className="cover-subtitle">10 kettlebell complexes for everyday people</div>
              <div className="cover-author-row">
                <img
                  src="/assets/author-photo.png"
                  alt="Abhi Singh"
                  className="cover-author-photo"
                />
                <div className="cover-author-text">
                  <span className="cover-author-label">by</span>
                  <span className="cover-author-name">Abhi Singh</span>
                </div>
              </div>
            </div>
          </>
        )}

        {/* Live Edit Overlay Badge */}
        {isAdmin && isEditing && (
          <div
            className="editable-image-overlay"
            style={{
              position: 'absolute',
              inset: 0,
              background: 'rgba(0,0,0,0.45)',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '8px',
              zIndex: 10,
              opacity: 0,
              transition: 'opacity 0.2s ease',
              borderRadius: '3px 6px 6px 3px',
            }}
            onMouseEnter={(e) => { e.currentTarget.style.opacity = '1'; }}
            onMouseLeave={(e) => { e.currentTarget.style.opacity = '0'; }}
          >
            <div
              style={{
                background: 'var(--admin-orange, #FF6200)',
                color: '#fff',
                fontSize: '11px',
                fontWeight: 700,
                padding: '6px 12px',
                borderRadius: '6px',
                boxShadow: '0 4px 12px rgba(0,0,0,0.3)',
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
              }}
            >
              <span>📷</span>
              <span>Replace Book Cover</span>
            </div>
            {customCover && (
              <button
                type="button"
                onClick={handleResetCover}
                style={{
                  background: 'rgba(255,255,255,0.9)',
                  color: '#111827',
                  border: 'none',
                  fontSize: '10px',
                  fontWeight: 600,
                  padding: '4px 8px',
                  borderRadius: '4px',
                  cursor: 'pointer',
                }}
              >
                ↺ Restore Original Design
              </button>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
