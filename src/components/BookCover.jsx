import React from 'react';

export default function BookCover() {
  return (
    <div className="book-cover-wrap">
      <div className="book-cover" aria-label="Eat. Lift. Run. x — 10 kettlebell complexes for everyday people">
        <div className="cover-top"></div>
        <div className="cover-title-block">
          <div className="cover-title">
            Eat.<br />
            Lift.<br />
            Run.<em>x</em>
          </div>
        </div>
        <div className="cover-bottom">
          <div className="cover-subtitle">10 kettlebell complexes for everyday people</div>
          <div className="cover-author-row">
            <img
              src="assets/author-photo.png"
              alt="Abhi Singh"
              className="cover-author-photo"
            />
            <div className="cover-author-text">
              <span className="cover-author-label">by</span>
              <span className="cover-author-name">Abhi Singh</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
