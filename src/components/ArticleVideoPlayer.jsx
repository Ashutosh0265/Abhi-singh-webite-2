import React from 'react';
import { getVideoInfo } from '../utils/mediaHelper.js';

export { getVideoInfo };

/**
 * Responsive, clean video player component for both embeds and direct files.
 */
export function ArticleVideoPlayer({ videoUrl, title = 'Article Video', style = {} }) {
  const info = getVideoInfo(videoUrl);
  if (!info) return null;

  return (
    <div
      className="article-video-wrap"
      style={{
        position: 'relative',
        width: '100%',
        borderRadius: '4px',
        overflow: 'hidden',
        background: '#000',
        aspectRatio: '16/9',
        border: '1px solid #212121',
        marginBottom: '1.5rem',
        ...style,
      }}
    >
      {info.type === 'youtube' || info.type === 'vimeo' ? (
        <iframe
          src={info.embedUrl}
          title={title}
          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
          allowFullScreen
          style={{
            position: 'absolute',
            top: 0,
            left: 0,
            width: '100%',
            height: '100%',
            border: 'none',
          }}
        />
      ) : (
        <video
          src={info.directUrl}
          controls
          playsInline
          preload="metadata"
          style={{
            width: '100%',
            height: '100%',
            objectFit: 'contain',
            display: 'block',
          }}
        />
      )}
    </div>
  );
}

export default ArticleVideoPlayer;

