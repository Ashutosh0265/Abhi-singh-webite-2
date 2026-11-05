import React, { useEffect } from 'react';
import { useLiveEditor } from './LiveEditorContext';

export default function LiveAdminToolbar() {
  const {
    isAdmin,
    isEditing,
    setIsEditing,
    previewMode,
    setPreviewMode,
    isDirty,
    statusMessage,
    saveDraft,
    discardDraft,
    setIsPublishModalOpen,
    handleLogout,
    canUndo,
    canRedo,
    undo,
    redo,
    isPanelOpen,
    setIsPanelOpen,
    activePanelTab,
    setActivePanelTab,
  } = useLiveEditor();

  // Attach body classes for offset spacing and live editing state
  useEffect(() => {
    if (isAdmin) {
      document.body.classList.add('has-admin-bar');
    } else {
      document.body.classList.remove('has-admin-bar');
    }
    if (isAdmin && isEditing) {
      document.body.classList.add('live-editing-active');
    } else {
      document.body.classList.remove('live-editing-active');
    }
    return () => {
      document.body.classList.remove('has-admin-bar');
      document.body.classList.remove('live-editing-active');
    };
  }, [isAdmin, isEditing]);

  // If visitor is not authenticated admin, toolbar is strictly hidden
  if (!isAdmin) return null;

  return (
    <header className="live-admin-toolbar" aria-label="WordPress-Style Live CMS Admin Bar">
      {/* Left: Brand + Edit Mode Toggle + Preview Toggle */}
      <div className="live-admin-toolbar-left">
        <a href="/admin.html" className="live-toolbar-brand" title="Open Full CMS Admin Dashboard">
          <span className="live-toolbar-brand-badge">CMS</span>
          <span>Abhi Singh</span>
        </a>

        {/* Live Edit Toggle */}
        <div className="live-toolbar-toggle-wrapper">
          <button
            type="button"
            className={`live-toolbar-toggle-btn ${isEditing ? 'active' : ''}`}
            onClick={() => setIsEditing(!isEditing)}
            title="Toggle inline content and typography editing directly on page"
          >
            <span>{isEditing ? '✏️ Live Edit: ON' : '✏️ Live Edit: OFF'}</span>
          </button>
        </div>

        {/* Preview State Toggle */}
        <div className="live-toolbar-preview-toggle">
          <button
            type="button"
            className={`live-toolbar-preview-btn ${previewMode === 'draft' ? 'active' : ''}`}
            onClick={() => setPreviewMode('draft')}
            title="View working draft with your latest edits"
          >
            Draft
          </button>
          <button
            type="button"
            className={`live-toolbar-preview-btn ${previewMode === 'published' ? 'active' : ''}`}
            onClick={() => setPreviewMode('published')}
            title="View current live published version as regular visitors see it"
          >
            Live Published
          </button>
        </div>

        {/* Undo and Redo buttons */}
        <div className="live-toolbar-history-group">
          <button
            type="button"
            className="live-btn-icon live-undo-btn"
            onClick={undo}
            disabled={!canUndo}
            title="Undo last change (Ctrl+Z)"
          >
            ↺ Undo
          </button>
          <button
            type="button"
            className="live-btn-icon live-redo-btn"
            onClick={redo}
            disabled={!canRedo}
            title="Redo next change (Ctrl+Y)"
          >
            ↻ Redo
          </button>
        </div>
      </div>

      {/* Center: Real-time Status Badge */}
      <div className="live-admin-toolbar-center">
        {statusMessage ? (
          <div className="live-toolbar-status" style={{ color: '#60a5fa', borderColor: '#2563eb' }}>
            <span>{statusMessage}</span>
          </div>
        ) : (
          <div className="live-toolbar-status">
            <span className={`live-status-dot ${isDirty ? 'dirty' : 'clean'}`} />
            <span>{isDirty ? 'Unsaved edits' : 'All changes saved'}</span>
          </div>
        )}
      </div>

      {/* Right: Global Theme, Inspector Toggle, Save Draft, Publish, CMS Dashboard, Exit */}
      <div className="live-admin-toolbar-right">
        {/* Global Theme Palette button */}
        <button
          type="button"
          className="live-btn-theme"
          onClick={() => {
            setIsPanelOpen(true);
            setActivePanelTab('global');
          }}
          title="Open Global Theme Colors & System Palette"
        >
          <span>🎨 Global Colors</span>
        </button>

        {/* Gutenberg Block Inspector Toggle button */}
        <button
          type="button"
          className={`live-btn-inspector ${isPanelOpen ? 'active' : ''}`}
          onClick={() => setIsPanelOpen(!isPanelOpen)}
          title="Toggle WordPress Side Properties Panel"
        >
          <span>⚙️ Inspector</span>
        </button>

        <button
          type="button"
          className="live-btn-save"
          onClick={saveDraft}
          disabled={!isDirty}
          title="Save changes to draft without publishing to live visitors"
        >
          <span>💾</span>
          <span>Save Draft</span>
        </button>

        <button
          type="button"
          className="live-btn-save"
          style={{ background: 'rgba(239, 68, 68, 0.15)', borderColor: 'rgba(239, 68, 68, 0.4)', color: '#fca5a5' }}
          onClick={() => {
            if (window.confirm('Discard all unpublished draft changes and revert to the live published site?')) {
              discardDraft();
            }
          }}
          disabled={!isDirty}
          title="Discard all unpublished edits and revert to the live published version"
        >
          <span>✕</span>
          <span>Discard</span>
        </button>

        <button
          type="button"
          className="live-btn-publish"
          onClick={() => setIsPublishModalOpen(true)}
          title="Publish changes to the live public website"
        >
          <span>🚀</span>
          <span>Publish Changes</span>
        </button>

        <a href="/admin.html" className="live-btn-cms" title="Return to CMS Management Dashboard">
          <span>⚙️ CMS</span>
        </a>

        <button
          type="button"
          className="live-btn-logout"
          onClick={handleLogout}
          title="Log out of admin mode to view site as an ordinary visitor"
        >
          Exit Admin
        </button>
      </div>
    </header>
  );
}

