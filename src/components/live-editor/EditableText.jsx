import React, { useRef, useLayoutEffect } from 'react';
import DOMPurify from 'dompurify';
import { useLiveEditor, getNestedValue } from './LiveEditorContext';

export default function EditableText({
  as: Component = 'p',
  contentKey,
  defaultValue = '',
  className = '',
  style = {},
  allowMultiline = false,
  children,
  onClick,
  ...restProps
}) {
  const {
    isAdmin,
    isEditing,
    activeContent,
    typographyStyles,
    updateField,
    setActiveTypographyTarget,
    selectElement,
    selectedElement,
  } = useLiveEditor();

  const elementRef = useRef(null);
  const isFocusedRef = useRef(false);
  const lastUserTextRef = useRef(null);

  // Check custom typography overrides for this specific contentKey
  const customTypography = (contentKey && typographyStyles[contentKey]) || {};

  // Support dynamic block type change (e.g. user changes paragraph to H1, H2, etc.)
  const EffectiveComponent = customTypography.tag || Component;

  // Read current active value from live or draft content
  const storedValue = contentKey ? getNestedValue(activeContent, contentKey, undefined) : undefined;

  // Determine display text:
  // 1. If storedValue is defined and not null, use it (even if user explicitly saved empty string "")
  // 2. Otherwise fall back to defaultValue prop
  // 3. Otherwise fall back to children string/number
  let displayText;
  if (storedValue !== undefined && storedValue !== null) {
    displayText = String(storedValue);
  } else if (defaultValue !== undefined && defaultValue !== null && defaultValue !== '') {
    displayText = String(defaultValue);
  } else if (children !== undefined && children !== null && (typeof children === 'string' || typeof children === 'number')) {
    displayText = String(children);
  } else {
    displayText = (defaultValue !== undefined && defaultValue !== null) ? String(defaultValue) : '';
  }

  const mergedStyle = {
    ...style,
    ...(allowMultiline ? { whiteSpace: 'pre-line' } : {}),
    ...(customTypography.fontFamily ? { fontFamily: customTypography.fontFamily } : {}),
    ...(customTypography.fontSize ? { fontSize: customTypography.fontSize } : {}),
    ...(customTypography.fontWeight ? { fontWeight: customTypography.fontWeight } : {}),
    ...(customTypography.fontStyle ? { fontStyle: customTypography.fontStyle } : {}),
    ...(customTypography.color ? { color: customTypography.color } : {}),
    ...(customTypography.backgroundColor ? { backgroundColor: customTypography.backgroundColor } : {}),
    ...(customTypography.lineHeight ? { lineHeight: customTypography.lineHeight } : {}),
    ...(customTypography.letterSpacing ? { letterSpacing: customTypography.letterSpacing } : {}),
    ...(customTypography.textAlign ? { textAlign: customTypography.textAlign } : {}),
    ...(customTypography.textDecoration ? { textDecoration: customTypography.textDecoration } : {}),
    ...(customTypography.textTransform ? { textTransform: customTypography.textTransform } : {}),
    ...(customTypography.paddingLeft ? { paddingLeft: customTypography.paddingLeft } : {}),
  };

  // Sync DOM innerText on mount and whenever external changes occur (Undo/Redo, page switches, initial load)
  // BUT do not touch the DOM if this re-render was triggered while the user is actively focused/typing
  useLayoutEffect(() => {
    if (!isAdmin || !isEditing) return;
    const el = elementRef.current;
    if (!el) return;

    if (isFocusedRef.current) {
      lastUserTextRef.current = el.innerText;
      return;
    }

    if (el.innerText !== displayText) {
      el.innerText = displayText;
      lastUserTextRef.current = displayText;
    }
  }, [displayText, isAdmin, isEditing]);

  const handleFocus = (e) => {
    if (!isAdmin || !isEditing) return;
    isFocusedRef.current = true;
    let currentText = e.currentTarget.innerText;
    if (currentText === '\n') currentText = '';
    lastUserTextRef.current = currentText;

    const rect = e.currentTarget.getBoundingClientRect();
    setActiveTypographyTarget({
      key: contentKey,
      rect,
      styles: customTypography,
      tag: typeof EffectiveComponent === 'string' ? EffectiveComponent.toLowerCase() : 'p',
    });
    selectElement({
      type: 'text',
      key: contentKey,
      label: `Text (${typeof EffectiveComponent === 'string' ? EffectiveComponent.toUpperCase() : 'TEXT'})`,
      styles: customTypography,
      data: { text: displayText, allowMultiline, ...customTypography },
    });
  };

  const handleBlur = (e) => {
    isFocusedRef.current = false;
    if (!isAdmin || !isEditing || !contentKey) return;
    let currentText = e.currentTarget.innerText;
    if (currentText === '\n') currentText = '';
    const normalizedText = currentText.replace(/\r\n/g, '\n');
    lastUserTextRef.current = normalizedText;
    updateField(contentKey, normalizedText);
  };

  const handleInput = (e) => {
    if (!isAdmin || !isEditing || !contentKey) return;
    let newText = e.currentTarget.innerText;
    if (newText === '\n') newText = '';
    const normalized = newText.replace(/\r\n/g, '\n');
    lastUserTextRef.current = normalized;
    updateField(contentKey, normalized);
  };

  // Phase 5: Formatting Inheritance & Clean Paste Handling
  const handlePaste = (e) => {
    if (!isAdmin || !isEditing) return;
    e.preventDefault();
    const isHeading = typeof EffectiveComponent === 'string' && /^h[1-6]$/i.test(EffectiveComponent);
    const isSingleLine = !allowMultiline && (isHeading || EffectiveComponent === 'span' || EffectiveComponent === 'label');

    if (isSingleLine) {
      // Pasting into a heading or single-line element:
      // Strip all markup, collapse newlines into spaces, paste as pure plain text
      // This guarantees it inherits the destination heading's typography 100%!
      const plain = (e.clipboardData.getData('text/plain') || '')
        .replace(/[\r\n]+/g, ' ')
        .trim();
      document.execCommand('insertText', false, plain);
    } else {
      // Pasting into a paragraph or multi-line block:
      const html = e.clipboardData.getData('text/html');
      if (html) {
        // Sanitize: strip conflicting source font-size, font-family, and colors
        // while preserving intentional semantic inline formatting like bold, italic, and links!
        const temp = document.createElement('div');
        temp.innerHTML = DOMPurify.sanitize(html, {
          ALLOWED_TAGS: ['b', 'i', 'em', 'strong', 'u', 's', 'a', 'br', 'span'],
          ALLOWED_ATTR: ['href', 'target'],
        });
        // Remove all style and class attributes to prevent font-size / font-family overrides
        temp.querySelectorAll('*').forEach((node) => {
          node.removeAttribute('style');
          node.removeAttribute('class');
        });
        const cleanHtml = temp.innerHTML;
        if (cleanHtml && cleanHtml !== temp.innerText) {
          document.execCommand('insertHTML', false, cleanHtml);
        } else {
          const plain = e.clipboardData.getData('text/plain') || '';
          document.execCommand('insertText', false, plain);
        }
      } else {
        const plain = e.clipboardData.getData('text/plain') || '';
        document.execCommand('insertText', false, plain);
      }
    }

    let updated = e.currentTarget.innerText;
    if (updated === '\n') updated = '';
    const normalized = updated.replace(/\r\n/g, '\n');
    lastUserTextRef.current = normalized;
    updateField(contentKey, normalized);
  };

  const handleKeyDown = (e) => {
    if (!isAdmin || !isEditing) return;
    const isHeading = typeof EffectiveComponent === 'string' && /^h[1-6]$/i.test(EffectiveComponent);
    const isSingleLine = !allowMultiline && (isHeading || EffectiveComponent === 'span' || EffectiveComponent === 'label');

    if (e.key === 'Enter') {
      if (allowMultiline) {
        e.preventDefault();
        document.execCommand('insertLineBreak');
        let currentText = e.currentTarget.innerText;
        if (currentText === '\n') currentText = '';
        const normalized = currentText.replace(/\r\n/g, '\n');
        lastUserTextRef.current = normalized;
        updateField(contentKey, normalized);
        return;
      }
      if (isSingleLine && !e.shiftKey) {
        // Prevent creating messy nested <div> or <br> inside headings
        e.preventDefault();
        e.currentTarget.blur();
        return;
      }
    } else if (e.key === 'Escape') {
      e.currentTarget.blur();
    }
  };

  // If not admin or not in edit mode, render standard clean element
  if (!isAdmin || !isEditing) {
    return (
      <EffectiveComponent
        className={className}
        style={mergedStyle}
        onClick={onClick}
        {...restProps}
      >
        {displayText}
      </EffectiveComponent>
    );
  }

  // Admin in edit mode: render interactive editable element
  const isEmpty = !displayText || displayText.trim() === '';
  const editClasses = `editable-text-field editable-text-active ${isEmpty ? 'editable-text-empty' : ''} ${className}`.trim();

  // For interactive links/buttons in edit mode, prevent default navigation so the text can be edited directly
  const handleEditClick = (e) => {
    if (EffectiveComponent === 'a' || EffectiveComponent === 'button') {
      e.preventDefault();
    }
    if (onClick) onClick(e);
  };

  return (
    <EffectiveComponent
      ref={elementRef}
      data-content-key={contentKey}
      data-empty={isEmpty}
      data-placeholder={defaultValue || 'Click to type...'}
      className={editClasses}
      style={mergedStyle}
      contentEditable
      suppressContentEditableWarning
      onFocus={handleFocus}
      onBlur={handleBlur}
      onInput={handleInput}
      onPaste={handlePaste}
      onKeyDown={handleKeyDown}
      onClick={handleEditClick}
      title="Click to edit text directly"
      {...restProps}
    />
  );
}
