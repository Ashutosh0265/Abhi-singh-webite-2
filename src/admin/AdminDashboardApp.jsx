import React, { useState, useEffect, useMemo } from 'react';
import './AdminDashboard.css';
import { formatArticleThumbnailUrl, DEFAULT_BLOG_COVER } from '../utils/mediaHelper';
import {
  getProducts,
  createProduct,
  updateProduct,
  deleteProduct,
  restoreProduct,
  permanentlyDeleteProduct,
  getPosts,
  createPost,
  updatePost,
  deletePost,
  togglePostFeatured,
  setFeaturedPostsOrder,
  getCategories,
  createCategory,
  deleteCategory,
  getMediaAssets,
  uploadMediaAsset,
  deleteMediaAsset,
  MAX_FILE_SIZE_BYTES,
  ALLOWED_MEDIA_EXTENSIONS,
  ALLOWED_MEDIA_MIME_TYPES,
  getLeads,
  updateLeadStatus,
  deleteLead,
  getOrders,
  updateOrder,
  deleteOrder,
  getSiteContent,
  updateSiteContent,
  updateAllSiteContent,
  DEFAULT_SITE_CONTENT,
  getDashboardMetrics,
  adminLogin,
  adminLogout,
  getAdminSession,
} from '../services/db';
import { sendProductDeliveryEmail } from '../services/emailDelivery';
import { parseMarkdownToHtml } from '../utils/markdown';
import DOMPurify from 'dompurify';
import { isSupabaseConfigured } from '../services/supabase';
import { ArticleVideoPlayer, getVideoInfo } from '../components/ArticleVideoPlayer';
import WebsiteContentManager from './WebsiteContentManager';
import {
  CustomerHabitsBarChart,
  ProductStatisticRadialGauge,
  CustomerGrowthBubbles,
} from './components/DashboardCharts';
import {
  SupabaseVectorAnim,
  RazorpayVectorAnim,
  PayPalVectorAnim,
  ZohoVectorAnim,
  ResendVectorAnim,
} from './components/IntegrationVectorAnimations';
import {
  getApiSettings,
  saveApiSettings,
  testSupabaseConnection,
  testRazorpayCredentials,
  testPayPalCredentials,
  testZohoCampaigns,
  testResendCredentials,
} from '../services/settings';
import { syncToZohoCampaigns } from '../utils/tracking';

