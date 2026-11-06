import React, { useRef, useState, useEffect } from 'react';
import { getProducts, getSiteContent, DEFAULT_SITE_CONTENT } from '../services/db';
import { products as fallbackProducts } from '../data/products';
import useScrollReveal from '../hooks/useScrollReveal';
import ProductBookCover from '../components/ProductBookCover';
import { EditableText, EditableSection, EditableButton } from '../components/live-editor';

function formatProductForStore(p) {
  const isFree = Boolean(p.is_free || p.type === 'free' || p.price_inr === 0 || p.priceAmount === 0 || p.price === 'Free');
  const priceAmount = isFree
    ? 0
    : (p.price_inr !== undefined && p.price_inr !== null && !isNaN(Number(p.price_inr))
      ? Math.max(0, Number(p.price_inr))
      : (p.priceAmount !== undefined && p.priceAmount !== null && !isNaN(Number(p.priceAmount))
        ? Math.max(0, Number(p.priceAmount))
        : (typeof p.price === 'string'
          ? Math.max(0, Number(p.price.replace(/[^\d.]/g, '')) || 0)
          : 0)));
  const formattedPrice = isFree || priceAmount === 0 ? 'Free' : `₹${priceAmount.toLocaleString('en-IN')}`;
  const isOutOfStock = p.stock_status === 'out_of_stock';
  const isExternal = p.product_type === 'external_link' || p.productType === 'external_link';
  const isWaitlist = p.type === 'waitlist';
  const hasPdf = Boolean(p.file_url || p.downloadUrl || p.fileUrl);
  const isPdfMissing = !isExternal && !isWaitlist && (p.product_type === 'digital_download' || !p.product_type) && !hasPdf;

  let ctaText = 'Get for FREE';
  if (isExternal) {
    ctaText = p.ctaText || 'Join on Skool →';
  } else if (isOutOfStock) {
    ctaText = 'Out of Stock';
  } else if (isPdfMissing) {
    ctaText = 'PDF In Preparation';
  } else if (isFree) {
    ctaText = 'Get for FREE';
  } else {
    ctaText = `Get for ${formattedPrice}`;
  }

  return {
    id: p.id,
    slug: p.slug || p.id,
    name: p.title || p.name || 'Untitled Product',
    type: isFree ? 'free' : (isWaitlist ? 'waitlist' : 'paid'),
    price: formattedPrice,
    priceAmount,
    currency: 'INR',
    category: p.category || 'Book',
    format: p.format || 'PDF (Digital Download)',
    tagline: p.tagline || p.short_description || '',
    short_description: p.short_description || p.tagline || '',
    full_description: p.full_description || p.description || '',
    description: p.full_description || p.description || '',
    productType: p.product_type || p.productType || 'digital_download',
    externalUrl: p.external_url || p.externalUrl || '',
    coverUrl: p.cover_image_url || p.coverUrl || p.image_url || '',
    fileUrl: p.file_url || p.downloadUrl || p.fileUrl || null,
    fileName: p.file_name || p.fileName || null,
    hasPdf,
    isPdfMissing,
    whatInside: Array.isArray(p.whatInside) ? p.whatInside : [],
    stockStatus: p.stock_status || 'in_stock',
    stock_status: p.stock_status || 'in_stock',
    status: p.status || 'published',
    ctaText,
  };
}

