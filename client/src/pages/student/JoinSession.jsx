import React, { useState } from 'react';
import LabScanLogo from '../../components/LabScanLogo';
import { useRouter } from '../../App';
import { sessionsApi } from '../../api/sessions.api';
import { experimentsApi } from '../../api/experiments.api';
import ArucoScanner from '../../components/ArucoScanner';
import { useTheme } from '../../context/ThemeContext';
import { makeStyles } from '../../utils/makeStyles';
import ThemeToggle from '../../components/ThemeToggle';

const makeS = (tokens) => ({
  page: { 
    minHeight: '100vh', 
    background: tokens.bgPage, 
    color: tokens.textPrimary, 
    fontFamily: "'DM Sans',sans-serif", 
    display: 'flex', 
    flexDirection: 'column', 
    alignItems: 'center', 
    padding: '40px 20px',
    transition: 'background 0.3s ease, color 0.3s ease'
  },
  card: { 
    width: '100%', 
    maxWidth: 480, 
    border: `1px solid ${tokens.border}`, 
    borderRadius: 18, 
    background: tokens.bgCard, 
    backdropFilter: tokens.backdropBlur, 
    padding: '28px',
    boxShadow: tokens.shadowCard,
    transition: 'background 0.3s ease, border-color 0.3s ease'
  },
  input: { 
    width: '100%', 
    padding: '11px 14px', 
    background: tokens.bgInput, 
    border: `1px solid ${tokens.borderInput}`, 
    borderRadius: 10, 
    color: tokens.textPrimary, 
    fontSize: 14, 
    fontFamily: "'DM Sans',sans-serif", 
    outline: 'none', 
    colorScheme: tokens.colorScheme, 
    transition: 'all 0.2s ease' 
  },
  label: { 
    display: 'block', 
    fontFamily: "'Space Mono',monospace", 
    fontSize: 11, 
    letterSpacing: '0.1em', 
    color: tokens.textMuted, 
    textTransform: 'uppercase', 
    marginBottom: 8 
  },
  btn: { 
    width: '100%', 
    padding: '13px', 
    border: 'none', 
    borderRadius: 10, 
    fontFamily: "'Space Mono',monospace", 
    fontWeight: 700, 
    fontSize: 13, 
    letterSpacing: '0.08em', 
    cursor: 'pointer', 
    transition: 'all 0.25s' 
  },
});

function MemberRow({ index, member, onChange, onRemove, canRemove }) {
  const { tokens } = useTheme();
  const S = makeS(tokens);
  return (
    <div style={{ display:'grid', gridTemplateColumns:'1fr 32px', gap:8, marginBottom:10, alignItems:'start' }}>
      <div>
        <input style={{ ...S.input, fontSize:13, fontFamily:"'Space Mono',monospace", letterSpacing:'0.05em' }} placeholder={`Roll Number ${index+1}`} value={member.roll} onChange={e => onChange(index,'roll',e.target.value.toUpperCase())} required />
      </div>
      {canRemove ? (
        <button type="button" onClick={() => onRemove(index)} style={{ height:42, background:tokens.dangerBg, border:`1px solid ${tokens.dangerBorder}`, borderRadius:7, color:tokens.danger, cursor:'pointer', fontSize:14, alignSelf:'end' }}>×</button>
      ) : <div />}
    </div>
  );
}

