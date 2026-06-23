import React, { useState, useEffect } from 'react';
import LabScanLogo from '../../components/LabScanLogo';
import { useAuth } from '../../context/AuthContext';
import { useRouter } from '../../App';
import { labAssignmentApi } from '../../api/labAssignment.api';
import { experimentsApi } from '../../api/experiments.api';
import FileUpload from '../../components/FileUpload';
import { useTheme } from '../../context/ThemeContext';
import { makeStyles } from '../../utils/makeStyles';
import ThemeToggle from '../../components/ThemeToggle';

const font = { mono: "'Space Mono',monospace", sans: "'DM Sans',sans-serif" };

const Card = ({ children, style }) => {
  const { tokens } = useTheme();
  return (
    <div style={{ border: `1px solid ${tokens.border}`, borderRadius: 14, background: tokens.bgCard, padding: 22, ...style }}>
      {children}
    </div>
  );
};

const Label = ({ children }) => {
  const { tokens } = useTheme();
  return (
    <label style={{ display: 'block', fontFamily: font.mono, fontSize: 10, letterSpacing: '0.1em', color: tokens.textMuted, textTransform: 'uppercase', marginBottom: 7 }}>
      {children}
    </label>
  );
};

const Inp = ({ style, ...p }) => {
  const { tokens } = useTheme();
  return <input style={{ width: '100%', padding: '10px 12px', background: tokens.bgInput, border: `1px solid ${tokens.borderInput}`, borderRadius: 8, color: tokens.textPrimary, fontSize: 13, fontFamily: font.sans, outline: 'none', colorScheme: tokens.colorScheme, ...style }} {...p} />;
};

const Sel = ({ children, ...p }) => {
  const { tokens } = useTheme();
  return <select style={{ width: '100%', padding: '10px 12px', background: tokens.bgSurfaceHover, border: `1px solid ${tokens.borderInput}`, borderRadius: 8, color: tokens.textPrimary, fontSize: 13, fontFamily: font.sans, outline: 'none', colorScheme: tokens.colorScheme }} {...p}>{children}</select>;
};

const Btn = ({ children, variant = 'primary', style, ...p }) => {
  const { tokens } = useTheme();
  const base = { padding: '9px 16px', border: 'none', borderRadius: 8, fontFamily: font.mono, fontWeight: 700, fontSize: 11, letterSpacing: '0.06em', cursor: p.disabled ? 'not-allowed' : 'pointer', transition: 'all 0.2s', opacity: p.disabled ? 0.5 : 1, ...style };
  const vars = {
    primary: { background: tokens.accentGrad, color: tokens.textInverse },
    ghost: { background: tokens.btnSecondaryBg, border: `1px solid ${tokens.btnSecondaryBorder}`, color: tokens.btnSecondaryText },
    danger: { background: tokens.dangerBg, border: `1px solid ${tokens.dangerBorder}`, color: tokens.danger },
  };
  return <button style={{ ...base, ...vars[variant] }} {...p}>{children}</button>;
};

// ── Stage definitions ────────────────────────────────
const STAGE_DEFS = [
  { id:1, label:'Stage 1 — Learn', shortLabel:'Learn', icon:'📖', desc:'Theory, formulas, PDFs and reference material', accentToken:'accent',
    types:['TEXT','PDF','SAMPLE_RESULT'], typeLabels:{ TEXT:{icon:'📝',label:'Theory / Content',rows:5,placeholder:'Enter theory, background, or introduction…'}, PDF:{icon:'📄',label:'PDF Reference',rows:0,placeholder:''}, SAMPLE_RESULT:{icon:'🧪',label:'Expected Results',rows:2,placeholder:'{"pH": "7.0", "color": "pink"}'} } },
  { id:2, label:'Stage 2 — Watch & Do', shortLabel:'Watch', icon:'▶️', desc:'YouTube videos, Virtual Lab simulations, procedure checklist', accentToken:'warning',
    types:['YOUTUBE','VIRTUAL_LAB','STEP'], typeLabels:{ YOUTUBE:{icon:'▶️',label:'YouTube Video',rows:1,placeholder:'https://www.youtube.com/watch?v=…'}, VIRTUAL_LAB:{icon:'🔬',label:'Virtual Lab URL',rows:1,placeholder:'https://vlab.amrita.edu/…'}, STEP:{icon:'✅',label:'Checklist Steps',rows:3,placeholder:'1. Add 10 mL of HCl\n2. Slowly add NaOH\n3. Note the colour change'} } },
  { id:3, label:'Stage 3 — Submit', shortLabel:'Submit', icon:'📤', desc:'Result fields students must fill in', accentToken:'success', note:'Define expected result keys.',
    types:['SAMPLE_RESULT'], typeLabels:{ SAMPLE_RESULT:{icon:'🧪',label:'Result Fields (JSON keys)',rows:2,placeholder:'{"pH": "7.0", "color": "pink", "volume_mL": "25"}'} } },
];
const ALL_TYPE_LABELS = STAGE_DEFS.reduce((acc,s) => ({ ...acc,...s.typeLabels }), {});
const DEPARTMENTS = ['CSE','ECE','EEE','Mechanical','Civil','Chemical','IT','Physics','Chemistry','Mathematics','Other'];

function encodeLabel(stageId, label) { return `__s${stageId}__${label||''}`; }
function decodeLabel(raw) { const m=(raw||'').match(/^__s(\d+)__(.*)$/s); if(m) return { stageId:parseInt(m[1]), label:m[2] }; return { stageId:1, label:raw||'' }; }

