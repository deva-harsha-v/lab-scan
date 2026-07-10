import React, { useState, useEffect, useCallback, useRef } from 'react';
import LabScanLogo from '../../components/LabScanLogo';
import { useRouter } from '../../App';
import { useAuth } from '../../context/AuthContext';
import { studentApi } from '../../api/student.api';
import { useSocket } from '../../hooks/useSocket';
import { useTheme } from '../../context/ThemeContext';

const font = { mono: "'Space Mono',monospace", sans: "'DM Sans',sans-serif" };

function tokensToC(tokens) {
  return {
    bg: tokens.bgPage, surface: tokens.bgSurface, border: tokens.border,
    borderAccent: tokens.borderAccent, accent: tokens.accent, accentGrad: tokens.accentGrad,
    text: tokens.textPrimary, muted: tokens.textMuted, dimmer: tokens.textDimmer,
    error: tokens.danger, success: tokens.success, warn: tokens.warning,
  };
}

function parseDescription(raw) {
  if (!raw) return null;
  try {
    const obj = JSON.parse(raw);
    return obj.summary || obj.description || obj.title || obj.text || null;
  } catch (_) {
    return raw;
  }
}

// ── Score percentage badge ────────────────────────────────────────────────────
function ScoreBadge({ marks, maxMarks }) {
  const { tokens } = useTheme();
  const C = tokensToC(tokens);
  
  const validMax = parseInt(maxMarks) || 10;
  const validMarks = parseInt(marks) || 0;
  
  if (marks === null || marks === undefined) return null;
  const pct = validMax > 0 ? Math.round((validMarks / validMax) * 100) : 0;
  const grade = pct >= 80 ? 'A' : pct >= 60 ? 'B' : pct >= 40 ? 'C' : 'D';
  const col = pct >= 80 ? C.success : pct >= 60 ? C.accent : pct >= 40 ? C.warn : C.error;
  return (
    <span style={{
      display: 'inline-flex', alignItems: 'center', gap: 4,
      padding: '3px 8px', borderRadius: 20,
      background: `${col}18`, border: `1px solid ${col}44`,
      color: col, fontFamily: font.mono, fontSize: 10, fontWeight: 700,
    }}>
      {grade} · {pct}%
    </span>
  );
}

// ── Status chip ───────────────────────────────────────────────────────────────
function StatusChip({ status, marks, maxMarks }) {
  const { tokens } = useTheme();
  const C = tokensToC(tokens);
  
  const validMax = parseInt(maxMarks) || 10;
  const validMarks = parseInt(marks) || 0;

  if (status === 'REVIEWED' && marks !== null) {
    const pct = validMax > 0 ? validMarks / validMax : 0;
    const col = pct >= 0.8 ? C.success : pct >= 0.5 ? C.accent : C.warn;
    return (
      <span style={{ display: 'inline-flex', alignItems: 'center', gap: 5, padding: '4px 10px', borderRadius: 20, background: `rgba(${pct >= 0.8 ? '74,240,196' : '99,210,255'},0.08)`, border: `1px solid ${col}33`, color: col, fontFamily: font.mono, fontSize: 11 }}>
        ✓ {validMarks}/{validMax}
      </span>
    );
  }
  if (status === 'SUBMITTED') {
    return <span style={{ display: 'inline-flex', alignItems: 'center', gap: 5, padding: '4px 10px', borderRadius: 20, background: 'rgba(251,191,36,0.08)', border: '1px solid rgba(251,191,36,0.25)', color: C.warn, fontFamily: font.mono, fontSize: 11 }}>⏳ Pending</span>;
  }
  return <span style={{ display: 'inline-flex', alignItems: 'center', gap: 5, padding: '4px 10px', borderRadius: 20, background: tokens.bgInput, border: `1px solid ${C.border}`, color: C.muted, fontFamily: font.mono, fontSize: 11 }}>○ Not done</span>;
}

