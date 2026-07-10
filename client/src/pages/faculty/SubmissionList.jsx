import React, { useState, useEffect } from 'react';
import { useRouter } from '../../App';
import LabScanLogo from '../../components/LabScanLogo';
import SubmissionCard from './SubmissionCard';
import { submissionsApi } from '../../api/submissions.api';
import { sessionsApi } from '../../api/sessions.api';
import { useSocket } from '../../hooks/useSocket';
import { useTheme } from '../../context/ThemeContext';

const font = { mono: "'Space Mono',monospace", sans: "'DM Sans',sans-serif" };

export default function SubmissionList() {
  const { tokens } = useTheme();
  const { params, navigate } = useRouter();
  const sessionId = params.sessionId;

  const [session, setSession] = useState(null);
  const [submissions, setSubmissions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [filter, setFilter] = useState('all'); // all | pending | marked

  const { on, off } = useSocket(sessionId);
  const isLight = tokens.colorScheme === 'light';

  useEffect(() => {
    Promise.all([
      sessionsApi.getById(sessionId),
      submissionsApi.getBySession(sessionId),
    ])
      .then(([sessionRes, subRes]) => {
        setSession(sessionRes.data);
        setSubmissions(subRes.data);
      })
      .catch(() => setError('Failed to load submissions from cluster.'))
      .finally(() => setLoading(false));
  }, [sessionId]);

  // Listen for new live submissions
  useEffect(() => {
    const handler = ({ submission }) => {
      setSubmissions((prev) => {
        const exists = prev.find((s) => s.id === submission.id);
        if (exists) return prev;
        return [
          {
            id: submission.id,
            studentName: submission.studentName,
            rollNumber: submission.rollNumber,
            submittedAt: submission.submittedAt,
            observationPhotoUrl: '',
            resultNotes: null,
            marks: null,
            reviewNote: null,
            reviewedAt: null,
            reviewedBy: null,
          },
          ...prev,
        ];
      });
    };
    on('new_submission', handler);
    return () => off('new_submission');
  }, [on, off]);

  const handleReviewed = (updated) => {
    setSubmissions((prev) =>
      prev.map((s) => (s.id === updated.id ? updated : s))
    );
  };

  const filtered = submissions.filter((s) => {
    if (filter === 'pending') return s.marks === null || s.marks === undefined;
    if (filter === 'marked') return s.marks !== null && s.marks !== undefined;
    return true;
  });

  const markedCount = submissions.filter((s) => s.marks !== null && s.marks !== undefined).length;
  const pendingCount = submissions.length - markedCount;

  if (loading) {
    return (
      <div style={{ minHeight: '100vh', background: isLight ? '#f3f4f6' : '#030712', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <div style={{ width: 32, height: 32, border: `2px solid ${isLight ? '#e5e7eb' : 'rgba(99,210,255,0.2)'}`, borderTopColor: isLight ? '#2563eb' : '#63d2ff', borderRadius: '50%', animation: 'spin 0.8s linear infinite' }} />
        <style>{`@keyframes spin{to{transform:rotate(360deg);}}`}</style>
      </div>
    );
  }

  const accentGrad = 'linear-gradient(135deg, #63d2ff, #2563eb)';

  return (
    <>
      <link href="https://fonts.googleapis.com/css2?family=Space+Mono:wght@400;700&family=DM+Sans:wght@300;400;500;700&family=Syne:wght@700;800&display=swap" rel="stylesheet" />
      <style>{`
        *,*::before,*::after{box-sizing:border-box;margin:0;padding:0;}
        @keyframes fadeUp { from { opacity: 0; transform: translateY(12px); } to { opacity: 1; transform: translateY(0); } }
        @keyframes gridPulse { 0%,100% { opacity: 0.015; } 50% { opacity: 0.035; } }
        .interactive-btn { transition: all 0.2s cubic-bezier(0.16, 1, 0.3, 1); cursor: pointer; }
        .interactive-btn:hover { filter: brightness(1.15); transform: translateY(-1px); }
        .tab-btn { background: none; border: 1px solid transparent; border-radius: 24px; font-family: ${font.mono}; font-size: 12px; font-weight: 700; cursor: pointer; transition: all 0.2s; padding: 8px 18px; color: ${isLight ? '#4b5563' : 'rgba(255,255,255,0.6)'}; }
        .tab-btn:hover { color: #63d2ff; text-shadow: 0 0 10px rgba(99,210,255,0.4); }
        .tab-btn-active { background: rgba(37, 99, 235, 0.15) !important; border: 1px solid rgba(99, 210, 255, 0.3) !important; color: #63d2ff !important; box-shadow: inset 0 0 12px rgba(99, 210, 255, 0.1); }
      `}</style>

      <div style={{ minHeight: '100vh', background: isLight ? '#f3f4f6' : '#030712', color: isLight ? '#1f2937' : '#ffffff', fontFamily: font.sans, position: 'relative', overflowX: 'hidden' }}>
        
        {/* Animated Grid Backdrops */}
        {!isLight && (
          <>
            <div style={{ position: 'fixed', inset: 0, pointerEvents: 'none', backgroundImage: `linear-gradient(rgba(99,210,255,0.015) 1px,transparent 1px),linear-gradient(90deg,rgba(99,210,255,0.015) 1px,transparent 1px)`, backgroundSize: '60px 60px', animation: 'gridPulse 6s ease-in-out infinite', zIndex: 0 }} />
            <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'radial-gradient(circle at top right, rgba(99,210,255,0.05), transparent 40%)', pointerEvents: 'none', zIndex: 0 }} />
          </>
        )}

        {/* Global Navigation Engine Bar */}
        <nav style={{ position: 'sticky', top: 0, zIndex: 50, height: 68, display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0 24px', background: isLight ? '#ffffff' : 'rgba(3, 7, 18, 0.75)', backdropFilter: 'blur(20px)', borderBottom: `1px solid ${isLight ? '#e5e7eb' : 'rgba(255,255,255,0.06)'}` }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <LabScanLogo size={30} gradientId="submissionListLogoGrad" />
            <span style={{ fontFamily: "'Syne', sans-serif", fontWeight: 800, fontSize: 18, letterSpacing: '-0.01em', background: accentGrad, WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>LabScan</span>
            <span style={{ marginLeft: 6, padding: '3px 10px', borderRadius: 6, background: isLight ? '#fef3c7' : 'rgba(251,191,36,0.08)', border: `1px solid ${isLight ? '#fde68a' : 'rgba(251,191,36,0.2)'}`, fontFamily: font.mono, fontSize: 10, fontWeight: 700, color: isLight ? '#d97706' : '#fbbf24', letterSpacing: '0.05em' }}>EVALUATION</span>
          </div>
        </nav>

        <div style={{ padding: 'clamp(16px,4vw,40px) clamp(16px,4vw,48px) 80px', maxWidth: 1000, margin: '0 auto', position: 'relative', zIndex: 1, animation: 'fadeUp 0.4s ease forwards' }}>
          
          {/* Breadcrumb Navigation system */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '11px', fontFamily: font.mono, color: isLight ? '#6b7280' : 'rgba(255,255,255,0.4)', marginBottom: '28px', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
            <button onClick={() => navigate('faculty-dashboard')} style={{ background: 'none', border: 'none', color: 'inherit', cursor: 'pointer', fontFamily: 'inherit' }} className="interactive-btn">Dashboard</button>
            <span>/</span>
            <button onClick={() => navigate('session-monitor', { sessionId })} style={{ background: 'none', border: 'none', color: 'inherit', cursor: 'pointer', fontFamily: 'inherit' }} className="interactive-btn">{session?.code || 'Session'}</button>
            <span>/</span>
            <span style={{ color: '#63d2ff', fontWeight: 700 }}>Submissions</span>
          </div>

          {/* Interactive Hero Section Context */}
          <div style={{ padding: '32px', borderRadius: '24px', background: isLight ? '#ffffff' : 'linear-gradient(135deg, rgba(10,24,40,0.7), rgba(5,15,25,0.4))', border: `1px solid ${isLight ? '#e5e7eb' : 'rgba(99,210,255,0.12)'}`, marginBottom: '32px', backdropFilter: 'blur(20px)', display: 'flex', justifyContent: 'space-between', alignItems: 'center', boxShadow: isLight ? '0 4px 20px rgba(0,0,0,0.02)' : '0 20px 50px rgba(0,0,0,0.2)' }}>
            <div>
              <div style={{ fontFamily: font.mono, fontSize: 11, letterSpacing: '0.15em', color: '#63d2ff', textTransform: 'uppercase', marginBottom: 6, fontWeight: 700 }}>Telemetry Ingestion Router</div>
              <h1 style={{ fontFamily: "'Syne', sans-serif", fontWeight: 800, fontSize: '26px', letterSpacing: '-0.02em', color: isLight ? '#1f2937' : '#ffffff', marginBottom: '4px' }}>
                {session?.experiment?.title || 'Parsing Active Assignment...'}
              </h1>
              <p style={{ fontSize: '13px', color: isLight ? '#4b5563' : 'rgba(255,255,255,0.45)', fontFamily: font.mono }}>
                Session Layer Instance: <span style={{ color: '#63d2ff', fontWeight: 700 }}>{session?.code}</span> · {submissions.length} dynamic logs parsed
              </p>
            </div>
            <button
              onClick={() => navigate('session-monitor', { sessionId })}
              style={{ padding: '10px 20px', border: 'none', borderRadius: 10, background: accentGrad, color: '#ffffff', fontFamily: font.mono, fontWeight: 700, fontSize: 11, letterSpacing: '0.04em', boxShadow: '0 4px 16px rgba(37,99,235,0.2)' }}
              className="interactive-btn"
            >
              Monitor Activity →
            </button>
          </div>

          {error && (
            <div style={{ padding: '14px 18px', background: 'rgba(248,113,113,0.08)', border: '1px solid rgba(248,113,113,0.25)', borderRadius: 12, color: '#fca5a5', fontSize: 13, marginBottom: 24 }}>
              ⚠️ {error}
            </div>
          )}

          {/* Pill-Style Filter Tab Control Engine */}
          <div style={{ display: 'flex', gap: 6, background: isLight ? '#e5e7eb' : 'rgba(10,20,30,0.6)', padding: 5, borderRadius: 30, marginBottom: 28, border: `1px solid ${isLight ? '#d1d5db' : 'rgba(255,255,255,0.05)'}`, width: 'max-content' }}>
            <button onClick={() => setFilter('all')} className={`tab-btn ${filter === 'all' ? 'tab-btn-active' : ''}`}>All ({submissions.length})</button>
            <button onClick={() => setFilter('pending')} className={`tab-btn ${filter === 'pending' ? 'tab-btn-active' : ''}`}>Pending ({pendingCount})</button>
            <button onClick={() => setFilter('marked')} className={`tab-btn ${filter === 'marked' ? 'tab-btn-active' : ''}`}>Marked ({markedCount})</button>
          </div>

          {/* Submissions Stack Execution Router */}
          {filtered.length === 0 ? (
            <div style={{ border: `1px dashed ${isLight ? '#cbd5e1' : 'rgba(255,255,255,0.06)'}`, borderRadius: 16, background: 'rgba(255,255,255,0.01)', textAlign: 'center', padding: '64px 24px', color: isLight ? '#6b7280' : 'rgba(255,255,255,0.35)', fontFamily: font.mono, fontSize: 12, letterSpacing: '0.04em', textTransform: 'uppercase' }}>
              {filter === 'all'
                ? 'Zero verification pushes compiled inside this session array.'
                : filter === 'pending'
                ? 'All inbound logs clear. All submissions evaluated successfully.'
                : 'No marked database arrays available in this view segment.'}
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
              {filtered.map((sub) => (
                <SubmissionCard
                  key={sub.id}
                  submission={sub}
                  onReviewed={handleReviewed}
                  maxMarks={session?.experiment?.maxMarks ?? 50}
                />
              ))}
            </div>
          )}
        </div>
      </div>
    </>
  );
}