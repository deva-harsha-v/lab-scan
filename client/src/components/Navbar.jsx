import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { useRouter } from '../App';
import { useTheme } from '../context/ThemeContext';
import ThemeToggle from './ThemeToggle';
import LabScanLogo from './LabScanLogo';

export default function Navbar() {
  const { user, logout } = useAuth();
  const { navigate, page } = useRouter();
  const { tokens } = useTheme();
  const [menuOpen, setMenuOpen] = useState(false);

  const handleLogout = () => {
    logout();
    navigate('landing');
    setMenuOpen(false);
  };

  const isActive = (p) => page === p;

  const linkStyle = (p) => ({
    fontSize: 13,
    padding: '6px 12px',
    borderRadius: 7,
    cursor: 'pointer',
    border: 'none',
    fontFamily: "'DM Sans', sans-serif",
    fontWeight: 500,
    color: isActive(p) ? tokens.accent : tokens.textMuted,
    background: isActive(p) ? tokens.accentMuted : 'transparent',
    transition: 'all 0.2s',
  });

  return (
    <nav style={{
      position: 'sticky',
      top: 0,
      zIndex: 50,
      background: tokens.bgNav,
      backdropFilter: tokens.backdropBlur,
      borderBottom: `1px solid ${tokens.border}`,
    }}>
      <div style={{ maxWidth: 1280, margin: '0 auto', padding: '0 20px', height: 56, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        {/* Logo */}
        <button
          onClick={() => { navigate('landing'); setMenuOpen(false); }}
          style={{ display: 'flex', alignItems: 'center', gap: 9, background: 'none', border: 'none', cursor: 'pointer', padding: 0 }}
        >
          <div style={{ width: 30, height: 30, borderRadius: 8, background: tokens.accent, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
            <svg width="16" height="16" fill="none" viewBox="0 0 24 24" stroke="#fff" strokeWidth="2">
              <path strokeLinecap="round" strokeLinejoin="round" d="M9 3H5a2 2 0 00-2 2v4m6-6h10a2 2 0 012 2v4M9 3v18m0 0h10a2 2 0 002-2V9M9 21H5a2 2 0 01-2-2V9m0 0h18" />
            </svg>
          </div>
          <span style={{ fontWeight: 700, fontSize: 15, color: tokens.textPrimary, letterSpacing: '-0.01em' }}>LabScan</span>
        </button>

        {/* Desktop nav */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }} className="hidden-mobile">
          {!user && (
            <>
              <button style={linkStyle('landing')} onClick={() => navigate('landing')}>Home</button>
              <button style={linkStyle('join-session')} onClick={() => navigate('join-session')}>Join Session</button>
              <button
                onClick={() => navigate('login')}
                style={{ marginLeft: 4, padding: '7px 16px', borderRadius: 8, background: tokens.accent, color: '#fff', border: 'none', cursor: 'pointer', fontSize: 13, fontWeight: 600, transition: 'all 0.2s' }}
                onMouseEnter={e => e.currentTarget.style.background = tokens.accentHover}
                onMouseLeave={e => e.currentTarget.style.background = tokens.accent}
              >
                Sign In
              </button>
            </>
          )}
          {user && (
            <div style={{ display: 'flex', alignItems: 'center', gap: 6, paddingLeft: 8, marginLeft: 4, borderLeft: `1px solid ${tokens.border}` }}>
              <span style={{ fontSize: 13, color: tokens.textMuted }}>{user.name}</span>
              <button
                onClick={handleLogout}
                style={{ fontSize: 13, color: tokens.textMuted, background: 'none', border: 'none', cursor: 'pointer', padding: '6px 10px', borderRadius: 7, transition: 'all 0.2s' }}
                onMouseEnter={e => { e.currentTarget.style.background = tokens.bgSurfaceHover; e.currentTarget.style.color = tokens.textPrimary; }}
                onMouseLeave={e => { e.currentTarget.style.background = 'none'; e.currentTarget.style.color = tokens.textMuted; }}
              >
                Sign out
              </button>
            </div>
          )}

          {/* Theme toggle */}
          <ThemeToggle />
        </div>

        {/* Mobile right: theme + hamburger */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }} className="mobile-only">
          <ThemeToggle size="sm" />
          <button
            style={{ padding: 7, borderRadius: 7, background: 'none', border: `1px solid ${tokens.border}`, color: tokens.textMuted, cursor: 'pointer', display: 'flex', alignItems: 'center' }}
            onClick={() => setMenuOpen(v => !v)}
            aria-label="Toggle menu"
          >
            {menuOpen ? (
              <svg width="18" height="18" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
              </svg>
            ) : (
              <svg width="18" height="18" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                <path strokeLinecap="round" strokeLinejoin="round" d="M4 6h16M4 12h16M4 18h16" />
              </svg>
            )}
          </button>
        </div>
      </div>

      {/* Mobile dropdown */}
      {menuOpen && (
        <div style={{ borderTop: `1px solid ${tokens.border}`, background: tokens.bgNav, backdropFilter: tokens.backdropBlur, padding: '12px 16px' }} className="mobile-only">
          {!user && (
            <>
              <button style={{ ...linkStyle('landing'), display: 'block', width: '100%', textAlign: 'left', marginBottom: 4 }} onClick={() => { navigate('landing'); setMenuOpen(false); }}>Home</button>
              <button style={{ ...linkStyle('join-session'), display: 'block', width: '100%', textAlign: 'left', marginBottom: 4 }} onClick={() => { navigate('join-session'); setMenuOpen(false); }}>Join Session</button>
              <button
                onClick={() => { navigate('login'); setMenuOpen(false); }}
                style={{ width: '100%', marginTop: 8, padding: '10px', borderRadius: 8, background: tokens.accent, color: '#fff', border: 'none', cursor: 'pointer', fontSize: 14, fontWeight: 600 }}
              >
                Sign In
              </button>
            </>
          )}
          {user && (
            <div style={{ paddingTop: 8, borderTop: `1px solid ${tokens.border}` }}>
              <div style={{ fontSize: 12, color: tokens.textMuted, paddingLeft: 4, marginBottom: 6 }}>{user.name}</div>
              <button
                onClick={handleLogout}
                style={{ width: '100%', textAlign: 'left', fontSize: 13, color: tokens.textMuted, background: 'none', border: 'none', cursor: 'pointer', padding: '8px 12px', borderRadius: 7 }}
              >
                Sign out
              </button>
            </div>
          )}
        </div>
      )}

      <style>{`
        @media (max-width: 640px) {
          .hidden-mobile { display: none !important; }
          .mobile-only { display: flex !important; }
        }
        @media (min-width: 641px) {
          .hidden-mobile { display: flex !important; }
          .mobile-only { display: none !important; }
        }
      `}</style>
    </nav>
  );
}
