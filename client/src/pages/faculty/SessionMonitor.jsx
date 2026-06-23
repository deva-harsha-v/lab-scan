import React, { useState, useEffect } from 'react';
import { useRouter } from '../../App';
import LabScanLogo from '../../components/LabScanLogo';
import SessionCodeDisplay from '../../components/SessionCodeDisplay';
import { sessionsApi } from '../../api/sessions.api';
import { useSocket } from '../../hooks/useSocket';

import { useTheme } from '../../context/ThemeContext';
import ThemeToggle from '../../components/ThemeToggle';
import { Activity, Calendar, Clock, FileCheck, CornerUpLeft, ShieldAlert, UserCheck } from 'lucide-react';

export default function SessionMonitor() {
  const { tokens } = useTheme();
  const STATUS_LABEL = {
    DRAFT:  { label: 'Draft', desc: 'Session not yet started', color: tokens.textSecondary, bg: tokens.bgSurfaceHover },
    ACTIVE: { label: 'Active', desc: 'Accepting submissions', color: tokens.success, bg: tokens.successBg },
    GRACE:  { label: 'Grace Period', desc: 'Late submissions allowed', color: tokens.accent, bg: tokens.accentMuted },
    CLOSED: { label: 'Closed', desc: 'Session ended', color: tokens.danger, bg: tokens.dangerBg },
  };
  const { params, navigate } = useRouter();
  const sessionId = params.sessionId;

  const [session, setSession] = useState(null);
  const [submissionCount, setSubmissionCount] = useState(0);
  const [recentSubmissions, setRecentSubmissions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [actionLoading, setActionLoading] = useState('');

  const { on, off } = useSocket(sessionId);
  const isLight = tokens.colorScheme === 'light';
  const isDark = tokens.colorScheme === 'dark';

  useEffect(() => {
    sessionsApi
      .getById(sessionId)
      .then((res) => {
        setSession(res.data);
        setSubmissionCount(res.data._count?.submissions || 0);
      })
      .catch(() => setError('Session connection offline or missing'))
      .finally(() => setLoading(false));
  }, [sessionId]);

  useEffect(() => {
    const onNewSubmission = ({ submissionCount: count, submission }) => {
      setSubmissionCount(count);
      setRecentSubmissions((prev) => [submission, ...prev].slice(0, 10));
    };

    const onStatusChanged = ({ status }) => {
      setSession((prev) => prev ? { ...prev, status } : prev);
    };

    on('new_submission', onNewSubmission);
    on('session_status_changed', onStatusChanged);

    return () => {
      off('new_submission');
      off('session_status_changed');
    };
  }, [on, off]);

  const handleActivate = async () => {
    setActionLoading('activate');
    try {
      await sessionsApi.activate(sessionId);
      setSession((prev) => ({ ...prev, status: 'ACTIVE' }));
    } catch (err) {
      alert(err.response?.data?.error || 'Failed to activate channel');
    } finally {
      setActionLoading('');
    }
  };

  const handleClose = async () => {
    if (!confirm('Terminate this data session? Student access will be instantly closed.')) return;
    setActionLoading('close');
    try {
      await sessionsApi.close(sessionId);
      setSession((prev) => ({ ...prev, status: 'CLOSED' }));
    } catch (err) {
      alert(err.response?.data?.error || 'Failed to close channel');
    } finally {
      setActionLoading('');
    }
  };

  if (loading) {
    return (
      <div style={{ minHeight: '100vh', background: tokens.bgPage, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <div style={{ position:'fixed', top:14, right:14, zIndex:999 }}><ThemeToggle size="sm" /></div>
        <div style={{ width: 32, height: 32, border: `2px solid ${tokens.accentMuted}`, borderTopColor: tokens.accent, borderRadius: '50%', animation: 'spin 0.8s linear infinite' }} />
      </div>
    );
  }

  if (error || !session) {
    return (
      <div style={{ minHeight: '100vh', background: tokens.bgPage, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '24px' }}>
        <div style={{ padding: '32px', borderRadius: '16px', background: tokens.bgCard, border: `1px solid ${tokens.dangerBorder}`, textAlign: 'center', maxWidth: '400px', boxShadow: tokens.shadowCard }}>
          <ShieldAlert size={32} style={{ color: tokens.danger, marginBottom: '16px', display: 'inline-block' }} />
          <p style={{ color: tokens.danger, fontSize: '15px', fontWeight: 500, marginBottom: '20px' }}>{error || 'Session connection missing'}</p>
          <button onClick={() => navigate('faculty-dashboard')} style={{ padding: '10px 20px', background: tokens.btnSecondaryBg, border: `1px solid ${tokens.btnSecondaryBorder}`, borderRadius: '8px', color: tokens.btnSecondaryText, fontFamily: "'Space Mono', monospace", fontSize: '12px', cursor: 'pointer' }}>
            ← Faculty Panel
          </button>
        </div>
      </div>
    );
  }

  const currentStatus = STATUS_LABEL[session.status] || STATUS_LABEL.DRAFT;

  // Refactored Tokenized Styles
  const cardStyle = {
    padding: '28px',
    borderRadius: '16px',
    background: tokens.bgCard,
    border: `1px solid ${tokens.border}`,
    backdropFilter: tokens.backdropBlur,
    boxShadow: tokens.shadowCard,
    transition: 'background 0.3s ease, border-color 0.3s ease'
  };

  const metaBoxStyle = {
    background: tokens.bgSurfaceHover,
    border: `1px solid ${tokens.border}`,
    borderRadius: '10px',
    padding: '14px 16px',
    display: 'flex',
    alignItems: 'center',
    gap: '12px'
  };

  return (
    <>
      <link href="https://fonts.googleapis.com/css2?family=Space+Mono:wght@400;700&family=DM+Sans:wght@300;400;500;700&family=Syne:wght@700;800&display=swap" rel="stylesheet" />
      <style>{`
        @keyframes pulse { 0%,100% { opacity:1; } 50% { opacity:0.4; } }
        @keyframes spin { to { transform:rotate(360deg); } }
        @keyframes slideUp { from { opacity:0; transform:translateY(8px); } to { opacity:1; transform:translateY(0); } }
        .interactive-btn { transition: all 0.2s cubic-bezier(0.16, 1, 0.3, 1); }
        .interactive-btn:hover { filter: brightness(1.15); transform: translateY(-1px); }
        .animate-row { animation: slideUp 0.3s ease forwards; }
      `}</style>

      <div style={{ minHeight: '100vh', background: tokens.bgPage, color: tokens.textPrimary, fontFamily: "'DM Sans', sans-serif", padding: 'clamp(16px,4vw,40px) 16px 80px', transition: 'background 0.3s ease, color 0.3s ease' }}>
        
        {/* Ambient Moving Mesh Backdrop Canvas */}
        {isDark && (
          <div style={{ position: 'fixed', inset: 0, pointerEvents: 'none', background: 'radial-gradient(circle at 10% 20%, rgba(99,210,255,0.04), transparent 40%), radial-gradient(circle at 90% 80%, rgba(74,240,196,0.04), transparent 40%)', zIndex: 0 }} />
        )}

        <div style={{ maxWidth: '1012px', margin: '0 auto', position: 'relative', zIndex: 1 }}>
          
          {/* Breadcrumb Navigation System */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '12px', fontFamily: "'Space Mono', monospace", color: tokens.textMuted, marginBottom: '32px' }}>
            <button onClick={() => navigate('faculty-dashboard')} style={{ background: 'none', border: 'none', color: 'inherit', cursor: 'pointer', padding: 0, fontFamily: 'inherit' }} className="interactive-btn">DASHBOARD</button>
            <span>/</span>
            <span style={{ color: tokens.accent, fontWeight: 700 }}>SESSION MONITOR</span>
          </div>

          {/* Master View Layout Grid */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '20px' }}>
            
            {/* Left Content Column */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
              
              {/* Card Module 1: Experiment Title & Specs */}
              <div style={cardStyle}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '24px', marginBottom: '28px' }}>
                  <div>
                    <h1 style={{ fontFamily: "'Syne', sans-serif", fontWeight: 800, fontSize: '24px', letterSpacing: '-0.02em', color: tokens.textPrimary, marginBottom: '6px' }}>
                      {session.experiment?.title || 'Loading Experiment Parameters...'}
                    </h1>
                    <p style={{ fontSize: '14px', color: tokens.textSecondary, lineHeight: '1.5' }}>
                      {session.experiment?.description || 'No descriptive runtime properties available for this workstation assignment.'}
                    </p>
                  </div>
                  <span style={{ display: 'inline-flex', alignItems: 'center', padding: '4px 14px', borderRadius: '100px', fontSize: '11px', fontFamily: "'Space Mono', monospace", fontWeight: 700, background: currentStatus.bg, color: currentStatus.color, border: `1px solid ${currentStatus.color}44`, textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                    {currentStatus.label}
                  </span>
                </div>

                {/* Technical Parameter Metadata Grid */}
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))', gap: '12px' }}>
                  <div style={metaBoxStyle}>
                    <Calendar size={16} style={{ color: tokens.textDimmer }} />
                    <div>
                      <div style={{ fontSize: '10px', fontFamily: "'Space Mono', monospace", color: tokens.textMuted, textTransform: 'uppercase' }}>Starts At</div>
                      <div style={{ fontSize: '13px', fontWeight: 500, color: tokens.textSecondary, marginTop: '2px' }}>{new Date(session.startsAt).toLocaleString()}</div>
                    </div>
                  </div>
                  <div style={metaBoxStyle}>
                    <Clock size={16} style={{ color: tokens.textDimmer }} />
                    <div>
                      <div style={{ fontSize: '10px', fontFamily: "'Space Mono', monospace", color: tokens.textMuted, textTransform: 'uppercase' }}>Ends At</div>
                      <div style={{ fontSize: '13px', fontWeight: 500, color: tokens.textSecondary, marginTop: '2px' }}>{new Date(session.endsAt).toLocaleString()}</div>
                    </div>
                  </div>
                  <div style={metaBoxStyle}>
                    <Activity size={16} style={{ color: tokens.textDimmer }} />
                    <div>
                      <div style={{ fontSize: '10px', fontFamily: "'Space Mono', monospace", color: tokens.textMuted, textTransform: 'uppercase' }}>Grace Period</div>
                      <div style={{ fontSize: '13px', fontWeight: 500, color: tokens.textSecondary, marginTop: '2px' }}>{session.gracePeriodMinutes} minutes</div>
                    </div>
                  </div>
                  <div style={metaBoxStyle}>
                    <FileCheck size={16} style={{ color: tokens.textDimmer }} />
                    <div>
                      <div style={{ fontSize: '10px', fontFamily: "'Space Mono', monospace", color: tokens.textMuted, textTransform: 'uppercase' }}>Overwrite Privileges</div>
                      <div style={{ fontSize: '13px', fontWeight: 500, color: tokens.textSecondary, marginTop: '2px' }}>{session.allowResubmit ? 'Resubmission Enabled' : 'Single Submission Only'}</div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Card Module 2: Live Submission Telemetry Stream */}
              <div style={cardStyle}>
                <div style={{ display: 'flex', alignItems: 'center', justifycontent: 'space-between', marginBottom: '24px' }}>
                  <h2 style={{ fontSize: '11px', fontFamily: "'Space Mono', monospace", color: tokens.textMuted, textTransform: 'uppercase', letterSpacing: '0.1em', fontWeight: 700 }}>
                    Live Submission Feed
                  </h2>
                  {session.status === 'ACTIVE' && (
                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px', background: tokens.successBg, border: `1px solid ${tokens.successBorder}`, padding: '3px 10px', borderRadius: '100px' }}>
                      <span style={{ width: 6, height: 6, borderRadius: '50%', background: tokens.success, boxShadow: isDark ? '0 0 8px #4af0c4' : 'none', animation: 'pulse 2s infinite' }} />
                      <span style={{ fontSize: '10px', fontFamily: "'Space Mono', monospace", color: tokens.success, fontWeight: 700, letterSpacing: '0.04em' }}>LIVE</span>
                    </div>
                  )}
                </div>

                <div style={{ display: 'flex', alignItems: 'baseline', gap: '10px', marginBottom: '6px' }}>
                  <div style={{ fontFamily: "'Syne', sans-serif", fontSize: '54px', fontWeight: 800, color: tokens.textPrimary, lineHeight: 1 }}>{submissionCount}</div>
                  <div style={{ fontSize: '14px', color: tokens.textMuted, fontWeight: 500 }}>records aggregated</div>
                </div>

                {recentSubmissions.length > 0 && (
                  <div style={{ marginTop: '28px', borderTop: `1px dashed ${tokens.border}`, paddingTop: '20px' }}>
                    <div style={{ fontSize: '10px', fontFamily: "'Space Mono', monospace", color: tokens.textDimmer, textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '12px', fontWeight: 700 }}>Real-time Feed Packet Logs</div>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                      {recentSubmissions.map((sub) => (
                        <div key={sub.id} className="animate-row" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', background: tokens.bgSurface, border: `1px solid ${tokens.border}`, padding: '12px 16px', borderRadius: '10px' }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                            <UserCheck size={14} style={{ color: tokens.success }} />
                            <span style={{ fontSize: '14px', fontWeight: 600, color: tokens.textPrimary }}>{sub.studentName}</span>
                            <span style={{ fontSize: '12px', fontFamily: "'Space Mono', monospace", color: tokens.textMuted }}>{sub.rollNumber}</span>
                          </div>
                          <span style={{ fontSize: '11px', fontFamily: "'Space Mono', monospace", color: tokens.textSecondary }}>
                            {new Date(sub.submittedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              {/* Action Buttons Interface Layout */}
              <div style={{ display: 'flex', gap: '12px' }}>
                <button className="interactive-btn" onClick={() => navigate('submissions', { sessionId })} style={{ flex: 1, padding: '14px 20px', borderRadius: '12px', background: tokens.btnSecondaryBg, border: `1px solid ${tokens.btnSecondaryBorder}`, color: tokens.btnSecondaryText, fontFamily: "'Space Mono', monospace", fontSize: '13px', fontWeight: 700, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }}>
                  <CornerUpLeft size={14} /> VIEW ALL SUBMISSIONS
                </button>
                
                {session.status === 'DRAFT' && (
                  <button className="interactive-btn" onClick={handleActivate} disabled={actionLoading === 'activate'} style={{ flex: 1, padding: '14px 20px', borderRadius: '12px', background: tokens.accentGrad, border: 'none', color: tokens.textInverse, fontFamily: "'Space Mono', monospace", fontSize: '13px', fontWeight: 700, cursor: actionLoading ? 'wait' : 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: tokens.shadow }}>
                    {actionLoading === 'activate' ? <div style={{ width: 16, height: 16, border: `2px solid ${tokens.border}`, borderTopColor: tokens.textInverse, borderRadius: '50%', animation: 'spin 0.8s linear infinite' }} /> : 'ACTIVATE SESSION CHANNEL'}
                  </button>
                )}
                
                {(session.status === 'ACTIVE' || session.status === 'GRACE') && (
                  <button className="interactive-btn" onClick={handleClose} disabled={actionLoading === 'close'} style={{ flex: 1, padding: '14px 20px', borderRadius: '12px', background: tokens.dangerBg, border: `1px solid ${tokens.dangerBorder}`, color: tokens.danger, fontFamily: "'Space Mono', monospace", fontSize: '13px', fontWeight: 700, cursor: actionLoading ? 'wait' : 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    {actionLoading === 'close' ? <div style={{ width: 16, height: 16, border: `2px solid ${tokens.dangerBorder}`, borderTopColor: tokens.danger, borderRadius: '50%', animation: 'spin 0.8s linear infinite' }} /> : 'TERMINATE SESSION LINK'}
                  </button>
                )}
              </div>
            </div>

            {/* Right Sidebar Information Layout Column */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
              
              {/* Session Broadcast Code Block */}
              <div style={{ ...cardStyle, textAlign: 'center' }}>
                <p style={{ fontSize: '10px', fontFamily: "'Space Mono', monospace", color: tokens.textMuted, textTransform: 'uppercase', letterSpacing: '0.1em', fontWeight: 700, marginBottom: '20px' }}>
                  BROADCAST TOKEN CODE
                </p>
                <div style={{ display: 'flex', justifyContent: 'center', margin: '0 auto' }}>
                  <SessionCodeDisplay code={session.code} status={session.status} />
                </div>
                <p style={{ fontSize: '12px', color: tokens.textSecondary, lineHeight: '1.5', marginTop: '20px', padding: '0 8px' }}>
                  Distribute this generated cryptographic secure hash parameter key to students to allow gateway integration.
                </p>
              </div>

              {/* Central Runtime Status Information Node */}
              <div style={{ ...cardStyle, textAlign: 'center', padding: '24px 20px' }}>
                <p style={{ fontSize: '10px', fontFamily: "'Space Mono', monospace", color: tokens.textMuted, textTransform: 'uppercase', letterSpacing: '0.1em', fontWeight: 700, marginBottom: '10px' }}>
                  CHANNEL STATUS
                </p>
                <p style={{ fontFamily: "'Syne', sans-serif", fontSize: '20px', fontWeight: 800, color: currentStatus.color, letterSpacing: '-0.01em' }}>
                  {currentStatus.label}
                </p>
                <p style={{ fontSize: '12px', color: tokens.textSecondary, marginTop: '4px' }}>{currentStatus.desc}</p>
              </div>
            </div>

          </div>
        </div>
        
        {/* Float theme toggle at the very top level mapping */}
        <div style={{ position: 'fixed', top: 14, right: 14, zIndex: 999 }}>
          <ThemeToggle size="sm" />
        </div>
      </div>
    </>
  );
}