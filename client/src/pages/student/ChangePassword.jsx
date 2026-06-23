import React, { useState } from 'react';
import LabScanLogo from '../../components/LabScanLogo';
import { useAuth } from '../../context/AuthContext';
import { useRouter } from '../../App';
import { useTheme } from '../../context/ThemeContext';
import { makeStyles } from '../../utils/makeStyles';
import ThemeToggle from '../../components/ThemeToggle';
import { authApi } from '../../api/client';

export default function ChangePassword() {
  const { user, logout } = useAuth();
  const { navigate } = useRouter();
  const { tokens } = useTheme();
  const S = makeStyles(tokens);
  const isDark = tokens.colorScheme === 'dark';

  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showCurrent, setShowCurrent] = useState(false);
  const [showNew, setShowNew] = useState(false);
  const [err, setErr] = useState('');
  const [success, setSuccess] = useState(false);
  const [loading, setLoading] = useState(false);

  const labelStyle = { ...S.label, marginBottom: 6 };
  const inputWrapStyle = { position: 'relative' };
  const inputStyle = { ...S.input, paddingRight: 64 };
  const eyeBtnStyle = {
    position: 'absolute', right: 6, top: '50%', transform: 'translateY(-50%)',
    background: 'none', border: 'none', cursor: 'pointer', color: tokens.textMuted,
    fontFamily: "'Space Mono',monospace", fontSize: 10, letterSpacing: '0.04em',
    padding: '6px 8px', borderRadius: 6,
  };

  const focusRing = (e) => { e.target.style.borderColor = tokens.accent; e.target.style.boxShadow = `0 0 0 3px ${tokens.accentMuted}`; };
  const blurRing = (e) => { e.target.style.borderColor = tokens.borderInput; e.target.style.boxShadow = 'none'; };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setErr('');
    setSuccess(false);

    if (newPassword.length < 6) {
      setErr('New password must be at least 6 characters long.');
      return;
    }
    if (newPassword !== confirmPassword) {
      setErr('New password and confirmation do not match.');
      return;
    }
    if (currentPassword === newPassword) {
      setErr('New password must be different from your current password.');
      return;
    }

    setLoading(true);
    try {
      await authApi.changePassword(currentPassword, newPassword);
      setSuccess(true);
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
    } catch (e2) {
      setErr(e2.response?.data?.error || 'Could not change password. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ minHeight: '100vh', background: tokens.bgPage, color: tokens.textPrimary, fontFamily: "'DM Sans',sans-serif", position: 'relative' }}>
      <style>{`
        @keyframes fadeIn { from { opacity:0; transform:translateY(12px); } to { opacity:1; transform:translateY(0); } }
        @keyframes spin { to { transform: rotate(360deg); } }
        .cp-btn { transition: all 0.2s ease; cursor: pointer; }
        .cp-btn:hover { filter: brightness(1.08); transform: translateY(-1px); }
      `}</style>

      {/* Subtle grid bg, consistent with the rest of the student area */}
      <div style={{ position: 'fixed', inset: 0, pointerEvents: 'none', zIndex: 0,
        backgroundImage: `linear-gradient(${tokens.borderMuted} 1px,transparent 1px),linear-gradient(90deg,${tokens.borderMuted} 1px,transparent 1px)`,
        backgroundSize: '50px 50px', opacity: isDark ? 1 : 0.5 }} />

      {/* Nav */}
      <nav style={{ ...S.nav, padding: '0 24px', height: 64 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, cursor: 'pointer' }} onClick={() => navigate('student-dashboard')}>
          <LabScanLogo size={28} gradientId="studentCpLogoGrad" />
          <span style={{ fontSize: 18, fontWeight: 800, letterSpacing: '-0.02em', background: tokens.accentGrad, WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>LabScan</span>
          <span style={{ fontFamily: "'Space Mono',monospace", fontSize: 9, color: tokens.accent, background: tokens.accentMuted, border: `1px solid ${tokens.accentBorder}`, padding: '2px 8px', borderRadius: 6, fontWeight: 700, marginLeft: 4 }}>STUDENT</span>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <div style={{ display: 'flex', flexDirection: 'column', textAlign: 'right' }}>
            <span style={{ fontSize: 13, color: tokens.textPrimary, fontWeight: 500 }}>{user?.name}</span>
            <span style={{ fontSize: 10, fontFamily: "'Space Mono',monospace", color: tokens.textMuted }}>Account Settings</span>
          </div>
          <ThemeToggle size="sm" />
          <button onClick={() => { logout(); navigate('landing'); }} style={{ ...S.btnSecondary, padding: '8px 14px', fontSize: 11, fontFamily: "'Space Mono',monospace", color: tokens.danger, borderColor: tokens.dangerBorder }}>Sign out</button>
        </div>
      </nav>

      <div style={{ padding: 'clamp(16px,4vw,40px) clamp(16px,5vw,60px) 80px', width: '100%', position: 'relative', zIndex: 1, animation: 'fadeIn 0.5s ease forwards', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 24 }}>

        <div style={{ width: '100%', maxWidth: 440, display: 'flex', flexDirection: 'column', gap: 6 }}>
          <button onClick={() => navigate('student-dashboard')} style={{ alignSelf: 'flex-start', background: 'none', border: 'none', color: tokens.textMuted, fontFamily: "'Space Mono',monospace", fontSize: 11, cursor: 'pointer', padding: '4px 0' }}>
            ← Back to dashboard
          </button>
          <h1 style={{ fontSize: 24, fontWeight: 800, letterSpacing: '-0.02em', color: tokens.textPrimary, marginTop: 8 }}>Change Password</h1>
          <p style={{ fontSize: 13, color: tokens.textSecondary, lineHeight: 1.5 }}>
            Set a personal password for your account. We recommend doing this right away if your account still uses the default password issued by your university.
          </p>
        </div>

        <div style={{ ...S.card, width: '100%', maxWidth: 440, borderRadius: 20, padding: 28 }}>
          {success && (
            <div style={{ ...S.successBanner, marginBottom: 20 }}>
              Your password has been updated successfully.
            </div>
          )}
          {err && (
            <div style={{ ...S.errorBanner, marginBottom: 20 }}>{err}</div>
          )}

          <form onSubmit={handleSubmit}>
            <div style={{ marginBottom: 18 }}>
              <label style={labelStyle}>Current Password</label>
              <div style={inputWrapStyle}>
                <input
                  style={inputStyle}
                  type={showCurrent ? 'text' : 'password'}
                  placeholder="Your current / default password"
                  value={currentPassword}
                  onChange={e => setCurrentPassword(e.target.value)}
                  required
                  autoComplete="current-password"
                  onFocus={focusRing}
                  onBlur={blurRing}
                />
                <button type="button" style={eyeBtnStyle} onClick={() => setShowCurrent(v => !v)}>{showCurrent ? 'HIDE' : 'SHOW'}</button>
              </div>
            </div>

            <div style={{ marginBottom: 18 }}>
              <label style={labelStyle}>New Password</label>
              <div style={inputWrapStyle}>
                <input
                  style={inputStyle}
                  type={showNew ? 'text' : 'password'}
                  placeholder="At least 6 characters"
                  value={newPassword}
                  onChange={e => setNewPassword(e.target.value)}
                  required
                  minLength={6}
                  autoComplete="new-password"
                  onFocus={focusRing}
                  onBlur={blurRing}
                />
                <button type="button" style={eyeBtnStyle} onClick={() => setShowNew(v => !v)}>{showNew ? 'HIDE' : 'SHOW'}</button>
              </div>
            </div>

            <div style={{ marginBottom: 24 }}>
              <label style={labelStyle}>Confirm New Password</label>
              <input
                style={S.input}
                type={showNew ? 'text' : 'password'}
                placeholder="Re-enter new password"
                value={confirmPassword}
                onChange={e => setConfirmPassword(e.target.value)}
                required
                minLength={6}
                autoComplete="new-password"
                onFocus={focusRing}
                onBlur={blurRing}
              />
            </div>

            <button type="submit" disabled={loading} className="cp-btn"
              style={{ width: '100%', padding: 14, background: tokens.accentGrad, border: 'none', borderRadius: 12, color: isDark ? '#050c14' : '#fff', fontFamily: "'Space Mono',monospace", fontWeight: 700, fontSize: 12, letterSpacing: '0.04em', display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: 46, opacity: loading ? 0.7 : 1, cursor: loading ? 'not-allowed' : 'pointer' }}>
              {loading
                ? <div style={{ width: 18, height: 18, border: '2px solid rgba(0,0,0,0.2)', borderTopColor: isDark ? '#050c14' : '#fff', borderRadius: '50%', animation: 'spin 0.75s linear infinite' }} />
                : 'UPDATE PASSWORD'}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
