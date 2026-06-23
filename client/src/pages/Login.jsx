import React, { useEffect, useRef, useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { useRouter } from '../App';
import { useTheme } from '../context/ThemeContext';
import ThemeToggle from '../components/ThemeToggle';

function ParticleField({ tokens }) {
  const canvasRef = useRef(null);
  const isDark = tokens.colorScheme === 'dark';

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    let raf;
    
    const resize = () => { 
      canvas.width = window.innerWidth; 
      canvas.height = window.innerHeight; 
    };
    resize();
    window.addEventListener('resize', resize);
    
    const COUNT = 50;
    const particles = Array.from({ length: COUNT }, () => ({
      x: Math.random() * window.innerWidth, 
      y: Math.random() * window.innerHeight,
      z: Math.random() * 2 + 0.2, 
      vx: (Math.random() - 0.5) * 0.2, 
      vy: (Math.random() - 0.5) * 0.2,
      size: Math.random() * 1.5 + 0.3,
    }));
    
    const draw = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      for (let i = 0; i < particles.length; i++) {
        for (let j = i + 1; j < particles.length; j++) {
          const dx = particles[i].x - particles[j].x, dy = particles[i].y - particles[j].y;
          const dist = Math.sqrt(dx*dx + dy*dy);
          if (dist < 120) {
            ctx.strokeStyle = isDark 
              ? `rgba(99,210,255,${(1 - dist/120) * 0.12})` 
              : `rgba(14,165,233,${(1 - dist/120) * 0.08})`; 
            ctx.lineWidth = 0.5;
            ctx.beginPath(); 
            ctx.moveTo(particles[i].x, particles[i].y); 
            ctx.lineTo(particles[j].x, particles[j].y); 
            ctx.stroke();
          }
        }
      }
      particles.forEach(p => {
        ctx.beginPath(); 
        ctx.arc(p.x, p.y, p.size * p.z, 0, Math.PI * 2);
        ctx.fillStyle = isDark 
          ? `rgba(99,210,255,${0.25 * p.z})` 
          : `rgba(14,165,233,${0.15 * p.z})`; 
        ctx.fill();
        p.x += p.vx; p.y += p.vy;
        if (p.x < 0) p.x = canvas.width; if (p.x > canvas.width) p.x = 0;
        if (p.y < 0) p.y = canvas.height; if (p.y > canvas.height) p.y = 0;
      });
      raf = requestAnimationFrame(draw);
    };
    draw();
    return () => { cancelAnimationFrame(raf); window.removeEventListener('resize', resize); };
  }, [isDark, tokens]);

  return <canvas ref={canvasRef} className="particle-canvas" style={{ position:'fixed', inset:0, pointerEvents:'none', zIndex:0, opacity: isDark ? 0.65 : 0.45 }} />;
}