// ── RECTIFIED MARKS TREND MINI-CHART (STAYS INSIDE THE BOX) ───────────────────
function MarksMiniChart({ slots }) {
  const { tokens } = useTheme();
  const C = tokensToC(tokens);
  const reviewed = slots.filter(s => s.record?.status === 'REVIEWED' && s.record?.marks !== null);
  if (reviewed.length === 0) return null;

  // Segment the vertical layout bounds explicitly to isolate the bar height parameters
  const LABEL_H = 14;      
  const MAX_BAR_H = 46;    
  const SUBTEXT_H = 14;    
  const GAP = 12;
  const BAR_W = 28;

  const chartHeight = LABEL_H + MAX_BAR_H + SUBTEXT_H;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
      <div style={{ fontFamily: font.mono, fontSize: 9, color: C.muted, letterSpacing: '0.1em', textTransform: 'uppercase', fontWeight: 700 }}>MARKS TREND</div>
      <div style={{ display: 'flex', alignItems: 'flex-end', gap: GAP, height: chartHeight, padding: '0 4px' }}>
        {reviewed.map((s, i) => {
          const slotMax = parseInt(s.record?.maxMarks || s.maxMarks) || 10;
          const slotMarks = parseInt(s.record?.marks) || 0;
          const pct = slotMax > 0 ? slotMarks / slotMax : 0;
          const col = pct >= 0.8 ? C.success : pct >= 0.5 ? C.accent : C.warn;
          
          // Normalized bar height remains entirely locked inside specified boundary
          const barH = Math.max(4, Math.round(pct * MAX_BAR_H));
          
          return (
            <div key={s.id || i} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', width: BAR_W, height: '100%', justifyContent: 'flex-end' }}>
              
              {/* Dynamic marks label tracking safely aligned inside box */}
              <div style={{ height: LABEL_H, display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: 4 }}>
                <span style={{ fontFamily: font.mono, fontSize: 9, color: col, fontWeight: 700, lineHeight: 1 }}>
                  {slotMarks}
                </span>
              </div>
              
              {/* Visualized bar element */}
              <div style={{
                width: '100%',
                height: barH,
                background: `linear-gradient(to top, ${col}cc, ${col}22)`,
                borderRadius: '4px 4px 0 0',
                border: `1px solid ${col}44`,
                boxShadow: `0 0 8px ${col}10`,
                transition: 'all 0.3s ease'
              }} />
              
              {/* Slot tracking text label */}
              <div style={{ height: SUBTEXT_H, display: 'flex', alignItems: 'center', justifyContent: 'center', marginTop: 4 }}>
                <span style={{ fontFamily: font.mono, fontSize: 8, color: C.dimmer, fontWeight: 700 }}>
                  E{s.slotNumber}
                </span>
              </div>

            </div>
          );
        })}
      </div>
    </div>
  );
}

// ── Overall completion ring (donut) ───────────────────────────────────────────
function CompletionRing({ slots }) {
  const { tokens } = useTheme();
  const C = tokensToC(tokens);
  const total = slots.length;
  const done = slots.filter(s => s.record).length;
  const reviewed = slots.filter(s => s.record?.status === 'REVIEWED').length;
  const pct = total > 0 ? done / total : 0;

  const R = 36, stroke = 8, cx = 46, cy = 46;
  const circ = 2 * Math.PI * R;
  const filled = circ * pct;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
      <div style={{ fontFamily: font.mono, fontSize: 9, color: C.muted, letterSpacing: '0.1em', textTransform: 'uppercase', fontWeight: 700 }}>COMPLETION RING</div>
      <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
        <svg width={92} height={92} viewBox="0 0 92 92">
          <circle cx={cx} cy={cy} r={R} fill="none" stroke={`${C.accent}18`} strokeWidth={stroke} />
          <circle cx={cx} cy={cy} r={R} fill="none" stroke={C.accent} strokeWidth={stroke}
            strokeDasharray={`${filled} ${circ}`}
            strokeLinecap="round"
            transform={`rotate(-90 ${cx} ${cy})`}
            style={{ transition: 'stroke-dasharray 0.8s ease' }}
          />
          <text x={cx} y={cy - 5} textAnchor="middle" fill={C.text} fontSize={13} fontFamily={font.mono} fontWeight={700}>{Math.round(pct * 100)}%</text>
          <text x={cx} y={cy + 10} textAnchor="middle" fill={C.muted} fontSize={8} fontFamily={font.mono}>DONE</text>
        </svg>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
          <div style={{ fontFamily: font.mono, fontSize: 11 }}>
            <span style={{ color: C.accent, fontWeight: 700 }}>{done}</span>
            <span style={{ color: C.muted }}> / {total} submitted</span>
          </div>
          <div style={{ fontFamily: font.mono, fontSize: 11 }}>
            <span style={{ color: C.success, fontWeight: 700 }}>{reviewed}</span>
            <span style={{ color: C.muted }}> graded</span>
          </div>
        </div>
      </div>
    </div>
  );
}

