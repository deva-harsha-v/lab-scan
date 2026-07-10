import React, { useEffect, useState, useRef, useCallback } from 'react';
import { useRouter } from '../App';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import ThemeToggle from '../components/ThemeToggle';
import LabScanLogo from '../components/LabScanLogo';

import { 
  Shield, Scan, Users, Activity, Layers, BookOpen, Terminal, 
  Monitor, Camera, Cpu, ChevronRight, ArrowRight,
  Sparkles, Zap, Layout, UserCheck
} from 'lucide-react';

const font = { mono: "'Space Mono', monospace", sans: "'DM Sans', sans-serif" };
const BTN_BASE = { cursor: 'pointer', border: 'none', outline: 'none', fontFamily: font.mono, letterSpacing: '0.08em', transition: 'all 0.25s cubic-bezier(0.16, 1, 0.3, 1)' };

// ── Stat Item ──────────────────────────────────────────────────────────────
function StatItem({ value, label }) {
  const { tokens } = useTheme();
  return (
    <div style={{ padding: '32px', textAlign: 'center', background: tokens.bgCard, border: `1px solid ${tokens.border}`, borderRadius: 20, backdropFilter: 'blur(20px)' }}>
      <div style={{ fontFamily: "'Syne', sans-serif", fontWeight: 900, fontSize: 'clamp(36px, 4vw, 54px)', letterSpacing: '-0.03em', color: tokens.textPrimary }}>{value}</div>
      <div style={{ fontSize: 11, color: tokens.textMuted, fontFamily: font.mono, letterSpacing: '0.12em', textTransform: 'uppercase', marginTop: 6 }}>{label}</div>
    </div>
  );
}

