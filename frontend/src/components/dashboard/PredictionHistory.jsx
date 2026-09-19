import React from 'react';
import { History, Calendar, Zap, ArrowRight, Check } from 'lucide-react';

const PredictionHistory = ({
  predictions = [],
  activePredictionId = null,
  onSelectPrediction,
  facilityName = '',
}) => {
  if (!predictions || predictions.length === 0) {
    return null;
  }

  const formatTimestamp = (dateStr) => {
    if (!dateStr) return 'Recent Run';
    const d = new Date(dateStr);
    return d.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const getRiskBadge = (risk) => {
    switch (risk) {
      case 'High':
        return { bg: 'rgba(239, 68, 68, 0.15)', text: '#f87171', border: 'rgba(239, 68, 68, 0.3)' };
      case 'Medium':
        return { bg: 'rgba(245, 158, 11, 0.15)', text: '#fbbf24', border: 'rgba(245, 158, 11, 0.3)' };
      default:
        return { bg: 'rgba(16, 185, 129, 0.15)', text: '#34d399', border: 'rgba(16, 185, 129, 0.3)' };
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
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <History size={20} color="var(--accent-indigo)" />
            <h3 style={{ fontSize: '1.15rem', fontWeight: '700', color: 'var(--text-heading)', margin: 0 }}>
              Prediction Run History
            </h3>
          </div>
          <p style={{ fontSize: '0.82rem', color: 'var(--text-muted)', margin: '4px 0 0 0' }}>
            Select any prior ML prediction run to inspect its demand curve and insights
          </p>
        </div>

        <span
          style={{
            fontSize: '0.78rem',
            color: 'var(--accent-indigo)',
            background: 'rgba(99, 102, 241, 0.15)',
            border: '1px solid rgba(99, 102, 241, 0.3)',
            padding: '3px 10px',
            borderRadius: '12px',
            fontWeight: '600',
          }}
        >
          {predictions.length} Run{predictions.length > 1 ? 's' : ''} Stored
        </span>
      </div>

      {/* Prediction Cards Horizontal Scroll / Grid */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fill, minmax(240px, 1fr))',
          gap: '1rem',
        }}
      >
        {predictions.map((p, index) => {
          const isSelected = p._id === activePredictionId || (index === 0 && !activePredictionId);
          const riskStyle = getRiskBadge(p.peakRisk);

          return (
            <div
              key={p._id}
              onClick={() => onSelectPrediction && onSelectPrediction(p)}
              style={{
                padding: '1rem',
                borderRadius: '12px',
                cursor: 'pointer',
                background: isSelected
                  ? 'var(--primary-bg-subtle)'
                  : 'var(--bg-card-inner)',
                border: isSelected
                  ? '1px solid var(--primary)'
                  : '1px solid var(--border-inner)',
                boxShadow: isSelected ? '0 0 15px var(--primary-glow)' : 'none',
                transition: 'all 0.2s ease',
                position: 'relative',
              }}
              onMouseEnter={(e) => {
                if (!isSelected) e.currentTarget.style.borderColor = 'var(--primary)';
              }}
              onMouseLeave={(e) => {
                if (!isSelected) e.currentTarget.style.borderColor = 'var(--border-inner)';
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '8px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <Calendar size={13} color="var(--text-muted)" />
                  <span style={{ fontSize: '0.78rem', color: 'var(--text-muted)', fontWeight: '500' }}>
                    {formatTimestamp(p.createdAt)}
                  </span>
                </div>

                {isSelected && (
                  <span
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '4px',
                      fontSize: '0.7rem',
                      fontWeight: '700',
                      color: 'var(--primary)',
                    }}
                  >
                    <Check size={12} /> Active
                  </span>
                )}
              </div>

              {/* Metrics */}
              <div style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'space-between' }}>
                <div>
                  <span style={{ fontSize: '1.25rem', fontWeight: '800', color: 'var(--text-heading)', fontFamily: 'monospace' }}>
                    {Number(p.predictedDailyConsumptionKwh).toFixed(1)}
                  </span>
                  <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginLeft: '4px' }}>
                    kWh/day
                  </span>
                </div>

                <span
                  style={{
                    fontSize: '0.7rem',
                    fontWeight: '700',
                    padding: '2px 8px',
                    borderRadius: '10px',
                    background: riskStyle.bg,
                    color: riskStyle.text,
                    border: `1px solid ${riskStyle.border}`,
                  }}
                >
                  {p.peakRisk || 'Low'} Risk
                </span>
              </div>

              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginTop: '8px', fontSize: '0.76rem', color: 'var(--text-dim)' }}>
                <span>Peak: {Number(p.predictedDemandKw).toFixed(1)} kW</span>
                <span>~₹{Math.round(p.estimatedMonthlyCost || 0).toLocaleString('en-IN')}/mo</span>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default PredictionHistory;
