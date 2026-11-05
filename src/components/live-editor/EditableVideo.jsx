import React from 'react';
import { useLiveEditor, getNestedValue } from './LiveEditorContext';
import { ArticleVideoPlayer } from '../ArticleVideoPlayer';

export default function EditableVideo({
  videoKey,
  defaultUrl = '',
  title = 'Video Player',
  className = '',
  style = {},
}) {
  const { isAdmin, isEditing, activeContent, updateField } = useLiveEditor();

  const currentUrl = videoKey ? getNestedValue(activeContent, videoKey, defaultUrl) : defaultUrl;

  const handleEditVideo = (e) => {
    e.preventDefault();
    e.stopPropagation();
    const newUrl = window.prompt('Enter new Video URL (YouTube, Vimeo, or direct MP4):', currentUrl || '');
    if (newUrl !== null && newUrl.trim() !== '') {
      updateField(videoKey, newUrl.trim());
    }
  };

  if (!isAdmin || !isEditing) {
    if (!currentUrl) return null;
    return (
      <div className={className} style={style}>
        <ArticleVideoPlayer videoUrl={currentUrl} title={title} />
      </div>
    );
  }

  return (
    <div className={`editable-image-wrapper ${className}`.trim()} style={{ ...style, position: 'relative' }}>
      {currentUrl ? (
        <ArticleVideoPlayer videoUrl={currentUrl} title={title} />
      ) : (
        <div
          style={{
            background: '#1a1d24',
            border: '2px dashed #3a4150',
            borderRadius: '8px',
            padding: '30px',
            textAlign: 'center',
            color: '#9ca3af',
          }}
        >
          No video URL set. Click below to add one.
        </div>
      )}
      <div
        className="editable-image-overlay"
        onClick={handleEditVideo}
        title="Click to replace video URL"
      >
        <div className="editable-image-badge">
          <span>🎥</span>
          <span>Replace Video</span>
        </div>
      </div>
    </div>
  );
}

