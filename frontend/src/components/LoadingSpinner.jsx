import React from 'react';
import { Zap } from 'lucide-react';

const LoadingSpinner = ({ text = "Analyzing energy parameters with trained ML models..." }) => {
  return (
    <div style={{
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      padding: '3rem 1.5rem',
      gap: '1.25rem',
      textAlign: 'center',
    }}>
      <div style={{
        position: 'relative',
        width: '70px',
        height: '70px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
      }}>
        {/* Outer pulsing ring */}
        <div style={{
          position: 'absolute',
          width: '100%',
          height: '100%',
          borderRadius: '50%',
          border: '3px solid transparent',
          borderTopColor: 'var(--primary)',
          borderRightColor: 'var(--accent-cyan)',
          animation: 'spin 1s linear infinite',
        }} />
        {/* Center glowing icon */}
        <div style={{
          width: '44px',
          height: '44px',
          borderRadius: '50%',
          background: 'rgba(16, 185, 129, 0.15)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          color: 'var(--primary)',
          boxShadow: '0 0 15px rgba(16, 185, 129, 0.4)',
        }}>
          <Zap size={22} />
        </div>
      </div>
      <p style={{
        color: 'var(--text-main)',
        fontSize: '1.05rem',
        fontWeight: '500',
        maxWidth: '420px',
      }}>
        {text}
      </p>
      <span style={{
        color: 'var(--text-dim)',
        fontSize: '0.85rem',
      }}>
        Running Feature Engineering & Gradient Boosting Regressor
      </span>

      <style>{`
        @keyframes spin {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }
      `}</style>
    </div>
  );
};

export default LoadingSpinner;
