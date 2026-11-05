import React, { useState, useEffect } from 'react';
import { getSiteContent, DEFAULT_SITE_CONTENT } from '../services/db';
import { EditableText } from './live-editor';

export default function Footer({ onNavigate }) {
  const [social, setSocial] = useState(DEFAULT_SITE_CONTENT.social || {
    instagram: 'https://www.instagram.com/abhi.sins?dlrf=Y3o3Y2RzMnVkM2Ru',
    linkedin: '',
  });

  useEffect(() => {
    let isMounted = true;
    const loadContent = () => {
      getSiteContent().then((content) => {
        if (isMounted && content?.social) {
          setSocial(content.social);
        }
      }).catch(() => {});
    };
    loadContent();

    const handleSync = () => loadContent();
    window.addEventListener('elrx_data_changed', handleSync);
    window.addEventListener('storage', handleSync);
    window.addEventListener('focus', handleSync);

    return () => {
      isMounted = false;
      window.removeEventListener('elrx_data_changed', handleSync);
      window.removeEventListener('storage', handleSync);
      window.removeEventListener('focus', handleSync);
    };
  }, []);

  return (
    <footer>
      <div className="footer-inner">
        <p className="footer-copyright">
          © {new Date().getFullYear()}{' '}
          <EditableText as="span" contentKey="footer.copyrightName" defaultValue="Abhi Singh" />
          {' · '}
          <EditableText as="span" contentKey="footer.domain" defaultValue="abhisingh.me" />
        </p>
        <ul className="footer-links">
          <li>
            <a
              href="#home"
              onClick={(e) => {
                e.preventDefault();
                onNavigate('home');
              }}
            >
              <EditableText as="span" contentKey="footer.linkHome" defaultValue="Home" />
            </a>
          </li>
          <li>
            <a
              href="#store"
              onClick={(e) => {
                e.preventDefault();
                onNavigate('store');
              }}
            >
              <EditableText as="span" contentKey="footer.linkStore" defaultValue="Store" />
            </a>
          </li>
          <li>
            <a
              href="#work-with-me"
              onClick={(e) => {
                e.preventDefault();
                onNavigate('work-with-me');
              }}
            >
              <EditableText as="span" contentKey="footer.linkWork" defaultValue="Work With Me" />
            </a>
          </li>
          {social.instagram && (
            <li>
              <a
                href={social.instagram}
                target="_blank"
                rel="noopener noreferrer"
                className="footer-social-link"
                aria-label="Follow Abhi Singh on Instagram"
              >
                <svg
                  width="14"
                  height="14"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  style={{ display: 'inline-block', verticalAlign: '-2px', marginRight: '5px' }}
                >
                  <rect x="2" y="2" width="20" height="20" rx="5" ry="5"></rect>
                  <path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z"></path>
                  <line x1="17.5" y1="6.5" x2="17.51" y2="6.5"></line>
                </svg>
                Instagram
              </a>
            </li>
          )}
          {social.linkedin && (
            <li>
              <a
                href={social.linkedin}
                target="_blank"
                rel="noopener noreferrer"
                className="footer-social-link"
                aria-label="Connect with Abhi Singh on LinkedIn"
              >
                <svg
                  width="14"
                  height="14"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  style={{ display: 'inline-block', verticalAlign: '-2px', marginRight: '5px' }}
                >
                  <path d="M16 8a6 6 0 0 1 6 6v7h-4v-7a2 2 0 0 0-2-2 2 2 0 0 0-2 2v7h-4v-7a6 6 0 0 1 6-6z"></path>
                  <rect x="2" y="9" width="4" height="12"></rect>
                  <circle cx="4" cy="4" r="2"></circle>
                </svg>
                LinkedIn
              </a>
            </li>
          )}
        </ul>
      </div>
    </footer>
  );
}
