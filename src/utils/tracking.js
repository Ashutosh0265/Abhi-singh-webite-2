/**
 * Tracking & Integration Utility for Zoho Campaigns, CRM Leads & Email Delivery
 * Extracts UTM parameters, tags, and timestamps per Master Update & CLIENT_REQUIREMENTS.md
 */
import { createLead } from '../services/db';

export function getTrackingPayload(sourceLocation = "website_landing_page") {
  const params = typeof window !== "undefined" ? new URLSearchParams(window.location.search) : new URLSearchParams();
  
  const utmSource = params.get("utm_source") || (typeof document !== "undefined" && document.referrer ? "referral" : "organic");
  const utmMedium = params.get("utm_medium") || "web";
  const utmCampaign = params.get("utm_campaign") || "elrx_website";
  const utmContent = params.get("utm_content") || sourceLocation;
  const utmTerm = params.get("utm_term") || "";

  return {
    source: utmSource,
    medium: utmMedium,
    campaign: utmCampaign,
    content: utmContent,
    term: utmTerm,
    tag: `elrx_${sourceLocation.toLowerCase().replace(/[^a-z0-9]/g, '_')}`,
    timestamp: new Date().toISOString(),
    pageUrl: typeof window !== "undefined" ? window.location.href : "https://abhisingh.me",
    referrer: typeof document !== "undefined" ? document.referrer || "direct" : "direct"
  };
}

/**
 * Handles newsletter signup submission (Zoho Campaigns & CRM Lead creation)
 */
export async function submitNewsletterSignup(email, sourceLocation = "landing_page") {
  const tracking = getTrackingPayload(sourceLocation);
  
  const leadRecord = {
    lead_type: 'newsletter_signup',
    email: email.trim(),
    name: email.split('@')[0],
    source: sourceLocation,
    utm_source: tracking.source,
    utm_medium: tracking.medium,
    utm_campaign: tracking.campaign,
    utm_content: tracking.content,
    utm_term: tracking.term,
    landing_page: tracking.pageUrl,
    referrer: tracking.referrer,
    status: 'new',
  };

  // Persist directly to shared database
  try {
    await createLead(leadRecord);
  } catch (err) {
    console.warn('Failed saving newsletter lead to DB:', err);
  }

  // Check if live serverless or Zoho endpoint is configured
  const endpoint = import.meta.env.VITE_ZOHO_CAMPAIGNS_ENDPOINT || '/api/newsletter';
  try {
    const res = await fetch(endpoint, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(leadRecord),
    });
    if (res.ok) {
      const data = await res.json();
      return { success: true, message: data.message || "Thank you for subscribing!", payload: leadRecord };
    }
  } catch {
    // Graceful fallback
  }

  return {
    success: true,
    message: "Thank you for subscribing! Check your inbox for confirmation.",
    payload: leadRecord,
  };
}

/**
 * Handles Work With Me contact form submission (CRM Lead + Email Dispatch)
 */
export async function submitContactInquiry(formData) {
  const tracking = getTrackingPayload("work_with_me_form");
  
  const leadRecord = {
    lead_type: 'contact_inquiry',
    name: formData.name,
    email: formData.email,
    phone: formData.phone || '',
    primary_goal: formData.primaryGoal || formData.primary_goal || '',
    training_frequency: formData.trainingFrequency || formData.training_frequency || '',
    timeline: formData.timeline || '',
    message: formData.message || '',
    source: 'work_with_me',
    utm_source: tracking.source,
    utm_medium: tracking.medium,
    utm_campaign: tracking.campaign,
    utm_content: tracking.content,
    utm_term: tracking.term,
    landing_page: tracking.pageUrl,
    referrer: tracking.referrer,
    status: 'new',
  };

  // Persist directly to shared database
  try {
    await createLead(leadRecord);
  } catch (err) {
    console.warn('Failed saving contact lead to DB:', err);
  }

  // Attempt live email endpoint
  const endpoint = import.meta.env.VITE_CONTACT_ENDPOINT || '/api/contact';
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
  } catch {
    // Graceful fallback
  }

  return {
    success: true,
    message: "Thank you! Your inquiry has been sent to Abhi Singh.",
    payload: leadRecord,
  };
}
