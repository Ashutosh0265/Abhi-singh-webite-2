export const DEFAULT_BLOG_COVER = '/assets/hyrox-mumbai.png';

/**
 * Normalizes any article thumbnail string (data URL, blob URL, absolute HTTP/HTTPS, root-relative, or relative asset)
 * into a valid browser image source URL without corrupting data or blob URIs.
 * Never falls back to author profile photos.
 * @param {string} thumb - The thumbnail URL, data URI, blob URL, or path.
 * @returns {string} - Properly formatted src string.
 */
export function formatArticleThumbnailUrl(thumb) {
  if (!thumb || typeof thumb !== 'string') return DEFAULT_BLOG_COVER;
  const trimmed = thumb.trim();
  if (!trimmed) return DEFAULT_BLOG_COVER;

  // Never allow author avatar as an article cover image
  if (trimmed.includes('author-photo') || trimmed.includes('avatar.png')) {
    return DEFAULT_BLOG_COVER;
  }

  // 1. Data URLs (Base64) - must NOT prepend slash
  if (trimmed.startsWith('data:')) return trimmed;

  // 2. Blob URLs - must NOT prepend slash
  if (trimmed.startsWith('blob:')) return trimmed;

  // 3. Absolute HTTP/HTTPS URLs - return as is
  if (trimmed.startsWith('http://') || trimmed.startsWith('https://')) return trimmed;

  // 4. Root relative paths starting with /
  if (trimmed.startsWith('/')) return trimmed;

  // 5. Relative paths (e.g. "assets/hyrox-mumbai.png")
  return '/' + trimmed;
}

/**
 * Parses and extracts embed or direct stream info for YouTube, Vimeo, or direct video files.
 * @param {string} url - User supplied video URL or file path.
 * @returns {object|null} - Parsed video metadata or null if invalid.
 */
export function getVideoInfo(url) {
  if (!url || typeof url !== 'string') return null;
  const trimmed = url.trim();
  if (!trimmed) return null;

  // 1. YouTube (youtube.com, youtu.be, shorts, embeds)
  const ytMatch = trimmed.match(
    /(?:youtube\.com\/(?:[^\/]+\/.+\/|(?:v|e(?:mbed)?)\/|.*[?&]v=)|youtu\.be\/|youtube\.com\/shorts\/)([^"&?\/\s]{11})/i
  );
  if (ytMatch && ytMatch[1]) {
    return {
      type: 'youtube',
      id: ytMatch[1],
      embedUrl: `https://www.youtube-nocookie.com/embed/${ytMatch[1]}?rel=0&modestbranding=1`,
      directUrl: trimmed,
    };
  }

  // 2. Vimeo (vimeo.com/123456789)
  const vimeoMatch = trimmed.match(/(?:vimeo\.com\/)(\d+)/i);
  if (vimeoMatch && vimeoMatch[1]) {
    return {
      type: 'vimeo',
      id: vimeoMatch[1],
      embedUrl: `https://player.vimeo.com/video/${vimeoMatch[1]}`,
      directUrl: trimmed,
    };
  }

  // 3. Direct video files or blob/base64 streams
  return {
    type: 'direct',
    embedUrl: null,
    directUrl: trimmed,
  };
}

/**
 * Calculates dynamic estimated reading duration based on article text length (~200 words per minute).
 * Falls back to explicit user-entered duration if available, or 2 min read default.
 * @param {string} content - Full article body content (HTML or markdown).
 * @param {string} summary - Article summary or excerpt.
 * @param {string} explicitReadTime - Explicit read time saved in post record.
 * @returns {string} - Formatted reading time string (e.g. "3 min read").
 */
export function calculateReadingTime(content = '', summary = '', explicitReadTime = '') {
  const combined = `${summary || ''} ${content || ''}`;
  // Strip HTML tags and markdown symbols to get raw prose words
  const clean = combined.replace(/<[^>]*>/g, ' ').replace(/[#*_`~[\]()]/g, ' ').trim();
  const words = clean ? clean.split(/\s+/).filter(Boolean).length : 0;

  if (words > 0) {
    const minutes = Math.max(1, Math.ceil(words / 200));
    return `${minutes} min read`;
  }

  if (explicitReadTime && typeof explicitReadTime === 'string' && explicitReadTime.trim()) {
    const trimmed = explicitReadTime.trim();
    return trimmed.toLowerCase().includes('min') ? trimmed : `${trimmed} min read`;
  }

  return '2 min read';
}

/**
 * Formats article publication date into clean editorial format (e.g. "October 2026").
 * @param {string|Date} rawDate - Date string or timestamp.
 * @returns {string} - Clean formatted publication date.
 */
export function formatPublicationDate(rawDate) {
  if (!rawDate) return 'October 2026';
  const str = String(rawDate).trim();
  if (/^\d{4}-\d{2}/.test(str)) {
    try {
      const d = new Date(str);
      if (!isNaN(d.getTime())) {
        return d.toLocaleDateString('en-US', { month: 'long', year: 'numeric' });
      }
    } catch {
      // fallback
    }
  }
  return str;
}

