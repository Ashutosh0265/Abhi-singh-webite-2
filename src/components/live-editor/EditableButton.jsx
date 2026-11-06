import React, { useRef, useLayoutEffect } from 'react';
import { useLiveEditor, getNestedValue } from './LiveEditorContext';

export default function EditableButton({
  buttonKey,
  defaultText = 'Click Here',
  defaultHref = '#',
  defaultTarget = '_self',
  className = '',
  style = {},
  type = 'button',
  disabled = false,
  onClick,
  children,
  ...restProps
}) {
  const {
    isAdmin,
    isEditing,
    activeContent,
    updateField,
    updateButtonStyle,
    selectElement,
    selectedElement,
    setIsPanelOpen,
    setActivePanelTab,
  } = useLiveEditor();

  const buttonRef = useRef(null);
  const spanRef = useRef(null);
  const isFocusedRef = useRef(false);
  const lastUserTextRef = useRef(null);

  // Read saved styles for this buttonKey
  const customStyles = (buttonKey && activeContent.buttonStyles?.[buttonKey]) || {};

  // Text can be from siteContent key path or custom buttonStyles.text
  const textValue = customStyles.text !== undefined
    ? customStyles.text
    : (buttonKey ? getNestedValue(activeContent, buttonKey, defaultText) : defaultText);

  const isChildrenString = typeof children === 'string' || typeof children === 'number';
  const displayText = textValue !== undefined ? textValue : (isChildrenString ? String(children) : defaultText);
  const href = customStyles.href || defaultHref;
  const target = customStyles.target || defaultTarget;

  // Compute merged styles
  const mergedStyle = {
    ...style,
    ...(customStyles.backgroundColor ? { backgroundColor: customStyles.backgroundColor } : {}),
    ...(customStyles.textColor ? { color: customStyles.textColor } : {}),
    ...(customStyles.borderColor ? { borderColor: customStyles.borderColor, borderStyle: 'solid' } : {}),
    ...(customStyles.borderWidth ? { borderWidth: customStyles.borderWidth } : {}),
    ...(customStyles.borderRadius !== undefined ? { borderRadius: customStyles.borderRadius } : {}),
    ...(customStyles.padding ? { padding: customStyles.padding } : {}),
    ...(customStyles.fontSize ? { fontSize: customStyles.fontSize } : {}),
    ...(customStyles.fontWeight ? { fontWeight: customStyles.fontWeight } : {}),
  };

  const isSelected = isEditing && selectedElement?.key === buttonKey;

  // Sync DOM innerText on mount and whenever external changes occur (Undo/Redo, page switches)
  useLayoutEffect(() => {
    if (!isAdmin || !isEditing) return;
    const el = spanRef.current;
    if (!el) return;

    const isInternalUpdate = isFocusedRef.current && lastUserTextRef.current === displayText;
    if (!isInternalUpdate && el.innerText !== displayText) {
      el.innerText = displayText;
      lastUserTextRef.current = displayText;
    }
  }, [displayText, isAdmin, isEditing]);

  // If button visibility is set to false in custom styles, hide from visitors
  if (customStyles.visible === false && (!isAdmin || !isEditing)) {
    return null;
  }

  // Visitor or preview mode without editing: render regular link or button
  if (!isAdmin || !isEditing) {
    if (href && href !== '#' && !type.includes('submit') && !onClick) {
      return (
        <a
          href={href}
          target={target}
          rel={target === '_blank' ? 'noopener noreferrer' : undefined}
          className={className}
          style={mergedStyle}
          onClick={onClick}
          {...restProps}
        >
          {displayText}
          {!isChildrenString && children}
        </a>
      );
    }
    return (
      <button
        type={type}
        disabled={disabled}
        className={className}
        style={mergedStyle}
        onClick={onClick}
        {...restProps}
      >
        {displayText}
        {!isChildrenString && children}
      </button>
    );
  }

  // Admin in edit mode: enable direct click-to-edit and inspector selection
  const handleEditClick = (e) => {
    e.preventDefault(); // prevent navigation or submission while editing
    e.stopPropagation();

    selectElement({
      type: 'button',
      key: buttonKey,
      label: `Button (${displayText})`,
      styles: customStyles,
      data: {
        text: displayText,
        href,
        target,
        type,
        actionType: customStyles.actionType || (type === 'submit' ? 'submit' : href && href !== '#' ? 'link' : 'custom'),
        visible: customStyles.visible !== false,
        ...customStyles,
      },
    });

    // Also trigger side inspector
    setIsPanelOpen(true);
    setActivePanelTab('element');
  };

  const handleSpanFocus = (e) => {
    isFocusedRef.current = true;
    lastUserTextRef.current = e.currentTarget.innerText;
    handleEditClick(e);
  };

  const handleBlur = (e) => {
    isFocusedRef.current = false;
    if (!buttonKey) return;
    const newText = e.currentTarget.innerText.trim();
    lastUserTextRef.current = newText;
    if (newText && newText !== displayText) {
      updateButtonStyle(buttonKey, { text: newText }, { forcePush: true });
      if (buttonKey.includes('.')) {
        updateField(buttonKey, newText, { forcePush: true });
      }
    }
  };

  const handleInput = (e) => {
    if (!buttonKey) return;
    const newText = e.currentTarget.innerText;
    lastUserTextRef.current = newText;
    if (newText !== displayText) {
      updateButtonStyle(buttonKey, { text: newText });
      if (buttonKey.includes('.')) {
        updateField(buttonKey, newText);
      }
    }
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      e.currentTarget.blur();
    } else if (e.key === 'Escape') {
      e.currentTarget.blur();
    }
  };

  const editClasses = `editable-button-active ${isSelected ? 'selected-element-active' : ''} ${className}`.trim();

  return (
    <button
      ref={buttonRef}
      type="button"
      data-button-type={type}
      data-button-key={buttonKey}
      className={editClasses}
      style={{
        ...mergedStyle,
        position: 'relative',
        cursor: 'pointer',
        ...(customStyles.visible === false ? { opacity: 0.45, borderStyle: 'dashed' } : {}),
      }}
      onClick={handleEditClick}
      title="Click to edit button text, link destination, colors, and styling"
      {...restProps}
    >
      <span
        ref={spanRef}
        contentEditable
        suppressContentEditableWarning
        onFocus={handleSpanFocus}
        onBlur={handleBlur}
        onInput={handleInput}
        onKeyDown={handleKeyDown}
        style={{ outline: 'none', display: 'inline-block' }}
      />
      {!isChildrenString && children}
      {customStyles.visible === false && (
        <span style={{ fontSize: '10px', color: '#EF4444', marginLeft: '6px', fontWeight: 700 }}>
          [Hidden]
        </span>
      )}
      {isSelected && (
        <span className="element-edit-badge" title="Editing Button">
          Button ⚙
        </span>
      )}
    </button>
  );
}
