import React, { useRef, useState, useEffect } from 'react';
import { getProducts } from '../services/db';
import { products as fallbackProducts } from '../data/products';
import useScrollReveal from '../hooks/useScrollReveal';
import ProductBookCover from '../components/ProductBookCover';

export default function StorePage({ onOpenProduct }) {
  const availableGridRef = useRef(null);
  const upcomingGridRef = useRef(null);
  const [allProducts, setAllProducts] = useState(fallbackProducts);

  useScrollReveal([allProducts]);

  // Sync with live persistent backend
  useEffect(() => {
    let isMounted = true;
    async function loadProducts() {
      try {
        const liveProducts = await getProducts(false); // only published
        if (isMounted && liveProducts && liveProducts.length > 0) {
          // Format fields to ensure backwards compatibility with UI
          const normalized = liveProducts.map((p) => ({
            id: p.id,
            name: p.title || p.name,
            type: p.is_free || p.type === 'free' ? 'free' : (p.type === 'waitlist' ? 'waitlist' : 'paid'),
            price: p.is_free || p.price_inr === 0 ? 'Free' : (p.price || `₹${p.price_inr}`),
            priceAmount: p.price_inr || p.priceAmount || 0,
            currency: 'INR',
            category: p.category || 'Book',
            format: p.format || 'PDF (Digital Download)',
            tagline: p.short_description || p.tagline,
            description: p.full_description || p.description,
            productType: p.product_type || p.productType,
            externalUrl: p.external_url || p.externalUrl,
            coverUrl: p.cover_image_url || p.coverUrl,
            whatInside: p.whatInside || [],
            ctaText: p.ctaText || (p.product_type === 'external_link' ? 'Join on Skool →' : (p.is_free ? 'Get for FREE' : `Get for ₹${p.price_inr}`)),
          }));
          setAllProducts(normalized);
        }
      } catch (err) {
        console.warn('Failed to load live store products, using default:', err);
      }
    }
    loadProducts();
    return () => { isMounted = false; };
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
      <section className="scroll-reveal" style={{ paddingBottom: '2rem', paddingTop: '3rem' }}>
        <div className="section-header" style={{ marginBottom: '1rem' }}>
          <h1 style={{ fontSize: 'clamp(1.85rem, 3.5vw, 2.35rem)', lineHeight: 1.15, margin: 0 }}>
            E.L.R.<em style={{ fontStyle: 'italic', color: 'var(--orange)' }}>x</em> Store
          </h1>
        </div>
        <p style={{ fontSize: '0.95rem', color: 'var(--black)', margin: 0, maxWidth: '640px', lineHeight: 1.65 }}>
          Field-tested kettlebell programs, PDFs, and training protocols. Instant digital delivery with actionable frameworks.
        </p>
      </section>

      {/* ── 1. AVAILABLE NOW CAROUSEL ── */}
      <section className="scroll-reveal" style={{ paddingTop: '1rem', paddingBottom: '3.5rem' }}>
        <div className="section-header">
          <span className="section-label">Available Now</span>
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
                    <span className="card-tag launch">{prod.format || prod.category}</span>
                    <div className="card-title">{prod.name}</div>
                    <div className="card-footer">
                      <button
                        type="button"
                        className={`btn-card ${isFree ? 'btn-free' : 'btn-paid'}`}
                        onClick={(e) => {
                          e.stopPropagation();
                          handleProductClick(prod);
                        }}
                      >
                        {isExternal
                          ? (prod.ctaText || 'Join on Skool →')
                          : isFree
                          ? 'Get for FREE'
                          : `Get for ${prod.price}`}
                      </button>
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
      </section>

      {/* ── 2. COMING SOON CAROUSEL ── */}
      <section className="scroll-reveal" style={{ paddingTop: '1rem', paddingBottom: '4.5rem' }}>
        <div className="section-header">
          <span className="section-label">Coming Soon</span>
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
                  <div className="card-footer">
                    <button
                      type="button"
                      className="btn-card btn-waitlist"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleProductClick(prod);
                      }}
                    >
                      Join the Waitlist
                    </button>
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
      </section>
    </div>
  );
}