function makeBaseInput(tokens) { return { width:'100%', padding:'10px 13px', background:tokens.bgInput, border:`1px solid ${tokens.borderInput}`, borderRadius:8, color:tokens.textPrimary, fontSize:13, fontFamily:"'DM Sans',sans-serif", outline:'none', resize:'none', transition:'border-color 0.2s', colorScheme:tokens.colorScheme }; }

// ── Content Block ────────────────────────────────────
function ContentBlock({ block, index, onChange, onDelete, onMoveUp, onMoveDown, isFirst, isLast, experimentId, stageTypes, stageTypeLabels, accent }) {
  const { tokens } = useTheme();
  const baseInput = makeBaseInput(tokens);
  const [uploading, setUploading] = useState(false);
  const [uploadError, setUploadError] = useState('');
  const info = stageTypeLabels[block.type] || ALL_TYPE_LABELS[block.type] || {};

  const handleFileUpload = async (file) => {
    if (!experimentId) { setUploadError('Save the experiment first before uploading files.'); return; }
    setUploadError(''); setUploading(true);
    try { const res = await experimentsApi.uploadFile(experimentId, file); onChange(index,'content',res.data.url); }
    catch (err) { setUploadError(err.response?.data?.error||'Upload failed'); }
    finally { setUploading(false); }
  };

  return (
    <div style={{ border:`1px solid ${tokens.border}`, borderRadius:12, padding:'16px', background:tokens.bgCard }}>
      <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', marginBottom:12 }}>
        <div style={{ display:'flex', alignItems:'center', gap:8 }}>
          <span style={{ fontSize:14 }}>{info.icon}</span>
          {stageTypes.length > 1 ? (
            <select value={block.type} onChange={e => onChange(index,'type',e.target.value)} style={{ ...baseInput, width:'auto', padding:'5px 10px', fontFamily:"'Space Mono',monospace", fontSize:11, letterSpacing:'0.06em', colorScheme:tokens.colorScheme }}>
              {stageTypes.map(t => <option key={t} value={t}>{stageTypeLabels[t]?.label||t}</option>)}
            </select>
          ) : (
            <span style={{ fontFamily:"'Space Mono',monospace", fontSize:11, color:accent, letterSpacing:'0.06em' }}>{info.label}</span>
          )}
        </div>
        <div style={{ display:'flex', gap:2 }}>
          {[{act:()=>onMoveUp(index),dis:isFirst,icon:'M5 15l7-7 7 7'},{act:()=>onMoveDown(index),dis:isLast,icon:'M19 9l-7 7-7-7'}].map((b,i) => (
            <button key={i} type="button" onClick={b.act} disabled={b.dis} style={{ background:'none', border:'none', cursor:b.dis?'not-allowed':'pointer', color:tokens.textDimmer, padding:4, opacity:b.dis?0.2:1 }}>
              <svg width="13" height="13" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d={b.icon} /></svg>
            </button>
          ))}
          <button type="button" onClick={() => onDelete(index)} style={{ background:'none', border:'none', cursor:'pointer', color:tokens.textDimmer, padding:4, marginLeft:4 }}
            onMouseEnter={e => e.currentTarget.style.color=tokens.danger} onMouseLeave={e => e.currentTarget.style.color=tokens.textDimmer}>
            <svg width="13" height="13" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" /></svg>
          </button>
        </div>
      </div>

      <input type="text" placeholder="Section label (optional)" value={block.label||''} onChange={e => onChange(index,'label',e.target.value)}
        style={{ ...baseInput, marginBottom:8, fontSize:12 }} />

      {block.type=='PDF' ? (
        <div>
          {block.content ? (
            <div style={{ display:'flex', alignItems:'center', gap:10, padding:'10px 12px', background:tokens.dangerBg, border:`1px solid ${tokens.dangerBorder}`, borderRadius:8 }}>
              <a href={block.content} target="_blank" rel="noopener noreferrer" style={{ color:tokens.accent, fontSize:12, textDecoration:'none', flex:1, overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}>{block.content.split('/').pop()}</a>
              <button type="button" onClick={() => onChange(index,'content','')} style={{ background:'none', border:'none', cursor:'pointer', color:tokens.textMuted, fontSize:11 }}>Remove</button>
            </div>
          ) : uploading ? (
            <div style={{ display:'flex', alignItems:'center', gap:8, justifyContent:'center', padding:'20px', color:tokens.textMuted, fontSize:13 }}>
              <div style={{ width:14, height:14, border:`2px solid ${tokens.accentMuted}`, borderTopColor:tokens.accent, borderRadius:'50%', animation:'spin 0.8s linear infinite' }} /> Uploading…
            </div>
          ) : (
            <div>
              <FileUpload accept="application/pdf" label="Upload PDF document" onFileSelect={handleFileUpload} preview={false} />
              {uploadError && <p style={{ color:tokens.danger, fontSize:11, marginTop:4 }}>{uploadError}</p>}
            </div>
          )}
        </div>
      ) : (
        <textarea rows={info.rows||3} placeholder={info.placeholder||''} value={block.content} onChange={e => onChange(index,'content',e.target.value)} style={baseInput} />
      )}
      {block.type=='SAMPLE_RESULT' && <p style={{ fontSize:11, color:tokens.textDimmer, marginTop:5 }}>JSON format: {'{"key": "value", ...}'}</p>}
    </div>
  );
}

function StagePanel({ stageDef, blocks, onChange, onDelete, onMoveUp, onMoveDown, onAdd, experimentId }) {
  const { tokens } = useTheme();
  const accent = tokens[stageDef.accentToken];
  return (
    <div style={{ border:`1px solid ${accent}33`, borderRadius:14, background:`${accent}08`, padding:'20px', display:'flex', flexDirection:'column', gap:14 }}>
      <div style={{ display:'flex', justifyContent:'space-between', alignItems:'flex-start' }}>
        <div>
          <div style={{ display:'flex', alignItems:'center', gap:8, marginBottom:4 }}>
            <span style={{ fontSize:16 }}>{stageDef.icon}</span>
            <span style={{ fontFamily:"'Syne',sans-serif", fontWeight:700, fontSize:14, color:accent }}>{stageDef.label}</span>
          </div>
          <p style={{ fontSize:12, color:tokens.textMuted }}>{stageDef.desc}</p>
          {stageDef.note && <p style={{ fontSize:11, color:tokens.textDimmer, marginTop:3, fontStyle:'italic' }}>{stageDef.note}</p>}
        </div>
        <span style={{ fontFamily:"'Space Mono',monospace", fontSize:10, padding:'3px 10px', borderRadius:100, border:`1px solid ${accent}30`, color:accent, letterSpacing:'0.08em', whiteSpace:'nowrap' }}>{blocks.length} block{blocks.length!==1?'s':''}</span>
      </div>

      {blocks.map((block,i) => (
        <ContentBlock key={i} block={block} index={i} onChange={onChange} onDelete={onDelete} onMoveUp={onMoveUp} onMoveDown={onMoveDown}
          isFirst={i===0} isLast={i===blocks.length-1} experimentId={experimentId}
          stageTypes={stageDef.types} stageTypeLabels={stageDef.typeLabels} accent={accent} />
      ))}

      <button type="button" onClick={onAdd} style={{ width:'100%', padding:'12px', background:'transparent', border:`1.5px dashed ${accent}44`, borderRadius:10, cursor:'pointer', color:accent, fontSize:12, fontFamily:"'Space Mono',monospace", letterSpacing:'0.06em', display:'flex', alignItems:'center', justifyContent:'center', gap:8, transition:'all 0.2s' }}
        onMouseEnter={e => { e.currentTarget.style.borderColor=accent; e.currentTarget.style.background=`${accent}14`; }}
        onMouseLeave={e => { e.currentTarget.style.borderColor=`${accent}44`; e.currentTarget.style.background='transparent'; }}>
        <svg width="12" height="12" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}><path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" /></svg>
        ADD BLOCK
      </button>
    </div>
  );
}

