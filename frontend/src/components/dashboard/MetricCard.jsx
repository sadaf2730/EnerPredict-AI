import React from 'react';

const MetricCard = ({
  title,
  value,
  unit = '',
  subtitle = '',
  icon: Icon,
  badge = null,
  badgeColor = 'primary', // 'emerald', 'amber', 'rose', 'sky', 'indigo'
  glowColor = 'rgba(16, 185, 129, 0.15)',
  accentColor = '#10b981',
}) => {
  const badgeStyles = {
    emerald: { bg: 'rgba(16, 185, 129, 0.15)', text: '#34d399', border: 'rgba(16, 185, 129, 0.3)' },
    amber: { bg: 'rgba(245, 158, 11, 0.15)', text: '#fbbf24', border: 'rgba(245, 158, 11, 0.3)' },
    rose: { bg: 'rgba(244, 63, 94, 0.15)', text: '#fb7185', border: 'rgba(244, 63, 94, 0.3)' },
    sky: { bg: 'rgba(14, 165, 233, 0.15)', text: '#38bdf8', border: 'rgba(14, 165, 233, 0.3)' },
    indigo: { bg: 'rgba(99, 102, 241, 0.15)', text: '#818cf8', border: 'rgba(99, 102, 241, 0.3)' },
  };

  const currentBadge = badgeStyles[badgeColor] || badgeStyles.emerald;

  return (
    <div
      style={{
        background: 'var(--bg-card-gradient)',
        border: '1px solid var(--border-card)',
        borderRadius: '16px',
        padding: '1.4rem 1.5rem',
        boxShadow: 'var(--shadow-card)',
        position: 'relative',
        overflow: 'hidden',
        transition: 'transform 0.25s ease, border-color 0.25s ease, box-shadow 0.25s ease, background 0.25s ease',
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'space-between',
      }}
      onMouseEnter={(e) => {
        e.currentTarget.style.transform = 'translateY(-3px)';
        e.currentTarget.style.borderColor = accentColor;
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.transform = 'translateY(0)';
        e.currentTarget.style.borderColor = 'var(--border-card)';
      }}
    >
      {/* Top ambient accent glow bar */}
      <div
        style={{
          position: 'absolute',
          top: 0,
          left: 0,
          right: 0,
          height: '3px',
          background: `linear-gradient(90deg, transparent, ${accentColor}, transparent)`,
        }}
      />

      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1rem' }}>
        <span style={{ fontSize: '0.86rem', color: 'var(--text-muted)', fontWeight: '600', letterSpacing: '0.3px', textTransform: 'uppercase' }}>
          {title}
        </span>

        {Icon && (
          <div
            style={{
              width: '40px',
              height: '40px',
              borderRadius: '12px',
              background: `linear-gradient(135deg, ${accentColor}22 0%, ${accentColor}11 100%)`,
              border: `1px solid ${accentColor}44`,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: accentColor,
            }}
          >
            <Icon size={20} />
          </div>
        )}
      </div>

      <div>
        <div style={{ display: 'flex', alignItems: 'baseline', gap: '8px', flexWrap: 'wrap' }}>
          <span
            style={{
              fontSize: '2.1rem',
              fontWeight: '800',
              color: 'var(--text-heading)',
              lineHeight: 1.1,
              letterSpacing: '-0.5px',
              fontFamily: 'var(--font-mono, monospace), sans-serif',
            }}
          >
            {value}
          </span>
          {unit && (
            <span style={{ fontSize: '1rem', color: 'var(--text-dim)', fontWeight: '600' }}>
              {unit}
            </span>
          )}
        </div>

        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginTop: '0.85rem', gap: '8px' }}>
          {subtitle && (
            <span style={{ fontSize: '0.82rem', color: 'var(--text-muted)' }}>
              {subtitle}
            </span>
          )}

          {badge && (
            <span
              style={{
                fontSize: '0.75rem',
                fontWeight: '700',
                padding: '3px 10px',
                borderRadius: '20px',
                background: currentBadge.bg,
                color: currentBadge.text,
                border: `1px solid ${currentBadge.border}`,
                whiteSpace: 'nowrap',
              }}
            >
              {badge}
            </span>
          )}
        </div>
      </div>
    </div>
  );
};

export default MetricCard;
