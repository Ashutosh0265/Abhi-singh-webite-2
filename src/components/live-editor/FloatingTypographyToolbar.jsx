import React, { useState } from 'react';
import { useLiveEditor } from './LiveEditorContext';

export default function FloatingTypographyToolbar() {
  const {
    isEditing,
    activeTypographyTarget,
    updateTypography,
    resetTypography,
    typographyStyles,
    setIsPanelOpen,
    setActivePanelTab,
    canUndo,
    canRedo,
    undo,
    redo,
  } = useLiveEditor();

  const [showLinkInput, setShowLinkInput] = useState(false);
  const [linkUrl, setLinkUrl] = useState('');
  const [linkNewTab, setLinkNewTab] = useState(true);

  if (!isEditing || !activeTypographyTarget) return null;

  const { key, rect, tag: targetTag } = activeTypographyTarget;
  const currentStyles = typographyStyles[key] || {};

  // Compute position: place above if there is sufficient headroom (> 115px from viewport top);
  // otherwise flip below the element so it never overlaps the sticky navbar or admin toolbar.
  const fitsAbove = rect.top >= 115;
  const top = fitsAbove
    ? Math.max(50, rect.top + window.scrollY - 54)
    : rect.bottom + window.scrollY + 8;
  const left = Math.max(16, Math.min(window.innerWidth - 680, rect.left + window.scrollX));

  const currentTag = currentStyles.tag || targetTag || 'p';

  const handleTagChange = (e) => {
    updateTypography(key, { tag: e.target.value });
  };

  const handleFontFamilyChange = (e) => {
    updateTypography(key, { fontFamily: e.target.value });
  };

  const handleFontSizeChange = (e) => {
    updateTypography(key, { fontSize: e.target.value });
  };

  const handleCustomFontSize = (e) => {
    const val = parseInt(e.target.value, 10);
    if (!isNaN(val) && val > 0) {
      updateTypography(key, { fontSize: `${val}px` });
    }
  };

  const stepFontSize = (delta) => {
    const currentPx = parseInt(currentStyles.fontSize || '16', 10) || 16;
    const newPx = Math.max(10, Math.min(120, currentPx + delta));
    updateTypography(key, { fontSize: `${newPx}px` });
  };

  const handleFontWeightChange = (e) => {
    updateTypography(key, { fontWeight: e.target.value });
  };

  const toggleBold = () => {
    const isBold = currentStyles.fontWeight === '700' || currentStyles.fontWeight === '800';
    updateTypography(key, { fontWeight: isBold ? '400' : '700' });
  };

  const toggleItalic = () => {
    const isItalic = currentStyles.fontStyle === 'italic';
    updateTypography(key, { fontStyle: isItalic ? 'normal' : 'italic' });
  };

  const toggleUnderline = () => {
    const isUnderline = currentStyles.textDecoration === 'underline';
    updateTypography(key, { textDecoration: isUnderline ? 'none' : 'underline' });
  };

  const toggleStrikethrough = () => {
    const isLineThrough = currentStyles.textDecoration === 'line-through';
    updateTypography(key, { textDecoration: isLineThrough ? 'none' : 'line-through' });
  };

  const toggleTransform = () => {
    const cur = currentStyles.textTransform;
    let next = 'none';
    if (!cur || cur === 'none') next = 'uppercase';
    else if (cur === 'uppercase') next = 'capitalize';
    else next = 'none';
    updateTypography(key, { textTransform: next });
  };

  const handleLineHeightChange = (e) => {
    updateTypography(key, { lineHeight: e.target.value });
  };

  const handleLetterSpacingChange = (e) => {
    updateTypography(key, { letterSpacing: e.target.value });
  };

  const handleAlignChange = (align) => {
    updateTypography(key, { textAlign: align });
  };

  const handleColorChange = (e) => {
    updateTypography(key, { color: e.target.value });
  };

  const handleBgColorChange = (e) => {
    updateTypography(key, { backgroundColor: e.target.value });
  };

  const clearBgColor = () => {
    updateTypography(key, { backgroundColor: '' });
  };

  const handleIndent = (deltaRem) => {
    const currentRem = parseFloat(currentStyles.paddingLeft || '0') || 0;
    const nextRem = Math.max(0, currentRem + deltaRem);
    updateTypography(key, { paddingLeft: nextRem > 0 ? `${nextRem}rem` : '' });
  };

  const handleApplyLink = (e) => {
    e.preventDefault();
    if (!linkUrl) {
      document.execCommand('unlink', false, null);
    } else {
      document.execCommand('createLink', false, linkUrl);
      if (linkNewTab) {
        // Find newly created anchor and set target _blank
        const selection = window.getSelection();
        if (selection && selection.anchorNode) {
          const parentAnchor = selection.anchorNode.parentElement?.closest('a');
          if (parentAnchor) {
            parentAnchor.setAttribute('target', '_blank');
            parentAnchor.setAttribute('rel', 'noopener noreferrer');
          }
        }
      }
    }
    setShowLinkInput(false);
  };

  const openInspector = () => {
    setIsPanelOpen(true);
    setActivePanelTab('element');
  };

  const isBold = currentStyles.fontWeight === '700' || currentStyles.fontWeight === '800';
  const isItalic = currentStyles.fontStyle === 'italic';
  const isUnderline = currentStyles.textDecoration === 'underline';
  const isStrikethrough = currentStyles.textDecoration === 'line-through';
  const currentTransform = currentStyles.textTransform || 'none';
  const currentSizePx = parseInt(currentStyles.fontSize || '16', 10) || 16;

  return (
    <div
      className="floating-typography-toolbar"
      style={{ top: `${top}px`, left: `${left}px` }}
      onMouseDown={(e) => {
        // Prevent loss of focus on editable element when clicking buttons
        if (e.target.tagName !== 'INPUT' && e.target.tagName !== 'SELECT') {
          e.preventDefault();
        }
      }}
    >
      {/* 1. Undo / Redo */}
      <div className="typography-tool-group">
        <button
          type="button"
          className="typography-btn"
          onClick={undo}
          disabled={!canUndo}
          title="Undo (Ctrl+Z)"
        >
          ↺
        </button>
        <button
          type="button"
          className="typography-btn"
          onClick={redo}
          disabled={!canRedo}
          title="Redo (Ctrl+Y)"
        >
          ↻
        </button>
      </div>

      {/* 2. Block Level (H1-H6, P) */}
      <div className="typography-tool-group">
        <select
          className="typography-select"
          value={currentTag}
          onChange={handleTagChange}
          title="Heading Level / Block Type"
        >
          <option value="p">¶ Paragraph</option>
          <option value="h1">H1 Heading</option>
          <option value="h2">H2 Heading</option>
          <option value="h3">H3 Heading</option>
          <option value="h4">H4 Heading</option>
          <option value="h5">H5 Heading</option>
          <option value="h6">H6 Heading</option>
        </select>
      </div>

      {/* 3. Font Family */}
      <div className="typography-tool-group">
        <select
          className="typography-select"
          value={currentStyles.fontFamily || ''}
          onChange={handleFontFamilyChange}
          title="Font Family"
        >
          <option value="">Font (Default)</option>
          <option value="'Schbisted Grotesk', sans-serif">Schbisted Grotesk</option>
          <option value="'Lora', Georgia, serif">Lora (Serif)</option>
          <option value="Arial, 'Helvetica Neue', Helvetica, sans-serif">Arial / System</option>
          <option value="'Inter', sans-serif">Inter</option>
          <option value="Georgia, serif">Georgia</option>
          <option value="system-ui, -apple-system, sans-serif">System Sans</option>
          <option value="ui-monospace, monospace">Monospace</option>
        </select>
      </div>

      {/* 4. Font Size with Stepper +/- & Numeric Input */}
      <div className="typography-tool-group">
        <button
          type="button"
          className="typography-btn"
          onClick={() => stepFontSize(-2)}
          title="Decrease Font Size (-2px)"
        >
          A-
        </button>
        <input
          type="number"
          min="10"
          max="120"
          value={currentSizePx}
          onChange={handleCustomFontSize}
          className="typography-number-input"
          title="Direct Numeric Font Size in Pixels"
        />
        <select
          className="typography-select typography-select-size"
          value={currentStyles.fontSize || ''}
          onChange={handleFontSizeChange}
          title="Font Size Presets"
        >
          <option value="">Size</option>
          <option value="12px">12px</option>
          <option value="14px">14px</option>
          <option value="16px">16px</option>
          <option value="18px">18px</option>
          <option value="20px">20px</option>
          <option value="24px">24px</option>
          <option value="28px">28px</option>
          <option value="32px">32px</option>
          <option value="36px">36px</option>
          <option value="40px">40px</option>
          <option value="48px">48px</option>
          <option value="56px">56px</option>
          <option value="64px">64px</option>
          <option value="72px">72px</option>
          <option value="80px">80px</option>
        </select>
        <button
          type="button"
          className="typography-btn"
          onClick={() => stepFontSize(2)}
          title="Increase Font Size (+2px)"
        >
          A+
        </button>
      </div>

      {/* 5. Font Weight */}
      <div className="typography-tool-group">
        <select
          className="typography-select"
          value={currentStyles.fontWeight || ''}
          onChange={handleFontWeightChange}
          title="Font Weight"
        >
          <option value="">Weight</option>
          <option value="300">300 Light</option>
          <option value="400">400 Regular</option>
          <option value="500">500 Medium</option>
          <option value="600">600 Semi Bold</option>
          <option value="700">700 Bold</option>
          <option value="800">800 Extra Bold</option>
        </select>
      </div>

      {/* 6. Style Toggles: Bold, Italic, Underline, Strikethrough, Transform */}
      <div className="typography-tool-group">
        <button
          type="button"
          className={`typography-btn ${isBold ? 'active' : ''}`}
          onClick={toggleBold}
          title="Bold"
          style={{ fontWeight: 800 }}
        >
          B
        </button>
        <button
          type="button"
          className={`typography-btn ${isItalic ? 'active' : ''}`}
          onClick={toggleItalic}
          title="Italic"
          style={{ fontStyle: 'italic', fontFamily: 'serif' }}
        >
          I
        </button>
        <button
          type="button"
          className={`typography-btn ${isUnderline ? 'active' : ''}`}
          onClick={toggleUnderline}
          title="Underline"
          style={{ textDecoration: 'underline' }}
        >
          U
        </button>
        <button
          type="button"
          className={`typography-btn ${isStrikethrough ? 'active' : ''}`}
          onClick={toggleStrikethrough}
          title="Strikethrough"
          style={{ textDecoration: 'line-through' }}
        >
          S
        </button>
        <button
          type="button"
          className={`typography-btn ${currentTransform !== 'none' ? 'active' : ''}`}
          onClick={toggleTransform}
          title={`Text Transform (${currentTransform.toUpperCase()})`}
        >
          {currentTransform === 'uppercase' ? 'TT' : currentTransform === 'capitalize' ? 'Tt' : 'tt'}
        </button>
      </div>

      {/* 7. Text Color & Highlight Color */}
      <div className="typography-tool-group">
        <label className="typography-color-label" title="Text Color">
          <span style={{ fontSize: '11px', fontWeight: 600 }}>Color</span>
          <input
            type="color"
            className="typography-color-input"
            value={currentStyles.color || '#212121'}
            onChange={handleColorChange}
          />
        </label>
        <label className="typography-color-label" title="Highlight / Background Color">
          <span style={{ fontSize: '11px', fontWeight: 600 }}>BG</span>
          <input
            type="color"
            className="typography-color-input"
            value={currentStyles.backgroundColor || '#FFE873'}
            onChange={handleBgColorChange}
          />
        </label>
        {currentStyles.backgroundColor && (
          <button
            type="button"
            className="typography-btn typography-btn-clear"
            onClick={clearBgColor}
            title="Remove Highlight Background"
          >
            ✕
          </button>
        )}
      </div>

      {/* 8. Text Alignment */}
      <div className="typography-tool-group">
        <button
          type="button"
          className={`typography-btn ${currentStyles.textAlign === 'left' ? 'active' : ''}`}
          onClick={() => handleAlignChange('left')}
          title="Align Left"
        >
          ⇤
        </button>
        <button
          type="button"
          className={`typography-btn ${currentStyles.textAlign === 'center' ? 'active' : ''}`}
          onClick={() => handleAlignChange('center')}
          title="Align Center"
        >
          ≡
        </button>
        <button
          type="button"
          className={`typography-btn ${currentStyles.textAlign === 'right' ? 'active' : ''}`}
          onClick={() => handleAlignChange('right')}
          title="Align Right"
        >
          ⇥
        </button>
        <button
          type="button"
          className={`typography-btn ${currentStyles.textAlign === 'justify' ? 'active' : ''}`}
          onClick={() => handleAlignChange('justify')}
          title="Justify Text"
        >
          ⇋
        </button>
      </div>

      {/* 9. Line Height & Letter Spacing */}
      <div className="typography-tool-group">
        <select
          className="typography-select"
          value={currentStyles.lineHeight || ''}
          onChange={handleLineHeightChange}
          title="Line Height"
        >
          <option value="">Line Height</option>
          <option value="1.0">1.0 Headline</option>
          <option value="1.15">1.15 Compact</option>
          <option value="1.25">1.25 Standard</option>
          <option value="1.4">1.4 Medium</option>
          <option value="1.5">1.5 Body</option>
          <option value="1.7">1.7 Relaxed</option>
        </select>
        <select
          className="typography-select"
          value={currentStyles.letterSpacing || ''}
          onChange={handleLetterSpacingChange}
          title="Letter Spacing"
        >
          <option value="">Spacing</option>
          <option value="-0.03em">Tight (-0.03em)</option>
          <option value="0em">Normal (0em)</option>
          <option value="0.06em">Wide (0.06em)</option>
          <option value="0.15em">Eyebrow (0.15em)</option>
        </select>
      </div>

      {/* 10. Indentation Controls */}
      <div className="typography-tool-group">
        <button
          type="button"
          className="typography-btn"
          onClick={() => handleIndent(-1)}
          title="Outdent (-1rem)"
        >
          ⇠
        </button>
        <button
          type="button"
          className="typography-btn"
          onClick={() => handleIndent(1)}
          title="Indent (+1rem)"
        >
          ⇢
        </button>
      </div>

      {/* 11. Hyperlink Button */}
      <div className="typography-tool-group">
        <button
          type="button"
          className={`typography-btn ${showLinkInput ? 'active' : ''}`}
          onClick={() => setShowLinkInput(!showLinkInput)}
          title="Insert / Edit Hyperlink"
        >
          🔗
        </button>
      </div>

      {/* 12. Inspector & Reset */}
      <div className="typography-tool-group">
        <button
          type="button"
          className="typography-btn"
          onClick={openInspector}
          title="Open Full Gutenberg Properties Inspector"
          style={{ background: '#2d3342', color: '#60a5fa' }}
        >
          ⚙️
        </button>
        <button
          type="button"
          className="typography-btn"
          onClick={() => resetTypography(key)}
          title="Clear all custom formatting & reset to defaults"
          style={{ color: '#f87171' }}
        >
          🧹
        </button>
      </div>

      {/* Floating Inline Link Popover */}
      {showLinkInput && (
        <div className="typography-link-popover" onMouseDown={(e) => e.stopPropagation()}>
          <form onSubmit={handleApplyLink} className="typography-link-form">
            <input
              type="text"
              placeholder="Paste URL (https://... or #section)"
              value={linkUrl}
              onChange={(e) => setLinkUrl(e.target.value)}
              className="typography-link-input"
              autoFocus
            />
            <label className="typography-link-checkbox">
              <input
                type="checkbox"
                checked={linkNewTab}
                onChange={(e) => setLinkNewTab(e.target.checked)}
              />
              <span>New tab</span>
            </label>
            <button type="submit" className="typography-link-submit-btn">
              Apply
            </button>
            <button
              type="button"
              className="typography-link-cancel-btn"
              onClick={() => setShowLinkInput(false)}
            >
              ✕
            </button>
          </form>
        </div>
      )}
    </div>
  );
}