// ── Rich Slot Editor ──────────────────────────────────────────────
function SlotEditor({ assignment, onClose, onSaved }) {
  const { tokens } = useTheme();
  const [slots, setSlots] = useState([]);
  const [editSlot, setEditSlot] = useState(null);
  const [saving, setSaving] = useState(false);
  const [err, setErr] = useState('');
  const [activeTab, setActiveTab] = useState(1);

  const [form, setForm] = useState({ title: '', description: '', arucoId: '', department: '', maxMarks: 10 });
  const [stageBlocks, setStageBlocks] = useState({ 1:[], 2:[], 3:[] });
  const [savedExpId, setSavedExpId] = useState(null);
  const [focused, setFocused] = useState(null);

  useEffect(() => {
    labAssignmentApi.getDetail(assignment.id).then(r => setSlots(r.data.experiments || []));
  }, [assignment.id]);

  const totalSlots = assignment.subject.totalSlots;
  const baseInput = makeBaseInput(tokens);

  const openEdit = async (slotNumber) => {
    const existing = slots.find(s => s.slotNumber === slotNumber);
    setErr('');
    setActiveTab(1);
    setSavedExpId(null);
    setStageBlocks({ 1:[], 2:[], 3:[] });

    if (existing) {
      let expId = null;
      try {
        const parsed = existing.description ? JSON.parse(existing.description) : null;
        if (parsed && typeof parsed === 'object' && parsed.__experimentId) {
          expId = parsed.__experimentId;
        }
      } catch {
        // Fallback for flat strings
      }

      setForm({
        title: existing.title || '',
        description: existing.description || '',
        arucoId: '',
        department: '',
        maxMarks: existing.maxMarks || 10,
      });

      if (expId) {
        setSavedExpId(expId);
        try {
          const res = await experimentsApi.getById(expId);
          const exp = res.data;
          setForm(f => ({ ...f, arucoId: String(exp.arucoId), department: exp.department || '' }));
          const byStage = { 1:[], 2:[], 3:[] };
          (exp.contents||[]).forEach(c => {
            const { stageId, label } = decodeLabel(c.label);
            const sid = [1,2,3].includes(stageId) ? stageId : 1;
            byStage[sid].push({ id:c.id, type:c.type, content:c.content, label, order:c.order });
          });
          setStageBlocks(byStage);
        } catch {}
      }
    } else {
      setForm({ title: '', description: '', arucoId: '', department: '', maxMarks: 10 });
    }

    setEditSlot({ slotNumber, existing: existing || null });
  };

  const updateStage = (sid, fn) => setStageBlocks(prev => ({ ...prev, [sid]: fn(prev[sid]) }));
  const handleAdd    = (sid) => updateStage(sid, prev => [...prev, { type: STAGE_DEFS.find(s=>s.id===sid)?.types[0]||'TEXT', content:'', label:'', order:prev.length+1 }]);
  const handleChange = (sid, i, f, v) => updateStage(sid, prev => { const a=[...prev]; a[i]={...a[i],[f]:v}; return a; });
  const handleDelete = (sid, i) => updateStage(sid, prev => prev.filter((_,idx)=>idx!==i));
  const handleMoveUp   = (sid, i) => updateStage(sid, prev => { if(i===0) return prev; const a=[...prev]; [a[i-1],a[i]]=[a[i],a[i-1]]; return a; });
  const handleMoveDown = (sid, i) => updateStage(sid, prev => { if(i===prev.length-1) return prev; const a=[...prev]; [a[i],a[i+1]]=[a[i+1],a[i]]; return a; });

  const saveSlot = async () => {
    if (!form.title.trim()) { setErr('Title is required'); return; }
    if (!form.description.trim()) { setErr('Description is required'); return; }
    if (!form.arucoId) { setErr('ArUco Marker ID is required'); return; }
    if (!form.department) { setErr('Department is required'); return; }
    setSaving(true);
    setErr('');
    try {
      let globalOrder = 1;
      const allContents = [];
      for (const stageDef of STAGE_DEFS) {
        for (const block of stageBlocks[stageDef.id]) {
          allContents.push({ type:block.type, content:block.content, label:encodeLabel(stageDef.id, block.label), order:globalOrder++ });
        }
      }

      let expId = savedExpId;
      if (expId) {
        await experimentsApi.update(expId, { title: form.title, description: form.description, arucoId: parseInt(form.arucoId), department: form.department });
        const existing = await experimentsApi.getById(expId);
        for (const c of existing.data.contents) await experimentsApi.deleteContent(expId, c.id);
        for (const c of allContents) await experimentsApi.addContent(expId, c);
      } else {
        const res = await experimentsApi.create({ title: form.title, description: form.description, arucoId: parseInt(form.arucoId), department: form.department, contents: allContents });
        expId = res.data.id;
        setSavedExpId(expId);
      }

      const descPayload = JSON.stringify({ __experimentId: expId, summary: form.description });
      await labAssignmentApi.upsertSlot(assignment.id, {
        slotNumber: editSlot.slotNumber,
        title: form.title,
        description: descPayload,
        maxMarks: form.maxMarks,
      });

      const r = await labAssignmentApi.getDetail(assignment.id);
      setSlots(r.data.experiments || []);
      setEditSlot(null);
      onSaved?.();
    } catch (e) {
      setErr(e.response?.data?.error || 'Failed to save');
    } finally {
      setSaving(false);
    }
  };

  const deleteSlot = async (slotId) => {
    if (!confirm('Delete this experiment slot?')) return;
    try {
      await labAssignmentApi.deleteSlot(assignment.id, slotId);
      setSlots(prev => prev.filter(s => s.id !== slotId));
      setEditSlot(null);
    } catch (e) { alert(e.response?.data?.error || 'Failed'); }
  };

  const slotMap = {};
  slots.forEach(s => { slotMap[s.slotNumber] = s; });
  const totalBlocks = Object.values(stageBlocks).reduce((n,arr)=>n+arr.length,0);

  return (
    <div style={{ position:'fixed', inset:0, background:tokens.bgModalOverlay, backdropFilter:'blur(10px)', display:'flex', alignItems:'flex-start', justifyContent:'center', zIndex:1000, padding:'20px', overflowY:'auto' }}>
      <div style={{ width:'100%', maxWidth:780, background:tokens.bgModal, border:`1px solid ${tokens.border}`, borderRadius:20, padding:0, marginTop:20, marginBottom:40 }}>

        {/* Header */}
        <div style={{ padding:'24px 28px', borderBottom:`1px solid ${tokens.border}`, display:'flex', justifyContent:'space-between', alignItems:'flex-start' }}>
          <div>
            <div style={{ fontFamily:font.mono, fontSize:13, color:tokens.accent, marginBottom:4 }}>{assignment.subject.name}</div>
            <div style={{ fontSize:12, color:tokens.textSecondary }}>{assignment.section.name} · {assignment.subject.code}</div>
          </div>
          <Btn variant="ghost" onClick={onClose} style={{ padding:'6px 12px' }}>✕ Close</Btn>
        </div>

        {/* Slot grid */}
        <div style={{ padding:'24px 28px', borderBottom:`1px solid ${tokens.border}` }}>
          <div style={{ fontFamily:font.mono, fontSize:10, color:tokens.textMuted, letterSpacing:'0.1em', textTransform:'uppercase', marginBottom:12 }}>
            EXPERIMENT SLOTS — click to add/edit
          </div>
          <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fill,minmax(140px,1fr))', gap:10, marginBottom:16 }}>
            {Array.from({ length: totalSlots }, (_,i) => i + 1).map(n => {
              const filled = slotMap[n];
              const isActive = editSlot?.slotNumber === n;
              return (
                <div key={n} onClick={() => openEdit(n)} style={{ padding:'10px 12px', border:`1px solid ${isActive ? tokens.accent : filled ? tokens.successBorder : tokens.border}`, borderRadius:10, background:isActive ? tokens.accentMuted : filled ? tokens.successBg : tokens.bgSurface, cursor:'pointer', transition:'all 0.2s' }}>
                  <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom: filled ? 5 : 0 }}>
                    <span style={{ fontFamily:font.mono, fontSize:11, color: isActive ? tokens.accent : filled ? tokens.success : tokens.textMuted }}>Exp {n}</span>
                    {filled && <span style={{ fontSize:9, color:tokens.success }}>✓</span>}
                  </div>
                  {filled && <div style={{ fontSize:11, color:tokens.textPrimary, lineHeight:1.4, overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}>{filled.title}</div>}
                  {!filled && <div style={{ fontSize:10, color:tokens.textDimmer, marginTop:2 }}>Not set</div>}
                </div>
              );
            })}
          </div>

          {/* Progress */}
          <div style={{ padding:'10px 14px', background:tokens.bgSurfaceHover, borderRadius:10, display:'flex', justifyContent:'space-between', alignItems:'center', border:`1px solid ${tokens.border}` }}>
            <span style={{ fontFamily:font.mono, fontSize:11, color:tokens.textMuted }}>PROGRESS</span>
            <span style={{ fontFamily:font.mono, fontSize:12, color:tokens.accent, fontWeight:600 }}>{slots.length} / {totalSlots} experiments defined</span>
          </div>
        </div>

        {/* Rich edit form */}
        {editSlot && (
          <div style={{ padding:'28px' }}>
            <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:24 }}>
              <div>
                <div style={{ fontFamily:font.mono, fontSize:11, color:tokens.accent, letterSpacing:'0.15em', textTransform:'uppercase', marginBottom:4 }}>
                  Experiment {editSlot.slotNumber}
                </div>
                <div style={{ fontSize:12, color:tokens.textMuted }}>Fill in all details for this experiment slot</div>
              </div>
              <span style={{ fontFamily:font.mono, fontSize:10, padding:'3px 10px', borderRadius:100, border:`1px solid ${tokens.border}`, color:tokens.accent, letterSpacing:'0.08em' }}>{totalBlocks} block{totalBlocks!==1?'s':''}</span>
            </div>

            {err && <div style={{ padding:'10px 14px', background:tokens.dangerBg, border:`1px solid ${tokens.dangerBorder}`, borderRadius:10, color:tokens.danger, fontSize:13, marginBottom:18 }}>{err}</div>}

            {/* Basic Info */}
            <div style={{ border:`1px solid ${tokens.border}`, borderRadius:14, background:tokens.bgSurfaceHover, padding:'22px', marginBottom:20, display:'flex', flexDirection:'column', gap:16 }}>
              <div style={{ fontFamily:font.mono, fontSize:10, letterSpacing:'0.15em', color:tokens.textDimmer, textTransform:'uppercase' }}>Basic Information</div>

              <div>
                <label style={{ display:'block', fontFamily:font.mono, fontSize:11, letterSpacing:'0.1em', color:tokens.textSecondary, textTransform:'uppercase', marginBottom:8 }}>Title <span style={{ color:tokens.danger }}>*</span></label>
                <input type="text" placeholder="e.g. Half Wave Rectifier" value={form.title} onChange={e => setForm({...form, title:e.target.value})} onFocus={()=>setFocused('title')} onBlur={()=>setFocused(null)}
                  style={{ ...baseInput, borderColor:focused==='title'?tokens.accent:tokens.borderInput }} />
              </div>

              <div>
                <label style={{ display:'block', fontFamily:font.mono, fontSize:11, letterSpacing:'0.1em', color:tokens.textSecondary, textTransform:'uppercase', marginBottom:8 }}>Description <span style={{ color:tokens.danger }}>*</span></label>
                <textarea rows={3} placeholder="Brief description of the experiment and its objectives…" value={form.description} onChange={e => setForm({...form, description:e.target.value})} onFocus={()=>setFocused('desc')} onBlur={()=>setFocused(null)}
                  style={{ ...baseInput, borderColor:focused==='desc'?tokens.accent:tokens.borderInput }} />
              </div>

              {/* Department + ArUco + MaxMarks row */}
              <div style={{ display:'grid', gridTemplateColumns:'1fr 160px 140px', gap:14 }}>
                <div>
                  <label style={{ display:'block', fontFamily:font.mono, fontSize:11, letterSpacing:'0.1em', color:tokens.textSecondary, textTransform:'uppercase', marginBottom:8 }}>Department <span style={{ color:tokens.danger }}>*</span></label>
                  <select value={form.department} onChange={e => setForm({...form, department:e.target.value})} style={{ ...baseInput, colorScheme:tokens.colorScheme }}>
                    <option value="">Select…</option>
                    {DEPARTMENTS.map(d => <option key={d} value={d}>{d}</option>)}
                  </select>
                </div>
                <div>
                  <label style={{ display:'block', fontFamily:font.mono, fontSize:11, letterSpacing:'0.1em', color:tokens.textSecondary, textTransform:'uppercase', marginBottom:8 }}>ArUco ID <span style={{ color:tokens.danger }}>*</span></label>
                  <input type="number" placeholder="0" min={0} max={1023} value={form.arucoId} onChange={e => setForm({...form, arucoId:e.target.value})} onFocus={()=>setFocused('aruco')} onBlur={()=>setFocused(null)}
                    style={{ ...baseInput, fontFamily:font.mono, borderColor:focused==='aruco'?tokens.accent:tokens.borderInput }} />
                  <p style={{ fontSize:10, color:tokens.textDimmer, marginTop:4 }}>Unique (0–1023)</p>
                </div>
                <div>
                  <label style={{ display:'block', fontFamily:font.mono, fontSize:11, letterSpacing:'0.1em', color:tokens.textSecondary, textTransform:'uppercase', marginBottom:8 }}>Max Marks</label>
                  <select value={form.maxMarks} onChange={e => setForm({...form, maxMarks:parseInt(e.target.value)})} style={{ ...baseInput, colorScheme:tokens.colorScheme }}>
                    {[5,10,15,20,25,30,50].map(n => <option key={n} value={n}>{n} marks</option>)}
                  </select>
                </div>
              </div>
            </div>

            {/* Stage content */}
            <div style={{ marginBottom:24 }}>
              <div style={{ fontFamily:font.mono, fontSize:10, letterSpacing:'0.15em', color:tokens.textDimmer, textTransform:'uppercase', marginBottom:14 }}>Experiment Content</div>
              <div style={{ display:'flex', gap:4, background:tokens.bgSurface, border:`1px solid ${tokens.border}`, borderRadius:12, padding:4, marginBottom:18 }}>
                {STAGE_DEFS.map(s => {
                  const isActive = activeTab===s.id;
                  const count = stageBlocks[s.id].length;
                  const currentAccent = tokens[s.accentToken];
                  return (
                    <button key={s.id} type="button" onClick={() => setActiveTab(s.id)} style={{ flex:1, display:'flex', alignItems:'center', justifyContent:'center', gap:6, padding:'9px 12px', borderRadius:9, border:'none', cursor:'pointer', background:isActive?`${currentAccent}22`:'transparent', outline:isActive?`1px solid ${currentAccent}44`:'none', color:isActive?currentAccent:tokens.textMuted, fontFamily:font.mono, fontSize:11, letterSpacing:'0.06em', transition:'all 0.2s' }}>
                      <span>{s.icon}</span>
                      <span>Stage {s.id}</span>
                      {count>0 && <span style={{ fontSize:10, padding:'1px 6px', borderRadius:100, background:isActive?`${currentAccent}33` : tokens.bgSurfaceHover, color:isActive?currentAccent:tokens.textMuted }}>{count}</span>}
                    </button>
                  );
                })}
              </div>

              {STAGE_DEFS.map(stageDef => activeTab===stageDef.id ? (
                <StagePanel key={stageDef.id} stageDef={stageDef} blocks={stageBlocks[stageDef.id]}
                  onChange={(i,f,v)=>handleChange(stageDef.id,i,f,v)} onDelete={i=>handleDelete(stageDef.id,i)}
                  onMoveUp={i=>handleMoveUp(stageDef.id,i)} onMoveDown={i=>handleMoveDown(stageDef.id,i)}
                  onAdd={()=>handleAdd(stageDef.id)} experimentId={savedExpId} />
              ) : null)}
            </div>

            {/* Actions */}
            <div style={{ display:'flex', gap:10, flexWrap:'wrap' }}>
              <Btn onClick={saveSlot} disabled={saving} style={{ flex:1, minWidth:140, padding:'12px' }}>
                {saving ? 'Saving…' : savedExpId ? 'Save Changes' : 'Create Experiment'}
              </Btn>
              {editSlot.existing && (
                <Btn variant="danger" onClick={() => deleteSlot(editSlot.existing.id)} style={{ padding:'12px 16px' }}>Delete Slot</Btn>
              )}
              <Btn variant="ghost" onClick={() => setEditSlot(null)} style={{ padding:'12px 16px' }}>Cancel</Btn>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

