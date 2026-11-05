import { useEffect } from 'react';

/**
 * useScrollReveal: Initializes IntersectionObserver for lazy scrolling animations
 * across every section and interactive card.
 */
export default function useScrollReveal(dependencies = []) {
  useEffect(() => {
    if (typeof window === 'undefined') return;

    const revealAll = () => {
      document.querySelectorAll('section, .scroll-reveal, .reveal-left, .reveal-right, .reveal-stagger, .product-card').forEach((el) => {
        el.classList.add('is-revealed');
      });
    };

    // If admin is active or editing, reveal everything immediately with zero delay
    if (
      document.body.classList.contains('has-admin-bar') ||
      document.body.classList.contains('live-editing-active') ||
      window.location.search.includes('edit=true') ||
      window.location.hash.includes('edit')
    ) {
      revealAll();
    }

    const handleToggle = () => {
      revealAll();
    };
    window.addEventListener('elrx_live_editor_toggled', handleToggle);

    if (!('IntersectionObserver' in window)) {
      revealAll();
      return () => {
        window.removeEventListener('elrx_live_editor_toggled', handleToggle);
      };
    }

    const observerOptions = {
      root: null,
      rootMargin: '0px 0px 40px 0px',
      threshold: 0.05,
    };

    const handleIntersect = (entries, observer) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          entry.target.classList.add('is-revealed');
          observer.unobserve(entry.target);
        }
      });
    };

    const observer = new IntersectionObserver(handleIntersect, observerOptions);

    const elements = document.querySelectorAll(
      'section, .scroll-reveal, .reveal-left, .reveal-right, .reveal-stagger, .product-card'
    );

    const vpHeight = window.innerHeight || 800;

    elements.forEach((el) => {
      const rect = el.getBoundingClientRect();
      // Only reveal if already in the viewport on initial load (or hero)
      if (rect.top <= vpHeight || el.id === 'book' || el.closest('#book')) {
        el.classList.add('is-revealed');
      } else {
        // Observe so it animates when lazily scrolled into view
        observer.observe(el);
      }
    });

    return () => {
      window.removeEventListener('elrx_live_editor_toggled', handleToggle);
      observer.disconnect();
    };
  }, dependencies);
}
