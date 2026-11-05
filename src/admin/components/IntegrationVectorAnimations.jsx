import React from 'react';

/**
 * 1. Supabase Animated Vector SVG
 * Features layered database cylinders with animated vertical data flow.
 */
export function SupabaseVectorAnim() {
  return (
    <div className="api-vector-wrap supabase-vector">
      <svg viewBox="0 0 54 54" className="api-vector-svg">
        <defs>
          <linearGradient id="supaGrad" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#3ECF8E" />
            <stop offset="100%" stopColor="#249361" />
          </linearGradient>
          <linearGradient id="supaPulse" x1="0%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%" stopColor="#3ECF8E" stopOpacity="0.8" />
            <stop offset="100%" stopColor="#3ECF8E" stopOpacity="0" />
          </linearGradient>
        </defs>

        {/* Database Cylinders */}
        {/* Bottom Cylinder */}
        <ellipse cx="27" cy="40" rx="18" ry="6" fill="#E6F9F1" stroke="#3ECF8E" strokeWidth="2" />
        <path d="M 9 32 A 18 6 0 0 0 45 32 L 45 40 A 18 6 0 0 1 9 40 Z" fill="#E6F9F1" stroke="#3ECF8E" strokeWidth="2" />

        {/* Middle Cylinder */}
        <ellipse cx="27" cy="27" rx="18" ry="6" fill="#FFFFFF" stroke="#3ECF8E" strokeWidth="2" />
        <path d="M 9 19 A 18 6 0 0 0 45 19 L 45 27 A 18 6 0 0 1 9 27 Z" fill="#FFFFFF" stroke="#3ECF8E" strokeWidth="2" />

        {/* Top Cylinder Head */}
        <ellipse cx="27" cy="14" rx="18" ry="6" fill="url(#supaGrad)" stroke="#249361" strokeWidth="2" />

        {/* Animated Data Packets (Vertical Flow) */}
        <circle cx="27" cy="14" r="3.5" fill="#FFFFFF" className="vector-pulse-packet">
          <animate attributeName="cy" values="14; 27; 40; 14" dur="2.4s" repeatCount="indefinite" />
          <animate attributeName="opacity" values="1; 0.7; 0.2; 1" dur="2.4s" repeatCount="indefinite" />
        </circle>
        <circle cx="18" cy="16" r="2" fill="#3ECF8E" className="vector-pulse-packet">
          <animate attributeName="cy" values="16; 29; 42; 16" dur="2.4s" begin="0.8s" repeatCount="indefinite" />
          <animate attributeName="opacity" values="0.8; 0.4; 0.1; 0.8" dur="2.4s" begin="0.8s" repeatCount="indefinite" />
        </circle>
        <circle cx="36" cy="16" r="2" fill="#3ECF8E" className="vector-pulse-packet">
          <animate attributeName="cy" values="16; 29; 42; 16" dur="2.4s" begin="1.6s" repeatCount="indefinite" />
          <animate attributeName="opacity" values="0.8; 0.4; 0.1; 0.8" dur="2.4s" begin="1.6s" repeatCount="indefinite" />
        </circle>
      </svg>
    </div>
  );
}

/**
 * 2. Razorpay Animated Vector SVG
 * Features payment credit card & UPI rupee node with security beam.
 */
export function RazorpayVectorAnim() {
  return (
    <div className="api-vector-wrap razorpay-vector">
      <svg viewBox="0 0 54 54" className="api-vector-svg">
        <defs>
          <linearGradient id="rzpCardGrad" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#FF6200" />
            <stop offset="100%" stopColor="#E05500" />
          </linearGradient>
          <linearGradient id="rzpGleam" x1="0%" y1="0%" x2="100%" y2="0%">
            <stop offset="0%" stopColor="#FFFFFF" stopOpacity="0" />
            <stop offset="50%" stopColor="#FFFFFF" stopOpacity="0.6" />
            <stop offset="100%" stopColor="#FFFFFF" stopOpacity="0" />
          </linearGradient>
        </defs>

        {/* Card Silhouette */}
        <rect x="7" y="13" width="40" height="28" rx="5" fill="url(#rzpCardGrad)" stroke="#212121" strokeWidth="1.5" />
        
        {/* Card Magnetic Stripe / Header line */}
        <rect x="7" y="19" width="40" height="5" fill="#212121" opacity="0.3" />

        {/* Gold Smart Chip */}
        <rect x="12" y="27" width="9" height="7" rx="1.5" fill="#FFE785" stroke="#E6C84F" strokeWidth="1" />

        {/* Glowing UPI Rupee Symbol Badge */}
        <circle cx="37" cy="30" r="7" fill="#FFFFFF" stroke="#FF6200" strokeWidth="1.5" />
        <text x="37" y="34" fontSize="9" fontWeight="900" fill="#FF6200" textAnchor="middle" fontFamily="sans-serif">
          ₹
        </text>

        {/* Animated Sweep Shimmer across Card */}
        <rect x="7" y="13" width="10" height="28" rx="5" fill="url(#rzpGleam)" className="vector-shimmer-beam">
          <animate attributeName="x" values="0; 45; 0" dur="3s" repeatCount="indefinite" />
        </rect>
      </svg>
    </div>
  );
}

/**
 * 3. PayPal Animated Vector SVG
 * Features dual-P emblem with rotating orbital planetary payment rings.
 */
