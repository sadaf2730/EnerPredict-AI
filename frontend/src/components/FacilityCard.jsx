import React from 'react';
import { ArrowRight } from 'lucide-react';

const FacilityCard = ({
  id,
  title,
  subtitle,
  icon: Icon,
  badge,
  examples,
  onSelect,
  loading = false,
}) => {
  return (
    <div
      onClick={() => !loading && onSelect(id, title)}
      style={{
        position: 'relative',
        background: 'var(--bg-card)',
        backdropFilter: 'blur(16px)',
        border: '1px solid var(--border-card)',
        borderRadius: 'var(--radius-lg)',
        padding: '1.75rem',
        cursor: loading ? 'not-allowed' : 'pointer',
        transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'space-between',
        minHeight: '260px',
        overflow: 'hidden',
      }}
      onMouseEnter={(e) => {
        if (!loading) {
          e.currentTarget.style.transform = 'translateY(-6px)';
          e.currentTarget.style.borderColor = 'var(--border-focus)';
          e.currentTarget.style.boxShadow = '0 15px 35px -10px rgba(16, 185, 129, 0.2), 0 0 1px 1px rgba(16, 185, 129, 0.3)';
        }
      }}
      onMouseLeave={(e) => {
        if (!loading) {
          e.currentTarget.style.transform = 'translateY(0)';
          e.currentTarget.style.borderColor = 'var(--border-card)';
          e.currentTarget.style.boxShadow = 'var(--shadow-card)';
        }
      }}
    >
      {/* Top row with icon & badge */}
      <div>
        <div style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          marginBottom: '1.25rem',
        }}>
          <div style={{
            width: '52px',
            height: '52px',
            borderRadius: '14px',
            background: 'var(--bg-card-inner)',
            border: '1px solid var(--border-subtle)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: 'var(--primary)',
          }}>
            {Icon}
          </div>
          <span style={{
            fontSize: '0.75rem',
            fontWeight: '600',
            padding: '3px 8px',
            borderRadius: 'var(--radius-full)',
            background: 'var(--bg-card-inner)',
            color: 'var(--text-muted)',
            border: '1px solid var(--border-subtle)',
          }}>
            {badge}
          </span>
        </div>

        <h3 style={{
          fontSize: '1.3rem',
          fontWeight: '700',
          color: 'var(--text-main)',
          marginBottom: '0.4rem',
        }}>
          {title}
        </h3>

        <p style={{
          fontSize: '0.9rem',
          color: 'var(--text-muted)',
          lineHeight: '1.5',
          marginBottom: '1rem',
        }}>
          {subtitle}
        </p>
      </div>

      {/* Bottom row with key examples & action */}
      <div>
        <div style={{
          fontSize: '0.8rem',
          color: 'var(--text-dim)',
          marginBottom: '1.25rem',
          display: 'flex',
          flexWrap: 'wrap',
          gap: '6px',
        }}>
          {examples.map((ex, idx) => (
            <span key={idx} style={{
              background: 'var(--bg-card-inner)',
              padding: '2px 8px',
              borderRadius: '4px',
              border: '1px solid var(--border-inner)',
            }}>
              {ex}
            </span>
          ))}
        </div>

        <div style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          paddingTop: '0.85rem',
          borderTop: '1px solid var(--border-subtle)',
        }}>
          <span style={{
            fontSize: '0.85rem',
            fontWeight: '600',
            color: 'var(--primary)',
          }}>
            {loading ? 'Configuring...' : 'Select Facility'}
          </span>
          <div style={{
            width: '28px',
            height: '28px',
            borderRadius: '50%',
            background: 'rgba(16, 185, 129, 0.1)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: 'var(--primary)',
          }}>
            <ArrowRight size={15} />
          </div>
        </div>
      </div>
    </div>
  );
};

export default FacilityCard;
