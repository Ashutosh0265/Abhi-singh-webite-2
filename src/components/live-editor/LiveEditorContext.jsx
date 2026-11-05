import React, { createContext, useContext, useState, useEffect, useCallback, useMemo, useRef } from 'react';
import {
  getSiteContent,
  updateAllSiteContent,
  getDraftContent,
  saveDraftContent,
  clearDraftContent,
  getTypographyOverrides,
  saveTypographyOverrides,
  getAdminSession,
  adminLogout,
  DEFAULT_SITE_CONTENT,
} from '../../services/db';

const LiveEditorContext = createContext(null);

// Helper for deep merging objects so default keys are never dropped
export function deepMerge(target, source) {
  if (!source || typeof source !== 'object') return target;
  if (!target || typeof target !== 'object') return source;
  const output = { ...target };
  for (const key of Object.keys(source)) {
    if (
      source[key] &&
      typeof source[key] === 'object' &&
      !Array.isArray(source[key])
    ) {
      output[key] = deepMerge(target[key] || {}, source[key]);
    } else if (source[key] !== undefined && source[key] !== null) {
      output[key] = source[key];
    }
  }
  return output;
}

// Helper for deep getting a nested object property by dotted path (e.g. "hero.line1")
export function getNestedValue(obj, path, defaultValue = undefined) {
  if (!obj || !path) return defaultValue;
  const parts = path.split('.');
  let current = obj;
  for (const part of parts) {
    if (current == null || typeof current !== 'object' || !(part in current)) {
      return defaultValue;
    }
    current = current[part];
  }
  return current !== undefined && current !== null ? current : defaultValue;
}

// Helper for deep setting a nested object property by dotted path
export function setNestedValue(obj, path, value) {
  const parts = path.split('.');
  const newObj = { ...obj };
  let current = newObj;

  for (let i = 0; i < parts.length - 1; i++) {
    const part = parts[i];
    current[part] = current[part] ? { ...current[part] } : {};
    current = current[part];
  }

  current[parts[parts.length - 1]] = value;
  return newObj;
}

// Map theme color keys to document CSS custom properties
export function applyThemeColorsToCss(colors = {}) {
  if (typeof document === 'undefined') return;
  const root = document.documentElement;
  if (colors.primary) {
    root.style.setProperty('--orange', colors.primary);
    root.style.setProperty('--color-orange', colors.primary);
    root.style.setProperty('--color-primary', colors.primary);
  }
  if (colors.pageBackground) {
    root.style.setProperty('--light-gray', colors.pageBackground);
    root.style.setProperty('--color-bg-page', colors.pageBackground);
  }
  if (colors.surfaceBackground) {
    root.style.setProperty('--white', colors.surfaceBackground);
    root.style.setProperty('--color-bg-white', colors.surfaceBackground);
  }
  if (colors.textMain) {
    root.style.setProperty('--black', colors.textMain);
    root.style.setProperty('--text-color', colors.textMain);
    root.style.setProperty('--color-text', colors.textMain);
  }
  if (colors.accentYellow) {
    root.style.setProperty('--yellow', colors.accentYellow);
    root.style.setProperty('--color-yellow', colors.accentYellow);
  }
  if (colors.borderColor) {
    root.style.setProperty('--border-color', colors.borderColor);
  }
}

