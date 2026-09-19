import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { Zap, LogOut, Building2, User } from 'lucide-react';
import ThemeToggle from './ThemeToggle';

const Navbar = () => {
  const { user, isAuthenticated, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <header style={{
      position: 'sticky',
      top: 0,
      zIndex: 100,
      background: 'var(--bg-nav)',
      backdropFilter: 'blur(16px)',
      WebkitBackdropFilter: 'blur(16px)',
      borderBottom: '1px solid var(--border-subtle)',
      padding: '0.85rem 1.5rem',
      transition: 'background-color 0.25s ease, border-color 0.25s ease',
    }}>
      <div style={{
        maxWidth: '1200px',
        margin: '0 auto',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
      }}>
        {/* Brand Logo */}
        <Link to={isAuthenticated ? '/facilities' : '/login'} style={{
          display: 'flex',
          alignItems: 'center',
          gap: '10px',
          textDecoration: 'none',
        }}>
          <div style={{
            width: '36px',
            height: '36px',
            borderRadius: '10px',
            background: 'linear-gradient(135deg, #10b981 0%, #06b6d4 100%)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: '#fff',
            boxShadow: '0 0 15px rgba(16, 185, 129, 0.4)',
          }}>
            <Zap size={20} fill="#fff" />
          </div>
          <div>
            <span style={{
              fontSize: '1.2rem',
              fontWeight: '800',
              letterSpacing: '-0.02em',
              background: 'var(--nav-logo-gradient)',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
            }}>
              EnerPredict
            </span>
            <span style={{
              marginLeft: '6px',
              fontSize: '0.72rem',
              fontWeight: '700',
              padding: '2px 6px',
              borderRadius: '6px',
              background: 'var(--primary-bg-subtle)',
              color: 'var(--primary)',
              border: '1px solid var(--primary-border-subtle)',
            }}>
              ML INSIGHT
            </span>
          </div>
        </Link>

        {/* Right Navigation */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.85rem' }}>
          {isAuthenticated ? (
            <>
              <Link to="/facilities" style={{
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
                fontSize: '0.9rem',
                fontWeight: '500',
                color: 'var(--text-muted)',
                padding: '6px 12px',
                borderRadius: 'var(--radius-sm)',
                transition: 'all var(--transition-fast)',
              }}
              onMouseEnter={(e) => { e.currentTarget.style.color = 'var(--text-main)'; e.currentTarget.style.background = 'var(--bg-card-inner)'; }}
              onMouseLeave={(e) => { e.currentTarget.style.color = 'var(--text-muted)'; e.currentTarget.style.background = 'transparent'; }}
              >
                <Building2 size={16} />
                <span>Facilities</span>
              </Link>

              {/* User Chip */}
              <div style={{
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                padding: '5px 12px',
                borderRadius: 'var(--radius-full)',
                background: 'var(--bg-card-inner)',
                border: '1px solid var(--border-subtle)',
              }}>
                <div style={{
                  width: '24px',
                  height: '24px',
                  borderRadius: '50%',
                  background: 'var(--primary-bg-subtle)',
                  color: 'var(--primary)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}>
                  <User size={14} />
                </div>
                <span style={{
                  fontSize: '0.85rem',
                  fontWeight: '600',
                  color: 'var(--text-main)',
                  maxWidth: '120px',
                  whiteSpace: 'nowrap',
                  overflow: 'hidden',
                  textOverflow: 'ellipsis',
                }}>
                  {user?.name || 'User'}
                </span>
              </div>

              {/* Theme Toggle (next to user profile) */}
              <ThemeToggle />

              {/* Logout Button */}
              <button
                onClick={handleLogout}
                title="Logout"
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px',
                  padding: '7px 12px',
                  borderRadius: 'var(--radius-sm)',
                  background: 'rgba(244, 63, 94, 0.1)',
                  color: '#fb7185',
                  border: '1px solid rgba(244, 63, 94, 0.2)',
                  fontSize: '0.85rem',
                  fontWeight: '500',
                }}
                onMouseEnter={(e) => { e.currentTarget.style.background = 'rgba(244, 63, 94, 0.2)'; }}
                onMouseLeave={(e) => { e.currentTarget.style.background = 'rgba(244, 63, 94, 0.1)'; }}
              >
                <LogOut size={15} />
                <span>Exit</span>
              </button>
            </>
          ) : (
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <ThemeToggle />
              <Link to="/login" style={{
                fontSize: '0.9rem',
                fontWeight: '600',
                color: 'var(--text-main)',
                padding: '6px 14px',
                borderRadius: 'var(--radius-sm)',
                border: '1px solid var(--border-subtle)',
                background: 'var(--bg-card-inner)',
              }}>
                Login
              </Link>
              <Link to="/register" style={{
                fontSize: '0.9rem',
                fontWeight: '600',
                background: 'var(--primary)',
                color: '#fff',
                padding: '6px 14px',
                borderRadius: 'var(--radius-sm)',
                boxShadow: 'var(--shadow-glow)',
              }}>
                Get Started
              </Link>
            </div>
          )}
        </div>
      </div>
    </header>
  );
};

export default Navbar;