export default function Login() {
  const { login, user, logout } = useAuth();
  const { navigate } = useRouter();
  const { tokens } = useTheme();

  const [facultyId, setFacultyId]     = useState('');
  const [facultyPass, setFacultyPass] = useState('');
  const [studentId, setStudentId]     = useState('');
  const [studentPass, setStudentPass] = useState('');
  const [facultyErr, setFacultyErr]   = useState('');
  const [studentErr, setStudentErr]   = useState('');
  const [facultyLoading, setFacultyLoading] = useState(false);
  const [studentLoading, setStudentLoading] = useState(false);

  const isDark = tokens.colorScheme === 'dark';

  if (user) {
    const dash = user.role === 'ADMIN' ? 'admin-dashboard' : user.role === 'HOD' ? 'hod-dashboard' : user.role === 'FACULTY' ? 'faculty-dashboard' : 'student-dashboard';
    return (
      <div style={{ minHeight:'100vh', background:tokens.bgPage, display:'flex', flexDirection:'column', alignItems:'center', justifyContent:'center', padding:'40px 24px', position:'relative', transition:'background 0.3s ease' }}>
        <ParticleField tokens={tokens} />
        <div style={{ position:'absolute', top:16, right:16, zIndex:10 }}><ThemeToggle /></div>
        <div style={{ position:'relative', zIndex:1, width:'100%', maxWidth:380, background:tokens.bgCard, border:`1px solid ${tokens.border}`, borderRadius:24, padding:'36px 28px', textAlign:'center', backdropFilter:'blur(20px)', boxShadow:tokens.shadowModal }}>
          <div style={{ fontFamily:"'Syne',sans-serif", fontSize:22, fontWeight:800, marginBottom:12, color:tokens.textPrimary }}>Active Session</div>
          <div style={{ fontSize:14, color:tokens.textSecondary, lineHeight:1.6, marginBottom:24 }}>
            Logged in as <strong style={{ color:tokens.textPrimary }}>{user.name}</strong><br />
            <span style={{ color:tokens.accent, fontFamily:"'Space Mono', monospace", fontSize:12 }}>[{user.role}]</span>
          </div>
          <button onClick={() => navigate(dash)} style={{ width:'100%', padding:'14px', background:tokens.accentGrad, border:'none', borderRadius:12, color: tokens.textInverse, fontFamily:"'Space Mono', monospace", fontSize:13, fontWeight:700, letterSpacing:'0.08em', cursor:'pointer', marginBottom:12 }}>
            ENTER DASHBOARD →
          </button>
          <button onClick={logout} style={{ background:'transparent', border:'none', color:tokens.danger, fontFamily:"'Space Mono', monospace", fontSize:11, cursor:'pointer', letterSpacing:'0.05em', textTransform:'uppercase' }}>
            Sign out &amp; Switch Account
          </button>
        </div>
      </div>
    );
  }

  const handleFaculty = async (e) => {
    e.preventDefault(); setFacultyErr(''); setFacultyLoading(true);
    try {
      const u = await login(facultyId, facultyPass, 'FACULTY');
      if (u.role === 'ADMIN') navigate('admin-dashboard');
      else if (u.role === 'HOD') navigate('hod-dashboard');
      else navigate('faculty-dashboard');
    } catch (err) { setFacultyErr(err.response?.data?.error || 'Authorization failed.'); }
    finally { setFacultyLoading(false); }
  };

  const handleStudent = async (e) => {
    e.preventDefault(); setStudentErr(''); setStudentLoading(true);
    try { await login(studentId, studentPass, 'STUDENT'); navigate('student-dashboard'); }
    catch (err) { setStudentErr(err.response?.data?.error || 'Authentication rejected.'); }
    finally { setStudentLoading(false); }
  };

  const cardStyle = {
    flex:1, minWidth:300, maxWidth:380,
    background: tokens.bgCard,
    border:`1px solid ${tokens.border}`,
    backdropFilter:'blur(16px)',
    borderRadius:24, overflow:'hidden',
    boxShadow: tokens.shadowModal,
    transition:'transform 0.3s ease, border-color 0.3s ease, background 0.3s ease',
  };

  const inputStyle = {
    width:'100%', padding:'13px 16px',
    background: isDark ? 'rgba(0,0,0,0.25)' : tokens.bgSurfaceHover,
    border:`1px solid ${tokens.borderInput}`,
    borderRadius:12, color:tokens.textPrimary, fontSize:14,
    outline:'none', transition:'all 0.25s ease',
    colorScheme: tokens.colorScheme,
  };

  const labelStyle = {
    fontFamily:"'Space Mono', monospace", fontSize:11, fontWeight:700,
    color:tokens.textMuted, letterSpacing:'0.04em', textTransform:'uppercase',
    display:'block', marginBottom:8,
  };

  return (
    <div style={{ minHeight:'100vh', background:tokens.bgPage, color:tokens.textPrimary, display:'flex', flexDirection:'column', alignItems:'center', justifyContent:'center', padding:'40px 24px', fontFamily:"'DM Sans', sans-serif", position:'relative', overflow:'hidden', transition:'background 0.3s ease, color 0.3s ease' }}>
      <ParticleField tokens={tokens} />
      
      {/* Subtle grid */}
      <div style={{ position:'fixed', inset:0, zIndex:0, pointerEvents:'none',
        backgroundImage:`linear-gradient(${tokens.borderMuted} 1px,transparent 1px),linear-gradient(90deg,${tokens.borderMuted} 1px,transparent 1px)`,
        backgroundSize:'60px 60px', opacity: isDark ? 1 : 0.4 }} />

      {/* Theme toggle top-right */}
      <div style={{ position:'fixed', top:16, right:16, zIndex:10 }}><ThemeToggle /></div>

      {/* Brand header */}
      <div style={{ textAlign:'center', marginBottom:40, zIndex:1, position:'relative' }}>
        <div onClick={() => navigate('landing')} style={{ display:'inline-flex', justifyContent:'center', cursor:'pointer', marginBottom:16 }}>
          <svg width="52" height="52" viewBox="0 0 100 100" fill="none" xmlns="http://www.w3.org/2000/svg"
            style={{ filter: isDark ? `drop-shadow(0 0 14px ${tokens.accent}70)` : 'none', transition:'transform 0.3s ease' }}
            onMouseEnter={e => e.currentTarget.style.transform='scale(1.05) rotate(6deg)'}
            onMouseLeave={e => e.currentTarget.style.transform='scale(1) rotate(0deg)'}>
            <path d="M50 5 L89 27.5 L89 72.5 L50 95 L11 72.5 L11 27.5 Z" stroke={tokens.accentBorder} strokeWidth="1" strokeDasharray="3 3" />
            <circle cx="50" cy="5" r="2.5" fill="#1e64ff" /><circle cx="89" cy="27.5" r="2.5" fill={tokens.accent} />
            <circle cx="89" cy="72.5" r="2.5" fill="#1e64ff" /><circle cx="50" cy="95" r="2.5" fill={tokens.accent} />
            <circle cx="11" cy="72.5" r="2.5" fill="#1e64ff" /><circle cx="11" cy="27.5" r="2.5" fill={tokens.accent} />
            <polygon points="50,15 80,32.5 80,67.5 50,85 20,67.5 20,32.5" stroke="url(#loginLogoGradient)" strokeWidth="4" strokeLinejoin="round" />
            <ellipse cx="50" cy="50" rx="10" ry="23" stroke={tokens.accent} strokeWidth="1.5" transform="rotate(30 50 50)" />
            <ellipse cx="50" cy="50" rx="10" ry="23" stroke={tokens.accent} strokeWidth="1.5" transform="rotate(-30 50 50)" />
            <circle cx="50" cy="50" r="4" fill="#1e64ff" />
            <defs><linearGradient id="loginLogoGradient" x1="0%" y1="0%" x2="100%" y2="100%"><stop offset="0%" stopColor={tokens.accent} /><stop offset="100%" stopColor="#1e64ff" /></linearGradient></defs>
          </svg>
        </div>
        <h1 style={{ fontFamily:"'Syne', sans-serif", fontWeight:800, fontSize:36, letterSpacing:'-0.02em', color:tokens.textPrimary, textShadow: isDark ? `0 0 12px ${tokens.accent}40` : 'none' }}>LabScan</h1>
        <p style={{ fontFamily:"'Space Mono', monospace", fontSize:11, color:tokens.textMuted, letterSpacing:'0.08em', marginTop:8 }}>Laboratory Attendance &amp; Evaluation System</p>
      </div>

      {/* Dual panels */}
      <div style={{ display:'flex', gap:32, flexWrap:'wrap', justifyContent:'center', zIndex:1, position:'relative', width:'100%', maxWidth:800 }}>
        {/* Faculty */}
        <div style={cardStyle}
          onMouseEnter={e => { e.currentTarget.style.transform='translateY(-5px)'; e.currentTarget.style.borderColor=tokens.accentBorder; }}
          onMouseLeave={e => { e.currentTarget.style.transform='translateY(0)'; e.currentTarget.style.borderColor=tokens.border; }}>
          <div style={{ display:'flex', alignItems:'center', justifyContent:'center', gap:12, padding:'24px 24px 20px',
            background: isDark ? `linear-gradient(135deg,${tokens.accentMuted},transparent)` : `linear-gradient(135deg,${tokens.accentMuted},${tokens.bgSurface})`,
            borderBottom:`1px solid ${tokens.border}` }}>
            <span style={{ fontSize:24 }}>👨‍💼</span>
            <span style={{ fontFamily:"'Syne', sans-serif", fontSize:19, fontWeight:700, color:tokens.textPrimary }}>Faculty Login</span>
          </div>
          <div style={{ padding:'28px 28px 8px' }}>
            {facultyErr && <div style={{ background:tokens.dangerBg, border:`1px solid ${tokens.dangerBorder}`, borderRadius:12, padding:'12px 14px', color:tokens.danger, fontSize:13, marginBottom:20, lineHeight:1.5 }}>{facultyErr}</div>}
            <form onSubmit={handleFaculty}>
              <div style={{ marginBottom:20 }}>
                <label style={labelStyle}>Employee ID</label>
                <input style={inputStyle} type="text" placeholder="e.g. FMP001" value={facultyId} onChange={e => setFacultyId(e.target.value)} required autoComplete="username"
                  onFocus={e => { e.target.style.borderColor=tokens.accent; e.target.style.boxShadow=`0 0 0 3px ${tokens.accentMuted}`; }}
                  onBlur={e => { e.target.style.borderColor=tokens.borderInput; e.target.style.boxShadow='none'; }} />
              </div>
              <div style={{ marginBottom:20 }}>
                <label style={labelStyle}>Password</label>
                <input style={inputStyle} type="password" placeholder="••••••••" value={facultyPass} onChange={e => setFacultyPass(e.target.value)} required autoComplete="current-password"
                  onFocus={e => { e.target.style.borderColor=tokens.accent; e.target.style.boxShadow=`0 0 0 3px ${tokens.accentMuted}`; }}
                  onBlur={e => { e.target.style.borderColor=tokens.borderInput; e.target.style.boxShadow='none'; }} />
              </div>
              <div style={{ paddingBottom:28 }}>
                <button type="submit" disabled={facultyLoading} style={{ width:'100%', padding:'14px', background:tokens.accentGrad, border:'none', borderRadius:12, color: tokens.textInverse, fontFamily:"'Space Mono', monospace", fontSize:13, fontWeight:700, letterSpacing:'0.08em', cursor: facultyLoading ? 'not-allowed' : 'pointer', display:'flex', alignItems:'center', justifyContent:'center', minHeight:46, opacity: facultyLoading ? 0.7 : 1 }}>
                  {facultyLoading ? <div style={{ width:18, height:18, border:`2px solid rgba(0,0,0,0.2)`, borderTopColor: tokens.textInverse, borderRadius:'50%', animation:'spin 0.75s linear infinite' }} /> : 'LOGIN'}
                </button>
              </div>
            </form>
          </div>
        </div>

        {/* Student */}
        <div style={cardStyle}
          onMouseEnter={e => { e.currentTarget.style.transform='translateY(-5px)'; e.currentTarget.style.borderColor=tokens.successBorder; }}
          onMouseLeave={e => { e.currentTarget.style.transform='translateY(0)'; e.currentTarget.style.borderColor=tokens.border; }}>
          <div style={{ display:'flex', alignItems:'center', justifyContent:'center', gap:12, padding:'24px 24px 20px',
            background: isDark ? `linear-gradient(135deg,${tokens.successBg},transparent)` : `linear-gradient(135deg,${tokens.successBg},${tokens.bgSurface})`,
            borderBottom:`1px solid ${tokens.border}` }}>
            <span style={{ fontSize:24 }}>🎓</span>
            <span style={{ fontFamily:"'Syne', sans-serif", fontSize:19, fontWeight:700, color:tokens.textPrimary }}>Student Login</span>
          </div>
          <div style={{ padding:'28px 28px 8px' }}>
            {studentErr && <div style={{ background:tokens.dangerBg, border:`1px solid ${tokens.dangerBorder}`, borderRadius:12, padding:'12px 14px', color:tokens.danger, fontSize:13, marginBottom:20, lineHeight:1.5 }}>{studentErr}</div>}
            <form onSubmit={handleStudent}>
              <div style={{ marginBottom:20 }}>
                <label style={labelStyle}>Roll Number</label>
                <input style={inputStyle} type="text" placeholder="e.g. 22CS001" value={studentId} onChange={e => setStudentId(e.target.value)} required autoComplete="username"
                  onFocus={e => { e.target.style.borderColor=tokens.success; e.target.style.boxShadow=`0 0 0 3px ${tokens.successBg}`; }}
                  onBlur={e => { e.target.style.borderColor=tokens.borderInput; e.target.style.boxShadow='none'; }} />
              </div>
              <div style={{ marginBottom:20 }}>
                <label style={labelStyle}>Password</label>
                <input style={inputStyle} type="password" placeholder="••••••••" value={studentPass} onChange={e => setStudentPass(e.target.value)} required autoComplete="current-password"
                  onFocus={e => { e.target.style.borderColor=tokens.success; e.target.style.boxShadow=`0 0 0 3px ${tokens.successBg}`; }}
                  onBlur={e => { e.target.style.borderColor=tokens.borderInput; e.target.style.boxShadow='none'; }} />
              </div>
              <div style={{ paddingBottom:28 }}>
                <button type="submit" disabled={studentLoading} style={{ width:'100%', padding:'14px', background:`linear-gradient(135deg,${tokens.success},#0d9e7e)`, border:'none', borderRadius:12, color: tokens.textInverse, fontFamily:"'Space Mono', monospace", fontSize:13, fontWeight:700, letterSpacing:'0.08em', cursor: studentLoading ? 'not-allowed' : 'pointer', display:'flex', alignItems:'center', justifyContent:'center', minHeight:46, opacity: studentLoading ? 0.7 : 1 }}>
                  {studentLoading ? <div style={{ width:18, height:18, border:`2px solid rgba(0,0,0,0.2)`, borderTopColor: tokens.textInverse, borderRadius:'50%', animation:'spin 0.75s linear infinite' }} /> : 'LOGIN'}
                </button>
              </div>
            </form>
          </div>
        </div>
      </div>

      <div style={{ marginTop:36, zIndex:1, position:'relative' }}>
        <span onClick={() => navigate('landing')} style={{ fontFamily:"'Space Mono', monospace", fontSize:12, color:tokens.textDimmer, cursor:'pointer', letterSpacing:'0.06em', transition:'color 0.2s' }}
          onMouseEnter={e => e.target.style.color=tokens.accent}
          onMouseLeave={e => e.target.style.color=tokens.textDimmer}>
          ← Back to home
        </span>
      </div>

      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Space+Mono:wght@400;700&family=DM+Sans:wght@300;400;500;700&family=Syne:wght@700;800&display=swap');
        @keyframes spin { to { transform: rotate(360deg); } }
        @media (max-width: 768px) {
          .login-panels { flex-direction: column; align-items: center; }
          .login-card { width: 100%; min-width: 100%; }
        }
      `}</style>
    </div>
  );
}