// ── 3D Particle Field Canvas ───────────────────────────────────────────────
function ParticleField() {
  const canvasRef = useRef(null);
  const animRef = useRef(null);
  const particles = useRef([]);
  const { isDark } = useTheme();

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');

    const resize = () => {
      canvas.width = canvas.offsetWidth;
      canvas.height = canvas.offsetHeight;
    };
    resize();
    window.addEventListener('resize', resize);

    particles.current = [];
    for (let i = 0; i < 120; i++) {
      particles.current.push({
        x: Math.random() * canvas.width,
        y: Math.random() * canvas.height,
        z: Math.random(),
        vx: (Math.random() - 0.5) * 0.3,
        vy: (Math.random() - 0.5) * 0.3,
        baseSize: Math.random() * 1.5 + 0.5,
      });
    }

    const animate = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      particles.current.forEach((p, i) => {
        p.x += p.vx * (0.5 + p.z * 0.8);
        p.y += p.vy * (0.5 + p.z * 0.8);

        if (p.x < 0) p.x = canvas.width;
        if (p.x > canvas.width) p.x = 0;
        if (p.y < 0) p.y = canvas.height;
        if (p.y > canvas.height) p.y = 0;

        const size = p.baseSize * (0.4 + p.z * 0.8);
        const alpha = isDark ? (0.15 + p.z * 0.35) : (0.1 + p.z * 0.25);

        const r = Math.round(59 + (6 - 59) * p.z);
        const g = Math.round(130 + (182 - 130) * p.z);
        const b = Math.round(246 + (212 - 246) * p.z);
        ctx.beginPath();
        ctx.arc(p.x, p.y, size, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(${r},${g},${b},${alpha})`;
        ctx.fill();

        for (let j = i + 1; j < particles.current.length; j++) {
          const q = particles.current[j];
          const dx = p.x - q.x, dy = p.y - q.y;
          const dist = Math.sqrt(dx * dx + dy * dy);
          const maxDist = 80 + p.z * 60;
          if (dist < maxDist) {
            const lineAlpha = (1 - dist / maxDist) * (isDark ? 0.06 : 0.04) * (p.z + q.z);
            ctx.beginPath();
            ctx.moveTo(p.x, p.y);
            ctx.lineTo(q.x, q.y);
            ctx.strokeStyle = `rgba(59,130,246,${lineAlpha})`;
            ctx.lineWidth = 0.5;
            ctx.stroke();
          }
        }
      });
      animRef.current = requestAnimationFrame(animate);
    };
    animate();

    return () => {
      cancelAnimationFrame(animRef.current);
      window.removeEventListener('resize', resize);
    };
  }, [isDark]);

  return (
    <canvas ref={canvasRef} style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', pointerEvents: 'none', zIndex: 0 }} />
  );
}

// ── 3D Orbital Scanner ─────────────────────────────────────────────────────
function OrbitalScanner() {
  const { tokens, isDark } = useTheme();
  const markerA = [1,1,0,1,1, 0,0,1,0,0, 1,0,1,0,1, 1,1,0,0,1, 0,1,1,1,0];
  const markerB = [0,1,1,0,1, 1,0,0,1,0, 0,1,0,1,1, 1,0,1,0,0, 0,1,0,1,1];

  const markerBg = isDark ? '#ffffff' : tokens.bgSurface;
  const markerBorder = isDark ? '#000000' : tokens.border;
  const bitBlack = '#000000';
  const bitWhite = '#ffffff';

  return (
    <div style={{ position: 'relative', width: 460, height: 460, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      {[340, 260, 180].map((size, i) => (
        <div key={i} style={{
          position: 'absolute', width: size, height: size, borderRadius: '50%',
          border: `1px ${i === 1 ? 'dashed' : 'solid'} rgba(${i === 0 ? '59,130,246' : i === 1 ? '6,182,212' : isDark ? '255,255,255' : '15,23,42'},${0.06 + i * 0.02})`,
          animation: `spinSlow ${14 + i * 6}s linear infinite ${i % 2 === 0 ? '' : 'reverse'}`,
          transformStyle: 'preserve-3d',
          transform: `rotateX(${65 + i * 5}deg)`
        }} />
      ))}

      {[0, 120, 240].map((deg, i) => (
        <div key={i} style={{
          position: 'absolute', width: 340, height: 340,
          animation: `spinSlow 8s linear ${i * 2.7}s infinite`,
          transformStyle: 'preserve-3d',
          transform: `rotateX(65deg) rotate(${deg}deg)`
        }}>
          <div style={{
            position: 'absolute', top: -4, left: '50%', marginLeft: -4,
            width: 8, height: 8, borderRadius: '50%',
            background: `rgba(${i === 0 ? '59,130,246' : i === 1 ? '6,182,212' : '16,185,129'},0.9)`,
            boxShadow: `0 0 12px rgba(${i === 0 ? '59,130,246' : i === 1 ? '6,182,212' : '16,185,129'},0.6)`
          }} />
        </div>
      ))}

      <div style={{
        background: markerBg, padding: 18, border: `6px solid ${markerBorder}`, borderRadius: 4,
        width: 140, height: 140, display: 'grid', gridTemplateColumns: 'repeat(5,1fr)', gap: 2,
        boxShadow: isDark ? '0 30px 80px rgba(0,0,0,0.9), 0 0 60px rgba(6,182,212,0.2)' : tokens.shadowModal,
        transform: 'perspective(600px) rotateY(15deg) rotateX(10deg)',
        zIndex: 2,
        animation: 'pulse3d 4s ease-in-out infinite'
      }}>
        {markerA.map((b, i) => <div key={i} style={{ background: b ? bitBlack : bitWhite }} />)}
      </div>

      <div style={{
        position: 'absolute', width: 140, height: 2,
        background: 'linear-gradient(90deg, transparent, rgba(6,182,212,0.8), transparent)',
        animation: 'scanSweep 2s ease-in-out infinite',
        zIndex: 3, pointerEvents: 'none'
      }} />

      <div style={{
        position: 'absolute', top: 20, right: 30, padding: 6, background: markerBg,
        border: `3px solid ${markerBorder}`, display: 'grid', gridTemplateColumns: 'repeat(5,1fr)', gap: 1,
        width: 52, height: 52,
        animation: 'float3d 5s ease-in-out 0.5s infinite',
        boxShadow: isDark ? '0 10px 30px rgba(0,0,0,0.5)' : tokens.shadow
      }}>
        {markerB.map((b, i) => <div key={i} style={{ background: b ? bitBlack : bitWhite }} />)}
      </div>

      <div style={{
        position: 'absolute', bottom: 30, left: 20, padding: 6, background: markerBg,
        border: `3px solid ${markerBorder}`, display: 'grid', gridTemplateColumns: 'repeat(5,1fr)', gap: 1,
        width: 44, height: 44,
        animation: 'float3d 6s ease-in-out 1.5s infinite',
        boxShadow: isDark ? '0 10px 30px rgba(0,0,0,0.5)' : tokens.shadow
      }}>
        {[1,0,1,0,1, 0,1,0,1,0, 1,0,1,0,1, 0,1,0,1,0, 1,0,1,0,1].map((b, i) => <div key={i} style={{ background: b ? bitBlack : bitWhite }} />)}
      </div>

      {[
        { top: -12, left: -12, borderTop: '2px solid #06B6D4', borderLeft: '2px solid #06B6D4' },
        { top: -12, right: -12, borderTop: '2px solid #06B6D4', borderRight: '2px solid #06B6D4' },
        { bottom: -12, left: -12, borderBottom: '2px solid #06B6D4', borderLeft: '2px solid #06B6D4' },
        { bottom: -12, right: -12, borderBottom: '2px solid #06B6D4', borderRight: '2px solid #06B6D4' },
      ].map((s, i) => (
        <div key={i} style={{ position: 'absolute', width: 20, height: 20, zIndex: 4, ...s }} />
      ))}
    </div>
  );
}

// ── 3D Isometric Workflow Node ─────────────────────────────────────────────
function IsoNode({ icon, role, tag, desc, color, delay, index }) {
  const [hovered, setHovered] = useState(false);
  const { tokens, isDark } = useTheme();
  return (
    <div
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      style={{
        padding: 24, borderRadius: 20,
        background: hovered ? (isDark ? 'rgba(255,255,255,0.04)' : 'rgba(14,165,233,0.04)') : tokens.bgCard,
        border: `1px solid ${hovered ? color : tokens.border}`,
        display: 'flex', flexDirection: 'column', alignItems: 'center', textAlign: 'center',
        zIndex: 1, backdropFilter: 'blur(10px)',
        transition: 'all 0.35s cubic-bezier(0.16,1,0.3,1)',
        transform: hovered
          ? 'perspective(600px) rotateX(-8deg) rotateY(4deg) translateY(-6px) scale(1.03)'
          : 'perspective(600px) rotateX(0deg) rotateY(0deg) translateY(0px) scale(1)',
        boxShadow: hovered ? (isDark ? `0 20px 40px rgba(0,0,0,0.5), 0 0 30px ${color}22` : tokens.shadow) : 'none',
        cursor: 'default',
        animationDelay: delay,
        position: 'relative', overflow: 'hidden'
      }}
    >
      <div style={{
        position: 'absolute', inset: 0, borderRadius: 20,
        background: `linear-gradient(135deg, ${color}08, transparent)`,
        opacity: hovered ? 1 : 0, transition: 'opacity 0.3s'
      }} />
      <div style={{
        width: 52, height: 52, borderRadius: '50%',
        background: tokens.bgPage, border: `2px solid ${hovered ? color : tokens.border}`,
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        fontSize: 22, marginBottom: 16,
        boxShadow: hovered ? `0 0 20px ${color}44, inset 0 2px 4px rgba(0,0,0,0.1)` : 'none',
        transition: 'all 0.3s',
        zIndex: 1,
        color: tokens.textPrimary
      }}>
        {icon}
      </div>
      <div style={{ fontFamily: font.mono, fontSize: 9, color: color, fontWeight: 700, zIndex: 1 }}>{tag}</div>
      <div style={{ fontSize: 16, fontWeight: 800, color: tokens.textPrimary, marginTop: 4, marginBottom: 8, zIndex: 1 }}>{role}</div>
      <div style={{ fontSize: 12, color: tokens.textMuted, lineHeight: 1.4, zIndex: 1 }}>{desc}</div>
    </div>
  );
}

// ── 3D Bento Card ──────────────────────────────────────────────────────────
function BentoCard3D({ children, style = {} }) {
  const cardRef = useRef(null);
  const { tokens, isDark } = useTheme();
  const [tilt, setTilt] = useState({ x: 0, y: 0, shine: { x: 50, y: 50 } });

  const handleMove = useCallback((e) => {
    const card = cardRef.current;
    if (!card) return;
    const rect = card.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    const xc = rect.width / 2, yc = rect.height / 2;
    setTilt({
      x: (yc - y) / 18,
      y: (x - xc) / 18,
      shine: { x: (x / rect.width) * 100, y: (y / rect.height) * 100 }
    });
  }, []);

  const handleLeave = useCallback(() => {
    setTilt({ x: 0, y: 0, shine: { x: 50, y: 50 } });
  }, []);

  return (
    <div
      ref={cardRef}
      onMouseMove={handleMove}
      onMouseLeave={handleLeave}
      style={{
        padding: 32, borderRadius: 24,
        background: tokens.bgCard,
        border: `1px solid ${tokens.border}`,
        transformStyle: 'preserve-3d',
        transform: `perspective(1000px) rotateX(${tilt.x}deg) rotateY(${tilt.y}deg) scale(${tilt.x !== 0 || tilt.y !== 0 ? 1.02 : 1})`,
        transition: tilt.x === 0 ? 'transform 0.5s cubic-bezier(0.16,1,0.3,1)' : 'transform 0.1s ease',
        boxShadow: tilt.x !== 0 ? (isDark ? '0 25px 60px rgba(0,0,0,0.5)' : tokens.shadow) : 'none',
        overflow: 'hidden',
        position: 'relative',
        ...style
      }}
    >
      <div style={{
        position: 'absolute', inset: 0, pointerEvents: 'none', borderRadius: 24,
        background: `radial-gradient(circle at ${tilt.shine.x}% ${tilt.shine.y}%, ${isDark ? 'rgba(255,255,255,0.04)' : 'rgba(14,165,233,0.05)'} 0%, transparent 60%)`,
        transition: 'opacity 0.2s',
        opacity: tilt.x !== 0 || tilt.y !== 0 ? 1 : 0
      }} />
      {children}
    </div>
  );
}

// ── Live Session Terminal ──────────────────────────────────────────────────
function LiveSessionTerminal() {
  const { tokens, isDark } = useTheme();
  const SESSION_CODE = 'LAB-7F2';
  const markerPattern = [1,0,1,1,0, 0,1,0,0,1, 1,1,1,0,1, 0,0,1,1,0, 1,0,1,0,1];

  const STEPS = [
    { phase: 'SESSION', label: 'Session created',      detail: `Code: ${SESSION_CODE}`,    icon: '⚙️', color: tokens.accent },
    { phase: 'JOIN',    label: 'Group joined',              detail: 'Ravi K, Priya M, Arjun S', icon: '👥', color: '#9333EA' },
    { phase: 'SCAN',    label: 'ArUco scan initiated',  detail: 'Camera feed active...',     icon: '📷', color: tokens.accent },
    { phase: 'VERIFY',  label: 'Marker verified',       detail: 'ID #0x3F2 · CSE-A Lab',   icon: '✔',  color: tokens.success },
    { phase: 'SUBMIT',  label: 'Lab report submitted',  detail: 'ADSAA Experiment 4',       icon: '📥', color: tokens.warning },
  ];

  const [activeStep, setActiveStep] = useState(0);
  const [scanning,   setScanning]   = useState(false);
  const [scanLine,   setScanLine]   = useState(0);

  useEffect(() => {
    const timer = setInterval(() => setActiveStep(prev => (prev + 1) % STEPS.length), 2200);
    return () => clearInterval(timer);
  }, [STEPS.length]);

  useEffect(() => {
    if (STEPS[activeStep]?.phase === 'SCAN') {
      setScanning(true);
      let frame = 0;
      const id = setInterval(() => { frame += 3; setScanLine(frame % 100); }, 16);
      return () => { clearInterval(id); setScanning(false); };
    }
  }, [activeStep, STEPS]);

  const completed = (i) => i < activeStep;
  const current   = (i) => i === activeStep;

  const markerBg = isDark ? '#ffffff' : tokens.bgSurface;
  const markerBorder = isDark ? '#000000' : tokens.border;

  return (
    <div style={{
      position: 'relative',
      width: '100%', maxWidth: 520,
      paddingTop: 36,
      paddingBottom: 28,
    }}>
      <div style={{
        position: 'absolute', top: 36, left: 0, right: 0, bottom: 28,
        borderRadius: 24, background: 'rgba(59,130,246,0.06)',
        transform: 'translate(12px, 8px)', filter: 'blur(2px)', zIndex: 0
      }} />
      <div style={{
        position: 'absolute', top: 36, left: 0, right: 0, bottom: 28,
        borderRadius: 24, background: 'rgba(6,182,212,0.04)',
        transform: 'translate(24px, 16px)', filter: 'blur(4px)', zIndex: 0
      }} />

      <div style={{
        position: 'absolute', top: 0, right: 0, zIndex: 10,
        padding: 8, background: markerBg, border: `4px solid ${markerBorder}`,
        width: 64, height: 64,
        display: 'grid', gridTemplateColumns: 'repeat(5,1fr)', gap: 1,
        animation: 'float3d 6s ease-in-out infinite',
        boxShadow: isDark ? '0 15px 40px rgba(0,0,0,0.6), 0 0 30px rgba(6,182,212,0.25)' : tokens.shadowCard,
      }}>
        {markerPattern.map((b, i) => (
          <div key={i} style={{ background: b ? '#000' : '#fff' }} />
        ))}
      </div>

      <div style={{
        width: '100%',
        background: isDark ? 'rgba(255,255,255,0.015)' : tokens.bgSurface,
        border: `1px solid ${tokens.border}`,
        borderRadius: 24, padding: 28,
        backdropFilter: 'blur(24px)',
        boxShadow: isDark ? '0 40px 80px rgba(0,0,0,0.6), 0 0 100px rgba(59,130,246,0.08)' : tokens.shadow,
        position: 'relative', zIndex: 1,
        transform: 'perspective(2000px) rotateY(-12deg) rotateX(6deg)',
      }}>

        <div style={{
          display: 'flex', justifyContent: 'space-between', alignItems: 'center',
          borderBottom: `1px solid ${tokens.border}`, paddingBottom: 14, marginBottom: 20
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <div style={{ width: 8, height: 8, borderRadius: '50%', background: '#ff5f56', boxShadow: '0 0 6px #ff5f56aa' }} />
            <div style={{ width: 8, height: 8, borderRadius: '50%', background: '#ffbd2e', boxShadow: '0 0 6px #ffbd2eaa' }} />
            <div style={{ width: 8, height: 8, borderRadius: '50%', background: '#27c93f', boxShadow: '0 0 6px #27c93faa' }} />
          </div>
          <div style={{ fontFamily: font.mono, fontSize: 9, color: tokens.textMuted, letterSpacing: '0.12em' }}>
            LAB SESSION · {SESSION_CODE}
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
            <span style={{
              width: 6, height: 6, borderRadius: '50%', background: tokens.success,
              boxShadow: `0 0 6px ${tokens.success}88`, display: 'inline-block',
              animation: 'radialGlow 2s ease-in-out infinite'
            }} />
            <span style={{ fontFamily: font.mono, fontSize: 9, color: tokens.success }}>LIVE</span>
          </div>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '100px 1fr', gap: 16, marginBottom: 20 }}>
          <div style={{ position: 'relative', width: 100, height: 100 }}>
            <div style={{
              width: 100, height: 100, background: markerBg,
              border: `4px solid ${markerBorder}`, padding: 6,
              display: 'grid', gridTemplateColumns: 'repeat(5,1fr)', gap: 1,
              boxShadow: STEPS[activeStep]?.phase === 'VERIFY'
                ? `0 0 0 2px ${tokens.success}, 0 0 20px ${tokens.success}44`
                : (isDark ? '0 8px 24px rgba(0,0,0,0.5)' : tokens.shadowCard),
              transition: 'box-shadow 0.4s ease', borderRadius: 4
            }}>
              {markerPattern.map((b, i) => <div key={i} style={{ background: b ? '#000' : '#fff' }} />)}
            </div>
            {scanning && (
              <div style={{
                position: 'absolute', left: 0, right: 0, top: `${scanLine}%`, height: 2,
                background: `linear-gradient(90deg, transparent, ${tokens.accent}, transparent)`,
                boxShadow: `0 0 8px ${tokens.accent}`,
                transition: 'top 0.016s linear', pointerEvents: 'none'
              }} />
            )}
            {[
              { top: -4, left: -4, borderTop: `2px solid ${tokens.accent}`, borderLeft: `2px solid ${tokens.accent}` },
              { top: -4, right: -4, borderTop: `2px solid ${tokens.accent}`, borderRight: `2px solid ${tokens.accent}` },
              { bottom: -4, left: -4, borderBottom: `2px solid ${tokens.accent}`, borderLeft: `2px solid ${tokens.accent}` },
              { bottom: -4, right: -4, borderBottom: `2px solid ${tokens.accent}`, borderRight: `2px solid ${tokens.accent}` },
            ].map((s, i) => (
              <div key={i} style={{ position: 'absolute', width: 14, height: 14, ...s }} />
            ))}
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', justifyContent: 'center', gap: 6 }}>
            <div style={{ fontFamily: font.mono, fontSize: 9, color: STEPS[activeStep]?.color, letterSpacing: '0.12em' }}>
              {STEPS[activeStep]?.phase} PHASE
            </div>
            <div style={{ fontSize: 15, fontWeight: 800, color: tokens.textPrimary, lineHeight: 1.2 }}>
              {STEPS[activeStep]?.icon} {STEPS[activeStep]?.label}
            </div>
            <div style={{ fontSize: 11, fontFamily: font.mono, color: tokens.textMuted }}>
              {STEPS[activeStep]?.detail}
            </div>
          </div>
        </div>

        <div style={{
          background: isDark ? 'rgba(5,12,20,0.5)' : tokens.bgPage, border: `1px solid ${tokens.border}`,
          borderRadius: 12, padding: '12px 16px', marginBottom: 14
        }}>
          <div style={{ fontSize: 9, fontFamily: font.mono, color: tokens.textMuted, marginBottom: 10, letterSpacing: '0.1em' }}>
            SESSION PIPELINE
          </div>
          <div style={{ display: 'flex', alignItems: 'center' }}>
            {STEPS.map((step, i) => (
              <React.Fragment key={i}>
                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 5, flex: 1 }}>
                  <div style={{
                    width: 28, height: 28, borderRadius: '50%',
                    background: completed(i) ? step.color : isDark ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.02)',
                    border: `2px solid ${completed(i) ? step.color : current(i) ? step.color : isDark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.08)'}`,
                    display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 12,
                    color: completed(i) ? '#fff' : tokens.textPrimary,
                    boxShadow: current(i) ? `0 0 12px ${step.color}66` : 'none',
                    transition: 'all 0.4s ease',
                    transform: current(i) ? 'scale(1.15)' : 'scale(1)'
                  }}>
                    {completed(i) ? '✓' : current(i)
                      ? <span style={{ animation: 'radialGlow 1.5s infinite' }}>●</span>
                      : '○'}
                  </div>
                  <div style={{
                    fontSize: 7, fontFamily: font.mono,
                    color: current(i) ? step.color : tokens.textMuted,
                    textAlign: 'center', maxWidth: 50, lineHeight: 1.3, transition: 'color 0.3s'
                  }}>
                    {step.phase}
                  </div>
                </div>
                {i < STEPS.length - 1 && (
                  <div style={{
                    flex: 1, height: 1, maxWidth: 24,
                    background: completed(i)
                      ? `linear-gradient(90deg, ${STEPS[i].color}, ${STEPS[i + 1].color})`
                      : isDark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.06)',
                    transition: 'background 0.5s ease', marginBottom: 16
                  }} />
                )}
              </React.Fragment>
            ))}
          </div>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 5 }}>
          {STEPS.slice(0, activeStep + 1).slice(-3).map((step, i, arr) => (
            <div key={i} style={{
              display: 'flex', alignItems: 'center', gap: 10,
              padding: '7px 12px', borderRadius: 8,
              background: i === arr.length - 1 ? `${step.color}14` : 'transparent',
              border: `1px solid ${i === arr.length - 1 ? `${step.color}30` : 'transparent'}`,
              transition: 'all 0.3s ease',
              animation: i === arr.length - 1 ? 'slideIn 0.3s ease' : 'none'
            }}>
              <span style={{ fontSize: 13 }}>{step.icon}</span>
              <span style={{ fontSize: 11, color: i === arr.length - 1 ? tokens.textPrimary : tokens.textMuted, flex: 1 }}>
                {step.label}
              </span>
              <span style={{ fontFamily: font.mono, fontSize: 9, color: step.color, opacity: i === arr.length - 1 ? 1 : 0.4 }}>
                {i === arr.length - 1 ? 'NOW' : `${(arr.length - 1 - i) * 2}s ago`}
              </span>
            </div>
          ))}
        </div>
      </div>

      <div style={{
        position: 'absolute', bottom: 0, left: 20, zIndex: 10,
        padding: '8px 16px', background: tokens.successBg,
        border: `1px solid ${tokens.successBorder}`, borderRadius: 20,
        fontSize: 11, fontFamily: font.mono, color: tokens.success,
        backdropFilter: 'blur(12px)',
        animation: 'float3d 5s ease-in-out 1s infinite',
        display: 'flex', alignItems: 'center', gap: 6,
        boxShadow: isDark ? '0 10px 30px rgba(0,0,0,0.4)' : tokens.shadowCard
      }}>
        <span style={{ width: 6, height: 6, borderRadius: '50%', background: tokens.success }} />
        ALL SYSTEMS OPERATIONAL
      </div>
    </div>
  );
}

