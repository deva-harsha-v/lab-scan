import React, { useState, useEffect } from 'react';
import LabScanLogo from '../../components/LabScanLogo';
import { useAuth } from '../../context/AuthContext';
import { useRouter } from '../../App';
import { sessionsApi } from '../../api/sessions.api';
import { submissionsApi } from '../../api/submissions.api';
import { labAssignmentApi } from '../../api/labAssignment.api';
import { useSocket } from '../../hooks/useSocket';

import { useTheme } from '../../context/ThemeContext';
import ThemeToggle from '../../components/ThemeToggle';
import { 
  BarChart3, Activity, PlusCircle, BookOpen, Layers, FileCheck,
  LogOut, Sliders, Calendar, Clock, Menu, X, ArrowRight, ShieldCheck
} from 'lucide-react';

const makeStatus = (tokens) => ({
  DRAFT:  { label:'Draft',  color:tokens.textMuted, bg:tokens.bgSurfaceHover, border:tokens.border },
  ACTIVE: { label:'Active', color:tokens.success, bg:tokens.successBg,  border:tokens.successBorder },
  GRACE:  { label:'Grace',  color:tokens.accent, bg:tokens.accentMuted,  border:tokens.accentBorder },
  CLOSED: { label:'Closed', color:tokens.textDimmer, bg:tokens.bgSurface,   border:tokens.border  },
});

function StatusBadge({ status }) {
  const { tokens } = useTheme();
  const STATUS = makeStatus(tokens);
  const c = STATUS[status] || STATUS.DRAFT;
  return (
    <span style={{ display:'inline-flex', alignItems:'center', gap:6, padding:'4px 12px', borderRadius:100, border:`1px solid ${c.border}`, background:c.bg, color:c.color, fontSize:11, fontFamily:"'Space Mono',monospace", fontWeight: 700, letterSpacing:'0.04em' }}>
      {status === 'ACTIVE' && <span style={{ width:6, height:6, borderRadius:'50%', background:tokens.success, boxShadow:`0 0 8px ${tokens.success}`, animation:'pulse 2s ease-in-out infinite', flexShrink:0 }} />}
      {c.label}
    </span>
  );
}

const TABS = [
  { id: 'overview',     icon: BarChart3,  label: 'Overview' },
  { id: 'sessions',     icon: Activity,   label: 'Sessions' },
  { id: 'new-session',  icon: PlusCircle, label: 'New Session' },
  { id: 'submissions',  icon: FileCheck,  label: 'Submissions' },
  { id: 'my-labs',      icon: BookOpen,   label: 'My Labs' },
];

function CreateSessionInline({ onCreated }) {
  const { tokens } = useTheme();
  const [form, setForm] = useState({ startsAt:'', endsAt:'', gracePeriodMinutes:10, allowResubmit:false });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    const now = new Date();
    const later = new Date(now.getTime() + 60*60*1000);
    const fmt = d => { const p = n => String(n).padStart(2,'0'); return `${d.getFullYear()}-${p(d.getMonth()+1)}-${p(d.getDate())}T${p(d.getHours())}:${p(d.getMinutes())}`; };
    setForm(f => ({ ...f, startsAt:fmt(now), endsAt:fmt(later) }));
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault(); setError('');
    if (new Date(form.endsAt) <= new Date(form.startsAt)) { setError('End time must be after start time.'); return; }
    setLoading(true);
    try {
      const res = await sessionsApi.create({ startsAt:new Date(form.startsAt).toISOString(), endsAt:new Date(form.endsAt).toISOString(), gracePeriodMinutes:parseInt(form.gracePeriodMinutes), allowResubmit:form.allowResubmit });
      onCreated(res.data);
    } catch (err) { setError(err.response?.data?.error || 'Failed to create session.'); }
    finally { setLoading(false); }
  };

  const inp = { width:'100%', padding:'12px 16px', background:tokens.bgInput, border:`1px solid ${tokens.borderInput}`, borderRadius:10, color:tokens.textPrimary, fontSize:14, fontFamily:"'DM Sans',sans-serif", outline:'none', colorScheme:tokens.colorScheme, transition:'all 0.2s' };
  const lbl = { display:'block', fontFamily:"'Space Mono',monospace", fontSize:11, letterSpacing:'0.1em', color:tokens.textSecondary, textTransform:'uppercase', marginBottom:8 };

  return (
    <div style={{ border:`1px solid ${tokens.border}`, borderRadius:16, background:tokens.bgCard, backdropFilter:'blur(24px)', padding:'24px', boxShadow:tokens.shadowModal }}>
      <div style={{ marginBottom:24, padding:'14px 18px', background:tokens.accentMuted, border:`1px solid ${tokens.accentBorder}`, borderRadius:10, display:'flex', gap:12, alignItems:'flex-start' }}>
        <Sliders size={18} style={{ color: tokens.accent, marginTop: 2, flexShrink:0 }} />
        <p style={{ fontSize:13, color:tokens.textSecondary, lineHeight:1.6 }}>
          Experiments are assigned automatically when each student group scans the ArUco marker on their lab table. No pre-selection needed — multiple groups can run different experiments in the same session.
        </p>
      </div>
      {error && <div style={{ marginBottom:20, padding:'12px 16px', background:tokens.dangerBg, border:`1px solid ${tokens.dangerBorder}`, borderRadius:10, color:tokens.danger, fontSize:13 }}>{error}</div>}
      <form onSubmit={handleSubmit}>
        <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fit, minmax(200px, 1fr))', gap:16, marginBottom:20 }}>
          {[{key:'startsAt',label:'Start Time'},{key:'endsAt',label:'End Time'}].map(f => (
            <div key={f.key}>
              <label style={lbl}>{f.label} *</label>
              <input type="datetime-local" className="focusable-input" style={inp} value={form[f.key]} onChange={e => setForm({...form, [f.key]:e.target.value})} required />
            </div>
          ))}
        </div>
        <div style={{ marginBottom:20 }}>
          <label style={lbl}>Grace Period (minutes)</label>
          <input type="number" className="focusable-input" style={inp} min={0} max={60} value={form.gracePeriodMinutes} onChange={e => setForm({...form, gracePeriodMinutes:e.target.value})} />
          <p style={{ fontSize:12, color:tokens.textMuted, marginTop:6 }}>Extra time after session ends for late submissions.</p>
        </div>
        <div style={{ display:'flex', alignItems:'center', gap:12, marginBottom:28, cursor:'pointer', userSelect:'none' }} onClick={() => setForm({...form, allowResubmit:!form.allowResubmit})}>
          <div style={{ width:20, height:20, borderRadius:6, border:`1px solid ${form.allowResubmit ? tokens.accent : tokens.borderInput}`, background:form.allowResubmit ? tokens.accentMuted : tokens.bgInput, display:'flex', alignItems:'center', justifyContent:'center', fontSize:12, color:tokens.accent, transition:'all 0.2s', flexShrink:0 }}>
            {form.allowResubmit && '✓'}
          </div>
          <span style={{ fontSize:14, color:tokens.textSecondary, fontWeight:500 }}>Allow resubmission</span>
        </div>
        <button type="submit" disabled={loading} style={{ width:'100%', padding:'14px', background:tokens.accentGrad, border:'none', borderRadius:10, color:tokens.textInverse, fontFamily:"'Space Mono',monospace", fontWeight:700, fontSize:14, letterSpacing:'0.08em', cursor:loading?'wait':'pointer', display:'flex', alignItems:'center', justifyContent:'center', gap:8, boxShadow:tokens.shadow, transition:'all 0.2s' }}>
          {loading ? <div style={{ width:18, height:18, border:'2px solid rgba(5,12,20,0.3)', borderTopColor:tokens.textInverse, borderRadius:'50%', animation:'spin 0.8s linear infinite' }} /> : 'CREATE SESSION →'}
        </button>
      </form>
    </div>
  );
}

