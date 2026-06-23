import React, { useState, useEffect } from 'react';
import LabScanLogo from '../../components/LabScanLogo';
import { useRouter } from '../../App';
import FileUpload from '../../components/FileUpload';
import { experimentsApi } from '../../api/experiments.api';
import { useTheme } from '../../context/ThemeContext';

const DEPARTMENTS = ['CSE','ECE','EEE','Mechanical','Civil','Chemical','IT','Physics','Chemistry','Mathematics','Other'];

const STAGE_DEFS = [
  { id:1, label:'Stage 1 — Learn', shortLabel:'Learn', icon:'📖', desc:'Theory, formulas, PDFs and reference material', accent:'#63d2ff',
    types:['TEXT','PDF','SAMPLE_RESULT'], typeLabels:{ TEXT:{icon:'📝',label:'Theory / Content',rows:5,placeholder:'Enter theory, background, or introduction…'}, PDF:{icon:'📄',label:'PDF Reference',rows:0,placeholder:''}, SAMPLE_RESULT:{icon:'🧪',label:'Expected Results',rows:2,placeholder:'{"pH": "7.0", "color": "pink"}'} } },
  { id:2, label:'Stage 2 — Watch & Do', shortLabel:'Watch', icon:'▶️', desc:'YouTube videos, Virtual Lab simulations, procedure checklist', accent:'#fbbf24',
    types:['YOUTUBE','VIRTUAL_LAB','STEP'], typeLabels:{ YOUTUBE:{icon:'▶️',label:'YouTube Video',rows:1,placeholder:'https://www.youtube.com/watch?v=…'}, VIRTUAL_LAB:{icon:'🔬',label:'Virtual Lab URL',rows:1,placeholder:'https://vlab.amrita.edu/…'}, STEP:{icon:'✅',label:'Checklist Steps',rows:3,placeholder:'1. Add 10 mL of HCl\n2. Slowly add NaOH\n3. Note the colour change'} } },
  { id:3, label:'Stage 3 — Submit', shortLabel:'Submit', icon:'📤', desc:'Result fields students must fill in', accent:'#4af0c4', note:'Define expected result keys.',
    types:['SAMPLE_RESULT'], typeLabels:{ SAMPLE_RESULT:{icon:'🧪',label:'Result Fields (JSON keys)',rows:2,placeholder:'{"pH": "7.0", "color": "pink", "volume_mL": "25"}'} } },
];

const ALL_TYPE_LABELS = STAGE_DEFS.reduce((acc,s) => ({ ...acc,...s.typeLabels }), {});

function encodeLabel(stageId, label) { return `__s${stageId}__${label||''}`; }
function decodeLabel(raw) { const m=(raw||'').match(/^__s(\d+)__(.*)$/s); if(m) return { stageId:parseInt(m[1]), label:m[2] }; return { stageId:1, label:raw||'' }; }

function makeBaseInput(tokens) { return { width:'100%', padding:'10px 13px', background:tokens.bgInput, border:`1px solid ${tokens.borderInput}`, borderRadius:8, color:tokens.textPrimary, fontSize:13, fontFamily:"'DM Sans',sans-serif", outline:'none', resize:'none', transition:'border-color 0.2s', colorScheme:tokens.colorScheme }; }

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
    <div style={{ border:`1px solid ${tokens.border}`, borderRadius:12, padding:'16px', background:tokens.bgCard, transition:'border-color 0.2s' }}>
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
          <button type="button" onClick={() => onDelete(index)} style={{ background:'none', border:'none', cursor:'pointer', color:tokens.textDimmer, padding:4, marginLeft:4, transition:'color 0.2s' }}
            onMouseEnter={e => e.currentTarget.style.color=tokens.danger} onMouseLeave={e => e.currentTarget.style.color=tokens.textDimmer}>
            <svg width="13" height="13" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" /></svg>
          </button>
        </div>
      </div>

      <input type="text" placeholder="Section label (optional)" value={block.label||''} onChange={e => onChange(index,'label',e.target.value)}
        style={{ ...baseInput, marginBottom:8, fontSize:12 }} />

      {block.type==='PDF' ? (
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
            <>
              <FileUpload accept="application/pdf" label="Upload PDF document" onFileSelect={handleFileUpload} preview={false} />
              {uploadError && <p style={{ color:tokens.danger, fontSize:11, marginTop:4 }}>{uploadError}</p>}
            </>
          )}
        </div>
      ) : (
        <textarea rows={info.rows||3} placeholder={info.placeholder||''} value={block.content} onChange={e => onChange(index,'content',e.target.value)} style={baseInput} />
      )}
      {block.type==='SAMPLE_RESULT' && <p style={{ fontSize:11, color:tokens.textDimmer, marginTop:5 }}>JSON format: {`{"key": "value", ...}`}</p>}
    </div>
  );
}