export default function AdminDashboardApp() {
  const [session, setSession] = useState(() => {
    return getAdminSession() || {
      authenticated: true,
      user: {
        email: 'abhi@abhisingh.me',
        fullName: 'Abhi Singh',
        role: 'super_admin',
      },
      token: 'open_admin_session_unrestricted',
      expiresAt: Date.now() + 365 * 24 * 60 * 60 * 1000,
    };
  });
  const [activeTab, setActiveTab] = useState(() => {
    if (typeof window !== 'undefined') {
      const hash = window.location.hash.replace('#', '').trim();
      const validTabs = ['overview', 'products', 'blog', 'media', 'content', 'leads', 'orders', 'settings'];
      if (hash && validTabs.includes(hash)) return hash;
    }
    return 'overview';
  }); // overview | products | blog | media | content | leads | settings
  const [productViewMode, setProductViewMode] = useState('grid'); // 'grid' | 'table'
  const [postViewMode, setPostViewMode] = useState('grid'); // 'grid' | 'table'
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [notification, setNotification] = useState(null);

  const switchTab = (tab) => {
    setActiveTab(tab);
    setSidebarOpen(false);
    try {
      window.scrollTo({ top: 0, behavior: 'instant' });
      if (window.location.hash !== `#${tab}`) {
        window.history.pushState(null, '', `#${tab}`);
      }
    } catch (e) {
      window.location.hash = tab;
    }
  };

  useEffect(() => {
    const handleHash = () => {
      const hash = window.location.hash.replace('#', '').trim();
      const validTabs = ['overview', 'products', 'blog', 'media', 'content', 'leads', 'settings'];
      if (hash && validTabs.includes(hash)) {
        setActiveTab(hash);
        try { window.scrollTo({ top: 0, behavior: 'instant' }); } catch {}
      } else if (!hash) {
        setActiveTab('overview');
        try { window.scrollTo({ top: 0, behavior: 'instant' }); } catch {}
      }
    };
    window.addEventListener('hashchange', handleHash);
    window.addEventListener('popstate', handleHash);
    return () => {
      window.removeEventListener('hashchange', handleHash);
      window.removeEventListener('popstate', handleHash);
    };
  }, []);

  // API Integration settings state
  const [apiSettings, setApiSettings] = useState(getApiSettings());
  const [showKeys, setShowKeys] = useState({
    supabase: false,
    razorpay: false,
    paypal: false,
    zoho: false,
    resend: false,
  });
  const [testStates, setTestStates] = useState({
    supabase: null,
    razorpay: null,
    paypal: null,
    zoho: null,
    resend: null,
  });
  const [isSavingSettings, setIsSavingSettings] = useState(false);

  // Admin Profile state (Custom Photo & Details)
  const [adminProfile, setAdminProfile] = useState(() => {
    try {
      const saved = localStorage.getItem('elrx_admin_profile');
      if (saved) return JSON.parse(saved);
    } catch {}
    return {
      fullName: 'Abhi Singh',
      role: 'Admin store',
      photoUrl: 'assets/author-photo.png',
      email: 'abhi@abhisingh.me',
    };
  });
  const [isProfileModalOpen, setIsProfileModalOpen] = useState(false);
  const [profileForm, setProfileForm] = useState(adminProfile);

  const handleOpenProfileModal = () => {
    setProfileForm({ ...adminProfile });
    setIsProfileModalOpen(true);
  };

  const handleProfilePhotoUpload = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      showToast('Please select a valid image file (PNG, JPG, WebP)', 'error');
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      showToast('Image file size must be less than 5MB', 'error');
      return;
    }

    const reader = new FileReader();
    reader.onload = (event) => {
      const base64Url = event.target?.result;
      if (base64Url) {
        setProfileForm((prev) => ({ ...prev, photoUrl: base64Url }));
        showToast('Photo loaded. Click "Save Profile Photo" to persist.');
      }
    };
    reader.readAsDataURL(file);
  };

  const handleSaveProfile = () => {
    setAdminProfile(profileForm);
    try {
      localStorage.setItem('elrx_admin_profile', JSON.stringify(profileForm));
    } catch (err) {
      console.warn('Failed saving profile to localStorage:', err);
    }
    setIsProfileModalOpen(false);
    showToast('Profile photo & details updated successfully!');
  };

  // Data states
  const [metrics, setMetrics] = useState(null);
  const [productsList, setProductsList] = useState([]);
  const [postsList, setPostsList] = useState([]);
  const [mediaList, setMediaList] = useState([]);
  const [leadsList, setLeadsList] = useState([]);
  const [ordersList, setOrdersList] = useState([]);
  const [orderSearch, setOrderSearch] = useState('');
  const [orderStatusFilter, setOrderStatusFilter] = useState('all'); // 'all' | 'paid' | 'pending' | 'delivered' | 'failed'
  const [isResendingEmailId, setIsResendingEmailId] = useState(null);
  const [selectedOrderDetails, setSelectedOrderDetails] = useState(null);
  const [orderToDelete, setOrderToDelete] = useState(null);
  const [copiedOrderId, setCopiedOrderId] = useState(null);
  const [siteContent, setSiteContentState] = useState(DEFAULT_SITE_CONTENT);
  const [contentSubTab, setContentSubTab] = useState('hero'); // hero | whatsInside | about | blog | store | workWithMe | newsletterPopup

  // Login form state
  const [loginEmail, setLoginEmail] = useState('');
  const [loginPassword, setLoginPassword] = useState('');
  const [loginError, setLoginError] = useState('');

  // Modals & Editors
  const [editingProduct, setEditingProduct] = useState(null);
  const [isProductModalOpen, setIsProductModalOpen] = useState(false);
  const [editingPost, setEditingPost] = useState(null);
  const [isPostModalOpen, setIsPostModalOpen] = useState(false);
  const [viewingLead, setViewingLead] = useState(null);
  const [deleteConfirmTarget, setDeleteConfirmTarget] = useState(null); // { type, id, name }

  // Categories & Media Picker for Blog/Articles & Products
  const [categoriesList, setCategoriesList] = useState([
    'Framework', 'Endurance', 'Nutrition', 'Kettlebells', 'Habits'
  ]);
  const [isCreatingCategory, setIsCreatingCategory] = useState(false);
  const [newCategoryName, setNewCategoryName] = useState('');
  const [isMediaPickerOpen, setIsMediaPickerOpen] = useState(false);
  const [mediaPickerTarget, setMediaPickerTarget] = useState('post_thumbnail'); // 'post_thumbnail' | 'product_cover'
  const [articleEditorTab, setArticleEditorTab] = useState('write'); // 'write' | 'preview'
  const [isSavingArticle, setIsSavingArticle] = useState(false);

  // Search & Filters
  const [productSearch, setProductSearch] = useState('');
  const [productStatusFilter, setProductStatusFilter] = useState('all');
  const [postSearch, setPostSearch] = useState('');
  const [postCategoryFilter, setPostCategoryFilter] = useState('all');
  const [postStatusFilter, setPostStatusFilter] = useState('all'); // 'all' | 'published' | 'draft'
  const [leadSearch, setLeadSearch] = useState('');
  const [leadTypeFilter, setLeadTypeFilter] = useState('all');

  const toastTimeoutRef = React.useRef(null);
  // Trigger toast notification
  const showToast = (message, type = 'success') => {
    if (toastTimeoutRef.current) clearTimeout(toastTimeoutRef.current);
    setNotification({ message, type });
    toastTimeoutRef.current = setTimeout(() => {
      setNotification(null);
      toastTimeoutRef.current = null;
    }, 3500);
  };

  // Handle custom category creation
  const handleCreateCategory = async () => {
    if (!newCategoryName || !newCategoryName.trim()) {
      showToast('Please enter a category name', 'error');
      return;
    }
    try {
      const updatedCats = await createCategory(newCategoryName.trim());
      const formatted = newCategoryName.trim().charAt(0).toUpperCase() + newCategoryName.trim().slice(1);
      setCategoriesList(updatedCats);
      if (editingPost) {
        setEditingPost((prev) => ({ ...prev, category: formatted }));
      }
      setNewCategoryName('');
      setIsCreatingCategory(false);
      showToast(`Category "${formatted}" created successfully`);
    } catch (err) {
      showToast(`Failed creating category: ${err.message}`, 'error');
    }
  };

  // Refresh data
  const refreshAllData = async () => {
    if (!session) return;
    setLoading(true);
    try {
      const [m, prods, posts, media, leads, content, cats, ords] = await Promise.all([
        getDashboardMetrics(),
        getProducts(true, true),
        getPosts(true, true),
        getMediaAssets(),
        getLeads(),
        getSiteContent(),
        getCategories(),
        getOrders(),
      ]);
      setMetrics(m);
      setProductsList(prods);
      setPostsList(posts);
      setMediaList(media);
      setLeadsList(leads);
      setSiteContentState(content);
      if (cats && cats.length > 0) {
        setCategoriesList(cats);
      }
      if (ords) {
        setOrdersList(ords);
      }
    } catch (err) {
      console.error('Error fetching admin data:', err);
      showToast('Error refreshing data', 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (session) {
      refreshAllData();
    }
  }, [session]);

  // Auth Handlers
  const handleLoginSubmit = async (e) => {
    e.preventDefault();
    setLoginError('');
    if (!loginEmail.trim() || !loginPassword.trim()) {
      setLoginError('Email and password are required');
      return;
    }
    setLoading(true);
    const result = await adminLogin(loginEmail, loginPassword);
    setLoading(false);
    if (result.success) {
      setSession(result.session);
      showToast('Welcome back, Abhi!');
    } else {
      setLoginError(result.error || 'Invalid credentials');
    }
  };

  const handleLogoutClick = () => {
    window.location.href = '/';
  };

  // ==========================================================================
  // VIEW: DIRECT ACCESS DASHBOARD (PASSWORD & ID REMOVED PER USER INSTRUCTION)
  // ==========================================================================
  if (!session) {
    const defaultSession = {
      authenticated: true,
      user: {
        email: 'abhi@abhisingh.me',
        fullName: 'Abhi Singh',
        role: 'super_admin',
      },
      token: 'open_admin_session_unrestricted',
      expiresAt: Date.now() + 365 * 24 * 60 * 60 * 1000,
    };
    return (
      <div className="admin-body admin-login-wrap" style={{ textAlign: 'center' }}>
        <div className="admin-login-card">
          <div className="admin-login-brand">
            <div className="admin-login-avatar">
              <img src="assets/avatar.png" alt="Abhi Singh" />
            </div>
            <div>
              <h1 className="admin-login-title">Abhi Singh CMS</h1>
              <span className="admin-brand-sub">Direct Control Panel</span>
            </div>
          </div>
          <p className="admin-login-subtitle" style={{ marginBottom: '1.5rem' }}>
            Direct access enabled without credentials.
          </p>
          <button
            type="button"
            className="admin-btn-primary"
            onClick={() => setSession(defaultSession)}
          >
            Open Dashboard →
          </button>
        </div>
      </div>
    );
  }

  // ==========================================================================
  // VIEW: AUTHENTICATED DASHBOARD
  // ==========================================================================
  return (
    <div className="admin-body admin-shell">
      {/* Toast Notification */}
      {notification && (
        <div
          className="admin-toast"
          style={{
            position: 'fixed',
            top: '20px',
            right: '20px',
            zIndex: 9999,
            background: notification.type === 'error' ? '#DC2626' : 'var(--admin-black)',
            color: 'var(--admin-white)',
            padding: '0.75rem 1.25rem',
            borderRadius: '4px',
            boxShadow: '0 4px 12px rgba(0,0,0,0.15)',
            fontSize: '0.88rem',
            fontWeight: 600,
          }}
        >
          {notification.message}
        </div>
      )}

      {/* ── 1. SIDEBAR (DEALDECK MODERN STYLE) ── */}
      <aside className={`admin-sidebar ${sidebarOpen ? 'open' : ''}`}>
        <div className="admin-sidebar-header">
          <div className="admin-sidebar-brand" style={{ display: 'flex', alignItems: 'center', gap: '0.85rem' }}>
            <div className="dealdeck-logo-mark">
              <span>⚡</span>
            </div>
            <div>
              <div className="dealdeck-brand-name">Abhi Singh</div>
              <div className="dealdeck-brand-sub">E.L.R.x CMS</div>
            </div>
          </div>
        </div>

        <nav className="admin-sidebar-nav">
          <span className="sidebar-section-label">MENU</span>
          <button
            type="button"
            className={`admin-nav-item ${activeTab === 'overview' ? 'active' : ''}`}
            onClick={() => switchTab('overview')}
          >
            <span className="admin-nav-icon">📊</span>
            Dashboard
          </button>
          <button
            type="button"
            className={`admin-nav-item ${activeTab === 'products' ? 'active' : ''}`}
            onClick={() => switchTab('products')}
          >
            <span className="admin-nav-icon">📦</span>
            Products &amp; Store
          </button>
          <button
            type="button"
            className={`admin-nav-item ${activeTab === 'orders' ? 'active' : ''}`}
            onClick={() => switchTab('orders')}
          >
            <span className="admin-nav-icon">📋</span>
            Orders &amp; Deliveries
          </button>
          <button
            type="button"
            className={`admin-nav-item ${activeTab === 'blog' ? 'active' : ''}`}
            onClick={() => switchTab('blog')}
          >
            <span className="admin-nav-icon">✍️</span>
            Blog &amp; Archive
          </button>
          <button
            type="button"
            className={`admin-nav-item ${activeTab === 'content' ? 'active' : ''}`}
            onClick={() => switchTab('content')}
          >
            <span className="admin-nav-icon">📝</span>
            Website Content
          </button>
          <a
            href="/?edit=true#home"
            target="_blank"
            rel="noopener noreferrer"
            className="admin-nav-item"
            style={{
              textDecoration: 'none',
              background: 'rgba(255, 98, 0, 0.12)',
              border: '1px solid rgba(255, 98, 0, 0.35)',
              color: '#FF6200',
              fontWeight: 700,
            }}
            title="Open live website in WordPress-style inline editing mode"
          >
            <span className="admin-nav-icon">✏️</span>
            Edit Website Live ↗
          </a>

          <span className="sidebar-section-label">COMMUNICATION</span>
          <button
            type="button"
            className={`admin-nav-item ${activeTab === 'leads' ? 'active' : ''}`}
            onClick={() => switchTab('leads')}
          >
            <span className="admin-nav-icon">👥</span>
            CRM &amp; Leads
          </button>
          <button
            type="button"
            className={`admin-nav-item ${activeTab === 'media' ? 'active' : ''}`}
            onClick={() => switchTab('media')}
          >
            <span className="admin-nav-icon">🖼️</span>
            Media Assets
          </button>

          <span className="sidebar-section-label">TOOLS &amp; SETTINGS</span>
          <button
            type="button"
            className={`admin-nav-item ${activeTab === 'settings' ? 'active' : ''}`}
            onClick={() => switchTab('settings')}
          >
            <span className="admin-nav-icon">⚙️</span>
            Integrations &amp; API
          </button>
        </nav>

        {/* Bottom card style (Upgrade Pro style in reference) */}
        <div className="sidebar-bottom-promo-card">
          <div className="promo-card-icon">👑</div>
          <div className="promo-card-title">Direct Admin Mode</div>
          <p className="promo-card-desc">Super Admin session active with WordPress-style live inline editing.</p>
          <a href="/?edit=true#home" target="_blank" rel="noopener noreferrer" className="promo-card-btn">
            Edit Website Live ↗
          </a>
        </div>
      </aside>

      {/* ── 2. MAIN WORKSPACE ── */}
      <div className="admin-main">
        {/* Top Header */}
        <header className="admin-header">
          <div className="admin-header-left">
            <button
              type="button"
              className="admin-btn-secondary"
              style={{ display: 'none' }} // shown via media query or toggle
              onClick={() => setSidebarOpen(!sidebarOpen)}
            >
              ☰
            </button>
            <div className="dealdeck-header-info">
              <h2 className="dealdeck-header-title">
                {activeTab === 'overview' && 'Sales & Performance Report'}
                {activeTab === 'products' && 'Product Management (E.L.R.x Store)'}
                {activeTab === 'orders' && 'Orders & Digital Product Deliveries'}
                {activeTab === 'blog' && 'Blog & Newsletter Archive'}
                {activeTab === 'media' && 'Media Asset Library'}
                {activeTab === 'content' && 'Website Content & Credentials'}
                {activeTab === 'leads' && 'CRM Leads & Attribution Log'}
                {activeTab === 'settings' && 'System Integrations & API Settings'}
              </h2>
              <span className="dealdeck-header-date">
                {new Date().toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
              </span>
            </div>
          </div>

          <div className="dealdeck-header-actions">
            {/* Search circular button */}
            <button
              type="button"
              className="header-icon-circle-btn"
              title="Search dashboard"
              onClick={() => {
                const q = prompt('Search CMS items (products, posts, leads):');
                if (q) {
                  setProductSearch(q);
                  setPostSearch(q);
                  setLeadSearch(q);
                  showToast(`Searching for "${q}" across dashboard`);
                }
              }}
            >
              🔍
            </button>

            {/* Notification bell button with red badge dot */}
            <button
              type="button"
              className="header-icon-circle-btn"
              title="Notifications & CRM Leads"
              onClick={() => switchTab('leads')}
            >
              🔔
              {metrics?.newLeads > 0 && <span className="notification-badge-dot" />}
            </button>

            {/* Edit Website Live Button (WordPress-style shortcut) */}
            <a
              href="/?edit=true#home"
              target="_blank"
              rel="noopener noreferrer"
              className="admin-btn-primary"
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '6px',
                padding: '7px 14px',
                fontSize: '12px',
                fontWeight: '700',
                textDecoration: 'none',
                borderRadius: '6px',
              }}
              title="Open public website with WordPress-style live editing toolbar"
            >
              <span>✏️</span>
              <span>Edit Website Live ↗</span>
            </a>

            {/* User Profile Pill with Photo Update Option */}
            <div
              className="dealdeck-user-pill"
              onClick={handleOpenProfileModal}
              title="Click to update Profile Photo & Details"
            >
              <div className="dealdeck-user-avatar-wrap">
                <img
                  src={adminProfile.photoUrl || 'assets/author-photo.png'}
                  alt={adminProfile.fullName}
                  className="dealdeck-user-avatar"
                  onError={(e) => { e.currentTarget.src = '/assets/avatar.png'; }}
                />
                <span className="dealdeck-user-camera-badge" title="Change photo">
                  <svg width="8" height="8" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z"></path>
                    <circle cx="12" cy="13" r="4"></circle>
                  </svg>
                </span>
              </div>
              <div className="dealdeck-user-meta">
                <span className="dealdeck-user-name">{adminProfile.fullName}</span>
                <span className="dealdeck-user-role">{adminProfile.role}</span>
              </div>
            </div>
          </div>
        </header>

        {/* Content Body */}
        <div className="admin-content-wrap">
          {/* TAB 1: OVERVIEW (DEALDECK 2-COLUMN STATISTICAL DASHBOARD) */}
          {activeTab === 'overview' && (
            <div className="dealdeck-dashboard-grid">
              {/* Left / Center Column (Wide) */}
              <div className="dealdeck-main-col">
                {/* 4 Metric Cards (2x2 Grid) */}
                <div className="dealdeck-metric-grid-2x2">
                  {/* Card 1: Hero Vibrant Orange Card (Total Sales) */}
                  <div className="dealdeck-metric-card card-hero-orange">
                    <div className="dealdeck-card-top-row">
                      <div className="dealdeck-card-icon-wrap">💳</div>
                      <span className="dealdeck-growth-pill pill-green">0.0%</span>
                    </div>
                    <span className="dealdeck-card-label">Total Estimated Revenue</span>
                    <div className="dealdeck-card-number">
                      ₹{(metrics?.totalRevenue || 0).toLocaleString('en-IN')}
                    </div>
                    <span className="dealdeck-card-subtext">
                      {metrics?.totalOrders || 0} orders processed
                    </span>
                  </div>

                  {/* Card 2: White Card (Total Store Orders) */}
                  <div className="dealdeck-metric-card">
                    <div className="dealdeck-card-top-row">
                      <div className="dealdeck-card-icon-wrap">📋</div>
                      <span className="dealdeck-growth-pill pill-green">0.0%</span>
                    </div>
                    <span className="dealdeck-card-label">Total Store Orders</span>
                    <div className="dealdeck-card-number">
                      {metrics?.totalOrders || 0}
                    </div>
                    <span className="dealdeck-card-subtext">
                      Digital downloads &amp; purchases
                    </span>
                  </div>

                  {/* Card 3: White Card (Visitor Reach) */}
                  <div className="dealdeck-metric-card">
                    <div className="dealdeck-card-top-row">
                      <div className="dealdeck-card-icon-wrap">👤</div>
                      <span className="dealdeck-growth-pill pill-green">0.0%</span>
                    </div>
                    <span className="dealdeck-card-label">Visitor Reach</span>
                    <div className="dealdeck-card-number">
                      {metrics?.totalLeads || 0}
                    </div>
                    <span className="dealdeck-card-subtext">
                      Verified inquiries &amp; subscribers
                    </span>
                  </div>

                  {/* Card 4: White Card (Total Sold Products) */}
                  <div className="dealdeck-metric-card">
                    <div className="dealdeck-card-top-row">
                      <div className="dealdeck-card-icon-wrap">📦</div>
                      <span className="dealdeck-growth-pill pill-green">0.0%</span>
                    </div>
                    <span className="dealdeck-card-label">Total Sold Products</span>
                    <div className="dealdeck-card-number">
                      {metrics?.totalSold || 0}
                    </div>
                    <span className="dealdeck-card-subtext">
                      {productsList.length} products listed in store
                    </span>
                  </div>
                </div>

                {/* Customer Habits Dual-Pill Bar Chart with Tooltip */}
                <CustomerHabitsBarChart monthlyHabits={metrics?.monthlyHabits} />

                {/* Quick Actions Bar */}
                <div className="admin-quick-actions" style={{ marginTop: '1.5rem', marginBottom: '1.5rem' }}>
                  <button
                    type="button"
                    className="admin-btn-primary"
                    style={{ width: 'auto', padding: '0.65rem 1.25rem', borderRadius: '12px' }}
                    onClick={() => {
                      setEditingProduct({
                        title: '',
                        name: '',
                        slug: '',
                        category: 'Book',
                        format: 'PDF (Digital Download)',
                        price_inr: 499,
                        price_usd: 19,
                        is_free: false,
                        product_type: 'digital_download',
                        external_url: '',
                        tagline: '',
                        short_description: '',
                        full_description: '',
                        stock_status: 'in_stock',
                        status: 'published',
                        cover_image_url: '',
                        file_url: null,
                      });
                      setIsProductModalOpen(true);
                    }}
                  >
                    + Add New Product
                  </button>
                  <button
                    type="button"
                    className="admin-btn-yellow"
                    style={{ borderRadius: '12px' }}
                    onClick={() => {
                      setEditingPost({
                        title: '',
                        slug: '',
                        category: categoriesList[0] || 'Framework',
                        published_date: 'November 2026',
                        date: 'November 2026',
                        read_time: '4 min read',
                        readTime: '4 min read',
                        summary: '',
                        excerpt: '',
                        content: '',
                        thumbnail_url: '',
                        thumbnail: '',
                        video_url: '',
                        videoUrl: '',
                        video_storage_id: '',
                        video_storage_ref: '',
                        status: 'published',
                        featured: false,
                        featured_order: 1,
                        seo_title: '',
                        seo_description: '',
                        slugModified: false,
                      });
                      setIsPostModalOpen(true);
                    }}
                  >
                    + Write Article / Newsletter
                  </button>
                  <button
                    type="button"
                    className="admin-btn-secondary"
                    style={{ borderRadius: '12px' }}
                    onClick={() => switchTab('leads')}
                  >
                    View CRM Leads ({metrics?.newLeads || 0})
                  </button>
                  <button
                    type="button"
                    className="admin-btn-secondary"
                    style={{ borderRadius: '12px' }}
                    onClick={() => switchTab('media')}
                  >
                    Upload Media Asset
                  </button>
                </div>

                {/* Recent System Activity Table */}
                <div className="stat-card" style={{ padding: '1.5rem' }}>
                  <div className="stat-card-header" style={{ marginBottom: '1rem' }}>
                    <div>
                      <h3 className="stat-card-title">Recent System Activity</h3>
                      <p className="stat-card-subtitle">Real-time audit log of store &amp; CMS updates</p>
                    </div>
                    <button
                      type="button"
                      className="admin-btn-secondary"
                      style={{ borderRadius: '9999px', fontSize: '0.78rem', padding: '0.35rem 0.85rem' }}
                      onClick={refreshAllData}
                    >
                      ↻ Refresh
                    </button>
                  </div>
                  <div className="admin-table-responsive">
                    <table className="admin-table">
                      <thead>
                        <tr>
                          <th>Event Type</th>
                          <th>Description</th>
                          <th>Timestamp</th>
                        </tr>
                      </thead>
                      <tbody>
                        {metrics?.recentActivity && metrics.recentActivity.length > 0 ? (
                          metrics.recentActivity.map((act, i) => (
                            <tr key={i}>
                              <td>
                                <span className="admin-badge admin-badge-paid">{act.type}</span>
                              </td>
                              <td style={{ fontWeight: 600 }}>{act.title}</td>
                              <td style={{ color: 'var(--admin-text-muted)', fontSize: '0.8rem' }}>
                                {new Date(act.time).toLocaleString()}
                              </td>
                            </tr>
                          ))
                        ) : (
                          <tr>
                            <td colSpan={3} style={{ textAlign: 'center', padding: '2rem', color: 'var(--admin-text-muted)' }}>
                              No recent activity recorded yet.
                            </td>
                          </tr>
                        )}

                                </tbody>
                    </table>
                  </div>
                </div>
              </div>

              {/* Right Column (Narrower - Statistical Visuals) */}
              <div className="dealdeck-side-col">
                {/* Product Statistic Multi-Ring Radial Gauge */}
                <ProductStatisticRadialGauge
                  categoryStats={metrics?.categoryStats}
                  totalSold={metrics?.totalSold}
                />

                {/* Customer Growth Overlapping Bubbles & Country List */}
                <CustomerGrowthBubbles
                  locationBreakdown={metrics?.locationBreakdown}
                  totalVisitorsTracked={metrics?.totalVisitorsTracked}
                />
              </div>
            </div>
          )}

          {/* TAB: ORDERS & DIGITAL PRODUCT DELIVERIES */}
          {activeTab === 'orders' && (() => {
            // Safe resilient calculations across cache and live DB field names
            const totalOrdersCount = ordersList.length;

            const paidOrders = ordersList.filter((o) => {
              const pStatus = (o.payment_status || o.status || '').toLowerCase();
              return pStatus === 'paid' || pStatus === 'completed' || pStatus === 'free' || o.is_free || o.product_type === 'FREE';
            });

            const totalRevenue = ordersList
              .filter((o) => {
                const pStatus = (o.payment_status || o.status || '').toLowerCase();
                const isPaid = pStatus === 'paid' || pStatus === 'completed';
                const isFree = o.is_free || o.product_type === 'FREE' || Number(o.amount !== undefined ? o.amount : o.product_price) === 0;
                return isPaid && !isFree;
              })
              .reduce((sum, o) => {
                const val = Number(o.amount !== undefined && o.amount !== null ? o.amount : o.product_price) || 0;
                return sum + val;
              }, 0);

            const deliveredOrders = ordersList.filter((o) => {
              const dStatus = (o.delivery_status || '').toLowerCase();
              return dStatus === 'delivered' || dStatus === 'sent' || dStatus === 'provider_accepted';
            });
            const deliveryPercent = totalOrdersCount > 0 ? Math.round((deliveredOrders.length / totalOrdersCount) * 100) : 100;

            const freeOrders = ordersList.filter((o) => {
              return o.is_free || o.product_type === 'FREE' || Number(o.amount !== undefined ? o.amount : o.product_price || 0) === 0;
            });
            const paidOrdersCount = totalOrdersCount - freeOrders.length;
            const paidPercent = totalOrdersCount > 0 ? Math.round((paidOrdersCount / totalOrdersCount) * 100) : 0;

            const pendingOrders = ordersList.filter((o) => {
              const dStatus = (o.delivery_status || '').toLowerCase();
              const pStatus = (o.payment_status || o.status || '').toLowerCase();
              return dStatus === 'pending' || dStatus === 'not_started' || pStatus === 'pending';
            });

            // Filter logic
            const filteredOrders = ordersList.filter((o) => {
              const q = orderSearch.toLowerCase().trim();
              const effectiveAmount = o.amount !== undefined ? o.amount : o.product_price;
              const matchesSearch =
                !q ||
                (o.id || '').toLowerCase().includes(q) ||
                (o.customer_name || '').toLowerCase().includes(q) ||
                (o.customer_email || '').toLowerCase().includes(q) ||
                (o.product_name || '').toLowerCase().includes(q) ||
                (o.payment_id || o.gateway_payment_reference || '').toLowerCase().includes(q) ||
                (o.payment_method || o.payment_gateway || '').toLowerCase().includes(q);

              let matchesFilter = true;
              const pStatus = (o.payment_status || o.status || '').toLowerCase();
              const dStatus = (o.delivery_status || '').toLowerCase();
              const isFree = o.is_free || o.product_type === 'FREE' || Number(effectiveAmount || 0) === 0;

              if (orderStatusFilter === 'paid') {
                matchesFilter = (pStatus === 'paid' || pStatus === 'completed') && !isFree;
              } else if (orderStatusFilter === 'delivered') {
                matchesFilter = dStatus === 'delivered' || dStatus === 'sent' || dStatus === 'provider_accepted';
              } else if (orderStatusFilter === 'pending') {
                matchesFilter = dStatus === 'pending' || dStatus === 'not_started' || pStatus === 'pending';
              } else if (orderStatusFilter === 'free') {
                matchesFilter = isFree;
              }
              return matchesSearch && matchesFilter;
            });

            const formatOrderDate = (isoString) => {
              if (!isoString) return { date: 'Recent', time: '' };
              try {
                const d = new Date(isoString);
                if (isNaN(d.getTime())) return { date: 'Recent', time: '' };
                const date = d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
                const time = d.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', hour12: true });
                return { date, time };
              } catch {
                return { date: 'Recent', time: '' };
              }
            };

            const handleCopyOrderId = (id) => {
              if (typeof navigator !== 'undefined' && navigator.clipboard) {
                navigator.clipboard.writeText(id).catch(() => {});
              }
              setCopiedOrderId(id);
              showToast(`✓ Copied order ID: ${id}`);
              setTimeout(() => setCopiedOrderId(null), 2000);
            };

            const handleExportCSV = () => {
              if (ordersList.length === 0) {
                showToast('No orders to export', 'error');
                return;
              }
              const headers = [
                'Order ID',
                'Customer Name',
                'Customer Email',
                'Product Name',
                'Amount',
                'Currency',
                'Payment Method',
                'Payment ID',
                'Payment Status',
                'Delivery Status',
                'Date',
                'Region',
                'UTM Source',
              ];
              const rows = ordersList.map((o) => {
                const effAmount = o.amount !== undefined ? o.amount : (o.product_price || 0);
                const effPaymentMethod = o.payment_method || o.payment_gateway || (Number(effAmount) === 0 ? 'Free' : 'Razorpay');
                const effPaymentId = o.payment_id || o.gateway_payment_reference || 'n/a';
                return [
                  `"${o.id}"`,
                  `"${o.customer_name || ''}"`,
                  `"${o.customer_email || ''}"`,
                  `"${o.product_name || ''}"`,
                  effAmount,
                  `"${o.currency || 'INR'}"`,
                  `"${effPaymentMethod}"`,
                  `"${effPaymentId}"`,
                  `"${o.payment_status || o.status || 'paid'}"`,
                  `"${o.delivery_status || 'delivered'}"`,
                  `"${o.created_at || ''}"`,
                  `"${o.region || 'India'}"`,
                  `"${o.utm_source || 'direct'}"`,
                ];
              });
              const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows.map((r) => r.join(','))].join('\n');
              const encodedUri = encodeURI(csvContent);
              const link = document.createElement('a');
              link.setAttribute('href', encodedUri);
              link.setAttribute('download', `elrx_store_orders_${new Date().toISOString().slice(0, 10)}.csv`);
              document.body.appendChild(link);
              link.click();
              document.body.removeChild(link);
              showToast(`✓ Exported ${ordersList.length} orders to CSV`);
            };

            const handleTriggerResend = async (o) => {
              setIsResendingEmailId(o.id);
              try {
                showToast(`Dispatching deliverable to ${o.customer_email}...`);
                const apiRes = await fetch('/api/orders', {
                  method: 'POST',
                  headers: { 'Content-Type': 'application/json' },
                  body: JSON.stringify({ action: 'retry_delivery', orderId: o.id }),
                });
                const resData = await apiRes.json().catch(() => ({}));
                if (apiRes.ok && resData.success) {
                  await updateOrder(o.id, {
                    delivery_status: resData.deliveryStatus || 'PROVIDER_ACCEPTED',
                    email_status: resData.deliveryStatus || 'PROVIDER_ACCEPTED',
                    delivery_provider: resData.provider,
                    delivery_message_id: resData.messageId,
                  });
                  showToast(`✓ Deliverable email accepted by provider for ${o.customer_email}!`);
                } else {
                  await sendProductDeliveryEmail({
                    orderId: o.id,
                    customerName: o.customer_name,
                    customerEmail: o.customer_email,
                    product: {
                      name: o.product_name,
                      fileUrl: o.pdf_url,
                    },
                    paymentId: o.payment_id || o.gateway_payment_reference,
                    amount: o.amount !== undefined ? o.amount : o.product_price,
                    currency: o.currency || 'INR',
                  });
                  await updateOrder(o.id, { delivery_status: 'DELIVERED', email_status: 'DELIVERED' });
                  showToast(`✓ Delivery email sent to ${o.customer_email}!`);
                }
                refreshAllData();
              } catch (err) {
                showToast(`Failed sending email: ${err.message}`, 'error');
              } finally {
                setIsResendingEmailId(null);
              }
            };

            return (
              <div className="dealdeck-tab-container orders-dashboard-wrap">
                {/* 1. Improved Top 4 Summary Cards */}
                <div className="orders-summary-grid">
                  {/* Card 1: Total Store Orders */}
                  <div className="orders-stat-card featured-card">
                    <div className="orders-stat-top">
                      <div className="orders-stat-icon-wrap" style={{ background: '#FFF7ED', borderColor: '#FFEDD5', color: '#EA580C' }}>
                        📋
                      </div>
                      <span className="orders-stat-badge orange">Real-Time</span>
                    </div>
                    <span className="orders-stat-label">Total Store Orders</span>
                    <div className="orders-stat-number">{totalOrdersCount}</div>
                    <span className="orders-stat-subtext">
                      {paidOrders.length} completed checkouts
                    </span>
                  </div>

                  {/* Card 2: Total Revenue */}
                  <div className="orders-stat-card">
                    <div className="orders-stat-top">
                      <div className="orders-stat-icon-wrap" style={{ background: '#ECFDF5', borderColor: '#A7F3D0', color: '#059669' }}>
                        💰
                      </div>
                      <span className="orders-stat-badge green">Gross</span>
                    </div>
                    <span className="orders-stat-label">Total Revenue</span>
                    <div className="orders-stat-number">
                      ₹{totalRevenue.toLocaleString('en-IN')}
                    </div>
                    <span className="orders-stat-subtext">Razorpay, PayPal &amp; UPI</span>
                  </div>

                  {/* Card 3: PDF Deliveries Sent */}
                  <div className="orders-stat-card">
                    <div className="orders-stat-top">
                      <div className="orders-stat-icon-wrap" style={{ background: '#EFF6FF', borderColor: '#BFDBFE', color: '#2563EB' }}>
                        ✉️
                      </div>
                      <span className="orders-stat-badge blue">{deliveryPercent}% Sent</span>
                    </div>
                    <span className="orders-stat-label">PDF Deliveries Sent</span>
                    <div className="orders-stat-number">
                      {deliveredOrders.length} / {totalOrdersCount}
                    </div>
                    <span className="orders-stat-subtext">Transactional emails &amp; links</span>
                  </div>

                  {/* Card 4: Free vs Paid Breakdown */}
                  <div className="orders-stat-card">
                    <div className="orders-stat-top">
                      <div className="orders-stat-icon-wrap" style={{ background: '#FAF5FF', borderColor: '#E9D5FF', color: '#7E22CE' }}>
                        🎁
                      </div>
                      <span className="orders-stat-badge purple">{paidPercent}% Paid</span>
                    </div>
                    <span className="orders-stat-label">Free vs Paid Breakdown</span>
                    <div className="orders-stat-number" style={{ fontSize: '1.45rem', whiteSpace: 'nowrap' }}>
                      {freeOrders.length} Free · {paidOrdersCount} Paid
                    </div>
                    <span className="orders-stat-subtext">Customer conversion balance</span>
                  </div>
                </div>

                {/* 2. Search & Filters Toolbar */}
                <div className="orders-toolbar-card">
                  <div className="orders-toolbar-left">
                    <div className="orders-search-box">
                      <span className="orders-search-icon">🔍</span>
                      <input
                        type="text"
                        className="orders-search-input"
                        placeholder="Search orders by ID, customer name, email, product, or transaction..."
                        value={orderSearch}
                        onChange={(e) => setOrderSearch(e.target.value)}
                      />
                      {orderSearch && (
                        <button
                          type="button"
                          className="orders-search-clear"
                          onClick={() => setOrderSearch('')}
                          title="Clear search"
                        >
                          ✕
                        </button>
                      )}
                    </div>

                    <div className="orders-filter-segmented">
                      {[
                        { id: 'all', label: 'All Orders', count: totalOrdersCount },
                        { id: 'paid', label: 'Paid', count: paidOrdersCount },
                        { id: 'delivered', label: 'Delivered', count: deliveredOrders.length },
                        { id: 'pending', label: 'Pending', count: pendingOrders.length },
                        { id: 'free', label: 'Free Downloads', count: freeOrders.length },
                      ].map((f) => (
                        <button
                          key={f.id}
                          type="button"
                          className={`orders-filter-btn ${orderStatusFilter === f.id ? 'active' : ''}`}
                          onClick={() => setOrderStatusFilter(f.id)}
                        >
                          <span>{f.label}</span>
                          <span className="orders-filter-count-badge">{f.count}</span>
                        </button>
                      ))}
                    </div>
                  </div>

                  <div className="orders-toolbar-right">
                    <button
                      type="button"
                      className="admin-btn-secondary orders-btn-tool"
                      onClick={handleExportCSV}
                      title="Download orders as CSV file"
                    >
                      📥 Export CSV
                    </button>
                    <button
                      type="button"
                      className="admin-btn-secondary orders-btn-tool"
                      onClick={refreshAllData}
                      title="Reload real-time orders from database"
                    >
                      ↻ Refresh
                    </button>
                  </div>
                </div>

                {/* 3. Orders Table & Mobile Responsive View */}
                <div className="dealdeck-table-container orders-table-card">
                  {/* Desktop / Tablet Table */}
                  <div className="admin-table-responsive orders-table-responsive">
                    <table className="admin-table orders-table">
                      <thead>
                        <tr>
                          <th style={{ width: '160px' }}>Order ID</th>
                          <th style={{ minWidth: '200px' }}>Customer</th>
                          <th style={{ minWidth: '230px' }}>Product &amp; PDF</th>
                          <th style={{ width: '110px' }}>Amount</th>
                          <th style={{ width: '150px' }}>Payment Provider &amp; ID</th>
                          <th style={{ width: '120px' }}>Payment Status</th>
                          <th style={{ width: '130px' }}>Delivery Status</th>
                          <th style={{ width: '130px' }}>Date &amp; Time</th>
                          <th style={{ width: '190px', textAlign: 'right' }}>Actions</th>
                        </tr>
                      </thead>
                      <tbody>
                        {filteredOrders.map((o) => {
                          const effAmount = o.amount !== undefined ? o.amount : o.product_price;
                          const isFreeOrder = o.is_free || o.product_type === 'FREE' || Number(effAmount || 0) === 0;
                          const effectivePdf = o.pdf_url;
                          const dStatus = (o.delivery_status || 'delivered').toLowerCase();
                          const isDelivered = dStatus === 'delivered' || dStatus === 'sent' || dStatus === 'provider_accepted';
                          const isDeliveryFailed = dStatus === 'failed';
                          const pStatus = (o.payment_status || o.status || 'paid').toLowerCase();
                          const isPaid = pStatus === 'paid' || pStatus === 'completed' || isFreeOrder;
                          const { date, time } = formatOrderDate(o.created_at);
                          const paymentGatewayName = o.payment_method || o.payment_gateway || (isFreeOrder ? 'Free Access' : 'Razorpay');
                          const paymentRefId = o.payment_id || o.gateway_payment_reference || 'n/a';
                          const customerInitials = (o.customer_name || o.customer_email || 'C').charAt(0).toUpperCase();

                          return (
                            <tr key={o.id}>
                              {/* Order ID */}
                              <td className="col-order-id">
                                <button
                                  type="button"
                                  className="order-id-badge"
                                  onClick={() => handleCopyOrderId(o.id)}
                                  title="Click to copy Order ID"
                                >
                                  <span>{copiedOrderId === o.id ? '✓ Copied' : o.id}</span>
                                  <span style={{ fontSize: '0.68rem', opacity: 0.6 }}>📋</span>
                                </button>
                              </td>

                              {/* Customer */}
                              <td className="col-customer">
                                <div className="customer-cell-wrap">
                                  <div className="customer-avatar">
                                    {customerInitials}
                                  </div>
                                  <div>
                                    <div className="customer-name">
                                      {o.customer_name || 'Store Customer'}
                                    </div>
                                    <div className="customer-email" title={o.customer_email}>
                                      {o.customer_email}
                                    </div>
                                  </div>
                                </div>
                              </td>

                              {/* Product & PDF */}
                              <td className="col-product">
                                <div className="product-title">{o.product_name || 'E.L.R.x Protocol'}</div>
                                {effectivePdf ? (
                                  <a
                                    href={effectivePdf}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="product-pdf-link"
                                    title="Open PDF deliverable in new tab"
                                  >
                                    📄 PDF Deliverable ↗
                                  </a>
                                ) : (
                                  <span style={{ fontSize: '0.72rem', color: '#9CA3AF' }}>No PDF attached</span>
                                )}
                              </td>

                              {/* Amount */}
                              <td className="col-amount">
                                {isFreeOrder ? (
                                  <span className="amount-free-pill">Free</span>
                                ) : (
                                  <div className="amount-paid-text">
                                    ₹{Number(effAmount).toLocaleString('en-IN')}
                                    <span className="amount-currency">{o.currency || 'INR'}</span>
                                  </div>
                                )}
                              </td>

                              {/* Payment Provider & ID */}
                              <td className="col-payment-provider">
                                <div className="provider-name">{paymentGatewayName}</div>
                                <div className="provider-ref-id" title={paymentRefId}>
                                  {paymentRefId}
                                </div>
                              </td>

                              {/* Payment Status */}
                              <td>
                                <span className={`order-status-badge ${isPaid ? (isFreeOrder ? 'delivered' : 'paid') : (pStatus === 'failed' ? 'failed' : 'pending')}`}>
                                  <span className="status-dot"></span>
                                  {isPaid ? (isFreeOrder ? '✓ Free' : '✓ Paid') : (o.payment_status || 'Pending')}
                                </span>
                              </td>

                              {/* Delivery Status */}
                              <td>
                                <span className={`order-status-badge ${isDelivered ? 'delivered' : (isDeliveryFailed ? 'failed' : 'pending')}`}>
                                  <span className="status-dot"></span>
                                  {isDelivered ? '✓ Delivered' : (isDeliveryFailed ? '✕ Failed' : '⏳ In Queue')}
                                </span>
                              </td>

                              {/* Date & Time */}
                              <td className="col-date-time">
                                <div className="date-primary">{date}</div>
                                {time && <div className="date-secondary">{time}</div>}
                              </td>

                              {/* Actions */}
                              <td className="order-actions-cell" style={{ textAlign: 'right' }}>
                                <div className="order-actions-wrap" style={{ justifyContent: 'flex-end' }}>
                                  <button
                                    type="button"
                                    className="admin-btn-secondary order-btn-action resend"
                                    disabled={isResendingEmailId === o.id}
                                    title={`Resend delivery email to ${o.customer_email}`}
                                    onClick={() => handleTriggerResend(o)}
                                  >
                                    ✉️ {isResendingEmailId === o.id ? 'Sending...' : 'Resend Email'}
                                  </button>
                                  <button
                                    type="button"
                                    className="admin-btn-secondary order-btn-action details"
                                    onClick={() => setSelectedOrderDetails(o)}
                                    title="View order audit details"
                                  >
                                    🔍 Details
                                  </button>
                                  <button
                                    type="button"
                                    className="dealdeck-product-btn-del order-btn-action delete"
                                    title="Delete order record"
                                    onClick={() => setOrderToDelete(o)}
                                  >
                                    🗑️
                                  </button>
                                </div>
                              </td>
                            </tr>
                          );
                        })}

                        {filteredOrders.length === 0 && (
                          <tr>
                            <td colSpan={9} style={{ textAlign: 'center', padding: '3.5rem 1.5rem', color: '#6B7280' }}>
                              <div style={{ fontSize: '2.5rem', marginBottom: '0.75rem' }}>📦</div>
                              <div style={{ fontWeight: 700, fontSize: '1rem', color: '#111827', marginBottom: '0.25rem' }}>
                                {orderSearch ? 'No matching orders found' : 'No store orders found yet'}
                              </div>
                              <div style={{ fontSize: '0.82rem', color: '#9CA3AF', maxWidth: '380px', margin: '0 auto' }}>
                                {orderSearch
                                  ? `Try adjusting your search query "${orderSearch}" or clear filters.`
                                  : 'Digital product purchases and free PDF downloads will appear here in real-time.'}
                              </div>
                            </td>
                          </tr>
                        )}
                      </tbody>
                    </table>
                  </div>

                  {/* Mobile / Narrow Tablet Card View */}
                  <div className="orders-mobile-cards-grid">
                    {filteredOrders.map((o) => {
                      const effAmount = o.amount !== undefined ? o.amount : o.product_price;
                      const isFreeOrder = o.is_free || o.product_type === 'FREE' || Number(effAmount || 0) === 0;
                      const effectivePdf = o.pdf_url;
                      const dStatus = (o.delivery_status || 'delivered').toLowerCase();
                      const isDelivered = dStatus === 'delivered' || dStatus === 'sent' || dStatus === 'provider_accepted';
                      const isDeliveryFailed = dStatus === 'failed';
                      const pStatus = (o.payment_status || o.status || 'paid').toLowerCase();
                      const isPaid = pStatus === 'paid' || pStatus === 'completed' || isFreeOrder;
                      const { date, time } = formatOrderDate(o.created_at);
                      const paymentGatewayName = o.payment_method || o.payment_gateway || (isFreeOrder ? 'Free Access' : 'Razorpay');
                      const paymentRefId = o.payment_id || o.gateway_payment_reference || 'n/a';

                      return (
                        <div key={`m_${o.id}`} className="order-mobile-card">
                          <div className="order-mobile-header">
                            <div>
                              <button
                                type="button"
                                className="order-id-badge"
                                onClick={() => handleCopyOrderId(o.id)}
                              >
                                {o.id}
                              </button>
                              <div style={{ fontSize: '0.72rem', color: '#9CA3AF', marginTop: '3px' }}>
                                {date} {time ? `· ${time}` : ''}
                              </div>
                            </div>
                            <div style={{ display: 'flex', gap: '4px', flexWrap: 'wrap' }}>
                              <span className={`order-status-badge ${isPaid ? (isFreeOrder ? 'delivered' : 'paid') : 'pending'}`}>
                                <span className="status-dot"></span>
                                {isPaid ? (isFreeOrder ? 'Free' : 'Paid') : 'Pending'}
                              </span>
                              <span className={`order-status-badge ${isDelivered ? 'delivered' : (isDeliveryFailed ? 'failed' : 'pending')}`}>
                                <span className="status-dot"></span>
                                {isDelivered ? 'Delivered' : 'Queue'}
                              </span>
                            </div>
                          </div>

                          <div className="order-mobile-body">
                            <div>
                              <div style={{ fontWeight: 700, fontSize: '0.92rem', color: '#111827' }}>
                                {o.customer_name || 'Store Customer'}
                              </div>
                              <div style={{ fontSize: '0.78rem', color: '#6B7280' }}>
                                {o.customer_email}
                              </div>
                            </div>

                            <div style={{ background: '#F9FAFB', padding: '0.65rem 0.85rem', borderRadius: '8px', border: '1px solid #F3F4F6' }}>
                              <div style={{ fontWeight: 600, fontSize: '0.84rem', color: '#1F2937', marginBottom: '4px' }}>
                                {o.product_name || 'E.L.R.x Protocol'}
                              </div>
                              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '0.5rem' }}>
                                <div style={{ fontWeight: 800, fontSize: '0.88rem' }}>
                                  {isFreeOrder ? <span style={{ color: '#15803D' }}>Free</span> : `₹${Number(effAmount).toLocaleString('en-IN')} ${o.currency || 'INR'}`}
                                </div>
                                {effectivePdf && (
                                  <a
                                    href={effectivePdf}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="product-pdf-link"
                                  >
                                    📄 PDF ↗
                                  </a>
                                )}
                              </div>
                            </div>

                            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.74rem', color: '#6B7280' }}>
                              <span>Gateway: <strong style={{ textTransform: 'capitalize' }}>{paymentGatewayName}</strong></span>
                              <span style={{ fontFamily: 'monospace' }}>{paymentRefId.slice(0, 16)}</span>
                            </div>
                          </div>

                          <div className="order-mobile-actions">
                            <button
                              type="button"
                              className="admin-btn-secondary order-btn-action resend"
                              disabled={isResendingEmailId === o.id}
                              onClick={() => handleTriggerResend(o)}
                            >
                              ✉️ {isResendingEmailId === o.id ? 'Sending...' : 'Resend Email'}
                            </button>
                            <button
                              type="button"
                              className="admin-btn-secondary order-btn-action details"
                              onClick={() => setSelectedOrderDetails(o)}
                            >
                              🔍 Details
                            </button>
                            <button
                              type="button"
                              className="dealdeck-product-btn-del order-btn-action delete"
                              onClick={() => setOrderToDelete(o)}
                            >
                              🗑️
                            </button>
                          </div>
                        </div>
                      );
                    })}

                    {filteredOrders.length === 0 && (
                      <div style={{ textAlign: 'center', padding: '2.5rem 1rem', color: '#6B7280' }}>
                        No orders matching current filter.
                      </div>
                    )}
                  </div>
                </div>
              </div>
            );
          })()}

          {/* ORDER DETAIL AUDIT MODAL */}
          {selectedOrderDetails && (
            <div
              className="admin-modal-backdrop"
              onClick={() => setSelectedOrderDetails(null)}
              style={{
                position: 'fixed',
                inset: 0,
                background: 'rgba(0,0,0,0.6)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                zIndex: 9999,
                padding: '1rem',
              }}
            >
              <div
                className="admin-modal-box"
                style={{
                  background: '#FFFFFF',
                  borderRadius: '16px',
                  width: '100%',
                  maxWidth: '680px',
                  border: '1px solid #E5E7EB',
                  boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)',
                  overflow: 'hidden',
                  animation: 'adminCardEnter 0.25s cubic-bezier(0.16, 1, 0.3, 1)',
                }}
                onClick={(e) => e.stopPropagation()}
              >
                <div
                  style={{
                    background: '#121417',
                    padding: '1.25rem 1.5rem',
                    color: '#FFFFFF',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                  }}
                >
                  <div>
                    <span style={{ fontSize: '0.72rem', background: '#FF6200', color: '#FFF', padding: '2px 6px', borderRadius: '3px', fontWeight: 800, textTransform: 'uppercase' }}>
                      Order Audit
                    </span>
                    <h3 style={{ margin: '4px 0 0 0', fontSize: '1.2rem', fontFamily: 'monospace' }}>
                      {selectedOrderDetails.id}
                    </h3>
                  </div>
                  <button
                    type="button"
                    style={{ background: 'transparent', border: 0, color: '#FFFFFF', fontSize: '1.25rem', cursor: 'pointer' }}
                    onClick={() => setSelectedOrderDetails(null)}
                  >
                    ✕
                  </button>
                </div>

                <div style={{ padding: '1.5rem', maxHeight: '70vh', overflowY: 'auto' }}>
                  {/* Grid details */}
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '1.25rem', marginBottom: '1.5rem' }}>
                    <div style={{ background: '#F9FAFB', padding: '1rem', borderRadius: '6px', border: '1px solid #E5E7EB' }}>
                      <div style={{ fontSize: '0.74rem', textTransform: 'uppercase', color: '#6B7280', fontWeight: 700, marginBottom: '4px' }}>
                        Customer Information
                      </div>
                      <div style={{ fontWeight: 800, fontSize: '1rem', color: '#111827' }}>
                        {selectedOrderDetails.customer_name || 'Store Customer'}
                      </div>
                      <div style={{ fontSize: '0.86rem', color: '#4B5563', marginTop: '2px' }}>
                        {selectedOrderDetails.customer_email}
                      </div>
                      <div style={{ fontSize: '0.76rem', color: '#9CA3AF', marginTop: '4px' }}>
                        Region: {selectedOrderDetails.region || 'India'}
                      </div>
                    </div>

                    <div style={{ background: '#F9FAFB', padding: '1rem', borderRadius: '6px', border: '1px solid #E5E7EB' }}>
                      <div style={{ fontSize: '0.74rem', textTransform: 'uppercase', color: '#6B7280', fontWeight: 700, marginBottom: '4px' }}>
                        Product Purchased
                      </div>
                      <div style={{ fontWeight: 800, fontSize: '1rem', color: '#111827' }}>
                        {selectedOrderDetails.product_name}
                      </div>
                      <div style={{ fontSize: '0.86rem', fontWeight: 700, color: selectedOrderDetails.is_free || Number(selectedOrderDetails.amount !== undefined ? selectedOrderDetails.amount : selectedOrderDetails.product_price) === 0 ? '#10B981' : '#FF6200', marginTop: '2px' }}>
                        {selectedOrderDetails.is_free || Number(selectedOrderDetails.amount !== undefined ? selectedOrderDetails.amount : selectedOrderDetails.product_price) === 0 ? 'Free Download' : `₹${Number(selectedOrderDetails.amount !== undefined ? selectedOrderDetails.amount : selectedOrderDetails.product_price)} ${selectedOrderDetails.currency || 'INR'}`}
                      </div>
                      {selectedOrderDetails.pdf_url && (
                        <div style={{ marginTop: '6px' }}>
                          <a
                            href={selectedOrderDetails.pdf_url}
                            target="_blank"
                            rel="noopener noreferrer"
                            style={{ fontSize: '0.78rem', color: '#FF6200', textDecoration: 'none', fontWeight: 700 }}
                          >
                            📄 View Attached PDF Deliverable &rarr;
                          </a>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Payment & Gateway Verification */}
                  <div style={{ border: '1px solid #E5E7EB', borderRadius: '6px', padding: '1rem', marginBottom: '1.25rem' }}>
                    <div style={{ fontSize: '0.74rem', textTransform: 'uppercase', color: '#6B7280', fontWeight: 700, marginBottom: '8px' }}>
                      Payment &amp; Transaction Details
                    </div>
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '0.75rem', fontSize: '0.85rem' }}>
                      <div>
                        <div style={{ color: '#9CA3AF', fontSize: '0.72rem' }}>Payment Gateway:</div>
                        <div style={{ fontWeight: 700, textTransform: 'capitalize' }}>{selectedOrderDetails.payment_method || 'Razorpay'}</div>
                      </div>
                      <div>
                        <div style={{ color: '#9CA3AF', fontSize: '0.72rem' }}>Payment Reference:</div>
                        <div style={{ fontFamily: 'monospace', fontSize: '0.78rem' }}>{selectedOrderDetails.payment_id || 'n/a'}</div>
                      </div>
                      <div>
                        <div style={{ color: '#9CA3AF', fontSize: '0.72rem' }}>Verification Status:</div>
                        <div>
                          <span
                            style={{
                              display: 'inline-block',
                              padding: '2px 8px',
                              borderRadius: '4px',
                              fontSize: '0.72rem',
                              fontWeight: 800,
                              background:
                                selectedOrderDetails.payment_status === 'paid' || selectedOrderDetails.status === 'completed'
                                  ? '#DCFCE7'
                                  : '#FEF3C7',
                              color:
                                selectedOrderDetails.payment_status === 'paid' || selectedOrderDetails.status === 'completed'
                                  ? '#15803D'
                                  : '#B45309',
                            }}
                          >
                            {selectedOrderDetails.payment_status === 'paid' || selectedOrderDetails.status === 'completed'
                              ? '✓ Verified Paid'
                              : (selectedOrderDetails.payment_status || 'Pending')}
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Delivery Status & Diagnostics */}
                  <div style={{ border: '1px solid #E5E7EB', borderRadius: '6px', padding: '1rem', marginBottom: '1.25rem' }}>
                    <div style={{ fontSize: '0.74rem', textTransform: 'uppercase', color: '#6B7280', fontWeight: 700, marginBottom: '8px' }}>
                      Email &amp; Delivery Tracking
                    </div>
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '0.75rem', fontSize: '0.85rem' }}>
                      <div>
                        <div style={{ color: '#9CA3AF', fontSize: '0.72rem' }}>Delivery Status:</div>
                        <div style={{ fontWeight: 700, color: '#10B981' }}>{selectedOrderDetails.delivery_status || 'Delivered'}</div>
                      </div>
                      <div>
                        <div style={{ color: '#9CA3AF', fontSize: '0.72rem' }}>Created Timestamp:</div>
                        <div style={{ fontSize: '0.78rem' }}>{selectedOrderDetails.created_at ? new Date(selectedOrderDetails.created_at).toLocaleString() : 'N/A'}</div>
                      </div>
                      <div>
                        <div style={{ color: '#9CA3AF', fontSize: '0.72rem' }}>Delivery Attempts:</div>
                        <div style={{ fontWeight: 700 }}>{selectedOrderDetails.delivery_attempt_count || 1}</div>
                      </div>
                    </div>
                    {selectedOrderDetails.delivery_message_id && (
                      <div style={{ marginTop: '0.5rem', fontSize: '0.76rem', color: '#6B7280' }}>
                        <strong>Provider Message ID:</strong> <code style={{ background: '#F3F4F6', padding: '1px 5px', borderRadius: '3px' }}>{selectedOrderDetails.delivery_message_id}</code>
                      </div>
                    )}
                    {selectedOrderDetails.delivery_error && (
                      <div style={{ marginTop: '0.75rem', background: '#FEE2E2', color: '#991B1B', padding: '0.5rem', borderRadius: '4px', fontSize: '0.78rem' }}>
                        <strong>Error Log:</strong> {selectedOrderDetails.delivery_error}
                      </div>
                    )}
                    {Array.isArray(selectedOrderDetails.delivery_logs) && selectedOrderDetails.delivery_logs.length > 0 && (
                      <div style={{ marginTop: '0.85rem', borderTop: '1px solid #E5E7EB', paddingTop: '0.65rem' }}>
                        <div style={{ fontSize: '0.72rem', textTransform: 'uppercase', fontWeight: 800, color: '#4B5563', marginBottom: '4px' }}>
                          Delivery Attempt History ({selectedOrderDetails.delivery_logs.length})
                        </div>
                        <div style={{ maxHeight: '120px', overflowY: 'auto', fontSize: '0.74rem' }}>
                          {selectedOrderDetails.delivery_logs.map((log, lIdx) => (
                            <div key={lIdx} style={{ padding: '3px 0', borderBottom: '1px dashed #E5E7EB', display: 'flex', justifyContent: 'space-between', gap: '8px' }}>
                              <span>{new Date(log.timestamp).toLocaleTimeString()} - <strong>{log.status}</strong> ({log.provider})</span>
                              <span style={{ color: log.error_details ? '#DC2626' : '#6B7280' }}>
                                {log.error_details ? `Error: ${log.error_details.slice(0, 30)}...` : (log.message_id ? `ID: ${log.message_id.slice(0, 16)}...` : 'Accepted')}
                              </span>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Marketing Attribution */}
                  <div style={{ fontSize: '0.75rem', color: '#9CA3AF' }}>
                    Attribution: Source: <code>{selectedOrderDetails.utm_source || 'direct'}</code> · Medium: <code>{selectedOrderDetails.utm_medium || 'web'}</code> · Campaign: <code>{selectedOrderDetails.utm_campaign || 'elrx_store'}</code>
                  </div>
                </div>

                <div
                  style={{
                    background: '#F9FAFB',
                    padding: '1rem 1.5rem',
                    borderTop: '1px solid #E5E7EB',
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                  }}
                >
                  <button
                    type="button"
                    className="admin-btn-secondary"
                    onClick={() => setSelectedOrderDetails(null)}
                  >
                    Close
                  </button>
                  <button
                    type="button"
                    className="admin-btn-primary"
                    disabled={isResendingEmailId === selectedOrderDetails.id}
                    onClick={async () => {
                      setIsResendingEmailId(selectedOrderDetails.id);
                      try {
                        showToast(`Dispatching deliverable to ${selectedOrderDetails.customer_email}...`);
                        const apiRes = await fetch('/api/orders', {
                          method: 'POST',
                          headers: { 'Content-Type': 'application/json' },
                          body: JSON.stringify({ action: 'retry_delivery', orderId: selectedOrderDetails.id }),
                        });
                        const resData = await apiRes.json().catch(() => ({}));
                        if (apiRes.ok && resData.success) {
                          await updateOrder(selectedOrderDetails.id, {
                            delivery_status: resData.deliveryStatus || 'PROVIDER_ACCEPTED',
                            email_status: resData.deliveryStatus || 'PROVIDER_ACCEPTED',
                            delivery_provider: resData.provider,
                            delivery_message_id: resData.messageId,
                          });
                          showToast(`✓ Deliverable email accepted by provider for ${selectedOrderDetails.customer_email}!`);
                        } else {
                          await sendProductDeliveryEmail({
                            orderId: selectedOrderDetails.id,
                            customerName: selectedOrderDetails.customer_name,
                            customerEmail: selectedOrderDetails.customer_email,
                            product: {
                              name: selectedOrderDetails.product_name,
                              fileUrl: selectedOrderDetails.pdf_url,
                            },
                            paymentId: selectedOrderDetails.payment_id,
                            amount: selectedOrderDetails.amount,
                            currency: selectedOrderDetails.currency || 'INR',
                          });
                          await updateOrder(selectedOrderDetails.id, { delivery_status: 'DELIVERED', email_status: 'DELIVERED' });
                          showToast(`✓ PDF delivery sent to ${selectedOrderDetails.customer_email}`);
                        }
                        refreshAllData();
                        setSelectedOrderDetails(null);
                      } catch (err) {
                        showToast(`Failed sending email: ${err.message}`, 'error');
                      } finally {
                        setIsResendingEmailId(null);
                      }
                    }}
                  >
                    {isResendingEmailId === selectedOrderDetails.id ? 'Sending...' : '✉️ Resend PDF Deliverable'}
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* DELETE ORDER CONFIRMATION MODAL */}
          {orderToDelete && (
            <div
              className="admin-modal-backdrop"
              onClick={() => setOrderToDelete(null)}
              style={{
                position: 'fixed',
                inset: 0,
                background: 'rgba(15, 23, 42, 0.65)',
                backdropFilter: 'blur(3px)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                zIndex: 10000,
                padding: '1rem',
              }}
            >
              <div
                className="admin-modal-box"
                style={{
                  background: '#FFFFFF',
                  borderRadius: '16px',
                  width: '100%',
                  maxWidth: '480px',
                  border: '1px solid #E5E7EB',
                  boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)',
                  overflow: 'hidden',
                  animation: 'adminCardEnter 0.25s cubic-bezier(0.16, 1, 0.3, 1)',
                }}
                onClick={(e) => e.stopPropagation()}
              >
                <div style={{ padding: '1.5rem 1.5rem 1rem 1.5rem', display: 'flex', gap: '1rem', alignItems: 'flex-start' }}>
                  <div
                    style={{
                      width: '44px',
                      height: '44px',
                      borderRadius: '12px',
                      background: '#FEE2E2',
                      color: '#DC2626',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      fontSize: '1.35rem',
                      flexShrink: 0,
                    }}
                  >
                    🗑️
                  </div>
                  <div>
                    <h3 style={{ margin: '0 0 0.35rem 0', fontSize: '1.15rem', fontWeight: 800, color: '#111827' }}>
                      Delete Order Record?
                    </h3>
                    <p style={{ margin: 0, fontSize: '0.84rem', color: '#6B7280', lineHeight: 1.5 }}>
                      Are you sure you want to delete order <strong style={{ fontFamily: 'monospace', color: '#111827' }}>{orderToDelete.id}</strong>?
                      This will permanently remove the record from store orders and delivery logs.
                    </p>
                  </div>
                </div>

                <div style={{ margin: '0 1.5rem 1.25rem 1.5rem', padding: '0.85rem 1rem', background: '#F9FAFB', borderRadius: '10px', border: '1px solid #E5E7EB' }}>
                  <div style={{ fontSize: '0.82rem', fontWeight: 700, color: '#111827' }}>{orderToDelete.customer_name || 'Store Customer'}</div>
                  <div style={{ fontSize: '0.76rem', color: '#6B7280' }}>{orderToDelete.customer_email}</div>
                  <div style={{ fontSize: '0.76rem', color: '#6B7280', marginTop: '4px' }}>
                    {orderToDelete.product_name} · {orderToDelete.is_free || Number(orderToDelete.amount || orderToDelete.product_price) === 0 ? 'Free' : `₹${Number(orderToDelete.amount || orderToDelete.product_price)}`}
                  </div>
                </div>

                <div
                  style={{
                    padding: '1rem 1.5rem',
                    background: '#F9FAFB',
                    borderTop: '1px solid #E5E7EB',
                    display: 'flex',
                    justifyContent: 'flex-end',
                    gap: '0.75rem',
                  }}
                >
                  <button
                    type="button"
                    className="admin-btn-secondary"
                    style={{ padding: '0.5rem 1rem', borderRadius: '8px', fontSize: '0.82rem' }}
                    onClick={() => setOrderToDelete(null)}
                  >
                    Cancel
                  </button>
                  <button
                    type="button"
                    style={{
                      background: '#DC2626',
                      color: '#FFFFFF',
                      border: 'none',
                      borderRadius: '8px',
                      padding: '0.5rem 1.15rem',
                      fontSize: '0.82rem',
                      fontWeight: 700,
                      cursor: 'pointer',
                      transition: 'background-color 0.15s ease',
                    }}
                    onClick={async () => {
                      const targetId = orderToDelete.id;
                      setOrderToDelete(null);
                      await deleteOrder(targetId);
                      showToast(`✓ Order ${targetId} permanently deleted`);
                      refreshAllData();
                    }}
                  >
                    Delete Permanently
                  </button>
                </div>
              </div>
            </div>
          )}


          {/* TAB 2: PRODUCTS (DEALDECK EXECUTIVE DASHBOARD THEME) */}
          {activeTab === 'products' && (
            <div className="dealdeck-tab-container">
              {/* 1. Top 4 DealDeck Metric Cards */}
              <div className="dealdeck-tab-metrics-grid">
                {/* Metric 1: Hero Radiant Orange */}
                <div className="dealdeck-metric-card card-hero-orange">
                  <div className="dealdeck-card-top-row">
                    <div className="dealdeck-card-icon-wrap">📦</div>
                    <span className="dealdeck-growth-pill pill-green">Active</span>
                  </div>
                  <span className="dealdeck-card-label">Total Listed Products</span>
                  <div className="dealdeck-card-number">{productsList.length}</div>
                  <span className="dealdeck-card-subtext">
                    {productsList.filter((p) => (p.status || 'published') === 'published').length} items visible in E.L.R.x Store
                  </span>
                </div>

                {/* Metric 2: Paid Programs */}
                <div className="dealdeck-metric-card">
                  <div className="dealdeck-card-top-row">
                    <div className="dealdeck-card-icon-wrap">💳</div>
                    <span className="dealdeck-growth-pill pill-green">Paid</span>
                  </div>
                  <span className="dealdeck-card-label">Paid Programs &amp; Books</span>
                  <div className="dealdeck-card-number">
                    {productsList.filter((p) => !p.is_free && Number(p.price_inr || p.priceAmount || p.price || 0) > 0).length}
                  </div>
                  <span className="dealdeck-card-subtext">Instant digital checkout enabled</span>
                </div>

                {/* Metric 3: Free Protocols */}
                <div className="dealdeck-metric-card">
                  <div className="dealdeck-card-top-row">
                    <div className="dealdeck-card-icon-wrap">🎁</div>
                    <span className="dealdeck-growth-pill pill-green">Free</span>
                  </div>
                  <span className="dealdeck-card-label">Free Protocols &amp; Guides</span>
                  <div className="dealdeck-card-number">
                    {productsList.filter((p) => p.is_free || Number(p.price_inr || p.priceAmount || p.price || 0) === 0).length}
                  </div>
                  <span className="dealdeck-card-subtext">Lead capture &amp; instant delivery</span>
                </div>

                {/* Metric 4: Pipeline / Waitlist */}
                <div className="dealdeck-metric-card">
                  <div className="dealdeck-card-top-row">
                    <div className="dealdeck-card-icon-wrap">🎯</div>
                    <span className="dealdeck-growth-pill pill-green">Catalog</span>
                  </div>
                  <span className="dealdeck-card-label">Waitlists &amp; Drafts</span>
                  <div className="dealdeck-card-number">
                    {productsList.filter((p) => p.status === 'draft' || p.badge === 'Waitlist').length}
                  </div>
                  <span className="dealdeck-card-subtext">Curated pipeline store items</span>
                </div>
              </div>

              {/* 2. DealDeck Action Bar with Back Button */}
              <div className="dealdeck-action-bar">
                <div className="dealdeck-action-bar-left">
                  <button
                    type="button"
                    className="dealdeck-back-btn"
                    onClick={() => switchTab('overview')}
                    title="Return to Overview Dashboard"
                  >
                    ← Back to Overview
                  </button>

                  <div className="dealdeck-search-wrap">
                    <span className="search-icon">🔍</span>
                    <input
                      type="text"
                      className="dealdeck-search-input"
                      placeholder="Search products by title..."
                      value={productSearch}
                      onChange={(e) => setProductSearch(e.target.value)}
                    />
                  </div>

                  <div className="dealdeck-filter-pills">
                    {[
                      { id: 'all', label: `All (${productsList.filter((p) => p.status !== 'trash' && !p.is_deleted).length})` },
                      { id: 'published', label: `Published (${productsList.filter((p) => (p.status || 'published') === 'published' && p.status !== 'trash' && !p.is_deleted).length})` },
                      { id: 'draft', label: `Drafts (${productsList.filter((p) => p.status === 'draft' && !p.is_deleted).length})` },
                      { id: 'paid', label: `Paid (${productsList.filter((p) => !p.is_free && Number(p.price_inr !== undefined && p.price_inr !== null ? p.price_inr : (p.priceAmount || p.price || 0)) > 0 && p.status !== 'trash' && !p.is_deleted).length})` },
                      { id: 'free', label: `Free (${productsList.filter((p) => (p.is_free || Number(p.price_inr !== undefined && p.price_inr !== null ? p.price_inr : (p.priceAmount || p.price || 0)) === 0) && p.status !== 'trash' && !p.is_deleted).length})` },
                      { id: 'trash', label: `Trash 🗑️ (${productsList.filter((p) => p.status === 'trash' || Boolean(p.is_deleted)).length})` },
                    ].map((filter) => (
                      <button
                        key={filter.id}
                        type="button"
                        className={`dealdeck-filter-btn ${productStatusFilter === filter.id ? 'active' : ''}`}
                        onClick={() => setProductStatusFilter(filter.id)}
                      >
                        {filter.label}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="dealdeck-action-bar-right">
                  <div className="dealdeck-view-toggle">
                    <button
                      type="button"
                      className={`dealdeck-view-btn ${productViewMode === 'grid' ? 'active' : ''}`}
                      onClick={() => setProductViewMode('grid')}
                      title="Card Grid View"
                    >
                      ⊞ Cards
                    </button>
                    <button
                      type="button"
                      className={`dealdeck-view-btn ${productViewMode === 'table' ? 'active' : ''}`}
                      onClick={() => setProductViewMode('table')}
                      title="Data Table View"
                    >
                      ☰ Table
                    </button>
                  </div>

                  <button
                    type="button"
                    className="admin-btn-primary"
                    style={{ width: 'auto', padding: '0.45rem 1.15rem', borderRadius: '12px' }}
                    onClick={() => {
                      setEditingProduct({
                        title: '',
                        slug: '',
                        category: 'Book',
                        format: 'PDF (Digital Download)',
                        price_inr: 499,
                        price_usd: 19,
                        is_free: false,
                        product_type: 'digital_download',
                        external_url: '',
                        short_description: '',
                        full_description: '',
                        status: 'published',
                        cover_image_url: 'assets/author-photo.png',
                        file_url: null,
                      });
                      setIsProductModalOpen(true);
                    }}
                  >
                    + Add New Product
                  </button>
                </div>
              </div>

              {/* 3. Products Content: Visual Cards or Data Table */}
              {productViewMode === 'grid' ? (
                <div className="dealdeck-product-grid">
                  {productsList
                    .filter((p) => {
                      const matchesSearch =
                        (p.title || p.name || '').toLowerCase().includes(productSearch.toLowerCase());
                      let matchesFilter = true;
                      if (productStatusFilter === 'published') matchesFilter = (p.status || 'published') === 'published';
                      else if (productStatusFilter === 'draft') matchesFilter = p.status === 'draft';
                      else if (productStatusFilter === 'paid') matchesFilter = !p.is_free && Number(p.price_inr || p.priceAmount || p.price || 0) > 0;
                      else if (productStatusFilter === 'free') matchesFilter = p.is_free || Number(p.price_inr || p.priceAmount || p.price || 0) === 0;
                      return matchesSearch && matchesFilter;
                    })
                    .map((product) => (
                      <div key={product.id} className="dealdeck-product-card">
                        <div className="dealdeck-product-cover-wrap">
                          <img
                            src={product.cover_image_url || 'assets/author-photo.png'}
                            alt={product.title || product.name}
                            className="dealdeck-product-cover-img"
                            onError={(e) => { e.currentTarget.src = DEFAULT_BLOG_COVER; }}
                          />
                          <span className="dealdeck-product-cat-tag">{product.category || 'Book'}</span>
                          <span className={`dealdeck-product-status-tag ${product.status === 'draft' ? 'draft' : 'published'}`}>
                            {product.status || 'published'}
                          </span>
                        </div>

                        <div className="dealdeck-product-body">
                          <h4 className="dealdeck-product-title">{product.title || product.name}</h4>
                          <p className="dealdeck-product-desc">
                            {product.short_description || product.description || 'Actionable kettlebell programming and evidence-based peak fitness guidelines.'}
                          </p>

                          <div className="dealdeck-product-meta-row">
                            <span className={`dealdeck-product-price-pill ${product.is_free || product.type === 'free' ? 'free' : ''}`}>
                              {product.is_free || product.type === 'free' ? 'Free PDF' : `₹${product.price_inr || product.priceAmount} / ${product.price_usd || 19}`}
                            </span>
                            <span className="dealdeck-product-format">
                              {product.product_type === 'external_link' ? 'External Skool Link' : (product.format || 'Digital Download')}
                            </span>
                          </div>

                          <div className="dealdeck-product-actions">
                            <button
                              type="button"
                              className="dealdeck-product-btn-edit"
                              onClick={() => {
                                setEditingProduct(product);
                                setIsProductModalOpen(true);
                              }}
                            >
                              ✏️ Edit Product
                            </button>
                            <button
                              type="button"
                              className="dealdeck-product-btn-del"
                              title="Delete product"
                              onClick={() => {
                                setDeleteConfirmTarget({
                                  type: 'product',
                                  id: product.id,
                                  name: product.title || product.name,
                                });
                              }}
                            >
                              🗑️
                            </button>
                          </div>
                        </div>
                      </div>
                    ))}
                </div>
              ) : (
                <div className="admin-table-card">
                  <div className="admin-table-responsive">
                    <table className="admin-table">
                      <thead>
                        <tr>
                          <th>Cover</th>
                          <th>Product Title</th>
                          <th>Type &amp; Format</th>
                          <th>Price</th>
                          <th>Status</th>
                          <th>Actions</th>
                        </tr>
                      </thead>
                      <tbody>
                        {productsList
                          .filter((p) => {
                            const matchesSearch =
                              (p.title || p.name || '').toLowerCase().includes(productSearch.toLowerCase());
                            let matchesFilter = true;
                            if (productStatusFilter === 'trash') {
                              matchesFilter = p.status === 'trash' || Boolean(p.is_deleted);
                            } else {
                              if (p.status === 'trash' || Boolean(p.is_deleted)) return false;
                              if (productStatusFilter === 'published') matchesFilter = (p.status || 'published') === 'published';
                              else if (productStatusFilter === 'draft') matchesFilter = p.status === 'draft';
                              else if (productStatusFilter === 'paid') matchesFilter = !p.is_free && Number(p.price_inr || p.priceAmount || p.price || 0) > 0;
                              else if (productStatusFilter === 'free') matchesFilter = p.is_free || Number(p.price_inr || p.priceAmount || p.price || 0) === 0;
                            }
                            return matchesSearch && matchesFilter;
                          })
                          .map((product) => (
                            <tr key={product.id}>
                              <td style={{ width: '60px' }}>
                                <div style={{ width: '44px', height: '58px', background: 'var(--admin-orange)', borderRadius: '6px', overflow: 'hidden', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                  {product.cover_image_url ? (
                                    <img
                                      src={product.cover_image_url}
                                      alt=""
                                      style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                                    />
                                  ) : (
                                    <span style={{ fontSize: '18px' }}>📖</span>
                                  )}
                                </div>
                              </td>
                              <td>
                                <div style={{ fontWeight: 700, fontSize: '0.95rem' }}>{product.title || product.name}</div>
                                <div style={{ fontSize: '0.75rem', color: 'var(--admin-text-muted)' }}>
                                  Slug: {product.slug || product.id}
                                </div>
                              </td>
                              <td>
                                <span style={{ fontWeight: 600 }}>{product.category}</span>
                                <div style={{ fontSize: '0.75rem', color: 'var(--admin-text-muted)' }}>
                                  {product.product_type === 'external_link' ? 'External Skool Link' : product.format}
                                </div>
                              </td>
                              <td>
                                {product.is_free || product.type === 'free' ? (
                                  <span className="admin-badge admin-badge-free">Free</span>
                                ) : (
                                  <span style={{ fontWeight: 700 }}>
                                    ₹{product.price_inr || product.priceAmount} / ${product.price_usd || 19}
                                  </span>
                                )}
                              </td>
                              <td>
                                <span
                                  className={`admin-badge ${product.status === 'trash' ? 'admin-badge-draft' : (product.status === 'published' ? 'admin-badge-published' : 'admin-badge-draft')}`}
                                >
                                  {product.status || 'published'}
                                </span>
                              </td>
                              <td>
                                <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
                                  {product.status === 'trash' ? (
                                    <>
                                      <button
                                        type="button"
                                        className="admin-btn-secondary"
                                        style={{ padding: '0.35rem 0.65rem', fontSize: '0.78rem', background: '#10B981', color: '#FFFFFF', border: 'none' }}
                                        onClick={async () => {
                                          await restoreProduct(product.id);
                                          showToast('Product restored to store');
                                          refreshAllData();
                                        }}
                                      >
                                        ↺ Restore
                                      </button>
                                      <button
                                        type="button"
                                        className="admin-btn-secondary"
                                        style={{ padding: '0.35rem 0.65rem', fontSize: '0.78rem', color: '#DC2626' }}
                                        onClick={() => {
                                          setDeleteConfirmTarget({
                                            type: 'product',
                                            id: product.id,
                                            name: product.title || product.name,
                                            permanent: true,
                                          });
                                        }}
                                      >
                                        Permanent Delete
                                      </button>
                                    </>
                                  ) : (
                                    <>
                                      <button
                                        type="button"
                                        className="admin-btn-secondary"
                                        style={{ padding: '0.35rem 0.65rem', fontSize: '0.78rem' }}
                                        onClick={() => {
                                          setEditingProduct(product);
                                          setIsProductModalOpen(true);
                                        }}
                                      >
                                        Edit
                                      </button>
                                      <button
                                        type="button"
                                        className="admin-btn-secondary"
                                        style={{ padding: '0.35rem 0.65rem', fontSize: '0.78rem', color: '#DC2626' }}
                                        onClick={() => {
                                          setDeleteConfirmTarget({
                                            type: 'product',
                                            id: product.id,
                                            name: product.title || product.name,
                                            permanent: false,
                                          });
                                        }}
                                      >
                                        Delete
                                      </button>
                                    </>
                                  )}
                                </div>
                              </td>
                            </tr>
                          ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* TAB 3: BLOG & ARCHIVE (DEALDECK EXECUTIVE DASHBOARD THEME) */}
          {activeTab === 'blog' && (
            <div className="dealdeck-tab-container">
              {/* 1. Top 4 DealDeck Metric Cards */}
              <div className="dealdeck-tab-metrics-grid">
                {/* Metric 1: Hero Radiant Orange */}
                <div className="dealdeck-metric-card card-hero-orange">
                  <div className="dealdeck-card-top-row">
                    <div className="dealdeck-card-icon-wrap">✍️</div>
                    <span className="dealdeck-growth-pill pill-green">Live</span>
                  </div>
                  <span className="dealdeck-card-label">Total Published Articles</span>
                  <div className="dealdeck-card-number">{postsList.length}</div>
                  <span className="dealdeck-card-subtext">Live real-time sync across public archive</span>
                </div>

                {/* Metric 2: Frameworks */}
                <div className="dealdeck-metric-card">
                  <div className="dealdeck-card-top-row">
                    <div className="dealdeck-card-icon-wrap">🏋️</div>
                    <span className="dealdeck-growth-pill pill-green">Core</span>
                  </div>
                  <span className="dealdeck-card-label">Frameworks &amp; Protocols</span>
                  <div className="dealdeck-card-number">
                    {postsList.filter((p) => (p.category || '').toLowerCase().includes('framework') || (p.category || '').toLowerCase().includes('kettlebell')).length}
                  </div>
                  <span className="dealdeck-card-subtext">Training science &amp; movement breakdowns</span>
                </div>

                {/* Metric 3: Habits */}
                <div className="dealdeck-metric-card">
                  <div className="dealdeck-card-top-row">
                    <div className="dealdeck-card-icon-wrap">🧠</div>
                    <span className="dealdeck-growth-pill pill-green">Habits</span>
                  </div>
                  <span className="dealdeck-card-label">Mindset &amp; Nutrition</span>
                  <div className="dealdeck-card-number">
                    {postsList.filter((p) => (p.category || '').toLowerCase().includes('habit') || (p.category || '').toLowerCase().includes('nutrition')).length}
                  </div>
                  <span className="dealdeck-card-subtext">Discipline &amp; executive recovery essays</span>
                </div>

                {/* Metric 4: Avg Read */}
                <div className="dealdeck-metric-card">
                  <div className="dealdeck-card-top-row">
                    <div className="dealdeck-card-icon-wrap">⏱️</div>
                    <span className="dealdeck-growth-pill pill-green">Editorial</span>
                  </div>
                  <span className="dealdeck-card-label">Avg Reading Time</span>
                  <div className="dealdeck-card-number">~4.5 min</div>
                  <span className="dealdeck-card-subtext">High-retention tactical essays</span>
                </div>
              </div>

              {/* 2. DealDeck Action Bar with Back Button */}
              <div className="dealdeck-action-bar">
                <div className="dealdeck-action-bar-left">
                  <button
                    type="button"
                    className="dealdeck-back-btn"
                    onClick={() => switchTab('overview')}
                    title="Return to Overview Dashboard"
                  >
                    ← Back to Overview
                  </button>

                  <div className="dealdeck-search-wrap">
                    <span className="search-icon">🔍</span>
                    <input
                      type="text"
                      className="dealdeck-search-input"
                      placeholder="Search articles & essays..."
                      value={postSearch}
                      onChange={(e) => setPostSearch(e.target.value)}
                    />
                  </div>

                  <div className="dealdeck-filter-pills">
                    {[
                      { id: 'all', label: 'All Status' },
                      { id: 'published', label: 'Published' },
                      { id: 'draft', label: 'Drafts' },
                    ].map((s) => (
                      <button
                        key={s.id}
                        type="button"
                        className={`dealdeck-filter-btn ${postStatusFilter === s.id ? 'active' : ''}`}
                        onClick={() => setPostStatusFilter(s.id)}
                        style={{ fontWeight: 600 }}
                      >
                        {s.label}
                      </button>
                    ))}
                    <span style={{ color: '#D1D5DB', margin: '0 4px' }}>|</span>
                    <button
                      type="button"
                      className={`dealdeck-filter-btn ${postCategoryFilter === 'all' ? 'active' : ''}`}
                      onClick={() => setPostCategoryFilter('all')}
                    >
                      All Categories
                    </button>
                    {categoriesList.map((cat) => (
                      <button
                        key={cat}
                        type="button"
                        className={`dealdeck-filter-btn ${postCategoryFilter === cat ? 'active' : ''}`}
                        onClick={() => setPostCategoryFilter(cat)}
                      >
                        {cat}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="dealdeck-action-bar-right">
                  <div className="dealdeck-view-toggle">
                    <button
                      type="button"
                      className={`dealdeck-view-btn ${postViewMode === 'grid' ? 'active' : ''}`}
                      onClick={() => setPostViewMode('grid')}
                      title="Card Grid View"
                    >
                      ⊞ Cards
                    </button>
                    <button
                      type="button"
                      className={`dealdeck-view-btn ${postViewMode === 'table' ? 'active' : ''}`}
                      onClick={() => setPostViewMode('table')}
                      title="Data Table View"
                    >
                      ☰ Table
                    </button>
                  </div>

                  <button
                    type="button"
                    className="admin-btn-secondary"
                    style={{ borderRadius: '12px', fontSize: '0.8rem', padding: '0.45rem 0.85rem' }}
                    onClick={() => setIsCreatingCategory(true)}
                  >
                    + Add Category
                  </button>

                  <button
                    type="button"
                    className="admin-btn-yellow"
                    style={{ borderRadius: '12px', padding: '0.45rem 1.15rem' }}
                    onClick={() => {
                      setEditingPost({
                        title: '',
                        slug: '',
                        category: categoriesList[0] || 'Framework',
                        published_date: 'November 2026',
                        read_time: '4 min read',
                        summary: '',
                        content: '',
                        thumbnail_url: 'assets/author-photo.png',
                        thumbnail: 'assets/author-photo.png',
                        video_url: '',
                        videoUrl: '',
                        status: 'published',
                        seo_title: '',
                        seo_description: '',
                      });
                      setIsPostModalOpen(true);
                    }}
                  >
                    + Write Article / Newsletter
                  </button>
                </div>
              </div>

              {/* ⭐ Homepage Featured Articles Strip */}
              <div
                style={{
                  background: '#FFFFFF',
                  borderRadius: '14px',
                  padding: '1rem 1.25rem',
                  marginBottom: '1.25rem',
                  border: '1px solid #E5E7EB',
                  boxShadow: '0 1px 3px rgba(0,0,0,0.04)',
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.75rem', flexWrap: 'wrap', gap: '0.5rem' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    <span style={{ fontSize: '1.1rem' }}>⭐</span>
                    <strong style={{ fontSize: '0.92rem', color: '#111827' }}>
                      Homepage Featured Articles (Top Pinned)
                    </strong>
                    <span style={{ fontSize: '0.75rem', color: '#6B7280' }}>
                      Choose which articles appear first on the public website homepage and set their exact order
                    </span>
                  </div>
                  <span style={{ fontSize: '0.75rem', fontWeight: 600, color: '#FF6200', background: 'rgba(255,98,0,0.08)', padding: '2px 8px', borderRadius: '12px' }}>
                    {postsList.filter((p) => p.featured).length} Pinned
                  </span>
                </div>

                <div style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap', alignItems: 'center' }}>
                  {postsList.filter((p) => p.featured).length === 0 ? (
                    <p style={{ margin: 0, fontSize: '0.82rem', color: '#6B7280', fontStyle: 'italic' }}>
                      No articles currently pinned. Click the "☆ Feature" star on any card or table row below to pin it to position #1 on your homepage.
                    </p>
                  ) : (
                    postsList
                      .filter((p) => p.featured)
                      .sort((a, b) => (a.featured_order || 999) - (b.featured_order || 999))
                      .map((featPost, idx, arr) => (
                        <div
                          key={featPost.id}
                          style={{
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: '0.5rem',
                            padding: '0.4rem 0.75rem',
                            background: '#FFF9F0',
                            border: '1px solid #FFD8A8',
                            borderRadius: '8px',
                            fontSize: '0.82rem',
                          }}
                        >
                          <span style={{ fontWeight: 800, color: '#D9480F', fontSize: '0.75rem', background: '#FFE8CC', padding: '2px 6px', borderRadius: '4px' }}>
                            #{idx + 1}
                          </span>
                          <span style={{ fontWeight: 600, color: '#111827', maxWidth: '180px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                            {featPost.title}
                          </span>
                          <div style={{ display: 'inline-flex', gap: '2px' }}>
                            {idx > 0 && (
                              <button
                                type="button"
                                style={{ border: 'none', background: 'transparent', cursor: 'pointer', padding: '0 2px', fontSize: '0.8rem', color: '#4B5563' }}
                                onClick={async () => {
                                  const currentIds = arr.map((p) => p.id);
                                  const temp = currentIds[idx];
                                  currentIds[idx] = currentIds[idx - 1];
                                  currentIds[idx - 1] = temp;
                                  await setFeaturedPostsOrder(currentIds);
                                  showToast('Reordered featured articles');
                                  refreshAllData();
                                }}
                                title="Move up in homepage order"
                              >
                                ↑
                              </button>
                            )}
                            {idx < arr.length - 1 && (
                              <button
                                type="button"
                                style={{ border: 'none', background: 'transparent', cursor: 'pointer', padding: '0 2px', fontSize: '0.8rem', color: '#4B5563' }}
                                onClick={async () => {
                                  const currentIds = arr.map((p) => p.id);
                                  const temp = currentIds[idx];
                                  currentIds[idx] = currentIds[idx + 1];
                                  currentIds[idx + 1] = temp;
                                  await setFeaturedPostsOrder(currentIds);
                                  showToast('Reordered featured articles');
                                  refreshAllData();
                                }}
                                title="Move down in homepage order"
                              >
                                ↓
                              </button>
                            )}
                            <button
                              type="button"
                              style={{ border: 'none', background: 'transparent', cursor: 'pointer', padding: '0 2px', fontSize: '0.8rem', color: '#DC2626', marginLeft: '4px' }}
                              onClick={async () => {
                                await togglePostFeatured(featPost.id, false);
                                showToast('Unpinned from homepage');
                                refreshAllData();
                              }}
                              title="Unfeature from homepage"
                            >
                              ✕
                            </button>
                          </div>
                        </div>
                      ))
                  )}
                </div>
              </div>

              {/* 3. Article Content: Visual Cards or Data Table */}
              {postViewMode === 'grid' ? (
                <div className="dealdeck-article-grid">
                  {postsList
                    .filter((post) => {
                      const matchesSearch =
                        (post.title || '').toLowerCase().includes(postSearch.toLowerCase()) ||
                        (post.summary || '').toLowerCase().includes(postSearch.toLowerCase());
                      const matchesCategory =
                        postCategoryFilter === 'all' || post.category === postCategoryFilter;
                      const matchesStatus =
                        postStatusFilter === 'all'
                          ? true
                          : postStatusFilter === 'published'
                          ? (post.status || 'published') === 'published'
                          : post.status === 'draft';
                      return matchesSearch && matchesCategory && matchesStatus;
                    })
                    .map((post) => (
                      <div key={post.id} className="dealdeck-article-card">
                        <div className="dealdeck-article-thumb-wrap">
                          <img
                            src={formatArticleThumbnailUrl(post.thumbnail_url || post.thumbnail)}
                            alt={post.title}
                            className="dealdeck-article-thumb-img"
                            onError={(e) => { e.currentTarget.src = DEFAULT_BLOG_COVER; }}
                          />
                          {(post.video_url || post.videoUrl) && (
                            <span className="dealdeck-article-video-pill">
                              ▶ Video Lesson
                            </span>
                          )}
                        </div>

                        <div className="dealdeck-article-body">
                          <div className="dealdeck-article-top-meta">
                            <span className="dealdeck-article-cat">{post.category || 'Framework'}</span>
                            <span
                              className={`admin-badge ${post.status === 'draft' ? 'admin-badge-draft' : 'admin-badge-published'}`}
                              style={{ marginLeft: 'auto', marginRight: '6px', fontSize: '0.7rem', padding: '1px 6px' }}
                            >
                              {post.status === 'draft' ? 'Draft' : 'Published'}
                            </span>
                            <span className="dealdeck-article-date">{post.published_date || post.date || 'October 2026'}</span>
                          </div>

                          <h4 className="dealdeck-article-title">{post.title}</h4>
                          <p className="dealdeck-article-summary">
                            {post.summary || 'Tactical training framework and principles from field-tested kettlebell protocols.'}
                          </p>

                          <div className="dealdeck-article-footer">
                            <span className="dealdeck-article-readtime">📖 {post.read_time || post.readTime || '4 min read'}</span>
                            <div style={{ display: 'flex', gap: '0.4rem', alignItems: 'center' }}>
                              <button
                                type="button"
                                className="admin-btn-secondary"
                                style={{
                                  padding: '0.3rem 0.65rem',
                                  fontSize: '0.75rem',
                                  borderRadius: '8px',
                                  color: post.featured ? '#D9480F' : '#4B5563',
                                  background: post.featured ? '#FFF4E6' : '#FFFFFF',
                                  borderColor: post.featured ? '#FFD8A8' : '#E5E7EB',
                                  fontWeight: post.featured ? 700 : 500,
                                }}
                                onClick={async () => {
                                  await togglePostFeatured(post.id);
                                  showToast(post.featured ? 'Unpinned from homepage' : 'Pinned to Homepage as Featured!');
                                  refreshAllData();
                                }}
                                title={post.featured ? 'Click to unpin from homepage' : 'Click to pin to homepage'}
                              >
                                {post.featured ? `★ Feat #${post.featured_order || 1}` : '☆ Feature'}
                              </button>
                              <button
                                type="button"
                                className="admin-btn-secondary"
                                style={{ padding: '0.3rem 0.65rem', fontSize: '0.75rem', borderRadius: '8px' }}
                                onClick={() => {
                                  setEditingPost({
                                    ...post,
                                    title: post.title || '',
                                    slug: post.slug || (post.title || '').toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, ''),
                                    category: post.category || 'Framework',
                                    published_date: post.published_date || post.date || 'October 2026',
                                    date: post.published_date || post.date || 'October 2026',
                                    read_time: post.read_time || post.readTime || '4 min read',
                                    readTime: post.read_time || post.readTime || '4 min read',
                                    summary: post.summary || post.excerpt || '',
                                    excerpt: post.excerpt || post.summary || '',
                                    content: post.content || '',
                                    thumbnail_url: post.thumbnail_url || post.thumbnail || '',
                                    thumbnail: post.thumbnail_url || post.thumbnail || '',
                                    video_url: post.video_url || post.videoUrl || '',
                                    videoUrl: post.video_url || post.videoUrl || '',
                                    video_storage_id: post.video_storage_id || '',
                                    video_storage_ref: post.video_storage_ref || '',
                                    status: post.status || 'published',
                                    featured: Boolean(post.featured),
                                    featured_order: post.featured_order || 1,
                                    seo_title: post.seo_title || post.title || '',
                                    seo_description: post.seo_description || post.summary || '',
                                    slugModified: true,
                                  });
                                  setIsPostModalOpen(true);
                                }}
                              >
                                Edit
                              </button>
                              <button
                                type="button"
                                className="admin-btn-secondary"
                                style={{ padding: '0.3rem 0.55rem', fontSize: '0.75rem', color: '#DC2626', borderRadius: '8px' }}
                                onClick={() => {
                                  setDeleteConfirmTarget({
                                    type: 'post',
                                    id: post.id,
                                    name: post.title,
                                  });
                                }}
                              >
                                ✕
                              </button>
                            </div>
                          </div>
                        </div>
                      </div>
                    ))}
                </div>
              ) : (
                <div className="admin-table-card">
                  <div className="admin-table-responsive">
                    <table className="admin-table">
                      <thead>
                        <tr>
                          <th style={{ width: '56px' }}>Media</th>
                          <th>Title</th>
                          <th>Category</th>
                          <th>Date</th>
                          <th>Read Time</th>
                          <th>Homepage</th>
                          <th>Status</th>
                          <th>Actions</th>
                        </tr>
                      </thead>
                      <tbody>
                        {postsList
                          .filter((post) => {
                            const matchesSearch =
                              (post.title || '').toLowerCase().includes(postSearch.toLowerCase()) ||
                              (post.summary || '').toLowerCase().includes(postSearch.toLowerCase());
                            const matchesCategory =
                              postCategoryFilter === 'all' || post.category === postCategoryFilter;
                            const matchesStatus =
                              postStatusFilter === 'all'
                                ? true
                                : postStatusFilter === 'published'
                                ? (post.status || 'published') === 'published'
                                : post.status === 'draft';
                            return matchesSearch && matchesCategory && matchesStatus;
                          })
                          .map((post) => (
                            <tr key={post.id}>
                              <td>
                                <div style={{ position: 'relative', width: '44px', height: '44px', borderRadius: '6px', overflow: 'hidden', border: '1px solid #E5E7EB', background: '#F3F4F6' }}>
                                  <img
                                    src={formatArticleThumbnailUrl(post.thumbnail_url || post.thumbnail)}
                                    alt=""
                                    style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }}
                                    onError={(e) => { e.currentTarget.src = DEFAULT_BLOG_COVER; }}
                                  />
                                  {(post.video_url || post.videoUrl) && (
                                    <span
                                      style={{
                                        position: 'absolute',
                                        bottom: '2px',
                                        right: '2px',
                                        background: 'var(--admin-orange)',
                                        color: '#FFF',
                                        fontSize: '0.55rem',
                                        padding: '1px 3px',
                                        borderRadius: '2px',
                                        fontWeight: 700,
                                        lineHeight: 1,
                                      }}
                                      title="Includes Featured Video"
                                    >
                                      ▶
                                    </span>
                                  )}
                                </div>
                              </td>
                              <td>
                                <div style={{ fontWeight: 700 }}>{post.title}</div>
                                <div style={{ fontSize: '0.75rem', color: 'var(--admin-text-muted)' }}>
                                  Slug: {post.slug || post.id}
                                </div>
                              </td>
                              <td>
                                <span className="admin-badge admin-badge-draft">{post.category}</span>
                              </td>
                              <td>{post.published_date || post.date}</td>
                              <td>{post.read_time || post.readTime}</td>
                              <td>
                                <button
                                  type="button"
                                  className="admin-btn-secondary"
                                  style={{
                                    padding: '0.25rem 0.55rem',
                                    fontSize: '0.75rem',
                                    borderRadius: '6px',
                                    color: post.featured ? '#D9480F' : '#4B5563',
                                    background: post.featured ? '#FFF4E6' : '#FFFFFF',
                                    borderColor: post.featured ? '#FFD8A8' : '#E5E7EB',
                                    fontWeight: post.featured ? 700 : 500,
                                  }}
                                  onClick={async () => {
                                    await togglePostFeatured(post.id);
                                    showToast(post.featured ? 'Unpinned from homepage' : 'Pinned to Homepage as Featured!');
                                    refreshAllData();
                                  }}
                                  title={post.featured ? 'Click to unpin from homepage' : 'Click to pin to homepage'}
                                >
                                  {post.featured ? `★ #${post.featured_order || 1}` : '☆ Pin'}
                                </button>
                              </td>
                              <td>
                                <span
                                  className={`admin-badge ${post.status !== 'draft' ? 'admin-badge-published' : 'admin-badge-draft'}`}
                                >
                                  {post.status || 'published'}
                                </span>
                              </td>
                              <td>
                                <div style={{ display: 'flex', gap: '0.5rem' }}>
                                  <button
                                    type="button"
                                    className="admin-btn-secondary"
                                    style={{ padding: '0.35rem 0.65rem', fontSize: '0.78rem' }}
                                    onClick={() => {
                                      setEditingPost({
                                        ...post,
                                        title: post.title || '',
                                        slug: post.slug || (post.title || '').toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, ''),
                                        category: post.category || 'Framework',
                                        published_date: post.published_date || post.date || 'October 2026',
                                        date: post.published_date || post.date || 'October 2026',
                                        read_time: post.read_time || post.readTime || '4 min read',
                                        readTime: post.read_time || post.readTime || '4 min read',
                                        summary: post.summary || post.excerpt || '',
                                        excerpt: post.excerpt || post.summary || '',
                                        content: post.content || '',
                                        thumbnail_url: post.thumbnail_url || post.thumbnail || '',
                                        thumbnail: post.thumbnail_url || post.thumbnail || '',
                                        video_url: post.video_url || post.videoUrl || '',
                                        videoUrl: post.video_url || post.videoUrl || '',
                                        video_storage_id: post.video_storage_id || '',
                                        video_storage_ref: post.video_storage_ref || '',
                                        status: post.status || 'published',
                                        featured: Boolean(post.featured),
                                        featured_order: post.featured_order || 1,
                                        seo_title: post.seo_title || post.title || '',
                                        seo_description: post.seo_description || post.summary || '',
                                        slugModified: true,
                                      });
                                      setIsPostModalOpen(true);
                                    }}
                                  >
                                    Edit
                                  </button>
                                  <button
                                    type="button"
                                    className="admin-btn-secondary"
                                    style={{ padding: '0.35rem 0.65rem', fontSize: '0.78rem', color: '#DC2626' }}
                                    onClick={() => {
                                      setDeleteConfirmTarget({
                                        type: 'post',
                                        id: post.id,
                                        name: post.title,
                                      });
                                    }}
                                  >
                                    Delete
                                  </button>
                                </div>
                              </td>
                            </tr>
                          ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* TAB 4: MEDIA LIBRARY (DEALDECK EXECUTIVE DASHBOARD THEME) */}
          {activeTab === 'media' && (
            <div className="dealdeck-tab-container">
              {/* 1. Top 4 DealDeck Metric Cards */}
              <div className="dealdeck-tab-metrics-grid">
                {/* Metric 1: Hero Radiant Orange */}
                <div className="dealdeck-metric-card card-hero-orange">
                  <div className="dealdeck-card-top-row">
                    <div className="dealdeck-card-icon-wrap">🖼️</div>
                    <span className="dealdeck-growth-pill pill-green">Ready</span>
                  </div>
                  <span className="dealdeck-card-label">Total Media Assets</span>
                  <div className="dealdeck-card-number">{mediaList.length}</div>
                  <span className="dealdeck-card-subtext">Images, covers &amp; PDF manuals</span>
                </div>

                {/* Metric 2: Book Covers */}
                <div className="dealdeck-metric-card">
                  <div className="dealdeck-card-top-row">
                    <div className="dealdeck-card-icon-wrap">📚</div>
                    <span className="dealdeck-growth-pill pill-green">Covers</span>
                  </div>
                  <span className="dealdeck-card-label">Book &amp; Product Covers</span>
                  <div className="dealdeck-card-number">
                    {mediaList.filter((m) => (m.name || '').toLowerCase().includes('cover') || (m.name || '').toLowerCase().includes('book')).length}
                  </div>
                  <span className="dealdeck-card-subtext">High-resolution store covers</span>
                </div>

                {/* Metric 3: Author Photos */}
                <div className="dealdeck-metric-card">
                  <div className="dealdeck-card-top-row">
                    <div className="dealdeck-card-icon-wrap">📸</div>
                    <span className="dealdeck-growth-pill pill-green">Editorial</span>
                  </div>
                  <span className="dealdeck-card-label">Author &amp; Training Photos</span>
                  <div className="dealdeck-card-number">
                    {mediaList.filter((m) => (m.name || '').toLowerCase().includes('author') || (m.name || '').toLowerCase().includes('abhi') || (m.name || '').toLowerCase().includes('photo')).length}
                  </div>
                  <span className="dealdeck-card-subtext">Brand &amp; movement imagery</span>
                </div>

                {/* Metric 4: CDN Storage */}
                <div className="dealdeck-metric-card">
                  <div className="dealdeck-card-top-row">
                    <div className="dealdeck-card-icon-wrap">⚡</div>
                    <span className="dealdeck-growth-pill pill-green">Active</span>
                  </div>
                  <span className="dealdeck-card-label">Storage Engine</span>
                  <div className="dealdeck-card-number">Zero Latency</div>
                  <span className="dealdeck-card-subtext">Optimized instant asset delivery</span>
                </div>
              </div>

              {/* 2. DealDeck Action Bar with Back Button */}
              <div className="dealdeck-action-bar">
                <div className="dealdeck-action-bar-left">
                  <button
                    type="button"
                    className="dealdeck-back-btn"
                    onClick={() => switchTab('overview')}
                    title="Return to Overview Dashboard"
                  >
                    ← Back to Overview
                  </button>

                  <span style={{ fontSize: '0.85rem', color: '#6B7280', fontWeight: 600 }}>
                    Upload and manage high-resolution assets for books, articles, and bio cards.
                  </span>
                </div>

                <div className="dealdeck-action-bar-right">
                  <label
                    className="admin-btn-primary"
                    style={{
                      width: 'auto',
                      padding: '0.45rem 1.15rem',
                      borderRadius: '12px',
                      cursor: 'pointer',
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: '0.35rem',
                    }}
                  >
                    📁 + Upload New File
                    <input
                      type="file"
                      style={{ display: 'none' }}
                      accept="image/*,application/pdf"
                      onChange={async (e) => {
                        const file = e.target.files?.[0];
                        if (!file) return;
                        const maxLimit = typeof MAX_FILE_SIZE_BYTES !== 'undefined' ? MAX_FILE_SIZE_BYTES : (25 * 1024 * 1024);
                        if (file.size > maxLimit) {
                          showToast('File size must be under 25MB', 'error');
                          e.target.value = '';
                          return;
                        }
                        setLoading(true);
                        try {
                          const asset = await uploadMediaAsset(file);
                          showToast(`Uploaded ${file.name}`);
                          refreshAllData();
                        } catch (err) {
                          showToast(`Upload failed: ${err.message}`, 'error');
                        } finally {
                          setLoading(false);
                          e.target.value = '';
                        }
                      }}
                    />
                  </label>
                </div>
              </div>

              {/* 3. Media Assets Grid */}
              <div className="dealdeck-media-grid">
                {mediaList.map((asset) => (
                  <div key={asset.id} className="dealdeck-media-card">
                    <div className="dealdeck-media-thumb">
                      {asset.fileType?.includes('pdf') ? (
                        <div style={{ textAlign: 'center', padding: '1rem' }}>
                          <span style={{ fontSize: '2.5rem' }}>📄</span>
                          <div style={{ fontSize: '0.72rem', fontWeight: 700 }}>PDF Document</div>
                        </div>
                      ) : (
                        <img
                          src={asset.publicUrl}
                          alt={asset.altText || asset.name}
                          onError={(e) => { e.currentTarget.src = 'assets/author-photo.png'; }}
                        />
                      )}
                    </div>

                    <div className="dealdeck-media-info">
                      <div className="dealdeck-media-filename" title={asset.name}>{asset.name}</div>
                      <div className="dealdeck-media-meta">
                        {(asset.fileSize / 1024).toFixed(1)} KB · {asset.fileType?.split('/')[1]?.toUpperCase() || 'FILE'}
                      </div>

                      <div className="dealdeck-media-actions">
                        <button
                          type="button"
                          className="admin-btn-secondary"
                          style={{ flex: 1, padding: '0.3rem', fontSize: '0.74rem', borderRadius: '8px' }}
                          onClick={() => {
                            navigator.clipboard.writeText(asset.publicUrl);
                            showToast('Copied URL to clipboard!');
                          }}
                        >
                          📋 Copy URL
                        </button>
                        <button
                          type="button"
                          className="admin-btn-secondary"
                          style={{ padding: '0.3rem 0.55rem', fontSize: '0.74rem', color: '#DC2626', borderRadius: '8px' }}
                          title="Delete Asset"
                          onClick={() => {
                            setDeleteConfirmTarget({
                              type: 'media',
                              id: asset.id,
                              name: asset.name,
                            });
                          }}
                        >
                          ✕
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* TAB 5: WEBSITE CONTENT (FULL HOMEPAGE CONTENT & SECTION MANAGER) */}
          {activeTab === 'content' && (
            <WebsiteContentManager
              siteContent={siteContent}
              setSiteContentState={setSiteContentState}
              contentSubTab={contentSubTab}
              setContentSubTab={setContentSubTab}
              mediaList={mediaList}
              postsList={postsList}
              uploadMediaAsset={uploadMediaAsset}
              updateSiteContent={updateSiteContent}
              updateAllSiteContent={updateAllSiteContent}
              refreshAllData={refreshAllData}
              showToast={showToast}
              setLoading={setLoading}
            />
          )}

          {/* TAB 6: CRM LEADS & INQUIRIES (DEALDECK EXECUTIVE DASHBOARD THEME) */}
          {activeTab === 'leads' && (
            <div className="dealdeck-tab-container">
              {/* 1. Top 4 DealDeck Metric Cards */}
              <div className="dealdeck-tab-metrics-grid">
                {/* Metric 1: Hero Radiant Orange */}
                <div className="dealdeck-metric-card card-hero-orange">
                  <div className="dealdeck-card-top-row">
                    <div className="dealdeck-card-icon-wrap">👥</div>
                    <span className="dealdeck-growth-pill pill-green">Real-Time</span>
                  </div>
                  <span className="dealdeck-card-label">Total Inquiries &amp; Buyers</span>
                  <div className="dealdeck-card-number">{leadsList.length}</div>
                  <span className="dealdeck-card-subtext">
                    {leadsList.filter((l) => l.status === 'new').length} new leads pending review
                  </span>
                </div>

                {/* Metric 2: Work With Me */}
                <div className="dealdeck-metric-card">
                  <div className="dealdeck-card-top-row">
                    <div className="dealdeck-card-icon-wrap">✉️</div>
                    <span className="dealdeck-growth-pill pill-green">Consult</span>
                  </div>
                  <span className="dealdeck-card-label">Work With Me Consultations</span>
                  <div className="dealdeck-card-number">
                    {leadsList.filter((l) => (l.lead_type || '').includes('contact') || (l.source_type || '').includes('work')).length}
                  </div>
                  <span className="dealdeck-card-subtext">Direct 1:1 coaching applications</span>
                </div>

                {/* Metric 3: Store Buyers */}
                <div className="dealdeck-metric-card">
                  <div className="dealdeck-card-top-row">
                    <div className="dealdeck-card-icon-wrap">🛒</div>
                    <span className="dealdeck-growth-pill pill-green">Orders</span>
                  </div>
                  <span className="dealdeck-card-label">Store Buyers &amp; Downloads</span>
                  <div className="dealdeck-card-number">
                    {leadsList.filter((l) => (l.lead_type || '').includes('store') || (l.source_type || '').includes('order')).length}
                  </div>
                  <span className="dealdeck-card-subtext">Digital product checkouts</span>
                </div>

                {/* Metric 4: Zoho Synced */}
                <div className="dealdeck-metric-card">
                  <div className="dealdeck-card-top-row">
                    <div className="dealdeck-card-icon-wrap">🚀</div>
                    <span className="dealdeck-growth-pill pill-green">Zoho Synced</span>
                  </div>
                  <span className="dealdeck-card-label">Zoho Campaigns Integration</span>
                  <div className="dealdeck-card-number">
                    {leadsList.filter((l) => l.zoho_synced || l.status === 'converted' || l.status === 'zoho_synced').length} / {leadsList.length}
                  </div>
                  <span className="dealdeck-card-subtext">Automated audience sync</span>
                </div>
              </div>

              {/* 2. DealDeck Action Bar with Back Button */}
              <div className="dealdeck-action-bar">
                <div className="dealdeck-action-bar-left">
                  <button
                    type="button"
                    className="dealdeck-back-btn"
                    onClick={() => switchTab('overview')}
                    title="Return to Overview Dashboard"
                  >
                    ← Back to Overview
                  </button>

                  <div className="dealdeck-search-wrap">
                    <span className="search-icon">🔍</span>
                    <input
                      type="text"
                      className="dealdeck-search-input"
                      placeholder="Search leads by name or email..."
                      value={leadSearch}
                      onChange={(e) => setLeadSearch(e.target.value)}
                    />
                  </div>

                  <div className="dealdeck-filter-pills">
                    {[
                      { id: 'all', label: 'All Sources' },
                      { id: 'contact_inquiry', label: 'Work With Me' },
                      { id: 'store_order', label: 'Store Orders' },
                      { id: 'newsletter_signup', label: 'Newsletter' },
                    ].map((f) => (
                      <button
                        key={f.id}
                        type="button"
                        className={`dealdeck-filter-btn ${leadTypeFilter === f.id ? 'active' : ''}`}
                        onClick={() => setLeadTypeFilter(f.id)}
                      >
                        {f.label}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="dealdeck-action-bar-right">
                  <button
                    type="button"
                    className="admin-btn-primary"
                    style={{ width: 'auto', padding: '0.45rem 1rem', borderRadius: '12px', fontSize: '0.8rem', display: 'inline-flex', alignItems: 'center', gap: '0.35rem' }}
                    onClick={async () => {
                      if (leadsList.length === 0) {
                        showToast('No leads available to sync.', 'info');
                        return;
                      }
                      showToast('Syncing leads to Zoho Campaigns list…');
                      let count = 0;
                      for (const l of leadsList) {
                        await syncToZohoCampaigns({
                          email: l.email,
                          name: l.name,
                          source: l.source || l.lead_type,
                          tag: l.lead_type,
                          utm_source: l.utm_source,
                          utm_medium: l.utm_medium,
                          utm_campaign: l.utm_campaign,
                          region: l.region,
                        });
                        count++;
                      }
                      showToast(`✓ Successfully synced ${count} leads to Zoho Campaigns!`);
                      refreshAllData();
                    }}
                  >
                    ⚡ Push All to Zoho List
                  </button>

                  <button
                    type="button"
                    className="admin-btn-secondary"
                    style={{ borderRadius: '12px', padding: '0.45rem 0.85rem', fontSize: '0.8rem' }}
                    onClick={() => {
                      // CSV Export
                      const headers = ['Type', 'Name', 'Email', 'Primary Goal', 'Timeline', 'Status', 'Date', 'UTM Source', 'UTM Campaign'];
                      const rows = leadsList.map((l) => [
                        l.lead_type,
                        `"${l.name || ''}"`,
                        `"${l.email}"`,
                        `"${l.primary_goal || ''}"`,
                        `"${l.timeline || ''}"`,
                        l.status,
                        l.created_at,
                        l.utm_source || 'direct',
                        l.utm_campaign || '',
                      ]);
                      const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows.map(e => e.join(','))].join('\n');
                      const encodedUri = encodeURI(csvContent);
                      const link = document.createElement('a');
                      link.setAttribute('href', encodedUri);
                      link.setAttribute('download', `leads_export_${Date.now()}.csv`);
                      document.body.appendChild(link);
                      link.click();
                      document.body.removeChild(link);
                    }}
                  >
                    📥 Export CSV
                  </button>
                </div>
              </div>

              {/* 3. DealDeck Leads Table Card */}
              <div className="admin-table-card">
                <div className="admin-table-responsive">
                  <table className="admin-table">
                    <thead>
                      <tr>
                        <th>Lead Profile</th>
                        <th>Type &amp; Source</th>
                        <th>Goal / Message</th>
                        <th>UTM Attribution</th>
                        <th>Zoho Status</th>
                        <th>Status</th>
                        <th>Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {leadsList
                        .filter((lead) => {
                          const matchesSearch =
                            (lead.name || '').toLowerCase().includes(leadSearch.toLowerCase()) ||
                            lead.email.toLowerCase().includes(leadSearch.toLowerCase());
                          const matchesType =
                            leadTypeFilter === 'all' || lead.lead_type === leadTypeFilter;
                          return matchesSearch && matchesType;
                        })
                        .map((lead) => (
                          <tr key={lead.id}>
                            <td>
                              <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                                <div className="dealdeck-lead-avatar">
                                  {(lead.name || lead.email || 'A').charAt(0).toUpperCase()}
                                </div>
                                <div>
                                  <div style={{ fontWeight: 700, fontSize: '0.92rem' }}>{lead.name || 'Anonymous'}</div>
                                  <div style={{ fontSize: '0.78rem', color: '#6B7280' }}>{lead.email}</div>
                                  <div style={{ fontSize: '0.7rem', color: '#9CA3AF' }}>{new Date(lead.created_at).toLocaleString()}</div>
                                </div>
                              </div>
                            </td>
                            <td>
                              <span className="dealdeck-lead-source-tag">
                                {lead.lead_type === 'store_order' ? '🛒 Store Order' : lead.lead_type === 'contact_inquiry' ? '💬 Work With Me' : '✉️ Newsletter'}
                              </span>
                            </td>
                            <td style={{ maxWidth: '220px', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }} title={lead.primary_goal || lead.message}>
                              {lead.primary_goal || lead.message || 'General Subscriber'}
                            </td>
                            <td>
                              <span className="dealdeck-lead-utm-tag">
                                {lead.utm_source ? `${lead.utm_source} / ${lead.utm_medium || 'web'}` : 'direct / organic'}
                              </span>
                            </td>
                            <td>
                              <button
                                type="button"
                                className={`dealdeck-lead-zoho-tag ${lead.zoho_synced || lead.status === 'converted' ? 'synced' : 'pending'}`}
                                onClick={async () => {
                                  const res = await syncToZohoCampaigns({
                                    email: lead.email,
                                    name: lead.name,
                                    source: lead.source || lead.lead_type,
                                    tag: lead.lead_type,
                                  });
                                  if (res.success) {
                                    showToast(`✓ Pushed ${lead.email} to Zoho Campaigns list!`);
                                    refreshAllData();
                                  }
                                }}
                                title="Click to push/re-sync this lead to Zoho Campaigns list"
                                style={{ cursor: 'pointer', border: 'none' }}
                              >
                                {lead.zoho_synced || lead.status === 'converted' ? '✓ Synced' : '⚡ Push Zoho'}
                              </button>
                            </td>
                            <td>
                              <select
                                value={lead.status}
                                onChange={async (e) => {
                                  await updateLeadStatus(lead.id, e.target.value);
                                  showToast(`Status updated to ${e.target.value}`);
                                  refreshAllData();
                                }}
                                style={{ padding: '0.25rem 0.5rem', borderRadius: '8px', border: '1px solid #E5E7EB', fontSize: '0.78rem', background: '#F9FAFB' }}
                              >
                                <option value="new">New</option>
                                <option value="contacted">Contacted</option>
                                <option value="in_progress">In Progress</option>
                                <option value="closed">Closed</option>
                              </select>
                            </td>
                            <td>
                              <button
                                type="button"
                                className="admin-btn-secondary"
                                style={{ padding: '0.35rem 0.75rem', fontSize: '0.78rem', borderRadius: '8px' }}
                                onClick={() => setViewingLead(lead)}
                              >
                                View Dossier
                              </button>
                            </td>
                          </tr>
                        ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}

          {/* TAB 7: SETTINGS & INTEGRATIONS */}
          {activeTab === 'settings' && (
            <div className="dealdeck-tab-container">
              {/* DealDeck Action Bar with Back Button */}
              <div className="dealdeck-action-bar">
                <div className="dealdeck-action-bar-left">
                  <button
                    type="button"
                    className="dealdeck-back-btn"
                    onClick={() => switchTab('overview')}
                    title="Return to Overview Dashboard"
                  >
                    ← Back to Overview
                  </button>

                  <span style={{ fontSize: '0.85rem', color: '#6B7280', fontWeight: 600 }}>
                    Configure database, payment gateways (Razorpay &amp; PayPal), and email marketing pipelines.
                  </span>
                </div>

                <div className="dealdeck-action-bar-right">
                  <button
                    type="button"
                    className="admin-btn-secondary"
                    style={{ borderRadius: '12px', padding: '0.45rem 0.95rem' }}
                    onClick={() => {
                      setApiSettings(getApiSettings());
                      showToast('Reloaded saved settings');
                    }}
                  >
                    ↺ Reset
                  </button>
                  <button
                    type="button"
                    className="admin-btn-primary"
                    style={{ width: 'auto', padding: '0.45rem 1.25rem', borderRadius: '12px' }}
                    disabled={isSavingSettings}
                    onClick={() => {
                      setIsSavingSettings(true);
                      const res = saveApiSettings(apiSettings);
                      setIsSavingSettings(false);
                      if (res.success) {
                        showToast('All API configurations saved and applied!');
                        refreshAllData();
                      } else {
                        showToast(res.error || 'Failed saving settings', 'error');
                      }
                    }}
                  >
                    {isSavingSettings ? 'Saving...' : '💾 Save Settings'}
                  </button>
                </div>
              </div>

              <div style={{ padding: '1.75rem' }}>
                {/* DealDeck Executive Overview Row for APIs */}
                <div className="dealdeck-api-metric-grid">
                  <div className="dealdeck-metric-card card-hero-orange">
                    <div className="dealdeck-card-top-row">
                      <div className="dealdeck-card-icon-wrap">⚡</div>
                      <span className="dealdeck-growth-pill pill-green">Live Gateway</span>
                    </div>
                    <span className="dealdeck-card-label">Active Integrations</span>
                    <div className="dealdeck-card-number">
                      {[
                        isSupabaseConfigured || apiSettings.supabaseUrl,
                        apiSettings.razorpayKeyId,
                        apiSettings.paypalClientId,
                        apiSettings.zohoApiKey || apiSettings.zohoEndpoint,
                        apiSettings.resendApiKey,
                      ].filter(Boolean).length} / 5
                    </div>
                    <span className="dealdeck-card-subtext">Cloud APIs &amp; Webhooks</span>
                  </div>

                  <div className="dealdeck-metric-card">
                    <div className="dealdeck-card-top-row">
                      <div className="dealdeck-card-icon-wrap">🗄️</div>
                      <span className="dealdeck-growth-pill pill-green">High-Speed</span>
                    </div>
                    <span className="dealdeck-card-label">Primary Database</span>
                    <div className="dealdeck-card-number" style={{ fontSize: '1.25rem' }}>
                      {isSupabaseConfigured ? 'Supabase Cloud' : 'Hybrid Local'}
                    </div>
                    <span className="dealdeck-card-subtext">Zero-latency offline fallback</span>
                  </div>

                  <div className="dealdeck-metric-card">
                    <div className="dealdeck-card-top-row">
                      <div className="dealdeck-card-icon-wrap">💳</div>
                      <span className="dealdeck-growth-pill pill-green">Dual Channel</span>
                    </div>
                    <span className="dealdeck-card-label">Payment Gateway</span>
                    <div className="dealdeck-card-number" style={{ fontSize: '1.25rem' }}>
                      Razorpay + PayPal
                    </div>
                    <span className="dealdeck-card-subtext">Domestic UPI/Cards + Global USD</span>
                  </div>

                  <div className="dealdeck-metric-card">
                    <div className="dealdeck-card-top-row">
                      <div className="dealdeck-card-icon-wrap">📨</div>
                      <span className="dealdeck-growth-pill pill-green">Automated</span>
                    </div>
                    <span className="dealdeck-card-label">Transactional Dispatches</span>
                    <div className="dealdeck-card-number" style={{ fontSize: '1.25rem' }}>
                      Resend + Zoho
                    </div>
                    <span className="dealdeck-card-subtext">Instant alerts &amp; subscriber sync</span>
                  </div>
                </div>

                {/* 5 Service Integration Cards with Vector SVG Animations */}
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(350px, 1fr))', gap: '1.5rem' }}>
                  
                  {/* 1. SUPABASE */}
                  <div className="admin-integration-card">
                    <div className="admin-integration-top-stripe admin-integration-stripe-supabase" />
                    <div className="admin-integration-body">
                      <div className="admin-integration-header-row">
                        <div className="admin-integration-title-group">
                          <SupabaseVectorAnim />
                          <div>
                            <h4 className="admin-integration-title">Supabase Cloud</h4>
                            <p className="admin-integration-sub">Database &amp; media storage for site content.</p>
                          </div>
                        </div>
                        {isSupabaseConfigured ? (
                          <span className="admin-badge admin-badge-published">● Connected</span>
                        ) : (
                          <span className="admin-badge admin-badge-draft">● Local Mode</span>
                        )}
                      </div>

                      <div className="admin-form-group">
                        <label>Project URL</label>
                        <input
                          type="url"
                          className="admin-input"
                          placeholder="https://xyz.supabase.co"
                          value={apiSettings.supabaseUrl}
                          onChange={(e) => setApiSettings({ ...apiSettings, supabaseUrl: e.target.value })}
                        />
                      </div>

                      <div className="admin-form-group">
                        <label>Anon Public Key</label>
                        <div className="input-with-toggle">
                          <input
                            type={showKeys.supabase ? 'text' : 'password'}
                            className="admin-input"
                            placeholder="eyJhbGciOiJIUzI1NiIsIn..."
                            value={apiSettings.supabaseAnonKey}
                            onChange={(e) => setApiSettings({ ...apiSettings, supabaseAnonKey: e.target.value })}
                          />
                          <button
                            type="button"
                            className="btn-toggle-mask"
                            onClick={() => setShowKeys({ ...showKeys, supabase: !showKeys.supabase })}
                          >
                            {showKeys.supabase ? 'Hide' : 'Show'}
                          </button>
                        </div>
                      </div>

                      <div style={{ display: 'flex', gap: '0.5rem', marginTop: '0.5rem' }}>
                        <button
                          type="button"
                          className="admin-btn-secondary"
                          style={{ flex: 1, padding: '0.5rem 0.85rem', fontSize: '0.82rem' }}
                          onClick={async () => {
                            setTestStates((prev) => ({ ...prev, supabase: { status: 'testing', message: 'Testing Supabase connection...' } }));
                            const res = await testSupabaseConnection(apiSettings.supabaseUrl, apiSettings.supabaseAnonKey);
                            setTestStates((prev) => ({
                              ...prev,
                              supabase: { status: res.success ? 'success' : 'error', message: res.success ? res.message : res.error },
                            }));
                            if (res.success) {
                              saveApiSettings(apiSettings);
                              showToast('Supabase connected & saved!');
                            }
                          }}
                        >
                          Test Connection
                        </button>
                      </div>

                      {testStates.supabase && (
                        <div className={`test-result-box ${testStates.supabase.status}`}>
                          <span>{testStates.supabase.status === 'success' ? '✓' : testStates.supabase.status === 'testing' ? '⏳' : '✕'}</span>
                          <span>{testStates.supabase.message}</span>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* 2. RAZORPAY */}
                  <div className="admin-integration-card">
                    <div className="admin-integration-top-stripe admin-integration-stripe-razorpay" />
                    <div className="admin-integration-body">
                      <div className="admin-integration-header-row">
                        <div className="admin-integration-title-group">
                          <RazorpayVectorAnim />
                          <div>
                            <h4 className="admin-integration-title">Razorpay Payments</h4>
                            <p className="admin-integration-sub">Accept UPI, cards &amp; net banking in ₹ INR.</p>
                          </div>
                        </div>
                        <span className={`admin-badge ${apiSettings.razorpayKeyId ? 'admin-badge-published' : 'admin-badge-draft'}`}>
                          {apiSettings.razorpayKeyId ? 'Configured' : 'Not Configured'}
                        </span>
                      </div>

                      <div className="admin-form-group">
                        <label>Key ID</label>
                        <input
                          type="text"
                          className="admin-input"
                          placeholder="rzp_test_... or rzp_live_..."
                          value={apiSettings.razorpayKeyId}
                          onChange={(e) => setApiSettings({ ...apiSettings, razorpayKeyId: e.target.value })}
                        />
                      </div>

                      <div className="admin-form-group">
                        <label>Key Secret</label>
                        <div className="input-with-toggle">
                          <input
                            type={showKeys.razorpay ? 'text' : 'password'}
                            className="admin-input"
                            placeholder="••••••••••••"
                            value={apiSettings.razorpayKeySecret}
                            onChange={(e) => setApiSettings({ ...apiSettings, razorpayKeySecret: e.target.value })}
                          />
                          <button
                            type="button"
                            className="btn-toggle-mask"
                            onClick={() => setShowKeys({ ...showKeys, razorpay: !showKeys.razorpay })}
                          >
                            {showKeys.razorpay ? 'Hide' : 'Show'}
                          </button>
                        </div>
                      </div>

                      <div style={{ display: 'flex', gap: '0.5rem', marginTop: '0.5rem' }}>
                        <button
                          type="button"
                          className="admin-btn-secondary"
                          style={{ flex: 1, padding: '0.5rem 0.85rem', fontSize: '0.82rem' }}
                          onClick={async () => {
                            const res = await testRazorpayCredentials(apiSettings.razorpayKeyId, apiSettings.razorpayKeySecret);
                            setTestStates((prev) => ({
                              ...prev,
                              razorpay: { status: res.success ? 'success' : 'error', message: res.success ? res.message : res.error },
                            }));
                          }}
                        >
                          Validate Keys
                        </button>
                      </div>

                      {testStates.razorpay && (
                        <div className={`test-result-box ${testStates.razorpay.status}`}>
                          <span>{testStates.razorpay.status === 'success' ? '✓' : '✕'}</span>
                          <span>{testStates.razorpay.message}</span>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* 3. PAYPAL */}
                  <div className="admin-integration-card">
                    <div className="admin-integration-top-stripe admin-integration-stripe-paypal" />
                    <div className="admin-integration-body">
                      <div className="admin-integration-header-row">
                        <div className="admin-integration-title-group">
                          <PayPalVectorAnim />
                          <div>
                            <h4 className="admin-integration-title">PayPal Checkout</h4>
                            <p className="admin-integration-sub">Accept international payments in $ USD.</p>
                          </div>
                        </div>
                        <span className={`admin-badge ${apiSettings.paypalClientId ? 'admin-badge-published' : 'admin-badge-draft'}`}>
                          {apiSettings.paypalClientId ? 'Configured' : 'Not Configured'}
                        </span>
                      </div>

                      <div className="admin-form-group">
                        <label>Client ID</label>
                        <input
                          type="text"
                          className="admin-input"
                          placeholder="PayPal Client ID"
                          value={apiSettings.paypalClientId}
                          onChange={(e) => setApiSettings({ ...apiSettings, paypalClientId: e.target.value })}
                        />
                      </div>

                      <div className="admin-form-group">
                        <label>Client Secret</label>
                        <div className="input-with-toggle">
                          <input
                            type={showKeys.paypal ? 'text' : 'password'}
                            className="admin-input"
                            placeholder="••••••••••••"
                            value={apiSettings.paypalSecret}
                            onChange={(e) => setApiSettings({ ...apiSettings, paypalSecret: e.target.value })}
                          />
                          <button
                            type="button"
                            className="btn-toggle-mask"
                            onClick={() => setShowKeys({ ...showKeys, paypal: !showKeys.paypal })}
                          >
                            {showKeys.paypal ? 'Hide' : 'Show'}
                          </button>
                        </div>
                      </div>

                      <div style={{ display: 'flex', gap: '0.5rem', marginTop: '0.5rem' }}>
                        <button
                          type="button"
                          className="admin-btn-secondary"
                          style={{ flex: 1, padding: '0.5rem 0.85rem', fontSize: '0.82rem' }}
                          onClick={async () => {
                            const res = await testPayPalCredentials(apiSettings.paypalClientId, apiSettings.paypalSecret);
                            setTestStates((prev) => ({
                              ...prev,
                              paypal: { status: res.success ? 'success' : 'error', message: res.success ? res.message : res.error },
                            }));
                          }}
                        >
                          Validate Setup
                        </button>
                      </div>

                      {testStates.paypal && (
                        <div className={`test-result-box ${testStates.paypal.status}`}>
                          <span>{testStates.paypal.status === 'success' ? '✓' : '✕'}</span>
                          <span>{testStates.paypal.message}</span>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* 4. ZOHO CAMPAIGNS */}
                  <div className="admin-integration-card">
                    <div className="admin-integration-top-stripe admin-integration-stripe-zoho" />
                    <div className="admin-integration-body">
                      <div className="admin-integration-header-row">
                        <div className="admin-integration-title-group">
                          <ZohoVectorAnim />
                          <div>
                            <h4 className="admin-integration-title">Zoho Campaigns</h4>
                            <p className="admin-integration-sub">Sync subscribers directly to your email list.</p>
                          </div>
                        </div>
                        <span className={`admin-badge ${apiSettings.zohoApiKey || apiSettings.zohoEndpoint ? 'admin-badge-published' : 'admin-badge-draft'}`}>
                          {apiSettings.zohoApiKey || apiSettings.zohoEndpoint ? 'Active' : 'Not Configured'}
                        </span>
                      </div>

                      <div className="admin-form-group">
                        <label>Auth Token / API Key</label>
                        <div className="input-with-toggle">
                          <input
                            type={showKeys.zoho ? 'text' : 'password'}
                            className="admin-input"
                            placeholder="Zoho Auth Token"
                            value={apiSettings.zohoApiKey}
                            onChange={(e) => setApiSettings({ ...apiSettings, zohoApiKey: e.target.value })}
                          />
                          <button
                            type="button"
                            className="btn-toggle-mask"
                            onClick={() => setShowKeys({ ...showKeys, zoho: !showKeys.zoho })}
                          >
                            {showKeys.zoho ? 'Hide' : 'Show'}
                          </button>
                        </div>
                      </div>

                      <div className="admin-form-group">
                        <label>List ID</label>
                        <input
                          type="text"
                          className="admin-input"
                          placeholder="e.g. 3z9a128e..."
                          value={apiSettings.zohoListKey}
                          onChange={(e) => setApiSettings({ ...apiSettings, zohoListKey: e.target.value })}
                        />
                      </div>

                      <div className="admin-form-group">
                        <label>Webhook URL (Optional)</label>
                        <input
                          type="url"
                          className="admin-input"
                          placeholder="https://campaigns.zoho.com/api/v1.1/..."
                          value={apiSettings.zohoEndpoint}
                          onChange={(e) => setApiSettings({ ...apiSettings, zohoEndpoint: e.target.value })}
                        />
                      </div>

                      <div style={{ display: 'flex', gap: '0.5rem', marginTop: '0.5rem' }}>
                        <button
                          type="button"
                          className="admin-btn-secondary"
                          style={{ flex: 1, padding: '0.5rem 0.85rem', fontSize: '0.82rem' }}
                          onClick={async () => {
                            const res = await testZohoCampaigns(apiSettings.zohoEndpoint, apiSettings.zohoApiKey, apiSettings.zohoListKey);
                            setTestStates((prev) => ({
                              ...prev,
                              zoho: { status: res.success ? 'success' : 'error', message: res.success ? res.message : res.error },
                            }));
                          }}
                        >
                          Test Sync
                        </button>
                        <button
                          type="button"
                          className="admin-btn-primary"
                          style={{ flex: 1.2, padding: '0.5rem 0.85rem', fontSize: '0.82rem', width: 'auto' }}
                          onClick={async () => {
                            const testLead = {
                              email: 'test.zoho@abhisingh.me',
                              name: 'Zoho Test Subscriber',
                              source: 'cms_api_test',
                              tag: 'cms_test_push',
                            };
                            const syncRes = await syncToZohoCampaigns(testLead);
                            if (syncRes.success) {
                              setTestStates((prev) => ({
                                ...prev,
                                zoho: {
                                  status: 'success',
                                  message: `✓ Test subscriber "${testLead.email}" added to Zoho Campaigns list (${syncRes.payload?.list_key || 'active list'})!`,
                                },
                              }));
                              showToast('✓ Test subscriber pushed to Zoho Campaigns list successfully!');
                              refreshAllData();
                            } else {
                              setTestStates((prev) => ({
                                ...prev,
                                zoho: { status: 'error', message: `Sync failed: ${syncRes.error}` },
                              }));
                              showToast(`Zoho push failed: ${syncRes.error}`, 'error');
                            }
                          }}
                        >
                          ⚡ Push Test Lead
                        </button>
                      </div>

                      {testStates.zoho && (
                        <div className={`test-result-box ${testStates.zoho.status}`}>
                          <span>{testStates.zoho.status === 'success' ? '✓' : '✕'}</span>
                          <span>{testStates.zoho.message}</span>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* 5. RESEND EMAIL */}
                  <div className="admin-integration-card">
                    <div className="admin-integration-top-stripe admin-integration-stripe-resend" />
                    <div className="admin-integration-body">
                      <div className="admin-integration-header-row">
                        <div className="admin-integration-title-group">
                          <ResendVectorAnim />
                          <div>
                            <h4 className="admin-integration-title">Resend Email</h4>
                            <p className="admin-integration-sub">Receive instant email notifications for inquiries.</p>
                          </div>
                        </div>
                        <span className={`admin-badge ${apiSettings.resendApiKey ? 'admin-badge-published' : 'admin-badge-draft'}`}>
                          {apiSettings.resendApiKey ? 'Configured' : 'Not Configured'}
                        </span>
                      </div>

                      <div className="admin-form-group">
                        <label>API Key</label>
                        <div className="input-with-toggle">
                          <input
                            type={showKeys.resend ? 'text' : 'password'}
                            className="admin-input"
                            placeholder="re_123456789..."
                            value={apiSettings.resendApiKey}
                            onChange={(e) => setApiSettings({ ...apiSettings, resendApiKey: e.target.value })}
                          />
                          <button
                            type="button"
                            className="btn-toggle-mask"
                            onClick={() => setShowKeys({ ...showKeys, resend: !showKeys.resend })}
                          >
                            {showKeys.resend ? 'Hide' : 'Show'}
                          </button>
                        </div>
                      </div>

                      <div className="admin-form-group">
                        <label>Send Alerts To</label>
                        <input
                          type="email"
                          className="admin-input"
                          placeholder="abhi@abhisingh.me"
                          value={apiSettings.contactRecipientEmail}
                          onChange={(e) => setApiSettings({ ...apiSettings, contactRecipientEmail: e.target.value })}
                        />
                      </div>

                      <div style={{ display: 'flex', gap: '0.5rem', marginTop: '0.5rem' }}>
                        <button
                          type="button"
                          className="admin-btn-secondary"
                          style={{ flex: 1, padding: '0.5rem 0.85rem', fontSize: '0.82rem' }}
                          onClick={async () => {
                            const res = await testResendCredentials(apiSettings.resendApiKey, apiSettings.contactRecipientEmail);
                            setTestStates((prev) => ({
                              ...prev,
                              resend: { status: res.success ? 'success' : 'error', message: res.success ? res.message : res.error },
                            }));
                          }}
                        >
                          Test Email
                        </button>
                      </div>

                      {testStates.resend && (
                        <div className={`test-result-box ${testStates.resend.status}`}>
                          <span>{testStates.resend.status === 'success' ? '✓' : '✕'}</span>
                          <span>{testStates.resend.message}</span>
                        </div>
                      )}
                    </div>
                  </div>

                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* ── 3. PRODUCT MODAL ── */}
      {isProductModalOpen && editingProduct && (
        <div className="admin-modal-backdrop" onClick={() => setIsProductModalOpen(false)}>
          <div className="admin-modal" onClick={(e) => e.stopPropagation()}>
            <div className="admin-modal-header">
              <h3 style={{ margin: 0, fontFamily: 'var(--font-main)' }}>
                {editingProduct.id ? 'Edit Product' : 'Add New Digital Product'}
              </h3>
              <button
                type="button"
                className="admin-btn-secondary"
                style={{ border: 'none', fontSize: '1.2rem' }}
                onClick={() => setIsProductModalOpen(false)}
              >
                ✕
              </button>
            </div>
            <div className="admin-modal-body">
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '1.25rem' }}>
                <div className="admin-form-group">
                  <label>Product Title *</label>
                  <input
                    type="text"
                    className="admin-input"
                    value={editingProduct.title || editingProduct.name || ''}
                    onChange={(e) => {
                      const title = e.target.value;
                      const isNewProduct = !editingProduct.id;
                      const currentAutoSlug = (editingProduct.title || '').toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
                      const shouldAutoSlug = isNewProduct && (!editingProduct.slug || editingProduct.slug === currentAutoSlug);
                      setEditingProduct({
                        ...editingProduct,
                        title,
                        name: title,
                        ...(shouldAutoSlug ? { slug: title.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '') } : {}),
                      });
                    }}
                    required
                  />
                </div>
                <div className="admin-form-group">
                  <label>URL Slug</label>
                  <input
                    type="text"
                    className="admin-input"
                    placeholder="e.g. mastering-kettlebell-snatch"
                    value={editingProduct.slug || ''}
                    onChange={(e) => setEditingProduct({ ...editingProduct, slug: e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, '') })}
                  />
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '1.25rem' }}>
                <div className="admin-form-group">
                  <label>Product Type</label>
                  <select
                    className="admin-input"
                    value={editingProduct.product_type}
                    onChange={(e) => setEditingProduct({ ...editingProduct, product_type: e.target.value })}
                  >
                    <option value="digital_download">PDF / Digital Download</option>
                    <option value="external_link">External Community Link (Skool)</option>
                    <option value="course">Email Course</option>
                    <option value="book">Printed / Physical Book</option>
                  </select>
                </div>
                <div className="admin-form-group">
                  <label>Pricing Type</label>
                  <select
                    className="admin-input"
                    value={editingProduct.is_free ? 'free' : 'paid'}
                    onChange={(e) => {
                      const isFree = e.target.value === 'free';
                      setEditingProduct({
                        ...editingProduct,
                        is_free: isFree,
                        price_inr: isFree ? 0 : (editingProduct.price_inr || 499),
                        price_usd: isFree ? 0 : (editingProduct.price_usd || 19),
                      });
                    }}
                  >
                    <option value="free">Free Resource (Yellow Button)</option>
                    <option value="paid">Paid Product (Orange Button)</option>
                  </select>
                </div>
                {!editingProduct.is_free && (
                  <>
                    <div className="admin-form-group">
                      <label>Price (INR ₹)</label>
                      <input
                        type="number"
                        className="admin-input"
                        value={editingProduct.price_inr !== undefined && editingProduct.price_inr !== null ? editingProduct.price_inr : ''}
                        onChange={(e) => setEditingProduct({ ...editingProduct, price_inr: e.target.value === '' ? '' : Number(e.target.value) })}
                      />
                    </div>
                    <div className="admin-form-group">
                      <label>Price (USD $)</label>
                      <input
                        type="number"
                        className="admin-input"
                        value={editingProduct.price_usd !== undefined && editingProduct.price_usd !== null ? editingProduct.price_usd : ''}
                        onChange={(e) => setEditingProduct({ ...editingProduct, price_usd: e.target.value === '' ? '' : Number(e.target.value) })}
                      />
                    </div>
                  </>
                )}
              </div>

              {editingProduct.product_type === 'external_link' && (
                <div className="admin-form-group">
                  <label>External Community URL (e.g. Skool)</label>
                  <input
                    type="url"
                    className="admin-input"
                    placeholder="https://www.skool.com/elrx-guild"
                    value={editingProduct.external_url || ''}
                    onChange={(e) => setEditingProduct({ ...editingProduct, external_url: e.target.value })}
                  />
                </div>
              )}

              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '1.25rem' }}>
                <div className="admin-form-group">
                  <label>Publication Status</label>
                  <select
                    className="admin-input"
                    value={editingProduct.status || 'published'}
                    onChange={(e) => setEditingProduct({ ...editingProduct, status: e.target.value })}
                  >
                    <option value="published">Published (Visible in Store)</option>
                    <option value="draft">Draft (Private in CMS)</option>
                  </select>
                </div>
                <div className="admin-form-group">
                  <label>Stock Status</label>
                  <select
                    className="admin-input"
                    value={editingProduct.stock_status || 'in_stock'}
                    onChange={(e) => setEditingProduct({ ...editingProduct, stock_status: e.target.value })}
                  >
                    <option value="in_stock">In Stock (Available for Purchase/Download)</option>
                    <option value="out_of_stock">Out of Stock (Display 'Sold Out' Badge, Pause Checkout)</option>
                  </select>
                </div>
              </div>

              <div className="admin-form-group">
                <label>Short Description (Tagline)</label>
                <input
                  type="text"
                  className="admin-input"
                  placeholder="e.g. Master the kettlebell snatch with step-by-step programming"
                  value={editingProduct.short_description || editingProduct.tagline || ''}
                  onChange={(e) => setEditingProduct({ ...editingProduct, short_description: e.target.value, tagline: e.target.value })}
                />
              </div>

              <div className="admin-form-group">
                <label>Full Description</label>
                <textarea
                  className="admin-input"
                  rows={4}
                  placeholder="Comprehensive breakdown of this product, deliverables, and workouts included..."
                  value={editingProduct.full_description || ''}
                  onChange={(e) => setEditingProduct({ ...editingProduct, full_description: e.target.value })}
                />
              </div>

              {/* Media Uploads Section */}
              <div style={{ background: '#F9FAFB', padding: '1.25rem', borderRadius: '4px', margin: '1.5rem 0' }}>
                <h4 style={{ margin: '0 0 1rem 0', fontSize: '0.92rem', fontWeight: 700 }}>Product Assets & Artwork</h4>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '1.25rem' }}>
                  {/* Cover Upload */}
                  <div>
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.4rem' }}>
                      <label style={{ fontSize: '0.8rem', fontWeight: 700, margin: 0 }}>
                        1. Product Cover Image
                      </label>
                      {editingProduct.cover_image_url && (
                        <button
                          type="button"
                          className="admin-btn-text-danger"
                          style={{ fontSize: '0.78rem' }}
                          onClick={() => setEditingProduct({ ...editingProduct, cover_image_url: '', image_url: '' })}
                        >
                          Remove Cover
                        </button>
                      )}
                    </div>
                    <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '0.5rem', flexWrap: 'wrap' }}>
                      <label
                        className="admin-btn-secondary"
                        style={{ cursor: 'pointer', fontSize: '0.78rem', padding: '0.4rem 0.75rem', display: 'inline-flex', alignItems: 'center', gap: '0.35rem' }}
                      >
                        <span>📁 Upload Image</span>
                        <input
                          type="file"
                          accept="image/*"
                          style={{ display: 'none' }}
                          onChange={async (e) => {
                            const file = e.target.files?.[0];
                            if (file) {
                              const maxLimit = typeof MAX_FILE_SIZE_BYTES !== 'undefined' ? MAX_FILE_SIZE_BYTES : (25 * 1024 * 1024);
                              if (file.size > maxLimit) {
                                showToast(`File size (${(file.size / (1024 * 1024)).toFixed(1)}MB) exceeds maximum limit of 25MB`, 'error');
                                e.target.value = '';
                                return;
                              }
                              const ext = (file.name || '').split('.').pop()?.toLowerCase();
                              const validImgExts = ['jpg', 'jpeg', 'png', 'webp', 'gif', 'svg', 'avif'];
                              if (!validImgExts.includes(ext) && !file.type.startsWith('image/')) {
                                showToast('Please select a valid image file (JPG, PNG, WebP, SVG, AVIF)', 'error');
                                e.target.value = '';
                                return;
                              }
                              try {
                                showToast('Uploading cover image...');
                                const asset = await uploadMediaAsset(file);
                                const url = asset.publicUrl || asset.public_url;
                                setEditingProduct((prev) => ({ ...prev, cover_image_url: url, image_url: url }));
                                showToast('Cover image updated successfully');
                              } catch (err) {
                                showToast(`Upload failed: ${err.message}`, 'error');
                              } finally {
                                e.target.value = '';
                              }
                            }
                          }}
                        />
                      </label>
                      <button
                        type="button"
                        className="admin-btn-secondary"
                        style={{ fontSize: '0.78rem', padding: '0.4rem 0.75rem' }}
                        onClick={() => {
                          setMediaPickerTarget('product_cover');
                          setIsMediaPickerOpen(true);
                        }}
                      >
                        🖼️ Choose from Library
                      </button>
                    </div>
                    <input
                      type="text"
                      className="admin-input"
                      placeholder="Or enter direct image URL..."
                      style={{ fontSize: '0.8rem', padding: '0.35rem 0.6rem', marginBottom: '0.5rem' }}
                      value={editingProduct.cover_image_url || ''}
                      onChange={(e) => setEditingProduct({ ...editingProduct, cover_image_url: e.target.value, image_url: e.target.value })}
                    />
                    <div style={{ width: '90px', height: '120px', borderRadius: '4px', overflow: 'hidden', border: '1px solid #D1D5DB' }}>
                      {editingProduct.cover_image_url ? (
                        <img src={editingProduct.cover_image_url} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                      ) : (
                        <div style={{ width: '100%', height: '100%', background: 'linear-gradient(135deg, #FF6200 0%, #D04F00 100%)', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', color: '#fff', fontSize: '10px', textAlign: 'center', padding: '6px', fontWeight: 700 }}>
                          <span style={{ fontSize: '20px', marginBottom: '2px' }}>📖</span>
                          <span>No Cover Selected</span>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* PDF Upload */}
                  {editingProduct.product_type === 'digital_download' && (
                    <div>
                      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.4rem' }}>
                        <label style={{ fontSize: '0.8rem', fontWeight: 700, margin: 0 }}>
                          2. Actual PDF Deliverable
                        </label>
                        {editingProduct.file_url && (
                          <button
                            type="button"
                            className="admin-btn-text-danger"
                            style={{ fontSize: '0.78rem' }}
                            onClick={() => setEditingProduct({ ...editingProduct, file_url: null, downloadUrl: null })}
                          >
                            Remove PDF
                          </button>
                        )}
                      </div>
                      <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '0.5rem', flexWrap: 'wrap' }}>
                        <label
                          className="admin-btn-secondary"
                          style={{ cursor: 'pointer', fontSize: '0.78rem', padding: '0.4rem 0.75rem', display: 'inline-flex', alignItems: 'center', gap: '0.35rem' }}
                        >
                          <span>📄 {editingProduct.file_url ? 'Replace PDF File' : 'Upload PDF File'}</span>
                          <input
                            type="file"
                            accept="application/pdf"
                            style={{ display: 'none' }}
                            onChange={async (e) => {
                              const file = e.target.files?.[0];
                              if (file) {
                                const maxLimit = typeof MAX_FILE_SIZE_BYTES !== 'undefined' ? MAX_FILE_SIZE_BYTES : (25 * 1024 * 1024);
                                if (file.size > maxLimit) {
                                  showToast(`File size (${(file.size / (1024 * 1024)).toFixed(1)}MB) exceeds maximum limit of 25MB`, 'error');
                                  e.target.value = '';
                                  return;
                                }
                                const ext = (file.name || '').split('.').pop()?.toLowerCase();
                                if (ext !== 'pdf' && !file.type.includes('pdf')) {
                                  showToast('Please select a valid PDF file (.pdf)', 'error');
                                  e.target.value = '';
                                  return;
                                }
                                try {
                                  showToast('Uploading PDF deliverable...');
                                  const asset = await uploadMediaAsset(file);
                                  const url = asset.publicUrl || asset.public_url;
                                  setEditingProduct((prev) => ({ ...prev, file_url: url, downloadUrl: url, file_name: file.name }));
                                  showToast('PDF deliverable attached successfully');
                                } catch (err) {
                                  showToast(`Upload failed: ${err.message}`, 'error');
                                } finally {
                                  e.target.value = '';
                                }
                              }
                            }}
                          />
                        </label>
                        {editingProduct.file_url && (
                          <a
                            href={editingProduct.file_url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="admin-btn-secondary"
                            style={{ fontSize: '0.78rem', padding: '0.4rem 0.75rem', textDecoration: 'none', display: 'inline-flex', alignItems: 'center', gap: '0.35rem' }}
                          >
                            👁️ Preview PDF
                          </a>
                        )}
                      </div>
                      <div style={{ fontSize: '0.75rem', color: editingProduct.file_url ? '#10B981' : '#F59E0B', fontWeight: editingProduct.file_url ? 600 : 700 }}>
                        {editingProduct.file_url
                          ? `✓ Attached: ${editingProduct.file_name || (editingProduct.file_url.startsWith('data:') ? 'PDF Deliverable File' : editingProduct.file_url.split('/').pop())}`
                          : '⚠️ No PDF deliverable attached yet. Public store will show "PDF deliverable is being prepared" and prevent checkout until a file is uploaded.'}
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>
            <div className="admin-modal-footer">
              <button type="button" className="admin-btn-secondary" onClick={() => setIsProductModalOpen(false)}>
                Cancel
              </button>
              <button
                type="button"
                className="admin-btn-primary"
                style={{ width: 'auto' }}
                onClick={async () => {
                  const title = (editingProduct.title || editingProduct.name || '').trim();
                  if (!title) {
                    showToast('Please enter a product title', 'error');
                    return;
                  }
                  try {
                    const payload = {
                      ...editingProduct,
                      title,
                      name: title,
                      stock_status: editingProduct.stock_status || 'in_stock',
                      status: editingProduct.status || 'published',
                    };
                    if (editingProduct.id) {
                      await updateProduct(editingProduct.id, payload);
                      showToast('Product updated successfully');
                    } else {
                      await createProduct(payload);
                      showToast('Product created successfully');
                    }
                    setIsProductModalOpen(false);
                    refreshAllData();
                  } catch (err) {
                    showToast(`Failed to save product: ${err.message}`, 'error');
                  }
                }}
              >
                Save Product
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── 4. POST / BLOG MODAL ── */}
      {isPostModalOpen && editingPost && (
        <div className="admin-modal-backdrop" onClick={() => setIsPostModalOpen(false)}>
          <div className="admin-modal" onClick={(e) => e.stopPropagation()}>
            <div className="admin-modal-header" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '0.75rem' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.85rem' }}>
                <button
                  type="button"
                  className="dealdeck-back-btn"
                  onClick={() => setIsPostModalOpen(false)}
                  title="Close modal and return to dashboard"
                >
                  ← Back to Dashboard
                </button>
                <h3 style={{ margin: 0, fontFamily: 'Lora, serif' }}>
                  {editingPost.id ? 'Edit Article' : 'Write New Article / Newsletter'}
                </h3>
              </div>
              <button
                type="button"
                className="admin-btn-secondary"
                style={{ border: 'none', fontSize: '1.2rem', cursor: 'pointer' }}
                onClick={() => setIsPostModalOpen(false)}
                title="Close"
              >
                ✕
              </button>
            </div>
            <div className="admin-modal-body">
              {/* Title & Slug 2-Column Row */}
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '1.25rem' }}>
                <div className="admin-form-group">
                  <label>Article Title *</label>
                  <input
                    type="text"
                    className="admin-input"
                    placeholder="e.g. Master the Fundamental Movement Patterns"
                    value={editingPost.title || ''}
                    onChange={(e) => {
                      const title = e.target.value;
                      setEditingPost((prev) => ({
                        ...prev,
                        title,
                        slug: prev.slugModified ? prev.slug : title.toLowerCase().trim().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, ''),
                      }));
                    }}
                    required
                  />
                </div>
                <div className="admin-form-group">
                  <label>URL Slug</label>
                  <input
                    type="text"
                    className="admin-input"
                    placeholder="e.g. master-fundamental-movement-patterns"
                    value={editingPost.slug || ''}
                    onChange={(e) => {
                      const val = e.target.value.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '');
                      setEditingPost((prev) => ({
                        ...prev,
                        slug: val,
                        slugModified: true,
                      }));
                    }}
                  />
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1.25rem' }}>
                <div className="admin-form-group">
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.4rem' }}>
                    <label style={{ margin: 0 }}>Category *</label>
                    <button
                      type="button"
                      className="admin-link-btn"
                      onClick={() => setIsCreatingCategory(!isCreatingCategory)}
                    >
                      {isCreatingCategory ? '✕ Cancel' : '+ Custom Category'}
                    </button>
                  </div>
                  <select
                    className="admin-input"
                    value={editingPost.category || 'Framework'}
                    onChange={(e) => {
                      if (e.target.value === '__add_new__') {
                        setIsCreatingCategory(true);
                      } else {
                        setEditingPost((prev) => ({ ...prev, category: e.target.value }));
                      }
                    }}
                  >
                    {categoriesList.map((cat) => (
                      <option key={cat} value={cat}>{cat}</option>
                    ))}
                    <option value="__add_new__">+ Create New Category...</option>
                  </select>

                  {isCreatingCategory && (
                    <div className="admin-category-creator-box">
                      <input
                        type="text"
                        className="admin-input"
                        style={{ flex: 1, minWidth: '130px', padding: '0.35rem 0.6rem', fontSize: '0.82rem' }}
                        placeholder="New category name (e.g. Workouts)..."
                        value={newCategoryName}
                        onChange={(e) => setNewCategoryName(e.target.value)}
                        onKeyDown={(e) => {
                          if (e.key === 'Enter') {
                            e.preventDefault();
                            handleCreateCategory();
                          }
                        }}
                      />
                      <button
                        type="button"
                        className="admin-btn-primary"
                        style={{ padding: '0.35rem 0.75rem', fontSize: '0.78rem', width: 'auto' }}
                        onClick={handleCreateCategory}
                      >
                        Save
                      </button>
                      <button
                        type="button"
                        className="admin-btn-secondary"
                        style={{ padding: '0.35rem 0.6rem', fontSize: '0.78rem' }}
                        onClick={() => {
                          setIsCreatingCategory(false);
                          setNewCategoryName('');
                        }}
                      >
                        Cancel
                      </button>
                    </div>
                  )}
                </div>

                <div className="admin-form-group">
                  <label>Publication Date</label>
                  <input
                    type="text"
                    className="admin-input"
                    value={editingPost.published_date || editingPost.date || ''}
                    onChange={(e) => setEditingPost((prev) => ({ ...prev, published_date: e.target.value, date: e.target.value }))}
                  />
                </div>
                <div className="admin-form-group">
                  <label>Read Time</label>
                  <input
                    type="text"
                    className="admin-input"
                    value={editingPost.read_time || editingPost.readTime || ''}
                    onChange={(e) => setEditingPost((prev) => ({ ...prev, read_time: e.target.value, readTime: e.target.value }))}
                  />
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '1.25rem' }}>
                <div className="admin-form-group">
                  <label>Summary (Card &amp; Search Teaser)</label>
                  <textarea
                    className="admin-input"
                    rows={2}
                    placeholder="Short summary displayed on cards..."
                    value={editingPost.summary || ''}
                    onChange={(e) => setEditingPost((prev) => ({ ...prev, summary: e.target.value }))}
                  />
                </div>
                <div className="admin-form-group">
                  <label>Excerpt (Key Takeaway / Opening Hook)</label>
                  <textarea
                    className="admin-input"
                    rows={2}
                    placeholder="Key excerpt or teaser quote..."
                    value={editingPost.excerpt || ''}
                    onChange={(e) => setEditingPost((prev) => ({ ...prev, excerpt: e.target.value }))}
                  />
                </div>
              </div>

              {/* ── ARTICLE MEDIA & THUMBNAIL MANAGER ── */}
              <div className="admin-media-box">
                <div className="admin-media-box-header">
                  <h4 style={{ margin: 0, fontSize: '0.92rem', fontWeight: 700, color: 'var(--admin-black)' }}>
                    Article Thumbnail &amp; Featured Media
                  </h4>
                  <p style={{ margin: '0.2rem 0 0', fontSize: '0.78rem', color: 'var(--admin-text-muted)' }}>
                    Upload or paste an image thumbnail, choose from the media library, or attach a video (MP4, MOV, YouTube, Vimeo).
                  </p>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '1.25rem' }}>
                  {/* 1. THUMBNAIL IMAGE */}
                  <div className="admin-media-subcard">
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.5rem' }}>
                      <label style={{ fontSize: '0.82rem', fontWeight: 700, color: 'var(--admin-black)', margin: 0 }}>
                        1. Cover Thumbnail Image
                      </label>
                      {(editingPost.thumbnail_url || editingPost.thumbnail) && (
                        <button
                          type="button"
                          className="admin-btn-text-danger"
                          onClick={() => setEditingPost((prev) => ({ ...prev, thumbnail_url: '', thumbnail: '' }))}
                        >
                          Remove Image
                        </button>
                      )}
                    </div>

                    <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '0.65rem', flexWrap: 'wrap' }}>
                      <label
                        className="admin-btn-secondary"
                        style={{ cursor: 'pointer', fontSize: '0.78rem', padding: '0.4rem 0.75rem', display: 'inline-flex', alignItems: 'center', gap: '0.35rem' }}
                      >
                        <span>📁 Upload Image</span>
                        <input
                          type="file"
                          accept="image/*"
                          style={{ display: 'none' }}
                          onChange={async (e) => {
                            const file = e.target.files && e.target.files[0];
                            if (file) {
                              try {
                                showToast('Uploading thumbnail image...', 'info');
                                const asset = await uploadMediaAsset(file);
                                const url = asset.publicUrl || asset.public_url;
                                setEditingPost((prev) => ({
                                  ...prev,
                                  thumbnail_url: url,
                                  thumbnail: url,
                                }));
                                showToast('Thumbnail uploaded successfully');
                              } catch (err) {
                                showToast(`Upload failed: ${err.message}`, 'error');
                              } finally {
                                e.target.value = '';
                              }
                            }
                          }}
                        />
                      </label>

                      {mediaList.length > 0 && (
                        <button
                          type="button"
                          className="admin-btn-secondary"
                          style={{ fontSize: '0.78rem', padding: '0.4rem 0.75rem' }}
                          onClick={() => {
                            setMediaPickerTarget('post_thumbnail');
                            setIsMediaPickerOpen(true);
                          }}
                        >
                          Choose from Library
                        </button>
                      )}
                    </div>

                    <div className="admin-form-group" style={{ marginBottom: '0.65rem' }}>
                      <input
                        type="text"
                        className="admin-input"
                        placeholder="Or enter image URL / assets path..."
                        style={{ fontSize: '0.8rem', padding: '0.4rem 0.65rem' }}
                        value={editingPost.thumbnail_url || editingPost.thumbnail || ''}
                        onChange={(e) => {
                          const val = e.target.value;
                          setEditingPost((prev) => ({ ...prev, thumbnail_url: val, thumbnail: val }));
                        }}
                      />
                    </div>

                    {/* Thumbnail Preview Box */}
                    <div style={{ marginTop: '0.5rem' }}>
                      {(editingPost.thumbnail_url || editingPost.thumbnail) ? (
                        <div style={{ position: 'relative', width: '100%', height: '140px', borderRadius: '4px', overflow: 'hidden', border: '1px solid #E5E7EB', background: '#F3F4F6' }}>
                          <img
                            src={editingPost.thumbnail_url || editingPost.thumbnail}
                            alt="Thumbnail Preview"
                            style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }}
                            onError={(e) => {
                              e.currentTarget.src = '/assets/author-photo.png';
                            }}
                          />
                          <span style={{ position: 'absolute', bottom: '6px', left: '6px', background: 'rgba(0,0,0,0.7)', color: '#FFF', fontSize: '0.68rem', padding: '2px 6px', borderRadius: '3px', fontWeight: 600 }}>
                            Thumbnail Active
                          </span>
                        </div>
                      ) : (
                        <div style={{ padding: '1.25rem 0.75rem', textAlign: 'center', border: '1px dashed #D1D5DB', borderRadius: '4px', color: 'var(--admin-text-muted)', fontSize: '0.78rem' }}>
                          No image selected. Default photo will be used if left empty.
                        </div>
                      )}
                    </div>
                  </div>

                  {/* 2. FEATURED VIDEO */}
                  <div className="admin-media-subcard">
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.5rem' }}>
                      <label style={{ fontSize: '0.82rem', fontWeight: 700, color: 'var(--admin-black)', margin: 0 }}>
                        2. Featured Video (Optional)
                      </label>
                      {(editingPost.video_url || editingPost.videoUrl) && (
                        <button
                          type="button"
                          className="admin-btn-text-danger"
                          onClick={() => setEditingPost((prev) => ({ ...prev, video_url: '', videoUrl: '', video_storage_id: '', video_storage_ref: '' }))}
                        >
                          Remove Video
                        </button>
                      )}
                    </div>

                    <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '0.65rem', flexWrap: 'wrap' }}>
                      <label
                        className="admin-btn-secondary"
                        style={{ cursor: 'pointer', fontSize: '0.78rem', padding: '0.4rem 0.75rem', display: 'inline-flex', alignItems: 'center', gap: '0.35rem' }}
                      >
                        <span>🎥 Upload Video Clip</span>
                        <input
                          type="file"
                          accept="video/*,.mp4,.mov,.webm,.m4v,.ogv,.mkv"
                          style={{ display: 'none' }}
                          onChange={async (e) => {
                            const file = e.target.files && e.target.files[0];
                            if (file) {
                              try {
                                showToast(`Uploading video (${(file.size / (1024 * 1024)).toFixed(1)}MB)...`, 'info');
                                const asset = await uploadMediaAsset(file);
                                const url = asset.publicUrl || asset.public_url;
                                setEditingPost((prev) => ({
                                  ...prev,
                                  video_url: url,
                                  videoUrl: url,
                                  video_storage_id: asset.idbKey || asset.id,
                                  video_storage_ref: asset.storageRef || `idb:${asset.id}`,
                                }));
                                showToast('Video attached successfully');
                              } catch (err) {
                                showToast(`Video upload failed: ${err.message}`, 'error');
                              } finally {
                                e.target.value = '';
                              }
                            }
                          }}
                        />
                      </label>
                    </div>

                    <div className="admin-form-group" style={{ marginBottom: '0.65rem' }}>
                      <input
                        type="text"
                        className="admin-input"
                        placeholder="Paste YouTube, Vimeo, MP4, or MOV video URL..."
                        style={{ fontSize: '0.8rem', padding: '0.4rem 0.65rem' }}
                        value={editingPost.video_url || editingPost.videoUrl || ''}
                        onChange={(e) => {
                          const val = e.target.value;
                          setEditingPost((prev) => ({ ...prev, video_url: val, videoUrl: val }));
                        }}
                      />
                    </div>

                    {/* Video Live Preview */}
                    <div style={{ marginTop: '0.5rem' }}>
                      {(editingPost.video_url || editingPost.videoUrl) ? (
                        <div style={{ borderRadius: '4px', overflow: 'hidden', border: '1px solid #E5E7EB', background: '#000' }}>
                          <ArticleVideoPlayer
                            videoUrl={editingPost.video_url || editingPost.videoUrl}
                            title={editingPost.title || 'Video Preview'}
                            style={{ marginBottom: 0, height: '140px' }}
                          />
                        </div>
                      ) : (
                        <div style={{ padding: '1.25rem 0.75rem', textAlign: 'center', border: '1px dashed #D1D5DB', borderRadius: '4px', color: 'var(--admin-text-muted)', fontSize: '0.78rem' }}>
                          No video attached. Add a YouTube, Vimeo, MP4, or MOV link to show an interactive video player.
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </div>

              <div className="admin-form-group">
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.5rem' }}>
                  <label style={{ margin: 0, fontWeight: 700 }}>Article Content (Markdown)</label>
                  <div style={{ display: 'flex', gap: '4px' }}>
                    <button
                      type="button"
                      data-tab="write"
                      className={`dealdeck-view-btn ${articleEditorTab === 'write' ? 'active' : ''}`}
                      onClick={() => setArticleEditorTab('write')}
                      style={{ padding: '3px 10px', fontSize: '0.78rem' }}
                    >
                      ✏️ Write
                    </button>
                    <button
                      type="button"
                      data-tab="preview"
                      className={`dealdeck-view-btn ${articleEditorTab === 'preview' ? 'active' : ''}`}
                      onClick={() => setArticleEditorTab('preview')}
                      style={{ padding: '3px 10px', fontSize: '0.78rem' }}
                    >
                      👁️ Preview
                    </button>
                  </div>
                </div>

                {articleEditorTab === 'write' ? (
                  <div>
                    {/* Markdown Formatting Toolbar */}
                    <div style={{ display: 'flex', gap: '4px', padding: '6px 8px', background: '#F3F4F6', border: '1px solid #D1D5DB', borderBottom: 'none', borderRadius: '4px 4px 0 0', flexWrap: 'wrap' }}>
                      {[
                        { label: 'B', tag: '**', wrap: true, title: 'Bold' },
                        { label: 'I', tag: '*', wrap: true, title: 'Italic' },
                        { label: 'H2', insert: '\n## ', title: 'Heading 2' },
                        { label: 'H3', insert: '\n### ', title: 'Heading 3' },
                        { label: '“ Quote', insert: '\n> ', title: 'Blockquote' },
                        { label: '• List', insert: '\n- ', title: 'Bullet List' },
                        { label: '🔗 Link', insert: '[link text](https://)', title: 'Link' },
                        { label: '` Code', tag: '`', wrap: true, title: 'Code' },
                      ].map((tool) => (
                        <button
                          key={tool.label}
                          type="button"
                          className="admin-btn-secondary"
                          style={{ padding: '2px 8px', fontSize: '0.75rem', fontWeight: 700 }}
                          title={tool.title}
                          onClick={() => {
                            const textarea = document.getElementById('article-content-textarea');
                            if (!textarea) return;
                            const start = textarea.selectionStart;
                            const end = textarea.selectionEnd;
                            const text = editingPost.content || '';
                            let updated = text;
                            let nextCursor = start;
                            if (tool.wrap) {
                              const selected = text.slice(start, end) || 'text';
                              updated = text.slice(0, start) + `${tool.tag}${selected}${tool.tag}` + text.slice(end);
                              nextCursor = start + tool.tag.length + selected.length + tool.tag.length;
                            } else if (tool.insert) {
                              updated = text.slice(0, start) + tool.insert + text.slice(end);
                              nextCursor = start + tool.insert.length;
                            }
                            setEditingPost((prev) => ({ ...prev, content: updated }));
                            requestAnimationFrame(() => {
                              if (textarea) {
                                textarea.focus();
                                textarea.setSelectionRange(nextCursor, nextCursor);
                              }
                            });
                          }}
                        >
                          {tool.label}
                        </button>
                      ))}
                    </div>
                    <textarea
                      id="article-content-textarea"
                      className="admin-input"
                      style={{ borderRadius: '0 0 4px 4px', borderTop: 'none', fontFamily: 'monospace', fontSize: '0.88rem', lineHeight: '1.5' }}
                      rows={12}
                      value={editingPost.content || ''}
                      onChange={(e) => setEditingPost((prev) => ({ ...prev, content: e.target.value }))}
                      placeholder="Write article content using Markdown (# Heading, **bold**, *italic*, - list, > quote)..."
                    />
                  </div>
                ) : (
                  <div
                    style={{
                      padding: '1.25rem',
                      background: '#FFFFFF',
                      border: '1px solid #D1D5DB',
                      borderRadius: '4px',
                      minHeight: '260px',
                      maxHeight: '400px',
                      overflowY: 'auto',
                    }}
                    dangerouslySetInnerHTML={{
                      __html: DOMPurify.sanitize(parseMarkdownToHtml(editingPost.content || '*No content written yet.*'), {
                        ALLOWED_TAGS: [
                          'p', 'br', 'strong', 'b', 'em', 'i', 'u', 's', 'h1', 'h2', 'h3', 'h4', 'h5', 'h6',
                          'ul', 'ol', 'li', 'blockquote', 'a', 'img', 'hr', 'code', 'pre', 'span', 'div'
                        ],
                        ALLOWED_ATTR: ['href', 'src', 'alt', 'title', 'class', 'style', 'target', 'rel'],
                      }),
                    }}
                  />
                )}
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '1.25rem' }}>
                <div className="admin-form-group">
                  <label>SEO Meta Title</label>
                  <input
                    type="text"
                    className="admin-input"
                    value={editingPost.seo_title || ''}
                    onChange={(e) => setEditingPost((prev) => ({ ...prev, seo_title: e.target.value }))}
                  />
                </div>
                <div className="admin-form-group">
                  <label>Publication Status</label>
                  <select
                    className="admin-input"
                    value={editingPost.status || 'published'}
                    onChange={(e) => setEditingPost((prev) => ({ ...prev, status: e.target.value }))}
                  >
                    <option value="published">Published (Visible in Archive)</option>
                    <option value="draft">Draft (Private in CMS)</option>
                  </select>
                </div>
              </div>

              {/* Featured On Homepage Settings */}
              <div
                style={{
                  background: '#FFF9F0',
                  border: '1px solid #FFE0B2',
                  borderRadius: '10px',
                  padding: '1rem 1.25rem',
                  marginTop: '1rem',
                  marginBottom: '1rem',
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '1rem' }}>
                  <div>
                    <label style={{ margin: 0, fontWeight: 700, fontSize: '0.92rem', color: '#111827', display: 'flex', alignItems: 'center', gap: '6px' }}>
                      <span>⭐ Feature on Homepage</span>
                    </label>
                    <p style={{ margin: '4px 0 0', fontSize: '0.8rem', color: '#6B7280' }}>
                      Pin this article to the top of the homepage "From The Blog" section.
                    </p>
                  </div>
                  <input
                    type="checkbox"
                    checked={Boolean(editingPost.featured)}
                    onChange={(e) => {
                      setEditingPost((prev) => ({
                        ...prev,
                        featured: e.target.checked,
                        featured_order: prev.featured_order || 1,
                      }));
                    }}
                    style={{ width: '22px', height: '22px', cursor: 'pointer', accentColor: 'var(--admin-orange)' }}
                  />
                </div>

                {editingPost.featured && (
                  <div style={{ marginTop: '0.85rem', paddingTop: '0.75rem', borderTop: '1px solid #FFE0B2', display: 'flex', alignItems: 'center', gap: '12px' }}>
                    <label style={{ fontSize: '0.84rem', fontWeight: 600, color: '#374151', margin: 0 }}>
                      Homepage Order:
                    </label>
                    <input
                      type="number"
                      min="1"
                      max="10"
                      value={editingPost.featured_order || 1}
                      onChange={(e) => {
                        setEditingPost((prev) => ({
                          ...prev,
                          featured_order: parseInt(e.target.value) || 1,
                        }));
                      }}
                      style={{ width: '70px', padding: '5px 10px', borderRadius: '6px', border: '1px solid #D1D5DB', fontWeight: 700 }}
                    />
                    <span style={{ fontSize: '0.78rem', color: '#6B7280' }}>
                      (Slot #1 appears first in the top blog row)
                    </span>
                  </div>
                )}
              </div>
            </div>
            <div className="admin-modal-footer">
              <button
                type="button"
                className="admin-btn-secondary"
                disabled={isSavingArticle}
                onClick={() => setIsPostModalOpen(false)}
              >
                Cancel
              </button>
              <button
                type="button"
                className="admin-btn-primary"
                style={{ width: 'auto' }}
                disabled={isSavingArticle}
                onClick={async () => {
                  if (!editingPost.title || !editingPost.title.trim()) {
                    showToast('Please enter an article title', 'error');
                    return;
                  }
                  try {
                    setIsSavingArticle(true);
                    if (editingPost.id) {
                      const updated = await updatePost(editingPost.id, editingPost);
                      if (!updated) throw new Error('Database update returned null');
                      showToast('Article updated successfully');
                    } else {
                      const created = await createPost(editingPost);
                      if (!created) throw new Error('Database insert returned null');
                      showToast('Article created successfully');
                    }
                    setIsPostModalOpen(false);
                    refreshAllData();
                  } catch (err) {
                    showToast(`Failed to save article: ${err.message}`, 'error');
                  } finally {
                    setIsSavingArticle(false);
                  }
                }}
              >
                {isSavingArticle ? 'Saving...' : 'Save Article'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── 4B. MEDIA ASSET PICKER MODAL ── */}
      {isMediaPickerOpen && (
        <div className="admin-modal-backdrop" onClick={() => setIsMediaPickerOpen(false)}>
          <div className="admin-modal" style={{ maxWidth: '580px' }} onClick={(e) => e.stopPropagation()}>
            <div className="admin-modal-header">
              <h3 style={{ margin: 0, fontFamily: 'Lora, serif' }}>Choose from Media Library</h3>
              <button
                type="button"
                className="admin-btn-secondary"
                style={{ border: 'none', fontSize: '1.2rem' }}
                onClick={() => setIsMediaPickerOpen(false)}
              >
                ✕
              </button>
            </div>
            <div className="admin-modal-body">
              <p style={{ margin: '0 0 1rem 0', fontSize: '0.82rem', color: 'var(--admin-text-muted)' }}>
                {mediaPickerTarget === 'product_cover'
                  ? 'Select any existing asset from your media library to set as the product cover artwork.'
                  : 'Select any existing asset from your media library to set as the thumbnail.'}
              </p>
              <div className="admin-media-picker-grid">
                {mediaList.map((asset) => {
                  const assetUrl = asset.publicUrl || asset.public_url || asset.filePath;
                  const isSelected =
                    mediaPickerTarget === 'product_cover'
                      ? editingProduct && (editingProduct.cover_image_url === assetUrl || editingProduct.image_url === assetUrl)
                      : editingPost && (editingPost.thumbnail_url === assetUrl || editingPost.thumbnail === assetUrl);
                  return (
                    <div
                      key={asset.id}
                      className={`admin-media-picker-item ${isSelected ? 'selected' : ''}`}
                      onClick={() => {
                        if (mediaPickerTarget === 'product_cover' && editingProduct) {
                          setEditingProduct({
                            ...editingProduct,
                            cover_image_url: assetUrl,
                            image_url: assetUrl,
                          });
                          showToast('Product cover selected from library');
                        } else if (editingPost) {
                          setEditingPost({
                            ...editingPost,
                            thumbnail_url: assetUrl,
                            thumbnail: assetUrl,
                          });
                          showToast('Thumbnail selected from library');
                        }
                        setIsMediaPickerOpen(false);
                      }}
                      title={asset.name}
                    >
                      <img
                        src={assetUrl}
                        alt={asset.altText || asset.name}
                        onError={(e) => { e.currentTarget.src = '/assets/author-photo.png'; }}
                      />
                    </div>
                  );
                })}
              </div>
            </div>
            <div className="admin-modal-footer">
              <button
                type="button"
                className="admin-btn-secondary"
                onClick={() => setIsMediaPickerOpen(false)}
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── 5. LEAD DETAILS MODAL ── */}
      {viewingLead && (
        <div className="admin-modal-backdrop" onClick={() => setViewingLead(null)}>
          <div className="admin-modal" onClick={(e) => e.stopPropagation()}>
            <div className="admin-modal-header">
              <h3 style={{ margin: 0, fontFamily: 'Lora, serif' }}>CRM Lead & Attribution Dossier</h3>
              <button
                type="button"
                className="admin-btn-secondary"
                style={{ border: 'none', fontSize: '1.2rem' }}
                onClick={() => setViewingLead(null)}
              >
                ✕
              </button>
            </div>
            <div className="admin-modal-body">
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1.25rem', marginBottom: '1.5rem' }}>
                <div>
                  <div style={{ fontSize: '0.75rem', fontWeight: 700, textTransform: 'uppercase', color: 'var(--admin-text-muted)' }}>Lead Name</div>
                  <div style={{ fontSize: '1.05rem', fontWeight: 700 }}>{viewingLead.name || 'Not provided'}</div>
                </div>
                <div>
                  <div style={{ fontSize: '0.75rem', fontWeight: 700, textTransform: 'uppercase', color: 'var(--admin-text-muted)' }}>Email</div>
                  <div style={{ fontSize: '1.05rem', fontWeight: 700, color: 'var(--admin-orange)' }}>{viewingLead.email}</div>
                </div>
                <div>
                  <div style={{ fontSize: '0.75rem', fontWeight: 700, textTransform: 'uppercase', color: 'var(--admin-text-muted)' }}>Source Type</div>
                  <div style={{ fontSize: '1.05rem', fontWeight: 700 }}>
                    {viewingLead.lead_type === 'contact_inquiry' ? 'Work With Me Consultation' : 'Newsletter Subscriber'}
                  </div>
                </div>
              </div>

              {viewingLead.primary_goal && (
                <div style={{ marginBottom: '1.25rem' }}>
                  <div style={{ fontSize: '0.75rem', fontWeight: 700, textTransform: 'uppercase', color: 'var(--admin-text-muted)' }}>Primary Goal</div>
                  <div style={{ fontSize: '0.95rem', background: '#F9FAFB', padding: '0.75rem', borderRadius: '4px' }}>
                    {viewingLead.primary_goal}
                  </div>
                </div>
              )}

              {viewingLead.message && (
                <div style={{ marginBottom: '1.5rem' }}>
                  <div style={{ fontSize: '0.75rem', fontWeight: 700, textTransform: 'uppercase', color: 'var(--admin-text-muted)' }}>Inquiry Message</div>
                  <div style={{ fontSize: '0.95rem', background: '#F9FAFB', padding: '0.75rem', borderRadius: '4px', whiteSpace: 'pre-wrap' }}>
                    {viewingLead.message}
                  </div>
                </div>
              )}

              <h4 style={{ fontFamily: 'var(--font-main)', fontSize: '1.05rem', borderBottom: '1px solid var(--admin-border)', paddingBottom: '0.4rem', marginBottom: '1rem' }}>
                Campaign & Attribution Telemetry
              </h4>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '0.85rem', fontSize: '0.85rem' }}>
                <div><strong>UTM Source:</strong> {viewingLead.utm_source || 'direct'}</div>
                <div><strong>UTM Medium:</strong> {viewingLead.utm_medium || 'none'}</div>
                <div><strong>UTM Campaign:</strong> {viewingLead.utm_campaign || 'none'}</div>
                <div><strong>Landing Page:</strong> {viewingLead.landing_page || '/'}</div>
                <div><strong>Referrer:</strong> {viewingLead.referrer || 'direct'}</div>
                <div><strong>Timestamp:</strong> {new Date(viewingLead.created_at).toLocaleString()}</div>
              </div>
            </div>
            <div className="admin-modal-footer">
              <button type="button" className="admin-btn-secondary" onClick={() => setViewingLead(null)}>
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── 6. DELETE CONFIRMATION MODAL ── */}
      {deleteConfirmTarget && (
        <div className="admin-modal-backdrop" onClick={() => setDeleteConfirmTarget(null)}>
          <div className="admin-modal" style={{ maxWidth: '440px' }} onClick={(e) => e.stopPropagation()}>
            <div className="admin-modal-header">
              <h3 style={{ margin: 0, fontFamily: 'var(--font-main)', color: '#DC2626' }}>Confirm Deletion</h3>
            </div>
            <div className="admin-modal-body">
              <p style={{ margin: 0, fontSize: '0.92rem', lineHeight: 1.5 }}>
                Are you sure you want to delete <strong>{deleteConfirmTarget.name}</strong>? This action cannot be undone.
              </p>
            </div>
            <div className="admin-modal-footer">
              <button type="button" className="admin-btn-secondary" onClick={() => setDeleteConfirmTarget(null)}>
                Cancel
              </button>
              <button
                type="button"
                className="admin-btn-primary"
                style={{ background: '#DC2626', width: 'auto' }}
                onClick={async () => {
                  if (deleteConfirmTarget.type === 'product') {
                    await deleteProduct(deleteConfirmTarget.id);
                    showToast('Product deleted');
                  } else if (deleteConfirmTarget.type === 'post') {
                    await deletePost(deleteConfirmTarget.id);
                    showToast('Article deleted');
                  } else if (deleteConfirmTarget.type === 'media') {
                    await deleteMediaAsset(deleteConfirmTarget.id);
                    showToast('Media asset removed');
                  }
                  setDeleteConfirmTarget(null);
                  refreshAllData();
                }}
              >
                Delete Permanently
              </button>
            </div>
          </div>
        </div>
      )}
      {/* ── 7. PROFILE & PHOTO MODAL ── */}
      {isProfileModalOpen && (
        <div className="admin-modal-backdrop" onClick={() => setIsProfileModalOpen(false)}>
          <div className="admin-modal" style={{ maxWidth: '520px' }} onClick={(e) => e.stopPropagation()}>
            <div className="admin-modal-header" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '0.75rem' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.85rem' }}>
                <button
                  type="button"
                  className="dealdeck-back-btn"
                  onClick={() => setIsProfileModalOpen(false)}
                  title="Close modal and return to dashboard"
                >
                  ← Back to Dashboard
                </button>
                <h3 style={{ margin: 0, fontFamily: 'Lora, serif' }}>Update Admin Profile &amp; Photo</h3>
              </div>
              <button
                type="button"
                className="admin-btn-secondary"
                style={{ border: 'none', fontSize: '1.2rem', padding: '0.25rem 0.5rem', cursor: 'pointer' }}
                onClick={() => setIsProfileModalOpen(false)}
                title="Close"
              >
                ✕
              </button>
            </div>
            <div className="admin-modal-body">
              {/* Photo Upload & Preview Center */}
              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', marginBottom: '1.75rem' }}>
                <div style={{ position: 'relative', width: '108px', height: '108px', marginBottom: '1rem' }}>
                  <img
                    src={profileForm.photoUrl || 'assets/author-photo.png'}
                    alt="Profile Preview"
                    style={{
                      width: '108px',
                      height: '108px',
                      borderRadius: '50%',
                      objectFit: 'cover',
                      border: '3.5px solid #FF6200',
                      boxShadow: '0 6px 18px rgba(255, 98, 0, 0.25)',
                    }}
                    onError={(e) => { e.currentTarget.src = '/assets/avatar.png'; }}
                  />
                  <label
                    htmlFor="profilePhotoFileInput"
                    style={{
                      position: 'absolute',
                      bottom: '2px',
                      right: '2px',
                      backgroundColor: '#212121',
                      color: '#FFFFFF',
                      width: '32px',
                      height: '32px',
                      borderRadius: '50%',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      cursor: 'pointer',
                      border: '2px solid #FFFFFF',
                      boxShadow: '0 2px 6px rgba(0,0,0,0.3)',
                      fontSize: '0.9rem',
                    }}
                    title="Upload New Photo"
                  >
                    📷
                  </label>
                  <input
                    type="file"
                    id="profilePhotoFileInput"
                    accept="image/*"
                    style={{ display: 'none' }}
                    onChange={handleProfilePhotoUpload}
                  />
                </div>

                <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap', justifyContent: 'center' }}>
                  <button
                    type="button"
                    className="admin-btn-primary"
                    style={{ fontSize: '0.8rem', padding: '0.4rem 0.85rem', width: 'auto', borderRadius: '6px' }}
                    onClick={() => document.getElementById('profilePhotoFileInput')?.click()}
                  >
                    📷 Upload Custom Photo
                  </button>
                  <button
                    type="button"
                    className="admin-btn-secondary"
                    style={{ fontSize: '0.8rem', padding: '0.4rem 0.85rem', borderRadius: '6px' }}
                    onClick={() => {
                      setProfileForm((p) => ({ ...p, photoUrl: 'assets/author-photo.png' }));
                      showToast('Selected Author portrait');
                    }}
                  >
                    Use Portrait
                  </button>
                  <button
                    type="button"
                    className="admin-btn-secondary"
                    style={{ fontSize: '0.8rem', padding: '0.4rem 0.85rem', borderRadius: '6px' }}
                    onClick={() => {
                      setProfileForm((p) => ({ ...p, photoUrl: 'assets/avatar.png' }));
                      showToast('Selected Avatar preset');
                    }}
                  >
                    Use Avatar
                  </button>
                </div>
              </div>

              {/* Profile Details Form */}
              <div className="admin-form-group">
                <label>Admin Full Name</label>
                <input
                  type="text"
                  className="admin-input"
                  value={profileForm.fullName}
                  onChange={(e) => setProfileForm((p) => ({ ...p, fullName: e.target.value }))}
                  placeholder="Abhi Singh"
                />
              </div>

              <div className="admin-form-group">
                <label>Admin Role / Title</label>
                <input
                  type="text"
                  className="admin-input"
                  value={profileForm.role}
                  onChange={(e) => setProfileForm((p) => ({ ...p, role: e.target.value }))}
                  placeholder="Admin store"
                />
              </div>

              <div className="admin-form-group">
                <label>Custom Photo URL</label>
                <input
                  type="text"
                  className="admin-input"
                  value={profileForm.photoUrl}
                  onChange={(e) => setProfileForm((p) => ({ ...p, photoUrl: e.target.value }))}
                  placeholder="assets/author-photo.png or https://..."
                />
              </div>
            </div>
            <div className="admin-modal-footer" style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem' }}>
              <button
                type="button"
                className="admin-btn-secondary"
                onClick={() => setIsProfileModalOpen(false)}
              >
                Cancel
              </button>
              <button
                type="button"
                className="admin-btn-primary"
                style={{ width: 'auto', padding: '0.55rem 1.4rem' }}
                onClick={handleSaveProfile}
              >
                💾 Save Profile Photo
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
