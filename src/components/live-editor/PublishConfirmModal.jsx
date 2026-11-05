import React from 'react';
import { useLiveEditor } from './LiveEditorContext';

export default function PublishConfirmModal() {
  const { isPublishModalOpen, setIsPublishModalOpen, publishLive } = useLiveEditor();

  if (!isPublishModalOpen) return null;

  return (
    <div className="publish-confirm-backdrop" onClick={() => setIsPublishModalOpen(false)}>
      <div className="publish-confirm-card" onClick={(e) => e.stopPropagation()}>
        <div className="publish-confirm-title">🚀 Publish Changes to Live Website?</div>
        <p className="publish-confirm-desc">
          You are about to publish all your inline edits and typography changes.
          Once published, these changes will immediately replace the current live version and be visible to all public visitors.
        </p>

        <div className="publish-confirm-actions">
          <button
            type="button"
            className="publish-btn-cancel"
            onClick={() => setIsPublishModalOpen(false)}
          >
            Cancel
          </button>
          <button
            type="button"
            className="publish-btn-confirm"
            onClick={publishLive}
          >
            Yes, Publish Live Now
          </button>
        </div>
      </div>
    </div>
  );
}

