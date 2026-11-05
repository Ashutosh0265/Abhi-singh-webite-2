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

  if (!isAdmin || !isEditing) {
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
      {children}
    </section>
  );
}

