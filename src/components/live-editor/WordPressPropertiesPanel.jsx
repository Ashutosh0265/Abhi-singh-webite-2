import React from 'react';
import { useLiveEditor, getNestedValue } from './LiveEditorContext';

export default function WordPressPropertiesPanel() {
  const {
    isPanelOpen,
    setIsPanelOpen,
    activePanelTab,
    setActivePanelTab,
    selectedElement,
    activeContent,
    typographyStyles,
    updateField,
    updateTypography,
    resetTypography,
    updateButtonStyle,
    resetButtonStyle,
    updateSectionStyle,
    resetSectionStyle,
    updateThemeColor,
    openMediaModal,
  } = useLiveEditor();

  if (!isPanelOpen) return null;

  const currentTheme = activeContent?.themeColors || {
    primary: '#FF6200',
    pageBackground: '#F6F6F4',
    surfaceBackground: '#FFFFFF',
    textMain: '#212121',
    textMuted: '#6B7280',
    accentYellow: '#FFE873',
    borderColor: '#212121',
  };

  // Selected element data
  const elementType = selectedElement?.type;
  const elementKey = selectedElement?.key;
  const currentTypography = (elementKey && typographyStyles[elementKey]) || {};
  const currentButtonStyles = (elementKey && activeContent.buttonStyles?.[elementKey]) || {};
  const currentSectionStyles = (elementKey && activeContent.sectionStyles?.[elementKey]) || {};

  return (
    <aside className="wordpress-properties-panel" aria-label="WordPress Inspector Properties Panel">
      {/* Panel Header */}
      <div className="panel-header">
        <div className="panel-header-title">
          <span style={{ color: '#FF6200', fontSize: '15px' }}>⚙️</span>
          <span>{selectedElement?.label || 'Inspector'}</span>
        </div>
        <button
          type="button"
          className="panel-close-btn"
          onClick={() => setIsPanelOpen(false)}
          title="Close Inspector"
        >
          ✕
        </button>
      </div>

      {/* Tabs: Element vs Popups vs Global Theme */}
      <div className="panel-tabs">
        <button
          type="button"
          className={`panel-tab-btn ${activePanelTab === 'element' ? 'active' : ''}`}
          onClick={() => setActivePanelTab('element')}
        >
          Block / Element
        </button>
        <button
          type="button"
          className={`panel-tab-btn ${activePanelTab === 'popups' ? 'active' : ''}`}
          onClick={() => setActivePanelTab('popups')}
        >
          Popups &amp; Modals
        </button>
        <button
          type="button"
          className={`panel-tab-btn ${activePanelTab === 'global' ? 'active' : ''}`}
          onClick={() => setActivePanelTab('global')}
        >
          Global Theme
        </button>
      </div>

      {/* Panel Scrollable Body */}
      <div className="panel-body">
        {activePanelTab === 'element' && (
          <div>
            {/* 1. BUTTON ELEMENT CONTROLS */}
            {elementType === 'button' && (
              <div className="panel-section">
                <div className="panel-section-title">Button Configuration</div>

                {/* Button Text */}
                <div className="panel-field">
                  <label>Button Label Text</label>
                  <input
                    type="text"
                    value={currentButtonStyles.text !== undefined ? currentButtonStyles.text : (selectedElement?.data?.text || '')}
                    onChange={(e) => updateButtonStyle(elementKey, { text: e.target.value })}
                    className="panel-input"
                    placeholder="Button Text"
                  />
                </div>

                {/* Destination URL */}
                <div className="panel-field">
                  <label>Destination Link (URL or #hash)</label>
                  <input
                    type="text"
                    value={currentButtonStyles.href || selectedElement?.data?.href || ''}
                    onChange={(e) => updateButtonStyle(elementKey, { href: e.target.value })}
                    className="panel-input"
                    placeholder="https://... or #store"
                  />
                </div>

                {/* Button Action Type */}
                <div className="panel-field">
                  <label>Button Action Mode</label>
                  <select
                    className="panel-select"
                    value={currentButtonStyles.actionType || selectedElement?.data?.actionType || 'default'}
                    onChange={(e) => updateButtonStyle(elementKey, { actionType: e.target.value })}
                  >
                    <option value="default">Default Behavior (Preserves Native Logic)</option>
                    <option value="submit">Form Submit / Payment Checkout</option>
                    <option value="link">Anchor Navigation Link</option>
                    <option value="custom">Interactive Action / Popup Opener</option>
                  </select>
                </div>

                {/* Button Visibility */}
                <div className="panel-field checkbox-field">
                  <label>
                    <input
                      type="checkbox"
                      checked={currentButtonStyles.visible !== false && selectedElement?.data?.visible !== false}
                      onChange={(e) => updateButtonStyle(elementKey, { visible: e.target.checked })}
                    />
                    <span>Button Visible on Live Site</span>
                  </label>
                </div>

                {/* Target Tab */}
                <div className="panel-field checkbox-field">
                  <label>
                    <input
                      type="checkbox"
                      checked={currentButtonStyles.target === '_blank' || selectedElement?.data?.target === '_blank'}
                      onChange={(e) => updateButtonStyle(elementKey, { target: e.target.checked ? '_blank' : '_self' })}
                    />
                    <span>Open in new browser tab (_blank)</span>
                  </label>
                </div>

                {/* Colors */}
                <div className="panel-section-title" style={{ marginTop: '16px' }}>Colors &amp; Fill</div>
                <div className="panel-color-row">
                  <label>Background Color</label>
                  <div className="color-picker-group">
                    <input
                      type="color"
                      value={currentButtonStyles.backgroundColor || '#FF6200'}
                      onChange={(e) => updateButtonStyle(elementKey, { backgroundColor: e.target.value })}
                    />
                    <input
                      type="text"
                      value={currentButtonStyles.backgroundColor || '#FF6200'}
                      onChange={(e) => updateButtonStyle(elementKey, { backgroundColor: e.target.value })}
                      className="panel-hex-input"
                    />
                  </div>
                </div>

                <div className="panel-color-row">
                  <label>Text Color</label>
                  <div className="color-picker-group">
                    <input
                      type="color"
                      value={currentButtonStyles.textColor || '#FFFFFF'}
                      onChange={(e) => updateButtonStyle(elementKey, { textColor: e.target.value })}
                    />
                    <input
                      type="text"
                      value={currentButtonStyles.textColor || '#FFFFFF'}
                      onChange={(e) => updateButtonStyle(elementKey, { textColor: e.target.value })}
                      className="panel-hex-input"
                    />
                  </div>
                </div>

                <div className="panel-color-row">
                  <label>Border Color</label>
                  <div className="color-picker-group">
                    <input
                      type="color"
                      value={currentButtonStyles.borderColor || '#212121'}
                      onChange={(e) => updateButtonStyle(elementKey, { borderColor: e.target.value })}
                    />
                    <input
                      type="text"
                      value={currentButtonStyles.borderColor || '#212121'}
                      onChange={(e) => updateButtonStyle(elementKey, { borderColor: e.target.value })}
                      className="panel-hex-input"
                    />
                  </div>
                </div>

                {/* Border Radius Slider */}
                <div className="panel-field" style={{ marginTop: '12px' }}>
                  <div className="field-label-row">
                    <label>Border Radius</label>
                    <span className="field-value-badge">{currentButtonStyles.borderRadius || '4px'}</span>
                  </div>
                  <input
                    type="range"
                    min="0"
                    max="30"
                    value={parseInt(currentButtonStyles.borderRadius || '4', 10)}
                    onChange={(e) => updateButtonStyle(elementKey, { borderRadius: `${e.target.value}px` })}
                    className="panel-slider"
                  />
                  <div style={{ display: 'flex', gap: '6px', marginTop: '6px' }}>
                    <button
                      type="button"
                      className="pill-preset-btn"
                      onClick={() => updateButtonStyle(elementKey, { borderRadius: '0px' })}
                    >
                      Square (0px)
                    </button>
                    <button
                      type="button"
                      className="pill-preset-btn"
                      onClick={() => updateButtonStyle(elementKey, { borderRadius: '6px' })}
                    >
                      Rounded (6px)
                    </button>
                    <button
                      type="button"
                      className="pill-preset-btn"
                      onClick={() => updateButtonStyle(elementKey, { borderRadius: '24px' })}
                    >
                      Pill (24px)
                    </button>
                  </div>
                </div>

                {/* Padding Presets */}
                <div className="panel-field">
                  <label>Button Size / Padding</label>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '6px' }}>
                    <button
                      type="button"
                      className="pill-preset-btn"
                      onClick={() => updateButtonStyle(elementKey, { padding: '6px 12px', fontSize: '13px' })}
                    >
                      Small
                    </button>
                    <button
                      type="button"
                      className="pill-preset-btn"
                      onClick={() => updateButtonStyle(elementKey, { padding: '10px 20px', fontSize: '15px' })}
                    >
                      Medium
                    </button>
                    <button
                      type="button"
                      className="pill-preset-btn"
                      onClick={() => updateButtonStyle(elementKey, { padding: '14px 28px', fontSize: '16px' })}
                    >
                      Large
                    </button>
                  </div>
                </div>

                {/* Reset button */}
                <button
                  type="button"
                  className="panel-reset-btn"
                  style={{ marginTop: '16px' }}
                  onClick={() => {
                    if (window.confirm('Reset this button styling and layout back to default?')) {
                      resetButtonStyle(elementKey);
                    }
                  }}
                >
                  ↺ Reset Button Styling to Default
                </button>
              </div>
            )}

            {/* 2. TEXT & TYPOGRAPHY CONTROLS */}
            {elementType === 'text' && (
              <div className="panel-section">
                <div className="panel-section-title">Text Content &amp; Formatting</div>

                {/* Direct Text Editor Field */}
                <div className="panel-field">
                  <div className="field-label-row">
                    <label>Text Content</label>
                    <span className="field-value-badge">
                      {selectedElement?.data?.allowMultiline ? 'Multi-line (Enter for newline)' : 'Live Text'}
                    </span>
                  </div>
                  <textarea
                    rows={selectedElement?.data?.allowMultiline ? 5 : 3}
                    className="panel-input"
                    style={{
                      width: '100%',
                      fontFamily: 'inherit',
                      fontSize: '13px',
                      lineHeight: '1.45',
                      padding: '8px 10px',
                      resize: 'vertical',
                      whiteSpace: 'pre-wrap',
                      background: '#1a1d24',
                      border: '1px solid #374151',
                      borderRadius: '4px',
                      color: '#f9fafb',
                    }}
                    value={
                      getNestedValue(activeContent, elementKey, undefined) !== undefined
                        ? String(getNestedValue(activeContent, elementKey, ''))
                        : (selectedElement?.data?.text || '')
                    }
                    onChange={(e) => updateField(elementKey, e.target.value)}
                    placeholder="Type content directly..."
                  />
                  {selectedElement?.data?.allowMultiline && (
                    <small style={{ color: '#9CA3AF', fontSize: '11px', display: 'block', marginTop: '4px' }}>
                      Tip: Press Enter to create new lines (1, 2, 3, or more lines). Line breaks are preserved.
                    </small>
                  )}
                </div>

                <div className="panel-section-title" style={{ marginTop: '16px' }}>Typography &amp; Layout</div>

                {/* HTML Block / Heading Tag */}
                <div className="panel-field">
                  <label>Block / Heading Level</label>
                  <select
                    className="panel-select"
                    value={currentTypography.tag || ''}
                    onChange={(e) => updateTypography(elementKey, { tag: e.target.value })}
                  >
                    <option value="">Default (Auto Tag)</option>
                    <option value="p">Paragraph (p)</option>
                    <option value="h1">Heading 1 (h1)</option>
                    <option value="h2">Heading 2 (h2)</option>
                    <option value="h3">Heading 3 (h3)</option>
                    <option value="h4">Heading 4 (h4)</option>
                    <option value="h5">Heading 5 (h5)</option>
                    <option value="h6">Heading 6 (h6)</option>
                  </select>
                </div>

                {/* Font Family */}
                <div className="panel-field">
                  <label>Font Family</label>
                  <select
                    className="panel-select"
                    value={currentTypography.fontFamily || ''}
                    onChange={(e) => updateTypography(elementKey, { fontFamily: e.target.value })}
                  >
                    <option value="">Default (Schbisted Grotesk)</option>
                    <option value="'Schbisted Grotesk', sans-serif">Schbisted Grotesk</option>
                    <option value="'Lora', Georgia, serif">Lora (Serif)</option>
                    <option value="Arial, 'Helvetica Neue', Helvetica, sans-serif">Arial / System</option>
                    <option value="'Inter', sans-serif">Inter</option>
                    <option value="Georgia, serif">Georgia</option>
                    <option value="system-ui, -apple-system, sans-serif">System Sans</option>
                    <option value="ui-monospace, monospace">Monospace</option>
                  </select>
                </div>

                {/* Font Size with Numeric Input + Stepper + Slider */}
                <div className="panel-field">
                  <div className="field-label-row">
                    <label>Font Size</label>
                    <span className="field-value-badge">{currentTypography.fontSize || 'Auto'}</span>
                  </div>
                  <div style={{ display: 'flex', gap: '6px', alignItems: 'center', marginBottom: '8px' }}>
                    <button
                      type="button"
                      className="pill-preset-btn"
                      style={{ padding: '4px 8px' }}
                      onClick={() => {
                        const cur = parseInt(currentTypography.fontSize || '16', 10);
                        updateTypography(elementKey, { fontSize: `${Math.max(10, cur - 2)}px` });
                      }}
                    >
                      -2px
                    </button>
                    <input
                      type="number"
                      min="10"
                      max="120"
                      value={parseInt(currentTypography.fontSize || '16', 10)}
                      onChange={(e) => updateTypography(elementKey, { fontSize: `${Math.max(10, Math.min(120, parseInt(e.target.value || '16', 10)))}px` })}
                      className="panel-input"
                      style={{ width: '70px', textAlign: 'center', padding: '4px 6px' }}
                    />
                    <button
                      type="button"
                      className="pill-preset-btn"
                      style={{ padding: '4px 8px' }}
                      onClick={() => {
                        const cur = parseInt(currentTypography.fontSize || '16', 10);
                        updateTypography(elementKey, { fontSize: `${Math.min(120, cur + 2)}px` });
                      }}
                    >
                      +2px
                    </button>
                  </div>
                  <input
                    type="range"
                    min="12"
                    max="80"
                    value={parseInt(currentTypography.fontSize || '16', 10)}
                    onChange={(e) => updateTypography(elementKey, { fontSize: `${e.target.value}px` })}
                    className="panel-slider"
                  />
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: '4px', marginTop: '6px' }}>
                    {['14px', '16px', '20px', '28px', '40px'].map((sz) => (
                      <button
                        key={sz}
                        type="button"
                        className={`pill-preset-btn ${currentTypography.fontSize === sz ? 'active' : ''}`}
                        onClick={() => updateTypography(elementKey, { fontSize: sz })}
                      >
                        {sz}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Font Weight */}
                <div className="panel-field">
                  <label>Font Weight</label>
                  <select
                    className="panel-select"
                    value={currentTypography.fontWeight || ''}
                    onChange={(e) => updateTypography(elementKey, { fontWeight: e.target.value })}
                  >
                    <option value="">Default Weight</option>
                    <option value="300">300 - Light</option>
                    <option value="400">400 - Regular</option>
                    <option value="500">500 - Medium</option>
                    <option value="600">600 - Semi Bold</option>
                    <option value="700">700 - Bold</option>
                    <option value="800">800 - Extra Bold</option>
                  </select>
                </div>

                {/* Font Style & Decoration */}
                <div className="panel-field">
                  <label>Styles &amp; Decorations</label>
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '6px' }}>
                    <button
                      type="button"
                      className={`pill-preset-btn ${parseInt(currentTypography.fontWeight || '400', 10) >= 700 ? 'active' : ''}`}
                      onClick={() => {
                        const isB = parseInt(currentTypography.fontWeight || '400', 10) >= 700;
                        updateTypography(elementKey, { fontWeight: isB ? '400' : '700' });
                      }}
                      style={{ fontWeight: 800 }}
                    >
                      Bold
                    </button>
                    <button
                      type="button"
                      className={`pill-preset-btn ${currentTypography.fontStyle === 'italic' ? 'active' : ''}`}
                      onClick={() => updateTypography(elementKey, { fontStyle: currentTypography.fontStyle === 'italic' ? 'normal' : 'italic' })}
                      style={{ fontStyle: 'italic', fontFamily: 'serif' }}
                    >
                      Italic
                    </button>
                    <button
                      type="button"
                      className={`pill-preset-btn ${currentTypography.textDecoration === 'underline' ? 'active' : ''}`}
                      onClick={() => updateTypography(elementKey, { textDecoration: currentTypography.textDecoration === 'underline' ? 'none' : 'underline' })}
                      style={{ textDecoration: 'underline' }}
                    >
                      Underline
                    </button>
                    <button
                      type="button"
                      className={`pill-preset-btn ${currentTypography.textDecoration === 'line-through' ? 'active' : ''}`}
                      onClick={() => updateTypography(elementKey, { textDecoration: currentTypography.textDecoration === 'line-through' ? 'none' : 'line-through' })}
                      style={{ textDecoration: 'line-through' }}
                    >
                      Strike
                    </button>
                  </div>
                </div>

                {/* Text Alignment */}
                <div className="panel-field">
                  <label>Alignment</label>
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '6px' }}>
                    {[
                      { key: 'left', label: 'Left', icon: '⇤' },
                      { key: 'center', label: 'Center', icon: '≡' },
                      { key: 'right', label: 'Right', icon: '⇥' },
                      { key: 'justify', label: 'Justify', icon: '⇋' },
                    ].map((align) => (
                      <button
                        key={align.key}
                        type="button"
                        className={`pill-preset-btn ${currentTypography.textAlign === align.key ? 'active' : ''}`}
                        onClick={() => updateTypography(elementKey, { textAlign: align.key })}
                        title={`Align ${align.label}`}
                      >
                        {align.icon} {align.label}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Line Height */}
                <div className="panel-field">
                  <label>Line Height</label>
                  <select
                    className="panel-select"
                    value={currentTypography.lineHeight || ''}
                    onChange={(e) => updateTypography(elementKey, { lineHeight: e.target.value })}
                  >
                    <option value="">Default Line Height</option>
                    <option value="1.0">1.0 - Very Tight (Headlines)</option>
                    <option value="1.15">1.15 - Tight</option>
                    <option value="1.25">1.25 - Standard Heading</option>
                    <option value="1.4">1.4 - Compact Body</option>
                    <option value="1.5">1.5 - Standard Body</option>
                    <option value="1.7">1.7 - Relaxed Editorial</option>
                  </select>
                </div>

                {/* Letter Spacing */}
                <div className="panel-field">
                  <label>Letter Spacing</label>
                  <select
                    className="panel-select"
                    value={currentTypography.letterSpacing || ''}
                    onChange={(e) => updateTypography(elementKey, { letterSpacing: e.target.value })}
                  >
                    <option value="">Default Spacing</option>
                    <option value="-0.03em">Tight (-0.03em)</option>
                    <option value="0em">Normal (0em)</option>
                    <option value="0.06em">Wide (0.06em)</option>
                    <option value="0.15em">Eyebrow (0.15em)</option>
                  </select>
                </div>

                {/* Text Color */}
                <div className="panel-color-row" style={{ marginTop: '12px' }}>
                  <label>Text Color</label>
                  <div className="color-picker-group">
                    <input
                      type="color"
                      value={currentTypography.color || '#212121'}
                      onChange={(e) => updateTypography(elementKey, { color: e.target.value })}
                    />
                    <input
                      type="text"
                      value={currentTypography.color || '#212121'}
                      onChange={(e) => updateTypography(elementKey, { color: e.target.value })}
                      className="panel-hex-input"
                    />
                  </div>
                </div>

                {/* Highlight / Background Color */}
                <div className="panel-color-row">
                  <label>Highlight Background</label>
                  <div className="color-picker-group">
                    <input
                      type="color"
                      value={currentTypography.backgroundColor || '#FFE873'}
                      onChange={(e) => updateTypography(elementKey, { backgroundColor: e.target.value })}
                    />
                    <input
                      type="text"
                      value={currentTypography.backgroundColor || ''}
                      placeholder="None"
                      onChange={(e) => updateTypography(elementKey, { backgroundColor: e.target.value })}
                      className="panel-hex-input"
                    />
                    {currentTypography.backgroundColor && (
                      <button
                        type="button"
                        className="pill-preset-btn"
                        style={{ padding: '2px 6px', fontSize: '10px' }}
                        onClick={() => updateTypography(elementKey, { backgroundColor: '' })}
                        title="Clear Highlight"
                      >
                        ✕
                      </button>
                    )}
                  </div>
                </div>

                {/* Text Transform & Decoration */}
                <div className="panel-field" style={{ marginTop: '12px' }}>
                  <label>Text Transformation</label>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '6px' }}>
                    <button
                      type="button"
                      className={`pill-preset-btn ${!currentTypography.textTransform || currentTypography.textTransform === 'none' ? 'active' : ''}`}
                      onClick={() => updateTypography(elementKey, { textTransform: 'none' })}
                    >
                      None
                    </button>
                    <button
                      type="button"
                      className={`pill-preset-btn ${currentTypography.textTransform === 'uppercase' ? 'active' : ''}`}
                      onClick={() => updateTypography(elementKey, { textTransform: 'uppercase' })}
                    >
                      UPPER
                    </button>
                    <button
                      type="button"
                      className={`pill-preset-btn ${currentTypography.textTransform === 'capitalize' ? 'active' : ''}`}
                      onClick={() => updateTypography(elementKey, { textTransform: 'capitalize' })}
                    >
                      Capitalize
                    </button>
                  </div>
                </div>

                {/* Text Indentation */}
                <div className="panel-field">
                  <label>Indentation</label>
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '6px' }}>
                    <button
                      type="button"
                      className="pill-preset-btn"
                      onClick={() => {
                        const cur = parseFloat(currentTypography.paddingLeft || '0');
                        updateTypography(elementKey, { paddingLeft: `${Math.max(0, cur - 1)}rem` });
                      }}
                    >
                      ⇠ Outdent
                    </button>
                    <button
                      type="button"
                      className="pill-preset-btn"
                      onClick={() => updateTypography(elementKey, { paddingLeft: '0rem' })}
                    >
                      0 (None)
                    </button>
                    <button
                      type="button"
                      className="pill-preset-btn"
                      onClick={() => {
                        const cur = parseFloat(currentTypography.paddingLeft || '0');
                        updateTypography(elementKey, { paddingLeft: `${cur + 1}rem` });
                      }}
                    >
                      ⇢ Indent
                    </button>
                  </div>
                </div>

                {/* Reset button */}
                <button
                  type="button"
                  className="panel-reset-btn"
                  onClick={() => resetTypography(elementKey)}
                >
                  ↺ Reset Typography to Theme Default
                </button>
              </div>
            )}

            {/* 3. SECTION WRAPPER CONTROLS */}
            {elementType === 'section' && (
              <div className="panel-section">
                <div className="panel-section-title">Section Layout &amp; Spacing</div>

                {/* Section Width */}
                <div className="panel-field">
                  <label>Section Max Width</label>
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '6px' }}>
                    <button
                      type="button"
                      className={`pill-preset-btn ${!currentSectionStyles.maxWidth || currentSectionStyles.maxWidth === '100%' ? 'active' : ''}`}
                      onClick={() => updateSectionStyle(elementKey, { maxWidth: '100%' })}
                    >
                      Full (100%)
                    </button>
                    <button
                      type="button"
                      className={`pill-preset-btn ${currentSectionStyles.maxWidth === '1200px' ? 'active' : ''}`}
                      onClick={() => updateSectionStyle(elementKey, { maxWidth: '1200px' })}
                    >
                      1200px
                    </button>
                    <button
                      type="button"
                      className={`pill-preset-btn ${currentSectionStyles.maxWidth === '960px' ? 'active' : ''}`}
                      onClick={() => updateSectionStyle(elementKey, { maxWidth: '960px' })}
                    >
                      960px
                    </button>
                  </div>
                </div>

                {/* Section Min Height */}
                <div className="panel-field">
                  <label>Section Minimum Height</label>
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '6px' }}>
                    <button
                      type="button"
                      className={`pill-preset-btn ${!currentSectionStyles.minHeight || currentSectionStyles.minHeight === 'auto' ? 'active' : ''}`}
                      onClick={() => updateSectionStyle(elementKey, { minHeight: 'auto' })}
                    >
                      Auto
                    </button>
                    <button
                      type="button"
                      className={`pill-preset-btn ${currentSectionStyles.minHeight === '300px' ? 'active' : ''}`}
                      onClick={() => updateSectionStyle(elementKey, { minHeight: '300px' })}
                    >
                      300px
                    </button>
                    <button
                      type="button"
                      className={`pill-preset-btn ${currentSectionStyles.minHeight === '500px' ? 'active' : ''}`}
                      onClick={() => updateSectionStyle(elementKey, { minHeight: '500px' })}
                    >
                      500px
                    </button>
                    <button
                      type="button"
                      className={`pill-preset-btn ${currentSectionStyles.minHeight === '80vh' ? 'active' : ''}`}
                      onClick={() => updateSectionStyle(elementKey, { minHeight: '80vh' })}
                    >
                      80vh
                    </button>
                  </div>
                </div>

                {/* Content Alignment */}
                <div className="panel-field">
                  <label>Content Alignment</label>
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '6px' }}>
                    {['left', 'center', 'right'].map((align) => (
                      <button
                        key={align}
                        type="button"
                        className={`pill-preset-btn ${currentSectionStyles.textAlign === align ? 'active' : ''}`}
                        onClick={() => updateSectionStyle(elementKey, { textAlign: align })}
                      >
                        {align.toUpperCase()}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Vertical Padding (Top & Bottom) */}
                <div className="panel-field">
                  <label>Vertical Padding (Top &amp; Bottom)</label>
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '6px' }}>
                    <button
                      type="button"
                      className="pill-preset-btn"
                      onClick={() => updateSectionStyle(elementKey, { paddingTop: '0rem', paddingBottom: '0rem' })}
                    >
                      None (0)
                    </button>
                    <button
                      type="button"
                      className="pill-preset-btn"
                      onClick={() => updateSectionStyle(elementKey, { paddingTop: '2.5rem', paddingBottom: '2.5rem' })}
                    >
                      Compact
                    </button>
                    <button
                      type="button"
                      className="pill-preset-btn"
                      onClick={() => updateSectionStyle(elementKey, { paddingTop: '4.5rem', paddingBottom: '4.5rem' })}
                    >
                      Standard
                    </button>
                    <button
                      type="button"
                      className="pill-preset-btn"
                      onClick={() => updateSectionStyle(elementKey, { paddingTop: '7rem', paddingBottom: '7rem' })}
                    >
                      Spacious
                    </button>
                  </div>
                </div>

                {/* Horizontal Padding (Left & Right) */}
                <div className="panel-field">
                  <label>Horizontal Padding (Left &amp; Right)</label>
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '6px' }}>
                    <button
                      type="button"
                      className="pill-preset-btn"
                      onClick={() => updateSectionStyle(elementKey, { paddingLeft: '0rem', paddingRight: '0rem' })}
                    >
                      0 (None)
                    </button>
                    <button
                      type="button"
                      className="pill-preset-btn"
                      onClick={() => updateSectionStyle(elementKey, { paddingLeft: '1.5rem', paddingRight: '1.5rem' })}
                    >
                      Normal (1.5rem)
                    </button>
                    <button
                      type="button"
                      className="pill-preset-btn"
                      onClick={() => updateSectionStyle(elementKey, { paddingLeft: '3rem', paddingRight: '3rem' })}
                    >
                      Wide (3rem)
                    </button>
                  </div>
                </div>

                {/* Margins */}
                <div className="panel-field">
                  <label>Margin (Top &amp; Bottom)</label>
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '6px' }}>
                    <button
                      type="button"
                      className="pill-preset-btn"
                      onClick={() => updateSectionStyle(elementKey, { marginTop: '0rem', marginBottom: '0rem' })}
                    >
                      0 (None)
                    </button>
                    <button
                      type="button"
                      className="pill-preset-btn"
                      onClick={() => updateSectionStyle(elementKey, { marginTop: '2rem', marginBottom: '2rem' })}
                    >
                      2rem
                    </button>
                    <button
                      type="button"
                      className="pill-preset-btn"
                      onClick={() => updateSectionStyle(elementKey, { marginTop: '4rem', marginBottom: '4rem' })}
                    >
                      4rem
                    </button>
                  </div>
                </div>

                {/* Colors */}
                <div className="panel-section-title" style={{ marginTop: '16px' }}>Background &amp; Text Colors</div>

                <div className="panel-color-row">
                  <label>Background Color</label>
                  <div className="color-picker-group">
                    <input
                      type="color"
                      value={currentSectionStyles.backgroundColor || '#F6F6F4'}
                      onChange={(e) => updateSectionStyle(elementKey, { backgroundColor: e.target.value })}
                    />
                    <input
                      type="text"
                      value={currentSectionStyles.backgroundColor || '#F6F6F4'}
                      onChange={(e) => updateSectionStyle(elementKey, { backgroundColor: e.target.value })}
                      className="panel-hex-input"
                    />
                  </div>
                </div>

                {/* Quick Color Swatches */}
                <div style={{ display: 'flex', gap: '6px', marginBottom: '12px', flexWrap: 'wrap' }}>
                  {[
                    { label: 'Theme Gray', color: '#F6F6F4' },
                    { label: 'Subtle Gray', color: '#F5F5F0' },
                    { label: 'Pure White', color: '#FFFFFF' },
                    { label: 'Dark Charcoal', color: '#1A1A1A' },
                    { label: 'Warm Cream', color: '#FFF9F0' },
                  ].map((swatch) => (
                    <button
                      key={swatch.color}
                      type="button"
                      onClick={() => {
                        const textColor = swatch.color === '#1A1A1A' ? '#FFFFFF' : '#212121';
                        updateSectionStyle(elementKey, { backgroundColor: swatch.color, textColor });
                      }}
                      style={{
                        background: swatch.color,
                        border: currentSectionStyles.backgroundColor === swatch.color ? '2px solid #FF6200' : '1px solid #D1D5DB',
                        borderRadius: '4px',
                        width: '24px',
                        height: '24px',
                        cursor: 'pointer',
                      }}
                      title={`${swatch.label} (${swatch.color})`}
                    />
                  ))}
                </div>

                <div className="panel-color-row">
                  <label>Text Color</label>
                  <div className="color-picker-group">
                    <input
                      type="color"
                      value={currentSectionStyles.textColor || '#212121'}
                      onChange={(e) => updateSectionStyle(elementKey, { textColor: e.target.value })}
                    />
                    <input
                      type="text"
                      value={currentSectionStyles.textColor || '#212121'}
                      onChange={(e) => updateSectionStyle(elementKey, { textColor: e.target.value })}
                      className="panel-hex-input"
                    />
                  </div>
                </div>

                {/* Border & Shadows */}
                <div className="panel-section-title" style={{ marginTop: '16px' }}>Border &amp; Elevation</div>

                <div className="panel-field">
                  <label>Border Width &amp; Style</label>
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '6px', marginBottom: '8px' }}>
                    <button
                      type="button"
                      className={`pill-preset-btn ${!currentSectionStyles.borderWidth || currentSectionStyles.borderWidth === '0px' ? 'active' : ''}`}
                      onClick={() => updateSectionStyle(elementKey, { borderWidth: '0px', borderStyle: 'none' })}
                    >
                      None
                    </button>
                    <button
                      type="button"
                      className={`pill-preset-btn ${currentSectionStyles.borderWidth === '1px' ? 'active' : ''}`}
                      onClick={() => updateSectionStyle(elementKey, { borderWidth: '1px', borderStyle: 'solid' })}
                    >
                      1px Solid
                    </button>
                    <button
                      type="button"
                      className={`pill-preset-btn ${currentSectionStyles.borderWidth === '2px' ? 'active' : ''}`}
                      onClick={() => updateSectionStyle(elementKey, { borderWidth: '2px', borderStyle: 'solid' })}
                    >
                      2px Solid
                    </button>
                    <button
                      type="button"
                      className={`pill-preset-btn ${currentSectionStyles.borderStyle === 'dashed' ? 'active' : ''}`}
                      onClick={() => updateSectionStyle(elementKey, { borderWidth: '2px', borderStyle: 'dashed' })}
                    >
                      Dashed
                    </button>
                  </div>
                  {currentSectionStyles.borderWidth && currentSectionStyles.borderWidth !== '0px' && (
                    <div className="panel-color-row">
                      <label>Border Color</label>
                      <div className="color-picker-group">
                        <input
                          type="color"
                          value={currentSectionStyles.borderColor || '#212121'}
                          onChange={(e) => updateSectionStyle(elementKey, { borderColor: e.target.value })}
                        />
                        <input
                          type="text"
                          value={currentSectionStyles.borderColor || '#212121'}
                          onChange={(e) => updateSectionStyle(elementKey, { borderColor: e.target.value })}
                          className="panel-hex-input"
                        />
                      </div>
                    </div>
                  )}
                </div>

                {/* Border Radius */}
                <div className="panel-field">
                  <div className="field-label-row">
                    <label>Border Radius</label>
                    <span className="field-value-badge">{currentSectionStyles.borderRadius || '0px'}</span>
                  </div>
                  <input
                    type="range"
                    min="0"
                    max="30"
                    value={parseInt(currentSectionStyles.borderRadius || '0', 10)}
                    onChange={(e) => updateSectionStyle(elementKey, { borderRadius: `${e.target.value}px` })}
                    className="panel-slider"
                  />
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '6px', marginTop: '6px' }}>
                    {['0px', '6px', '16px', '24px'].map((rad) => (
                      <button
                        key={rad}
                        type="button"
                        className={`pill-preset-btn ${currentSectionStyles.borderRadius === rad ? 'active' : ''}`}
                        onClick={() => updateSectionStyle(elementKey, { borderRadius: rad })}
                      >
                        {rad}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Box Shadow */}
                <div className="panel-field">
                  <label>Box Shadow / Elevation</label>
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '6px' }}>
                    <button
                      type="button"
                      className={`pill-preset-btn ${!currentSectionStyles.boxShadow || currentSectionStyles.boxShadow === 'none' ? 'active' : ''}`}
                      onClick={() => updateSectionStyle(elementKey, { boxShadow: 'none' })}
                    >
                      None
                    </button>
                    <button
                      type="button"
                      className={`pill-preset-btn ${currentSectionStyles.boxShadow === '0 2px 8px rgba(0,0,0,0.06)' ? 'active' : ''}`}
                      onClick={() => updateSectionStyle(elementKey, { boxShadow: '0 2px 8px rgba(0,0,0,0.06)' })}
                    >
                      Subtle
                    </button>
                    <button
                      type="button"
                      className={`pill-preset-btn ${currentSectionStyles.boxShadow === '0 10px 25px rgba(0,0,0,0.1)' ? 'active' : ''}`}
                      onClick={() => updateSectionStyle(elementKey, { boxShadow: '0 10px 25px rgba(0,0,0,0.1)' })}
                    >
                      Elevated
                    </button>
                    <button
                      type="button"
                      className={`pill-preset-btn ${currentSectionStyles.boxShadow === '0 20px 40px rgba(0,0,0,0.15)' ? 'active' : ''}`}
                      onClick={() => updateSectionStyle(elementKey, { boxShadow: '0 20px 40px rgba(0,0,0,0.15)' })}
                    >
                      Floating
                    </button>
                  </div>
                </div>

                {/* Reset Section button */}
                <button
                  type="button"
                  className="panel-reset-btn"
                  style={{ marginTop: '16px' }}
                  onClick={() => {
                    if (window.confirm(`Reset styling for "${selectedElement?.label || elementKey}" back to design default?`)) {
                      resetSectionStyle(elementKey);
                    }
                  }}
                >
                  ↺ Reset Section Styling to Default
                </button>
              </div>
            )}

            {/* 4. DEFAULT PROMPT WHEN NOTHING IS SELECTED */}
            {!elementType && (
              <div className="panel-empty-state">
                <div style={{ fontSize: '28px', marginBottom: '12px' }}>👆</div>
                <div style={{ fontWeight: 700, fontSize: '14px', marginBottom: '6px' }}>
                  No Element Selected
                </div>
                <p style={{ fontSize: '12px', color: '#9ca3af', lineHeight: 1.5 }}>
                  Click directly on any heading, paragraph, button, image, or section on the live website to view and customize its properties.
                </p>
              </div>
            )}
          </div>
        )}

        {/* TAB 2: POPUPS & MODALS CONFIGURATION */}
        {activePanelTab === 'popups' && (
          <div className="panel-section">
            <div className="panel-section-title">Website Popups &amp; Modals</div>
            <p style={{ fontSize: '12px', color: '#9ca3af', marginBottom: '16px', lineHeight: 1.5 }}>
              Edit content, form field labels, placeholders, buttons, and delivery messages for every modal on the website. Click &ldquo;Preview &amp; Open&rdquo; to test and edit them live on screen.
            </p>

            {/* 1. FREE PDF ACCESS POPUP */}
            <div style={{ background: '#1e2330', borderRadius: '6px', padding: '12px', marginBottom: '16px', border: '1px solid #2e384d' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px' }}>
                <strong style={{ fontSize: '13px', color: '#f3f4f6' }}>1. Free PDF Access Popup</strong>
                <button
                  type="button"
                  className="pill-preset-btn"
                  style={{ fontSize: '11px', padding: '3px 8px', background: '#FF6200', color: '#fff', border: 'none' }}
                  onClick={() => window.dispatchEvent(new CustomEvent('elrx_preview_modal', { detail: { modalType: 'free' } }))}
                >
                  👁 Preview &amp; Open
                </button>
              </div>

              <div className="panel-field">
                <label>Popup Heading</label>
                <input
                  type="text"
                  className="panel-input"
                  value={getNestedValue(activeContent, 'popups.freeCheckout.heading', 'Get Instant Free Access')}
                  onChange={(e) => updateField('popups.freeCheckout.heading', e.target.value)}
                />
              </div>

              <div className="panel-field">
                <label>Subheading / Description</label>
                <textarea
                  rows={2}
                  className="panel-input"
                  style={{ resize: 'vertical' }}
                  value={getNestedValue(activeContent, 'popups.freeCheckout.sub', 'Enter your name and email to receive the full PDF in your inbox.')}
                  onChange={(e) => updateField('popups.freeCheckout.sub', e.target.value)}
                />
              </div>

              <div className="panel-field">
                <label>Name Field Label</label>
                <input
                  type="text"
                  className="panel-input"
                  value={getNestedValue(activeContent, 'popups.freeCheckout.nameLabel', 'Full Name')}
                  onChange={(e) => updateField('popups.freeCheckout.nameLabel', e.target.value)}
                />
              </div>

              <div className="panel-field">
                <label>Name Input Placeholder</label>
                <input
                  type="text"
                  className="panel-input"
                  value={getNestedValue(activeContent, 'popups.freeCheckout.namePlaceholder', 'e.g. Rahul Sharma')}
                  onChange={(e) => updateField('popups.freeCheckout.namePlaceholder', e.target.value)}
                />
              </div>

              <div className="panel-field">
                <label>Email Field Label</label>
                <input
                  type="text"
                  className="panel-input"
                  value={getNestedValue(activeContent, 'popups.freeCheckout.emailLabel', 'Email Address (For PDF Delivery)')}
                  onChange={(e) => updateField('popups.freeCheckout.emailLabel', e.target.value)}
                />
              </div>

              <div className="panel-field">
                <label>Email Input Placeholder</label>
                <input
                  type="text"
                  className="panel-input"
                  value={getNestedValue(activeContent, 'popups.freeCheckout.emailPlaceholder', 'e.g. rahul@example.com')}
                  onChange={(e) => updateField('popups.freeCheckout.emailPlaceholder', e.target.value)}
                />
              </div>

              <div className="panel-field">
                <label>Button Label Text</label>
                <input
                  type="text"
                  className="panel-input"
                  value={getNestedValue(activeContent, 'popups.freeCheckout.cta', 'Send My Free PDF →')}
                  onChange={(e) => {
                    updateField('popups.freeCheckout.cta', e.target.value);
                    updateButtonStyle('popups.freeCheckout.cta', { text: e.target.value });
                  }}
                />
              </div>

              <div className="panel-field">
                <label>Success Message</label>
                <input
                  type="text"
                  className="panel-input"
                  value={getNestedValue(activeContent, 'popups.freeCheckout.successTitle', 'Your PDF is on its way! Please check your inbox.')}
                  onChange={(e) => updateField('popups.freeCheckout.successTitle', e.target.value)}
                />
              </div>
            </div>

            {/* 2. PAID PRODUCT PURCHASE POPUP */}
            <div style={{ background: '#1e2330', borderRadius: '6px', padding: '12px', marginBottom: '16px', border: '1px solid #2e384d' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px' }}>
                <strong style={{ fontSize: '13px', color: '#f3f4f6' }}>2. Paid Product Checkout Popup</strong>
                <button
                  type="button"
                  className="pill-preset-btn"
                  style={{ fontSize: '11px', padding: '3px 8px', background: '#FF6200', color: '#fff', border: 'none' }}
                  onClick={() => window.dispatchEvent(new CustomEvent('elrx_preview_modal', { detail: { modalType: 'paid' } }))}
                >
                  👁 Preview &amp; Open
                </button>
              </div>

              <div className="panel-field">
                <label>Popup Heading</label>
                <input
                  type="text"
                  className="panel-input"
                  value={getNestedValue(activeContent, 'popups.paidCheckout.heading', 'Complete Your Purchase')}
                  onChange={(e) => updateField('popups.paidCheckout.heading', e.target.value)}
                />
              </div>

              <div className="panel-field">
                <label>Subheading / Description</label>
                <textarea
                  rows={2}
                  className="panel-input"
                  style={{ resize: 'vertical' }}
                  value={getNestedValue(activeContent, 'popups.paidCheckout.sub', 'Secure checkout with automatic PDF delivery to your inbox.')}
                  onChange={(e) => updateField('popups.paidCheckout.sub', e.target.value)}
                />
              </div>

              <div className="panel-field">
                <label>Name Field Label</label>
                <input
                  type="text"
                  className="panel-input"
                  value={getNestedValue(activeContent, 'popups.paidCheckout.nameLabel', 'Full Name')}
                  onChange={(e) => updateField('popups.paidCheckout.nameLabel', e.target.value)}
                />
              </div>

              <div className="panel-field">
                <label>Email Field Label</label>
                <input
                  type="text"
                  className="panel-input"
                  value={getNestedValue(activeContent, 'popups.paidCheckout.emailLabel', 'Email Address (For PDF Delivery)')}
                  onChange={(e) => updateField('popups.paidCheckout.emailLabel', e.target.value)}
                />
              </div>

              <div className="panel-field">
                <label>Payment Gateway Selector Label</label>
                <input
                  type="text"
                  className="panel-input"
                  value={getNestedValue(activeContent, 'popups.paidCheckout.gatewayLabel', 'Select Payment Gateway')}
                  onChange={(e) => updateField('popups.paidCheckout.gatewayLabel', e.target.value)}
                />
              </div>

              <div className="panel-field">
                <label>Button Label Text</label>
                <input
                  type="text"
                  className="panel-input"
                  value={getNestedValue(activeContent, 'popups.paidCheckout.cta', 'Pay & Get My PDF →')}
                  onChange={(e) => {
                    updateField('popups.paidCheckout.cta', e.target.value);
                    updateButtonStyle('popups.paidCheckout.cta', { text: e.target.value });
                  }}
                />
              </div>

              <div className="panel-field">
                <label>Success Message</label>
                <input
                  type="text"
                  className="panel-input"
                  value={getNestedValue(activeContent, 'popups.paidCheckout.successTitle', 'Payment Successful! Your PDF has been delivered.')}
                  onChange={(e) => updateField('popups.paidCheckout.successTitle', e.target.value)}
                />
              </div>
            </div>

            {/* 3. PRIORITY WAITLIST POPUP */}
            <div style={{ background: '#1e2330', borderRadius: '6px', padding: '12px', marginBottom: '16px', border: '1px solid #2e384d' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px' }}>
                <strong style={{ fontSize: '13px', color: '#f3f4f6' }}>3. Priority Waitlist Popup</strong>
                <button
                  type="button"
                  className="pill-preset-btn"
                  style={{ fontSize: '11px', padding: '3px 8px', background: '#FF6200', color: '#fff', border: 'none' }}
                  onClick={() => window.dispatchEvent(new CustomEvent('elrx_preview_modal', { detail: { modalType: 'waitlist' } }))}
                >
                  👁 Preview &amp; Open
                </button>
              </div>

              <div className="panel-field">
                <label>Popup Heading</label>
                <input
                  type="text"
                  className="panel-input"
                  value={getNestedValue(activeContent, 'popups.waitlist.heading', 'Join the Priority Waitlist')}
                  onChange={(e) => updateField('popups.waitlist.heading', e.target.value)}
                />
              </div>

              <div className="panel-field">
                <label>Subheading / Description</label>
                <textarea
                  rows={2}
                  className="panel-input"
                  style={{ resize: 'vertical' }}
                  value={getNestedValue(activeContent, 'popups.waitlist.sub', 'Be first to access this protocol with exclusive launch pricing.')}
                  onChange={(e) => updateField('popups.waitlist.sub', e.target.value)}
                />
              </div>

              <div className="panel-field">
                <label>Button Label Text</label>
                <input
                  type="text"
                  className="panel-input"
                  value={getNestedValue(activeContent, 'popups.waitlist.cta', 'Join Priority Waitlist →')}
                  onChange={(e) => {
                    updateField('popups.waitlist.cta', e.target.value);
                    updateButtonStyle('popups.waitlist.cta', { text: e.target.value });
                  }}
                />
              </div>
            </div>

            {/* 4. EXIT-INTENT / NEWSLETTER POPUP */}
            <div style={{ background: '#1e2330', borderRadius: '6px', padding: '12px', marginBottom: '16px', border: '1px solid #2e384d' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px' }}>
                <strong style={{ fontSize: '13px', color: '#f3f4f6' }}>4. Exit-Intent Newsletter Popup</strong>
                <button
                  type="button"
                  className="pill-preset-btn"
                  style={{ fontSize: '11px', padding: '3px 8px', background: '#FF6200', color: '#fff', border: 'none' }}
                  onClick={() => window.dispatchEvent(new CustomEvent('elrx_preview_modal', { detail: { modalType: 'newsletter' } }))}
                >
                  👁 Preview &amp; Open
                </button>
              </div>

              <div className="panel-field">
                <label>Eyebrow Label</label>
                <input
                  type="text"
                  className="panel-input"
                  value={getNestedValue(activeContent, 'newsletterPopup.eyebrow', 'FREE WEEKLY NEWSLETTER')}
                  onChange={(e) => updateField('newsletterPopup.eyebrow', e.target.value)}
                />
              </div>

              <div className="panel-field">
                <label>Popup Heading</label>
                <input
                  type="text"
                  className="panel-input"
                  value={getNestedValue(activeContent, 'newsletterPopup.heading', 'Get the E.L.R.x Weekly')}
                  onChange={(e) => updateField('newsletterPopup.heading', e.target.value)}
                />
              </div>

              <div className="panel-field">
                <label>Description</label>
                <textarea
                  rows={2}
                  className="panel-input"
                  style={{ resize: 'vertical' }}
                  value={getNestedValue(activeContent, 'newsletterPopup.description', 'Join 1,000+ everyday lifters. One story from my training journey, one actionable kettlebell complex or nutrition principle you can apply this week.')}
                  onChange={(e) => updateField('newsletterPopup.description', e.target.value)}
                />
              </div>

              <div className="panel-field">
                <label>Email Input Placeholder</label>
                <input
                  type="text"
                  className="panel-input"
                  value={getNestedValue(activeContent, 'newsletterPopup.emailPlaceholder', 'Enter your email address')}
                  onChange={(e) => updateField('newsletterPopup.emailPlaceholder', e.target.value)}
                />
              </div>

              <div className="panel-field">
                <label>Button Label Text</label>
                <input
                  type="text"
                  className="panel-input"
                  value={getNestedValue(activeContent, 'newsletterPopup.ctaText', 'Subscribe Free →')}
                  onChange={(e) => {
                    updateField('newsletterPopup.ctaText', e.target.value);
                    updateButtonStyle('newsletterPopup.ctaText', { text: e.target.value });
                  }}
                />
              </div>

              <div className="panel-field">
                <label>Guarantee / Helper Text</label>
                <input
                  type="text"
                  className="panel-input"
                  value={getNestedValue(activeContent, 'newsletterPopup.guaranteeText', 'No fluff. No spam. Unsubscribe anytime in one click.')}
                  onChange={(e) => updateField('newsletterPopup.guaranteeText', e.target.value)}
                />
              </div>

              <div className="panel-field">
                <label>Success Title</label>
                <input
                  type="text"
                  className="panel-input"
                  value={getNestedValue(activeContent, 'newsletterPopup.successTitle', "You're in!")}
                  onChange={(e) => updateField('newsletterPopup.successTitle', e.target.value)}
                />
              </div>

              <div className="panel-field">
                <label>Success Description</label>
                <textarea
                  rows={2}
                  className="panel-input"
                  style={{ resize: 'vertical' }}
                  value={getNestedValue(activeContent, 'newsletterPopup.successDesc', 'Thank you for subscribing. Check your inbox for the welcome edition and your free complex guide.')}
                  onChange={(e) => updateField('newsletterPopup.successDesc', e.target.value)}
                />
              </div>
            </div>

            {/* 5. SHARED GUARANTEE & TRUST BADGES */}
            <div style={{ background: '#1e2330', borderRadius: '6px', padding: '12px', border: '1px solid #2e384d' }}>
              <strong style={{ fontSize: '13px', color: '#f3f4f6', display: 'block', marginBottom: '10px' }}>
                5. Guarantee &amp; Security Badges
              </strong>

              <div className="panel-field">
                <label>Guarantee Box Title</label>
                <input
                  type="text"
                  className="panel-input"
                  value={getNestedValue(activeContent, 'popups.guarantee.title', 'Personal Guarantee from Abhi Singh')}
                  onChange={(e) => updateField('popups.guarantee.title', e.target.value)}
                />
              </div>

              <div className="panel-field">
                <label>Guarantee Box Description</label>
                <input
                  type="text"
                  className="panel-input"
                  value={getNestedValue(activeContent, 'popups.guarantee.desc', 'Direct email delivery. No fluff, no spam, actionable guidance.')}
                  onChange={(e) => updateField('popups.guarantee.desc', e.target.value)}
                />
              </div>

              <div className="panel-field">
                <label>Security &amp; Trust Badge</label>
                <input
                  type="text"
                  className="panel-input"
                  value={getNestedValue(activeContent, 'popups.trustBadge', '🔒 256-bit Secure Encryption · Direct Email Delivery')}
                  onChange={(e) => updateField('popups.trustBadge', e.target.value)}
                />
              </div>
            </div>
          </div>
        )}

        {/* TAB 3: GLOBAL THEME & COLOR SYSTEM */}
        {activePanelTab === 'global' && (
          <div className="panel-section">
            <div className="panel-section-title">Website Global Color System</div>
            <p style={{ fontSize: '12px', color: '#9ca3af', marginBottom: '16px', lineHeight: 1.5 }}>
              Updating these colors synchronizes theme tokens across all pages, buttons, and headers immediately.
            </p>

            {/* Primary Orange */}
            <div className="panel-color-row">
              <label>Primary Brand Accent</label>
              <div className="color-picker-group">
                <input
                  type="color"
                  value={currentTheme.primary || '#FF6200'}
                  onChange={(e) => updateThemeColor('primary', e.target.value)}
                />
                <input
                  type="text"
                  value={currentTheme.primary || '#FF6200'}
                  onChange={(e) => updateThemeColor('primary', e.target.value)}
                  className="panel-hex-input"
                />
              </div>
            </div>

            {/* Page Background */}
            <div className="panel-color-row">
              <label>Page Background</label>
              <div className="color-picker-group">
                <input
                  type="color"
                  value={currentTheme.pageBackground || '#F6F6F4'}
                  onChange={(e) => updateThemeColor('pageBackground', e.target.value)}
                />
                <input
                  type="text"
                  value={currentTheme.pageBackground || '#F6F6F4'}
                  onChange={(e) => updateThemeColor('pageBackground', e.target.value)}
                  className="panel-hex-input"
                />
              </div>
            </div>

            {/* Card / Surface Background */}
            <div className="panel-color-row">
              <label>Surface / Card White</label>
              <div className="color-picker-group">
                <input
                  type="color"
                  value={currentTheme.surfaceBackground || '#FFFFFF'}
                  onChange={(e) => updateThemeColor('surfaceBackground', e.target.value)}
                />
                <input
                  type="text"
                  value={currentTheme.surfaceBackground || '#FFFFFF'}
                  onChange={(e) => updateThemeColor('surfaceBackground', e.target.value)}
                  className="panel-hex-input"
                />
              </div>
            </div>

            {/* Text Color */}
            <div className="panel-color-row">
              <label>Main Body Text</label>
              <div className="color-picker-group">
                <input
                  type="color"
                  value={currentTheme.textMain || '#212121'}
                  onChange={(e) => updateThemeColor('textMain', e.target.value)}
                />
                <input
                  type="text"
                  value={currentTheme.textMain || '#212121'}
                  onChange={(e) => updateThemeColor('textMain', e.target.value)}
                  className="panel-hex-input"
                />
              </div>
            </div>

            {/* Accent Yellow */}
            <div className="panel-color-row">
              <label>Highlight Yellow</label>
              <div className="color-picker-group">
                <input
                  type="color"
                  value={currentTheme.accentYellow || '#FFE873'}
                  onChange={(e) => updateThemeColor('accentYellow', e.target.value)}
                />
                <input
                  type="text"
                  value={currentTheme.accentYellow || '#FFE873'}
                  onChange={(e) => updateThemeColor('accentYellow', e.target.value)}
                  className="panel-hex-input"
                />
              </div>
            </div>

            {/* Border Color */}
            <div className="panel-color-row">
              <label>Border &amp; Divider Lines</label>
              <div className="color-picker-group">
                <input
                  type="color"
                  value={currentTheme.borderColor || '#212121'}
                  onChange={(e) => updateThemeColor('borderColor', e.target.value)}
                />
                <input
                  type="text"
                  value={currentTheme.borderColor || '#212121'}
                  onChange={(e) => updateThemeColor('borderColor', e.target.value)}
                  className="panel-hex-input"
                />
              </div>
            </div>

            <div style={{ marginTop: '20px', paddingTop: '16px', borderTop: '1px solid #282d3a' }}>
              <div style={{ fontSize: '11px', color: '#9ca3af', marginBottom: '8px' }}>
                💡 Tip: Changes apply live in preview. Save draft or publish to keep updates.
              </div>
            </div>
          </div>
        )}
      </div>
    </aside>
  );
}

