import React from 'react';
import { useLiveEditor, getNestedValue } from './LiveEditorContext';

export default function EditableImage({
  srcKey,
  defaultSrc = '',
  altKey,
  defaultAlt = '',
  captionKey,
  defaultCaption = '',
  className = '',
  style = {},
  wrapperClassName = '',
  wrapperStyle = {},
  ...imageProps
}) {
  const { isAdmin, isEditing, activeContent, openMediaModal } = useLiveEditor();

  const currentSrc = srcKey ? getNestedValue(activeContent, srcKey, defaultSrc) : defaultSrc;
  const currentAlt = altKey ? getNestedValue(activeContent, altKey, defaultAlt) : defaultAlt;
  const currentCaption = captionKey ? getNestedValue(activeContent, captionKey, defaultCaption) : defaultCaption;

  // Regular visitor or viewing without editing enabled
  if (!isAdmin || !isEditing) {
    return (
      <img
        src={currentSrc}
        alt={currentAlt}
        className={className}
        style={style}
        {...imageProps}
      />
    );
  }

  // Admin in live editing mode
  const handleClick = (e) => {
    e.preventDefault();
    e.stopPropagation();
    openMediaModal(srcKey, currentSrc, currentAlt, currentCaption);
  };

  return (
    <div
      className={`editable-image-wrapper ${wrapperClassName}`.trim()}
      style={{ ...wrapperStyle, position: 'relative', cursor: 'pointer' }}
      onClick={handleClick}
      title="Click to replace image via CMS Media Library"
    >
      <img
        src={currentSrc}
        alt={currentAlt}
        className={className}
        style={style}
        {...imageProps}
      />
      <div className="editable-image-overlay">
        <div className="editable-image-badge">
          <span>📷</span>
          <span>Replace Image</span>
        </div>
      </div>
    </div>
  );
}