// ── Main Landing Page ──────────────────────────────────────────────────────
export default function LandingPage() {
  const { logout } = useAuth();
  const { navigate } = useRouter();
  const { tokens, isDark } = useTheme();
  const [scrolled, setScrolled] = useState(false);
  const [activeShowcase, setActiveShowcase] = useState('admin');
  const [scrollY, setScrollY] = useState(0);

  useEffect(() => {
    const onScroll = () => {
      setScrolled(window.scrollY > 40);
      setScrollY(window.scrollY);
    };
    window.addEventListener('scroll', onScroll);
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  return (
    <>
      <link rel="preconnect" href="https://fonts.googleapis.com" />
      <link href="https://fonts.googleapis.com/css2?family=Space+Mono:wght@400;700&family=DM+Sans:wght@300;400;500;700&family=Syne:wght@800;900&family=Herr+Von+Muellerhoff&display=swap" rel="stylesheet" />
      <style>{`
        *,*::before,*::after{box-sizing:border-box;margin:0;padding:0;}
        html{scroll-behavior:smooth;background:${tokens.bgPage};}
        body{color:${tokens.textPrimary};font-family:${font.sans};overflow-x:hidden;}

        @keyframes float3d {
          0%,100%{transform:translateY(0px) rotateX(0deg) rotateY(0deg);}
          33%{transform:translateY(-10px) rotateX(3deg) rotateY(5deg);}
          66%{transform:translateY(-6px) rotateX(-2deg) rotateY(-3deg);}
        }
        @keyframes spinSlow { from{transform:rotate(0deg);}to{transform:rotate(360deg);} }
        @keyframes radialGlow { 0%,100%{opacity:0.4;transform:scale(1);}50%{opacity:0.7;transform:scale(1.08);} }
        @keyframes auraGlow { 0%,100%{box-shadow:0 0 30px rgba(6,182,212,0.2), inset 0 0 20px rgba(6,182,212,0.1);} 50%{box-shadow:0 0 60px rgba(6,182,212,0.5), inset 0 0 40px rgba(6,182,212,0.3);} }
        @keyframes scanSweep { 0%,100%{transform:translateY(-50px);opacity:0;}50%{transform:translateY(50px);opacity:1;} }
        @keyframes pulse3d { 0%,100%{box-shadow:0 30px 80px rgba(0,0,0,${isDark ? '0.9' : '0.15'}),0 0 40px rgba(6,182,212,0.15);}50%{box-shadow:0 30px 80px rgba(0,0,0,${isDark ? '0.9' : '0.15'}),0 0 80px rgba(6,182,212,0.35);} }
        @keyframes flowAnimation { from{stroke-dashoffset:20;}to{stroke-dashoffset:0;} }
        @keyframes gridFade { 0%,100%{opacity:0.03;}50%{opacity:0.06;} }
        @keyframes slideIn { from{opacity:0;transform:translateX(-20px);}to{opacity:1;transform:translateX(0);} }
        @keyframes countUp { from{opacity:0;transform:translateY(10px);}to{opacity:1;transform:translateY(0);} }

        .navlink{color:${tokens.textMuted};text-decoration:none;font-size:13px;font-family:${font.mono};letter-spacing:0.08em;transition:color 0.2s;cursor:pointer;}
        .navlink:hover{color:#3B82F6;}
        .glowbtn{transition:all 0.25s cubic-bezier(0.16,1,0.3,1);cursor:pointer;display:inline-flex;align-items:center;gap:8px;justify-content:center;}
        .glowbtn:hover{filter:brightness(1.15);transform:translateY(-2px);box-shadow:0 16px 40px rgba(59,130,246,0.35);}
        .showcase-tab{cursor:pointer;transition:all 0.2s ease;border-left:3px solid ${tokens.borderMuted};}
        .showcase-tab.active{border-left-color:#3B82F6;background:${tokens.bgSurfaceHover};}
        ::-webkit-scrollbar{width:6px;}::-webkit-scrollbar-track{background:${tokens.bgPage};}::-webkit-scrollbar-thumb{background:${tokens.borderStrong};border-radius:3px;}
        @media (min-width: 768px) {
          .nav-desktop { display: flex !important; }
        }
        @media (max-width: 767px) {
          .nav-signin { padding: 8px 12px !important; font-size: 11px !important; }
        }
      `}</style>

      <div style={{ minHeight: '100vh', background: tokens.bgPage, position: 'relative', transition: 'background 0.3s ease' }}>

        {/* Ambient radial glows */}
        <div style={{ position: 'fixed', top: 0, left: '15%', width: 700, height: 700, background: 'radial-gradient(circle, rgba(59,130,246,0.07) 0%, transparent 70%)', filter: 'blur(80px)', pointerEvents: 'none', animation: 'radialGlow 8s ease-in-out infinite', zIndex: 0 }} />
        <div style={{ position: 'fixed', top: '60vh', right: '5%', width: 500, height: 500, background: 'radial-gradient(circle, rgba(6,182,212,0.05) 0%, transparent 70%)', filter: 'blur(80px)', pointerEvents: 'none', animation: 'radialGlow 12s ease-in-out infinite reverse', zIndex: 0 }} />

        {/* Grid overlay */}
        <div style={{
          position: 'fixed', inset: 0, zIndex: 0, pointerEvents: 'none', overflow: 'hidden',
          backgroundImage: `linear-gradient(rgba(59,130,246,0.04) 1px, transparent 1px), linear-gradient(90deg, rgba(59,130,246,0.04) 1px, transparent 1px)`,
          backgroundSize: '60px 60px',
          maskImage: 'linear-gradient(to bottom, transparent 0%, rgba(0,0,0,0.5) 20%, rgba(0,0,0,0.5) 80%, transparent 100%)',
          animation: 'gridFade 6s ease-in-out infinite'
        }} />

        {/* NAVBAR */}
        <nav
          style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            zIndex: 100,
            padding: 'clamp(0px, 2vw, 60px)',
            height: 'clamp(56px, 12vw, 80px)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            background: scrolled ? tokens.bgNav : 'transparent',
            backdropFilter: scrolled ? tokens.backdropBlur : 'none',
            borderBottom: scrolled
              ? `1px solid ${tokens.border}`
              : '1px solid transparent',
            transition: 'all 0.3s ease'
          }}
        >
          {/* Logo */}
          <div
            onClick={() =>
              window.scrollTo({
                top: 0,
                behavior: 'smooth'
              })
            }
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 'clamp(8px, 2vw, 12px)',
              cursor: 'pointer'
            }}
          >
            <LabScanLogo />

            <span
              style={{
                fontFamily: "'Syne', sans-serif",
                fontWeight: 900,
                fontSize: 'clamp(16px, 4vw, 22px)',
                letterSpacing: '-0.03em',
                color: tokens.textPrimary,
                lineHeight: 1
              }}
            >
              LabScan
            </span>
          </div>

          {/* Navigation */}
          <div
            style={{
              display: 'none',
              alignItems: 'center',
              gap: 36
            }}
            className="nav-desktop"
          >
            <span
              className="navlink"
              onClick={() =>
                document
                  .getElementById('features')
                  ?.scrollIntoView({ behavior: 'smooth' })
              }
            >
              Features
            </span>

            <span
              className="navlink"
              onClick={() =>
                document
                  .getElementById('showcase')
                  ?.scrollIntoView({ behavior: 'smooth' })
              }
            >
              Showcase
            </span>

            <span
              className="navlink"
              onClick={() =>
                document
                  .getElementById('workflow')
                  ?.scrollIntoView({ behavior: 'smooth' })
              }
            >
              Workflow
            </span>

            <span
              className="navlink"
              onClick={() =>
                document
                  .getElementById('creator')
                  ?.scrollIntoView({ behavior: 'smooth' })
              }
            >
              Creator
            </span>
          </div>

          {/* CTA */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 'clamp(8px, 2vw, 12px)' }}>
            <ThemeToggle size="sm" />
            <button
              className="glowbtn nav-signin"
              onClick={() => navigate('login')}
              style={{
                ...BTN_BASE,
                padding: 'clamp(8px, 1.5vw, 10px) clamp(16px, 3vw, 24px)',
                background: tokens.btnSecondaryBg,
                border: `1px solid ${tokens.btnSecondaryBorder}`,
                borderRadius: 12,
                color: tokens.btnSecondaryText,
                fontSize: 'clamp(11px, 2vw, 12px)',
                fontWeight: 700,
                backdropFilter: 'blur(12px)'
              }}
            >
              Sign In
            </button>
          </div>
        </nav>

        {/* ── HERO ───────────────────────────────────────────────────────── */}
        <section style={{
          width: '100%', minHeight: '100vh', padding: 'clamp(80px, 12vw, 80px) clamp(16px, 5vw, 60px) clamp(24px, 8vw, 40px)',
          display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: 'clamp(24px, 5vw, 60px)',
          alignItems: 'center', position: 'relative', zIndex: 1, overflow: 'hidden'
        }}>
          <ParticleField />

          {/* Left — copy */}
          <div style={{ display: 'flex', flexDirection: 'column', textAlign: 'left', position: 'relative', zIndex: 2 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 16 }}>
              <div style={{ width: 32, height: 1, background: tokens.accent }} />
              <div style={{ fontFamily: font.mono, fontSize: 11, color: tokens.accent, letterSpacing: '0.15em', fontWeight: 700, textTransform: 'uppercase' }}>LABORATORY INTELLIGENCE PLATFORM</div>
            </div>

            <h1 style={{
              fontFamily: "'Syne', sans-serif", fontWeight: 900,
              fontSize: 'clamp(1.8rem, 5.2vw, 6rem)', lineHeight: 0.95,
              letterSpacing: '-0.04em', color: tokens.textPrimary, marginBottom: 'clamp(16px, 4vw, 28px)'
            }}>
              The operating system for laboratory education.
            </h1>

            <p style={{ fontSize: 'clamp(14px, 2vw, 16px)', color: tokens.textMuted, lineHeight: 1.6, maxWidth: 520, marginBottom: 'clamp(24px, 5vw, 40px)' }}>
              Create experiments. Launch sessions. Scan markers. Review submissions. All from one premium platform designed to completely modernise the class lab experience.
            </p>

            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 'clamp(12px, 3vw, 16px)', marginBottom: 'clamp(24px, 5vw, 48px)' }}>
              <button className="glowbtn" onClick={() => navigate('login')} style={{ ...BTN_BASE, padding: '16px 36px', background: tokens.accentGrad, border: 'none', borderRadius: 12, color: '#ffffff', fontWeight: 700, fontSize: 13 }}>
                Start Lab →
              </button>
              <button className="glowbtn" onClick={() => navigate('join-session')} style={{ ...BTN_BASE, padding: '16px 32px', background: tokens.btnSecondaryBg, border: `1px solid ${tokens.btnSecondaryBorder}`, borderRadius: 12, color: tokens.btnSecondaryText, fontWeight: 700, fontSize: 13 }}>
                Join Session
              </button>
            </div>

            <div style={{ display: 'flex', gap: 10 }}>
              {[
                { label: 'Admin',   color: tokens.accent },
                { label: 'Faculty', color: '#9333EA' },
                { label: 'Student', color: tokens.success }
              ].map((pill, i) => (
                <div key={i} style={{
                  padding: '6px 14px', borderRadius: 20,
                  background: `${pill.color}14`, border: `1px solid ${pill.color}44`,
                  fontSize: 12, fontFamily: font.mono, color: pill.color,
                  boxShadow: isDark ? '0 0 20px rgba(0,0,0,0.4)' : 'none',
                  animation: `float3d ${5 + i}s ease-in-out ${i * 0.5}s infinite`,
                  backdropFilter: 'blur(8px)'
                }}>
                  {pill.label}
                </div>
              ))}
            </div>
          </div>

          {/* Right — Live Session Terminal */}
          <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', position: 'relative', zIndex: 2 }}>
            <LiveSessionTerminal />
          </div>
        </section>

        {/* ── STATS ─────────────────────────────────────────────────────── */}
        <section style={{ width: '100%', padding: 'clamp(24px, 4vw, 40px) clamp(16px, 5vw, 60px)', borderTop: `1px solid ${tokens.border}`, borderBottom: `1px solid ${tokens.border}`, background: isDark ? 'rgba(255,255,255,0.005)' : 'rgba(0,0,0,0.005)', position: 'relative', zIndex: 1 }}>
          <div style={{ maxWidth: 1240, margin: '0 auto', display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))', gap: 'clamp(12px, 3vw, 24px)' }}>
            <StatItem value="500+" label="Student Submissions" />
            <StatItem value="50+"  label="Lab Sessions Conducted" />
            <StatItem value="5+"   label="Departments Deployed" />
            <StatItem value="3"    label="Discrete User Roles Map" />
          </div>
        </section>

        {/* ── PRODUCT SHOWCASE ──────────────────────────────────────────── */}
        <section id="showcase" style={{ width: '100%', padding: 'clamp(40px, 8vw, 100px) clamp(16px, 5vw, 60px)', maxWidth: 1240, margin: '0 auto', position: 'relative', zIndex: 1 }}>
          <div style={{ textAlign: 'center', marginBottom: 60 }}>
            <div style={{ fontFamily: font.mono, fontSize: 11, letterSpacing: '0.15em', color: tokens.accent, textTransform: 'uppercase', marginBottom: 12 }}>PRODUCT ARCHITECTURES</div>
            <h2 style={{ fontFamily: "'Syne', sans-serif", fontWeight: 900, fontSize: 38, letterSpacing: '-0.02em', color: tokens.textPrimary }}>One platform. Three perspectives.</h2>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '320px 1fr', gap: 48, alignItems: 'center' }}>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              {[
                { id: 'admin',   label: 'System Admin Console',      d1: 'Provision authorized faculty',    d2: 'Manage structural data pools',    d3: 'Monitor systemic usage blocks' },
                { id: 'faculty', label: 'Faculty Management Deck', d1: 'Create explicit lab experiments',   d2: 'Launch timed session code slots',  d3: 'Review submitted data live' },
                { id: 'student', label: 'Student Terminal Matrix', d1: 'Join channels via session flags',  d2: 'Scan mathematical ArUco tags',     d3: 'Transmit output documentation' }
              ].map((tab) => (
                <div
                  key={tab.id}
                  className={`showcase-tab ${activeShowcase === tab.id ? 'active' : ''}`}
                  onClick={() => setActiveShowcase(tab.id)}
                  style={{ padding: 20, borderRadius: '0 12px 12px 0' }}
                >
                  <div style={{ fontSize: 15, fontWeight: 700, color: activeShowcase === tab.id ? tokens.textPrimary : tokens.textMuted }}>{tab.label}</div>
                  {activeShowcase === tab.id && (
                    <div style={{ marginTop: 12, display: 'flex', flexDirection: 'column', gap: 6, fontSize: 12, color: tokens.textMuted, animation: 'slideIn 0.3s ease' }}>
                      {[tab.d1, tab.d2, tab.d3].map((d, i) => <div key={i}>▪ {d}</div>)}
                    </div>
                  )}
                </div>
              ))}
            </div>

            <div style={{
              background: tokens.bgCard, border: `1px solid ${tokens.border}`, borderRadius: 24,
              padding: 40, height: 380, display: 'flex', flexDirection: 'column', justifyContent: 'center',
              position: 'relative', overflow: 'hidden',
              transform: 'perspective(1200px) rotateY(-3deg) rotateX(2deg)',
              boxShadow: isDark ? '0 30px 60px rgba(0,0,0,0.5), 0 0 80px rgba(59,130,246,0.05)' : tokens.shadow
            }}>
              <div style={{ position: 'absolute', top: 0, right: 0, width: 200, height: 200, opacity: 0.04, backgroundImage: `linear-gradient(${tokens.textPrimary} 1px, transparent 1px), linear-gradient(90deg, ${tokens.textPrimary} 1px, transparent 1px)`, backgroundSize: '20px 20px' }} />
              <div style={{ position: 'absolute', top: 16, right: 20, fontFamily: font.mono, fontSize: 10, color: tokens.textDimmer }}>PERSPECTIVE_MOCK_ENV_v2</div>

              {activeShowcase === 'admin' && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 16, animation: 'slideIn 0.3s ease' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8, color: tokens.accent }}><Layers size={14} /><span style={{ fontFamily: font.mono, fontSize: 11 }}>ROOT OVERRIDE CONTROL</span></div>
                  <h3 style={{ fontSize: 24, fontWeight: 800, color: tokens.textPrimary }}>Institutional Infrastructure Center</h3>
                  <p style={{ fontSize: 14, color: tokens.textMuted, lineHeight: 1.6 }}>Deploy global database records that backstop institutional operations. Provision clean credentials across entire departmental frames without handling localized configuration trees.</p>
                </div>
              )}
              {activeShowcase === 'faculty' && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 16, animation: 'slideIn 0.3s ease' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8, color: '#9333EA' }}><UserCheck size={14} /><span style={{ fontFamily: font.mono, fontSize: 11 }}>INSTRUCTION VECTOR</span></div>
                  <h3 style={{ fontSize: 24, fontWeight: 800, color: tokens.textPrimary }}>Automated Session Multiplex</h3>
                  <p style={{ fontSize: 14, color: tokens.textMuted, lineHeight: 1.6 }}>Initialize class slots instantly. Evaluates captured student photos, tracks student group roll listings under a secure socket link, and logs metrics variables in real-time.</p>
                </div>
              )}
              {activeShowcase === 'student' && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 16, animation: 'slideIn 0.3s ease' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8, color: tokens.success }}><Monitor size={14} /><span style={{ fontFamily: font.mono, fontSize: 11 }}>WORKSPACE TERMINAL</span></div>
                  <h3 style={{ fontSize: 24, fontWeight: 800, color: tokens.textPrimary }}>Fluid Verification Canvas</h3>
                  <p style={{ fontSize: 14, color: tokens.textMuted, lineHeight: 1.6 }}>A seamless layout that lets students register team dependencies, invoke the machine camera scanner to clear structural ArUco locks, and receive instant marks cascades.</p>
                </div>
              )}
            </div>
          </div>
        </section>

        {/* ── BENTO FEATURE GRID ────────────────────────────────────────── */}
        <section id="features" style={{ width: '100%', padding: '100px 60px', maxWidth: 1240, margin: '0 auto', position: 'relative', zIndex: 1 }}>
          <div style={{ marginBottom: 48 }}>
            <div style={{ fontFamily: font.mono, fontSize: 11, letterSpacing: '0.15em', color: tokens.accent, textTransform: 'uppercase', marginBottom: 12 }}>CORE MATRIX UTILITIES</div>
            <h2 style={{ fontFamily: "'Syne', sans-serif", fontWeight: 900, fontSize: 38, letterSpacing: '-0.02em', color: tokens.textPrimary }}>Everything needed to run a modern lab.</h2>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1.2fr', gap: 20 }}>
            <BentoCard3D>
              <div style={{ width: 44, height: 44, borderRadius: 10, background: 'rgba(6,182,212,0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: tokens.accent, marginBottom: 16 }}><Scan size={18} /></div>
              <h4 style={{ fontSize: 16, fontWeight: 800, color: tokens.textPrimary, marginBottom: 6 }}>Deterministic ArUco Scan</h4>
              <p style={{ fontSize: 13, color: tokens.textMuted, lineHeight: 1.5 }}>Enforces protocol compliance. Prevents premature document rendering before group verification targets settle.</p>
            </BentoCard3D>

            <BentoCard3D>
              <div style={{ width: 44, height: 44, borderRadius: 10, background: 'rgba(16,185,129,0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: tokens.success, marginBottom: 16 }}><Activity size={18} /></div>
              <h4 style={{ fontSize: 16, fontWeight: 800, color: tokens.textPrimary, marginBottom: 6 }}>Socket Live Stream Monitor</h4>
              <p style={{ fontSize: 13, color: tokens.textMuted, lineHeight: 1.5 }}>Bi-directional payload pipelines broadcast updates. Instructors watch files stream into active views without refreshing frames.</p>
            </BentoCard3D>

            <BentoCard3D>
              <div style={{ width: 44, height: 44, borderRadius: 10, background: 'rgba(59,130,246,0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: tokens.accent, marginBottom: 16 }}><Users size={18} /></div>
              <h4 style={{ fontSize: 16, fontWeight: 800, color: tokens.textPrimary, marginBottom: 6 }}>Group Lab Coordination</h4>
              <p style={{ fontSize: 13, color: tokens.textMuted, lineHeight: 1.5 }}>Map multi-student parameters directly inside single session arrays to process data packages cleanly as a unit.</p>
            </BentoCard3D>

            <BentoCard3D>
              <div style={{ width: 44, height: 44, borderRadius: 10, background: 'rgba(245,158,11,0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: tokens.warning, marginBottom: 16 }}><Camera size={18} /></div>
              <h4 style={{ fontSize: 16, fontWeight: 800, color: tokens.textPrimary, marginBottom: 6 }}>Verified Photo Upload</h4>
              <p style={{ fontSize: 13, color: tokens.textMuted, lineHeight: 1.5 }}>Capture immediate experiment observation frames. Eliminates abstract manual entry, backup logs, and data tampering.</p>
            </BentoCard3D>

            <BentoCard3D style={{ gridColumn: 'span 2', display: 'flex', flexDirection: 'row', gap: 24, alignItems: 'center' }}>
              <div style={{ width: 44, height: 44, borderRadius: 10, background: tokens.bgSurfaceHover, display: 'flex', alignItems: 'center', justifyContent: 'center', color: tokens.textPrimary, flexShrink: 0 }}><Cpu size={18} /></div>
              <div>
                <h4 style={{ fontSize: 16, fontWeight: 800, color: tokens.textPrimary, marginBottom: 6 }}>Multi-Department Support Layer</h4>
                <p style={{ fontSize: 13, color: tokens.textMuted, lineHeight: 1.5 }}>Architecture explicitly maps parameters across fields—Computer Science, Electronics, Mechanical Engineering, Civil, and Chemical—with customized data layouts optimized per syllabus requirement.</p>
              </div>
            </BentoCard3D>
          </div>
        </section>

        {/* ── WORKFLOW ──────────────────────────────────────────────────── */}
        <section id="workflow" style={{ width: '100%', padding: '100px 60px', maxWidth: 1000, margin: '0 auto', position: 'relative', zIndex: 1 }}>
          <div style={{ textAlign: 'center', marginBottom: 64 }}>
            <div style={{ fontFamily: font.mono, fontSize: 11, letterSpacing: '0.15em', color: tokens.accent, textTransform: 'uppercase', marginBottom: 12 }}>SYSTEM TIMELINE FLOW</div>
            <h2 style={{ fontFamily: "'Syne', sans-serif", fontWeight: 900, fontSize: 38, letterSpacing: '-0.02em', color: tokens.textPrimary }}>From setup to submission.</h2>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: 20, position: 'relative' }}>
            <svg style={{ position: 'absolute', top: 36, left: '12%', width: '76%', height: 4, zIndex: 0 }} fill="none" xmlns="http://www.w3.org/2000/svg">
              <line x1="0" y1="2" x2="100%" y2="2" stroke={tokens.border} strokeWidth="2" strokeDasharray="6 6" />
              <line x1="0" y1="2" x2="100%" y2="2" stroke="url(#flowGrad)" strokeWidth="2" strokeDasharray="8 12" style={{ animation: 'flowAnimation 2s linear infinite' }} />
              <defs>
                <linearGradient id="flowGrad" x1="0%" y1="0%" x2="100%" y2="0%">
                  <stop offset="0%" stopColor="#3B82F6" />
                  <stop offset="100%" stopColor="#06B6D4" />
                </linearGradient>
              </defs>
            </svg>

            {[
              { role: 'Admin',    tag: 'SYSTEM LEVEL', desc: 'Provisions secure accounts and maps structural database bounds.',        icon: '⚙️', color: tokens.accent },
              { role: 'Faculty',  tag: 'DEPLOY MODE',  desc: 'Launches timed sessions and yields 6-char cluster keys.',                 icon: '💼', color: '#9333EA' },
              { role: 'Students', tag: 'INPUT MATRIX', desc: 'Join groups and sweep camera inputs over hardware cards.',               icon: '📱', color: tokens.success },
              { role: 'Review',    tag: 'EVALUATION',   desc: 'Data logs cascade live into teacher grids for instant marking.',         icon: '⚡', color: tokens.warning }
            ].map((node, i) => (
              <IsoNode key={i} {...node} index={i} delay={`${i * 0.15}s`} />
            ))}
          </div>
        </section>

        {/* ── ARUCO SCANNER SHOWCASE ────────────────────────────────────── */}
        <section style={{ width: '100%', padding: '100px 60px', background: isDark ? 'rgba(255,255,255,0.003)' : 'rgba(0,0,0,0.002)', borderTop: `1px solid ${tokens.border}`, borderBottom: `1px solid ${tokens.border}`, position: 'relative', zIndex: 1 }}>
          <div style={{ maxWidth: 1240, margin: '0 auto', display: 'grid', gridTemplateColumns: '1fr 1.4fr', gap: 64, alignItems: 'start' }}>
            <div>
              <div style={{ fontFamily: font.mono, fontSize: 11, letterSpacing: '0.15em', color: tokens.accent, textTransform: 'uppercase', marginBottom: 12 }}>CORE PROPRIETARY USP</div>
              <h2 style={{ fontFamily: "'Syne', sans-serif", fontWeight: 900, fontSize: 38, letterSpacing: '-0.02em', color: tokens.textPrimary, marginBottom: 20 }}>Scanning built for laboratories.</h2>
              <p style={{ fontSize: 15, color: tokens.textMuted, lineHeight: 1.6, marginBottom: 32 }}>LabScan replaces loose sign-off lists with strict, localized computer-vision triggers. The platform evaluates spatial ArUco arrays to assure student validation before data ingest locks clear.</p>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20 }}>
                {[
                  { t: 'Instant Detection',     d: 'Reads frame tokens in under 40ms via standard webcams.' },
                  { t: 'Group Validation',      d: 'Matches active teammate hashes before clearing blocks.' },
                  { t: 'Session Verification', d: 'Assures keys correlate with currently mounted slots.' },
                  { t: 'Observation Capture',  d: 'Pairs visual tag parameters with real physical outputs.' }
                ].map((item, i) => (
                  <div key={i}>
                    <div style={{ fontSize: 14, fontWeight: 800, color: tokens.textPrimary, marginBottom: 4, display: 'flex', alignItems: 'center', gap: 6 }}>
                      <span style={{ color: tokens.accent }}>✔</span> {item.t}
                    </div>
                    <div style={{ fontSize: 12, color: tokens.textMuted, lineHeight: 1.4 }}>{item.d}</div>
                  </div>
                ))}
              </div>
            </div>
            <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: 460 }}>
              <OrbitalScanner />
            </div>
          </div>
        </section>

        {/* ── DEPARTMENTS ───────────────────────────────────────────────── */}
        <section id="departments" style={{ width: '100%', padding: '100px 60px', maxWidth: 1240, margin: '0 auto', position: 'relative', zIndex: 1 }}>
          <div style={{ textAlign: 'center', marginBottom: 54 }}>
            <div style={{ fontFamily: font.mono, fontSize: 11, letterSpacing: '0.15em', color: tokens.accent, textTransform: 'uppercase', marginBottom: 12 }}>DEPT LAYER COMPATIBILITY</div>
            <h2 style={{ fontFamily: "'Syne', sans-serif", fontWeight: 900, fontSize: 38, letterSpacing: '-0.02em', color: tokens.textPrimary }}>Built for every department.</h2>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(180px, 1fr))', gap: 16 }}>
            {[
              { d: 'Computer Science',          ex: '24 Experiments' },
              { d: 'Electronics & Comm',        ex: '16 Experiments' },
              { d: 'Electrical & Electronics',  ex: '12 Experiments' },
              { d: 'Mechanical Eng',            ex: '14 Experiments' },
              { d: 'Civil Infrastructure',      ex: '10 Experiments' },
              { d: 'Chemical Systems',          ex: '8 Experiments'  }
            ].map((item, i) => (
              <BentoCard3D key={i} style={{ padding: '24px 20px', textAlign: 'center', display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                <div style={{ fontSize: 24, marginBottom: 12 }}>⚙️</div>
                <div style={{ fontSize: 14, fontWeight: 800, color: tokens.textPrimary, marginBottom: 4 }}>{item.d}</div>
                <div style={{ fontSize: 11, fontFamily: font.mono, color: tokens.textMuted }}>{item.ex}</div>
              </BentoCard3D>
            ))}
          </div>
        </section>

        {/* ── UPGRADED YC-STYLE CREATOR SECTION ─────────────────────────── */}
        <section id="creator" style={{ width: '100%', padding: '120px 60px', background: tokens.bgPage, borderTop: `1px solid ${tokens.border}`, position: 'relative', zIndex: 1, transition: 'background 0.3s ease' }}>
          <div style={{ maxWidth: 1140, margin: '0 auto', display: 'grid', gridTemplateColumns: '1fr 1.4fr', gap: 64, alignItems: 'start' }}>
            
            {/* Left Column — Startup Portrait Hub */}
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', position: 'sticky', top: 120 }}>
              <div style={{
                position: 'relative', width: 300, height: 360,
                borderRadius: 24, padding: 12,
                transform: 'perspective(1000px) rotateY(6deg) rotateX(3deg)',
                background: tokens.bgCard,
                border: `1px solid ${tokens.border}`,
                boxShadow: isDark ? '0 40px 80px rgba(0,0,0,0.7)' : tokens.shadow,
                animation: 'float3d 7s ease-in-out infinite'
              }}>
                {/* Dynamic Cyan Aura Glow Backdrops */}
                <div style={{ position: 'absolute', inset: -4, borderRadius: 28, padding: 2, background: 'linear-gradient(135deg, #06b6d4, transparent, #3b82f6)', opacity: isDark ? 0.8 : 0.4, zIndex: 0, animation: 'auraGlow 4s ease-in-out infinite' }} />
                
                <div style={{ width: '100%', height: '100%', background: isDark ? '#050c14' : '#f1f5f9', borderRadius: 16, overflow: 'hidden', position: 'relative', zIndex: 1 }}>
                  <img src="/profile.jpeg" alt="Deva Harsha Veerla" style={{ width: '100%', height: '100%', objectFit: 'cover', opacity: isDark ? 0.9 : 1.0 }} />
                  
                  {/* Micro Badge Link */}
                  <div style={{ position: 'absolute', top: 16, right: 16, background: 'rgba(6, 182, 212, 0.15)', backdropFilter: 'blur(12px)', padding: '6px 12px', borderRadius: 20, border: '1px solid rgba(6,182,212,0.3)' }}>
                    <div style={{ fontFamily: font.mono, fontSize: 8, color: '#06b6d4', fontWeight: 700, letterSpacing: '0.05em' }}>YC W26 PATTERN</div>
                  </div>
                </div>
              </div>

              {/* Mini Metrics Showcase Row */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, width: 300, marginTop: 24 }}>
                <div style={{ padding: '14px', background: tokens.bgCard, border: `1px solid ${tokens.border}`, borderRadius: 12, textAlign: 'center' }}>
                  <div style={{ fontFamily: font.mono, fontSize: 16, fontWeight: 700, color: '#06b6d4' }}>120+</div>
                  <div style={{ fontSize: 8, fontFamily: font.mono, color: tokens.textMuted, marginTop: 2 }}>LEETCODE SOLVED</div>
                </div>
                <div style={{ padding: '14px', background: tokens.bgCard, border: `1px solid ${tokens.border}`, borderRadius: 12, textAlign: 'center' }}>
                  <div style={{ fontFamily: font.mono, fontSize: 16, fontWeight: 700, color: tokens.success }}>Next.js</div>
                  <div style={{ fontSize: 8, fontFamily: font.mono, color: tokens.textMuted, marginTop: 2 }}>STACK ENGINE</div>
                </div>
              </div>
            </div>

            {/* Right Column — Founder Narrative Frame */}
            <div style={{ position: 'relative' }}>
              
              {/* Trust Badge */}
              <div style={{ display: 'inline-flex', alignItems: 'center', gap: 6, padding: '6px 14px', background: 'rgba(59,130,246,0.08)', border: '1px solid rgba(59,130,246,0.2)', borderRadius: 100, marginBottom: 20 }}>
                <span style={{ width: 5, height: 5, borderRadius: '50%', background: '#3b82f6' }} />
                <span style={{ fontFamily: font.mono, fontSize: 9, color: '#3b82f6', fontWeight: 700, letterSpacing: '0.06em', textTransform: 'uppercase' }}>Built by students, for institutions</span>
              </div>

              <div style={{ fontFamily: font.mono, fontSize: 11, letterSpacing: '0.15em', color: '#06b6d4', textTransform: 'uppercase', marginBottom: 12, fontWeight: 700 }}>FOUNDER STORY</div>
              
              {/* Quote-style SaaS Headline */}
              <h2 style={{ fontFamily: "'Syne', sans-serif", fontWeight: 900, fontSize: 'clamp(28px, 3.5vw, 44px)', letterSpacing: '-0.03em', color: tokens.textPrimary, lineHeight: 1.1, marginBottom: 28 }}>
                “Engineering labs shouldn't run on loose paper maps and broken spreadsheets.”
              </h2>

              <div style={{ fontSize: 15, color: tokens.textMuted, lineHeight: 1.7, marginBottom: 36, display: 'flex', flexDirection: 'column', gap: 16 }}>
                <p>I engineered LabScan because manual check-in sheets and delayed grading output arrays inside college blocks are fundamentally broken. Dealing with physical logs shouldn't delay real laboratory experimentation time.</p>
                <p>As a Full-Stack Web Engineer specializing in Next.js, React, and TypeScript alongside multi-agent AI framework research, I built this operating infrastructure from the ground up to bring absolute transparency to academic records data tracking.</p>
              </div>

              {/* Signature + Profile Footer Wrapper */}
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', flexWrap: 'wrap', gap: 24, borderTop: `1px solid ${tokens.border}`, paddingTop: 24 }}>
                <div>
                  {/* Founder Cursive Signature Synthesis */}
                  <div style={{ fontFamily: "'Herr Von Muellerhoff', cursive", fontSize: 54, color: '#06b6d4', lineHeight: 0.6, opacity: 0.85, marginBottom: 8, userSelect: 'none' }}>
                    Deva Harsha Veerla
                  </div>
                  <div style={{ fontSize: 14, fontWeight: 800, color: tokens.textPrimary }}>Deva Harsha Veerla</div>
                  <div style={{ fontSize: 11, fontFamily: font.mono, color: tokens.textMuted, marginTop: 2, textTransform: 'uppercase', letterSpacing: '0.04em' }}>Founder & Lead Full-Stack Engineer</div>
                </div>

                {/* Social links */}
                <div style={{ display: 'flex', gap: 10 }}>
                  {[
                    { label: 'GitHub',    href: 'https://github.com/deva-harsha-v' },
                    { label: 'LinkedIn',  href: 'https://linkedin.com/in/devaharshaveerla' },
                    { label: 'Portfolio', href: 'https://devaharshadev.netlify.app/' }
                  ].map((link, i) => (
                    <a key={i} href={link.href} target="_blank" rel="noreferrer" className="navlink" style={{
                      background: tokens.bgCard, border: `1px solid ${tokens.border}`,
                      padding: '10px 18px', borderRadius: 10, transition: 'all 0.2s ease', fontSize: 11
                    }}>{link.label}</a>
                  ))}
                </div>
              </div>

            </div>
          </div>
        </section>

        {/* ── FINAL CTA ─────────────────────────────────────────────────── */}
        <section style={{ width: '100%', padding: '100px 60px 140px', textAlign: 'center', position: 'relative', zIndex: 1 }}>
          <div style={{ position: 'absolute', bottom: '5%', left: '50%', transform: 'translateX(-50%) perspective(400px) rotateX(60deg)', width: 600, height: 100, background: 'radial-gradient(ellipse, rgba(59,130,246,0.15) 0%, transparent 70%)', filter: 'blur(20px)', pointerEvents: 'none' }} />
          <div style={{ position: 'absolute', bottom: '15%', left: '50%', transform: 'translateX(-50%)', width: 400, height: 400, background: 'radial-gradient(circle, rgba(59,130,246,0.08) 0%, transparent 70%)', filter: 'blur(60px)', pointerEvents: 'none' }} />

          <div style={{
            display: 'inline-block', padding: '64px 80px',
            border: `1px solid ${tokens.border}`, borderRadius: 32,
            background: `linear-gradient(180deg, ${isDark ? 'rgba(255,255,255,0.025)' : 'rgba(14,165,233,0.025)'}, transparent)`,
            backdropFilter: 'blur(24px)', maxWidth: 800, position: 'relative', zIndex: 1,
            transform: 'perspective(1200px) rotateX(2deg)',
            boxShadow: isDark ? '0 40px 80px rgba(0,0,0,0.4), 0 0 100px rgba(59,130,246,0.06)' : tokens.shadow
          }}>
            <h2 style={{ fontFamily: "'Syne', sans-serif", fontWeight: 900, fontSize: 38, letterSpacing: '-0.02em', color: tokens.textPrimary, marginBottom: 14 }}>Ready to modernize your laboratory workflow?</h2>
            <p style={{ color: tokens.textMuted, fontSize: 15, marginBottom: 36, maxWidth: 460, margin: '0 auto 36px', lineHeight: 1.5 }}>Deploy the system architecture across your department. Start using LabScan today.</p>
            <div style={{ display: 'flex', gap: 14, justifyContent: 'center' }}>
              <button className="glowbtn" onClick={() => navigate('login')} style={{ ...BTN_BASE, padding: '14px 36px', background: tokens.accentGrad, borderRadius: 12, color: '#ffffff', fontWeight: 700, fontSize: 13 }}>Sign In Terminal</button>
              <button className="glowbtn" onClick={() => navigate('join-session')} style={{ ...BTN_BASE, padding: '14px 32px', background: tokens.btnSecondaryBg, border: `1px solid ${tokens.btnSecondaryBorder}`, borderRadius: 12, color: tokens.btnSecondaryText, fontWeight: 700, fontSize: 13 }}>Join Session</button>
            </div>
          </div>
        </section>

        {/* ── FOOTER ────────────────────────────────────────────────────── */}
        <footer style={{ width: '100%', borderTop: `1px solid ${tokens.border}`, padding: '40px 60px', display: 'flex', flexDirection: 'column', gap: 24, background: isDark ? '#01030a' : '#f1f5f9', position: 'relative', zIndex: 1, transition: 'background 0.3s ease' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: 20 }}>
            <div>
              <div style={{ fontSize: 18, fontWeight: 900, color: tokens.textPrimary, fontFamily: "'Syne', sans-serif" }}>LabScan</div>
              <div style={{ fontSize: 12, color: tokens.textMuted, marginTop: 4, fontFamily: font.mono }}>LABORATORY INTELLIGENCE PLATFORM</div>
            </div>
            <div style={{ display: 'flex', gap: 40 }}>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                <span style={{ fontFamily: font.mono, fontSize: 11, color: tokens.textPrimary, fontWeight: 700 }}>STRUCTURE</span>
                <span className="navlink" onClick={() => document.getElementById('features')?.scrollIntoView({ behavior: 'smooth' })}>Features</span>
                <span className="navlink" onClick={() => document.getElementById('workflow')?.scrollIntoView({ behavior: 'smooth' })}>Workflow</span>
                <span className="navlink" onClick={() => document.getElementById('creator')?.scrollIntoView({ behavior: 'smooth' })}>Creator Studio</span>
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                <span style={{ fontFamily: font.mono, fontSize: 11, color: tokens.textPrimary, fontWeight: 700 }}>NETWORKS</span>
                <a href="https://github.com/deva-harsha-v" target="_blank" rel="noreferrer" className="navlink">GitHub</a>
                <a href="https://linkedin.com/in/devaharshaveerla" target="_blank" rel="noreferrer" className="navlink">LinkedIn</a>
              </div>
            </div>
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderTop: `1px solid ${tokens.borderMuted}`, paddingTop: 20, fontSize: 11, fontFamily: font.mono, color: tokens.textDimmer }}>
            <span>© 2026 LabScan · Core Matrix Suite</span>
            <span>Built by Deva Harsha Veerla</span>
          </div>
        </footer>

      </div>
    </>
  );
}