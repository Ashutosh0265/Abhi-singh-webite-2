import React, { useState, useEffect } from 'react';
import { EditableText, EditableImage, EditableButton } from './live-editor';

export default function Navbar({ currentPage, onNavigate }) {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [isCtaClicked, setIsCtaClicked] = useState(false);

  // Close mobile drawer on Escape key
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Escape' && mobileMenuOpen) {
        setMobileMenuOpen(false);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [mobileMenuOpen]);

  // Prevent background scroll when mobile menu drawer is open
  useEffect(() => {
    if (mobileMenuOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => {
      document.body.style.overflow = '';
    };
  }, [mobileMenuOpen]);

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
            <EditableImage
              srcKey="nav.avatar"
              defaultSrc="/assets/avatar.png"
              altKey="nav.avatarAlt"
              defaultAlt="Abhi Singh"
            />
          </div>
          <div className="nav-byline">
            <EditableText as="span" contentKey="nav.by" defaultValue="by" className="nav-by" />
            <EditableText as="span" contentKey="nav.name" defaultValue="Abhi Singh" className="nav-name" />
          </div>
        </a>

        {/* Mobile Hamburger Toggle Button with Smooth Morphing Bars */}
        <button
          type="button"
          className={`mobile-menu-toggle ${mobileMenuOpen ? 'is-active' : ''}`}
          onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
          aria-label={mobileMenuOpen ? 'Close navigation menu' : 'Open navigation menu'}
          aria-expanded={mobileMenuOpen}
        >
          <span className="hamburger-box" aria-hidden="true">
            <span className="hamburger-bar hamburger-bar-top" />
            <span className="hamburger-bar hamburger-bar-mid" />
            <span className="hamburger-bar hamburger-bar-bot" />
          </span>
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
              <EditableText as="span" contentKey="nav.content" defaultValue="Content" />
            </a>
          </li>
          <li>
            <a
              href="#newsletter"
              className={currentPage === 'newsletter' || currentPage === 'archive' ? 'active' : ''}
              onClick={(e) => {
                e.preventDefault();
                handleNavClick('home', 'newsletter');
              }}
            >
              <EditableText as="span" contentKey="nav.newsletter" defaultValue="Newsletter" />
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
              <EditableText as="span" contentKey="nav.store" defaultValue="E.L.R.x Store" />
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
              <EditableText as="span" contentKey="nav.blog" defaultValue="Blog" />
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
              <EditableText as="span" contentKey="nav.about" defaultValue="About" />
            </a>
          </li>
          <li>
            <EditableButton
              buttonKey="nav.cta"
              defaultText="Work With Me"
              defaultHref="/work-with-me"
              className={`nav-cta ${isCtaClicked ? 'clicked' : ''}`}
              onClick={handleWorkWithMe}
            />
          </li>
        </ul>
      </div>

      {/* Smoothly animated backdrop */}
      <div
        className={`mobile-nav-backdrop ${mobileMenuOpen ? 'active' : ''}`}
        onClick={() => setMobileMenuOpen(false)}
        aria-hidden="true"
      />
    </nav>
  );
}
