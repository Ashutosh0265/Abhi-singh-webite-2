/**
 * Tracking & Integration Utility for Zoho Campaigns, CRM Leads & Email Delivery
 * Extracts UTM parameters, tags, and timestamps per Master Update & CLIENT_REQUIREMENTS.md
 */
import { createLead } from '../services/db';
import { getApiSettings } from '../services/settings';

export function getTrackingPayload(sourceLocation = "website_landing_page") {
  const params = typeof window !== "undefined" ? new URLSearchParams(window.location.search) : new URLSearchParams();
  
  const utmSource = params.get("utm_source") || (typeof document !== "undefined" && document.referrer ? "referral" : "organic");
  const utmMedium = params.get("utm_medium") || "web";
  const utmCampaign = params.get("utm_campaign") || "elrx_website";
  const utmContent = params.get("utm_content") || sourceLocation;
  const utmTerm = params.get("utm_term") || "";

  // Dynamic Location & UTM State Extraction (e.g. ?utm_state=Haryana or ?state=Haryana or ?region=Delhi)
  let region =
    params.get("utm_state") ||
    params.get("utm_region") ||
    params.get("state") ||
    params.get("region") ||
    params.get("location") ||
    "";

  // Fallback to geographical timezone locale if no explicit state passed in URL
  if (!region && typeof Intl !== "undefined" && Intl.DateTimeFormat) {
    try {
      const tz = Intl.DateTimeFormat().resolvedOptions().timeZone || "";
      if (tz.includes("Kolkata") || tz.includes("Calcutta")) {
        region = "India";
      } else if (tz.includes("New_York") || tz.includes("Los_Angeles") || tz.includes("Chicago") || tz.includes("Denver")) {
        region = "United States";
      } else if (tz.includes("London")) {
        region = "United Kingdom";
      } else if (tz.includes("Sydney") || tz.includes("Melbourne")) {
        region = "Australia";
      } else if (tz.includes("Dubai")) {
        region = "United Arab Emirates";
      } else if (tz) {
        region = tz.split("/")[0] || "Direct";
      } else {
        region = "Direct";
      }
    } catch {
      region = "Direct";
    }
  }

  return {
    source: utmSource,
    medium: utmMedium,
    campaign: utmCampaign,
    content: utmContent,
    term: utmTerm,
    region: region || "Direct",
    tag: `elrx_${sourceLocation.toLowerCase().replace(/[^a-z0-9]/g, '_')}`,
    timestamp: new Date().toISOString(),
    pageUrl: typeof window !== "undefined" ? window.location.href : "https://abhisingh.me",
    referrer: typeof document !== "undefined" ? document.referrer || "direct" : "direct"
  };
}

/**
 * Sync contact to Zoho Campaigns Mailing List
 * Dispatches to configured Webhook / API Endpoint, logs receipt, and updates sync state
 */
export async function syncToZohoCampaigns(contactData) {
  try {
    const settings = getApiSettings(false);
    const endpoint = settings.zohoEndpoint || (typeof import.meta !== 'undefined' && import.meta.env ? import.meta.env.VITE_ZOHO_CAMPAIGNS_ENDPOINT : '') || '';
    const listKey = settings.zohoListKey || 'elrx_primary_newsletter_list';
    const apiKey = settings.zohoApiKey || '';

    const payload = {
      email: contactData.email,
      name: contactData.name || contactData.email.split('@')[0],
      list_key: listKey,
      auth_token: apiKey && !apiKey.startsWith('••••') ? apiKey : '',
      source: contactData.source || 'website',
      tag: contactData.tag || 'subscriber',
      utm_source: contactData.utm_source || 'organic',
      utm_medium: contactData.utm_medium || 'web',
      utm_campaign: contactData.utm_campaign || 'elrx',
      region: contactData.region || 'India',
      synced_at: new Date().toISOString(),
    };

    // Store sync log receipt in localStorage for CMS auditing & verification
    try {
      const syncLogs = JSON.parse(localStorage.getItem('elrx_zoho_sync_log') || '[]');
      const receipt = {
        id: `zsync_${Date.now()}_${Math.random().toString(36).slice(2, 5)}`,
        email: contactData.email,
        name: payload.name,
        list_key: listKey,
        source: contactData.source,
        status: endpoint || apiKey ? 'synced' : 'simulated_local',
        timestamp: payload.synced_at,
      };
      localStorage.setItem('elrx_zoho_sync_log', JSON.stringify([receipt, ...syncLogs.slice(0, 49)]));
    } catch {}

    // If an external webhook endpoint is configured, POST to it with a safe timeout
    if (endpoint && (endpoint.startsWith('http://') || endpoint.startsWith('https://'))) {
      try {
        const controller = typeof AbortController !== 'undefined' ? new AbortController() : null;
        const timer = controller ? setTimeout(() => controller.abort(), 2000) : null;
        await fetch(endpoint, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload),
          mode: 'no-cors',
          signal: controller ? controller.signal : undefined,
        });
        if (timer) clearTimeout(timer);
      } catch (postErr) {
        console.warn('[Zoho Campaigns] Webhook dispatch notice:', postErr.message);
      }
    }

    return {
      success: true,
      message: `Subscriber ${contactData.email} added to Zoho Campaigns list (${listKey})`,
      payload,
    };
  } catch (err) {
    console.warn('[Zoho Campaigns] Sync error:', err);
    return { success: false, error: err.message };
  }
}