// ── Records Viewer ────────────────────────────────────────────────────────────
function RecordsViewer({ assignment, onClose }) {
  const { tokens } = useTheme();
  const [records, setRecords] = useState([]);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState(null);
  const [markVal, setMarkVal] = useState('');
  const [noteVal, setNoteVal] = useState('');

  useEffect(() => {
    labAssignmentApi.getRecords(assignment.id)
      .then(r => setRecords(r.data))
      .finally(() => setLoading(false));
  }, [assignment.id]);

  const openReview = (rec) => {
    setEditing(rec);
    setMarkVal(rec.marks ?? '');
    setNoteVal(rec.reviewNote ?? '');
  };

  const saveReview = async () => {
    try {
      await labAssignmentApi.reviewRecord(assignment.id, editing.id, { marks: markVal !== '' ? parseInt(markVal) : undefined, reviewNote: noteVal });
      const r = await labAssignmentApi.getRecords(assignment.id);
      setRecords(r.data);
      setEditing(null);
    } catch (e) { alert(e.response?.data?.error || 'Failed'); }
  };

  return (
    <div style={{ position:'fixed', inset:0, background:tokens.bgModalOverlay, backdropFilter:'blur(8px)', display:'flex', alignItems:'center', justifyContent:'center', zIndex:1000, padding:20 }}>
      <div style={{ width:'100%', maxWidth:780, background:tokens.bgModal, border:`1px solid ${tokens.border}`, borderRadius:18, padding:28, maxHeight:'90vh', overflowY:'auto' }}>
        <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:20 }}>
          <div>
            <div style={{ fontFamily:font.mono, fontSize:13, color:tokens.accent, fontWeight:600 }}>Student Submissions</div>
            <div style={{ fontSize:12, color:tokens.textSecondary, marginTop:3 }}>{assignment.subject.name} · {assignment.section.name}</div>
          </div>
          <Btn variant="ghost" onClick={onClose} style={{ padding:'6px 12px' }}>✕ Close</Btn>
        </div>

        {loading && <div style={{ textAlign:'center', padding:40, color:tokens.textMuted }}>Loading...</div>}
        {!loading && records.length === 0 && <div style={{ textAlign:'center', padding:40, color:tokens.textDimmer }}>No submissions yet</div>}

        {!loading && records.length > 0 && (
          <div style={{ display:'flex', flexDirection:'column', gap:8 }}>
            <div style={{ display:'grid', gridTemplateColumns:'80px 1fr 140px 100px 100px 80px', gap:8, padding:'6px 12px', fontFamily:font.mono, fontSize:10, color:tokens.textDimmer, letterSpacing:'0.08em', textTransform:'uppercase' }}>
              <span>Exp</span><span>Student</span><span>Experiment</span><span>Status</span><span>Marks</span><span></span>
            </div>
            {records.map(rec => (
              <div key={rec.id} style={{ display:'grid', gridTemplateColumns:'80px 1fr 140px 100px 100px 80px', gap:8, padding:'10px 12px', background:tokens.bgCard, border:`1px solid ${tokens.border}`, borderRadius:10, alignItems:'center' }}>
                <span style={{ fontFamily:font.mono, fontSize:11, color:tokens.accent, fontWeight:600 }}>Exp {rec.slot.slotNumber}</span>
                <div>
                  <div style={{ fontSize:13, color:tokens.textPrimary, fontWeight:500 }}>{rec.student.name}</div>
                  <div style={{ fontSize:11, color:tokens.textMuted }}>{rec.student.email}</div>
                </div>
                <span style={{ fontSize:12, color:tokens.textPrimary, overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}>{rec.slot.title}</span>
                <span style={{ fontFamily:font.mono, fontSize:10, color:rec.status === 'REVIEWED' ? tokens.success : tokens.textMuted, fontWeight:600 }}>{rec.status}</span>
                <span style={{ fontFamily:font.mono, fontSize:12, color:rec.marks !== null ? tokens.textPrimary : tokens.textDimmer }}>
                  {rec.marks !== null ? `${rec.marks}/${rec.slot.maxMarks}` : '—'}
                </span>
                <Btn variant="ghost" style={{ padding:'5px 10px', fontSize:10 }} onClick={() => openReview(rec)}>Grade</Btn>
              </div>
            ))}
          </div>
        )}

        {editing && (
          <div style={{ marginTop:20, padding:18, background:tokens.accentMuted, border:`1px solid ${tokens.accentBorder}`, borderRadius:12 }}>
            <div style={{ fontFamily:font.mono, fontSize:11, color:tokens.accent, marginBottom:14, fontWeight:600 }}>
              GRADING: {editing.student.name} — Exp {editing.slot.slotNumber}: {editing.slot.title}
            </div>
            <div style={{ display:'grid', gridTemplateColumns:'1fr 2fr', gap:12, marginBottom:14 }}>
              <div>
                <Label>Marks (out of {editing.slot.maxMarks})</Label>
                <Inp type="number" min={0} max={editing.slot.maxMarks} value={markVal} onChange={e => setMarkVal(e.target.value)} />
              </div>
              <div>
                <Label>Review Note (optional)</Label>
                <Inp value={noteVal} onChange={e => setNoteVal(e.target.value)} placeholder="Feedback for student" />
              </div>
            </div>
            <div style={{ display:'flex', gap:10 }}>
              <Btn onClick={saveReview}>Save Grade</Btn>
              <Btn variant="ghost" onClick={() => setEditing(null)}>Cancel</Btn>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

// ── Main Faculty Lab Assignments Page ─────────────────────────────────────────
export default function FacultyLabAssignments() {
  const { navigate } = useRouter();
  const { tokens } = useTheme();
  const [assignments, setAssignments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [slotEditorFor, setSlotEditorFor] = useState(null);
  const [recordsFor, setRecordsFor] = useState(null);

  const isDark = tokens.colorScheme === 'dark';

  useEffect(() => {
    labAssignmentApi.getMyAssignments()
      .then(r => setAssignments(r.data))
      .finally(() => setLoading(false));
  }, []);

  if (loading) return (
    <div style={{ minHeight:'100vh', background:tokens.bgPage, display:'flex', alignItems:'center', justifyContent:'center' }}>
      <div style={{ width:28, height:28, border:`2px solid ${tokens.accentMuted}`, borderTopColor:tokens.accent, borderRadius:'50%', animation:'spin 0.8s linear infinite' }} />
      <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
    </div>
  );

  return (
    <>
      <div style={{ position:'fixed', top:14, right:14, zIndex:999 }}><ThemeToggle size="sm" /></div>
      <div style={{ minHeight:'100vh', background:tokens.bgPage, color:tokens.textPrimary, fontFamily:font.sans, transition: 'background 0.3s ease, color 0.3s ease' }}>
        <link href="https://fonts.googleapis.com/css2?family=Space+Mono:wght@400;700&family=DM+Sans:wght@300;400;500&family=Syne:wght@700;800&display=swap" rel="stylesheet" />
        <style>{`@keyframes spin{to{transform:rotate(360deg)}} *{box-sizing:border-box} @keyframes fadeUp{from{opacity:0;transform:translateY(16px);}to{opacity:1;transform:translateY(0);}}`}</style>

        {/* Hero header */}
        <div style={{ background: isDark ? 'linear-gradient(135deg,rgba(99,210,255,0.06),rgba(74,240,196,0.04))' : tokens.bgSurfaceHover, borderBottom:`1px solid ${tokens.border}`, padding:'clamp(16px,4vw,32px) clamp(16px,5vw,40px) 24px' }}>
          <div style={{ maxWidth:1100, margin:'0 auto' }}>
            <Btn variant="ghost" onClick={() => navigate('faculty-dashboard')} style={{ marginBottom:18, fontSize:11 }}>← Dashboard</Btn>
            <div style={{ display:'flex', justifyContent:'space-between', alignItems:'flex-end' }}>
              <div>
                <div style={{ display:'flex', alignItems:'center', gap:10, marginBottom:8 }}>
                  <LabScanLogo size={22} gradientId="labAssignLogoGrad" />
                  <div style={{ fontFamily:font.mono, fontSize:10, letterSpacing:'0.2em', color:tokens.success, textTransform:'uppercase', fontWeight:600 }}>Faculty Portal</div>
                </div>
                <h1 style={{ fontFamily:"'Syne',sans-serif", fontWeight:800, fontSize:'clamp(24px,4vw,34px)', letterSpacing:'-0.02em', margin:0, color:tokens.textPrimary }}>
                  My Lab Assignments
                </h1>
                <p style={{ fontSize:14, color:tokens.textMuted, marginTop:6 }}>Manage experiments for sections and subjects assigned to you by HOD</p>
              </div>
              <div style={{ fontFamily:font.mono, fontSize:11, color:tokens.textMuted, textAlign:'right' }}>
                <div style={{ fontSize:28, fontWeight:800, color:tokens.accent, fontFamily:"'Syne',sans-serif" }}>{assignments.length}</div>
                <div style={{ fontSize:10, letterSpacing:'0.1em', textTransform:'uppercase' }}>Assignments</div>
              </div>
            </div>
          </div>
        </div>

        <div style={{ maxWidth:1100, margin:'0 auto', padding:'clamp(16px,4vw,32px) clamp(16px,5vw,40px) 80px', animation:'fadeUp 0.5s ease forwards' }}>
          {assignments.length === 0 && (
            <Card>
              <div style={{ textAlign:'center', padding:'40px 20px' }}>
                <div style={{ fontSize:40, marginBottom:12 }}>📭</div>
                <div style={{ fontFamily:font.mono, fontSize:13, color:tokens.textMuted }}>No assignments yet</div>
                <div style={{ fontSize:12, color:tokens.textDimmer, marginTop:6 }}>The HOD will assign sections and subjects to you.</div>
              </div>
            </Card>
          )}

          <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fill,minmax(340px,1fr))', gap:18 }}>
            {assignments.map(a => {
              const defined = a.experiments?.length || 0;
              const total = a.subject.totalSlots;
              const pct = total > 0 ? Math.round((defined / total) * 100) : 0;
              const isComplete = defined === total;
              return (
                <div key={a.id} style={{ border:`1px solid ${isComplete ? tokens.successBorder : tokens.border}`, borderRadius:16, background: isComplete ? tokens.successBg : tokens.bgCard, padding:22, display:'flex', flexDirection:'column', gap:16, transition:'all 0.25s', boxShadow:tokens.shadowCard }}
                  onMouseEnter={e => { e.currentTarget.style.transform='translateY(-3px)'; e.currentTarget.style.borderColor= isComplete ? tokens.success : tokens.accent; }}
                  onMouseLeave={e => { e.currentTarget.style.transform='translateY(0)'; e.currentTarget.style.borderColor= isComplete ? tokens.successBorder : tokens.border; }}>

                  <div>
                    <div style={{ display:'flex', gap:8, marginBottom:10 }}>
                      <span style={{ fontFamily:font.mono, fontSize:10, color:tokens.accent, background:tokens.accentMuted, padding:'3px 9px', borderRadius:20, border:`1px solid ${tokens.accentBorder}` }}>{a.section.name}</span>
                      <span style={{ fontFamily:font.mono, fontSize:10, color:tokens.textSecondary, background:tokens.bgSurfaceHover, padding:'3px 9px', borderRadius:20, border:`1px solid ${tokens.border}` }}>{a.subject.code}</span>
                      {isComplete && <span style={{ fontFamily:font.mono, fontSize:10, color:tokens.success, background:tokens.successBg, padding:'3px 9px', borderRadius:20, border:`1px solid ${tokens.successBorder}` }}>✓ Complete</span>}
                    </div>
                    <div style={{ fontSize:16, fontWeight:700, color:tokens.textPrimary, fontFamily:"'Syne',sans-serif" }}>{a.subject.name}</div>
                    <div style={{ fontSize:12, color:tokens.textMuted, marginTop:3 }}>{a.section.department} · Sem {a.section.semester}</div>
                  </div>

                  <div>
                    <div style={{ display:'flex', justifyContent:'space-between', marginBottom:7 }}>
                      <span style={{ fontFamily:font.mono, fontSize:10, color:tokens.textMuted, letterSpacing:'0.1em', textTransform:'uppercase' }}>Experiments Defined</span>
                      <span style={{ fontFamily:font.mono, fontSize:11, color: isComplete ? tokens.success : tokens.accent, fontWeight:700 }}>{defined}/{total}</span>
                    </div>
                    <div style={{ height:5, background:tokens.bgSurfaceHover, border:`1px solid ${tokens.border}`, borderRadius:3 }}>
                      <div style={{ height:'100%', width:`${pct}%`, background: isComplete ? tokens.success : tokens.accentGrad, borderRadius:3, transition:'width 0.4s' }} />
                    </div>
                  </div>

                  <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fit, minmax(140px, 1fr))', gap:10 }}>
                    <button onClick={() => setSlotEditorFor(a)} style={{ padding:'11px', background:tokens.accentMuted, border:`1px solid ${tokens.accentBorder}`, borderRadius:10, color:tokens.accent, fontFamily:font.mono, fontWeight:700, fontSize:11, letterSpacing:'0.06em', cursor:'pointer', transition:'all 0.2s', display:'flex', alignItems:'center', justifyContent:'center', gap:6 }}
                      onMouseEnter={e => { e.currentTarget.style.background=tokens.bgSurfaceHover; }}
                      onMouseLeave={e => { e.currentTarget.style.background=tokens.accentMuted; }}>
                      ✏️ Set Experiments
                    </button>
                    <button onClick={() => setRecordsFor(a)} style={{ padding:'11px', background:tokens.btnSecondaryBg, border:`1px solid ${tokens.btnSecondaryBorder}`, borderRadius:10, color:tokens.btnSecondaryText, fontFamily:font.mono, fontSize:11, letterSpacing:'0.06em', cursor:'pointer', transition:'all 0.2s', display:'flex', alignItems:'center', justifyContent:'center', gap:6 }}
                      onMouseEnter={e => { e.currentTarget.style.background=tokens.bgSurfaceHover; e.currentTarget.style.color=tokens.textPrimary; }}
                      onMouseLeave={e => { e.currentTarget.style.borderColor=tokens.btnSecondaryBorder; e.currentTarget.style.color=tokens.btnSecondaryText; }}>
                      📋 Submissions ({a._count?.labRecords || 0})
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {slotEditorFor && <SlotEditor assignment={slotEditorFor} onClose={() => setSlotEditorFor(null)} onSaved={() => labAssignmentApi.getMyAssignments().then(r => setAssignments(r.data))} />}
        {recordsFor && <RecordsViewer assignment={recordsFor} onClose={() => setRecordsFor(null)} />}
      </div>
    </>
  );
}