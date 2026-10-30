import { useEffect, useRef } from 'react';
import Lenis from 'lenis';

/**
 * useSmoothScroll: Provides 2x extra luxurious lazy inertia / momentum scrolling
 * across the entire website via Lenis.
 */
export default function useSmoothScroll(enabled = true) {
  const lenisRef = useRef(null);

  useEffect(() => {
    if (!enabled || typeof window === 'undefined') return;

    const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    if (prefersReducedMotion) return;

    // 2x Extra Lazy Inertia Scroll Configuration
    const lenis = new Lenis({
      duration: 2.2, // 2x Extra lazy duration for deep gliding inertia
      easing: (t) => Math.min(1, 1.001 - Math.pow(2, -7 * t)), // Luxurious elongated deceleration
      orientation: 'vertical',
      gestureOrientation: 'vertical',
      smoothWheel: true,
      wheelMultiplier: 0.85,
      touchMultiplier: 1.8,
      infinite: false,
    });

    lenisRef.current = lenis;
    window.__lenis = lenis;

    let rafId;
    function raf(time) {
      lenis.raf(time);
      rafId = requestAnimationFrame(raf);
    }

    rafId = requestAnimationFrame(raf);

    return () => {
      cancelAnimationFrame(rafId);
      lenis.destroy();
      lenisRef.current = null;
      delete window.__lenis;
    };
  }, [enabled]);

  return lenisRef;
}