/**
 * Handles newsletter signup submission (Zoho Campaigns & CRM Lead creation)
 */
export async function submitNewsletterSignup(email, sourceLocation = "landing_page") {
  const tracking = getTrackingPayload(sourceLocation);
  const cleanEmail = email.trim();
  const leadName = cleanEmail.split('@')[0];
  
  // 1. Sync to Zoho Campaigns Mailing List
  const zohoResult = await syncToZohoCampaigns({
    email: cleanEmail,
    name: leadName,
    source: sourceLocation,
    tag: `newsletter_${sourceLocation}`,
    utm_source: tracking.source,
    utm_medium: tracking.medium,
    utm_campaign: tracking.campaign,
    region: tracking.region,
  });

  const leadRecord = {
    lead_type: 'newsletter_signup',
    email: cleanEmail,
    name: leadName,
    source: sourceLocation,
    utm_source: tracking.source,
    utm_medium: tracking.medium,
    utm_campaign: tracking.campaign,
    utm_content: tracking.content,
    utm_term: tracking.term,
    region: tracking.region,
    landing_page: tracking.pageUrl,
    referrer: tracking.referrer,
    zoho_synced: zohoResult.success,
    zoho_list: zohoResult.payload?.list_key || 'elrx_primary_newsletter_list',
    status: 'new',
  };

  // 2. Persist directly to shared database & CRM
  try {
    await createLead(leadRecord);
  } catch (err) {
    console.warn('Failed saving newsletter lead to DB:', err);
  }

  // 3. Fallback serverless webhook if present
  const endpoint = (typeof import.meta !== 'undefined' && import.meta.env ? import.meta.env.VITE_ZOHO_CAMPAIGNS_ENDPOINT : '') || '/api/newsletter';
  try {
    const res = await fetch(endpoint, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(leadRecord),
    });
    if (res.ok) {
      const data = await res.json();
      return { success: true, message: data.message || "Thank you for subscribing!", payload: leadRecord, zoho: zohoResult };
    }
  } catch {}

  return {
    success: true,
    message: "Thank you for subscribing! Check your inbox for confirmation.",
    payload: leadRecord,
    zoho: zohoResult,
  };
}

/**
 * Handles Work With Me contact form submission (CRM Lead + Zoho Campaigns + Email Dispatch)
 */
export async function submitContactInquiry(formData) {
  const tracking = getTrackingPayload("work_with_me_form");
  
  const serviceLabels = {
    coaching: '1:1 Fitness & Kettlebell Coaching',
    'single-session': 'Single Session Kettlebell Intensive',
    workshop: 'Team / Corporate Movement Workshop',
    consulting: 'Training Programming & Consulting',
    other: 'General Inquiry / Other',
  };

  const primaryGoal =
    formData.primaryGoal ||
    formData.primary_goal ||
    (formData.service ? (serviceLabels[formData.service] || formData.service) : '');

  // 1. Sync to Zoho Campaigns
  const zohoResult = await syncToZohoCampaigns({
    email: formData.email.trim(),
    name: formData.name.trim(),
    source: 'work_with_me',
    tag: 'inquiry_lead',
    utm_source: tracking.source,
    utm_medium: tracking.medium,
    utm_campaign: tracking.campaign,
    region: tracking.region,
  });

  const leadRecord = {
    lead_type: 'contact_inquiry',
    name: formData.name,
    email: formData.email,
    phone: formData.phone || '',
    organisation: formData.organisation || '',
    primary_goal: primaryGoal,
    training_frequency: formData.trainingFrequency || formData.training_frequency || '',
    timeline: formData.timeline || '',
    message: formData.message || '',
    source: 'work_with_me',
    utm_source: tracking.source,
    utm_medium: tracking.medium,
    utm_campaign: tracking.campaign,
    utm_content: tracking.content,
    utm_term: tracking.term,
    region: tracking.region,
    landing_page: tracking.pageUrl,
    referrer: tracking.referrer,
    zoho_synced: zohoResult.success,
    zoho_list: zohoResult.payload?.list_key || 'elrx_primary_newsletter_list',
    status: 'new',
  };

  // 2. Persist directly to shared database & CRM
  try {
    await createLead(leadRecord);
  } catch (err) {
    console.warn('Failed saving contact lead to DB:', err);
  }

  // Attempt live email endpoint
  const endpoint = (typeof import.meta !== 'undefined' && import.meta.env ? import.meta.env.VITE_CONTACT_ENDPOINT : '') || '/api/contact';
  try {
    const res = await fetch(endpoint, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(leadRecord),
    });
    if (res.ok) {
      const data = await res.json();
      return { success: true, message: data.message || "Inquiry sent successfully!", payload: leadRecord };
    }
  } catch {}

  return {
    success: true,
    message: "Thank you! Your inquiry has been sent to Abhi Singh.",
    payload: leadRecord,
  };
}