export function PayPalVectorAnim() {
  return (
    <div className="api-vector-wrap paypal-vector">
      <svg viewBox="0 0 54 54" className="api-vector-svg">
        <defs>
          <linearGradient id="ppGrad1" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#003087" />
            <stop offset="100%" stopColor="#001C48" />
          </linearGradient>
          <linearGradient id="ppGrad2" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#0079C1" />
            <stop offset="100%" stopColor="#00457C" />
          </linearGradient>
        </defs>

        {/* Rotating Orbital Dashed Ring */}
        <circle
          cx="27"
          cy="27"
          r="23"
          fill="none"
          stroke="#0079C1"
          strokeWidth="1.5"
          strokeDasharray="4 4"
          className="vector-orbit-ring"
        >
          <animateTransform
            attributeName="transform"
            type="rotate"
            from="0 27 27"
            to="360 27 27"
            dur="10s"
            repeatCount="indefinite"
          />
        </circle>

        {/* Orbit Satellite Pulse Node */}
        <circle cx="27" cy="4" r="3" fill="#FFE785" stroke="#003087" strokeWidth="1">
          <animateTransform
            attributeName="transform"
            type="rotate"
            from="0 27 27"
            to="360 27 27"
            dur="10s"
            repeatCount="indefinite"
          />
        </circle>

        {/* Back 'P' (Navy) */}
        <path
          d="M 18 12 L 28 12 C 33 12 36 15 35 20 C 34 25 31 27 26 27 L 22 27 L 18 42 Z"
          fill="url(#ppGrad1)"
        />

        {/* Front 'P' (Light Blue, Overlapping) */}
        <path
          d="M 23 18 L 32 18 C 37 18 39 21 38 25 C 37 29 34 32 30 32 L 26 32 L 23 44 Z"
          fill="url(#ppGrad2)"
          opacity="0.92"
        />
      </svg>
    </div>
  );
}

/**
 * 4. Zoho Campaigns Animated Vector SVG
 * Features marketing funnel with pulsating audience network nodes.
 */
export function ZohoVectorAnim() {
  return (
    <div className="api-vector-wrap zoho-vector">
      <svg viewBox="0 0 54 54" className="api-vector-svg">
        <defs>
          <linearGradient id="zohoGrad" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#EF4444" />
            <stop offset="100%" stopColor="#DC2626" />
          </linearGradient>
        </defs>

        {/* Funnel Outline */}
        <polygon points="10,12 44,12 32,30 32,44 22,40 22,30" fill="#FFF5F5" stroke="#EF4444" strokeWidth="2" />

        {/* Funnel Rings */}
        <line x1="14" y1="18" x2="40" y2="18" stroke="#EF4444" strokeWidth="1.5" strokeDasharray="2 2" />
        <line x1="20" y1="25" x2="34" y2="25" stroke="#EF4444" strokeWidth="1.5" strokeDasharray="2 2" />

        {/* Animated Audience Drops */}
        <circle cx="27" cy="14" r="3" fill="#EF4444">
          <animate attributeName="cy" values="12; 25; 38" dur="1.8s" repeatCount="indefinite" />
          <animate attributeName="r" values="3.5; 2.5; 1.5" dur="1.8s" repeatCount="indefinite" />
          <animate attributeName="opacity" values="1; 0.8; 0" dur="1.8s" repeatCount="indefinite" />
        </circle>

        <circle cx="20" cy="14" r="2.5" fill="#FF6200">
          <animate attributeName="cy" values="12; 24; 36" dur="1.8s" begin="0.6s" repeatCount="indefinite" />
          <animate attributeName="opacity" values="1; 0.7; 0" dur="1.8s" begin="0.6s" repeatCount="indefinite" />
        </circle>

        <circle cx="34" cy="14" r="2.5" fill="#FFE785">
          <animate attributeName="cy" values="12; 24; 36" dur="1.8s" begin="1.2s" repeatCount="indefinite" />
          <animate attributeName="opacity" values="1; 0.7; 0" dur="1.8s" begin="1.2s" repeatCount="indefinite" />
        </circle>
      </svg>
    </div>
  );
}

/**
 * 5. Resend Email Animated Vector SVG
 * Features aerodynamic paper plane with speed trails and subtle levitation.
 */
export function ResendVectorAnim() {
  return (
    <div className="api-vector-wrap resend-vector">
      <svg viewBox="0 0 54 54" className="api-vector-svg">
        <defs>
          <linearGradient id="resendGrad" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#18181B" />
            <stop offset="100%" stopColor="#27272A" />
          </linearGradient>
        </defs>

        {/* Flying Dashed Trajectory */}
        <path
          d="M 8 42 C 16 38, 20 28, 29 25"
          fill="none"
          stroke="#FF6200"
          strokeWidth="1.5"
          strokeDasharray="3 3"
        >
          <animate attributeName="stroke-dashoffset" values="0; -12" dur="1.2s" repeatCount="indefinite" />
        </path>

        {/* Paper Plane Group with Levitation Animation */}
        <g className="vector-plane-group">
          {/* Main Wing Body */}
          <polygon points="46,12 16,28 27,33" fill="url(#resendGrad)" stroke="#18181B" strokeWidth="1.2" />
          {/* Left Wing Fold */}
          <polygon points="46,12 27,33 34,42 36,31" fill="#3F3F46" />
          {/* Top Wing Highlight */}
          <polygon points="46,12 27,33 42,24" fill="#52525B" />
          {/* Thrust Spark Node */}
          <circle cx="16" cy="28" r="2" fill="#FF6200">
            <animate attributeName="r" values="2; 3.5; 2" dur="0.8s" repeatCount="indefinite" />
            <animate attributeName="opacity" values="0.6; 1; 0.6" dur="0.8s" repeatCount="indefinite" />
          </circle>
        </g>
      </svg>
    </div>
  );
}

