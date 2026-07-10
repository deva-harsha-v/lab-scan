import React, { useState, useEffect } from 'react';
import LabScanLogo from '../../components/LabScanLogo';
import { useRouter } from '../../App';
import LearnStage from './stages/LearnStage';
import WatchStage from './stages/WatchStage';
import SubmitStage from './stages/SubmitStage';
import { recordStage1Start, recordStage2Start, isStage2Unlocked, isStage3Unlocked, getStage2RemainingSeconds, getStage3RemainingSeconds } from '../../utils/stageUnlock';
import { experimentsApi } from '../../api/experiments.api';
import { useTheme } from '../../context/ThemeContext';
import ThemeToggle from '../../components/ThemeToggle';

const STAGES = [
  { id: 1, label: 'Learn',  icon: '📖', accent: '#63d2ff' },
  { id: 2, label: 'Watch',  icon: '▶️',  accent: '#fbbf24' },
  { id: 3, label: 'Submit', icon: '📤', accent: '#4af0c4' },
];

export default function ExperimentView() {
  const { tokens } = useTheme();
  const { params, navigate } = useRouter();
  const { session, experiment: expParam, members = [] } = params;

  const [experiment, setExperiment] = useState(expParam || null);
  const [activeStage, setActiveStage] = useState(1);
  const [stage2Unlocked, setStage2Unlocked] = useState(false);
  const [stage3Unlocked, setStage3Unlocked] = useState(false);
  const [countdown2, setCountdown2] = useState(60);
  const [countdown3, setCountdown3] = useState(60);
  const [loading, setLoading] = useState(!expParam);
  const [error, setError] = useState('');

  const isDark = tokens.colorScheme === 'dark';

  useEffect(() => {
    if (!experiment && expParam?.id) {
      experimentsApi.getById(expParam.id)
        .then(r => setExperiment(r.data))
        .catch(() => setError('Could not load experiment.'))
        .finally(() => setLoading(false));
    } else if (experiment) {
      setLoading(false);
    }
  }, [experiment, expParam]);

  useEffect(() => {
    if (!experiment) return;
    recordStage1Start(experiment.id);
    const iv = setInterval(() => {
      setStage2Unlocked(isStage2Unlocked(experiment.id));
      setStage3Unlocked(isStage3Unlocked(experiment.id));
      setCountdown2(Math.max(0, getStage2RemainingSeconds(experiment.id)));
      setCountdown3(Math.max(0, getStage3RemainingSeconds(experiment.id)));
    }, 1000);
    return () => clearInterval(iv);
  }, [experiment]);

  const handleStageClick = (id) => {
    if (id === 1) { setActiveStage(1); return; }
    if (id === 2 && !stage2Unlocked) return;
    if (id === 2) { recordStage2Start(experiment.id); setActiveStage(2); return; }
    if (id === 3 && !stage3Unlocked) return;
    setActiveStage(3);
  };

  if (loading) return (
    <div style={{ minHeight: '100vh', background: tokens.bgPage, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <div style={{ width: 32, height: 32, border: `2px solid ${tokens.accentMuted}`, borderTopColor: tokens.accent, borderRadius: '50%', animation: 'spin 0.75s linear infinite' }} />
      <style>{`@keyframes spin{to{transform:rotate(360deg);}}`}</style>
    </div>
  );

  if (error || !experiment) return (
    <div style={{ minHeight: '100vh', background: tokens.bgPage, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 20 }}>
      <div style={{ padding: '12px 20px', background: tokens.dangerBg, border: `1px solid ${tokens.dangerBorder}`, borderRadius: 12, color: tokens.danger, fontFamily: "'Space Mono', monospace", fontSize: 13 }}>
        {error || 'CRITICAL ARCHIVE ADAPTER: Experiment telemetry missing.'}
      </div>
      <button className="glowbtn" onClick={() => navigate('join-session')} style={{ padding: '12px 28px', background: tokens.accentMuted, border: `1px solid ${tokens.accentBorder}`, borderRadius: 10, color: tokens.accent, fontFamily: "'Space Mono',monospace", fontSize: 12, fontWeight: 700, cursor: 'pointer', transition: 'all 0.25s' }}>
        ← RETURN TO HUB
      </button>
    </div>
  );

  return (
    <>
      {/* Floating theme toggle */}
      <div style={{ position:'fixed', top:14, right:14, zIndex:999 }}><ThemeToggle size="sm" /></div>
      <link href="https://fonts.googleapis.com/css2?family=Space+Mono:wght@400;700&family=DM+Sans:wght@300;400;500;700&family=Syne:wght@700;800&display=swap" rel="stylesheet" />
      <style>{`
        *,*::before,*::after{box-sizing:border-box;margin:0;padding:0;}
        @keyframes spin{to{transform:rotate(360deg);}}
        @keyframes fadeUp{from{opacity:0;transform:translateY(14px);filter:blur(2px);}to{opacity:1;transform:translateY(0);filter:blur(0);}}
        @keyframes gridPulse{0%,100%{opacity:0.025;}50%{opacity:0.05;}}
        
        .stage-btn {
          padding: 10px 20px;
          border-radius: 10px;
          border: none;
          display: flex;
          align-items: center;
          gap: 8px;
          font-family: 'Space Mono', monospace;
          font-size: 12px;
          font-weight: 700;
          letter-spacing: 0.04em;
          transition: all 0.3s cubic-bezier(0.16, 1, 0.3, 1);
          background: transparent;
        }
        .stage-btn:hover:not(:disabled) {
          background: ${tokens.bgSurfaceHover};
        }
        .glowbtn { position: relative; overflow: hidden; }
        .glowbtn:hover { transform: translateY(-1px); }
        .glowbtn:active { transform: translateY(0); }
      `}</style>
      
      <div style={{ minHeight: '100vh', background: tokens.bgPage, color: tokens.textPrimary, fontFamily: "'DM Sans', sans-serif", transition: 'background 0.3s ease, color 0.3s ease' }}>
        {/* Ambient structural background grid gridscape */}
        <div style={{ position: 'fixed', inset: 0, pointerEvents: 'none', backgroundImage: `linear-gradient(${tokens.border} 1px,transparent 1px),linear-gradient(90deg,${tokens.border} 1px,transparent 1px)`, backgroundSize: '60px 60px', opacity: isDark ? 0.6 : 0.4, animation: 'gridPulse 6s ease-in-out infinite', zIndex: 0 }} />

        {/* SYSTEM STATUS NAVBAR */}
        <nav style={{ position: 'sticky', top: 0, zIndex: 50, height: 64, display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0 max(20px, 4%)', background: tokens.bgNav, backdropFilter: tokens.backdropBlur, borderBottom: `1px solid ${tokens.border}`, transition: 'background 0.3s ease, border-color 0.3s ease' }}>
          <div onClick={() => navigate('landing')} style={{ display: 'flex', alignItems: 'center', gap: 12, cursor: 'pointer' }}>
            <LabScanLogo size={30} gradientId="expViewLogoGrad" />
            <span style={{ fontFamily: "'Syne',sans-serif", fontWeight: 800, fontSize: 16, letterSpacing: '-0.01em', color: tokens.textPrimary }}>LabScan</span>
          </div>
          
          {session && (
            <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
              <span style={{ padding: '4px 12px', background: tokens.successBg, border: `1px solid ${tokens.successBorder}`, borderRadius: 8, fontFamily: "'Space Mono',monospace", fontSize: 11, color: tokens.success, fontWeight: 700, letterSpacing: '0.06em' }}>
                ROOM: {session.code}
              </span>
              {members.length > 0 && (
                <span className="nav-links-desktop" style={{ fontSize: 11, color: tokens.textMuted, fontFamily: "'Space Mono',monospace", background: tokens.bgSurfaceHover, border: `1px solid ${tokens.border}`, padding: '4px 10px', borderRadius: 8 }}>
                  {members[0].roll}
                </span>
              )}
            </div>
          )}
        </nav>

        {/* WORKSPACE INTERACTION ROOT */}
        <main style={{ position: 'relative', zIndex: 1, maxWidth: 800, margin: '0 auto', padding: '40px 24px 100px' }}>
          
          {/* Header Typography Elements */}
          <div style={{ marginBottom: 36, animation: 'fadeUp 0.5s cubic-bezier(0.16, 1, 0.3, 1) forwards' }}>
            <h1 style={{ fontFamily: "'Syne',sans-serif", fontWeight: 800, fontSize: 'clamp(22px, 4.5vw, 32px)', letterSpacing: '-0.02em', color: tokens.textPrimary, marginBottom: 8 }}>
              {experiment.title}
            </h1>
            {experiment.description && (
              <p style={{ fontSize: 14, color: tokens.textSecondary, lineHeight: 1.7, fontWeight: 300 }}>
                {experiment.description}
              </p>
            )}
          </div>

          {/* Integrated High-Tech Control Tab Segment */}
          <div style={{ display: 'flex', gap: 6, marginBottom: 36, padding: 6, background: tokens.bgSurface, borderRadius: 16, border: `1px solid ${tokens.border}`, width: 'fit-content', maxWidth: '100%', overflowX: 'auto' }}>
            {STAGES.map(s => {
              const locked = (s.id === 2 && !stage2Unlocked) || (s.id === 3 && !stage3Unlocked);
              const active = activeStage === s.id;
              return (
                <button 
                  key={s.id} 
                  onClick={() => handleStageClick(s.id)} 
                  disabled={locked}
                  className="stage-btn"
                  style={{
                    cursor: locked ? 'not-allowed' : 'pointer',
                    color: active ? s.accent : locked ? tokens.textDimmer : tokens.textSecondary,
                    background: active ? `${s.accent}14` : 'transparent',
                    borderBottom: active ? `2px solid ${s.accent}` : '2px solid transparent',
                    borderRadius: 10,
                    opacity: locked ? 0.4 : 1,
                    boxShadow: active && isDark ? `inset 0 0 12px ${s.accent}0a` : 'none'
                  }}
                >
                  <span style={{ fontSize: 13, filter: active && isDark ? `drop-shadow(0 0 8px ${s.accent})` : 'none' }}>{s.icon}</span>
                  <span>{s.label}</span>
                  
                  {locked && s.id === 2 && (
                    <span style={{ fontSize: 10, fontFamily: "'Space Mono', monospace", background: tokens.warningBg, border: `1px solid ${tokens.warningBorder}`, padding: '1px 6px', borderRadius: 4, color: tokens.warning, marginLeft: 4 }}>
                      {countdown2}s
                    </span>
                  )}
                  {locked && s.id === 3 && (
                    <span style={{ fontSize: 10, fontFamily: "'Space Mono', monospace", background: tokens.successBg, border: `1px solid ${tokens.successBorder}`, padding: '1px 6px', borderRadius: 4, color: tokens.success, marginLeft: 4 }}>
                      {countdown3}s
                    </span>
                  )}
                </button>
              );
            })}
          </div>

          {/* Core Dynamic Stage Viewport */}
          <div style={{ animation: 'fadeUp 0.6s cubic-bezier(0.16, 1, 0.3, 1) forwards' }}>
            {activeStage === 1 && <LearnStage experiment={experiment} />}
            {activeStage === 2 && <WatchStage experiment={experiment} />}
            {activeStage === 3 && <SubmitStage experiment={experiment} session={session} members={members} />}
          </div>
        </main>
      </div>
    </>
  );
}