import React, { useState, useEffect, useMemo } from 'react';
import './AdminDashboard.css';
import {
  getProducts,
  createProduct,
  updateProduct,
  deleteProduct,
  getPosts,
  createPost,
  updatePost,
  deletePost,
  getMediaAssets,
  uploadMediaAsset,
  deleteMediaAsset,
  getLeads,
  updateLeadStatus,
  deleteLead,
  getSiteContent,
  updateSiteContent,
  getDashboardMetrics,
  getOrders,
  updateOrder,
  deleteOrder,
  adminLogin,
  adminLogout,
  getAdminSession,
} from '../services/db';
import { sendProductDeliveryEmail } from '../services/emailDelivery';
import { isSupabaseConfigured } from '../services/supabase';
import {
  getApiSettings,
  saveApiSettings,
  testSupabaseConnection,
  testRazorpayCredentials,
  testPayPalCredentials,
  testZohoCampaigns,
  testResendCredentials,
} from '../services/settings';

export default function AdminDashboardApp() {
  const [session, setSession] = useState(getAdminSession());
  const [activeTab, setActiveTab] = useState('overview'); // overview | products | blog | media | content | leads | settings
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [notification, setNotification] = useState(null);

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

  // Data states
  const [metrics, setMetrics] = useState(null);
  const [productsList, setProductsList] = useState([]);
  const [postsList, setPostsList] = useState([]);
  const [mediaList, setMediaList] = useState([]);
  const [leadsList, setLeadsList] = useState([]);
  const [ordersList, setOrdersList] = useState([]);
  const [orderSearch, setOrderSearch] = useState('');
  const [orderStatusFilter, setOrderStatusFilter] = useState('all');
  const [isResendingEmailId, setIsResendingEmailId] = useState(null);
  const [selectedOrderDetails, setSelectedOrderDetails] = useState(null);
  const [siteContent, setSiteContentState] = useState(null);

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

  // Search & Filters
  const [productSearch, setProductSearch] = useState('');
  const [productStatusFilter, setProductStatusFilter] = useState('all');
  const [postSearch, setPostSearch] = useState('');
  const [postCategoryFilter, setPostCategoryFilter] = useState('all');
  const [leadSearch, setLeadSearch] = useState('');
  const [leadTypeFilter, setLeadTypeFilter] = useState('all');

  // Trigger toast notification
  const showToast = (message, type = 'success') => {
    setNotification({ message, type });
    setTimeout(() => setNotification(null), 3500);
  };

  // Refresh data
  const refreshAllData = async () => {
    if (!session) return;
    setLoading(true);
    try {
      const [m, prods, posts, media, leads, content, orders] = await Promise.all([
        getDashboardMetrics(),
        getProducts(true),
        getPosts(true),
        getMediaAssets(),
        getLeads(),
        getSiteContent(),
        getOrders(),
      ]);
      setMetrics(m);
      setProductsList(prods);
      setPostsList(posts);
      setMediaList(media);
      setLeadsList(leads);
      setSiteContentState(content);
      setOrdersList(orders || []);
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

  const handleLogoutClick = async () => {
    await adminLogout();
    setSession(null);
    showToast('Signed out securely');
  };

  // ==========================================================================
  // VIEW: LOGIN SCREEN
  // ==========================================================================
  if (!session) {
    return (
      <div className="admin-body admin-login-wrap">
        <div className="admin-login-card">
          <div className="admin-login-brand">
            <div className="admin-login-avatar">
              <img src="assets/avatar.png" alt="Abhi Singh" />
            </div>
            <div>
              <h1 className="admin-login-title">Abhi Singh CMS</h1>
              <span className="admin-brand-sub">Admin Authentication</span>
            </div>
          </div>

          <p className="admin-login-subtitle">
            Sign in with authorized administrator credentials to manage products, articles, media, and CRM leads.
          </p>

          {loginError && (
            <div style={{ background: '#FEE2E2', color: '#991B1B', padding: '0.75rem', borderRadius: '4px', marginBottom: '1.25rem', fontSize: '0.85rem' }}>
              {loginError}
            </div>
          )}

          <form onSubmit={handleLoginSubmit}>
            <div className="admin-form-group">
              <label>Admin Email</label>
              <input
                type="email"
                className="admin-input"
                placeholder="abhi@abhisingh.me"
                value={loginEmail}
                onChange={(e) => setLoginEmail(e.target.value)}
                required
              />
            </div>

            <div className="admin-form-group">
              <label>Password</label>
              <input
                type="password"
                className="admin-input"
                placeholder="••••••••"
                value={loginPassword}
                onChange={(e) => setLoginPassword(e.target.value)}
                required
              />
            </div>

            <button type="submit" className="admin-btn-primary" disabled={loading}>
              {loading ? 'Authenticating...' : 'Sign In to Dashboard →'}
            </button>
          </form>
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

      {/* ── 1. SIDEBAR ── */}
      <aside className={`admin-sidebar ${sidebarOpen ? 'open' : ''}`}>
        <div className="admin-sidebar-header">
          <div className="admin-sidebar-brand">
            <div className="admin-sidebar-logo">
              <img src="assets/avatar.png" alt="Abhi Singh" />
            </div>
            <div>
              <span className="admin-brand-text">Abhi Singh</span>
              <span className="admin-brand-sub">E.L.R.x CMS</span>
            </div>
          </div>
        </div>

        <nav className="admin-sidebar-nav">
          <button
            type="button"
            className={`admin-nav-item ${activeTab === 'overview' ? 'active' : ''}`}
            onClick={() => { setActiveTab('overview'); setSidebarOpen(false); }}
          >
            <span className="admin-nav-icon">📊</span>
            Overview
          </button>
          <button
            type="button"
            className={`admin-nav-item ${activeTab === 'products' ? 'active' : ''}`}
            onClick={() => { setActiveTab('products'); setSidebarOpen(false); }}
          >
            <span className="admin-nav-icon">📦</span>
            Products & Store
          </button>
          <button
            type="button"
            className={`admin-nav-item ${activeTab === 'blog' ? 'active' : ''}`}
            onClick={() => { setActiveTab('blog'); setSidebarOpen(false); }}
          >
            <span className="admin-nav-icon">✍️</span>
            Blog & Archive
          </button>
          <button
            type="button"
            className={`admin-nav-item ${activeTab === 'media' ? 'active' : ''}`}
            onClick={() => { setActiveTab('media'); setSidebarOpen(false); }}
          >
            <span className="admin-nav-icon">🖼️</span>
            Media Library
          </button>
          <button
            type="button"
            className={`admin-nav-item ${activeTab === 'content' ? 'active' : ''}`}
            onClick={() => { setActiveTab('content'); setSidebarOpen(false); }}
          >
            <span className="admin-nav-icon">📝</span>
            Website Content
          </button>
          <button
            type="button"
            className={`admin-nav-item ${activeTab === 'leads' ? 'active' : ''}`}
            onClick={() => { setActiveTab('leads'); setSidebarOpen(false); }}
          >
            <span className="admin-nav-icon">👥</span>
            CRM &amp; Leads
          </button>
          <button
            type="button"
            className={`admin-nav-item ${activeTab === 'orders' ? 'active' : ''}`}
            onClick={() => { setActiveTab('orders'); setSidebarOpen(false); }}
          >
            <span className="admin-nav-icon">📋</span>
            Orders &amp; Deliveries
          </button>
          <button
            type="button"
            className={`admin-nav-item ${activeTab === 'settings' ? 'active' : ''}`}
            onClick={() => { setActiveTab('settings'); setSidebarOpen(false); }}
          >
            <span className="admin-nav-icon">⚙️</span>
            Integrations &amp; API
          </button>
        </nav>

        <div className="admin-sidebar-footer">
          <div className="admin-user-info">
            <span className="admin-user-name">{session?.user?.fullName || session?.fullName || 'Abhi Singh'}</span>
            <span className="admin-user-role">{session?.user?.email || session?.email || 'admin@abhisingh.me'}</span>
          </div>
          <button type="button" className="admin-logout-btn" onClick={handleLogoutClick} title="Logout">
            Sign Out
          </button>
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
            <h2 className="admin-header-title">
              {activeTab === 'overview' && 'Dashboard Overview'}
              {activeTab === 'products' && 'Product Management (E.L.R.x Store)'}
              {activeTab === 'blog' && 'Blog & Newsletter Archive'}
              {activeTab === 'media' && 'Media Asset Library'}
              {activeTab === 'content' && 'Website Content & Credentials'}
              {activeTab === 'leads' && 'CRM Leads & Attribution Log'}
              {activeTab === 'orders' && 'Store Orders & Digital Deliveries'}
              {activeTab === 'settings' && 'System Integrations & API Settings'}
            </h2>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
            {isSupabaseConfigured ? (
              <span className="admin-header-badge">● Supabase Cloud Connected</span>
            ) : (
              <span className="admin-header-badge warning" title="Hybrid storage active - ready for production keys">
                ● Local Persistence Engine
              </span>
            )}
            <a
              href="/"
              target="_blank"
              rel="noopener noreferrer"
              className="admin-btn-secondary"
              style={{ textDecoration: 'none', display: 'inline-flex', alignItems: 'center', gap: '0.4rem' }}
            >
              <span>Visit Website</span> ↗
            </a>
          </div>
        </header>

        {/* Content Body */}
        <div className="admin-content-wrap">
          {/* TAB 1: OVERVIEW */}
          {activeTab === 'overview' && (
            <div>
              <div className="admin-metrics-grid">
                <div className="admin-metric-card">
                  <span className="admin-metric-label">Total Products</span>
                  <span className="admin-metric-value">{metrics?.totalProducts || 0}</span>
                  <span className="admin-metric-sub">{metrics?.publishedProducts || 0} Published · {metrics?.draftProducts || 0} Drafts</span>
                </div>
                <div className="admin-metric-card">
                  <span className="admin-metric-label">Published Store Items</span>
                  <span className="admin-metric-value" style={{ color: 'var(--admin-orange)' }}>
                    {metrics?.publishedProducts || 0}
                  </span>
                  <span className="admin-metric-sub">Visible on public store</span>
                </div>
                <div className="admin-metric-card">
                  <span className="admin-metric-label">Articles & Newsletters</span>
                  <span className="admin-metric-value">{metrics?.totalPosts || 0}</span>
                  <span className="admin-metric-sub">{metrics?.publishedPosts || 0} Live in Archive</span>
                </div>
                <div className="admin-metric-card">
                  <span className="admin-metric-label">CRM Leads & Inquiries</span>
                  <span className="admin-metric-value" style={{ color: 'var(--admin-black)' }}>
                    {metrics?.totalLeads || 0}
                  </span>
                  <span className="admin-metric-sub">{metrics?.newLeads || 0} New Pending Action</span>
                </div>
              </div>

              {/* Quick Actions */}
              <div className="admin-quick-actions">
                <button
                  type="button"
                  className="admin-btn-primary"
                  style={{ width: 'auto', padding: '0.65rem 1.25rem' }}
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
                <button
                  type="button"
                  className="admin-btn-yellow"
                  onClick={() => {
                    setEditingPost({
                      title: '',
                      slug: '',
                      category: 'Framework',
                      published_date: 'November 2026',
                      read_time: '4 min read',
                      summary: '',
                      content: '',
                      thumbnail_url: 'assets/author-photo.png',
                      status: 'published',
                      seo_title: '',
                      seo_description: '',
                    });
                    setIsPostModalOpen(true);
                  }}
                >
                  + Write Article / Newsletter
                </button>
                <button
                  type="button"
                  className="admin-btn-secondary"
                  onClick={() => setActiveTab('leads')}
                >
                  View CRM Leads ({metrics?.newLeads || 0})
                </button>
                <button
                  type="button"
                  className="admin-btn-secondary"
                  onClick={() => setActiveTab('media')}
                >
                  Upload Media Asset
                </button>
              </div>

              {/* Recent Activity Table */}
              <div className="admin-table-card">
                <div className="admin-table-header">
                  <h3 className="admin-table-title">Recent System Activity</h3>
                  <button type="button" className="admin-btn-secondary" onClick={refreshAllData}>
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
                            <td style={{ color: 'var(--admin-text-muted)' }}>
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
          )}

          {/* TAB 2: PRODUCTS */}
          {activeTab === 'products' && (
            <div className="admin-table-card">
              <div className="admin-table-header">
                <div>
                  <h3 className="admin-table-title">Products ({productsList.length})</h3>
                  <span style={{ fontSize: '0.8rem', color: 'var(--admin-text-muted)' }}>
                    Published items immediately appear on the public E.L.R.x Store.
                  </span>
                </div>
                <div className="admin-table-tools">
                  <input
                    type="text"
                    className="admin-input"
                    placeholder="Search products..."
                    style={{ width: '220px', padding: '0.5rem 0.75rem' }}
                    value={productSearch}
                    onChange={(e) => setProductSearch(e.target.value)}
                  />
                  <select
                    className="admin-input"
                    style={{ width: '140px', padding: '0.5rem 0.75rem' }}
                    value={productStatusFilter}
                    onChange={(e) => setProductStatusFilter(e.target.value)}
                  >
                    <option value="all">All Statuses</option>
                    <option value="published">Published</option>
                    <option value="draft">Drafts</option>
                  </select>
                  <button
                    type="button"
                    className="admin-btn-primary"
                    style={{ width: 'auto', padding: '0.5rem 1rem' }}
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
                    + Add Product
                  </button>
                </div>
              </div>

              <div className="admin-table-responsive">
                <table className="admin-table">
                  <thead>
                    <tr>
                      <th>Cover</th>
                      <th>Product Title</th>
                      <th>Type & Format</th>
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
                        const matchesStatus =
                          productStatusFilter === 'all' || p.status === productStatusFilter;
                        return matchesSearch && matchesStatus;
                      })
                      .map((product) => (
                        <tr key={product.id}>
                          <td style={{ width: '60px' }}>
                            <div style={{ width: '44px', height: '58px', background: 'var(--admin-orange)', borderRadius: '3px', overflow: 'hidden', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                              <img
                                src={product.cover_image_url || 'assets/author-photo.png'}
                                alt=""
                                style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                              />
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
                              className={`admin-badge ${product.status === 'published' ? 'admin-badge-published' : 'admin-badge-draft'}`}
                            >
                              {product.status || 'published'}
                            </span>
                          </td>
                          <td>
                            <div style={{ display: 'flex', gap: '0.5rem' }}>
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

          {/* TAB 3: BLOG & ARCHIVE */}
          {activeTab === 'blog' && (
            <div className="admin-table-card">
              <div className="admin-table-header">
                <div>
                  <h3 className="admin-table-title">Articles & Newsletter Archive ({postsList.length})</h3>
                  <span style={{ fontSize: '0.8rem', color: 'var(--admin-text-muted)' }}>
                    Manage articles and past newsletter editions readable in the public archive.
                  </span>
                </div>
                <div className="admin-table-tools">
                  <input
                    type="text"
                    className="admin-input"
                    placeholder="Search articles..."
                    style={{ width: '220px', padding: '0.5rem 0.75rem' }}
                    value={postSearch}
                    onChange={(e) => setPostSearch(e.target.value)}
                  />
                  <select
                    className="admin-input"
                    style={{ width: '140px', padding: '0.5rem 0.75rem' }}
                    value={postCategoryFilter}
                    onChange={(e) => setPostCategoryFilter(e.target.value)}
                  >
                    <option value="all">All Categories</option>
                    <option value="Framework">Framework</option>
                    <option value="Endurance">Endurance</option>
                    <option value="Nutrition">Nutrition</option>
                    <option value="Kettlebells">Kettlebells</option>
                    <option value="Habits">Habits</option>
                  </select>
                  <button
                    type="button"
                    className="admin-btn-yellow"
                    style={{ width: 'auto', padding: '0.5rem 1rem' }}
                    onClick={() => {
                      setEditingPost({
                        title: '',
                        slug: '',
                        category: 'Framework',
                        published_date: 'November 2026',
                        read_time: '4 min read',
                        summary: '',
                        content: '',
                        thumbnail_url: 'assets/author-photo.png',
                        status: 'published',
                        seo_title: '',
                        seo_description: '',
                      });
                      setIsPostModalOpen(true);
                    }}
                  >
                    + Write Article
                  </button>
                </div>
              </div>

              <div className="admin-table-responsive">
                <table className="admin-table">
                  <thead>
                    <tr>
                      <th>Title</th>
                      <th>Category</th>
                      <th>Date</th>
                      <th>Read Time</th>
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
                        return matchesSearch && matchesCategory;
                      })
                      .map((post) => (
                        <tr key={post.id}>
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
                                  setEditingPost(post);
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

          {/* TAB 4: MEDIA LIBRARY */}
          {activeTab === 'media' && (
            <div className="admin-table-card">
              <div className="admin-table-header">
                <div>
                  <h3 className="admin-table-title">Media Asset Library ({mediaList.length})</h3>
                  <span style={{ fontSize: '0.8rem', color: 'var(--admin-text-muted)' }}>
                    Upload and manage high-resolution covers, photos, and certificate assets.
                  </span>
                </div>
                <div className="admin-table-tools">
                  <label className="admin-btn-primary" style={{ width: 'auto', padding: '0.5rem 1rem', cursor: 'pointer' }}>
                    + Upload New File
                    <input
                      type="file"
                      style={{ display: 'none' }}
                      accept="image/*,application/pdf"
                      onChange={async (e) => {
                        const file = e.target.files[0];
                        if (!file) return;
                        if (file.size > 25 * 1024 * 1024) {
                          showToast('File size must be under 25MB', 'error');
                          return;
                        }
                        setLoading(true);
                        const asset = await uploadMediaAsset(file);
                        setLoading(false);
                        showToast(`Uploaded ${file.name}`);
                        refreshAllData();
                      }}
                    />
                  </label>
                </div>
              </div>

              <div style={{ padding: '1.5rem' }}>
                <div className="admin-media-grid">
                  {mediaList.map((asset) => (
                    <div key={asset.id} className="admin-media-card">
                      <div className="admin-media-thumb">
                        {asset.fileType?.includes('pdf') ? (
                          <div style={{ textAlign: 'center', padding: '1rem' }}>
                            <span style={{ fontSize: '2.5rem' }}>📄</span>
                            <div style={{ fontSize: '0.72rem', fontWeight: 700 }}>PDF Document</div>
                          </div>
                        ) : (
                          <img src={asset.publicUrl} alt={asset.altText || asset.name} />
                        )}
                      </div>
                      <div className="admin-media-details">
                        <div className="admin-media-name" title={asset.name}>{asset.name}</div>
                        <div style={{ fontSize: '0.72rem', color: 'var(--admin-text-muted)', marginBottom: '0.5rem' }}>
                          {(asset.fileSize / 1024).toFixed(1)} KB · {asset.fileType?.split('/')[1]?.toUpperCase() || 'FILE'}
                        </div>
                        <div style={{ display: 'flex', gap: '0.4rem' }}>
                          <button
                            type="button"
                            className="admin-btn-secondary"
                            style={{ flex: 1, padding: '0.25rem', fontSize: '0.72rem' }}
                            onClick={() => {
                              navigator.clipboard.writeText(asset.publicUrl);
                              showToast('Copied URL to clipboard!');
                            }}
                          >
                            Copy URL
                          </button>
                          <button
                            type="button"
                            className="admin-btn-secondary"
                            style={{ padding: '0.25rem 0.5rem', fontSize: '0.72rem', color: '#DC2626' }}
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
            </div>
          )}

          {/* TAB 5: WEBSITE CONTENT */}
          {activeTab === 'content' && (
            <div className="admin-table-card">
              <div className="admin-table-header">
                <div>
                  <h3 className="admin-table-title">Website Content & Credentials Mapping</h3>
                  <span style={{ fontSize: '0.8rem', color: 'var(--admin-text-muted)' }}>
                    Controlled copy and credential bindings without altering the approved layout.
                  </span>
                </div>
                <button
                  type="button"
                  className="admin-btn-primary"
                  style={{ width: 'auto', padding: '0.5rem 1.25rem' }}
                  onClick={async () => {
                    await updateSiteContent('hero', siteContent?.hero);
                    await updateSiteContent('credentials', siteContent?.credentials);
                    showToast('Website content saved successfully!');
                  }}
                >
                  Save Changes
                </button>
              </div>

              <div style={{ padding: '1.75rem' }}>
                <h4 style={{ fontFamily: 'Lora, serif', fontSize: '1.15rem', marginBottom: '1.25rem' }}>
                  Hero Headline & Book Presentation
                </h4>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '1.25rem', marginBottom: '2rem' }}>
                  <div className="admin-form-group">
                    <label>Main Headline</label>
                    <input
                      type="text"
                      className="admin-input"
                      value={siteContent?.hero?.headline || ''}
                      onChange={(e) =>
                        setSiteContentState({
                          ...siteContent,
                          hero: { ...siteContent.hero, headline: e.target.value },
                        })
                      }
                    />
                  </div>
                  <div className="admin-form-group">
                    <label>Book Title on Cover</label>
                    <input
                      type="text"
                      className="admin-input"
                      value={siteContent?.hero?.bookTitle || ''}
                      onChange={(e) =>
                        setSiteContentState({
                          ...siteContent,
                          hero: { ...siteContent.hero, bookTitle: e.target.value },
                        })
                      }
                    />
                  </div>
                </div>

                <div className="admin-form-group" style={{ marginBottom: '2.5rem' }}>
                  <label>Supporting Paragraph</label>
                  <textarea
                    className="admin-input"
                    rows={3}
                    value={siteContent?.hero?.subheadline || ''}
                    onChange={(e) =>
                      setSiteContentState({
                        ...siteContent,
                        hero: { ...siteContent.hero, subheadline: e.target.value },
                      })
                    }
                  />
                </div>

                <h4 style={{ fontFamily: 'Lora, serif', fontSize: '1.15rem', marginBottom: '1.25rem' }}>
                  Official Credentials & Certifications Binding
                </h4>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '1.5rem' }}>
                  {/* Yoddha */}
                  <div style={{ border: '1px solid var(--admin-border)', padding: '1.25rem', borderRadius: '4px' }}>
                    <div style={{ fontWeight: 700, marginBottom: '0.75rem' }}>1. The Yoddha Race</div>
                    <div className="admin-form-group">
                      <label>Title</label>
                      <input
                        type="text"
                        className="admin-input"
                        value={siteContent?.credentials?.yoddha?.title || ''}
                        onChange={(e) =>
                          setSiteContentState({
                            ...siteContent,
                            credentials: {
                              ...siteContent.credentials,
                              yoddha: { ...siteContent.credentials.yoddha, title: e.target.value },
                            },
                          })
                        }
                      />
                    </div>
                    <div className="admin-form-group">
                      <label>Subtitle / Details</label>
                      <input
                        type="text"
                        className="admin-input"
                        value={siteContent?.credentials?.yoddha?.subtitle || ''}
                        onChange={(e) =>
                          setSiteContentState({
                            ...siteContent,
                            credentials: {
                              ...siteContent.credentials,
                              yoddha: { ...siteContent.credentials.yoddha, subtitle: e.target.value },
                            },
                          })
                        }
                      />
                    </div>
                  </div>

                  {/* HYROX */}
                  <div style={{ border: '1px solid var(--admin-border)', padding: '1.25rem', borderRadius: '4px' }}>
                    <div style={{ fontWeight: 700, marginBottom: '0.75rem' }}>2. HYROX Mumbai</div>
                    <div className="admin-form-group">
                      <label>Title</label>
                      <input
                        type="text"
                        className="admin-input"
                        value={siteContent?.credentials?.hyrox?.title || ''}
                        onChange={(e) =>
                          setSiteContentState({
                            ...siteContent,
                            credentials: {
                              ...siteContent.credentials,
                              hyrox: { ...siteContent.credentials.hyrox, title: e.target.value },
                            },
                          })
                        }
                      />
                    </div>
                    <div className="admin-form-group">
                      <label>Subtitle / Details</label>
                      <input
                        type="text"
                        className="admin-input"
                        value={siteContent?.credentials?.hyrox?.subtitle || ''}
                        onChange={(e) =>
                          setSiteContentState({
                            ...siteContent,
                            credentials: {
                              ...siteContent.credentials,
                              hyrox: { ...siteContent.credentials.hyrox, subtitle: e.target.value },
                            },
                          })
                        }
                      />
                    </div>
                  </div>

                  {/* ACE */}
                  <div style={{ border: '1px solid var(--admin-border)', padding: '1.25rem', borderRadius: '4px' }}>
                    <div style={{ fontWeight: 700, marginBottom: '0.75rem' }}>3. ACE CPT Certification</div>
                    <div className="admin-form-group">
                      <label>Title</label>
                      <input
                        type="text"
                        className="admin-input"
                        value={siteContent?.credentials?.ace?.title || ''}
                        onChange={(e) =>
                          setSiteContentState({
                            ...siteContent,
                            credentials: {
                              ...siteContent.credentials,
                              ace: { ...siteContent.credentials.ace, title: e.target.value },
                            },
                          })
                        }
                      />
                    </div>
                    <div className="admin-form-group">
                      <label>Subtitle / Details</label>
                      <input
                        type="text"
                        className="admin-input"
                        value={siteContent?.credentials?.ace?.subtitle || ''}
                        onChange={(e) =>
                          setSiteContentState({
                            ...siteContent,
                            credentials: {
                              ...siteContent.credentials,
                              ace: { ...siteContent.credentials.ace, subtitle: e.target.value },
                            },
                          })
                        }
                      />
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* TAB 6: CRM LEADS & INQUIRIES */}
          {activeTab === 'leads' && (
            <div className="admin-table-card">
              <div className="admin-table-header">
                <div>
                  <h3 className="admin-table-title">CRM Leads & Attribution Log ({leadsList.length})</h3>
                  <span style={{ fontSize: '0.8rem', color: 'var(--admin-text-muted)' }}>
                    Submissions from Work With Me & Newsletter with full UTM attribution.
                  </span>
                </div>
                <div className="admin-table-tools">
                  <input
                    type="text"
                    className="admin-input"
                    placeholder="Search by name or email..."
                    style={{ width: '220px', padding: '0.5rem 0.75rem' }}
                    value={leadSearch}
                    onChange={(e) => setLeadSearch(e.target.value)}
                  />
                  <select
                    className="admin-input"
                    style={{ width: '160px', padding: '0.5rem 0.75rem' }}
                    value={leadTypeFilter}
                    onChange={(e) => setLeadTypeFilter(e.target.value)}
                  >
                    <option value="all">All Sources</option>
                    <option value="contact_inquiry">Work With Me</option>
                    <option value="newsletter_signup">Newsletter</option>
                  </select>
                  <button
                    type="button"
                    className="admin-btn-secondary"
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

              <div className="admin-table-responsive">
                <table className="admin-table">
                  <thead>
                    <tr>
                      <th>Submission Date</th>
                      <th>Lead Contact</th>
                      <th>Lead Type</th>
                      <th>Goal / Context</th>
                      <th>UTM Attribution</th>
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
                          <td style={{ color: 'var(--admin-text-muted)', fontSize: '0.8rem' }}>
                            {new Date(lead.created_at).toLocaleDateString()}
                          </td>
                          <td>
                            <div style={{ fontWeight: 700 }}>{lead.name || 'Anonymous'}</div>
                            <div style={{ fontSize: '0.8rem', color: 'var(--admin-orange)' }}>{lead.email}</div>
                          </td>
                          <td>
                            <span className={`admin-badge ${lead.lead_type === 'contact_inquiry' ? 'admin-badge-paid' : 'admin-badge-free'}`}>
                              {lead.lead_type === 'contact_inquiry' ? 'Work With Me' : 'Newsletter'}
                            </span>
                          </td>
                          <td style={{ maxWidth: '200px', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                            {lead.primary_goal || lead.message || 'General Subscriber'}
                          </td>
                          <td>
                            <span style={{ fontSize: '0.78rem', background: '#F3F4F6', padding: '0.2rem 0.5rem', borderRadius: '3px' }}>
                              {lead.utm_source ? `${lead.utm_source} / ${lead.utm_medium || 'social'}` : 'Direct / Organic'}
                            </span>
                          </td>
                          <td>
                            <select
                              value={lead.status}
                              onChange={async (e) => {
                                await updateLeadStatus(lead.id, e.target.value);
                                showToast(`Status updated to ${e.target.value}`);
                                refreshAllData();
                              }}
                              style={{ padding: '0.25rem 0.5rem', borderRadius: '4px', border: '1px solid var(--admin-border)', fontSize: '0.78rem' }}
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
                              style={{ padding: '0.35rem 0.65rem', fontSize: '0.78rem' }}
                              onClick={() => setViewingLead(lead)}
                            >
                              View
                            </button>
                          </td>
                        </tr>
                      ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* TAB 6.5: ORDERS & DELIVERIES MANAGEMENT */}
          {activeTab === 'orders' && (
            <div className="admin-table-card">
              <div className="admin-table-header">
                <div>
                  <h3 className="admin-table-title">Orders &amp; Digital Deliveries ({ordersList.length})</h3>
                  <span style={{ fontSize: '0.8rem', color: 'var(--admin-text-muted)' }}>
                    Audit log of customer purchases, free downloads, payment transactions, and automated PDF delivery statuses.
                  </span>
                </div>
                <div className="admin-table-tools">
                  <input
                    type="text"
                    className="admin-input"
                    placeholder="Search by order ID, name, email, product..."
                    style={{ width: '260px', padding: '0.5rem 0.75rem' }}
                    value={orderSearch}
                    onChange={(e) => setOrderSearch(e.target.value)}
                  />
                  <select
                    className="admin-input"
                    style={{ width: '180px', padding: '0.5rem 0.75rem' }}
                    value={orderStatusFilter}
                    onChange={(e) => setOrderStatusFilter(e.target.value)}
                  >
                    <option value="all">All Orders</option>
                    <option value="free">Free Downloads</option>
                    <option value="paid">Paid Orders</option>
                    <option value="pending_payment">Pending Payments</option>
                    <option value="successful_payment">Successful Payments</option>
                    <option value="failed_payment">Failed Payments</option>
                    <option value="emails_sent">Emails Sent</option>
                    <option value="delivery_failed">Email Delivery Failed</option>
                  </select>
                  <button
                    type="button"
                    className="admin-btn-secondary"
                    onClick={() => {
                      if (ordersList.length === 0) {
                        showToast('No orders to export', 'error');
                        return;
                      }
                      const headers = ['Order ID', 'Customer Name', 'Customer Email', 'Product Name', 'Amount', 'Currency', 'Payment Method', 'Payment ID', 'Payment Status', 'Delivery Status', 'Date'];
                      const rows = ordersList.map((o) => [
                        `"${o.id}"`,
                        `"${o.customer_name || ''}"`,
                        `"${o.customer_email || ''}"`,
                        `"${o.product_name || ''}"`,
                        o.amount || 0,
                        `"${o.currency || 'INR'}"`,
                        `"${o.payment_method || ''}"`,
                        `"${o.payment_id || ''}"`,
                        `"${o.payment_status || o.status || 'paid'}"`,
                        `"${o.delivery_status || 'delivered'}"`,
                        `"${o.created_at || ''}"`,
                      ]);
                      const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows.map((r) => r.join(','))].join('\n');
                      const encodedUri = encodeURI(csvContent);
                      const link = document.createElement('a');
                      link.setAttribute('href', encodedUri);
                      link.setAttribute('download', `elrx_orders_${new Date().toISOString().slice(0, 10)}.csv`);
                      document.body.appendChild(link);
                      link.click();
                      document.body.removeChild(link);
                      showToast(`✓ Exported ${ordersList.length} orders to CSV`);
                    }}
                  >
                    📥 Export CSV
                  </button>
                  <button
                    type="button"
                    className="admin-btn-secondary"
                    onClick={refreshAllData}
                  >
                    ↻ Refresh
                  </button>
                </div>
              </div>

              {/* Metric stats row */}
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '1rem', padding: '1rem 1.5rem', background: '#F9FAFB', borderBottom: '1px solid var(--admin-border)' }}>
                <div>
                  <div style={{ fontSize: '0.72rem', textTransform: 'uppercase', color: 'var(--admin-text-muted)', fontWeight: 700 }}>Total Orders</div>
                  <div style={{ fontSize: '1.4rem', fontWeight: 800, color: 'var(--admin-text)' }}>{ordersList.length}</div>
                </div>
                <div>
                  <div style={{ fontSize: '0.72rem', textTransform: 'uppercase', color: 'var(--admin-text-muted)', fontWeight: 700 }}>Gross Revenue</div>
                  <div style={{ fontSize: '1.4rem', fontWeight: 800, color: '#FF6200' }}>
                    ₹{ordersList.filter(o => o.payment_status === 'paid' || o.payment_status === 'PAID' || o.status === 'completed').reduce((sum, o) => sum + (Number(o.amount) || 0), 0).toLocaleString('en-IN')}
                  </div>
                </div>
                <div>
                  <div style={{ fontSize: '0.72rem', textTransform: 'uppercase', color: 'var(--admin-text-muted)', fontWeight: 700 }}>Deliveries Sent</div>
                  <div style={{ fontSize: '1.4rem', fontWeight: 800, color: '#10B981' }}>
                    {ordersList.filter(o => (o.delivery_status || '').toLowerCase() === 'delivered' || o.delivery_status === 'SENT').length} / {ordersList.length}
                  </div>
                </div>
                <div>
                  <div style={{ fontSize: '0.72rem', textTransform: 'uppercase', color: 'var(--admin-text-muted)', fontWeight: 700 }}>Funnel Breakdown</div>
                  <div style={{ fontSize: '1rem', fontWeight: 700, color: 'var(--admin-text)', marginTop: '4px' }}>
                    {ordersList.filter(o => o.is_free || Number(o.amount) === 0 || o.payment_status === 'FREE').length} Free · {ordersList.filter(o => !o.is_free && Number(o.amount) > 0).length} Paid
                  </div>
                </div>
              </div>

              <div className="admin-table-responsive">
                <table className="admin-table">
                  <thead>
                    <tr>
                      <th>Order ID</th>
                      <th>Customer</th>
                      <th>Product &amp; PDF</th>
                      <th>Amount</th>
                      <th>Payment Provider &amp; ID</th>
                      <th>Payment Status</th>
                      <th>Delivery Status</th>
                      <th>Date &amp; Time</th>
                      <th>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {ordersList
                      .filter((o) => {
                        const q = orderSearch.toLowerCase();
                        const matchesSearch =
                          !q ||
                          (o.id || '').toLowerCase().includes(q) ||
                          (o.customer_name || '').toLowerCase().includes(q) ||
                          (o.customer_email || '').toLowerCase().includes(q) ||
                          (o.product_name || '').toLowerCase().includes(q) ||
                          (o.payment_id || '').toLowerCase().includes(q);

                        let matchesFilter = true;
                        if (orderStatusFilter === 'free') {
                          matchesFilter = o.is_free || Number(o.amount) === 0 || o.payment_status === 'FREE';
                        } else if (orderStatusFilter === 'paid') {
                          matchesFilter = !o.is_free && Number(o.amount) > 0;
                        } else if (orderStatusFilter === 'pending_payment') {
                          matchesFilter = (o.payment_status || '').toLowerCase() === 'pending' && !o.is_free;
                        } else if (orderStatusFilter === 'successful_payment') {
                          matchesFilter = (o.payment_status || '').toLowerCase() === 'paid' || o.payment_status === 'FREE' || o.status === 'completed';
                        } else if (orderStatusFilter === 'failed_payment') {
                          matchesFilter = (o.payment_status || '').toLowerCase() === 'failed';
                        } else if (orderStatusFilter === 'emails_sent') {
                          matchesFilter = (o.delivery_status || '').toLowerCase() === 'delivered' || o.delivery_status === 'SENT';
                        } else if (orderStatusFilter === 'delivery_failed') {
                          matchesFilter = (o.delivery_status || '').toLowerCase() === 'failed' || o.delivery_status === 'FAILED';
                        }
                        return matchesSearch && matchesFilter;
                      })
                      .map((o) => {
                        const isFreeOrder = o.is_free || Number(o.amount) === 0 || o.payment_status === 'FREE';
                        const effectivePdf = o.pdf_url;
                        const isDelivered = (o.delivery_status || 'delivered').toLowerCase() === 'delivered' || o.delivery_status === 'SENT';
                        const isPaid = (o.payment_status || o.status || '').toLowerCase() === 'paid' || o.payment_status === 'FREE' || o.status === 'completed';
                        const isTestOrder = Boolean(o.is_test || (o.payment_method || '').includes('test') || (o.payment_method || '').includes('sandbox'));

                        return (
                          <tr key={o.id}>
                            <td style={{ fontFamily: 'monospace', fontSize: '0.8rem', fontWeight: 700 }}>
                              <div>{o.id}</div>
                              {isTestOrder && (
                                <span style={{ display: 'inline-block', fontSize: '0.64rem', background: '#FEF3C7', color: '#D97706', padding: '1px 5px', borderRadius: '3px', fontWeight: 800, marginTop: '2px' }}>
                                  TEST MODE
                                </span>
                              )}
                            </td>
                            <td>
                              <div style={{ fontWeight: 700 }}>{o.customer_name || 'Store Customer'}</div>
                              <div style={{ fontSize: '0.78rem', color: '#6B7280' }}>{o.customer_email}</div>
                            </td>
                            <td>
                              <div style={{ fontWeight: 600 }}>{o.product_name}</div>
                              {effectivePdf ? (
                                <a
                                  href={effectivePdf}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  style={{ fontSize: '0.74rem', color: '#FF6200', textDecoration: 'none', display: 'inline-flex', alignItems: 'center', gap: '3px' }}
                                >
                                  📄 View PDF ↗
                                </a>
                              ) : (
                                <span style={{ fontSize: '0.74rem', color: '#9CA3AF' }}>No PDF attached</span>
                              )}
                            </td>
                            <td style={{ fontWeight: 700 }}>
                              {isFreeOrder ? (
                                <span style={{ color: '#10B981' }}>Free</span>
                              ) : (
                                `₹${Number(o.amount).toLocaleString('en-IN')} ${o.currency || 'INR'}`
                              )}
                            </td>
                            <td>
                              <div style={{ textTransform: 'capitalize', fontWeight: 600, fontSize: '0.82rem' }}>
                                {o.payment_method || 'Razorpay'}
                              </div>
                              <div style={{ fontFamily: 'monospace', fontSize: '0.72rem', color: '#6B7280' }}>
                                {o.payment_id || 'n/a'}
                              </div>
                            </td>
                            <td>
                              <span
                                style={{
                                  display: 'inline-block',
                                  padding: '2px 8px',
                                  borderRadius: '4px',
                                  fontSize: '0.72rem',
                                  fontWeight: 700,
                                  background: isPaid ? '#DCFCE7' : '#FEF3C7',
                                  color: isPaid ? '#15803D' : '#B45309',
                                }}
                              >
                                {isPaid ? '✓ Paid' : (o.payment_status || 'Pending')}
                              </span>
                            </td>
                            <td>
                              <span
                                style={{
                                  display: 'inline-block',
                                  padding: '2px 8px',
                                  borderRadius: '4px',
                                  fontSize: '0.72rem',
                                  fontWeight: 700,
                                  background: isDelivered ? '#DCFCE7' : (o.delivery_status === 'failed' ? '#FEE2E2' : '#FEF3C7'),
                                  color: isDelivered ? '#15803D' : (o.delivery_status === 'failed' ? '#B91C1C' : '#B45309'),
                                }}
                              >
                                {isDelivered ? '✓ Delivered' : (o.delivery_status || 'Pending')}
                              </span>
                            </td>
                            <td style={{ fontSize: '0.78rem', color: '#6B7280' }}>
                              {o.created_at ? new Date(o.created_at).toLocaleString() : 'Recent'}
                            </td>
                            <td>
                              <div style={{ display: 'flex', gap: '6px' }}>
                                <button
                                  type="button"
                                  className="admin-btn-secondary"
                                  style={{ padding: '0.35rem 0.65rem', fontSize: '0.76rem', borderRadius: '4px', whiteSpace: 'nowrap' }}
                                  title="View complete order details"
                                  onClick={() => setSelectedOrderDetails(o)}
                                >
                                  👁️ Details
                                </button>
                                <button
                                  type="button"
                                  className="admin-btn-secondary"
                                  style={{ padding: '0.35rem 0.65rem', fontSize: '0.76rem', borderRadius: '4px', whiteSpace: 'nowrap' }}
                                  disabled={isResendingEmailId === o.id}
                                  onClick={async () => {
                                    setIsResendingEmailId(o.id);
                                    try {
                                      showToast(`Sending deliverable to ${o.customer_email}...`);
                                      // Call serverless retry API if available
                                      const apiRes = await fetch('/api/orders', {
                                        method: 'POST',
                                        headers: { 'Content-Type': 'application/json' },
                                        body: JSON.stringify({ action: 'retry_delivery', orderId: o.id }),
                                      }).catch(() => null);

                                      if (!apiRes || !apiRes.ok) {
                                        await sendProductDeliveryEmail({
                                          orderId: o.id,
                                          customerName: o.customer_name,
                                          customerEmail: o.customer_email,
                                          product: {
                                            name: o.product_name,
                                            fileUrl: o.pdf_url,
                                          },
                                          paymentId: o.payment_id,
                                          amount: o.amount,
                                          currency: o.currency || 'INR',
                                        });
                                      }
                                      await updateOrder(o.id, { delivery_status: 'delivered' });
                                      showToast(`✓ Delivery email sent to ${o.customer_email}!`);
                                      refreshAllData();
                                    } catch (err) {
                                      showToast(`Failed sending email: ${err.message}`, 'error');
                                    } finally {
                                      setIsResendingEmailId(null);
                                    }
                                  }}
                                >
                                  {isResendingEmailId === o.id ? 'Sending...' : '✉️ Resend'}
                                </button>
                                <button
                                  type="button"
                                  style={{ background: '#FEE2E2', border: '1px solid #FCA5A5', color: '#DC2626', borderRadius: '4px', padding: '0.35rem 0.65rem', fontSize: '0.76rem', cursor: 'pointer' }}
                                  title="Delete order record"
                                  onClick={async () => {
                                    if (window.confirm(`Delete order record ${o.id}?`)) {
                                      await deleteOrder(o.id);
                                      showToast(`Order ${o.id} deleted`);
                                      refreshAllData();
                                    }
                                  }}
                                >
                                  🗑️
                                </button>
                              </div>
                            </td>
                          </tr>
                        );
                      })}
                    {ordersList.length === 0 && (
                      <tr>
                        <td colSpan={9} style={{ textAlign: 'center', padding: '2.5rem', color: '#9CA3AF' }}>
                          No orders found yet. Digital product purchases and free PDF downloads will appear here in real-time.
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          )}

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
                  borderRadius: '8px',
                  width: '100%',
                  maxWidth: '680px',
                  border: '2px solid #212121',
                  boxShadow: '6px 6px 0 #212121',
                  overflow: 'hidden',
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
                      <div style={{ fontSize: '0.86rem', fontWeight: 700, color: selectedOrderDetails.is_free ? '#10B981' : '#FF6200', marginTop: '2px' }}>
                        {selectedOrderDetails.is_free ? 'Free Download' : `₹${selectedOrderDetails.amount} ${selectedOrderDetails.currency || 'INR'}`}
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
                    {selectedOrderDetails.delivery_error && (
                      <div style={{ marginTop: '0.75rem', background: '#FEE2E2', color: '#991B1B', padding: '0.5rem', borderRadius: '4px', fontSize: '0.78rem' }}>
                        <strong>Error Log:</strong> {selectedOrderDetails.delivery_error}
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
                        showToast(`Re-sending PDF to ${selectedOrderDetails.customer_email}...`);
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
                        await updateOrder(selectedOrderDetails.id, { delivery_status: 'delivered' });
                        showToast(`✓ PDF delivery sent to ${selectedOrderDetails.customer_email}`);
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

          {/* TAB 7: SETTINGS & INTEGRATIONS */}
          {activeTab === 'settings' && (
            <div className="admin-table-card">
              <div className="admin-table-header">
                <div>
                  <h3 className="admin-table-title">Integrations &amp; APIs</h3>
                  <span style={{ fontSize: '0.8rem', color: 'var(--admin-text-muted)' }}>
                    Configure database, payments, and email alerts.
                  </span>
                </div>
                <div style={{ display: 'flex', gap: '0.75rem' }}>
                  <button
                    type="button"
                    className="admin-btn-secondary"
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
                    style={{ width: 'auto', padding: '0.5rem 1.25rem' }}
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
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(340px, 1fr))', gap: '1.5rem' }}>
                  
                  {/* 1. SUPABASE */}
                  <div className="admin-integration-card">
                    <div className="admin-integration-header">
                      <h4 className="admin-integration-title">Supabase</h4>
                      {isSupabaseConfigured ? (
                        <span className="admin-badge admin-badge-published">● Connected</span>
                      ) : (
                        <span className="admin-badge admin-badge-draft">● Local Mode</span>
                      )}
                    </div>
                    <p className="admin-integration-sub">
                      Database and media storage for site content.
                    </p>

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

                  {/* 2. RAZORPAY */}
                  <div className="admin-integration-card">
                    <div className="admin-integration-header">
                      <h4 className="admin-integration-title">Razorpay Payments</h4>
                      <span className={`admin-badge ${apiSettings.razorpayKeyId ? 'admin-badge-published' : 'admin-badge-draft'}`}>
                        {apiSettings.razorpayKeyId ? 'Configured' : 'Not Configured'}
                      </span>
                    </div>
                    <p className="admin-integration-sub">
                      Accept UPI, cards &amp; net banking in ₹ INR.
                    </p>

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

                  {/* 3. PAYPAL */}
                  <div className="admin-integration-card">
                    <div className="admin-integration-header">
                      <h4 className="admin-integration-title">PayPal Checkout</h4>
                      <span className={`admin-badge ${apiSettings.paypalClientId ? 'admin-badge-published' : 'admin-badge-draft'}`}>
                        {apiSettings.paypalClientId ? 'Configured' : 'Not Configured'}
                      </span>
                    </div>
                    <p className="admin-integration-sub">
                      Accept international payments in $ USD.
                    </p>

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

                  {/* 4. ZOHO CAMPAIGNS */}
                  <div className="admin-integration-card">
                    <div className="admin-integration-header">
                      <h4 className="admin-integration-title">Zoho Campaigns</h4>
                      <span className={`admin-badge ${apiSettings.zohoApiKey || apiSettings.zohoEndpoint ? 'admin-badge-published' : 'admin-badge-draft'}`}>
                        {apiSettings.zohoApiKey || apiSettings.zohoEndpoint ? 'Active' : 'Not Configured'}
                      </span>
                    </div>
                    <p className="admin-integration-sub">
                      Sync subscribers directly to your email list.
                    </p>

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
                    </div>

                    {testStates.zoho && (
                      <div className={`test-result-box ${testStates.zoho.status}`}>
                        <span>{testStates.zoho.status === 'success' ? '✓' : '✕'}</span>
                        <span>{testStates.zoho.message}</span>
                      </div>
                    )}
                  </div>

                  {/* 5. RESEND EMAIL */}
                  <div className="admin-integration-card">
                    <div className="admin-integration-header">
                      <h4 className="admin-integration-title">Resend Email</h4>
                      <span className={`admin-badge ${apiSettings.resendApiKey ? 'admin-badge-published' : 'admin-badge-draft'}`}>
                        {apiSettings.resendApiKey ? 'Configured' : 'Not Configured'}
                      </span>
                    </div>
                    <p className="admin-integration-sub">
                      Receive instant email notifications for inquiries.
                    </p>

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
          )}
        </div>
      </div>

      {/* ── 3. PRODUCT MODAL ── */}
      {isProductModalOpen && editingProduct && (
        <div className="admin-modal-backdrop" onClick={() => setIsProductModalOpen(false)}>
          <div className="admin-modal" onClick={(e) => e.stopPropagation()}>
            <div className="admin-modal-header">
              <h3 style={{ margin: 0, fontFamily: 'Lora, serif' }}>
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
                      setEditingProduct({
                        ...editingProduct,
                        title,
                        name: title,
                        slug: title.toLowerCase().replace(/[^a-z0-9]+/g, '-'),
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
                    value={editingProduct.slug || ''}
                    onChange={(e) => setEditingProduct({ ...editingProduct, slug: e.target.value })}
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
                        price_inr: isFree ? 0 : editingProduct.price_inr || 499,
                        price_usd: isFree ? 0 : editingProduct.price_usd || 19,
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
                        value={editingProduct.price_inr || ''}
                        onChange={(e) => setEditingProduct({ ...editingProduct, price_inr: Number(e.target.value) })}
                      />
                    </div>
                    <div className="admin-form-group">
                      <label>Price (USD $)</label>
                      <input
                        type="number"
                        className="admin-input"
                        value={editingProduct.price_usd || ''}
                        onChange={(e) => setEditingProduct({ ...editingProduct, price_usd: Number(e.target.value) })}
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

              <div className="admin-form-group">
                <label>Short Description (Tagline)</label>
                <input
                  type="text"
                  className="admin-input"
                  value={editingProduct.short_description || ''}
                  onChange={(e) => setEditingProduct({ ...editingProduct, short_description: e.target.value })}
                />
              </div>

              <div className="admin-form-group">
                <label>Full Description</label>
                <textarea
                  className="admin-input"
                  rows={4}
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
                    <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 700, marginBottom: '0.4rem' }}>
                      1. Product Cover Image
                    </label>
                    <input
                      type="file"
                      accept="image/*"
                      onChange={async (e) => {
                        const file = e.target.files[0];
                        if (file) {
                          const asset = await uploadMediaAsset(file);
                          setEditingProduct({ ...editingProduct, cover_image_url: asset.publicUrl });
                          showToast('Cover image updated');
                        }
                      }}
                    />
                    <div style={{ marginTop: '0.75rem', width: '80px', height: '110px', background: 'var(--admin-orange)', borderRadius: '4px', overflow: 'hidden' }}>
                      <img src={editingProduct.cover_image_url || 'assets/author-photo.png'} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                    </div>
                  </div>

                  {/* PDF Upload */}
                  {editingProduct.product_type === 'digital_download' && (
                    <div>
                      <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 700, marginBottom: '0.4rem' }}>
                        2. Actual PDF Deliverable
                      </label>
                      <input
                        type="file"
                        accept="application/pdf"
                        onChange={async (e) => {
                          const file = e.target.files[0];
                          if (file) {
                            const asset = await uploadMediaAsset(file);
                            setEditingProduct({ ...editingProduct, file_url: asset.publicUrl });
                            showToast('PDF deliverable attached');
                          }
                        }}
                      />
                      <div style={{ marginTop: '0.5rem', fontSize: '0.75rem', color: 'var(--admin-text-muted)' }}>
                        {editingProduct.file_url ? `Attached: ${editingProduct.file_url.split('/').pop()}` : 'No PDF attached yet'}
                      </div>
                    </div>
                  )}
                </div>
              </div>

              <div className="admin-form-group">
                <label>Publication Status</label>
                <select
                  className="admin-input"
                  value={editingProduct.status}
                  onChange={(e) => setEditingProduct({ ...editingProduct, status: e.target.value })}
                >
                  <option value="published">Published (Visible in Store)</option>
                  <option value="draft">Draft (Private in CMS)</option>
                </select>
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
                  if (editingProduct.id) {
                    await updateProduct(editingProduct.id, editingProduct);
                    showToast('Product updated successfully');
                  } else {
                    await createProduct(editingProduct);
                    showToast('Product created successfully');
                  }
                  setIsProductModalOpen(false);
                  refreshAllData();
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
            <div className="admin-modal-header">
              <h3 style={{ margin: 0, fontFamily: 'Lora, serif' }}>
                {editingPost.id ? 'Edit Article' : 'Write New Article / Newsletter'}
              </h3>
              <button
                type="button"
                className="admin-btn-secondary"
                style={{ border: 'none', fontSize: '1.2rem' }}
                onClick={() => setIsPostModalOpen(false)}
              >
                ✕
              </button>
            </div>
            <div className="admin-modal-body">
              <div className="admin-form-group">
                <label>Article Title *</label>
                <input
                  type="text"
                  className="admin-input"
                  value={editingPost.title}
                  onChange={(e) => {
                    const title = e.target.value;
                    setEditingPost({
                      ...editingPost,
                      title,
                      slug: title.toLowerCase().replace(/[^a-z0-9]+/g, '-'),
                    });
                  }}
                  required
                />
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1.25rem' }}>
                <div className="admin-form-group">
                  <label>Category</label>
                  <select
                    className="admin-input"
                    value={editingPost.category}
                    onChange={(e) => setEditingPost({ ...editingPost, category: e.target.value })}
                  >
                    <option value="Framework">Framework</option>
                    <option value="Endurance">Endurance</option>
                    <option value="Nutrition">Nutrition</option>
                    <option value="Kettlebells">Kettlebells</option>
                    <option value="Habits">Habits</option>
                  </select>
                </div>
                <div className="admin-form-group">
                  <label>Publication Date</label>
                  <input
                    type="text"
                    className="admin-input"
                    value={editingPost.published_date || editingPost.date || ''}
                    onChange={(e) => setEditingPost({ ...editingPost, published_date: e.target.value, date: e.target.value })}
                  />
                </div>
                <div className="admin-form-group">
                  <label>Read Time</label>
                  <input
                    type="text"
                    className="admin-input"
                    value={editingPost.read_time || editingPost.readTime || ''}
                    onChange={(e) => setEditingPost({ ...editingPost, read_time: e.target.value, readTime: e.target.value })}
                  />
                </div>
              </div>

              <div className="admin-form-group">
                <label>Summary / Excerpt</label>
                <input
                  type="text"
                  className="admin-input"
                  value={editingPost.summary || ''}
                  onChange={(e) => setEditingPost({ ...editingPost, summary: e.target.value })}
                />
              </div>

              <div className="admin-form-group">
                <label>Article Content (Markdown / Text)</label>
                <textarea
                  className="admin-input"
                  rows={8}
                  value={editingPost.content || ''}
                  onChange={(e) => setEditingPost({ ...editingPost, content: e.target.value })}
                  placeholder="Write complete article content here..."
                />
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '1.25rem' }}>
                <div className="admin-form-group">
                  <label>SEO Meta Title</label>
                  <input
                    type="text"
                    className="admin-input"
                    value={editingPost.seo_title || ''}
                    onChange={(e) => setEditingPost({ ...editingPost, seo_title: e.target.value })}
                  />
                </div>
                <div className="admin-form-group">
                  <label>Publication Status</label>
                  <select
                    className="admin-input"
                    value={editingPost.status || 'published'}
                    onChange={(e) => setEditingPost({ ...editingPost, status: e.target.value })}
                  >
                    <option value="published">Published (Visible in Archive)</option>
                    <option value="draft">Draft (Private in CMS)</option>
                  </select>
                </div>
              </div>
            </div>
            <div className="admin-modal-footer">
              <button type="button" className="admin-btn-secondary" onClick={() => setIsPostModalOpen(false)}>
                Cancel
              </button>
              <button
                type="button"
                className="admin-btn-primary"
                style={{ width: 'auto' }}
                onClick={async () => {
                  if (editingPost.id) {
                    await updatePost(editingPost.id, editingPost);
                    showToast('Article updated successfully');
                  } else {
                    await createPost(editingPost);
                    showToast('Article created successfully');
                  }
                  setIsPostModalOpen(false);
                  refreshAllData();
                }}
              >
                Save Article
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

              <h4 style={{ fontFamily: 'Lora, serif', fontSize: '1.05rem', borderBottom: '1px solid var(--admin-border)', paddingBottom: '0.4rem', marginBottom: '1rem' }}>
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
              <h3 style={{ margin: 0, fontFamily: 'Lora, serif', color: '#DC2626' }}>Confirm Deletion</h3>
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
    </div>
  );
}

