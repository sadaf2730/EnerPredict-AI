import React, { useState } from 'react';
import {
  Sparkles,
  TrendingDown,
  Clock,
  Zap,
  Sun,
  ChevronDown,
  ChevronUp,
  CheckCircle,
  IndianRupee,
  Filter,
} from 'lucide-react';

const RecommendationsList = ({ recommendations = [] }) => {
  const [activeFilter, setActiveFilter] = useState('all');
  const [expandedIds, setExpandedIds] = useState({});

  const toggleExpand = (id) => {
    setExpandedIds((prev) => ({
      ...prev,
      [id]: !prev[id],
    }));
  };

  // Calculate total monthly potential savings
  const totalPotentialSavings = recommendations.reduce(
    (acc, r) => acc + (r.estimatedSavingsMonthly || 0),
    0
  );

  // Filter recommendations
  const filtered = recommendations.filter((r) => {
    if (activeFilter === 'all') return true;
    if (activeFilter === 'high') return r.priority === 'high';
    if (activeFilter === 'timing') return r.category === 'timing';
    if (activeFilter === 'appliance') return r.category === 'appliance';
    if (activeFilter === 'solar') return r.category === 'solar';
    return true;
  });

  const getCategoryIcon = (category) => {
    switch (category) {
      case 'timing':
        return Clock;
      case 'appliance':
        return Zap;
      case 'solar':
        return Sun;
      default:
        return TrendingDown;
    }
  };

  const getPriorityStyle = (priority) => {
    switch (priority) {
      case 'high':
        return { bg: 'rgba(239, 68, 68, 0.15)', text: '#f87171', border: 'rgba(239, 68, 68, 0.3)' };
      case 'medium':
        return { bg: 'rgba(245, 158, 11, 0.15)', text: '#fbbf24', border: 'rgba(245, 158, 11, 0.3)' };
      default:
        return { bg: 'rgba(14, 165, 233, 0.15)', text: '#38bdf8', border: 'rgba(14, 165, 233, 0.3)' };
    }
  };

  return (
    <div
      style={{
        background: 'var(--bg-card-gradient)',
        border: '1px solid var(--border-card)',
        borderRadius: '16px',
        padding: '1.5rem',
        boxShadow: 'var(--shadow-card)',
        display: 'flex',
        flexDirection: 'column',
        gap: '1.25rem',
        transition: 'var(--theme-transition)',
      }}
    >
      {/* Top Banner & Header */}
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'flex-start',
          flexWrap: 'wrap',
          gap: '1rem',
        }}
      >
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <Sparkles size={20} color="var(--primary)" />
            <h3 style={{ fontSize: '1.15rem', fontWeight: '700', color: 'var(--text-heading)', margin: 0 }}>
              Personalized Optimization Strategies
            </h3>
          </div>
          <p style={{ fontSize: '0.82rem', color: 'var(--text-muted)', margin: '4px 0 0 0' }}>
            Data-driven actions tailored to your equipment schedule and predicted peak demand
          </p>
        </div>

        {/* Total savings callout badge */}
        {totalPotentialSavings > 0 && (
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '10px',
              padding: '8px 16px',
              borderRadius: '12px',
              background: 'var(--primary-bg-subtle)',
              border: '1px solid var(--primary-border-subtle)',
              boxShadow: '0 0 15px var(--primary-glow)',
            }}
          >
            <div
              style={{
                width: '32px',
                height: '32px',
                borderRadius: '8px',
                background: 'var(--primary)',
                color: '#fff',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <IndianRupee size={18} />
            </div>
            <div>
              <span style={{ display: 'block', fontSize: '0.72rem', color: 'var(--primary)', fontWeight: '600', textTransform: 'uppercase' }}>
                Total Potential Savings
              </span>
              <span style={{ fontSize: '1.15rem', fontWeight: '800', color: 'var(--text-heading)', fontFamily: 'monospace' }}>
                ₹{totalPotentialSavings.toLocaleString('en-IN')}{' '}
                <span style={{ fontSize: '0.78rem', color: 'var(--text-muted)', fontWeight: 'normal' }}>/ month</span>
              </span>
            </div>
          </div>
        )}
      </div>

      {/* Filter Tabs */}
      <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
        {[
          { id: 'all', label: 'All Recommendations' },
          { id: 'high', label: 'High Priority' },
          { id: 'timing', label: 'Peak Load Shifting' },
          { id: 'appliance', label: 'Appliance Tuning' },
          { id: 'solar', label: 'Solar & Renewable' },
        ].map((f) => (
          <button
            key={f.id}
            type="button"
            onClick={() => setActiveFilter(f.id)}
            style={{
              padding: '6px 12px',
              borderRadius: '20px',
              fontSize: '0.78rem',
              fontWeight: '600',
              cursor: 'pointer',
              transition: 'all 0.2s ease',
              border: activeFilter === f.id ? '1px solid var(--primary)' : '1px solid var(--border-subtle)',
              background: activeFilter === f.id ? 'var(--primary-bg-subtle)' : 'var(--bg-card-inner)',
              color: activeFilter === f.id ? 'var(--primary)' : 'var(--text-muted)',
            }}
          >
            {f.label}
          </button>
        ))}
      </div>

      {/* List */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
        {filtered.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '2rem 0', color: 'var(--text-muted)' }}>
            No recommendations match this filter.
          </div>
        ) : (
          filtered.map((rec) => {
            const isExpanded = expandedIds[rec.id] ?? true; // expanded by default
            const Icon = getCategoryIcon(rec.category);
            const prioStyle = getPriorityStyle(rec.priority);

            return (
              <div
                key={rec.id}
                style={{
                  borderRadius: '14px',
                  background: 'var(--bg-card-inner)',
                  border: '1px solid var(--border-inner)',
                  overflow: 'hidden',
                  transition: 'border-color 0.2s ease',
                }}
              >
                {/* Clickable Header Bar */}
                <div
                  onClick={() => toggleExpand(rec.id)}
                  style={{
                    padding: '1rem 1.25rem',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    gap: '12px',
                    background: isExpanded ? 'var(--bg-card-inner-subtle)' : 'transparent',
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '12px', flex: 1 }}>
                    <div
                      style={{
                        width: '38px',
                        height: '38px',
                        borderRadius: '10px',
                        background: 'var(--primary-bg-subtle)',
                        border: '1px solid var(--primary-border-subtle)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        color: 'var(--primary)',
                        flexShrink: 0,
                      }}
                    >
                      <Icon size={18} />
                    </div>

                    <div style={{ flex: 1 }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
                        <span style={{ fontSize: '0.96rem', fontWeight: '700', color: 'var(--text-heading)' }}>
                          {rec.title}
                        </span>
                        <span
                          style={{
                            fontSize: '0.68rem',
                            fontWeight: '700',
                            padding: '2px 8px',
                            borderRadius: '12px',
                            background: prioStyle.bg,
                            color: prioStyle.text,
                            border: `1px solid ${prioStyle.border}`,
                            textTransform: 'uppercase',
                          }}
                        >
                          {rec.priority}
                        </span>
                      </div>
                      <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)', margin: '2px 0 0 0' }}>
                        {rec.expectedEffect}
                      </p>
                    </div>
                  </div>

                  {/* Savings Badge & Chevron */}
                  <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                    {rec.estimatedSavingsMonthly > 0 && (
                      <div
                        style={{
                          padding: '4px 10px',
                          borderRadius: '8px',
                          background: 'var(--primary-bg-subtle)',
                          border: '1px solid var(--primary-border-subtle)',
                          color: 'var(--primary)',
                          fontSize: '0.82rem',
                          fontWeight: '700',
                          whiteSpace: 'nowrap',
                        }}
                      >
                        ~₹{rec.estimatedSavingsMonthly.toLocaleString('en-IN')}/mo
                      </div>
                    )}

                    <button
                      type="button"
                      style={{
                        background: 'none',
                        border: 'none',
                        color: 'var(--text-muted)',
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                      }}
                    >
                      {isExpanded ? <ChevronUp size={18} /> : <ChevronDown size={18} />}
                    </button>
                  </div>
                </div>

                {/* Expanded Details Body */}
                {isExpanded && (
                  <div
                    style={{
                      padding: '0 1.25rem 1.25rem 1.25rem',
                      borderTop: '1px solid var(--border-inner)',
                      display: 'flex',
                      flexDirection: 'column',
                      gap: '10px',
                      fontSize: '0.84rem',
                    }}
                  >
                    {/* Why this applies */}
                    <div style={{ marginTop: '0.75rem' }}>
                      <span style={{ color: 'var(--text-main)', fontWeight: '600', display: 'block', marginBottom: '2px' }}>
                        Why this is relevant:
                      </span>
                      <p style={{ color: 'var(--text-muted)', margin: 0, lineHeight: 1.5 }}>
                        {rec.why}
                      </p>
                    </div>

                    {/* Action Step */}
                    <div
                      style={{
                        padding: '10px 12px',
                        borderRadius: '8px',
                        background: 'var(--primary-bg-subtle)',
                        border: '1px solid var(--primary-border-subtle)',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '8px',
                      }}
                    >
                      <CheckCircle size={16} color="var(--primary)" style={{ flexShrink: 0 }} />
                      <span style={{ color: 'var(--text-main)', fontWeight: '500' }}>
                        <strong>Actionable Step:</strong> {rec.actionStep}
                      </span>
                    </div>
                  </div>
                )}
              </div>
            );
          })
        )}
      </div>
    </div>
  );
};

export default RecommendationsList;
