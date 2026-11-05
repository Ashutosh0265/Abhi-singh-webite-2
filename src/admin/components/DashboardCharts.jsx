import React, { useState } from 'react';

/**
 * CustomerHabitsBarChart
 * Recreates the exact DealDeck-style dual-pill monthly bar chart with dynamic data & zero-baseline.
 */
export function CustomerHabitsBarChart({ monthlyHabits }) {
  const [activeMonthIdx, setActiveMonthIdx] = useState(6); // Default to current/latest month
  const [timeframe, setTimeframe] = useState('This year');

  const defaultMonths = [
    { month: 'Jan', seen: 0, sales: 0 },
    { month: 'Feb', seen: 0, sales: 0 },
    { month: 'Mar', seen: 0, sales: 0 },
    { month: 'Apr', seen: 0, sales: 0 },
    { month: 'May', seen: 0, sales: 0 },
    { month: 'Jun', seen: 0, sales: 0 },
    { month: 'Jul', seen: 0, sales: 0 },
  ];

  const monthsData = (monthlyHabits && monthlyHabits.length > 0) ? monthlyHabits : defaultMonths;

  // Calculate dynamic maximum to scale bars properly
  const maxVal = Math.max(
    1,
    ...monthsData.map((d) => Math.max(d.seen || 0, d.sales || 0))
  );

  // Dynamic Y-axis labels
  const yLabels = maxVal <= 5
    ? ['5', '4', '3', '2', '0']
    : maxVal <= 20
    ? ['20', '15', '10', '5', '0']
    : [`${maxVal}`, `${Math.round(maxVal * 0.75)}`, `${Math.round(maxVal * 0.5)}`, `${Math.round(maxVal * 0.25)}`, '0'];

  const activeData = monthsData[activeMonthIdx] || monthsData[0];

  return (
    <div className="stat-card stat-habits-card">
      <div className="stat-card-header">
        <div>
          <h3 className="stat-card-title">Customer Habits</h3>
          <p className="stat-card-subtitle">Track your customer habits &amp; conversion funnel</p>
        </div>
        <div className="stat-card-filter">
          <select
            className="stat-pill-select"
            value={timeframe}
            onChange={(e) => setTimeframe(e.target.value)}
          >
            <option value="This year">This year</option>
            <option value="Last 6 Months">Last 6 Months</option>
            <option value="This Month">This Month</option>
          </select>
        </div>
      </div>

      {/* Legend Dots */}
      <div className="stat-legend-row">
        <div className="stat-legend-item">
          <span className="stat-legend-dot dot-gray" />
          <span>Seen product</span>
        </div>
        <div className="stat-legend-item">
          <span className="stat-legend-dot dot-orange" />
          <span>Sales &amp; Downloads</span>
        </div>
      </div>

      {/* SVG Bar Chart with Speech-Bubble Tooltip */}
      <div className="stat-barchart-container">
        {/* Y-Axis scale labels */}
        <div className="stat-yaxis-labels">
          {yLabels.map((yl, i) => (
            <span key={i}>{yl}</span>
          ))}
        </div>

        {/* Bars Grid */}
        <div className="stat-bars-track">
          {monthsData.map((d, idx) => {
            const isActive = idx === activeMonthIdx;
            const seenHeight = Math.max(3, ((d.seen || 0) / maxVal) * 150);
            const salesHeight = Math.max(3, ((d.sales || 0) / maxVal) * 150);

            return (
              <div
                key={d.month}
                className={`stat-bar-group ${isActive ? 'active' : ''}`}
                onMouseEnter={() => setActiveMonthIdx(idx)}
                onClick={() => setActiveMonthIdx(idx)}
              >
                {/* Floating Black Tooltip */}
                {isActive && (
                  <div className="stat-bar-tooltip">
                    <div className="stat-tooltip-row">
                      <span className="stat-tooltip-dot dot-white" />
                      <span>{d.seen || 0} Products Seen</span>
                    </div>
                    <div className="stat-tooltip-row">
                      <span className="stat-tooltip-dot dot-orange" />
                      <span>{d.sales || 0} Sales / Downloads</span>
                    </div>
                    <div className="stat-tooltip-arrow" />
                  </div>
                )}

                {/* Gray Bar (Seen product) */}
                <div
                  className="stat-bar-pillar pillar-gray"
                  style={{ height: `${seenHeight}px`, opacity: (d.seen || 0) > 0 ? 1 : 0.35 }}
                />

                {/* Orange Bar (Sales / Downloads) */}
                <div
                  className="stat-bar-pillar pillar-orange"
                  style={{ height: `${salesHeight}px`, opacity: (d.sales || 0) > 0 ? 1 : 0.35 }}
                />

                {/* Month Label */}
                <span className="stat-bar-month-label">{d.month}</span>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

/**
 * ProductStatisticRadialGauge
 * Concentric multi-ring circular radial gauge matching DealDeck's Product Statistic card.
 */
export function ProductStatisticRadialGauge({ categoryStats, totalSold }) {
  const [timeframe, setTimeframe] = useState('Today');

  const kettlebellSales = categoryStats?.kettlebell?.sales || 0;
  const kettlebellCount = categoryStats?.kettlebell?.count || 0;

  const manualsSales = categoryStats?.manuals?.sales || 0;
  const manualsCount = categoryStats?.manuals?.count || 0;

  const coachingInquiries = categoryStats?.coaching?.inquiries || 0;

  const totalSalesCount = totalSold || (kettlebellSales + manualsSales);

  // Concentric arc calculations based on actual sales
  // Max scale reference = 10 (or totalSalesCount if > 10)
  const refScale = Math.max(10, totalSalesCount);

  // Outer Ring: Orange (#FF6200) - Kettlebell
  const r1Circumference = 2 * Math.PI * 76; // 477.5
  const r1Dashoffset = kettlebellSales > 0 ? r1Circumference - (kettlebellSales / refScale) * (r1Circumference * 0.75) : r1Circumference;

  // Middle Ring: Coral / Red (#EF4444) - Manuals
  const r2Circumference = 2 * Math.PI * 60; // 377
  const r2Dashoffset = manualsSales > 0 ? r2Circumference - (manualsSales / refScale) * (r2Circumference * 0.75) : r2Circumference;

  // Inner Ring: Dark Slate (#212121) - Consultations
  const r3Circumference = 2 * Math.PI * 44; // 276
  const r3Dashoffset = coachingInquiries > 0 ? r3Circumference - (coachingInquiries / refScale) * (r3Circumference * 0.75) : r3Circumference;

  return (
    <div className="stat-card stat-product-card">
      <div className="stat-card-header">
        <div>
          <h3 className="stat-card-title">Product Statistic</h3>
          <p className="stat-card-subtitle">Track your product sales breakdown</p>
        </div>
        <div className="stat-card-filter">
          <select
            className="stat-pill-select"
            value={timeframe}
            onChange={(e) => setTimeframe(e.target.value)}
          >
            <option value="Today">Today</option>
            <option value="This Week">This Week</option>
            <option value="This Month">This Month</option>
          </select>
        </div>
      </div>

      {/* Radial Multi-Ring Gauge with Top Number */}
      <div className="stat-gauge-wrap">
        <div className="stat-gauge-svg-container">
          <svg className="stat-radial-svg" viewBox="0 0 200 200">
            {/* Background Tracks */}
            <circle cx="100" cy="100" r="76" className="stat-ring-bg" strokeWidth="11" />
            <circle cx="100" cy="100" r="60" className="stat-ring-bg" strokeWidth="11" />
            <circle cx="100" cy="100" r="44" className="stat-ring-bg" strokeWidth="11" />

            {/* Concentric Active Rings */}
            {/* Outer Ring: Orange */}
            <circle
              cx="100"
              cy="100"
              r="76"
              className="stat-ring-active ring-orange"
              strokeWidth="11"
              strokeDasharray={r1Circumference}
              strokeDashoffset={r1Dashoffset}
            />
            {/* Middle Ring: Coral / Red */}
            <circle
              cx="100"
              cy="100"
              r="60"
              className="stat-ring-active ring-red"
              strokeWidth="11"
              strokeDasharray={r2Circumference}
              strokeDashoffset={r2Dashoffset}
            />
            {/* Inner Ring: Dark Slate */}
            <circle
              cx="100"
              cy="100"
              r="44"
              className="stat-ring-active ring-dark"
              strokeWidth="11"
              strokeDasharray={r3Circumference}
              strokeDashoffset={r3Dashoffset}
            />
          </svg>

          {/* Center Metric Display */}
          <div className="stat-gauge-center-info">
            <span className="stat-gauge-num">{totalSalesCount}</span>
            <span className="stat-gauge-label">Products Sales</span>
            <span className="stat-growth-badge badge-green">0.0%</span>
          </div>
        </div>
      </div>

      {/* Category Breakdown Rows */}
      <div className="stat-breakdown-list">
        <div className="stat-breakdown-row">
          <div className="stat-breakdown-name">
            <span className="stat-icon-bullet">📦</span>
            <span>Digital Kettlebell Programs</span>
          </div>
          <div className="stat-breakdown-val">
            <strong>{kettlebellSales}</strong>
            <span className="stat-growth-pill pill-green">{kettlebellCount} Active</span>
          </div>
        </div>

        <div className="stat-breakdown-row">
          <div className="stat-breakdown-name">
            <span className="stat-icon-bullet">📖</span>
            <span>Editorial Books &amp; Manuals</span>
          </div>
          <div className="stat-breakdown-val">
            <strong>{manualsSales}</strong>
            <span className="stat-growth-pill pill-green">{manualsCount} Active</span>
          </div>
        </div>

        <div className="stat-breakdown-row">
          <div className="stat-breakdown-name">
            <span className="stat-icon-bullet">📬</span>
            <span>Coaching &amp; Consultations</span>
          </div>
          <div className="stat-breakdown-val">
            <strong>{coachingInquiries}</strong>
            <span className="stat-growth-pill pill-green">Inquiries</span>
          </div>
        </div>
      </div>
    </div>
  );
}

/**
 * CustomerGrowthBubbles
 * Replaces squished clump with clean, spacious UTM & geographic tracking.
 */
export function CustomerGrowthBubbles({ locationBreakdown, totalVisitorsTracked }) {
  const [timeframe, setTimeframe] = useState('Today');

  const total = totalVisitorsTracked || 0;
  const topLocation = locationBreakdown && locationBreakdown.length > 0 ? locationBreakdown[0] : null;

  return (
    <div className="stat-card stat-growth-card">
      <div className="stat-card-header">
        <div>
          <h3 className="stat-card-title">Customer Growth</h3>
          <p className="stat-card-subtitle">Track customer by locations &amp; UTM parameters</p>
        </div>
        <div className="stat-card-filter">
          <select
            className="stat-pill-select"
            value={timeframe}
            onChange={(e) => setTimeframe(e.target.value)}
          >
            <option value="Today">Today</option>
            <option value="This Month">This Month</option>
            <option value="All Time">All Time</option>
          </select>
        </div>
      </div>

      {/* Spaced Metric Chips (Clean, Simple, Not Cluttered) */}
      <div className="stat-growth-layout">
        <div className="stat-growth-summary-pills">
          <div className="stat-growth-pill-item">
            <span className="stat-growth-pill-val">{total}</span>
            <span className="stat-growth-pill-label">Tracked Visitors</span>
          </div>
          <div className="stat-growth-pill-item">
            <span className="stat-growth-pill-val" style={{ color: '#FF6200' }}>
              {topLocation ? topLocation.name : 'Direct'}
            </span>
            <span className="stat-growth-pill-label">Top Location</span>
          </div>
          <div className="stat-growth-pill-item">
            <span className="stat-growth-pill-val" style={{ color: '#10B981' }}>Active</span>
            <span className="stat-growth-pill-label">UTM Capture</span>
          </div>
        </div>

        {/* Dynamic Location & UTM State List */}
        <div className="stat-country-list">
          {locationBreakdown && locationBreakdown.length > 0 ? (
            locationBreakdown.slice(0, 5).map((loc, i) => (
              <div key={i} className="stat-country-row">
                <div className="stat-country-name">
                  <span className="country-flag">
                    {loc.name.toLowerCase().includes('india') ? '🇮🇳' :
                     loc.name.toLowerCase().includes('united states') ? '🇺🇸' :
                     loc.name.toLowerCase().includes('australia') ? '🇦🇺' :
                     loc.name.toLowerCase().includes('kingdom') ? '🇬🇧' : '📍'}
                  </span>
                  <span>{loc.name}</span>
                </div>
                <div className="stat-country-bar-wrap">
                  <div
                    className="stat-country-progress"
                    style={{ width: `${Math.max(6, loc.pct || 0)}%` }}
                  />
                </div>
                <span className="stat-country-pct">{loc.count} ({loc.pct}%)</span>
              </div>
            ))
          ) : (
            <div className="stat-country-row" style={{ opacity: 0.75 }}>
              <div className="stat-country-name">
                <span className="country-flag">📍</span>
                <span>India (Domestic)</span>
              </div>
              <div className="stat-country-bar-wrap">
                <div className="stat-country-progress" style={{ width: '0%' }} />
              </div>
              <span className="stat-country-pct">0 (0%)</span>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
