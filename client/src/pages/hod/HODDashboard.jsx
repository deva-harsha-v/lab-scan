import React, { useState, useEffect } from 'react';
import LabScanLogo from '../../components/LabScanLogo';
import { useAuth } from '../../context/AuthContext';
import { useRouter } from '../../App';
import { hodApi } from '../../api/hod.api';
import { useTheme } from '../../context/ThemeContext';
import ThemeToggle from '../../components/ThemeToggle';
import {
  LayoutDashboard, Layers, BookOpen, UserCheck, Users, GraduationCap,
  LogOut, ExternalLink, Sliders, FileSpreadsheet, PlusCircle,
  Activity, GitCommit, BarChart3, ShieldCheck,
} from 'lucide-react';

import { font } from './ui/hodTokens';
import { Btn, Card } from './ui/HodUI';
import MetricCard from './ui/MetricCard';
import SectionsTab from './tabs/SectionsTab';
import SubjectsTab from './tabs/SubjectsTab';
import AssignmentsTab from './tabs/AssignmentsTab';
import StudentsTab from './tabs/StudentsTab';

const TABS = [
  { id: 'overview',     label: 'Overview',     icon: LayoutDashboard },
  { id: 'sections',     label: 'Sections',     icon: Layers },
  { id: 'subjects',     label: 'Subjects',     icon: BookOpen },
  { id: 'assignments',  label: 'Assignments',  icon: UserCheck },
  { id: 'students',     label: 'Students',     icon: GraduationCap },
  { id: 'faculty-mode', label: 'Faculty Mode', icon: Users },
];

