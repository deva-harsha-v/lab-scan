import React, { useState, useEffect } from 'react';
import LabScanLogo from '../../components/LabScanLogo';
import { useAuth } from '../../context/AuthContext';
import { useRouter } from '../../App';
import { useTheme } from '../../context/ThemeContext';
import { makeStyles } from '../../utils/makeStyles';
import ThemeToggle from '../../components/ThemeToggle';
import { studentApi } from '../../api/student.api';
import { useSocket } from '../../hooks/useSocket';

export default function StudentDashboard() {
  const { user, logout } = useAuth();
  const { navigate } = useRouter();
  const { tokens } = useTheme();
  const S = makeStyles(tokens);
  const isDark = tokens.colorScheme === 'dark';
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState('');
  const { on, off, emit } = useSocket(user?.id || null);

  useEffect(() => {
    studentApi.getDashboard()
      .then(r => setData(r.data))
      .catch(e => setErr(e.response?.data?.error || 'Failed to load dashboard.'))
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    if (!user?.id) return;
    emit('join_student_room', user.id);
    return () => emit('leave_student_room', user.id);
  }, [user?.id, emit]);

  useEffect(() => {
    if (!user?.id) return;
    on('marks_updated', (payload) => {
      setData(prev => {
        if (!prev) return prev;
        const updatedLabs = prev.labs.map(lab => {
          if (lab.assignmentId !== payload.assignmentId) return lab;
          const updatedExps = lab.experiments.map(exp => {
            if (exp.slotId !== payload.slotId) return exp;
            return { ...exp, record: { ...(exp.record || {}), marks: payload.marks, status: payload.status, reviewedAt: payload.reviewedAt } };
          });
          const reviewed = updatedExps.filter(e => e.record?.status === 'REVIEWED');
          const totalMarks = reviewed.reduce((sum, e) => sum + (e.record?.marks || 0), 0);
          return { ...lab, experiments: updatedExps, stats: { ...lab.stats, totalMarks } };
        });
        return { ...prev, labs: updatedLabs };
      });
    });
    return () => off('marks_updated');
  }, [on, off, user?.id]);

  if (loading) return (
    <div style={{ minHeight:'100vh', background:tokens.bgPage, display:'flex', alignItems:'center', justifyContent:'center' }}>
      <div style={{ width:32, height:32, border:`2px solid ${tokens.accentMuted}`, borderTopColor:tokens.accent, borderRadius:'50%', animation:'spin 0.75s linear infinite' }} />
      <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
    </div>
  );

  const targetLab = data?.labs?.[0];
  const activeLabPct = targetLab?.stats?.total > 0 ? Math.round((targetLab.stats.completed / targetLab.stats.total) * 100) : 0;

  return (
    <div style={{ minHeight:'100vh', background:tokens.bgPage, color:tokens.textPrimary, fontFamily:"'DM Sans',sans-serif", position:'relative', transition:'background 0.3s ease, color 0.3s ease' }}>
      <style>{`
        @keyframes fadeIn { from { opacity:0; transform:translateY(12px); } to { opacity:1; transform:translateY(0); } }
        @keyframes spin { to { transform:rotate(360deg); } }
        .std-card { transition: all 0.3s ease !important; background: ${tokens.bgCard} !important; border: 1px solid ${tokens.border} !important; }
        .std-card:hover { border-color: ${tokens.accent} !important; transform: translateY(-2px); box-shadow: ${tokens.shadow} !important; }
        .std-btn { transition: all 0.2s ease; cursor: pointer; }
        .std-btn:hover { filter: brightness(1.08); transform: translateY(-1px); }
      `}</style>

      {/* Subtle grid bg */}
      <div style={{ position:'fixed', inset:0, pointerEvents:'none', zIndex:0,
        backgroundImage:`linear-gradient(${tokens.border} 1px,transparent 1px),linear-gradient(90deg,${tokens.border} 1px,transparent 1px)`,
        backgroundSize:'50px 50px', opacity: isDark ? 0.6 : 0.3 }} />

      {/* Nav */}
      <nav style={{ ...S.nav, padding:'0 24px', height:64, background: tokens.bgNav, borderBottom: `1px solid ${tokens.border}`, backdropFilter: tokens.backdropBlur }}>
        <div style={{ display:'flex', alignItems:'center', gap:12, cursor:'pointer' }} onClick={() => navigate('landing')}>
          <LabScanLogo size={28} gradientId="studentDashLogoGrad" />
          <span style={{ fontSize:18, fontWeight:800, letterSpacing:'-0.02em', color: tokens.textPrimary }}>LabScan</span>
          <span style={{ fontFamily:"'Space Mono',monospace", fontSize:9, color:tokens.accent, background:tokens.accentMuted, border:`1px solid ${tokens.accentBorder}`, padding:'2px 8px', borderRadius:6, fontWeight:700, marginLeft:4 }}>STUDENT</span>
        </div>
        <div style={{ display:'flex', alignItems:'center', gap:12 }}>
          <div style={{ display:'flex', flexDirection:'column', textAlign:'right' }}>
            <span style={{ fontSize:13, color:tokens.textPrimary, fontWeight:500 }}>{data?.student?.name || user?.name}</span>
            <span style={{ fontSize:10, fontFamily:"'Space Mono',monospace", color:tokens.textMuted }}>Active Workspace</span>
          </div>
          <ThemeToggle size="sm" />
          <button onClick={() => navigate('student-change-password')} style={{ ...S.btnSecondary, padding:'8px 14px', fontSize:11, fontFamily:"'Space Mono',monospace" }}>Change Password</button>
          <button onClick={() => { logout(); navigate('landing'); }} style={{ ...S.btnSecondary, padding:'8px 14px', fontSize:11, fontFamily:"'Space Mono',monospace", color:tokens.danger, borderColor:tokens.dangerBorder }}>Sign out</button>
        </div>
      </nav>

      <div style={{ padding:'clamp(16px,4vw,40px) clamp(16px,5vw,60px) 80px', width:'100%', position:'relative', zIndex:1, animation:'fadeIn 0.5s ease forwards', display:'flex', flexDirection:'column', gap:28 }}>
        {err && <div style={S.errorBanner}>{err}</div>}

        {/* Hero */}
        <div style={{ padding:36, borderRadius:24, background: tokens.bgCard, border:`1px solid ${tokens.border}`, display:'flex', flexDirection:'column', gap:20, boxShadow: tokens.shadowCard }}>
          <div>
            <h1 style={{ fontSize:28, fontWeight:800, color:tokens.textPrimary, letterSpacing:'-0.02em', marginBottom:6 }}>
              Welcome back, {data?.student?.name || user?.name}
            </h1>
            <p style={{ fontSize:14, color:tokens.textSecondary, lineHeight:1.5 }}>
              You have <span style={{ color:tokens.accent, fontWeight:700 }}>{data?.labs?.length || 0} active</span> laboratory assignment{data?.labs?.length !== 1 ? 's' : ''} currently mapped.
            </p>
          </div>
          <div style={{ display:'flex', gap:12, flexWrap:'wrap' }}>
            <button className="std-btn" onClick={() => targetLab && navigate('student-lab-detail', { assignmentId: targetLab.assignmentId })}
              style={{ padding:'12px 24px', background:tokens.accentGrad, border:'none', borderRadius:12, color: tokens.textInverse, fontFamily:"'Space Mono',monospace", fontWeight:700, fontSize:12, letterSpacing:'0.04em', boxShadow: tokens.shadow }}>
              OPEN LAB CONSOLE
            </button>
          </div>
        </div>

        {/* Info cards */}
        <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fit, minmax(130px, 1fr))', gap:14 }}>
          {[
            { tag:'SECTION',     val: data?.section?.name       || '—' },
            { tag:'DEPARTMENT',  val: data?.section?.department  || '—' },
            { tag:'SEMESTER',    val: data?.section?.semester    || '—' },
            { tag:'ACADEMIC YR', val: data?.section?.academicYear || '—' },
          ].map((item, idx) => (
            <div key={idx} style={{ ...S.card, background: tokens.bgCard, border: `1px solid ${tokens.border}`, padding:'20px 24px', borderRadius:18, boxShadow: tokens.shadowCard }}>
              <div style={{ fontFamily: "'Space Mono', monospace", fontSize: 10, color: tokens.textMuted, letterSpacing: '0.05em' }}>{item.tag}</div>
              <div style={{ fontSize:26, fontWeight:700, color:tokens.textPrimary, marginTop:4, fontFamily:"'DM Sans',sans-serif", letterSpacing:'-0.02em' }}>{item.val}</div>
            </div>
          ))}
        </div>

        {/* Row 1 */}
        <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fit, minmax(260px, 1fr))', gap:20 }}>
          {/* Active lab */}
          <div style={{ display:'flex', flexDirection:'column', gap:16 }}>
            <div style={{ fontFamily: "'Space Mono', monospace", fontSize: 11, color: tokens.textMuted, letterSpacing: '0.05em' }}>ACTIVE LABORATORY</div>
            {targetLab ? (
              <div className="std-card" style={{ ...S.card, borderRadius:20, padding:28, display:'flex', flexDirection:'column', gap:20, position:'relative', boxShadow: tokens.shadowCard }}>
                <div style={{ position:'absolute', top:0, left:0, right:0, height:3, background:tokens.accentGrad, borderRadius:'20px 20px 0 0' }} />
                <div>
                  <div style={{ fontSize:20, fontWeight:700, color:tokens.textPrimary }}>{targetLab.subject?.name || '—'}</div>
                  <div style={{ fontSize:12, fontFamily:"'Space Mono',monospace", color:tokens.accent, marginTop:4 }}>{targetLab.subject?.code || '—'}</div>
                </div>
                <div>
                  <div style={{ fontFamily: "'Space Mono', monospace", fontSize: 10, color: tokens.textMuted }}>FACULTY</div>
                  <div style={{ fontSize:14, color:tokens.textPrimary, fontWeight:500, marginTop:4 }}>{targetLab.faculty?.name || '—'}</div>
                </div>
                <div>
                  <div style={{ display:'flex', justifyContent:'space-between', marginBottom:8 }}>
                    <span style={{ fontFamily: "'Space Mono', monospace", fontSize: 10, color: tokens.textMuted }}>PROGRESS</span>
                    <span style={{ fontFamily:"'Space Mono',monospace", fontSize:11, color:tokens.accent, fontWeight:700 }}>{activeLabPct}%</span>
                  </div>
                  <div style={{ height:6, background:tokens.bgSurfaceHover, borderRadius:10, border: `1px solid ${tokens.border}` }}>
                    <div style={{ height:'100%', width:`${activeLabPct||10}%`, background:tokens.accentGrad, borderRadius:10, transition:'width 1s ease' }} />
                  </div>
                </div>
                <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', padding:'12px 16px', background:tokens.successBg, borderRadius:12, border:`1px solid ${tokens.successBorder}` }}>
                  <span style={{ fontFamily:"'Space Mono',monospace", fontSize:10, color:tokens.success, fontWeight:700 }}>TOTAL MARKS</span>
                  <span style={{ fontFamily:"'Space Mono',monospace", fontSize:15, color:tokens.success, fontWeight:700 }}>
                    {targetLab.stats?.totalMarks ?? '—'} <span style={{ color:tokens.textMuted, fontSize:11 }}>/ {targetLab.stats?.maxPossible ?? '—'}</span>
                  </span>
                </div>
                <button onClick={() => navigate('student-lab-detail', { assignmentId: targetLab.assignmentId })} className="std-btn"
                  style={{ width:'100%', padding:14, background:tokens.btnSecondaryBg, border:`1px solid ${tokens.btnSecondaryBorder}`, borderRadius:12, color:tokens.btnSecondaryText, fontFamily:"'Space Mono',monospace", fontSize:12, fontWeight:700 }}>
                  LAUNCH LAB CONSOLE →
                </button>
              </div>
            ) : (
              <div style={{ ...S.card, background: tokens.bgCard, border: `1px solid ${tokens.border}`, padding:40, borderRadius:20, textAlign:'center', color:tokens.textMuted, fontFamily:"'Space Mono',monospace" }}>
                No active laboratory assigned.
              </div>
            )}
          </div>

          {/* Labs list */}
          <div style={{ display:'flex', flexDirection:'column', gap:16 }}>
            <div style={{ fontFamily: "'Space Mono', monospace", fontSize: 11, color: tokens.textMuted, letterSpacing: '0.05em' }}>ALL LABS</div>
            <div style={{ ...S.card, background: tokens.bgCard, border: `1px solid ${tokens.border}`, borderRadius:20, padding:24, display:'flex', flexDirection:'column', gap:12, minHeight:200, boxShadow: tokens.shadowCard }}>
              {data?.labs?.length > 0 ? data.labs.map((lab, idx) => (
                <div key={lab.assignmentId} className="std-card" style={{ display:'flex', justifyContent:'space-between', alignItems:'center', padding:'14px 18px', background:tokens.bgSurface, border:`1px solid ${tokens.border}`, borderRadius:12, cursor:'pointer' }}
                  onClick={() => navigate('student-lab-detail', { assignmentId: lab.assignmentId })}>
                  <div>
                    <div style={{ fontSize:14, color:tokens.textPrimary, fontWeight:600 }}>{lab.subject?.name || '—'}</div>
                    <div style={{ fontSize:11, fontFamily:"'Space Mono',monospace", color:tokens.textMuted, marginTop:2 }}>{lab.subject?.code}</div>
                  </div>
                  <div style={{ fontFamily:"'Space Mono',monospace", fontSize:13, color:tokens.accent, fontWeight:700 }}>
                    {lab.stats?.totalMarks ?? '—'}
                  </div>
                </div>
              )) : (
                <div style={{ textAlign: 'center', color: tokens.textMuted, padding: '40px 0' }}>No labs yet.</div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}