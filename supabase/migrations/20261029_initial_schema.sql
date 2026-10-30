-- ====================================================================
-- ABHI SINGH (abhisingh.me) & E.L.R.X STORE
-- SUPABASE POSTGRESQL PRODUCTION DATABASE SCHEMA & MIGRATION
-- ====================================================================

-- Enable UUID extension if not already enabled
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 1. ADMIN USERS TABLE
CREATE TABLE IF NOT EXISTS public.admin_users (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    email TEXT UNIQUE NOT NULL,
    full_name TEXT,
    role TEXT DEFAULT 'admin' CHECK (role IN ('super_admin', 'admin', 'editor')),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    last_sign_in_at TIMESTAMPTZ
);

-- 2. PRODUCTS TABLE (E.L.R.X Store)
CREATE TABLE IF NOT EXISTS public.products (
    id TEXT PRIMARY KEY DEFAULT ('prod_' || substr(md5(random()::text), 1, 8)),
    title TEXT NOT NULL,
    slug TEXT UNIQUE NOT NULL,
    category TEXT DEFAULT 'Book',
    short_description TEXT,
    full_description TEXT,
    product_type TEXT DEFAULT 'digital_download' CHECK (product_type IN ('digital_download', 'external_link', 'book', 'course')),
    format TEXT DEFAULT 'PDF (Digital Download)',
    price_inr NUMERIC DEFAULT 0,
    price_usd NUMERIC DEFAULT 0,
    is_free BOOLEAN DEFAULT false,
    cover_image_url TEXT,
    file_url TEXT,
    external_url TEXT,
    status TEXT DEFAULT 'draft' CHECK (status IN ('draft', 'published', 'archived')),
    badge TEXT,
    featured BOOLEAN DEFAULT false,
    sort_order INTEGER DEFAULT 0,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 3. POSTS TABLE (Blog & Newsletter Archive)
CREATE TABLE IF NOT EXISTS public.posts (
    id TEXT PRIMARY KEY DEFAULT ('post_' || substr(md5(random()::text), 1, 8)),
    title TEXT NOT NULL,
    slug TEXT UNIQUE NOT NULL,
    category TEXT NOT NULL DEFAULT 'Framework',
    summary TEXT,
    content TEXT NOT NULL,
    thumbnail_url TEXT,
    read_time TEXT DEFAULT '4 min read',
    published_date TEXT,
    status TEXT DEFAULT 'published' CHECK (status IN ('draft', 'published', 'archived')),
    seo_title TEXT,
    seo_description TEXT,
    sort_order INTEGER DEFAULT 0,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 4. MEDIA ASSETS TABLE
CREATE TABLE IF NOT EXISTS public.media_assets (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name TEXT NOT NULL,
    file_path TEXT NOT NULL,
    public_url TEXT NOT NULL,
    bucket TEXT DEFAULT 'media',
    file_type TEXT,
    file_size BIGINT,
    alt_text TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 5. LEADS TABLE (CRM - Inquiries & Signups with Full Attribution)
CREATE TABLE IF NOT EXISTS public.leads (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    lead_type TEXT NOT NULL CHECK (lead_type IN ('contact_inquiry', 'newsletter_signup')),
    name TEXT,
    email TEXT NOT NULL,
    phone TEXT,
    primary_goal TEXT,
    training_frequency TEXT,
    timeline TEXT,
    message TEXT,
    status TEXT DEFAULT 'new' CHECK (status IN ('new', 'contacted', 'in_progress', 'closed')),
    source TEXT,
    utm_source TEXT,
    utm_medium TEXT,
    utm_campaign TEXT,
    utm_term TEXT,
    utm_content TEXT,
    landing_page TEXT,
    referrer TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 6. SITE CONTENT TABLE (Controlled CMS Configuration)
CREATE TABLE IF NOT EXISTS public.site_content (
    key TEXT PRIMARY KEY,
    data JSONB NOT NULL,
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ====================================================================
-- ROW LEVEL SECURITY (RLS) POLICIES
-- ====================================================================

-- Enable RLS on all tables
ALTER TABLE public.admin_users ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.products ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.posts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.media_assets ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.leads ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.site_content ENABLE ROW LEVEL SECURITY;

-- Helper function: Check if current user is an admin
CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS BOOLEAN AS $$
BEGIN
    RETURN (
        auth.role() = 'authenticated' AND
        EXISTS (
            SELECT 1 FROM public.admin_users
            WHERE id = auth.uid()
        )
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 1. admin_users policies
CREATE POLICY "Admins can read admin_users"
    ON public.admin_users FOR SELECT
    TO authenticated
    USING (public.is_admin());

-- 2. products policies
-- Public can only see published products
CREATE POLICY "Public can view published products"
    ON public.products FOR SELECT
    TO anon, authenticated
    USING (status = 'published');

-- Admins have full access to products
CREATE POLICY "Admins have full access to products"
    ON public.products FOR ALL
    TO authenticated
    USING (public.is_admin())
    WITH CHECK (public.is_admin());

-- 3. posts policies
-- Public can only see published posts
CREATE POLICY "Public can view published posts"
    ON public.posts FOR SELECT
    TO anon, authenticated
    USING (status = 'published');

-- Admins have full access to posts
CREATE POLICY "Admins have full access to posts"
    ON public.posts FOR ALL
    TO authenticated
    USING (public.is_admin())
    WITH CHECK (public.is_admin());

-- 4. media_assets policies
CREATE POLICY "Public can view media assets"
    ON public.media_assets FOR SELECT
    TO anon, authenticated
    USING (true);

CREATE POLICY "Admins have full access to media assets"
    ON public.media_assets FOR ALL
    TO authenticated
    USING (public.is_admin())
    WITH CHECK (public.is_admin());

-- 5. leads policies
-- Anyone can insert a lead (submit contact form or signup)
CREATE POLICY "Anyone can submit a lead"
    ON public.leads FOR INSERT
    TO anon, authenticated
    WITH CHECK (true);

-- Only admins can view, update or delete leads
CREATE POLICY "Admins have full access to leads"
    ON public.leads FOR ALL
    TO authenticated
    USING (public.is_admin())
    WITH CHECK (public.is_admin());

-- 6. site_content policies
CREATE POLICY "Public can view site content"
    ON public.site_content FOR SELECT
    TO anon, authenticated
    USING (true);

CREATE POLICY "Admins can update site content"
    ON public.site_content FOR ALL
    TO authenticated
    USING (public.is_admin())
    WITH CHECK (public.is_admin());

-- ====================================================================
-- SEED DATA (INITIAL PRODUCTS & POSTS)
-- ====================================================================

INSERT INTO public.products (id, title, slug, category, short_description, full_description, product_type, format, price_inr, price_usd, is_free, cover_image_url, file_url, status, badge, featured, sort_order)
VALUES
(
    'prod_10complexes',
    'The 10 Kettlebell Complexes',
    '10-kettlebell-complexes',
    'Book',
    'The core system. 10 complete complexes for everyday people who train around real work and life.',
    'A complete framework of 10 field-tested kettlebell complexes designed for working professionals. No programming headaches, no gym required. Includes Earth to Sky, Sun & Shadow, Thunderclap, Mountain Stream, and the Goal-Matching Matrix.',
    'digital_download',
    'PDF (Digital Download)',
    0,
    0,
    true,
    'assets/author-photo.png',
    'downloads/10-complexes-guide.pdf',
    'published',
    'Popular',
    true,
    1
),
(
    'prod_elrx_blueprint',
    'E.L.R.x Method Blueprint',
    'elrx-method-blueprint',
    'Guide',
    'The complete programming architecture. How to combine kettlebell training, running, and recovery without burnout.',
    'Detailed periodization, volume control, nutrition protocols, and weekly schedules for building strength and endurance simultaneously.',
    'digital_download',
    'PDF (Digital Download)',
    999,
    19,
    false,
    'assets/author-photo.png',
    'downloads/elrx-blueprint.pdf',
    'published',
    'Essential',
    false,
    2
),
(
    'prod_hyrox_prep',
    'Kettlebell Hyrox Hybrid Prep',
    'kettlebell-hyrox-hybrid-prep',
    'Program',
    'Specific 12-week preparation template using kettlebells and running intervals for hybrid endurance events.',
    'Built from personal training experience finishing HYROX Mumbai and Yoddha Race without missing training weeks.',
    'digital_download',
    'PDF (Digital Download)',
    1499,
    29,
    false,
    'assets/hyrox-mumbai.png',
    'downloads/hyrox-prep.pdf',
    'published',
    'Advanced',
    false,
    3
),
(
    'prod_skool_guild',
    'The Everyday Athlete Guild',
    'everyday-athlete-guild',
    'Community',
    'Private Skool community for daily check-ins, form reviews, technique breakdowns, and live Q&A sessions with Abhi Singh.',
    'Join our private Skool community for working professionals, lifters, and runners building sustainable fitness for life.',
    'external_link',
    'Skool Community Membership',
    2499,
    49,
    false,
    'assets/hyrox-patch.jpg',
    NULL,
    'published',
    'Community',
    false,
    4
)
ON CONFLICT (id) DO NOTHING;

UPDATE public.products 
SET external_url = 'https://www.skool.com/elrx-guild' 
WHERE id = 'prod_skool_guild';

-- Seed initial site content configuration
INSERT INTO public.site_content (key, data)
VALUES
(
    'homepage_hero',
    '{
        "headline": "Train your strength, muscle & endurance every day",
        "subheadline": "I''m an ordinary guy — sales professional, not an athlete — who figured out a simple kettlebell system that fits around a full life.",
        "book_title": "Eat. Lift. Run. x",
        "book_subtitle": "10 KETTLEBELL COMPLEXES FOR EVERYDAY PEOPLE",
        "cta_text": "Get the complexes →"
    }'::jsonb
),
(
    'credentials',
    '{
        "ace": {
            "title": "American Council on Exercise",
            "subtitle": "Certified Personal Trainer · NCCA Accredited",
            "image": "assets/ace-certificate.jpg"
        },
        "hyrox": {
            "title": "HYROX Mumbai",
            "subtitle": "Official Open Singles Patch · 2026/2027",
            "image": "assets/hyrox-patch.jpg"
        },
        "yoddha": {
            "title": "The Yoddha Race",
            "subtitle": "Finisher Medal · The Ultimate Fitness Challenge",
            "image": "assets/yoddha-medal.jpg"
        }
    }'::jsonb
)
ON CONFLICT (key) DO NOTHING;