export default function FacultyDashboard() {
  const { user, logout } = useAuth();
  const { navigate } = useRouter();
  const { tokens } = useTheme();
  const [tab, setTab] = useState('overview');
  const [sessions, setSessions] = useState([]);
  const [loadingSessions, setLoadingSessions] = useState(true);
  const [submissionCounts, setSubmissionCounts] = useState({});
  const [recentSubmissions, setRecentSubmissions] = useState([]); 
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [showDropdown, setShowDropdown] = useState(false);
  const [myLabs, setMyLabs] = useState([]);
  const [loadingLabs, setLoadingLabs] = useState(true);

  const isDark = tokens.colorScheme === 'dark';
  const { on, off } = useSocket(user?.id || 'faculty');

  useEffect(() => {
    let active = true;
    sessionsApi.getAll()
      .then(async (r) => {
        const sessionsData = r.data || [];
        if (!active) return;
        setSessions(sessionsData);

        let compiledSubs = sessionsData
          .flatMap(s => (s.submissions || []).map(sub => ({
            ...sub,
            sessionId: s.id,
            sessionCode: s.code,
            labTitle: s.experiment?.title,
            rollNo: sub.rollNumber,
            createdAt: sub.submittedAt,
            status: (sub.marks !== null && sub.marks !== undefined) ? `Marked (${sub.marks}/100)` : 'Pending Review',
            statusColor: (sub.marks !== null && sub.marks !== undefined) ? tokens.success : tokens.warning,
          })));

        if (compiledSubs.length === 0 && sessionsData.length > 0) {
          const results = await Promise.all(
            sessionsData.map(s =>
              submissionsApi.getBySession
                ? submissionsApi.getBySession(s.id)
                    .then(res => (res.data || []).map(sub => ({
                      ...sub,
                      sessionId: s.id,
                      sessionCode: s.code,
                      labTitle: s.experiment?.title,
                      rollNo: sub.rollNumber,
                      createdAt: sub.submittedAt,
                      status: (sub.marks !== null && sub.marks !== undefined) ? `Marked (${sub.marks}/100)` : 'Pending Review',
                      statusColor: (sub.marks !== null && sub.marks !== undefined) ? tokens.success : tokens.warning,
                    })))
                    .catch(() => [])
                : Promise.resolve([])
            )
          );
          compiledSubs = results.flat();
        }

        compiledSubs.sort((a, b) => new Date(b.createdAt || b.time) - new Date(a.createdAt || a.time));
        if (active) setRecentSubmissions(compiledSubs);
      })
      .catch(console.error)
      .finally(() => { if (active) setLoadingSessions(false); });

    return () => { active = false; };
  }, [tokens.success, tokens.warning]);

  useEffect(() => {
    let active = true;
    labAssignmentApi.getMyAssignments()
      .then(r => { if (active) setMyLabs(r.data || []); })
      .catch(err => { console.error('Failed to load lab assignments:', err); if (active) setMyLabs([]); })
      .finally(() => { if (active) setLoadingLabs(false); });
    return () => { active = false; };
  }, []);

  useEffect(() => {
    if (!on || !off) return;

    const handler = ({ sessionId, submissionCount, submission, latestSubmission }) => {
      setSubmissionCounts(prev => ({ ...prev, [sessionId]: submissionCount }));
      const incoming = submission || latestSubmission;
      if (incoming) {
        setRecentSubmissions(prev => {
          const targetSession = sessions.find(s => s.id === sessionId);
          const unifiedSubmission = {
            ...incoming,
            sessionId: incoming.sessionId || sessionId,
            sessionCode: targetSession?.code || incoming.sessionCode || 'LB',
            labTitle: targetSession?.experiment?.title || incoming.labTitle,
            rollNo: incoming.rollNumber || incoming.rollNo,
            createdAt: incoming.submittedAt || incoming.createdAt || new Date().toISOString(),
            status: (incoming.marks !== null && incoming.marks !== undefined) ? `Marked (${incoming.marks}/100)` : 'Pending Review',
            statusColor: (incoming.marks !== null && incoming.marks !== undefined) ? tokens.success : tokens.warning,
          };
          if (unifiedSubmission.id && prev.some(s => s.id === unifiedSubmission.id)) {
            return prev;
          }
          return [unifiedSubmission, ...prev].slice(0, 50);
        });
      }
    };

    on('new_submission', handler);
    return () => off('new_submission', handler);
  }, [on, off, sessions, tokens.success, tokens.warning]);

  const activeSessions = sessions.filter(s => s.status==='ACTIVE'||s.status==='GRACE');
  const totalSubs = sessions.reduce((sum,s) => sum+(s._count?.submissions || s.submissions?.length || 0), 0);
  const assignedLabsCount = myLabs.length;

  const handleActivate = async (id) => {
    try { await sessionsApi.activate(id); setSessions(prev => prev.map(s => s.id===id?{...s,status:'ACTIVE'}:s)); }
    catch (err) { alert(err.response?.data?.error||'Failed'); }
  };
  const handleClose = async (id) => {
    if (!window.confirm('Close this session?')) return;
    try { await sessionsApi.close(id); setSessions(prev => prev.map(s => s.id===id?{...s,status:'CLOSED'}:s)); }
    catch (err) { alert(err.response?.data?.error||'Failed'); }
  };
  const handleDeleteSession = async (id) => {
    if (!window.confirm('Delete this session? This cannot be undone.')) return;
    try { await sessionsApi.delete(id); setSessions(prev => prev.filter(s => s.id!==id)); }
    catch (err) { alert(err.response?.data?.error||'Failed'); }
  };

  const fmtTime = (isoString) => {
    if (!isoString) return '--:--';
    try { return new Date(isoString).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }); }
    catch { return '--:--'; }
  };

  const cardBtnStyle = (accent) => ({
    padding: '8px 14px', borderRadius: '8px', border: `1px solid ${tokens.border}`,
    background: tokens.bgSurface, color: accent,
    fontFamily: "'Space Mono',monospace", fontSize: '11px', fontWeight: 700,
    letterSpacing: '0.04em', cursor: 'pointer', transition: 'all 0.2s ease',
    flex: '1 1 auto', textAlign: 'center'
  });

  const handleTabChange = (id) => { setTab(id); setSidebarOpen(false); };
  const getProgressPercentage = (value, max = 20) => Math.min((value / (max || 1)) * 100, 100);

  const getGreeting = () => {
    const hr = new Date().getHours();
    if (hr < 12) return 'Good morning';
    if (hr < 17) return 'Good afternoon';
    return 'Good evening';
  };

  const getUserInitials = () => {
    if (!user?.name) return 'DJ';
    return user.name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);
  };

  const formattedDateString = () => {
    return new Date().toLocaleDateString('en-US', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' });
  };

  return (
    <>
      <link href="https://fonts.googleapis.com/css2?family=Space+Mono:wght@400;700&family=DM+Sans:wght@300;400;500;700&family=Syne:wght@700;800&display=swap" rel="stylesheet" />
      <style>{`
        *,*::before,*::after{box-sizing:border-box;margin:0;padding:0;}
        @keyframes pulse{0%,100%{opacity:1;transform:scale(1);}50%{opacity:0.4;transform:scale(0.8);}}
        @keyframes fadeUp{from{opacity:0;transform:translateY(12px);}to{opacity:1;transform:translateY(0);}}
        @keyframes gridPulse{0%,100%{opacity:0.02;}50%{opacity:0.04;}}
        @keyframes spin{to{transform:rotate(360deg);}}
        .session-card{transition:all 0.25s cubic-bezier(0.16,1,0.3,1);background:${tokens.bgCard}!important;border:1px solid ${tokens.border}!important;backdrop-filter:blur(24px);box-shadow:${tokens.shadowCard};}
        .session-card:hover{transform:translateY(-4px);border-color:${tokens.accent}!important;box-shadow:${tokens.shadow};}
        .card-btn:hover{filter:brightness(1.1);background:${tokens.bgSurfaceHover}!important;}
        .sidelink:hover{background:${tokens.bgSurfaceHover}!important;color:${tokens.textPrimary}!important;}
        .nav-btn:hover{filter:brightness(1.05);transform:translateY(-1px);}
        .focusable-input:focus{border-color:${tokens.accent}!important;box-shadow:0 0 0 3px ${tokens.accentMuted};}
        ::-webkit-scrollbar{width:6px;height:6px;}::-webkit-scrollbar-track{background:${tokens.bgPage};}::-webkit-scrollbar-thumb{background:${tokens.borderStrong};border-radius:3px;}
        @media(max-width:767px){
          .faculty-sidebar{position:fixed!important;top:0!important;left:-260px!important;width:260px!important;height:100vh!important;z-index:200!important;transition:left 0.3s ease!important;overflow-y:auto!important;}
          .faculty-sidebar.open{left:0!important;}
          .sidebar-overlay{display:none;position:fixed;inset:0;background:rgba(0,0,0,0.6);z-index:199;}
          .sidebar-overlay.open{display:block;}
          .faculty-main{padding:20px 16px 80px!important;}
          .faculty-nav-labels{display:none!important;}
        }
        @media(min-width:768px){
          .mobile-menu-btn{display:none!important;}
        }
      `}</style>

      <div style={{ minHeight:'100vh', background:tokens.bgPage, color:tokens.textPrimary, fontFamily:"'DM Sans',sans-serif", position:'relative', overflowX:'hidden', transition:'background 0.3s ease, color 0.3s ease' }}>
        <div style={{ position:'fixed', inset:0, pointerEvents:'none', backgroundImage:`linear-gradient(${tokens.border} 1px,transparent 1px),linear-gradient(90deg,${tokens.border} 1px,transparent 1px)`, backgroundSize:'50px 50px', animation:'gridPulse 8s ease-in-out infinite', zIndex:0, opacity: isDark ? 1 : 0.4 }} />
        <div style={{ position:'fixed', top:0, left:0, right:0, bottom:0, background: isDark ? 'radial-gradient(circle at 20% 20%, rgba(99,210,255,0.08), transparent 40%), radial-gradient(circle at 80% 50%, rgba(74,240,196,0.06), transparent 40%)' : 'radial-gradient(circle at 20% 20%, rgba(14,165,233,0.04), transparent 40%)', pointerEvents:'none', zIndex:0 }} />

        {/* TOP NAV BAR */}
        <nav style={{ position:'sticky', top:0, zIndex:50, height:64, display:'flex', alignItems:'center', justifyContent:'space-between', padding:'0 16px', background:tokens.bgNav, backdropFilter:tokens.backdropBlur, borderBottom:`1px solid ${tokens.border}`, transition:'background 0.3s ease, border-color 0.3s ease' }}>
          <div style={{ display:'flex', alignItems:'center', gap:10 }}>
            <button className="mobile-menu-btn" onClick={() => setSidebarOpen(v => !v)}
              style={{ background:'none', border:`1px solid ${tokens.border}`, borderRadius:8, color:tokens.textSecondary, cursor:'pointer', padding:'6px 8px', display:'flex', alignItems:'center', marginRight:4 }}>
              {sidebarOpen ? <X size={18} /> : <Menu size={18} />}
            </button>
            <LabScanLogo size={30} gradientId="facultyDashLogoGrad" />
            <span style={{ fontFamily:"'Syne',sans-serif", fontWeight:800, fontSize:18, letterSpacing:'-0.01em', color:tokens.textPrimary }}>LabScan</span>
            <span style={{ padding:'3px 8px', borderRadius:6, background:tokens.accentMuted, border:`1px solid ${tokens.accentBorder}`, fontFamily:"'Space Mono',monospace", fontSize:10, fontWeight:700, color:tokens.accent, letterSpacing:'0.05em' }}>FACULTY</span>
          </div>
          <div style={{ display:'flex', alignItems:'center', gap:12 }}>
            <button className="nav-btn" onClick={() => handleTabChange('my-labs')} style={{ padding:'7px 12px', background:tokens.bgSurface, border:`1px solid ${tokens.border}`, borderRadius:8, color:tokens.textPrimary, fontFamily:"'Space Mono',monospace", fontWeight:700, fontSize:11, cursor:'pointer', display:'flex', alignItems:'center', gap:6, transition:'all 0.2s' }}>
              <BookOpen size={13} /> <span className="faculty-nav-labels">MY LABS</span>
            </button>
            {user?.role === 'HOD' && (
              <button className="nav-btn" onClick={() => navigate('hod-dashboard')} style={{ padding:'7px 12px', background:'linear-gradient(135deg,#fbbf24,#d97706)', border:'none', borderRadius:8, color:tokens.textInverse, fontFamily:"'Space Mono',monospace", fontWeight:700, fontSize:11, cursor:'pointer', letterSpacing:'0.04em', transition:'all 0.2s' }}>
                🏛️ <span className="faculty-nav-labels">HOD</span>
              </button>
            )}
            <ThemeToggle size="sm" />
            
            {/* Avatar Dropdown Wrapper */}
            <div style={{ position: 'relative' }}>
              <button onClick={() => setShowDropdown(!showDropdown)} style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 0, display: 'flex', alignItems: 'center' }}>
                <div style={{ width: 36, height: 36, borderRadius: '50%', background: 'linear-gradient(135deg, #1e64ff, #63d2ff)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#ffffff', fontWeight: 700, fontSize: 13, fontFamily: "'Space Mono', monospace", border: `2px solid ${tokens.border}` }}>
                  {getUserInitials()}
                </div>
              </button>
              {showDropdown && (
                <div style={{ position: 'absolute', right: 0, marginTop: 8, width: 180, background: tokens.bgModal, border: `1px solid ${tokens.border}`, borderRadius: 10, padding: 6, boxShadow: tokens.shadowModal, zIndex: 100 }}>
                  <button onClick={() => { logout(); navigate('login'); }} style={{ width: '100%', display: 'flex', alignItems: 'center', gap: 10, padding: '10px 12px', background: 'none', border: 'none', color: tokens.danger, fontFamily: "'Space Mono', monospace", fontSize: 12, cursor: 'pointer', textAlign: 'left', borderRadius: 6 }} className="sidelink">
                    <LogOut size={14} /> LOGOUT
                  </button>
                </div>
              )}
            </div>
          </div>
        </nav>

        <div style={{ display:'flex', position:'relative', zIndex:1 }}>
          {/* SIDEBAR PANEL */}
          <aside className={`faculty-sidebar${sidebarOpen ? ' open' : ''}`} style={{ width:250, minHeight:'calc(100vh - 64px)', background:tokens.bgSidebar, backdropFilter:'blur(10px)', borderRight:`1px solid ${tokens.border}`, padding:'24px 14px', position:'sticky', top:64, height:'calc(100vh - 64px)', flexShrink:0, display:'flex', flexDirection:'column', justifyContent:'space-between', transition:'background 0.3s ease, border-color 0.3s ease' }}>
            <div>
              <div style={{ padding:'16px', borderRadius:'12px', background:tokens.bgSurface, border:`1px solid ${tokens.border}`, marginBottom:'24px' }}>
                <div style={{ display:'flex', alignItems:'center', gap:10, marginBottom:4 }}>
                  <div style={{ width: 28, height: 28, borderRadius: '50%', background: tokens.accentMuted, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 13, color: tokens.accent, fontWeight: 'bold' }}>
                    {getUserInitials()}
                  </div>
                  <span style={{ fontSize:'14px', fontWeight:700, color:tokens.textPrimary, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                    {user?.name || 'Faculty Member'}
                  </span>
                </div>
                <div style={{ fontSize:'11px', fontFamily:"'Space Mono', monospace", color:tokens.textMuted, textTransform:'uppercase', letterSpacing:'0.05em', paddingLeft:'38px' }}>
                  {user?.department || 'Faculty · CSE Dept'}
                </div>
              </div>
              <div style={{ fontFamily:"'Space Mono',monospace", fontSize:10, letterSpacing:'0.15em', color:tokens.textDimmer, textTransform:'uppercase', padding:'0 12px', marginBottom:12, fontWeight:700 }}>Navigation</div>
              {TABS.map(t => {
                const IconComponent = t.icon;
                const isActive = tab === t.id;
                return (
                  <button key={t.id} onClick={() => handleTabChange(t.id)} className={`sidelink ${isActive ? 'active-tab' : ''}`}
                    style={{ width:'100%', display:'flex', alignItems:'center', gap:12, padding:'12px 14px', borderRadius:10, border:'none', background:isActive?tokens.accentMuted:'transparent', color:isActive?tokens.accent:tokens.textSecondary, fontFamily:"'Space Mono',monospace", fontSize:12, fontWeight:isActive?700:400, letterSpacing:'0.02em', cursor:'pointer', transition:'all 0.15s', marginBottom:6, textAlign:'left', borderLeft:isActive?`3px solid ${tokens.accent}`:'3px solid transparent' }}>
                    <IconComponent size={15} style={{ flexShrink:0, color:isActive?tokens.accent:'inherit' }} />
                    {t.label}
                    {t.id==='sessions' && activeSessions.length>0 && <span style={{ marginLeft:'auto', background:tokens.successBg, border:`1px solid ${tokens.successBorder}`, color:tokens.success, borderRadius:100, padding:'2px 8px', fontSize:10, fontFamily:"'Space Mono',monospace", fontWeight:700 }}>{activeSessions.length}</span>}
                  </button>
                );
              })}
            </div>
            
            <div style={{ padding:'16px', background:tokens.bgSurface, border:`1px solid ${tokens.border}`, borderRadius:12 }}>
              <div style={{ fontFamily:"'Space Mono',monospace", fontSize:10, letterSpacing:'0.1em', color:tokens.textDimmer, textTransform:'uppercase', marginBottom:12, fontWeight:700 }}>Quick Stats</div>
              <div style={{ display:'flex', justifyContent:'space-between', marginBottom:8, fontSize:13, color:tokens.textSecondary }}>
                <span>Total sessions</span><span style={{ color:tokens.accent, fontFamily:"'Space Mono',monospace", fontWeight:700 }}>{sessions.length}</span>
              </div>
              <div style={{ display:'flex', justifyContent:'space-between', marginBottom:8, fontSize:13, color:tokens.textSecondary }}>
                <span>Submissions</span><span style={{ color:tokens.warning, fontFamily:"'Space Mono',monospace", fontWeight:700 }}>{totalSubs}</span>
              </div>
              <div style={{ display:'flex', justifyContent:'space-between', fontSize:13, color:tokens.textSecondary }}>
                <span>Avg. score</span><span style={{ color:tokens.success, fontFamily:"'Space Mono',monospace", fontWeight:700 }}>{user?.avgScore || '78%'}</span>
              </div>
            </div>
          </aside>

          {/* MAIN GRID VIEWPORT */}
          <main className="faculty-main" style={{ flex:1, padding:'32px 32px 80px', minWidth:0 }}>
            
            {/* Live Timing Greeting Header */}
            <div style={{ marginBottom: '28px' }}>
              <h1 style={{ fontFamily: "'Syne', sans-serif", fontWeight: 800, fontSize: '28px', color: tokens.textPrimary, marginBottom: '4px' }}>
                {getGreeting()}, {user?.name ? user.name.split(' ')[0] : 'Faculty'}
              </h1>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, color: tokens.textSecondary, fontSize: '13px', fontFamily: "'Space Mono', monospace" }}>
                <span>{formattedDateString()}</span>
                <span style={{ width: 4, height: 4, borderRadius: '50%', background: tokens.borderStrong }} />
                <span style={{ color: tokens.success }}>{activeSessions.length} sessions active</span>
              </div>
            </div>

            {/* Metrics Sparkline Blocks Grid */}
            <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fit, minmax(180px, 1fr))', gap:'16px', marginBottom:'32px' }}>
              {[
                { label:'Active sessions', value: activeSessions.length, accent:tokens.success, icon:Activity, max: 5 },
                { label:'Total sessions',  value: sessions.length,       accent:tokens.accent, icon:Layers, max: 20 },
                { label:'Submissions',     value: totalSubs,              accent:tokens.warning, icon:FileCheck, max: 100 },
                { label:'Assigned labs',   value: assignedLabsCount,      accent:tokens.info, icon:BookOpen, max: 10 },
              ].map(s => {
                const IconComp = s.icon;
                return (
                  <div key={s.label} style={{ padding:'20px', border:`1px solid ${tokens.border}`, borderRadius:'14px', background:tokens.bgCard }}>
                    <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:'14px' }}>
                      <span style={{ fontSize:'11px', fontFamily:"'Space Mono', monospace", color:tokens.textMuted, textTransform:'uppercase', letterSpacing:'0.06em' }}>{s.label}</span>
                      <IconComp size={15} style={{ color:s.accent, flexShrink:0 }} />
                    </div>
                    <div style={{ fontFamily:"'Syne', sans-serif", fontSize:'32px', fontWeight:800, color:s.accent, letterSpacing:'-0.02em', marginBottom: '12px' }}>{s.value}</div>
                    <div style={{ width: '100%', height: 4, background: tokens.bgSurfaceHover, borderRadius: 2, overflow: 'hidden' }}>
                      <div style={{ width: `${getProgressPercentage(s.value, s.max)}%`, height: '100%', background: s.accent, borderRadius: 2 }} />
                    </div>
                  </div>
                );
              })}
            </div>

            {/* OVERVIEW TAB */}
            {tab === 'overview' && (
              <div style={{ animation:'fadeUp 0.4s cubic-bezier(0.16,1,0.3,1) forwards', display: 'flex', flexDirection: 'column', gap: '32px' }}>
                
                {/* Active Live Broadcast Monitoring Section */}
                <div style={{ background: tokens.bgCard, border: `1px solid ${tokens.border}`, borderRadius: 16, padding: 24 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
                    <div style={{ display:'flex', alignItems:'center', gap:10 }}>
                      <span style={{ width:8, height:8, borderRadius:'50%', background:tokens.success, boxShadow:`0 0 12px ${tokens.success}`, animation:'pulse 2s ease-in-out infinite' }} />
                      <span style={{ fontFamily:"'Space Mono',monospace", fontSize:13, letterSpacing:'0.1em', color:tokens.textPrimary, textTransform:'uppercase', fontWeight:700 }}>Live sessions</span>
                      <span style={{ background: tokens.successBg, color: tokens.success, fontSize: 11, padding: '2px 8px', borderRadius: 100, fontWeight: 'bold', border:`1px solid ${tokens.successBorder}` }}>
                        {activeSessions.length} active
                      </span>
                    </div>
                    <button onClick={() => handleTabChange('sessions')} style={{ background: 'none', border: 'none', color: tokens.accent, fontSize: 13, cursor: 'pointer', fontWeight: 500 }}>View all</button>
                  </div>

                  {activeSessions.length > 0 ? (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                      {activeSessions.map((s) => (
                        <div key={s.id} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '14px 18px', background: tokens.bgSurface, border: `1px solid ${tokens.border}`, borderRadius: 12 }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
                            <div style={{ width: 36, height: 36, borderRadius: '50%', background: s.status === 'GRACE' ? tokens.warningBg : tokens.accentMuted, border: s.status === 'GRACE' ? `1px solid ${tokens.warningBorder}` : `1px solid ${tokens.accentBorder}`, display: 'flex', alignItems: 'center', justifyContent: 'center', color: s.status === 'GRACE' ? tokens.warning : tokens.accent, fontSize: 12, fontFamily: "'Space Mono', monospace", fontWeight: 'bold' }}>
                              {s.code ? s.code.slice(0, 2).toUpperCase() : 'LB'}
                            </div>
                            <div>
                              <div style={{ fontWeight: 600, fontSize: 14, color: tokens.textPrimary }}>{s.experiment?.title || 'Waiting for table scan event...'}</div>
                              <div style={{ fontSize: 12, color: tokens.textMuted, marginTop: 2 }}>
                                Target Bound: {fmtTime(s.endsAt)} · {submissionCounts[s.id] ?? s._count?.submissions ?? s.submissions?.length ?? 0} dynamic entries
                              </div>
                            </div>
                          </div>
                          <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
                            <StatusBadge status={s.status} />
                            <button onClick={() => navigate('session-monitor', { sessionId: s.id })} style={{ background: tokens.bgSurfaceHover, border: `1px solid ${tokens.border}`, padding: '6px 14px', borderRadius: 8, color: tokens.textPrimary, fontSize: 12, cursor: 'pointer' }}>Monitor</button>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div style={{ padding:'32px', borderRadius:'12px', background:tokens.bgSurface, textAlign:'center', color:tokens.textMuted, fontSize:13, border: `1px dashed ${tokens.border}` }}>
                      No telemetry instances currently open. Click "Create Session" to dispatch validation listeners.
                    </div>
                  )}
                </div>

                {/* Submissions Mini Real-Time Stream */}
                <div style={{ background: tokens.bgCard, border: `1px solid ${tokens.border}`, borderRadius: 16, padding: 24 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
                    <span style={{ fontFamily:"'Space Mono',monospace", fontSize:13, letterSpacing:'0.1em', color:tokens.textPrimary, textTransform:'uppercase', fontWeight:700 }}>Recent submissions log</span>
                    <button onClick={() => handleTabChange('submissions')} style={{ background: 'none', border: 'none', color: tokens.accent, fontSize: 13, cursor: 'pointer', fontWeight: 500 }}>Review all</button>
                  </div>

                  {recentSubmissions.length > 0 ? (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                      {recentSubmissions.slice(0, 3).map((sub, idx) => (
                        <div key={sub.id || idx} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '14px 18px', background: tokens.bgSurface, border: `1px solid ${tokens.border}`, borderRadius: 12 }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
                            <div style={{ width: 36, height: 36, borderRadius: '50%', background: tokens.bgSurfaceHover, display: 'flex', alignItems: 'center', justifyContent: 'center', color: tokens.textSecondary, fontSize: 11, fontWeight: 'bold', fontFamily: "'Space Mono', monospace", border:`1px solid ${tokens.border}` }}>
                              {sub.studentName ? sub.studentName.split(' ').map(n => n[0]).join('') : 'ST'}
                            </div>
                            <div>
                              <div style={{ fontWeight: 600, fontSize: 14, color: tokens.textPrimary }}>
                                {sub.studentName || 'Student Identity'} · <span style={{ color: tokens.textMuted, fontSize: 13, fontWeight: 400 }}>Roll {sub.rollNo || sub.studentRoll}</span>
                              </div>
                              <div style={{ fontSize: 12, color: tokens.textMuted, marginTop: 2 }}>{sub.labTitle || 'Unassigned Session Link'} · {fmtTime(sub.createdAt || sub.time)}</div>
                            </div>
                          </div>
                          <span style={{ color: sub.statusColor || tokens.warning, fontSize: 12, fontWeight: 600, padding: '4px 12px', borderRadius: 8, background: `${sub.statusColor || tokens.warning}14`, border: `1px solid ${sub.statusColor || tokens.warning}44` }}>
                            {sub.status || 'Pending Review'}
                          </span>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div style={{ padding:'32px', borderRadius:'12px', background:tokens.bgSurface, textAlign:'center', color:tokens.textMuted, fontSize:13 }}>
                      Awaiting remote cluster evaluation pipeline requests.
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* SESSIONS VIEW TAB */}
            {tab === 'sessions' && (
              <div style={{ animation:'fadeUp 0.4s cubic-bezier(0.16,1,0.3,1) forwards' }}>
                {loadingSessions ? (
                  <div style={{ display:'flex', justifyContent:'center', padding:80 }}><div style={{ width:28, height:28, border:`2px solid ${tokens.accentMuted}`, borderTopColor:tokens.accent, borderRadius:'50%', animation:'spin 0.8s linear infinite' }} /></div>
                ) : sessions.length === 0 ? (
                  <div style={{ textAlign:'center', padding:'64px 24px', border:`1px solid ${tokens.border}`, borderRadius:16, background:tokens.bgCard }}>
                    <div style={{ fontSize:36, marginBottom:16, color:tokens.textDimmer }}>⬡</div>
                    <p style={{ color:tokens.textMuted, marginBottom:24, fontSize:15 }}>No historical sessions registered on cluster instance.</p>
                    <button onClick={() => handleTabChange('new-session')} style={{ padding:'12px 26px', background:tokens.accentGrad, border:'none', borderRadius:8, color:tokens.textInverse, fontFamily:"'Space Mono',monospace", fontWeight:700, fontSize:12, cursor:'pointer' }}>CREATE FIRST SESSION</button>
                  </div>
                ) : (
                  <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fill, minmax(300px, 1fr))', gap:'16px' }}>
                    {sessions.map((s) => (
                      <div key={s.id} className="session-card" style={{ borderRadius:'16px', display:'flex', flexDirection:'column', overflow:'hidden' }}>
                        <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', padding:'16px 18px 12px', borderBottom:`1px solid ${tokens.borderMuted}` }}>
                          <span style={{ fontFamily:"'Space Mono',monospace", fontSize:'12px', fontWeight:700, color:tokens.accent, background:tokens.accentMuted, border:`1px solid ${tokens.accentBorder}`, padding:'4px 10px', borderRadius:'6px', letterSpacing:'0.05em' }}>{s.code}</span>
                          <StatusBadge status={s.status} />
                        </div>
                        <div style={{ padding:'18px', flexGrow:1, display:'flex', flexDirection:'column', gap:'14px' }}>
                          <div>
                            <div style={{ fontSize:'10px', fontFamily:"'Space Mono',monospace", color:tokens.textDimmer, textTransform:'uppercase', letterSpacing:'0.08em', marginBottom:'6px' }}>Assigned Experiment</div>
                            <div style={{ fontSize:'15px', fontWeight:700, color:tokens.textPrimary, lineHeight:'1.4', overflow:'hidden', textOverflow:'ellipsis', display:'-webkit-box', WebkitLineClamp:2, WebkitBoxOrient:'vertical' }}>
                              {s.experiment?.title || <span style={{ color:tokens.textDimmer, fontStyle:'italic', fontWeight:400 }}>Unassigned (Awaiting Scan)</span>}
                            </div>
                          </div>
                          <div style={{ display:'flex', gap:'14px', background:tokens.bgSurfaceHover, border:`1px solid ${tokens.border}`, borderRadius:'10px', padding:'10px 14px' }}>
                            <div style={{ display:'flex', alignItems:'center', gap:8, flex:1 }}>
                              <Calendar size={13} style={{ color:tokens.textMuted }} />
                              <div>
                                <div style={{ fontSize:'9px', fontFamily:"'Space Mono',monospace", color:tokens.textMuted, textTransform:'uppercase' }}>Starts</div>
                                <div style={{ fontSize:'12px', fontWeight:500, color:tokens.textSecondary }}>{fmtTime(s.startsAt)}</div>
                              </div>
                            </div>
                            <div style={{ width:'1px', background:tokens.border }} />
                            <div style={{ display:'flex', alignItems:'center', gap:8, flex:1 }}>
                              <Clock size={13} style={{ color:tokens.textMuted }} />
                              <div>
                                <div style={{ fontSize:'9px', fontFamily:"'Space Mono',monospace", color:tokens.textMuted, textTransform:'uppercase' }}>Ends</div>
                                <div style={{ fontSize:'12px', fontWeight:500, color:tokens.textSecondary }}>{fmtTime(s.endsAt)}</div>
                              </div>
                            </div>
                          </div>
                          <div style={{ display:'flex', gap:'6px' }}>
                            <button className="card-btn" onClick={() => navigate('session-monitor', { sessionId:s.id })} style={cardBtnStyle(tokens.accent)}>Monitor</button>
                            <button className="card-btn" onClick={() => navigate('submissions', { sessionId:s.id })} style={cardBtnStyle(tokens.textSecondary)}>Review</button>
                          </div>
                          {s.status==='DRAFT' && <button className="card-btn" onClick={() => handleActivate(s.id)} style={{ ...cardBtnStyle(tokens.success), padding:'10px' }}>Activate</button>}
                          {(s.status==='ACTIVE'||s.status==='GRACE') && <button className="card-btn" onClick={() => handleClose(s.id)} style={{ ...cardBtnStyle(tokens.warning), padding:'10px' }}>Close Session</button>}
                          {s.status==='DRAFT' && <button className="card-btn" onClick={() => handleDeleteSession(s.id)} style={{ ...cardBtnStyle(tokens.danger), border:`1px dashed ${tokens.dangerBorder}`, padding:'10px' }}>Delete</button>}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* NEW SESSION CONFIGURATION TAB */}
            {tab === 'new-session' && (
              <div style={{ animation:'fadeUp 0.4s cubic-bezier(0.16,1,0.3,1) forwards', maxWidth:560 }}>
                <div style={{ marginBottom:28 }}>
                  <div style={{ fontFamily:"'Space Mono',monospace", fontSize:11, letterSpacing:'0.2em', color:tokens.accent, textTransform:'uppercase', marginBottom:6, fontWeight:700 }}>Initialization Stream</div>
                  <h1 style={{ fontFamily:"'Syne',sans-serif", fontWeight:800, fontSize:'clamp(22px,4vw,30px)', letterSpacing:'-0.01em', color:tokens.textPrimary }}>Create New Session</h1>
                  <p style={{ fontSize:14, color:tokens.textMuted, marginTop:6 }}>A unique system token and QR map configuration layer will build instantly upon verification.</p>
                </div>
                <CreateSessionInline onCreated={(s) => { setSessions(prev => [s, ...prev]); handleTabChange('sessions'); }} />
              </div>
            )}

            {/* ALL SUBMISSIONS COMPREHENSIVE RECORDS TAB */}
            {tab === 'submissions' && (
              <div style={{ animation:'fadeUp 0.4s cubic-bezier(0.16,1,0.3,1) forwards' }}>
                <div style={{ marginBottom:24 }}>
                  <h1 style={{ fontFamily:"'Syne',sans-serif", fontWeight:800, fontSize:24, color:tokens.textPrimary }}>All Inbound Submissions</h1>
                  <p style={{ fontSize:14, color:tokens.textMuted, marginTop:4 }}>Comprehensive cluster ingestion logs.</p>
                </div>

                {recentSubmissions.length > 0 ? (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                    {recentSubmissions.map((sub, idx) => (
                      <div key={sub.id || idx} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '16px 20px', background: tokens.bgCard, border: `1px solid ${tokens.border}`, borderRadius: 12 }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
                          <div style={{ background: tokens.accentMuted, color: tokens.accent, fontFamily: "'Space Mono', monospace", fontSize: 11, padding: '6px 12px', borderRadius: 6, border: `1px solid ${tokens.accentBorder}` }}>
                            {sub.sessionCode}
                          </div>
                          <div>
                            <div style={{ fontWeight: 600, fontSize: 15, color: tokens.textPrimary }}>
                              {sub.studentName} <span style={{ color: tokens.textMuted, fontSize: 13, fontWeight: 400 }}>({sub.rollNo || sub.studentRoll})</span>
                            </div>
                            <div style={{ fontSize: 12, color: tokens.textMuted, marginTop: 4 }}>
                              {sub.labTitle || 'Unassigned Session Link'} • Received at {new Date(sub.createdAt || sub.time).toLocaleTimeString()}
                            </div>
                          </div>
                        </div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
                          <span style={{ color: sub.statusColor || tokens.warning, fontSize: 12, fontWeight: 700, fontFamily: "'Space Mono', monospace" }}>
                            {sub.status?.toUpperCase()}
                          </span>
                          <button onClick={() => navigate('submissions', { sessionId: sub.sessionId })} style={{ background: 'none', border: 'none', color: tokens.accent, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 4, fontSize: 13 }}>
                            Inspect <ArrowRight size={14} />
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div style={{ padding: 48, textTransform: 'uppercase', background: tokens.bgCard, border: `1px dashed ${tokens.border}`, borderRadius: 12, textAlign: 'center', color: tokens.textMuted, fontFamily: "'Space Mono', monospace", fontSize: 12, letterSpacing: '0.05em' }}>
                    Zero compiler pipeline pushes captured globally.
                  </div>
                )}
              </div>
            )}

            {/* MY LABS SCHEDULER VIEW TAB */}
            {tab === 'my-labs' && (
              <div style={{ animation:'fadeUp 0.4s cubic-bezier(0.16,1,0.3,1) forwards' }}>
                <div style={{ marginBottom:24, display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap:'wrap', gap:12 }}>
                  <div>
                    <h1 style={{ fontFamily:"'Syne',sans-serif", fontWeight:800, fontSize:24, color:tokens.textPrimary }}>Assigned Lab Registries</h1>
                    <p style={{ fontSize:14, color:tokens.textMuted, marginTop:4 }}>Course structural bounds designated to your faculty ID.</p>
                  </div>
                  <div style={{ display:'flex', alignItems:'center', gap:10 }}>
                    <div style={{ background: tokens.infoBg, color: tokens.info, border: `1px solid ${tokens.infoBorder}`, padding: '6px 16px', borderRadius: 8, fontFamily: "'Space Mono', monospace", fontSize: 13, fontWeight: 'bold' }}>
                      {assignedLabsCount} ALLOCATED
                    </div>
                    <button onClick={() => navigate('faculty-lab-assignments')} style={{ padding:'8px 16px', background:tokens.accentGrad, border:'none', borderRadius:8, color:tokens.textInverse, fontFamily:"'Space Mono',monospace", fontWeight:700, fontSize:11, letterSpacing:'0.05em', cursor:'pointer' }}>
                      MANAGE LABS
                    </button>
                  </div>
                </div>

                {loadingLabs ? (
                  <div style={{ display:'flex', justifyContent:'center', padding:80 }}><div style={{ width:28, height:28, border:`2px solid ${tokens.accentMuted}`, borderTopColor:tokens.accent, borderRadius:'50%', animation:'spin 0.8s linear infinite' }} /></div>
                ) : myLabs.length > 0 ? (
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: 16 }}>
                    {myLabs.map((assignment) => {
                      const slotCount = assignment.experiments?.length || 0;
                      const totalSlots = assignment.subject?.totalSlots || 0;
                      const recordCount = assignment._count?.labRecords || 0;
                      return (
                        <div key={assignment.id} className="session-card" onClick={() => navigate('faculty-lab-assignments')} style={{ padding: 20, borderRadius: 16, cursor:'pointer' }}>
                          <div style={{ display: 'flex', alignItems: 'center', justifyContent:'space-between', gap: 10, marginBottom: 12 }}>
                            <div style={{ display:'flex', alignItems:'center', gap:10 }}>
                              <ShieldCheck size={18} style={{ color: tokens.info }} />
                              <span style={{ fontFamily: "'Space Mono', monospace", fontSize: 12, color: tokens.textMuted }}>
                                {assignment.subject?.code || `CSE-LB0${assignment.id?.slice(-2)}`}
                              </span>
                            </div>
                            <span style={{ fontSize:11, fontFamily:"'Space Mono',monospace", color:tokens.accent, background:tokens.accentMuted, border:`1px solid ${tokens.accentBorder}`, padding:'3px 8px', borderRadius:6 }}>
                              {assignment.section?.name || 'Section'}
                            </span>
                          </div>
                          <div style={{ fontWeight: 700, fontSize: 16, color: tokens.textPrimary, marginBottom: 6 }}>
                            {assignment.subject?.name || 'Untitled Subject'}
                          </div>
                          <div style={{ fontSize: 12, color: tokens.accent, fontFamily: "'Space Mono', monospace", marginBottom: 12, fontWeight: 500 }}>
                            {assignment.section?.department}{assignment.section?.semester ? ` · Sem ${assignment.section.semester}` : ''}
                          </div>
                          <div style={{ display:'flex', gap:'14px', background:tokens.bgSurfaceHover, border:`1px solid ${tokens.border}`, borderRadius:'10px', padding:'10px 14px' }}>
                            <div style={{ flex:1 }}>
                              <div style={{ fontSize:'9px', fontFamily:"'Space Mono',monospace", color:tokens.textMuted, textTransform:'uppercase' }}>Slots configured</div>
                              <div style={{ fontSize:'14px', fontWeight:700, color:tokens.textSecondary, marginTop:2 }}>{slotCount} / {totalSlots || '—'}</div>
                            </div>
                            <div style={{ width:'1px', background:tokens.border }} />
                            <div style={{ flex:1 }}>
                              <div style={{ fontSize:'9px', fontFamily:"'Space Mono',monospace", color:tokens.textMuted, textTransform:'uppercase' }}>Lab records</div>
                              <div style={{ fontSize:'14px', fontWeight:700, color:tokens.textSecondary, marginTop:2 }}>{recordCount}</div>
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                ) : (
                  <div style={{ padding: 48, background: tokens.bgCard, border: `1px dashed ${tokens.border}`, borderRadius: 12, textAlign: 'center', color: tokens.textMuted, fontSize: 14 }}>
                    No course assignments synchronized. Contact department administrators to register your laboratory courses.
                  </div>
                )}
              </div>
            )}
          </main>
        </div>

        {/* FLOATING ACTION BUTTON */}
        <button onClick={() => handleTabChange('new-session')}
          style={{ position:'fixed', bottom:'24px', right:'24px', width:'52px', height:'52px', borderRadius:'50%', background:tokens.accentGrad, border:'none', color:tokens.textInverse, display:'flex', alignItems:'center', justifyContent:'center', cursor:'pointer', boxShadow:tokens.shadow, transition:'all 0.2s ease', zIndex:100 }}
          onMouseEnter={e => { e.currentTarget.style.transform='scale(1.06) rotate(90deg)'; }}
          onMouseLeave={e => { e.currentTarget.style.transform='scale(1) rotate(0deg)'; }}>
          <PlusCircle size={22} />
        </button>
      </div>
    </>
  );
}