// ── Pending experiments list ──────────────────────────────────────────────────
function PendingList({ slots }) {
  const { tokens } = useTheme();
  const C = tokensToC(tokens);
  const pending = slots.filter(s => !s.record);
  if (pending.length === 0) return null;

  return (
    <div style={{ border: `1px solid ${C.border}`, borderRadius: 12, background: C.surface, padding: '16px 18px', marginBottom: 20 }}>
      <div style={{ fontFamily: font.mono, fontSize: 9, color: C.warn, letterSpacing: '0.1em', textTransform: 'uppercase', marginBottom: 10 }}>
        ⚠ PENDING EXPERIMENTS ({pending.length})
      </div>
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
        {pending.map(s => (
          <span key={s.id} style={{
            padding: '4px 10px', borderRadius: 20,
            background: 'rgba(251,191,36,0.06)', border: '1px solid rgba(251,191,36,0.25)',
            color: C.warn, fontFamily: font.mono, fontSize: 11,
          }}>
            Exp {s.slotNumber} · {s.title}
          </span>
        ))}
      </div>
    </div>
  );
}

// ── Next action prompt ────────────────────────────────────────────────────────
function NextActionPrompt({ slots }) {
  const { tokens } = useTheme();
  const C = tokensToC(tokens);
  const pending = slots.filter(s => !s.record);
  const pendingGrade = slots.filter(s => s.record?.status === 'SUBMITTED');

  let message = null;
  if (pending.length > 0) {
    message = `📋 You have ${pending.length} unsubmitted experiment${pending.length > 1 ? 's' : ''} — next up: Exp ${pending[0].slotNumber} · ${pending[0].title}`;
  } else if (pendingGrade.length > 0) {
    message = `⏳ ${pendingGrade.length} experiment${pendingGrade.length > 1 ? 's' : ''} awaiting faculty review. Check back soon!`;
  } else if (slots.length > 0) {
    message = `✅ All experiments submitted and reviewed. Great work!`;
  }

  if (!message) return null;

  return (
    <div style={{
      padding: '12px 18px', borderRadius: 12, marginBottom: 20,
      background: 'rgba(99,210,255,0.05)', border: `1px solid ${C.accentBorder || 'rgba(99,210,255,0.2)'}`,
      color: C.text, fontFamily: font.sans, fontSize: 13,
    }}>
      {message}
    </div>
  );
}

// ── Profile summary card ──────────────────────────────────────────────────────
function ProfileCard({ student, section }) {
  const { tokens } = useTheme();
  const C = tokensToC(tokens);
  if (!student && !section) return null;

  const items = [
    { label: 'Roll No', val: student?.rollNumber || student?.employeeId || '—' },
    { label: 'Section', val: section?.name || '—' },
    { label: 'Semester', val: section?.semester || '—' },
    { label: 'Dept', val: section?.department || '—' },
  ];

  return (
    <div style={{ border: `1px solid ${C.border}`, borderRadius: 12, background: C.surface, padding: '14px 18px', marginBottom: 20 }}>
      <div style={{ fontFamily: font.mono, fontSize: 9, color: C.accent, letterSpacing: '0.1em', textTransform: 'uppercase', marginBottom: 10 }}>IDENTITY</div>
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 12 }}>
        {items.map(item => (
          <div key={item.label} style={{ minWidth: 80 }}>
            <div style={{ fontFamily: font.mono, fontSize: 8, color: C.dimmer, textTransform: 'uppercase', letterSpacing: '0.08em' }}>{item.label}</div>
            <div style={{ fontFamily: font.mono, fontSize: 12, color: C.text, fontWeight: 700, marginTop: 2 }}>{item.val}</div>
          </div>
        ))}
      </div>
    </div>
  );
}

