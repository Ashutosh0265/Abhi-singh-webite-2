import React, { useRef } from 'react';
import { useLiveEditor } from './LiveEditorContext';

export default function EditableSection({
  sectionKey,
  sectionLabel = 'Section',
  className = '',
  style = {},
  children,
  id,
  ...restProps
}) {
  const {
    isAdmin,
    isEditing,
    activeContent,
    selectedElement,
    selectElement,
    setIsPanelOpen,
    setActivePanelTab,
  } = useLiveEditor();

  const sectionRef = useRef(null);

  // Read saved styles for this sectionKey
  const customStyles = (sectionKey && activeContent.sectionStyles?.[sectionKey]) || {};

  const mergedStyle = {
    ...style,
    ...(customStyles.backgroundColor ? { backgroundColor: customStyles.backgroundColor } : {}),
    ...(customStyles.textColor ? { color: customStyles.textColor } : {}),
    ...(customStyles.paddingTop ? { paddingTop: customStyles.paddingTop } : {}),
    ...(customStyles.paddingBottom ? { paddingBottom: customStyles.paddingBottom } : {}),
    ...(customStyles.paddingLeft ? { paddingLeft: customStyles.paddingLeft } : {}),
    ...(customStyles.paddingRight ? { paddingRight: customStyles.paddingRight } : {}),
    ...(customStyles.marginTop ? { marginTop: customStyles.marginTop } : {}),
    ...(customStyles.marginBottom ? { marginBottom: customStyles.marginBottom } : {}),
    ...(customStyles.minHeight ? { minHeight: customStyles.minHeight } : {}),
    ...(customStyles.maxWidth ? { maxWidth: customStyles.maxWidth, margin: customStyles.maxWidth !== '100%' ? '0 auto' : undefined } : {}),
    ...(customStyles.borderRadius ? { borderRadius: customStyles.borderRadius } : {}),
    ...(customStyles.borderWidth && customStyles.borderStyle && customStyles.borderStyle !== 'none' ? {
      borderWidth: customStyles.borderWidth,
      borderStyle: customStyles.borderStyle,
      borderColor: customStyles.borderColor || '#212121',
    } : {}),
    ...(customStyles.boxShadow ? { boxShadow: customStyles.boxShadow } : {}),
    ...(customStyles.textAlign ? { textAlign: customStyles.textAlign } : {}),
  };

  const isSelected = isEditing && selectedElement?.key === sectionKey;

  const shortKey = sectionKey ? sectionKey.replace('home.', '') : '';
  const isSectionHidden =
    customStyles?.visible === false ||
    customStyles?.display === 'none' ||
    activeContent?.[shortKey]?.visible === false ||
    activeContent?.[sectionKey]?.visible === false;

  if (!isAdmin || !isEditing) {
    if (isSectionHidden) {
      return null;
    }
    const nonEditClasses = `${className} is-revealed`.trim();
    return (
      <section id={id} className={nonEditClasses} style={mergedStyle} {...restProps}>
        {children}
      </section>
    );
  }

  const handleSelectSection = (e) => {
    // Only select section if clicked directly or on the badge
    if (e.target === sectionRef.current || e.target.classList.contains('section-edit-tag')) {
      e.stopPropagation();
      selectElement({
        type: 'section',
        key: sectionKey,
        label: sectionLabel,
        styles: customStyles,
        data: customStyles,
      });
      setIsPanelOpen(true);
      setActivePanelTab('element');
    }
  };

  const editClasses = `editable-section-wrap is-revealed ${isSelected ? 'selected-section-active' : ''} ${className}`.trim();

  return (
    <section
      ref={sectionRef}
      id={id}
      data-section-key={sectionKey}
      className={editClasses}
      style={{
        ...mergedStyle,
        position: 'relative',
      }}
      onClick={handleSelectSection}
      {...restProps}
    >
      <div
        className="section-edit-tag"
        onClick={(e) => {
          e.stopPropagation();
          selectElement({
            type: 'section',
            key: sectionKey,
            label: sectionLabel,
            styles: customStyles,
            data: customStyles,
          });
          setIsPanelOpen(true);
          setActivePanelTab('element');
        }}
        title="Click to edit section background color, text color, and padding"
      >
        <span>📐 {sectionLabel}</span>
      </div>
      {isSectionHidden && (
        <div style={{
          background: '#FFFBEB',
          border: '1px dashed #D97706',
          borderRadius: '4px',
          padding: '0.45rem 0.85rem',
          margin: '0.5rem 1rem 1rem',
          color: '#92400E',
          fontSize: '0.82rem',
          fontWeight: 600,
          display: 'flex',
          alignItems: 'center',
          gap: '0.5rem',
        }}>
          <span>⚠️</span>
          <span>This section is hidden on the public website (visible in Admin Editor mode only).</span>
        </div>
      )}
      {children}
    </section>
  );
}