export function LiveEditorProvider({ children }) {
  const [isAdmin, setIsAdmin] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [previewMode, setPreviewMode] = useState('draft'); // 'draft' | 'published'
  const [liveContent, setLiveContent] = useState(DEFAULT_SITE_CONTENT);
  const [draftContent, setDraftContent] = useState(DEFAULT_SITE_CONTENT);
  const [typographyStyles, setTypographyStyles] = useState({});
  const [isDirty, setIsDirty] = useState(false);
  const [statusMessage, setStatusMessage] = useState(null);
  const [isPublishModalOpen, setIsPublishModalOpen] = useState(false);
  const [isPanelOpen, setIsPanelOpen] = useState(false);
  const [activePanelTab, setActivePanelTab] = useState('element'); // 'element' | 'global'

  // Refs to prevent closure staleness and protect in-memory edits from sync wipes
  const isEditingRef = useRef(isEditing);
  const isDirtyRef = useRef(isDirty);
  useEffect(() => {
    isEditingRef.current = isEditing;
  }, [isEditing]);
  useEffect(() => {
    isDirtyRef.current = isDirty;
  }, [isDirty]);

  // Undo / Redo stacks
  const [history, setHistory] = useState([]);
  const [future, setFuture] = useState([]);

  // Active Selected Element for floating toolbar & properties panel
  const [selectedElement, setSelectedElement] = useState(null);
  const [activeTypographyTarget, setActiveTypographyTarget] = useState(null);

  // Media Modal state
  const [mediaModal, setMediaModal] = useState({
    isOpen: false,
    targetKey: null,
    currentSrc: '',
    currentAlt: '',
    currentCaption: '',
    onSelect: null,
  });

  // Check admin session
  const verifySession = useCallback(() => {
    const session = getAdminSession();
    const authed = Boolean(session && session.authenticated);
    setIsAdmin(authed);
    if (authed && (window.location.search.includes('edit=true') || window.location.hash.includes('edit'))) {
      setIsEditing(true);
    }
  }, []);

  // Load published and draft content
  const loadContent = useCallback(async () => {
    try {
      const published = await getSiteContent();
      const savedDraft = getDraftContent();
      const typos = getTypographyOverrides();

      const baseLive = published ? deepMerge(DEFAULT_SITE_CONTENT, published) : DEFAULT_SITE_CONTENT;
      setLiveContent(baseLive);
      setTypographyStyles(typos || {});

      const initialDraft = savedDraft ? deepMerge(baseLive, savedDraft) : baseLive;
      setDraftContent(initialDraft);

      if (initialDraft.themeColors) {
        applyThemeColorsToCss(initialDraft.themeColors);
      }
    } catch (err) {
      console.warn('[LiveEditor] Error loading content:', err);
    }
  }, []);

  useEffect(() => {
    verifySession();
    loadContent();

    const handleSync = (e) => {
      // 1. Ignore events triggered locally by the active Live Editor tab
      if (e?.detail?.source === 'local_live_editor') {
        return;
      }

      // 2. If typography overrides changed externally, reload typography without wiping draft text
      if (e?.detail?.key === 'elrx_typography_overrides') {
        const typos = getTypographyOverrides();
        if (typos) setTypographyStyles(typos);
        return;
      }

      // 3. If user is currently live editing with active unsaved changes, do NOT wipe in-memory draft
      if (isEditingRef.current && isDirtyRef.current) {
        return;
      }

      verifySession();
      loadContent();
    };

    window.addEventListener('elrx_data_changed', handleSync);
    window.addEventListener('storage', handleSync);

    return () => {
      window.removeEventListener('elrx_data_changed', handleSync);
      window.removeEventListener('storage', handleSync);
    };
  }, [verifySession, loadContent]);

  // Flash temporary toast message in toolbar
  const showStatus = (msg, duration = 3000) => {
    setStatusMessage(msg);
    setTimeout(() => {
      setStatusMessage(null);
    }, duration);
  };

  // Helper to capture state snapshot for undo
  const snapshotState = useCallback(() => {
    return {
      draftContent: JSON.parse(JSON.stringify(draftContent)),
      typographyStyles: JSON.parse(JSON.stringify(typographyStyles)),
    };
  }, [draftContent, typographyStyles]);

  // Push state to history before mutation
  const lastPushTimestampRef = useRef(0);
  const pushState = useCallback((force = false) => {
    const now = Date.now();
    // Debounce rapid continuous typing keystrokes into a single undo milestone
    if (!force && now - lastPushTimestampRef.current < 1200) {
      return;
    }
    lastPushTimestampRef.current = now;
    const snap = snapshotState();
    setHistory((prev) => [...prev.slice(-40), snap]); // keep up to 40 undo states
    setFuture([]); // clear redo stack on new action
  }, [snapshotState]);

  // Undo action
  const undo = useCallback(() => {
    if (history.length === 0) return;
    const currentSnap = snapshotState();
    const previous = history[history.length - 1];

    setHistory((prev) => prev.slice(0, -1));
    setFuture((prev) => [currentSnap, ...prev]);

    setDraftContent(previous.draftContent);
    setTypographyStyles(previous.typographyStyles);
    try {
      saveDraftContent(previous.draftContent, 'local_live_editor');
      saveTypographyOverrides(previous.typographyStyles, 'local_live_editor');
    } catch (e) {}
    if (previous.draftContent?.themeColors) {
      applyThemeColorsToCss(previous.draftContent.themeColors);
    }
    setIsDirty(true);
    showStatus('↺ Undo');
  }, [history, snapshotState]);

  // Redo action
  const redo = useCallback(() => {
    if (future.length === 0) return;
    const currentSnap = snapshotState();
    const next = future[0];

    setFuture((prev) => prev.slice(1));
    setHistory((prev) => [...prev, currentSnap]);

    setDraftContent(next.draftContent);
    setTypographyStyles(next.typographyStyles);
    try {
      saveDraftContent(next.draftContent, 'local_live_editor');
      saveTypographyOverrides(next.typographyStyles, 'local_live_editor');
    } catch (e) {}
    if (next.draftContent?.themeColors) {
      applyThemeColorsToCss(next.draftContent.themeColors);
    }
    setIsDirty(true);
    showStatus('↻ Redo');
  }, [future, snapshotState]);

  // Keyboard shortcut listener (Ctrl+Z / Cmd+Z for undo, Ctrl+Y / Cmd+Shift+Z for redo)
  useEffect(() => {
    if (!isAdmin || !isEditing) return;

    const handleKeyDown = (e) => {
      // Don't intercept normal typing in inputs unless Ctrl/Cmd is held
      const isCmdOrCtrl = e.metaKey || e.ctrlKey;
      if (!isCmdOrCtrl) return;

      if (e.key === 'z' || e.key === 'Z') {
        if (e.shiftKey) {
          // Redo
          e.preventDefault();
          redo();
        } else {
          // Undo
          e.preventDefault();
          undo();
        }
      } else if (e.key === 'y' || e.key === 'Y') {
        // Redo
        e.preventDefault();
        redo();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isAdmin, isEditing, undo, redo]);

  // Update a text or media property by dotted key path
  const updateField = useCallback((keyPath, value, options = {}) => {
    pushState(options.forcePush || false);
    setDraftContent((prev) => {
      const updated = setNestedValue(prev, keyPath, value);
      try {
        saveDraftContent(updated, 'local_live_editor');
      } catch (err) {}
      setIsDirty(true);
      return updated;
    });
  }, [pushState]);

  // Update typography styling for a specific key
  const updateTypography = useCallback((keyPath, styleUpdates) => {
    pushState(true);
    setTypographyStyles((prev) => {
      const existing = prev[keyPath] || {};
      const updated = {
        ...prev,
        [keyPath]: { ...existing, ...styleUpdates },
      };
      try {
        saveTypographyOverrides(updated, 'local_live_editor');
      } catch (err) {}
      return updated;
    });
    setIsDirty(true);
  }, [pushState]);

  // Reset typography for a specific key
  const resetTypography = useCallback((keyPath) => {
    pushState(true);
    setTypographyStyles((prev) => {
      const copy = { ...prev };
      delete copy[keyPath];
      try {
        saveTypographyOverrides(copy, 'local_live_editor');
      } catch (err) {}
      return copy;
    });
    setIsDirty(true);
    showStatus('↺ Typography reset to defaults');
  }, [pushState]);

  // Update a button's styling and link settings
  const updateButtonStyle = useCallback((buttonKey, styleUpdates, options = {}) => {
    pushState(options.forcePush || false);
    setDraftContent((prev) => {
      const existing = prev.buttonStyles?.[buttonKey] || {};
      const updated = {
        ...prev,
        buttonStyles: {
          ...(prev.buttonStyles || {}),
          [buttonKey]: { ...existing, ...styleUpdates },
        },
      };
      try {
        saveDraftContent(updated, 'local_live_editor');
      } catch (err) {}
      setIsDirty(true);
      return updated;
    });
  }, [pushState]);

  // Update a section's background, padding, layout, and styling
  const updateSectionStyle = useCallback((sectionKey, styleUpdates) => {
    pushState();
    setDraftContent((prev) => {
      const existing = prev.sectionStyles?.[sectionKey] || {};
      const updated = {
        ...prev,
        sectionStyles: {
          ...(prev.sectionStyles || {}),
          [sectionKey]: { ...existing, ...styleUpdates },
        },
      };
      try {
        saveDraftContent(updated, 'local_live_editor');
      } catch (err) {}
      setIsDirty(true);
      return updated;
    });
  }, [pushState]);

  // Reset a section's custom styling back to theme defaults
  const resetSectionStyle = useCallback((sectionKey) => {
    pushState(true);
    setDraftContent((prev) => {
      const copy = { ...(prev.sectionStyles || {}) };
      delete copy[sectionKey];
      const updated = {
        ...prev,
        sectionStyles: copy,
      };
      try {
        saveDraftContent(updated, 'local_live_editor');
      } catch (err) {}
      setIsDirty(true);
      return updated;
    });
    showStatus('↺ Section styling restored to default');
  }, [pushState]);

  // Reset a button's styling back to default
  const resetButtonStyle = useCallback((buttonKey) => {
    pushState(true);
    setDraftContent((prev) => {
      const copy = { ...(prev.buttonStyles || {}) };
      delete copy[buttonKey];
      const updated = {
        ...prev,
        buttonStyles: copy,
      };
      try {
        saveDraftContent(updated, 'local_live_editor');
      } catch (err) {}
      setIsDirty(true);
      return updated;
    });
    showStatus('↺ Button styling restored to default');
  }, [pushState]);

  // Update a global theme color (primary, pageBackground, surfaceBackground, textMain, accentYellow, borderColor)
  const updateThemeColor = useCallback((colorKey, hexValue) => {
    pushState();
    setDraftContent((prev) => {
      const newColors = {
        ...(prev.themeColors || DEFAULT_SITE_CONTENT.themeColors),
        [colorKey]: hexValue,
      };
      applyThemeColorsToCss(newColors);
      const updated = {
        ...prev,
        themeColors: newColors,
      };
      try {
        saveDraftContent(updated, 'local_live_editor');
      } catch (err) {}
      setIsDirty(true);
      return updated;
    });
  }, [pushState]);

  // Save current working draft to localStorage
  const saveDraft = useCallback(() => {
    try {
      saveDraftContent(draftContent);
      saveTypographyOverrides(typographyStyles);
      setIsDirty(false);
      showStatus('✓ Draft saved locally');
      return true;
    } catch (err) {
      console.error('[LiveEditor] Failed to save draft:', err);
      showStatus('⚠️ Failed to save draft');
      return false;
    }
  }, [draftContent, typographyStyles]);

  // Discard draft and revert to published
  const discardDraft = useCallback(() => {
    clearDraftContent();
    setDraftContent(liveContent);
    if (liveContent?.themeColors) {
      applyThemeColorsToCss(liveContent.themeColors);
    }
    setIsDirty(false);
    showStatus('↺ Reverted to published version');
  }, [liveContent]);

  // Publish draft changes live to production & sync everywhere
  const publishLive = useCallback(async () => {
    try {
      await updateAllSiteContent(draftContent);
      saveTypographyOverrides(typographyStyles);
      setLiveContent(draftContent);
      clearDraftContent();
      setIsDirty(false);
      setIsPublishModalOpen(false);
      showStatus('🚀 Successfully published to live website!');
      return true;
    } catch (err) {
      console.error('[LiveEditor] Failed to publish live:', err);
      showStatus('⚠️ Publish failed. Verify admin authorization.');
      return false;
    }
  }, [draftContent, typographyStyles]);

  // Handle logout from admin mode
  const handleLogout = useCallback(async () => {
    await adminLogout();
    setIsAdmin(false);
    setIsEditing(false);
    setPreviewMode('published');
    window.location.href = '/';
  }, []);

  // Open media replacement modal
  const openMediaModal = useCallback((targetKey, currentSrc, currentAlt = '', currentCaption = '', onSelect = null) => {
    setMediaModal({
      isOpen: true,
      targetKey,
      currentSrc,
      currentAlt,
      currentCaption,
      onSelect,
    });
  }, []);

  const closeMediaModal = useCallback(() => {
    setMediaModal((prev) => ({ ...prev, isOpen: false }));
  }, []);

  // Select an element for contextual toolbar & properties panel
  const selectElement = useCallback((elementMeta) => {
    setSelectedElement(elementMeta);
  }, []);

  const clearSelection = useCallback(() => {
    setSelectedElement(null);
    setActiveTypographyTarget(null);
  }, []);

  // Active content based on preview mode (visitors ALWAYS see live published content only)
  const activeContent = useMemo(() => {
    if (!isAdmin || previewMode === 'published') return liveContent;
    return draftContent;
  }, [isAdmin, previewMode, liveContent, draftContent]);

  // Synchronize CSS custom properties on mount or change
  useEffect(() => {
    if (activeContent?.themeColors) {
      applyThemeColorsToCss(activeContent.themeColors);
    }
  }, [activeContent]);

  // Synchronize live editing body class and cleanup state on toggle
  useEffect(() => {
    if (typeof document === 'undefined') return;
    if (isAdmin && isEditing) {
      document.body.classList.add('live-editing-active');
    } else {
      document.body.classList.remove('live-editing-active');
      setSelectedElement(null);
      setActiveTypographyTarget(null);
      setIsPanelOpen(false);
    }
    // Dispatch custom event to notify listeners (e.g. scroll reveal, layouts)
    if (typeof window !== 'undefined') {
      window.dispatchEvent(new CustomEvent('elrx_live_editor_toggled', { detail: { isEditing, isAdmin } }));
    }
  }, [isAdmin, isEditing]);

  const value = {
    isAdmin,
    isEditing,
    setIsEditing,
    previewMode,
    setPreviewMode,
    liveContent,
    draftContent,
    activeContent,
    typographyStyles,
    isDirty,
    statusMessage,
    isPublishModalOpen,
    setIsPublishModalOpen,
    isPanelOpen,
    setIsPanelOpen,
    activePanelTab,
    setActivePanelTab,
    selectedElement,
    selectElement,
    clearSelection,
    mediaModal,
    activeTypographyTarget,
    setActiveTypographyTarget,
    history,
    future,
    canUndo: history.length > 0,
    canRedo: future.length > 0,
    undo,
    redo,
    updateField,
    updateTypography,
    resetTypography,
    updateButtonStyle,
    resetButtonStyle,
    updateSectionStyle,
    resetSectionStyle,
    updateThemeColor,
    saveDraft,
    discardDraft,
    publishLive,
    handleLogout,
    openMediaModal,
    closeMediaModal,
    showStatus,
  };

  return (
    <LiveEditorContext.Provider value={value}>
      {children}
    </LiveEditorContext.Provider>
  );
}

export function useLiveEditor() {
  const context = useContext(LiveEditorContext);
  if (!context) {
    throw new Error('useLiveEditor must be used within a LiveEditorProvider');
  }
  return context;
}