function StagePanel({ stageDef, blocks, onChange, onDelete, onMoveUp, onMoveDown, onAdd, experimentId }) {
  const { tokens } = useTheme();
  const { accent } = stageDef;
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

export default function ExperimentForm() {
  const { tokens } = useTheme();
  const baseInput = makeBaseInput(tokens);
  const { params, navigate } = useRouter();
  const { mode, experimentId } = params;
  const isEdit = mode === 'edit' && Boolean(experimentId);
  const isDark = tokens.colorScheme === 'dark';

  const [form, setForm] = useState({ title:'', description:'', arucoId:'', department:'' });
  const [stageBlocks, setStageBlocks] = useState({ 1:[], 2:[], 3:[] });
  const [savedExpId, setSavedExpId] = useState(experimentId||null);
  const [loading, setLoading] = useState(isEdit);
  const [campaignSaving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [departmentError, setDepartmentError] = useState(false);
  const [shakeDept, setShakeDept] = useState(false);
  const [toast, setToast] = useState(null);
  const [activeTab, setActiveTab] = useState(1);
  const [focused, setFocused] = useState(null);

  const showToast = (msg, type = 'error') => {
    setToast({ msg, type });
    setTimeout(() => setToast(null), 4000);
  };

  useEffect(() => {
    if (isEdit) {
      experimentsApi.getById(experimentId)
        .then(res => {
          const exp = res.data;
          setForm({ title:exp.title, description:exp.description, arucoId:String(exp.arucoId), department:exp.department||'' });
          const byStage = { 1:[], 2:[], 3:[] };
          (exp.contents||[]).forEach(c => {
            const { stageId, label } = decodeLabel(c.label);
            const sid = [1,2,3].includes(stageId)?stageId:1;
            byStage[sid].push({ id:c.id, type:c.type, content:c.content, label, order:c.order });
          });
          setStageBlocks(byStage);
          setSavedExpId(exp.id);
        })
        .catch(() => setError('Failed to load experiment'))
        .finally(() => setLoading(false));
    }
  }, [experimentId, isEdit]);

  const updateStage = (sid, fn) => setStageBlocks(prev => ({ ...prev, [sid]:fn(prev[sid]) }));
  const handleAdd    = (sid) => updateStage(sid, prev => [...prev, { type:STAGE_DEFS.find(s=>s.id===sid)?.types[0]||'TEXT', content:'', label:'', order:prev.length+1 }]);
  const handleChange = (sid, i, f, v) => updateStage(sid, prev => { const a=[...prev]; a[i]={...a[i],[f]:v}; return a; });
  const handleDelete = (sid, i) => updateStage(sid, prev => prev.filter((_,idx)=>idx!==i));
  const handleMoveUp   = (sid, i) => updateStage(sid, prev => { if(i===0) return prev; const a=[...prev]; [a[i-1],a[i]]=[a[i],a[i-1]]; return a; });
  const handleMoveDown = (sid, i) => updateStage(sid, prev => { if(i===prev.length-1) return prev; const a=[...prev]; [a[i],a[i+1]]=[a[i+1],a[i]]; return a; });

  const handleSave = async (e) => {
    if (e && e.preventDefault) e.preventDefault();
    if (e && e.stopPropagation) e.stopPropagation();
    setError(''); 
    setDepartmentError(false);
    
    if (!form.title.trim() || !form.description.trim()) { 
      setError('Title and description are required fields.');
      window.scrollTo({ top: 0, behavior: 'smooth' });
      return; 
    }

    const arucoNum = parseInt(form.arucoId, 10);
    if (!form.arucoId.trim() || isNaN(arucoNum) || arucoNum < 0 || arucoNum > 1023) {
      setError('ArUco ID must be a valid integer between 0 and 1023.');
      window.scrollTo({ top: 0, behavior: 'smooth' });
      return;
    }

    if (!form.department) {
      setDepartmentError(true);
      setShakeDept(true);
      setTimeout(() => setShakeDept(false), 600);
      showToast('⚠️ Please select a department before saving.');
      return;
    }
    
    setSaving(true);
    try {
      let expId = savedExpId;
      let globalOrder = 1;
      const allContents = [];
      for (const stageDef of STAGE_DEFS) {
        const blocks = stageBlocks[stageDef.id] || [];
        for (const block of blocks) {
          allContents.push({ type:block.type, content:block.content || '', label:encodeLabel(stageDef.id,block.label), order:globalOrder++ });
        }
      }
      
      if (isEdit && expId) {
        await experimentsApi.update(expId, { title:form.title, description:form.description, arucoId:arucoNum, department:form.department });
        const existing = await experimentsApi.getById(expId);
        const existingContents = existing.data?.contents || [];
        await Promise.all(existingContents.map(c => experimentsApi.deleteContent(expId, c.id).catch(() => null)));
        await Promise.all(allContents.map(c => experimentsApi.addContent(expId, c)));
      } else {
        const res = await experimentsApi.create({ title:form.title, description:form.description, arucoId:arucoNum, department:form.department, contents:allContents });
        expId = res.data.id;
        setSavedExpId(expId);
      }
      navigate('experiment-manager');
    } catch (err) {
      const msg = err.response?.data?.error || err.message || 'Failed to save. Please try again.';
      setError(msg);
      window.scrollTo({ top: 0, behavior: 'smooth' });
    } finally { 
      setSaving(false); 
    }
  };

  const totalBlocks = Object.values(stageBlocks).reduce((n,arr)=>n+arr.length,0);

  if (loading) return (
    <div style={{ minHeight:'100vh', background:tokens.bgPage, display:'flex', alignItems:'center', justifyContent:'center' }}>
      <div style={{ width:32, height:32, border:`2px solid ${tokens.accentMuted}`, borderTopColor:tokens.accent, borderRadius:'50%', animation:'spin 0.8s linear infinite' }} />
    </div>
  );

  return (
    <>
      <link href="https://fonts.googleapis.com/css2?family=Space+Mono:wght@400;700&family=DM+Sans:wght@300;400;500&family=Syne:wght@700;800&display=swap" rel="stylesheet" />
      <style>{`
        *,*::before,*::after{box-sizing:border-box;margin:0;padding:0;}
        @keyframes fadeUp{from{opacity:0;transform:translateY(20px);}to{opacity:1;transform:translateY(0);}}
        @keyframes gridPulse{0%,100%{opacity:.025;}50%{opacity:.055;}}
        @keyframes spin{to{transform:rotate(360deg);}}
        @keyframes shake{0%,100%{transform:translateX(0);}15%{transform:translateX(-7px);}30%{transform:translateX(7px);}45%{transform:translateX(-5px);}60%{transform:translateX(5px);}75%{transform:translateX(-3px);}90%{transform:translateX(3px);}}
        @keyframes toastSlideIn{from{opacity:0;transform:translateX(110%);}to{opacity:1;transform:translateX(0);}}
        .dept-shake{animation:shake 0.55s ease;}
        select option{background:${tokens.bgModal};color:${tokens.textPrimary};}
        textarea{resize:vertical;}
        ::-webkit-scrollbar{width:6px;}::-webkit-scrollbar-track{background:${tokens.bgPage};}::-webkit-scrollbar-thumb{background:${tokens.borderStrong};border-radius:3px;}
      `}</style>

      <div style={{ minHeight:'100vh', background:tokens.bgPage, color:tokens.textPrimary, fontFamily:"'DM Sans',sans-serif", position:'relative', transition:'background 0.3s ease, color 0.3s ease' }}>
        <div style={{ position:'fixed', inset:0, pointerEvents:'none', zIndex:0, backgroundImage:`linear-gradient(${tokens.border} 1px,transparent 1px),linear-gradient(90deg,${tokens.border} 1px,transparent 1px)`, backgroundSize:'60px 60px', opacity: isDark ? 1 : 0.4, animation:'gridPulse 6s ease-in-out infinite' }} />

        {toast && (
          <div style={{ position:'fixed', bottom:32, right:32, zIndex:9999, display:'flex', alignItems:'center', gap:12, padding:'14px 18px', background:tokens.bgModal, border:`1px solid ${tokens.border}`, borderRadius:12, boxShadow:tokens.shadowModal, backdropFilter:'blur(20px)', animation:'toastSlideIn 0.35s cubic-bezier(0.34,1.56,0.64,1) forwards', maxWidth:340 }}>
            <div style={{ width:32, height:32, borderRadius:8, background:tokens.dangerBg, border:`1px solid ${tokens.dangerBorder}`, display:'flex', alignItems:'center', justifyContent:'center', flexShrink:0, fontSize:15 }}>⚠️</div>
            <div>
              <div style={{ fontFamily:"'Space Mono',monospace", fontSize:11, letterSpacing:'0.08em', color:tokens.danger, marginBottom:3 }}>MISSING FIELD</div>
              <div style={{ fontSize:13, color:tokens.textSecondary, lineHeight:1.4 }}>Please select a department before saving.</div>
            </div>
            <button onClick={() => setToast(null)} style={{ background:'none', border:'none', cursor:'pointer', color:tokens.textDimmer, padding:'4px', marginLeft:4, flexShrink:0 }}
              onMouseEnter={e=>e.currentTarget.style.color=tokens.textPrimary} onMouseLeave={e=>e.currentTarget.style.color=tokens.textDimmer}>
              <svg width="12" height="12" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}><path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" /></svg>
            </button>
          </div>
        )}

        <nav style={{ position:'sticky', top:0, zIndex:50, padding:'0 16px', height:60, display:'flex', alignItems:'center', gap:12, background:tokens.bgNav, backdropFilter:tokens.backdropBlur, borderBottom:`1px solid ${tokens.border}` }}>
          <button onClick={() => navigate('experiment-manager')} style={{ background:'none', border:'none', cursor:'pointer', color:tokens.textMuted, display:'flex', alignItems:'center', padding:4, transition:'color 0.2s' }}
            onMouseEnter={e=>e.currentTarget.style.color=tokens.accent} onMouseLeave={e=>e.currentTarget.style.color=tokens.textMuted}>
            <svg width="18" height="18" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M10 19l-7-7m0 0l7-7m-7 7h18" /></svg>
          </button>
          <div style={{ width:1, height:20, background:tokens.border }} />
          <div style={{ display:'flex', alignItems:'center', gap:10 }}>
            <LabScanLogo size={26} gradientId="expFormLogoGrad" />
            <span style={{ fontFamily:"'Syne',sans-serif", fontWeight:800, fontSize:15, color: tokens.textPrimary }}>LabScan</span>
          </div>
          <div style={{ marginLeft:'auto', display:'flex', alignItems:'center', gap:10 }}>
            <span style={{ fontFamily:"'Space Mono',monospace", fontSize:10, color:tokens.textDimmer, letterSpacing:'0.1em' }}>{totalBlocks} BLOCK{totalBlocks!==1?'S':''}</span>
          </div>
        </nav>

        <main style={{ position:'relative', zIndex:1, maxWidth:760, margin:'0 auto', padding:'48px 24px 80px' }}>
          <div style={{ marginBottom:36, animation:'fadeUp 0.5s ease forwards' }}>
            <div style={{ fontFamily:"'Space Mono',monospace", fontSize:11, letterSpacing:'0.2em', color:tokens.accent, textTransform:'uppercase', marginBottom:8 }}>Faculty</div>
            <h1 style={{ fontFamily:"'Syne',sans-serif", fontWeight:800, fontSize:30, letterSpacing:'-0.02em', color: tokens.textPrimary }}>{isEdit?'Edit Experiment':'New Experiment'}</h1>
          </div>

          {error && <div style={{ marginBottom:20, padding:'14px 16px', background:tokens.dangerBg, border:`1px solid ${tokens.dangerBorder}`, borderRadius:10, color:tokens.danger, fontSize:13, display:'flex', alignItems:'flex-start', gap:10 }}>
            <svg width="16" height="16" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2} style={{ flexShrink:0, marginTop:1 }}><path strokeLinecap="round" strokeLinejoin="round" d="M12 9v4m0 4h.01M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z" /></svg>
            <span>{error}</span>
          </div>}

          <form onSubmit={handleSave} style={{ display:'flex', flexDirection:'column', gap:24 }}>
            <div style={{ border:`1px solid ${tokens.border}`, borderRadius:16, background:tokens.bgCard, backdropFilter:tokens.backdropBlur, padding:'24px', display:'flex', flexDirection:'column', gap:18, animation:'fadeUp 0.5s 0.1s ease forwards' }}>
              <div style={{ fontFamily:"'Space Mono',monospace", fontSize:10, letterSpacing:'0.15em', color:tokens.textDimmer, textTransform:'uppercase' }}>Basic Information</div>

              {[
                { key:'title', label:'Title', type:'input', placeholder:'e.g. Acid-Base Titration', required:true },
                { key:'description', label:'Description', type:'textarea', placeholder:'Brief description of the experiment and its objectives…', required:true, rows:3 },
              ].map(({ key, label, type, placeholder, required, rows }) => (
                <div key={key}>
                  <label style={{ display:'block', fontFamily:"'Space Mono',monospace", fontSize:11, letterSpacing:'0.1em', color:tokens.textSecondary, textTransform:'uppercase', marginBottom:8 }}>{label}{required&&<span style={{ color:tokens.danger, marginLeft:4 }}>*</span>}</label>
                  {type==='textarea' ? (
                    <textarea rows={rows} placeholder={placeholder} value={form[key]} onChange={e=>setForm({...form,[key]:e.target.value})} onFocus={()=>setFocused(key)} onBlur={()=>setFocused(null)}
                      style={{ ...baseInput, borderColor:focused===key?tokens.accent:tokens.borderInput }} required />
                  ) : (
                    <input type="text" placeholder={placeholder} value={form[key]} onChange={e=>setForm({...form,[key]:e.target.value})} onFocus={()=>setFocused(key)} onBlur={()=>setFocused(null)}
                      style={{ ...baseInput, borderColor:focused===key?tokens.accent:tokens.borderInput }} required />
                  )}
                </div>
              ))}

              <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fit, minmax(180px, 1fr))', gap:14 }}>
                <div>
                  <label style={{ display:'block', fontFamily:"'Space Mono',monospace", fontSize:11, letterSpacing:'0.1em', color: departmentError ? tokens.danger : tokens.textSecondary, textTransform:'uppercase', marginBottom:8, transition:'color 0.2s' }}>Department <span style={{ color:tokens.danger }}>*</span></label>
                  <select
                    value={form.department}
                    onChange={e => { setForm({...form, department:e.target.value}); setDepartmentError(false); }}
                    className={shakeDept ? 'dept-shake' : ''}
                    style={{ ...baseInput, colorScheme:tokens.colorScheme, borderColor: departmentError ? tokens.danger : tokens.borderInput, background: departmentError ? tokens.dangerBg : tokens.bgInput }}
                    required>
                    <option value="">Select department…</option>
                    {DEPARTMENTS.map(d => <option key={d} value={d}>{d}</option>)}
                  </select>
                  {departmentError && (
                    <div style={{ display:'flex', alignItems:'center', gap:5, marginTop:6 }}>
                      <svg width="12" height="12" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}><path strokeLinecap="round" strokeLinejoin="round" d="M12 9v4m0 4h.01M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z" /></svg>
                      <p style={{ fontSize:11, color:tokens.danger, fontFamily:"'Space Mono',monospace", letterSpacing:'0.04em' }}>Department is required</p>
                    </div>
                  )}
                </div>
                <div>
                  <label style={{ display:'block', fontFamily:"'Space Mono',monospace", fontSize:11, letterSpacing:'0.1em', color:tokens.textSecondary, textTransform:'uppercase', marginBottom:8 }}>ArUco Marker ID <span style={{ color:tokens.danger }}>*</span></label>
                  <input
                    type="text"

                    placeholder="0"
                    value={form.arucoId}
                    onChange={e => {
                      const v = e.target.value;
                      setForm(prev => ({ ...prev, arucoId: v }));
                    }}
                    onFocus={() => setFocused('aruco')}
                    onBlur={() => setFocused(null)}
                    style={{ ...baseInput, fontFamily:"'Space Mono',monospace", borderColor: focused==='aruco' ? 'rgba(99,210,255,0.35)' : 'rgba(99,210,255,0.1)' }}
                    required
                  />
                  <p style={{ fontSize:11, color:tokens.textDimmer, marginTop:5 }}>Unique integer (0–1023)</p>
                </div>
              </div>
            </div>

            <div style={{ animation:'fadeUp 0.5s 0.2s ease forwards' }}>
              <div style={{ fontFamily:"'Space Mono',monospace", fontSize:10, letterSpacing:'0.15em', color:tokens.textDimmer, textTransform:'uppercase', marginBottom:16 }}>Experiment Content</div>
              <div style={{ display:'flex', gap:4, background:tokens.bgSurface, border:`1px solid ${tokens.border}`, borderRadius:12, padding:4, marginBottom:20 }}>
                {STAGE_DEFS.map(s => {
                  const isActive = activeTab===s.id;
                  const count = stageBlocks[s.id].length;
                  return (
                    <button key={s.id} type="button" onClick={() => setActiveTab(s.id)} style={{ flex:1, display:'flex', alignItems:'center', justifyContent:'center', gap:6, padding:'9px 12px', borderRadius:9, border:'none', cursor:'pointer', background:isActive?tokens.accentMuted:'transparent', outline:isActive?`1px solid ${tokens.accentBorder}`:'none', color:isActive?tokens.accent:tokens.textSecondary, fontFamily:"'Space Mono',monospace", fontSize:11, letterSpacing:'0.06em', transition:'all 0.2s' }}>
                      <span>{s.icon}</span>
                      <span>Stage {s.id}</span>
                      {count>0 && <span style={{ fontSize:10, padding:'1px 6px', borderRadius:100, background:isActive?`${tokens.accent}33`:tokens.bgSurfaceHover, color:isActive?tokens.accent:tokens.textMuted }}>{count}</span>}
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

            <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', gap:16, animation:'fadeUp 0.5s 0.3s ease forwards', marginTop:12 }}>
              <button type="submit" disabled={campaignSaving} style={{ flex:3, padding:'14px 24px', background:campaignSaving?tokens.btnSecondaryBg:tokens.accentGrad, border:'none', borderRadius:10, cursor:campaignSaving?'not-allowed':'pointer', color:tokens.textInverse, fontFamily:"'Space Mono',monospace", fontWeight:700, fontSize:13, letterSpacing:'0.08em', textAlign:'center', boxShadow:campaignSaving?'none':tokens.shadow, display:'flex', alignItems:'center', justifyContent:'center', gap:8, transition:'all 0.2s' }}>
                {campaignSaving ? (
                  <>
                    <div style={{ width:14, height:14, border:`2px solid ${tokens.textMuted}`, borderTopColor:tokens.textInverse, borderRadius:'50%', animation:'spin 0.8s linear infinite' }} />
                    Saving Changes...
                  </>
                ) : 'Save Changes'}
              </button>

              <div style={{ display:'flex', gap:12, flex:1, justifyContent:'flex-end' }}>
                {isEdit && (
                  <button type="button" onClick={async () => {
                    if(window.confirm("Are you sure you want to delete this experiment slot?")) {
                      try { navigate('experiment-manager'); } catch(e) { setError('Failed to delete slot'); }
                    }
                  }} style={{ padding:'14px 20px', background:tokens.dangerBg, border:`1px solid ${tokens.dangerBorder}`, borderRadius:10, cursor:'pointer', color:tokens.danger, fontFamily:"'Space Mono',monospace", fontSize:12, letterSpacing:'0.04em', transition:'all 0.2s' }}
                    onMouseEnter={e => e.currentTarget.style.background = tokens.bgSurfaceHover} onMouseLeave={e => e.currentTarget.style.background = tokens.dangerBg}>
                    Delete Slot
                  </button>
                )}

                <button type="button" onClick={() => navigate('experiment-manager')} style={{ padding:'14px 20px', background:tokens.btnSecondaryBg, border:`1px solid ${tokens.btnSecondaryBorder}`, borderRadius:10, cursor:'pointer', color:tokens.btnSecondaryText, fontFamily:"'Space Mono',monospace", fontSize:12, letterSpacing:'0.08em', transition:'all 0.2s' }}
                  onMouseEnter={e => { e.currentTarget.style.borderColor = tokens.accent; e.currentTarget.style.color = tokens.textPrimary; }} onMouseLeave={e => { e.currentTarget.style.borderColor = tokens.btnSecondaryBorder; e.currentTarget.style.color = tokens.btnSecondaryText; }}>
                  Cancel
                </button>
              </div>
            </div>
          </form>
        </main>
      </div>
    </>
  );
}