export default function JoinSession() {
  const { navigate } = useRouter();
  const { tokens } = useTheme();
  const S = makeS(tokens);
  const [step, setStep] = useState(1); // 1=code, 2=group, 3=scan
  const [code, setCode] = useState('');
  const [session, setSession] = useState(null);
  const [members, setMembers] = useState([{ roll:'' }]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [scanStatus, setScanStatus] = useState('idle');
  const [scannedExp, setScannedExp] = useState(null);

  const isDark = tokens.colorScheme === 'dark';

  const handleCodeSubmit = async (e) => {
    e.preventDefault();
    if (!code.trim()) return;
    setError(''); setLoading(true);
    try {
      const res = await sessionsApi.getByCode(code.trim().toUpperCase());
      setSession(res.data);
      setStep(2);
    } catch (err) {
      setError(err.response?.status === 404 ? 'Session not found.' : err.response?.status === 410 ? 'Session has ended.' : err.response?.data?.error || 'Failed to join session.');
    } finally { setLoading(false); }
  };

  const updateMember = (i, field, val) => setMembers(prev => prev.map((m,idx) => idx===i ? {...m, [field]:val} : m));
  const addMember = () => setMembers(prev => [...prev, { roll:'' }]);
  const removeMember = (i) => setMembers(prev => prev.filter((_,idx) => idx!==i));

  const handleGroupSubmit = (e) => {
    e.preventDefault();
    const invalid = members.some(m => !m.roll.trim());
    if (invalid) { setError('Please fill in a roll number for every group member.'); return; }
    setError('');
    setStep(3);
  };

  const handleDetected = async (markerId) => {
    setScanStatus('detecting'); setError('');
    try {
      const res = await experimentsApi.lookupByAruco(markerId);
      setScannedExp(res.data);
      setScanStatus('found');
    } catch (err) {
      setError(err.response?.status === 404 ? `No experiment for marker ${markerId}.` : 'Scan failed. Try again.');
      setScanStatus('error');
    }
  };

  const handleContinue = () => {
    navigate('experiment-view', { session, experiment: scannedExp, members });
  };

  const STEPS = ['Session Code','Group Details','Scan Marker'];

  return (
    <>
      <link href="https://fonts.googleapis.com/css2?family=Space+Mono:wght@400;700&family=DM+Sans:wght@300;400;500&family=Syne:wght@700;800&display=swap" rel="stylesheet" />
      <style>{`
        *,*::before,*::after{box-sizing:border-box;margin:0;padding:0;}
        @keyframes fadeUp{from{opacity:0;transform:translateY(20px);}to{opacity:1;transform:translateY(0);}}
        @keyframes spin{to{transform:rotate(360deg);}}
        @keyframes gridPulse{0%,100%{opacity:0.025;}50%{opacity:0.05;}}
        .ji-input:focus{border-color:${tokens.accent}!important;}
        .ji-input::placeholder{color:${tokens.textDimmer};}
      `}</style>

      <div style={S.page}>
        <div style={{ position:'fixed', inset:0, pointerEvents:'none', backgroundImage:`linear-gradient(${tokens.border} 1px,transparent 1px),linear-gradient(90deg,${tokens.border} 1px,transparent 1px)`, backgroundSize:'60px 60px', opacity: isDark ? 1 : 0.4, animation:'gridPulse 6s ease-in-out infinite' }} />

        {/* Logo */}
        <div style={{ position:'relative', zIndex:1, display:'flex', alignItems:'center', gap:10, marginBottom:40, alignSelf:'flex-start', maxWidth:480, width:'100%' }}>
          <div style={{ width:32, height:32, cursor:'pointer' }} onClick={() => navigate('landing')}>
            <LabScanLogo size={32} gradientId="joinSessionLogoGrad" />
          </div>
          <span style={{ fontFamily:"'Syne',sans-serif", fontWeight:800, fontSize:17, color: tokens.textPrimary }}>LabScan</span>
        </div>

        {/* Stepper */}
        <div style={{ position:'relative', zIndex:1, width:'100%', maxWidth:480, display:'flex', alignItems:'center', marginBottom:28 }}>
          {STEPS.map((s,i) => (
            <React.Fragment key={i}>
              <div style={{ display:'flex', flexDirection:'column', alignItems:'center', gap:4, flexShrink:0 }}>
                <div style={{ width:30, height:30, borderRadius:'50%', display:'flex', alignItems:'center', justifyContent:'center', fontSize:12, fontFamily:"'Space Mono',monospace", fontWeight:700, transition:'all 0.3s',
                  background: step > i+1 ? tokens.success : step === i+1 ? tokens.accent : tokens.bgSurfaceHover,
                  color: step >= i+1 ? tokens.textInverse : tokens.textMuted,
                  boxShadow: step === i+1 && isDark ? `0 0 16px ${tokens.accent}66` : 'none',
                  border: `1px solid ${step >= i+1 ? 'transparent' : tokens.border}` }}>
                  {step > i+1 ? '✓' : i+1}
                </div>
                <span style={{ fontSize:10, fontFamily:"'Space Mono',monospace", letterSpacing:'0.08em', color: step===i+1 ? tokens.accent : tokens.textDimmer, whiteSpace:'nowrap' }}>{s}</span>
              </div>
              {i < STEPS.length-1 && <div style={{ flex:1, height:1, background: step > i+1 ? tokens.success : tokens.border, margin:'0 8px 20px', transition:'background 0.4s' }} />}
            </React.Fragment>
          ))}
        </div>

        {/* STEP 1 */}
        {step === 1 && (
          <div style={{ position:'relative', zIndex:1, ...S.card, animation:'fadeUp 0.5s ease forwards' }}>
            <div style={{ textAlign:'center', marginBottom:24 }}>
              <div style={{ fontSize:32, marginBottom:10 }}>🔑</div>
              <h1 style={{ fontFamily:"'Syne',sans-serif", fontWeight:800, fontSize:22, marginBottom:6, color: tokens.textPrimary }}>Join a Session</h1>
              <p style={{ fontSize:13, color:tokens.textMuted }}>Enter the 6-character code from your instructor</p>
            </div>
            {error && <div style={{ marginBottom:16, padding:'10px 14px', background:tokens.dangerBg, border:`1px solid ${tokens.dangerBorder}`, borderRadius:8, color:tokens.danger, fontSize:13 }}>{error}</div>}
            <form onSubmit={handleCodeSubmit}>
              <label style={S.label}>Session Code</label>
              <input className="ji-input" style={{ ...S.input, textAlign:'center', fontSize:28, fontFamily:"'Space Mono',monospace", letterSpacing:'0.4em', marginBottom:8 }}
                placeholder="XXXXXX" value={code} onChange={e => setCode(e.target.value.toUpperCase().replace(/[^A-Z0-9]/g,'').slice(0,6))} maxLength={6} autoFocus autoComplete="off" spellCheck={false} />
              <p style={{ fontSize:11, color:tokens.textMuted, textAlign:'center', marginBottom:20, fontFamily:"'Space Mono',monospace" }}>{code.length}/6 characters</p>
              <button type="submit" style={{ ...S.btn, background: code.length===6 ? tokens.accentGrad : tokens.btnSecondaryBg, border: code.length===6 ? 'none' : `1px solid ${tokens.border}`, color: code.length===6 ? tokens.textInverse : tokens.textDimmer, cursor: code.length===6 ? 'pointer' : 'default', boxShadow: code.length===6 ? tokens.shadow : 'none' }} disabled={loading || code.length!==6}>
                {loading ? <div style={{ width:16, height:16, border:`2px solid ${tokens.border}`, borderTopColor:tokens.textInverse, borderRadius:'50%', animation:'spin 0.8s linear infinite', margin:'0 auto' }} /> : 'Verify Code →'}
              </button>
            </form>
          </div>
        )}

        {/* STEP 2 — Group Details */}
        {step === 2 && (
          <div style={{ position:'relative', zIndex:1, ...S.card, animation:'fadeUp 0.5s ease forwards' }}>
            <div style={{ marginBottom:20 }}>
              <div style={{ fontSize:24, marginBottom:8 }}>👥</div>
              <h1 style={{ fontFamily:"'Syne',sans-serif", fontWeight:800, fontSize:22, marginBottom:4, color: tokens.textPrimary }}>Group Details</h1>
              <p style={{ fontSize:13, color:tokens.textMuted }}>Session <span style={{ fontFamily:"'Space Mono',monospace", color:tokens.accent, fontWeight:600 }}>{session?.code}</span> — {session?.experiment?.title}</p>
            </div>
            {error && <div style={{ marginBottom:16, padding:'10px 14px', background:tokens.dangerBg, border:`1px solid ${tokens.dangerBorder}`, borderRadius:8, color:tokens.danger, fontSize:13 }}>{error}</div>}
            <form onSubmit={handleGroupSubmit}>
              <div style={{ fontFamily:"'Space Mono',monospace", fontSize:10, letterSpacing:'0.12em', color:tokens.textMuted, textTransform:'uppercase', display:'grid', gridTemplateColumns:'1fr 32px', gap:8, marginBottom:8, paddingBottom:8, borderBottom:`1px solid ${tokens.border}` }}>
                <span>Roll Number</span><span/>
              </div>
              {members.map((m,i) => (
                <MemberRow key={i} index={i} member={m} onChange={updateMember} onRemove={removeMember} canRemove={members.length > 1} />
              ))}
              <button type="button" onClick={addMember} style={{ width:'100%', padding:'10px', background:tokens.bgSurface, border:`1px dashed ${tokens.borderStrong}`, borderRadius:8, color:tokens.textSecondary, fontFamily:"'Space Mono',monospace", fontSize:11, letterSpacing:'0.08em', cursor:'pointer', marginBottom:20, transition:'all 0.2s' }}
                onMouseEnter={e => { e.currentTarget.style.borderColor=tokens.accent; e.currentTarget.style.color=tokens.accent; }}
                onMouseLeave={e => { e.currentTarget.style.borderColor=tokens.borderStrong; e.currentTarget.style.color=tokens.textSecondary; }}>
                + ADD MEMBER
              </button>
              <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:10 }}>
                <button type="button" onClick={() => { setStep(1); setError(''); }} style={{ ...S.btn, background:tokens.btnSecondaryBg, border:`1px solid ${tokens.btnSecondaryBorder}`, color:tokens.btnSecondaryText }}>← Back</button>
                <button type="submit" style={{ ...S.btn, background:tokens.accentGrad, color:tokens.textInverse, boxShadow:tokens.shadow }}>Continue →</button>
              </div>
            </form>
          </div>
        )}

        {/* STEP 3 — Scan */}
        {step === 3 && (
          <div style={{ position:'relative', zIndex:1, ...S.card, animation:'fadeUp 0.5s ease forwards' }}>
            <div style={{ position:'fixed', top: 14, right: 14, zIndex: 999 }}><ThemeToggle size="sm" /></div>
            {scanStatus !== 'found' ? (
              <>
                <div style={{ textAlign:'center', marginBottom:20 }}>
                  <div style={{ fontSize:28, marginBottom:8 }}>📷</div>
                  <h1 style={{ fontFamily:"'Syne',sans-serif", fontWeight:800, fontSize:20, marginBottom:4, color: tokens.textPrimary }}>Scan Experiment Marker</h1>
                  <p style={{ fontSize:13, color:tokens.textMuted }}>Point camera at the ArUco marker on your experiment sheet</p>
                  <div style={{ mountaineer: 10, padding:'8px 14px', background:tokens.accentMuted, border:`1px solid ${tokens.accentBorder}`, borderRadius:8, fontSize:12, color:tokens.textSecondary, fontFamily:"'Space Mono',monospace" }}>
                    Group: {members.map(m => m.roll).join(', ')}
                  </div>
                </div>
                <ArucoScanner onDetected={handleDetected} />
                {scanStatus === 'detecting' && (
                  <div style={{ marginTop:14, display:'flex', alignItems:'center', justifyContent:'center', gap:8, color:tokens.accent, fontSize:13 }}>
                    <div style={{ width:14, height:14, border:`2px solid ${tokens.accentMuted}`, borderTopColor:tokens.accent, borderRadius:'50%', animation:'spin 0.8s linear infinite' }} /> Looking up experiment…
                  </div>
                )}
                {error && <div style={{ marginTop:12, padding:'10px 14px', background:tokens.dangerBg, border:`1px solid ${tokens.dangerBorder}`, borderRadius:8, color:tokens.danger, fontSize:13 }}>{error}</div>}

                <button type="button" onClick={() => { setStep(2); setError(''); setScanStatus('idle'); }} style={{ marginTop:16, width:'100%', padding:'10px', background:'transparent', border:'none', color:tokens.textDimmer, fontFamily:"'Space Mono',monospace", fontSize:11, cursor:'pointer', letterSpacing:'0.06em' }}>
                  ← Edit group details
                </button>
              </>
            ) : (
              <div style={{ animation:'fadeUp 0.4s ease forwards' }}>
                <div style={{ display:'flex', gap:16, alignItems:'flex-start', marginBottom:20 }}>
                  <div style={{ width:48, height:48, background:tokens.successBg, border:`1px solid ${tokens.successBorder}`, color:tokens.success, borderRadius:12, display:'flex', alignItems:'center', justifyContent:'center', fontSize:22, flexShrink:0 }}>✓</div>
                  <div>
                    <p style={{ fontSize:11, color:tokens.success, fontFamily:"'Space Mono',monospace", letterSpacing:'0.08em', marginBottom:4, fontWeight:700 }}>EXPERIMENT FOUND</p>
                    <h2 style={{ fontFamily:"'Syne',sans-serif", fontWeight:700, fontSize:20, color:tokens.textPrimary, marginBottom:4 }}>{scannedExp.title}</h2>
                    <p style={{ fontSize:13, color:tokens.textMuted, lineHeight:1.6 }}>{scannedExp.description}</p>
                  </div>
                </div>
                <div style={{ display:'grid', gridTemplateColumns:'1fr 44px', gap:10 }}>
                  <button onClick={handleContinue} style={{ ...S.btn, background:tokens.successGrad || 'linear-gradient(135deg,#4af0c4,#1e64ff)', color:tokens.textInverse, boxShadow:tokens.shadow }}>Start Experiment →</button>
                  <button onClick={() => { setScanStatus('idle'); setScannedExp(null); setError(''); }} style={{ padding:'13px', background:tokens.btnSecondaryBg, border:`1px solid ${tokens.btnSecondaryBorder}`, borderRadius:10, color:tokens.btnSecondaryText, cursor:'pointer', fontSize:16, display:'flex', alignItems:'center', justifyContent:'center' }}>↺</button>
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </>
  );
}