export default function StorePage({ onOpenProduct }) {
  const availableGridRef = useRef(null);
  const upcomingGridRef = useRef(null);
  const [allProducts, setAllProducts] = useState(() => {
    try {
      const raw = localStorage.getItem('elrx_db_products');
      const delRaw = localStorage.getItem('elrx_db_deleted_product_ids');
      const deletedIds = delRaw ? JSON.parse(delRaw) : [];
      if (raw) {
        const parsed = JSON.parse(raw);
        return parsed
          .filter((p) => (p.status || 'published') === 'published' && p.status !== 'trash' && !p.is_deleted && !deletedIds.includes(p.id))
          .map(formatProductForStore);
      }
    } catch {}
    return fallbackProducts.map(formatProductForStore);
  });
  const [storeContent, setStoreContent] = useState(DEFAULT_SITE_CONTENT.store);

  useScrollReveal([allProducts]);

  // Sync with live persistent backend
  useEffect(() => {
    let isMounted = true;
    async function loadData() {
      try {
        const [liveProducts, sc] = await Promise.all([
          getProducts(false),
          getSiteContent(),
        ]);
        if (isMounted) {
          if (sc && sc.store) setStoreContent(sc.store);
          if (liveProducts) {
            // Format fields to ensure backwards compatibility with UI
            const normalized = liveProducts
              .filter((p) => (p.status || 'published') === 'published' && p.status !== 'trash' && !p.is_deleted)
              .map(formatProductForStore);
            setAllProducts(normalized);
          }
        }
      } catch (err) {
        console.warn('Failed to load live store products, using default:', err);
      }
    }
    loadData();

    // Real-time synchronization listeners
    const handleSync = () => loadData();
    window.addEventListener('elrx_data_changed', handleSync);
    window.addEventListener('storage', handleSync);
    window.addEventListener('focus', handleSync);

    let bc = null;
    try {
      if ('BroadcastChannel' in window) {
        bc = new BroadcastChannel('elrx_live_sync');
        bc.onmessage = handleSync;
      }
    } catch {}

    return () => {
      isMounted = false;
      window.removeEventListener('elrx_data_changed', handleSync);
      window.removeEventListener('storage', handleSync);
      window.removeEventListener('focus', handleSync);
      if (bc) bc.close();
    };
  }, []);

  const scrollLeft = (ref) => {
    if (ref.current) {
      ref.current.scrollBy({ left: -320, behavior: 'smooth' });
    }
  };

  const scrollRight = (ref) => {
    if (ref.current) {
      ref.current.scrollBy({ left: 320, behavior: 'smooth' });
    }
  };

  const handleProductClick = (prod) => {
    if (prod.productType === 'external_link' && prod.externalUrl) {
      window.open(prod.externalUrl, '_blank', 'noopener,noreferrer');
      return;
    }
    onOpenProduct(prod);
  };

  // Available items (type !== 'waitlist')
  const availableItems = allProducts.filter((p) => p.type !== 'waitlist');
  // Coming soon items (type === 'waitlist')
  const comingSoonItems = allProducts.filter((p) => p.type === 'waitlist');

  return (
    <div className="store-page page-wrap">
      {/* ── STORE HEADER ── */}
      <EditableSection sectionKey="store.header" sectionLabel="Store Header Section" className="scroll-reveal" style={{ paddingBottom: '2rem', paddingTop: '3rem' }}>
        <div className="section-header" style={{ marginBottom: '1rem' }}>
          <h1 className="section-title-underlined" style={{ margin: 0 }}>
            <EditableText
              as="span"
              contentKey="store.heading"
              defaultValue="E.L.R.x Store"
            />
          </h1>
        </div>
        <EditableText
          as="p"
          contentKey="store.subtitle"
          defaultValue="Field-tested kettlebell programs, PDFs, and training protocols. Instant digital delivery with actionable frameworks."
          style={{ fontSize: 'var(--text-body)', color: 'var(--black)', margin: 0, maxWidth: '640px', lineHeight: 'var(--line-height-body)' }}
        />
      </EditableSection>

      {/* ── 1. AVAILABLE NOW CAROUSEL ── */}
      <EditableSection sectionKey="store.available" sectionLabel="Available Products Section" className="scroll-reveal" style={{ paddingTop: '1rem', paddingBottom: '3.5rem' }}>
        <div className="section-header">
          <span className="section-label">
            <EditableText
              as="span"
              contentKey="store.availableLabel"
              defaultValue="Available Now"
            />
          </span>
        </div>

        <div className="upcoming-carousel-wrap">
          <button
            type="button"
            className="carousel-arrow left"
            onClick={() => scrollLeft(availableGridRef)}
            aria-label="Previous Available Products"
          >
            <svg viewBox="0 0 24 24"><path d="M15 18l-6-6 6-6" /></svg>
          </button>

          <div className="upcoming-grid reveal-stagger" ref={availableGridRef} id="availableGrid">
            {availableItems.map((prod) => {
              const isFree = prod.type === 'free';
              const isExternal = prod.productType === 'external_link';

              return (
                <div
                  key={prod.id}
                  className="product-card"
                  onClick={() => handleProductClick(prod)}
                  role="button"
                  tabIndex={0}
                  onKeyDown={(e) => e.key === 'Enter' && handleProductClick(prod)}
                >
                  <div className="card-thumb">
                    {prod.coverUrl && !prod.coverUrl.includes('author-photo') ? (
                      <div className="custom-book-cover" style={{ overflow: 'hidden' }}>
                        <div className="book-spine-effect" />
                        <img src={prod.coverUrl} alt={prod.name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                      </div>
                    ) : (
                      <ProductBookCover product={prod} isComingSoon={false} />
                    )}
                  </div>
                  <div className="card-body">
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', flexWrap: 'wrap' }}>
                      <span className="card-tag launch">{prod.format || prod.category}</span>
                      {prod.stock_status === 'out_of_stock' && (
                        <span className="card-tag out-of-stock" style={{ background: '#FEE2E2', color: '#DC2626', borderColor: '#FCA5A5', fontWeight: 700 }}>
                          Out of Stock
                        </span>
                      )}
                    </div>
                    <div className="card-title">{prod.name}</div>
                    <p className="card-tagline">
                      {prod.tagline || prod.short_description || (prod.description ? (prod.description.length > 85 ? prod.description.slice(0, 85) + '…' : prod.description) : '')}
                    </p>
                    <div className="card-footer">
                      <EditableButton
                        buttonKey={`store.product.${prod.id}.cta`}
                        defaultText={prod.ctaText || (isFree ? 'Get for Free' : `Get for ₹${prod.price || 499}`)}
                        className={`btn-card ${isFree ? 'btn-free' : 'btn-paid'}`}
                        style={prod.stock_status === 'out_of_stock' ? { opacity: 0.65, cursor: 'not-allowed', background: '#9CA3AF', color: '#FFFFFF', borderColor: '#6B7280' } : {}}
                        onClick={(e) => {
                          e.stopPropagation();
                          handleProductClick(prod);
                        }}
                      />
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

          <button
            type="button"
            className="carousel-arrow"
            onClick={() => scrollRight(availableGridRef)}
            aria-label="Next Available Products"
          >
            <svg viewBox="0 0 24 24"><path d="M9 18l6-6-6-6" /></svg>
          </button>
        </div>
      </EditableSection>

      {/* ── 2. COMING SOON CAROUSEL ── */}
      <EditableSection sectionKey="store.upcoming" sectionLabel="Coming Soon Section" className="scroll-reveal" style={{ paddingTop: '1rem', paddingBottom: '4.5rem' }}>
        <div className="section-header">
          <span className="section-label">
            <EditableText
              as="span"
              contentKey="store.comingSoonLabel"
              defaultValue="Coming Soon"
            />
          </span>
        </div>

        <div className="upcoming-carousel-wrap">
          <button
            type="button"
            className="carousel-arrow left"
            onClick={() => scrollLeft(upcomingGridRef)}
            aria-label="Previous Upcoming Products"
          >
            <svg viewBox="0 0 24 24"><path d="M15 18l-6-6 6-6" /></svg>
          </button>

          <div className="upcoming-grid reveal-stagger" ref={upcomingGridRef} id="upcomingGrid">
            {comingSoonItems.map((prod) => (
              <div
                key={prod.id}
                className="product-card"
                onClick={() => handleProductClick(prod)}
                role="button"
                tabIndex={0}
                onKeyDown={(e) => e.key === 'Enter' && handleProductClick(prod)}
              >
                <div className="card-thumb">
                  {prod.coverUrl && !prod.coverUrl.includes('author-photo') ? (
                    <div className="custom-book-cover" style={{ overflow: 'hidden' }}>
                      <div className="book-spine-effect" />
                      <img src={prod.coverUrl} alt={prod.name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                    </div>
                  ) : (
                    <ProductBookCover product={prod} isComingSoon={true} />
                  )}
                </div>
                <div className="card-body">
                  <span className="card-tag waitlist">{prod.format}</span>
                  <div className="card-title">{prod.name}</div>
                  <p className="card-tagline">
                    {prod.tagline || prod.short_description || (prod.description ? (prod.description.length > 85 ? prod.description.slice(0, 85) + '…' : prod.description) : '')}
                  </p>
                  <div className="card-footer">
                    <EditableButton
                      buttonKey={`store.product.${prod.id}.cta`}
                      defaultText={prod.ctaText || 'Join the Waitlist'}
                      className="btn-card btn-waitlist"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleProductClick(prod);
                      }}
                    />
                  </div>
                </div>
              </div>
            ))}
          </div>

          <button
            type="button"
            className="carousel-arrow"
            onClick={() => scrollRight(upcomingGridRef)}
            aria-label="Next Upcoming Products"
          >
            <svg viewBox="0 0 24 24"><path d="M9 18l6-6-6-6" /></svg>
          </button>
        </div>
      </EditableSection>
    </div>
  );
}