export default function HODDashboard() {
  const { logout } = useAuth();
  const { tokens } = useTheme();
  const { navigate } = useRouter();
  const [tab, setTab] = useState('overview');
  const [sections, setSections] = useState([]);
  const [subjects, setSubjects] = useState([]);
  const [assignments, setAssignments] = useState([]);
  const [faculty, setFaculty] = useState([]);
  const [students, setStudents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [systemSync, setSystemSync] = useState('');

  const isLight = tokens.colorScheme === 'light';

  const load = async () => {
    try {
      const [sec, sub, asgn, fac, stud] = await Promise.all([
        hodApi.getSections(),
        hodApi.getSubjects(),
        hodApi.getAssignments(),
        hodApi.getFaculty(),
        hodApi.getStudents(),
      ]);
      setSections(sec.data);
      setSubjects(sub.data);
      setAssignments(asgn.data);
      setFaculty(fac.data);
      setStudents(stud.data);
      setSystemSync(new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }));
    } catch (e) { console.error(e); }
    finally { setLoading(false); }
  };

  useEffect(() => { load(); }, []);

  if (loading) {
    return (
      <div style={{ minHeight: '100vh', background: tokens.bgPage, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <div style={{ width: 32, height: 32, border: `2px solid ${tokens.accentMuted}`, borderTopColor: tokens.accent, borderRadius: '50%', animation: 'spin 0.8s linear infinite' }} />
      </div>
    );
  }

  const sectionProgress  = sections.length > 0 ? 100 : 0;
  const subjectProgress  = subjects.length > 0 ? 100 : 0;
  const facultyProgress  = assignments.length > 0 ? 100 : 0;
  const studentProgress  = students.filter(s => s.sectionId).length > 0 ? 100 : 0;

  const activeOverlayTracks = sections.slice(0, 4).map(sec => {
    const matchingCount = students.filter(st => st.sectionId === sec.id).length;
    const maxCount = Math.max(...sections.map(s => students.filter(st => st.sectionId === s.id).length), 1);
    return {
      cluster: `${sec.name}`,
      count: matchingCount,
      width: `${Math.max((matchingCount / maxCount) * 100, 10)}%`,
      color: sec.name.includes('A') ? tokens.accent : sec.name.includes('B') ? '#2563eb' : tokens.info
    };
  });

  return (
    <>
      <link href="https://fonts.googleapis.com/css2?family=Space+Mono:wght@400;700&family=DM+Sans:wght@300;400;500;700&family=Syne:wght@700;800&display=swap" rel="stylesheet" />
      <style>{`
        *,*::before,*::after{box-sizing:border-box;margin:0;padding:0;}
        @keyframes fadeUp{from{opacity:0;transform:translateY(12px);}to{opacity:1;transform:translateY(0);}}
        @keyframes gridPulse{0%,100%{opacity:0.015;}50%{opacity:0.035;}}
        @keyframes spin{to{transform:rotate(360deg);}}
        @keyframes pulseDot{0%,100%{opacity:1;transform:scale(1);}50%{opacity:0.4;transform:scale(0.92);}}
        .glass-card{position:relative;transition:all 0.3s cubic-bezier(0.16,1,0.3,1)!important;}
        .glass-card:hover{transform:translateY(-6px);box-shadow:${tokens.shadow};border-color:${tokens.accent}70!important;}
        .tab-btn{position:relative;transition:all 0.25s cubic-bezier(0.16,1,0.3,1);}
        .tab-btn-active{background:${tokens.accentMuted}!important;border:1px solid ${tokens.accentBorder}!important;}
        .session-card{transition:all 0.25s cubic-bezier(0.16,1,0.3,1);background:${tokens.bgCard}!important;border:1px solid ${tokens.border}!important;backdrop-filter:${tokens.backdropBlur};}
        .session-card:hover{transform:translateY(-4px);border-color:${tokens.accent}!important;box-shadow:${tokens.shadow};}
        .row-item{transition:all 0.2s ease;}
        .row-item:hover{background:${tokens.bgSurfaceHover}!important;border-color:${tokens.borderStrong}!important;}
        .interactive-btn{transition:all 0.2s cubic-bezier(0.16,1,0.3,1);}
        .interactive-btn:hover{filter:brightness(1.15);transform:translateY(-1px);}
        .interactive-btn-ghost{transition:all 0.2s ease;}
        .interactive-btn-ghost:hover{background:${tokens.bgSurfaceHover}!important;border-color:${tokens.borderStrong}!important;}
        .interactive-btn-danger{transition:all 0.2s ease;}
        .interactive-btn-danger:hover{background:${tokens.dangerBg}!important;border-color:${tokens.danger}!important;}
        .focusable-input:focus{border-color:${tokens.accent}!important;box-shadow:0 0 0 3px ${tokens.accentMuted};}
        ::-webkit-scrollbar{width:6px;height:6px;}::-webkit-scrollbar-track{background:${tokens.bgPage};}::-webkit-scrollbar-thumb{background:${tokens.borderStrong};border-radius:3px;}
      `}</style>

      <div style={{ minHeight: '100vh', background: tokens.bgPage, color: tokens.textPrimary, fontFamily: font.sans, position: 'relative', overflowX: 'hidden' }}>

        {!isLight && (
          <>
            <div style={{ position:'fixed', inset:0, pointerEvents:'none', backgroundImage:`linear-gradient(${tokens.border} 1px,transparent 1px),linear-gradient(90deg,${tokens.border} 1px,transparent 1px)`, backgroundSize:'60px 60px', animation:'gridPulse 6s ease-in-out infinite', zIndex:0 }} />
            <div style={{ position:'fixed', inset:0, background:'radial-gradient(circle at top right,rgba(0,255,255,0.08),transparent 40%),radial-gradient(circle at 80% 80%,rgba(74,240,196,0.03),transparent 40%)', pointerEvents:'none', zIndex:0 }} />
          </>
        )}

        {/* Navbar */}
        <nav style={{ position:'sticky', top:0, zIndex:50, height:'clamp(56px, 12vw, 68px)', display:'flex', alignItems:'center', justifyContent:'space-between', padding:'0 clamp(12px, 3vw, 24px)', background:tokens.bgNav, backdropFilter:tokens.backdropBlur, borderBottom:`1px solid ${tokens.border}`, flexWrap: 'wrap' }}>
          <div style={{ display:'flex', alignItems:'center', gap:'clamp(8px, 2vw, 12px)' }}>
            <LabScanLogo size={30} gradientId="hodDashLogoGrad" />
            <span style={{ fontFamily:"'Syne',sans-serif", fontWeight:800, fontSize:'clamp(14px, 3vw, 18px)', color:tokens.textPrimary }}>LabScan</span>
            <span style={{ marginLeft:'clamp(4px, 1vw, 6px)', padding:'3px clamp(6px, 1.5vw, 10px)', borderRadius:6, background:tokens.warningBg, border:`1px solid ${tokens.warningBorder}`, fontFamily:font.mono, fontSize:'clamp(8px, 1.5vw, 10px)', fontWeight:700, color:tokens.warning }}>HOD PORTAL</span>
          </div>
          <div style={{ display:'flex', alignItems:'center', gap:'clamp(12px, 2vw, 24px)', flexWrap: 'wrap' }}>
            <div style={{ display:'flex', alignItems:'center', gap:8, background:tokens.bgSurface, padding:'6px clamp(10px, 2vw, 14px)', borderRadius:20, border:`1px solid ${tokens.border}` }}>
              <span style={{ width:6, height:6, borderRadius:'50%', background:tokens.success, display:'inline-block', animation:'pulseDot 2s infinite' }} />
              <span style={{ fontSize:'clamp(9px, 1.5vw, 11px)', fontFamily:font.mono, color:tokens.textSecondary }}>Online</span>
              <span style={{ fontSize:'clamp(9px, 1.5vw, 11px)', fontFamily:font.mono, color:tokens.textDimmer, marginLeft:4 }}>Sync: {systemSync}</span>
            </div>
            <ThemeToggle size="sm" />
            <button className="interactive-btn-ghost" style={{ padding:'clamp(6px, 1vw, 8px) clamp(10px, 2vw, 16px)', background:tokens.dangerBg, border:`1px solid ${tokens.dangerBorder}`, borderRadius:8, color:tokens.danger, fontFamily:font.mono, fontSize:'clamp(9px, 1.5vw, 11px)', fontWeight:600, cursor:'pointer', display:'flex', alignItems:'center', gap:6 }} onClick={() => { logout(); navigate('landing'); }}>
              <LogOut size={13}/> Sign Out
            </button>
          </div>
        </nav>

        <div style={{ padding:'clamp(16px,4vw,48px) clamp(16px,3vw,48px) 80px', maxWidth:1240, margin:'0 auto', position:'relative', zIndex:1 }}>

          {/* Hero */}
          <div style={{ padding:'clamp(20px, 4vw, 32px)', borderRadius:'24px', background:tokens.bgCard, border:`1px solid ${tokens.border}`, marginBottom:'clamp(16px, 4vw, 32px)', backdropFilter:tokens.backdropBlur, display:'grid', gridTemplateColumns:'repeat(auto-fit, minmax(280px, 1fr))', gap:'clamp(12px, 3vw, 24px)', alignItems:'center', boxShadow:tokens.shadow }}>
            <div>
              <div style={{ fontFamily:font.mono, fontSize:'clamp(9px, 1.5vw, 11px)', letterSpacing:'0.2em', color:tokens.accent, textTransform:'uppercase', marginBottom:6, fontWeight:700 }}>HOD Portal</div>
              <h1 style={{ fontFamily:"'Syne',sans-serif", fontWeight:800, fontSize:'clamp(20px, 5vw, 32px)', color:tokens.textPrimary, marginBottom:'8px' }}>Student Enrollment Center</h1>
              <p style={{ fontSize:'clamp(12px, 2vw, 14px)', color:tokens.textSecondary, lineHeight:'1.6' }}>Manage sections, subjects, faculty assignments, and student enrollment.</p>
            </div>
            <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fit, minmax(120px, 1fr))', gap:'clamp(8px, 1.5vw, 10px)', background:tokens.bgSurface, padding:'clamp(8px, 2vw, 12px)', borderRadius:18, border:`1px solid ${tokens.border}` }}>
              {[
                { label:'+ Section', tab:'sections', bg:tokens.accentMuted, border:tokens.accentBorder, color:tokens.accent },
                { label:'+ Subject', tab:'subjects', bg:tokens.infoBg, border:tokens.infoBorder, color:tokens.info },
                { label:'+ Faculty', tab:'assignments', bg:tokens.warningBg, border:tokens.warningBorder, color:tokens.warning },
                { label:'+ Student', tab:'students', bg:tokens.successBg, border:tokens.successBorder, color:tokens.success },
              ].map(q => (
                <button key={q.tab} onClick={() => setTab(q.tab)} className="interactive-btn"
                  style={{ padding:'12px 16px', background:q.bg, border:`1px solid ${q.border}`, borderRadius:10, color:q.color, fontSize:12, fontWeight:700, fontFamily:font.mono, cursor:'pointer', display:'flex', alignItems:'center', gap:6 }}>
                  <PlusCircle size={14}/> {q.label}
                </button>
              ))}
            </div>
          </div>

          {/* Tab Bar */}
          <div style={{ display:'flex', gap:'clamp(6px, 1.5vw, 8px)', background:tokens.bgSurfaceHover, padding:'clamp(4px, 1vw, 6px)', borderRadius:30, marginBottom:'clamp(16px, 4vw, 32px)', border:`1px solid ${tokens.border}`, overflowX:'auto', flexWrap: 'wrap' }}>
            {TABS.map(t => {
              const Icon = t.icon;
              const active = tab === t.id;
              return (
                <button key={t.id} className={`tab-btn ${active ? 'tab-btn-active' : ''}`} onClick={() => setTab(t.id)}
                  style={{ padding:'clamp(8px, 1.5vw, 10px) clamp(14px, 2vw, 22px)', background:'none', border:'1px solid transparent', borderRadius:24, color:active ? tokens.accent : tokens.textSecondary, fontFamily:font.mono, fontSize:'clamp(10px, 1.5vw, 12px)', fontWeight:700, cursor:'pointer', display:'inline-flex', alignItems:'center', gap:6, whiteSpace:'nowrap' }}>
                  <Icon size={14} /> {t.label}
                </button>
              );
            })}
          </div>

          {/* Tab Content */}
          {tab === 'overview' && (
            <div style={{ display:'flex', flexDirection:'column', gap:'clamp(16px, 4vw, 32px)', animation:'fadeUp 0.4s ease forwards' }}>
              <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fit,minmax(140px,1fr))', gap:'clamp(10px, 2vw, 16px)' }}>
                <MetricCard value={sections.length}    label="Sections"    accent={tokens.accent}   icon={Layers} />
                <MetricCard value={subjects.length}    label="Subjects"    accent={tokens.info}     icon={BookOpen} />
                <MetricCard value={assignments.length} label="Assignments" accent={tokens.warning}  icon={UserCheck} />
                <MetricCard value={faculty.length}     label="Faculty"     accent={tokens.accent}   icon={Users} />
                <MetricCard value={students.length}    label="Students"    accent={tokens.danger}   icon={GraduationCap} />
              </div>

              <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fit,minmax(300px,1fr))', gap:'clamp(12px, 3vw, 24px)' }}>
                <Card>
                  <div style={{ display:'flex', alignItems:'center', gap:8, marginBottom:20 }}>
                    <BarChart3 size={16} style={{ color:tokens.accent }} />
                    <div style={{ fontFamily:font.mono, fontSize:12, color:tokens.accent, fontWeight:700, textTransform:'uppercase' }}>Enrollment by Section</div>
                  </div>
                  <div style={{ display:'flex', flexDirection:'column', gap:16 }}>
                    {activeOverlayTracks.length === 0
                      ? <div style={{ color:tokens.textMuted, fontSize:13, textAlign:'center', padding:'20px 0' }}>No sections yet — create one to see data here.</div>
                      : activeOverlayTracks.map((chart, i) => (
                        <div key={i} style={{ display:'flex', flexDirection:'column', gap:6 }}>
                          <div style={{ display:'flex', justifyContent:'space-between', fontSize:12, fontFamily:font.mono }}>
                            <span style={{ color:tokens.textSecondary }}>{chart.cluster}</span>
                            <span style={{ fontWeight:700, color:chart.color }}>{chart.count} students</span>
                          </div>
                          <div style={{ height:8, background:tokens.bgSurfaceHover, borderRadius:4, overflow:'hidden', border:`1px solid ${tokens.border}` }}>
                            <div style={{ width:chart.width, height:'100%', background:chart.color, borderRadius:4 }} />
                          </div>
                        </div>
                      ))
                    }
                  </div>
                </Card>

                <Card>
                  <div style={{ display:'flex', alignItems:'center', gap:8, marginBottom:20 }}>
                    <Activity size={16} style={{ color:tokens.success }} />
                    <div style={{ fontFamily:font.mono, fontSize:12, color:tokens.success, fontWeight:700, textTransform:'uppercase' }}>Department Summary</div>
                  </div>
                  <div style={{ display:'flex', flexDirection:'column', gap:14 }}>
                    {[
                      { item:'Sections', total:sections.length, note:'Active sections' },
                      { item:'Experiment Slots', total:subjects.reduce((acc,s) => acc + parseInt(s.totalSlots || 0), 0), note:'Across all subjects' },
                      { item:'Faculty Assignments', total:assignments.length, note:'Active faculty mappings' },
                      { item:'Unassigned Students', total:students.filter(s => !s.sectionId).length, note:'Awaiting section assignment' },
                    ].map((act, i) => (
                      <div key={i} style={{ display:'flex', gap:14, borderLeft:`2px solid ${tokens.border}`, paddingLeft:14, position:'relative' }}>
                        <div style={{ position:'absolute', left:-5, top:4, width:8, height:8, borderRadius:'50%', background:act.total > 0 ? tokens.success : tokens.textDimmer }} />
                        <div>
                          <div style={{ fontSize:14, fontWeight:700, color:tokens.textPrimary }}>{act.item}: <span style={{ fontFamily:font.mono, color:tokens.accent }}>{act.total}</span></div>
                          <div style={{ fontSize:12, color:tokens.textMuted, marginTop:2 }}>{act.note}</div>
                        </div>
                      </div>
                    ))}
                  </div>
                </Card>
              </div>

              <Card>
                <div style={{ display:'flex', alignItems:'center', gap:8, marginBottom:24 }}>
                  <GitCommit size={16} style={{ color:tokens.warning }} />
                  <div style={{ fontFamily:font.mono, fontSize:12, color:tokens.warning, fontWeight:700, textTransform:'uppercase' }}>Setup Progress</div>
                </div>
                <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fit,minmax(180px,1fr))', gap:16 }}>
                  {[
                    { step:'1', name:'Sections',   state:sectionProgress,  desc:'Create at least one section' },
                    { step:'2', name:'Subjects',   state:subjectProgress,  desc:'Add lab subjects' },
                    { step:'3', name:'Faculty',    state:facultyProgress,  desc:'Assign faculty to sections' },
                    { step:'4', name:'Students',   state:studentProgress,  desc:'Enroll students into sections' },
                  ].map((flow, idx) => (
                    <div key={idx} style={{ padding:16, background:tokens.bgSurface, borderRadius:12, border:`1px solid ${flow.state===100 ? tokens.successBorder : tokens.border}` }}>
                      <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', marginBottom:8 }}>
                        <div style={{ width:24, height:24, borderRadius:'50%', background:flow.state===100 ? tokens.success : tokens.bgSurfaceHover, color:flow.state===100 ? tokens.textInverse : tokens.textPrimary, display:'flex', alignItems:'center', justifyContent:'center', fontSize:11, fontFamily:font.mono, fontWeight:700, border:`1px solid ${tokens.border}` }}>
                          {flow.state===100 ? '✓' : flow.step}
                        </div>
                        <span style={{ fontSize:10, fontFamily:font.mono, color:flow.state===100 ? tokens.success : tokens.warning, fontWeight:700, textTransform:'uppercase' }}>{flow.state===100 ? 'Done' : 'Pending'}</span>
                      </div>
                      <div style={{ fontSize:14, fontWeight:700, color:tokens.textPrimary }}>{flow.name}</div>
                      <div style={{ fontSize:11, color:tokens.textMuted, marginTop:4 }}>{flow.desc}</div>
                    </div>
                  ))}
                </div>
              </Card>
            </div>
          )}

          {tab === 'sections'    && <SectionsTab    sections={sections} onRefresh={load} />}
          {tab === 'subjects'    && <SubjectsTab    subjects={subjects} onRefresh={load} />}
          {tab === 'assignments' && <AssignmentsTab assignments={assignments} sections={sections} subjects={subjects} faculty={faculty} onRefresh={load} />}
          {tab === 'students'    && <StudentsTab    students={students} sections={sections} onRefresh={load} />}

          {tab === 'faculty-mode' && (
            <div style={{ animation:'fadeUp 0.4s ease forwards' }}>
              <div style={{ marginBottom:24 }}>
                <h2 style={{ fontFamily:font.mono, fontSize:16, fontWeight:700, color:tokens.textPrimary, margin:0 }}>Faculty Mode</h2>
                <p style={{ fontSize:13, color:tokens.textSecondary, marginTop:4 }}>Launch faculty interfaces directly from the HOD portal.</p>
              </div>
              <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fill,minmax(260px,1fr))', gap:16 }}>
                {[
                  { icon:LayoutDashboard, title:'Faculty Dashboard', desc:'Monitor active lab sessions in real time.', page:'faculty-dashboard', accent:tokens.accent },
                  { icon:BookOpen, title:'Lab Assignments', desc:'View and manage lab subject assignments.', page:'faculty-lab-assignments', accent:tokens.accent },
                  { icon:Sliders, title:'Experiment Manager', desc:'Edit experiments and manage ArUco markers.', page:'experiment-manager', accent:tokens.success },
                ].map(item => {
                  const Icon = item.icon;
                  return (
                    <div key={item.page} onClick={() => navigate(item.page)} className="session-card"
                      style={{ padding:'24px', borderRadius:14, cursor:'pointer', display:'flex', flexDirection:'column', justifyContent:'space-between', gap:16 }}>
                      <div>
                        <div style={{ color:item.accent, marginBottom:12 }}><Icon size={24} /></div>
                        <div style={{ fontSize:15, fontWeight:700, color:tokens.textPrimary, marginBottom:6 }}>{item.title}</div>
                        <div style={{ fontSize:13, color:tokens.textMuted, lineHeight:1.5 }}>{item.desc}</div>
                      </div>
                      <div style={{ fontSize:11, color:item.accent, fontFamily:font.mono, fontWeight:700, display:'flex', alignItems:'center', gap:4 }}>
                        OPEN <ExternalLink size={12} />
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>
      </div>
    </>
  );
}