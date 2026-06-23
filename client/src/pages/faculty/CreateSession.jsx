import React, { useState } from 'react';
import LabScanLogo from '../../components/LabScanLogo';
import { sessionsApi } from '../../api/sessions.api';
import { useTheme } from '../../context/ThemeContext';
import { makeStyles } from '../../utils/makeStyles';
import { useRouter } from '../../App';

function toLocalInputValue(date) {
  const d = new Date(date);
  const pad = (n) => String(n).padStart(2, '0');
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
}



function Field({ tokens, label, required, hint, children }) {
  return (
    <div>
      <label style={{
        display: 'block',
        fontFamily: "'Space Mono', monospace",
        fontSize: 11, letterSpacing: '0.1em',
        color: 'rgba(200,220,235,0.5)',
        textTransform: 'uppercase',
        marginBottom: 8,
      }}>
        {label}{required && <span style={{ color: tokens.danger, marginLeft: 4 }}>*</span>}
      </label>
      {children}
      {hint && (
        <p style={{ fontSize: 12, color: 'rgba(200,220,235,0.35)', marginTop: 6, lineHeight: 1.5 }}>{hint}</p>
      )}
    </div>
  );
}

export default function CreateSession() {
  const { tokens } = useTheme();
  const { navigate } = useRouter();
  const inputStyle = {
    width: '100%',
    padding: '11px 14px',
    background: tokens.bgInput,
    border: `1px solid ${tokens.borderInput}`,
    borderRadius: 10,
    color: tokens.textPrimary,
    fontSize: 14,
    fontFamily: "'DM Sans', sans-serif",
    outline: 'none',
    transition: 'border-color 0.2s, background 0.2s',
    colorScheme: tokens.colorScheme,
  };

  const now = new Date();
  const oneHourLater = new Date(now.getTime() + 60 * 60 * 1000);

  const [form, setForm] = useState({
    startsAt: toLocalInputValue(now),
    endsAt: toLocalInputValue(oneHourLater),
    gracePeriodMinutes: 10,
    allowResubmit: false,
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [focusedField, setFocusedField] = useState(null);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    if (new Date(form.endsAt) <= new Date(form.startsAt)) {
      setError('End time must be after start time.');
      return;
    }
    setLoading(true);
    try {
      const res = await sessionsApi.create({
        startsAt: new Date(form.startsAt).toISOString(),
        endsAt: new Date(form.endsAt).toISOString(),
        gracePeriodMinutes: parseInt(form.gracePeriodMinutes),
        allowResubmit: form.allowResubmit,
      });
      navigate('session-monitor', { sessionId: res.data.id });
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to create session.');
    } finally {
      setLoading(false);
    }
  };

  const focused = (name) => ({
    ...inputStyle,
    borderColor: focusedField === name ? 'rgba(99,210,255,0.45)' : 'rgba(99,210,255,0.12)',
    background: focusedField === name ? 'rgba(99,210,255,0.05)' : 'rgba(255,255,255,0.04)',
  });

  return (
    <>
      <link rel="preconnect" href="https://fonts.googleapis.com" />
      <link href="https://fonts.googleapis.com/css2?family=Space+Mono:wght@400;700&family=DM+Sans:wght@300;400;500&family=Syne:wght@700;800&display=swap" rel="stylesheet" />
      <style>{`
        @keyframes fadeUp { from { opacity:0; transform:translateY(20px); } to { opacity:1; transform:translateY(0); } }
        @keyframes gridPulse { 0%,100% { opacity:.025; } 50% { opacity:.055; } }
        @keyframes spin { to { transform: rotate(360deg); } }
        input[type="datetime-local"]::-webkit-calendar-picker-indicator { filter: invert(0.6); cursor: pointer; }
      `}</style>

      <div style={{ minHeight: '100vh', background: tokens.bgPage, color: tokens.textPrimary, fontFamily: "'DM Sans', sans-serif", position: 'relative' }}>

        {/* Grid bg */}
        <div style={{
          position: 'fixed', inset: 0, pointerEvents: 'none', zIndex: 0,
          backgroundImage: `linear-gradient(rgba(99,210,255,0.04) 1px,transparent 1px),linear-gradient(90deg,rgba(99,210,255,0.04) 1px,transparent 1px)`,
          backgroundSize: '60px 60px', animation: 'gridPulse 6s ease-in-out infinite',
        }} />
        <div style={{
          position: 'fixed', top: '-20%', left: '-10%', width: 600, height: 600, borderRadius: '50%',
          background: 'radial-gradient(circle,rgba(99,210,255,0.07) 0%,transparent 70%)',
          filter: 'blur(40px)', pointerEvents: 'none', zIndex: 0,
        }} />

        {/* Nav */}
        <nav style={{
          position: 'sticky', top: 0, zIndex: 50, padding: '0 40px', height: 60,
          display: 'flex', alignItems: 'center', gap: 16,
          background: 'rgba(5,12,20,0.85)', backdropFilter: 'blur(20px)',
          borderBottom: '1px solid rgba(99,210,255,0.07)',
        }}>
          <button onClick={() => navigate('faculty-dashboard')} style={{
            background: 'none', border: 'none', cursor: 'pointer',
            color: tokens.textMuted, display: 'flex', alignItems: 'center',
            transition: 'color 0.2s', padding: 4,
          }}
            onMouseEnter={e => e.currentTarget.style.color = '#e2f4ff'}
            onMouseLeave={e => e.currentTarget.style.color = 'rgba(200,220,235,0.4)'}
          >
            <svg width="18" height="18" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M10 19l-7-7m0 0l7-7m-7 7h18" />
            </svg>
          </button>
          <div style={{ width: 1, height: 20, background: 'rgba(255,255,255,0.08)' }} />
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <LabScanLogo size={26} gradientId="createSessionLogoGrad" />
            <span style={{ fontFamily: "'Syne',sans-serif", fontWeight: 800, fontSize: 15, letterSpacing: '-0.02em' }}>LabScan</span>
          </div>
        </nav>

        <main style={{ position: 'relative', zIndex: 1, maxWidth: 640, margin: '0 auto', padding: '48px 24px 80px' }}>

          {/* Header */}
          <div style={{ marginBottom: 40, animation: 'fadeUp 0.6s ease forwards', opacity: 0 }}>
            <div style={{
              fontFamily: "'Space Mono',monospace", fontSize: 11, letterSpacing: '0.2em',
              color: 'rgba(99,210,255,0.6)', textTransform: 'uppercase', marginBottom: 8,
            }}>Faculty</div>
            <h1 style={{
              fontFamily: "'Syne',sans-serif", fontWeight: 800, fontSize: 30,
              letterSpacing: '-0.02em', color: tokens.textPrimary,
            }}>Create Session</h1>
            <p style={{ fontSize: 14, color: tokens.textMuted, marginTop: 8, lineHeight: 1.6 }}>
              Students will scan the ArUco marker on their table to automatically load their assigned experiment.
            </p>
          </div>

          {/* Error */}
          {error && (
            <div style={{
              marginBottom: 24, padding: '12px 16px',
              background: 'rgba(248,113,113,0.08)', border: `1px solid ${tokens.dangerBorder}`,
              borderRadius: 10, color: '#fca5a5', fontSize: 13,
              animation: 'fadeUp 0.3s ease forwards',
            }}>{error}</div>
          )}

          {/* Info banner */}
          <div style={{
            marginBottom: 28, padding: '14px 18px',
            background: 'rgba(99,210,255,0.05)', border: `1px solid ${tokens.accentBorder}`,
            borderRadius: 12, display: 'flex', gap: 12, alignItems: 'flex-start',
            animation: 'fadeUp 0.6s 0.05s ease forwards', opacity: 0,
          }}>
            <span style={{ fontSize: 18, flexShrink: 0 }}>📡</span>
            <div>
              <div style={{ fontFamily: "'Space Mono',monospace", fontSize: 11, color: tokens.accent, letterSpacing: '0.1em', marginBottom: 4 }}>SCAN-BASED EXPERIMENT ASSIGNMENT</div>
              <p style={{ fontSize: 13, color: 'rgba(200,220,235,0.55)', lineHeight: 1.6 }}>
                No experiment pre-selection needed. Each student group scans the ArUco marker on their lab table — the system automatically loads the correct experiment for that table.
              </p>
            </div>
          </div>

          {/* Card */}
          <div style={{
            border: '1px solid rgba(99,210,255,0.08)', borderRadius: 18,
            background: tokens.bgCard, backdropFilter: 'blur(12px)',
            padding: '32px', display: 'flex', flexDirection: 'column', gap: 28,
            animation: 'fadeUp 0.6s 0.1s ease forwards', opacity: 0,
          }}>

            {/* Time range */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
              <Field tokens={tokens} label="Starts At" required>
                <input type="datetime-local" value={form.startsAt}
                  onChange={(e) => setForm({ ...form, startsAt: e.target.value })}
                  onFocus={() => setFocusedField('start')} onBlur={() => setFocusedField(null)}
                  style={focused('start')} required />
              </Field>
              <Field tokens={tokens} label="Ends At" required>
                <input type="datetime-local" value={form.endsAt}
                  onChange={(e) => setForm({ ...form, endsAt: e.target.value })}
                  onFocus={() => setFocusedField('end')} onBlur={() => setFocusedField(null)}
                  style={focused('end')} required />
              </Field>
            </div>

            {/* Grace period */}
            <Field tokens={tokens} label="Grace Period" hint="Students can still submit for this many minutes after the session ends.">
              <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                <input type="number" min={0} max={60} value={form.gracePeriodMinutes}
                  onChange={(e) => setForm({ ...form, gracePeriodMinutes: e.target.value })}
                  onFocus={() => setFocusedField('grace')} onBlur={() => setFocusedField(null)}
                  style={{ ...focused('grace'), width: 100, fontFamily: "'Space Mono',monospace" }} />
                <span style={{ fontSize: 13, color: tokens.textMuted }}>minutes</span>
              </div>
            </Field>

            {/* Allow resubmit */}
            <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
              <button type="button"
                onClick={() => setForm({ ...form, allowResubmit: !form.allowResubmit })}
                style={{
                  position: 'relative', width: 44, height: 24, borderRadius: 12,
                  background: form.allowResubmit ? 'linear-gradient(135deg,#63d2ff,#1e64ff)' : 'rgba(255,255,255,0.08)',
                  border: `1px solid ${form.allowResubmit ? 'rgba(99,210,255,0.5)' : 'rgba(255,255,255,0.1)'}`,
                  cursor: 'pointer', transition: 'all 0.25s', flexShrink: 0,
                  boxShadow: form.allowResubmit ? '0 0 12px rgba(99,210,255,0.3)' : 'none',
                }}
              >
                <span style={{
                  position: 'absolute', top: 2,
                  left: form.allowResubmit ? 22 : 2,
                  width: 18, height: 18, borderRadius: '50%',
                  background: '#fff',
                  transition: 'left 0.25s cubic-bezier(0.23,1,0.32,1)',
                  boxShadow: '0 1px 4px rgba(0,0,0,0.3)',
                }} />
              </button>
              <div>
                <div style={{ fontSize: 14, color: tokens.textPrimary, marginBottom: 2 }}>Allow Resubmission</div>
                <div style={{ fontSize: 12, color: tokens.textMuted }}>Students can submit more than once</div>
              </div>
            </div>

            {/* Divider */}
            <div style={{ height: 1, background: 'rgba(255,255,255,0.05)' }} />

            {/* Actions */}
            <div style={{ display: 'flex', gap: 12 }}>
              <button type="button" onClick={() => navigate('faculty-dashboard')} style={{
                flex: 1, padding: '13px', borderRadius: 10, cursor: 'pointer',
                background: tokens.bgSurface, border: '1px solid rgba(255,255,255,0.08)',
                color: 'rgba(200,220,235,0.6)', fontFamily: "'Space Mono',monospace",
                fontSize: 12, letterSpacing: '0.08em', transition: 'all 0.2s',
              }}
                onMouseEnter={e => { e.currentTarget.style.borderColor = 'rgba(255,255,255,0.2)'; e.currentTarget.style.color = '#e2f4ff'; }}
                onMouseLeave={e => { e.currentTarget.style.borderColor = 'rgba(255,255,255,0.08)'; e.currentTarget.style.color = 'rgba(200,220,235,0.6)'; }}
              >CANCEL</button>
              <button onClick={handleSubmit} disabled={loading} style={{
                flex: 1, padding: '13px',
                background: loading ? 'rgba(99,210,255,0.2)' : 'linear-gradient(135deg,#63d2ff,#1e64ff)',
                border: 'none', borderRadius: 10, cursor: loading ? 'not-allowed' : 'pointer',
                color: tokens.bgPage, fontFamily: "'Space Mono',monospace",
                fontWeight: 700, fontSize: 12, letterSpacing: '0.08em',
                boxShadow: loading ? 'none' : '0 4px 20px rgba(99,210,255,0.25)',
                transition: 'all 0.2s', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
              }}>
                {loading ? (
                  <>
                    <div style={{ width: 14, height: 14, border: '2px solid rgba(5,12,20,0.3)', borderTopColor: '#050c14', borderRadius: '50%', animation: 'spin 0.8s linear infinite' }} />
                    CREATING…
                  </>
                ) : 'CREATE SESSION'}
              </button>
            </div>
          </div>
        </main>
      </div>
    </>
  );
}