// ── Marks report export (PDF/CSV) ─────────────────────────────────────────────
function ExportButton({ slots, assignment }) {
  const { tokens } = useTheme();
  const C = tokensToC(tokens);
  const [open, setOpen] = useState(false);

  const exportCSV = () => {
    const rows = [['Exp', 'Title', 'Status', 'Marks', 'Max Marks', 'Grade%', 'Review Note']];
    slots.forEach(s => {
      const r = s.record;
      const slotMax = parseInt(r?.maxMarks || s.maxMarks) || 10;
      const pct = r?.marks != null && slotMax > 0 ? Math.round((r.marks / slotMax) * 100) : '';
      rows.push([s.slotNumber, s.title, r?.status || 'NOT_DONE', r?.marks ?? '', slotMax, pct, r?.reviewNote || '']);
    });
    const csv = rows.map(r => r.map(v => `"${String(v).replace(/"/g, '""')}"`).join(',')).join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a'); a.href = url;
    a.download = `marks-${assignment?.subject?.code || 'lab'}.csv`;
    a.click(); URL.revokeObjectURL(url);
    setOpen(false);
  };

  const exportPrint = () => {
    const reviewed = slots.filter(s => s.record?.status === 'REVIEWED');
    const totalMarks = reviewed.reduce((sum, s) => sum + (parseInt(s.record?.marks) || 0), 0);
    const maxMarks = reviewed.reduce((sum, s) => sum + (parseInt(s.record?.maxMarks || s.maxMarks) || 10), 0);
    const rows = slots.map(s => {
      const r = s.record;
      const slotMax = parseInt(r?.maxMarks || s.maxMarks) || 10;
      const pct = r?.marks != null && slotMax > 0 ? Math.round((r.marks / slotMax) * 100) + '%' : '—';
      return `<tr><td>${s.slotNumber}</td><td>${s.title}</td><td>${r?.status || 'NOT DONE'}</td><td>${r?.marks ?? '—'} / ${slotMax}</td><td>${pct}</td><td>${r?.reviewNote || ''}</td></tr>`;
    }).join('');
    const html = `<html><head><title>Marks Report</title><style>body{font-family:monospace;padding:20px}table{border-collapse:collapse;width:100%}th,td{border:1px solid #ccc;padding:8px;text-align:left}th{background:#eee}h2{margin-bottom:4px}p{margin:0 0 16px;color:#555}</style></head><body><h2>Marks Report — ${assignment?.subject?.name || 'Lab'}</h2><p>${assignment?.subject?.code || ''} | Total: ${totalMarks} / ${maxMarks}</p><table><tr><th>Exp</th><th>Title</th><th>Status</th><th>Marks</th><th>Grade%</th><th>Review Note</th></tr>${rows}</table></body></html>`;
    const w = window.open('', '_blank');
    w.document.write(html);
    w.document.close();
    w.print();
    setOpen(false);
  };

  return (
    <div style={{ position: 'relative' }}>
      <button
        onClick={() => setOpen(o => !o)}
        style={{ padding: '8px 14px', background: C.surface, border: `1px solid ${C.border}`, borderRadius: 8, color: C.muted, fontFamily: font.mono, fontSize: 10, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 6 }}>
        📥 EXPORT
      </button>
      {open && (
        <div style={{ position: 'absolute', top: '110%', right: 0, zIndex: 100, background: C.surface, border: `1px solid ${C.border}`, borderRadius: 10, boxShadow: '0 8px 24px rgba(0,0,0,0.25)', minWidth: 140, overflow: 'hidden' }}>
          <button onClick={exportCSV} style={{ width: '100%', padding: '11px 16px', background: 'none', border: 'none', color: C.text, fontFamily: font.mono, fontSize: 11, cursor: 'pointer', textAlign: 'left' }}>📄 CSV</button>
          <button onClick={exportPrint} style={{ width: '100%', padding: '11px 16px', background: 'none', border: 'none', color: C.text, fontFamily: font.mono, fontSize: 11, cursor: 'pointer', textAlign: 'left' }}>🖨 PDF / Print</button>
        </div>
      )}
    </div>
  );
}

// ── Real-time marks banner (highlighted row flash) ────────────────────────────
function useRecentlyUpdated() {
  const [updatedSlotId, setUpdatedSlotId] = useState(null);
  const timerRef = useRef(null);
  const markUpdated = useCallback((slotId) => {
    setUpdatedSlotId(slotId);
    clearTimeout(timerRef.current);
    timerRef.current = setTimeout(() => setUpdatedSlotId(null), 3500);
  }, []);
  useEffect(() => () => clearTimeout(timerRef.current), []);
  return [updatedSlotId, markUpdated];
}

