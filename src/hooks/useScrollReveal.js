import { useEffect } from 'react';

/**
 * useScrollReveal: Initializes IntersectionObserver for lazy scrolling animations
 * across every section and interactive card.
 */
export default function useScrollReveal(dependencies = []) {
  useEffect(() => {
    if (typeof window === 'undefined') return;

    if (!('IntersectionObserver' in window)) {
      document.querySelectorAll('.scroll-reveal, .reveal-left, .reveal-right, .reveal-stagger, section').forEach((el) => {
        el.classList.add('is-revealed');
      });
      return;
    }

    const observerOptions = {
      root: null,
      rootMargin: '0px 0px -60px 0px',
      threshold: 0.12,
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

    elements.forEach((el) => {
      const rect = el.getBoundingClientRect();
      // Only reveal if already in the upper viewport on initial load (hero)
      if (rect.top >= 0 && rect.top < 350) {
        el.classList.add('is-revealed');
      } else {
        // Observe so it animates when lazily scrolled into view
        observer.observe(el);
      }
    });

    return () => {
      observer.disconnect();
    };
  }, dependencies);
}
