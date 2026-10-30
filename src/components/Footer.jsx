import React from 'react';

export default function Footer({ onNavigate }) {
  return (
    <footer>
      <div className="footer-inner">
        <p>© 2025 Abhi Singh · abhisingh.me</p>
        <ul className="footer-links">
          <li>
            <a
              href="#home"
              onClick={(e) => {
                e.preventDefault();
                onNavigate('home');
              }}
            >
              Home
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
              Store
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
              Work With Me
            </a>
          </li>
          <li>
            <a href="https://instagram.com" target="_blank" rel="noopener noreferrer">
              Instagram
            </a>
          </li>
          <li>
            <a href="https://linkedin.com" target="_blank" rel="noopener noreferrer">
              LinkedIn
            </a>
          </li>
        </ul>
      </div>
    </footer>
  );
}
