/**
 * Markdown parser utility for Abhi Singh CMS & Blog Reader
 * Converts Markdown syntax to clean, semantic HTML suitable for DOMPurify sanitization.
 */
export function parseMarkdownToHtml(markdown) {
  if (!markdown || typeof markdown !== 'string') return '';

  let html = markdown;

  // Normalize line endings
  html = html.replace(/\r\n/g, '\n');

  // Code blocks (```lang ... ```)
  html = html.replace(/```([\s\S]*?)```/g, (match, code) => {
    const escaped = code
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;');
    return `<pre><code>${escaped.trim()}</code></pre>`;
  });

  // Inline code (`code`)
  html = html.replace(/`([^`]+)`/g, (match, code) => {
    const escaped = code
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;');
    return `<code>${escaped}</code>`;
  });

  // Headings
  html = html.replace(/^######\s+(.*)$/gim, '<h6>$1</h6>');
  html = html.replace(/^#####\s+(.*)$/gim, '<h5>$1</h5>');
  html = html.replace(/^####\s+(.*)$/gim, '<h4>$1</h4>');
  html = html.replace(/^###\s+(.*)$/gim, '<h3>$1</h3>');
  html = html.replace(/^##\s+(.*)$/gim, '<h2>$1</h2>');
  html = html.replace(/^#\s+(.*)$/gim, '<h1>$1</h1>');

  // Blockquotes (> quote)
  html = html.replace(/^\>\s+(.*)$/gim, '<blockquote><p>$1</p></blockquote>');

  // Horizontal rules (--- or ***)
  html = html.replace(/^(?:---|\*\*\*|___)\s*$/gim, '<hr />');

  // Images ![alt](url)
  html = html.replace(/!\[([^\]]*)\]\(([^)]+)\)/g, '<img src="$2" alt="$1" />');

  // Links [text](url)
  html = html.replace(/\[([^\]]+)\]\(([^)]+)\)/g, '<a href="$2" target="_blank" rel="noopener noreferrer">$1</a>');

  // Bold & Italic
  html = html.replace(/\*\*\*([^*]+)\*\*\*/g, '<strong><em>$1</em></strong>');
  html = html.replace(/___([^_]+)___/g, '<strong><em>$1</em></strong>');
  html = html.replace(/\*\*([^*]+)\*\*/g, '<strong>$1</strong>');
  html = html.replace(/__([^_]+)__/g, '<strong>$1</strong>');
  html = html.replace(/\*([^*]+)\*/g, '<em>$1</em>');
  html = html.replace(/_([^_]+)_/g, '<em>$1</em>');

  // Lists: Unordered lists (- or *)
  html = html.replace(/^\s*[-*]\s+(.*)$/gim, '<li>$1</li>');
  html = html.replace(/(<li>[\s\S]*?<\/li>)(?![\s\S]*?<li>)/gi, (match) => {
    return `<ul>${match}</ul>`;
  });

  // Split into paragraphs (blocks separated by two or more newlines)
  const blocks = html.split(/\n\s*\n/);
  const formattedBlocks = blocks.map((block) => {
    const trimmed = block.trim();
    if (!trimmed) return '';
    // If block is already an HTML block tag (h1-h6, ul, ol, blockquote, pre, div, hr, table), don't wrap in <p>
    if (/^<(?:h[1-6]|ul|ol|li|blockquote|pre|div|hr|table|img)/i.test(trimmed)) {
      return trimmed;
    }
    // Replace single newlines within a paragraph with <br />
    const withBreaks = trimmed.replace(/\n/g, '<br />');
    return `<p>${withBreaks}</p>`;
  });

  return formattedBlocks.filter(Boolean).join('\n\n');
}

