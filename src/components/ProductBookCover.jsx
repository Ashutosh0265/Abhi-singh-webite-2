import React from 'react';

/**
 * ProductBookCover: Renders authentic, high-impact, distinctive book covers
 * for each individual product in the store, strictly complying with the
 * 4 brand colors: Orange (#FF6200), Yellow (#FFE785), White (#FFFFFF), Black (#212121).
 */
export default function ProductBookCover({ product, isComingSoon = false }) {
  const id = product?.id || '';

  // 1. Habits for Physical and Mental Strength (Black & Yellow Theme)
  if (id === 'habits-email-course') {
    return (
      <div className="custom-book-cover cover-habits">
        <div className="book-spine-effect" />
        <div className="book-inner-layout">
          <div className="book-top-badge">E.L.R.x PROTOCOL</div>
          <div className="book-main-title">
            <span className="book-lead-text">HABITS</span>
            <span className="book-sub-serif">Physical &amp; Mental Strength</span>
          </div>
          <div className="book-footer-info">
            <span className="book-edition-tag">3-DAY SYSTEM</span>
            <span className="book-author-tag">ABHI SINGH</span>
          </div>
        </div>
      </div>
    );
  }

  // 2. 24 Boring Basics for Peak Fitness (Orange & Yellow Editorial Theme)
  if (id === 'boring-basics-book') {
    return (
      <div className="custom-book-cover cover-basics">
        <div className="book-spine-effect" />
        <div className="book-inner-layout">
          <div className="book-top-badge">E.L.R.x MANUAL</div>
          <div className="book-hero-num">24</div>
          <div className="book-main-title">
            <span className="book-lead-serif">Boring Basics</span>
            <span className="book-sub-tag">PEAK FITNESS</span>
          </div>
          <div className="book-footer-info">
            <span className="book-edition-tag">FIELD TESTED</span>
            <span className="book-author-tag">ABHI SINGH</span>
          </div>
        </div>
      </div>
    );
  }

  // 3. Abhi's 10 Complexes (Signature Orange Book Cover)
  if (id === 'abhis-10-complexes') {
    return (
      <div className="custom-book-cover cover-complexes">
        <div className="book-spine-effect" />
        <div className="book-inner-layout">
          <div className="book-top-badge">CORE PROGRAM</div>
          <div className="book-hero-num-10">10</div>
          <div className="book-main-title">
            <span className="book-lead-serif">COMPLEXES</span>
            <span className="book-sub-line">Strength · Muscle · Stamina</span>
          </div>
          <div className="book-footer-info">
            <span className="book-edition-tag">E.L.R.x CORE</span>
            <span className="book-author-tag">ABHI SINGH</span>
          </div>
        </div>
      </div>
    );
  }

  // 4. Follow Along 6-Week Cycles (White & Orange Clean Theme)
  if (id === 'follow-along-cycles') {
    return (
      <div className="custom-book-cover cover-cycles">
        <div className="book-spine-effect" />
        <div className="book-inner-layout">
          <div className="book-top-badge-dark">6-WEEK CYCLES</div>
          <div className="book-main-title">
            <span className="book-lead-serif dark">Progressive</span>
            <span className="book-sub-orange">OVERLOAD</span>
          </div>
          <div className="book-footer-info">
            <span className="book-edition-tag dark">VIDEO + COACHING</span>
            <span className="book-author-tag dark">ABHI SINGH</span>
          </div>
        </div>
      </div>
    );
  }

  // 5. Play the Long Game with Better Mobility (Black & Orange Stealth Theme)
  if (id === 'play-the-long-game-mobility') {
    return (
      <div className="custom-book-cover cover-mobility">
        <div className="book-spine-effect" />
        <div className="book-inner-layout">
          <div className="book-top-badge yellow">MOBILITY</div>
          <div className="book-main-title">
            <span className="book-lead-serif white">Play The</span>
            <span className="book-lead-serif orange">Long Game</span>
            <span className="book-sub-white">Joint Longevity Protocol</span>
          </div>
          <div className="book-footer-info">
            <span className="book-edition-tag waitlist-tag">COMING SOON</span>
            <span className="book-author-tag">ABHI SINGH</span>
          </div>
        </div>
      </div>
    );
  }

  // 6. Compound Lifts Foundations (Bold Orange Technical Theme)
  if (id === 'compound-lifts-foundations') {
    return (
      <div className="custom-book-cover cover-compound">
        <div className="book-spine-effect" />
        <div className="book-inner-layout">
          <div className="book-top-badge">TECHNIQUE</div>
          <div className="book-main-title">
            <span className="book-lead-serif white">COMPOUND</span>
            <span className="book-lead-serif black-box">LIFTS</span>
            <span className="book-sub-white">Biomechanical Guide</span>
          </div>
          <div className="book-footer-info">
            <span className="book-edition-tag waitlist-tag">COMING SOON</span>
            <span className="book-author-tag">ABHI SINGH</span>
          </div>
        </div>
      </div>
    );
  }

  // 7. Olympic Lifts Foundations (Yellow High-Contrast Power Theme)
  if (id === 'olympic-lifts-foundations') {
    return (
      <div className="custom-book-cover cover-olympic">
        <div className="book-spine-effect" />
        <div className="book-inner-layout">
          <div className="book-top-badge black">POWER SYSTEM</div>
          <div className="book-main-title">
            <span className="book-lead-serif dark">OLYMPIC</span>
            <span className="book-lead-serif orange">LIFTS</span>
            <span className="book-sub-dark">Triple Extension Mechanics</span>
          </div>
          <div className="book-footer-info">
            <span className="book-edition-tag waitlist-tag">COMING SOON</span>
            <span className="book-author-tag dark">ABHI SINGH</span>
          </div>
        </div>
      </div>
    );
  }

  // Generic Fallback Book Cover for Dynamic / CMS Added Products
  return (
    <div className={`custom-book-cover ${isComingSoon ? 'cover-generic-waitlist' : 'cover-complexes'}`}>
      <div className="book-spine-effect" />
      <div className="book-inner-layout">
        <div className="book-top-badge">E.L.R.x</div>
        <div className="book-main-title">
          <span className="book-lead-serif white">{product?.name || 'Protocol'}</span>
        </div>
        <div className="book-footer-info">
          <span className="book-edition-tag">{isComingSoon ? 'COMING SOON' : 'DIGITAL EDITION'}</span>
          <span className="book-author-tag">ABHI SINGH</span>
        </div>
      </div>
    </div>
  );
}

