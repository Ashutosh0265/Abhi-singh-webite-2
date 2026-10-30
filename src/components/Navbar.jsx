import React, { useState } from 'react';

export default function Navbar({ currentPage, onNavigate }) {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [isCtaClicked, setIsCtaClicked] = useState(false);

  const handleNavClick = (pageId, hash = '') => {
    onNavigate(pageId, hash);
    setMobileMenuOpen(false);
  };

  const handleWorkWithMe = () => {
    setIsCtaClicked(true);
    setMobileMenuOpen(false);
    // Intentional 200ms transition delay so user feels tactile button click feedback
    setTimeout(() => {
      setIsCtaClicked(false);
      onNavigate('work-with-me');
    }, 200);
  };

  return (
    <nav aria-label="Main Navigation">
      <div className="nav-inner">
        <a
          href="#home"
          className="nav-brand"
          onClick={(e) => {
            e.preventDefault();
            handleNavClick('home');
          }}
        >
          <div className="nav-avatar">
            <img src="/assets/avatar.png" alt="Abhi Singh" />
          </div>
          <div className="nav-byline">
            <span className="nav-by">by</span>
            <span className="nav-name">Abhi Singh</span>
          </div>
        </a>

        {/* Mobile Hamburger Toggle Button */}
        <button
          type="button"
          className="mobile-menu-toggle"
          onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
          aria-label={mobileMenuOpen ? 'Close navigation menu' : 'Open navigation menu'}
          aria-expanded={mobileMenuOpen}
        >
          <span className="hamburger-icon">{mobileMenuOpen ? '✕' : '☰'}</span>
        </button>

        {/* Navigation Links */}
        <ul className={`nav-links ${mobileMenuOpen ? 'mobile-open' : ''}`}>
          <li>
            <a
              href="#content"
              onClick={(e) => {
                e.preventDefault();
                handleNavClick('home', 'content');
              }}
            >
              Content
            </a>
          </li>
          <li>
            <a
              href="#newsletter"
              className={currentPage === 'home' ? 'active' : ''}
              onClick={(e) => {
                e.preventDefault();
                handleNavClick('home', 'newsletter');
              }}
            >
              Newsletter
            </a>
          </li>
          <li>
            <a
              href="#store"
              className={currentPage === 'store' ? 'active' : ''}
              onClick={(e) => {
                e.preventDefault();
                handleNavClick('store');
              }}
            >
              E.L.R.x Store
            </a>
          </li>
          <li>
            <a
              href="#blog"
              onClick={(e) => {
                e.preventDefault();
                handleNavClick('home', 'blog');
              }}
            >
              Blog
            </a>
          </li>
          <li>
            <a
              href="#about"
              onClick={(e) => {
                e.preventDefault();
                handleNavClick('home', 'about');
              }}
            >
              About
            </a>
          </li>
          <li>
            <button
              type="button"
              className={`nav-cta ${isCtaClicked ? 'clicked' : ''}`}
              onClick={handleWorkWithMe}
            >
              Work With Me
            </button>
          </li>
        </ul>
      </div>

      {/* Mobile Drawer Backdrop when open */}
      {mobileMenuOpen && (
        <div
          className="mobile-nav-backdrop"
          onClick={() => setMobileMenuOpen(false)}
          aria-hidden="true"
        />
      )}
    </nav>
  );
}
