import React, { useState, useEffect } from 'react';
import Navbar from './components/Navbar';
import Footer from './components/Footer';
import HomePage from './pages/HomePage';
import StorePage from './pages/StorePage';
import WorkWithMePage from './pages/WorkWithMePage';
import NewsletterArchivePage from './pages/NewsletterArchivePage';
import AdminPage from './pages/AdminPage';
import CertificateModal from './components/CertificateModal';
import CheckoutModal from './components/CheckoutModal';
import NewsletterPopup from './components/NewsletterPopup';
import useSmoothScroll from './hooks/useSmoothScroll';
import {
  LiveEditorProvider,
  LiveAdminToolbar,
  FloatingTypographyToolbar,
  WordPressPropertiesPanel,
  InlineMediaModal,
  PublishConfirmModal,
} from './components/live-editor';
import './components/live-editor/LiveEditor.css';

export default function App() {
  const [currentPage, setCurrentPage] = useState('home');
  const [targetEditionId, setTargetEditionId] = useState(null);
  const [selectedProduct, setSelectedProduct] = useState(null);
  const [activeCredentialItem, setActiveCredentialItem] = useState(null);
  const [isCertificateOpen, setIsCertificateOpen] = useState(false);

  // Initialize Lenis lazy smooth inertia scrolling for all public pages
  useSmoothScroll(currentPage !== 'admin');

  // Sync with window.location.hash
  useEffect(() => {
    const parseHash = () => {
      const hash = window.location.hash.replace('#', '').trim();
      if (hash === 'store') {
        setCurrentPage('store');
      } else if (hash === 'work-with-me') {
        setCurrentPage('work-with-me');
      } else if (hash === 'archive') {
        setCurrentPage('archive');
      } else if (hash === 'admin') {
        setCurrentPage('admin');
      } else {
        setCurrentPage('home');
        const targetSection = (hash === 'blog' || hash === 'content' || hash.startsWith('edition-')) ? 'blog' : hash;
        if (targetSection && targetSection !== 'book' && targetSection !== 'home') {
          setTimeout(() => {
            const el = document.getElementById(targetSection);
            if (el) {
              if (window.__lenis) {
                window.__lenis.scrollTo(`#${targetSection}`, { offset: -84, duration: 1.6 });
              } else {
                el.scrollIntoView({ behavior: 'smooth' });
              }
            }
          }, 120);
        }
      }
    };

    parseHash();
    window.addEventListener('hashchange', parseHash);
    return () => window.removeEventListener('hashchange', parseHash);
  }, []);

  const handleNavigate = (pageId, sectionId = '') => {
    setCurrentPage(pageId);
    if (pageId === 'home') {
      window.location.hash = sectionId ? `#${sectionId}` : '#';
      if (sectionId && sectionId !== 'book') {
        setTimeout(() => {
          const el = document.getElementById(sectionId);
          if (el) {
            if (window.__lenis) {
              window.__lenis.scrollTo(`#${sectionId}`, { offset: -84, duration: 1.6 });
            } else {
              el.scrollIntoView({ behavior: 'smooth' });
            }
          }
        }, 120);
      } else {
        if (window.__lenis) {
          window.__lenis.scrollTo(0, { duration: 1.2 });
        } else {
          window.scrollTo({ top: 0, behavior: 'smooth' });
        }
      }
    } else {
      window.location.hash = `#${pageId}`;
      if (window.__lenis) {
        window.__lenis.scrollTo(0, { duration: 0.9 });
      } else {
        window.scrollTo({ top: 0, behavior: 'smooth' });
      }
    }
  };

  const handleOpenProduct = (product) => {
    setSelectedProduct(product);
  };

  const handleOpenCertificate = (item) => {
    setActiveCredentialItem(item || null);
    setIsCertificateOpen(true);
  };

  const handleOpenEdition = (pageId, editionId) => {
    setTargetEditionId(editionId);
    handleNavigate(pageId);
  };

  return (
    <LiveEditorProvider>
      <div className="site-wrapper">
        <LiveAdminToolbar />

        <Navbar currentPage={currentPage} onNavigate={handleNavigate} />

        <main key={currentPage} className="site-main page-transition-enter">
          {currentPage === 'home' && (
            <HomePage
              onNavigate={handleNavigate}
              onOpenProduct={handleOpenProduct}
              onOpenCertificate={handleOpenCertificate}
            />
          )}

          {currentPage === 'store' && (
            <StorePage onOpenProduct={handleOpenProduct} />
          )}

          {currentPage === 'work-with-me' && (
            <WorkWithMePage onNavigate={handleNavigate} />
          )}

          {currentPage === 'archive' && (
            <NewsletterArchivePage
              selectedEditionId={targetEditionId}
              onSelectEdition={(id) => setTargetEditionId(id)}
            />
          )}

          {currentPage === 'admin' && (
            <AdminPage onNavigate={handleNavigate} />
          )}
        </main>

        <Footer onNavigate={handleNavigate} />

        {/* Global Interactive Modals */}
        <CertificateModal
          isOpen={isCertificateOpen}
          item={activeCredentialItem}
          onClose={() => {
            setIsCertificateOpen(false);
            setActiveCredentialItem(null);
          }}
        />

        <CheckoutModal
          product={selectedProduct}
          isOpen={Boolean(selectedProduct)}
          onClose={() => setSelectedProduct(null)}
        />

        <NewsletterPopup />

        {/* Live Editing System Modals & Floating Toolbars */}
        <FloatingTypographyToolbar />
        <WordPressPropertiesPanel />
        <InlineMediaModal />
        <PublishConfirmModal />
      </div>
    </LiveEditorProvider>
  );
}

