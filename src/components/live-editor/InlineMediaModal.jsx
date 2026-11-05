import React, { useState, useEffect } from 'react';
import { useLiveEditor } from './LiveEditorContext';
import { getMediaAssets, uploadMediaAsset } from '../../services/db';

export default function InlineMediaModal() {
  const { mediaModal, closeMediaModal, updateField } = useLiveEditor();
  const [activeTab, setActiveTab] = useState('library'); // 'library' | 'upload' | 'url'
  const [assets, setAssets] = useState([]);
  const [selectedAsset, setSelectedAsset] = useState(null);
  const [customUrl, setCustomUrl] = useState('');
  const [altText, setAltText] = useState('');
  const [caption, setCaption] = useState('');
  const [isUploading, setIsUploading] = useState(false);

  useEffect(() => {
    if (mediaModal.isOpen) {
      setCustomUrl(mediaModal.currentSrc || '');
      setAltText(mediaModal.currentAlt || '');
      setCaption(mediaModal.currentCaption || '');
      setSelectedAsset(null);

      getMediaAssets().then((list) => {
        if (list && list.length > 0) {
          setAssets(list);
          const found = list.find((a) => a.publicUrl === mediaModal.currentSrc);
          if (found) setSelectedAsset(found);
        }
      }).catch((err) => {
        console.warn('[InlineMediaModal] Error loading media assets:', err);
      });
    }
  }, [mediaModal]);

  if (!mediaModal.isOpen) return null;

  const handleSelectAsset = (asset) => {
    setSelectedAsset(asset);
    setCustomUrl(asset.publicUrl);
    if (!altText) setAltText(asset.altText || asset.name);
  };

  const handleFileUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsUploading(true);
    try {
      const newAsset = await uploadMediaAsset(file);
      setAssets((prev) => [newAsset, ...prev]);
      setSelectedAsset(newAsset);
      setCustomUrl(newAsset.publicUrl);
      if (!altText) setAltText(newAsset.altText || file.name);
      setActiveTab('library');
    } catch (err) {
      console.error('[InlineMediaModal] Upload error:', err);
      alert('Upload failed: ' + (err.message || 'Unknown error'));
    } finally {
      setIsUploading(false);
    }
  };

  const handleApply = () => {
    const finalUrl = customUrl.trim();
    if (mediaModal.targetKey && finalUrl) {
      updateField(mediaModal.targetKey, finalUrl);
    }
    if (mediaModal.altKey && altText) {
      updateField(mediaModal.altKey, altText.trim());
    }
    if (mediaModal.captionKey && caption) {
      updateField(mediaModal.captionKey, caption.trim());
    }
    if (typeof mediaModal.onSelect === 'function') {
      mediaModal.onSelect({
        url: finalUrl,
        alt: altText.trim(),
        caption: caption.trim(),
      });
    }
    closeMediaModal();
  };

  return (
    <div className="inline-media-modal-backdrop" onClick={closeMediaModal}>
      <div className="inline-media-modal" onClick={(e) => e.stopPropagation()}>
        {/* Header */}
        <div className="inline-media-header">
          <div className="inline-media-title">📷 Replace Media Asset</div>
          <button type="button" className="inline-media-close" onClick={closeMediaModal}>
            ✕
          </button>
        </div>

        {/* Tabs */}
        <div className="inline-media-tabs">
          <button
            type="button"
            className={`inline-media-tab ${activeTab === 'library' ? 'active' : ''}`}
            onClick={() => setActiveTab('library')}
          >
            CMS Media Library
          </button>
          <button
            type="button"
            className={`inline-media-tab ${activeTab === 'upload' ? 'active' : ''}`}
            onClick={() => setActiveTab('upload')}
          >
            Upload New File
          </button>
          <button
            type="button"
            className={`inline-media-tab ${activeTab === 'url' ? 'active' : ''}`}
            onClick={() => setActiveTab('url')}
          >
            Direct URL
          </button>
        </div>

        {/* Body */}
        <div className="inline-media-body">
          {activeTab === 'library' && (
            <div>
              <div style={{ fontSize: '12px', color: '#9ca3af', marginBottom: '12px' }}>
                Select an existing asset from the CMS library:
              </div>
              <div className="media-library-grid">
                {assets.map((asset) => {
                  const isSelected = selectedAsset?.id === asset.id || customUrl === asset.publicUrl;
                  return (
                    <div
                      key={asset.id}
                      className={`media-library-item ${isSelected ? 'selected' : ''}`}
                      onClick={() => handleSelectAsset(asset)}
                    >
                      <img src={asset.publicUrl} alt={asset.altText || asset.name} />
                      <div className="media-library-label">{asset.name}</div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {activeTab === 'upload' && (
            <div style={{ textAlign: 'center', padding: '30px 20px' }}>
              <div style={{ fontSize: '32px', marginBottom: '12px' }}>📁</div>
              <div style={{ fontSize: '14px', fontWeight: '600', marginBottom: '6px' }}>
                Choose an image or video file to upload
              </div>
              <div style={{ fontSize: '12px', color: '#9ca3af', marginBottom: '18px' }}>
                Supports PNG, JPG, WebP, SVG, MP4 up to 50MB
              </div>
              <label
                style={{
                  display: 'inline-block',
                  background: '#FF6200',
                  color: '#fff',
                  padding: '8px 18px',
                  borderRadius: '6px',
                  fontWeight: '600',
                  fontSize: '13px',
                  cursor: isUploading ? 'not-allowed' : 'pointer',
                }}
              >
                {isUploading ? 'Uploading…' : 'Select File From Device'}
                <input
                  type="file"
                  accept="image/*,video/*"
                  onChange={handleFileUpload}
                  disabled={isUploading}
                  style={{ display: 'none' }}
                />
              </label>
            </div>
          )}

          {activeTab === 'url' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              <label style={{ fontSize: '13px', color: '#d1d5db', fontWeight: '600' }}>
                Media Source URL:
                <input
                  type="text"
                  value={customUrl}
                  onChange={(e) => setCustomUrl(e.target.value)}
                  placeholder="https://example.com/image.png or /assets/photo.jpg"
                  style={{
                    width: '100%',
                    marginTop: '6px',
                    padding: '8px 12px',
                    background: '#121417',
                    border: '1px solid #363c4c',
                    color: '#fff',
                    borderRadius: '4px',
                    fontSize: '13px',
                  }}
                />
              </label>
            </div>
          )}

          {/* Metadata: Alt Text and Caption */}
          <div style={{ marginTop: '20px', paddingTop: '16px', borderTop: '1px solid #282d3a' }}>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
              <label style={{ fontSize: '12px', color: '#9ca3af', fontWeight: '600' }}>
                Alt Text (for accessibility &amp; SEO):
                <input
                  type="text"
                  value={altText}
                  onChange={(e) => setAltText(e.target.value)}
                  placeholder="Descriptive image label"
                  style={{
                    width: '100%',
                    marginTop: '4px',
                    padding: '6px 10px',
                    background: '#121417',
                    border: '1px solid #363c4c',
                    color: '#fff',
                    borderRadius: '4px',
                    fontSize: '12px',
                  }}
                />
              </label>

              {mediaModal.captionKey !== undefined && (
                <label style={{ fontSize: '12px', color: '#9ca3af', fontWeight: '600' }}>
                  Image Caption:
                  <input
                    type="text"
                    value={caption}
                    onChange={(e) => setCaption(e.target.value)}
                    placeholder="Caption displayed under photo"
                    style={{
                      width: '100%',
                      marginTop: '4px',
                      padding: '6px 10px',
                      background: '#121417',
                      border: '1px solid #363c4c',
                      color: '#fff',
                      borderRadius: '4px',
                      fontSize: '12px',
                    }}
                  />
                </label>
              )}
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="inline-media-footer">
          <button
            type="button"
            className="publish-btn-cancel"
            onClick={closeMediaModal}
          >
            Cancel
          </button>
          <button
            type="button"
            className="publish-btn-confirm"
            onClick={handleApply}
            disabled={!customUrl}
          >
            Apply Asset
          </button>
        </div>
      </div>
    </div>
  );
}