// ── Floating toast ────────────────────────────────────────────────────────────
function MarksToast({ toast, onDismiss }) {
  const { tokens } = useTheme();
  const C = tokensToC(tokens);
  useEffect(() => {
    if (!toast) return;
    const t = setTimeout(onDismiss, 4000);
    return () => clearTimeout(t);
  }, [toast, onDismiss]);

  if (!toast) return null;
  return (
    <div style={{
      position: 'fixed', bottom: 28, right: 28, zIndex: 9999,
      padding: '14px 20px', borderRadius: 12,
      background: 'rgba(74,240,196,0.12)', border: '1px solid rgba(74,240,196,0.35)',
      color: C.success, fontFamily: font.mono, fontSize: 12,
      boxShadow: '0 8px 32px rgba(74,240,196,0.15)',
      animation: 'slideIn 0.3s ease',
      display: 'flex', alignItems: 'center', gap: 10,
    }}>
      <span style={{ fontSize: 18 }}>🎉</span>
      <div>
        <div style={{ fontWeight: 700, marginBottom: 2 }}>Marks updated!</div>
        <div style={{ color: C.muted, fontSize: 11 }}>{toast.message}</div>
      </div>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════════════════
export default function StudentLabDetail() {
  const { params, goBack } = useRouter();
  const { navigate } = useRouter();
  const { user } = useAuth();
  const { tokens } = useTheme();
  const C = tokensToC(tokens);
  const { assignmentId } = params;
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState('');
  const [toast, setToast] = useState(null);
  const [updatedSlotId, markUpdated] = useRecentlyUpdated();

  const { on, off, emit } = useSocket(null);

  const load = useCallback(() => {
    setLoading(true);
    studentApi.getLabDetail(assignmentId)
      .then(r => setData(r.data))
      .catch(e => setErr(e.response?.data?.error || 'Failed to load lab.'))
      .finally(() => setLoading(false));
  }, [assignmentId]);

  useEffect(() => { load(); }, [load]);

  useEffect(() => {
    if (!user?.id) return;
    emit('join_student_room', user.id);
    return () => emit('leave_student_room', user.id);
  }, [user?.id, emit]);

  useEffect(() => {
    on('marks_updated', (payload) => {
      if (payload.assignmentId !== assignmentId) return;
      setData(prev => {
        if (!prev) return prev;
        const updatedSlots = prev.slots.map(slot => {
          if (slot.id !== payload.slotId) return slot;
          return {
            ...slot,
            record: {
              ...(slot.record || {}),
              marks: payload.marks,
              maxMarks: payload.maxMarks,
              reviewNote: payload.reviewNote,
              status: payload.status,
              reviewedAt: payload.reviewedAt,
              reviewedBy: payload.reviewedBy,
            },
          };
        });
        return { ...prev, slots: updatedSlots };
      });
      markUpdated(payload.slotId);
      setToast({ message: `Exp graded: ${payload.marks}/${payload.maxMarks} marks` });
    });
    return () => off('marks_updated');
  }, [on, off, assignmentId, markUpdated]);

  useEffect(() => {
    on('experiment_completed', (payload) => {
      if (payload.assignmentId !== assignmentId) return;
      setData(prev => {
        if (!prev) return prev;
        const updatedSlots = prev.slots.map(slot => {
          if (slot.id !== payload.slotId) return slot;
          if (slot.record) return slot;
          return {
            ...slot,
            record: { status: 'SUBMITTED', marks: null, reviewNote: null, reviewedAt: null },
          };
        });
        return { ...prev, slots: updatedSlots };
      });
    });
    return () => off('experiment_completed');
  }, [on, off, assignmentId]);

  if (loading) return (
    <div style={{ minHeight: '100vh', background: C.bg, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <div style={{ width: 28, height: 28, border: `2px solid rgba(99,210,255,0.2)`, borderTopColor: C.accent, borderRadius: '50%', animation: 'spin 0.8s linear infinite' }} />
      <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
    </div>
  );

  if (err) return (
    <div style={{ minHeight: '100vh', background: C.bg, color: C.text, padding: 28 }}>
      <div style={{ color: C.error }}>{err}</div>
    </div>
  );

  const { assignment, slots, student, section } = data;
  const done = slots.filter(s => s.record);
  const reviewed = slots.filter(s => s.record?.status === 'REVIEWED');
  
  const totalMarks = reviewed.reduce((sum, s) => sum + (parseInt(s.record?.marks) || 0), 0);
  const maxMarks = reviewed.reduce((sum, s) => sum + (parseInt(s.record?.maxMarks || s.maxMarks) || 10), 0);

  return (
    <div style={{ minHeight: '100vh', background: C.bg, color: C.text, fontFamily: font.sans }}>
      <style>{`
        @keyframes spin{to{transform:rotate(360deg)}}
        @keyframes slideIn{from{opacity:0;transform:translateY(12px)}to{opacity:1;transform:translateY(0)}}
        @keyframes flashRow{0%,100%{background:transparent}30%,70%{background:rgba(74,240,196,0.1)}}
        *{box-sizing:border-box}
      `}</style>

      {/* Header */}
      <div style={{ borderBottom: `1px solid ${C.border}`, padding: '0 28px', display: 'flex', alignItems: 'center', height: 58 }}>
        <button onClick={goBack} style={{ background: 'none', border: 'none', color: C.muted, fontFamily: font.mono, fontSize: 11, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 6, marginRight: 20 }}>← BACK</button>
        <LabScanLogo size={22} gradientId="studentLabDetailLogoGrad" style={{ marginRight: 8 }} />
        <span style={{ fontFamily: font.mono, fontSize: 14, fontWeight: 700, background: C.accentGrad, WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>LabScan</span>
        <div style={{ flex: 1 }} />
        {/* RECTIFIED SCAN QUERY: Maps correctly onto the custom multi-step Scan route identifier */}
        <button
          onClick={() => navigate('scan')}
          style={{
            padding: '8px 16px', background: C.accentGrad, border: 'none',
            borderRadius: 8, color: tokens.colorScheme === 'dark' ? '#050c14' : '#fff',
            fontFamily: font.mono, fontSize: 11, fontWeight: 700, cursor: 'pointer',
            display: 'flex', alignItems: 'center', gap: 6, marginRight: 10,
          }}>
          📷 SCAN QR
        </button>
        <ExportButton slots={slots} assignment={assignment} />
      </div>

      <div style={{ padding: '28px', maxWidth: 960, margin: '0 auto' }}>

        <ProfileCard student={student} section={section} />
        <NextActionPrompt slots={slots} />

        {/* Lab header */}
        <div style={{ marginBottom: 24 }}>
          <h1 style={{ fontFamily: font.mono, fontSize: 'clamp(16px, 4vw, 20px)', fontWeight: 700, color: C.text, margin: '0 0 6px' }}>{assignment.subject?.name || 'Unspecified Lab Workstation'}</h1>
          <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', alignItems: 'center' }}>
            <span style={{ fontFamily: font.mono, fontSize: 10, color: C.accent, background: tokens.accentMuted, padding: '3px 8px', borderRadius: 20 }}>{assignment.subject?.code}</span>
            <span style={{ fontFamily: font.mono, fontSize: 10, color: C.muted, background: tokens.bgInput, padding: '3px 8px', borderRadius: 20 }}>Faculty: {assignment.faculty?.name}</span>
            <span style={{ fontFamily: font.mono, fontSize: 10, color: C.dimmer, padding: '3px 8px', borderRadius: 20, border: `1px solid ${C.border}` }}>
              ℹ️ Completion auto-tracked via experiment number on submission
            </span>
          </div>
        </div>

        {/* Stats bar */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(80px, 1fr))', gap: 12, marginBottom: 28 }}>
          {[
            { label: 'Total Exps', val: slots.length, col: C.text },
            { label: 'Completed', val: done.length, col: C.accent },
            { label: 'Graded', val: reviewed.length, col: C.success },
            { label: 'Marks', val: reviewed.length > 0 ? `${totalMarks}/${maxMarks}` : '—', col: C.success },
          ].map(s => (
            <div key={s.label} style={{ border: `1px solid ${C.border}`, borderRadius: 10, background: C.surface, padding: '14px 16px', textAlign: 'center' }}>
              <div style={{ fontFamily: font.mono, fontSize: 18, fontWeight: 700, color: s.col }}>{s.val}</div>
              <div style={{ fontFamily: font.mono, fontSize: 9, letterSpacing: '0.1em', color: C.muted, textTransform: 'uppercase', marginTop: 4 }}>{s.label}</div>
            </div>
          ))}
        </div>

        {/* Visuals row — mini-chart + completion ring */}
        {slots.length > 0 && (
          <div style={{ display: 'flex', gap: 'clamp(12px, 3vw, 24px)', flexWrap: 'wrap', marginBottom: 28, padding: 'clamp(12px, 3vw, 20px)', border: `1px solid ${C.border}`, borderRadius: 14, background: C.surface, alignItems: 'flex-start' }}>
            <div style={{ flex: 1, minWidth: '200px' }}>
              <CompletionRing slots={slots} />
            </div>
            <div style={{ display: 'none', width: 1, background: C.border, alignSelf: 'stretch' }} />
            <div style={{ flex: 1, minWidth: '200px' }}>
              <MarksMiniChart slots={slots} />
            </div>
          </div>
        )}

        <PendingList slots={slots} />

        <div style={{ fontFamily: font.mono, fontSize: 10, color: C.muted, letterSpacing: '0.1em', textTransform: 'uppercase', marginBottom: 12 }}>
          EXPERIMENTS
        </div>

        {slots.length === 0 && (
          <div style={{ border: `1px solid ${C.border}`, borderRadius: 12, background: C.surface, padding: 32, textAlign: 'center', color: C.dimmer, fontSize: 13 }}>
            No experiments have been set up yet. Check back later.
          </div>
        )}

        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          {slots.map(slot => {
            const rec = slot.record;
            const isDone = !!rec;
            const isFlashing = slot.id === updatedSlotId;
            const slotMax = parseInt(rec?.maxMarks || slot.maxMarks) || 10;
            return (
              <div key={slot.id} style={{
                display: 'flex', gap: 14, padding: '14px 16px',
                border: `1px solid ${isFlashing ? 'rgba(74,240,196,0.5)' : isDone ? 'rgba(74,240,196,0.15)' : C.border}`,
                borderRadius: 12,
                background: isFlashing ? 'rgba(74,240,196,0.1)' : isDone ? 'rgba(74,240,196,0.03)' : C.surface,
                alignItems: 'center',
                animation: isFlashing ? 'flashRow 1.2s ease 2' : undefined,
                transition: 'border-color 0.3s ease, background 0.3s ease',
              }}>
                <div style={{ width: 36, height: 36, borderRadius: 8, background: isDone ? 'rgba(74,240,196,0.1)' : 'rgba(99,210,255,0.06)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                  <span style={{ fontFamily: font.mono, fontSize: 12, color: isDone ? C.success : C.accent }}>
                    {isDone ? '✓' : slot.slotNumber}
                  </span>
                </div>

                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
                    <span style={{ fontFamily: font.mono, fontSize: 10, color: C.dimmer }}>Exp {slot.slotNumber}</span>
                    <span style={{ fontSize: 14, fontWeight: 600, color: C.text }}>{slot.title}</span>
                    {rec?.status === 'REVIEWED' && rec?.marks != null && (
                      <ScoreBadge marks={rec.marks} maxMarks={slotMax} />
                    )}
                    {isFlashing && (
                      <span style={{ fontFamily: font.mono, fontSize: 9, color: C.success, background: 'rgba(74,240,196,0.12)', padding: '2px 8px', borderRadius: 10, border: '1px solid rgba(74,240,196,0.3)' }}>
                        ✦ JUST UPDATED
                      </span>
                    )}
                  </div>
                  {parseDescription(slot.description) && <div style={{ fontSize: 12, color: C.muted, marginTop: 3 }}>{parseDescription(slot.description)}</div>}
                  {rec?.reviewNote && (
                    <div style={{ marginTop: 6, padding: '5px 10px', background: 'rgba(99,210,255,0.04)', borderRadius: 6, fontSize: 12, color: C.muted, fontStyle: 'italic' }}>
                      "{rec.reviewNote}"
                    </div>
                  )}
                </div>

                <div style={{ flexShrink: 0 }}>
                  <StatusChip status={rec?.status} marks={rec?.marks} maxMarks={slotMax} />
                </div>
              </div>
            );
          })}
        </div>
      </div>

      <MarksToast toast={toast} onDismiss={() => setToast(null)} />
    </div>
  );
}