import React, { useState, useRef } from 'react';
import { useRouter } from '../../App';
import { useTheme } from '../../context/ThemeContext';
import LabScanLogo from '../../components/LabScanLogo';

const apiClient = async (url, options = {}) => {
  const token = sessionStorage.getItem('labscan_token');
  const res = await fetch(url, {
    ...options,
    headers: {
      Authorization: `Bearer ${token}`,
      ...(options.headers || {}),
    },
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.error || 'Request failed');
  return data;
};

export default function AdminBulkImport() {
  const { navigate } = useRouter();
  const { tokens } = useTheme();
  const fileRef = useRef(null);

  const [file, setFile]           = useState(null);
  const [importing, setImporting] = useState(false);
  const [result, setResult]       = useState(null);
  const [error, setError]         = useState('');
  const [dragOver, setDragOver]   = useState(false);

  const isDark = tokens.colorScheme === 'dark';

  const handleFile = (f) => {
    if (!f) return;
    if (!f.name.endsWith('.csv')) { setError('Please upload a .csv file'); return; }
    setFile(f);
    setError('');
    setResult(null);
  };

  const handleDrop = (e) => {
    e.preventDefault();
    setDragOver(false);
    handleFile(e.dataTransfer.files[0]);
  };

  const handleImport = async () => {
    if (!file) { setError('Please select a CSV file first'); return; }
    setImporting(true);
    setError('');
    setResult(null);

    const formData = new FormData();
    formData.append('file', file);

    try {
      const data = await fetch('/api/admin/bulk-import/students', {
        method: 'POST',
        headers: { Authorization: `Bearer ${sessionStorage.getItem('labscan_token')}` },
        body: formData,
      });
      const json = await data.json();
      if (!data.ok) throw new Error(json.error || 'Import failed');
      setResult(json);
      setFile(null);
      if (fileRef.current) fileRef.current.value = '';
    } catch (err) {
      setError(err.message);
    } finally {
      setImporting(false);
    }
  };

  const downloadTemplate = () => {
    const csv = [
      'name,email,rollNumber,department,sectionId,password',
      'Ravi Kumar,ravi.kumar@college.edu,22CS001,CSE,,Welcome@123',
      'Priya Sharma,priya.sharma@college.edu,22CS002,CSE,,Welcome@123',
      'Anjali Reddy,anjali.reddy@college.edu,22EC001,ECE,,Welcome@123',
    ].join('\r\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const url  = URL.createObjectURL(blob);
    const a    = document.createElement('a');
    a.href     = url;
    a.download = 'student_import_template.csv';
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <>
      <link href="https://fonts.googleapis.com/css2?family=Space+Mono:wght@400;700&family=DM+Sans:wght@300;400;500&family=Syne:wght@700;800&display=swap" rel="stylesheet" />
      <style>{`
        *,*::before,*::after{box-sizing:border-box;margin:0;padding:0;}
        @keyframes fadeUp{from{opacity:0;transform:translateY(16px);}to{opacity:1;transform:translateY(0);}}
        @keyframes spin{to{transform:rotate(360deg);}}
        @keyframes gridPulse{0%,100%{opacity:.025;}50%{opacity:.055;}}
      `}</style>

      <div style={{ minHeight:'100vh', background:tokens.bgPage, color:tokens.textPrimary, fontFamily:"'DM Sans',sans-serif", position:'relative', transition:'background 0.3s ease, color 0.3s ease' }}>
        {/* Grid bg */}
        <div style={{ position:'fixed', inset:0, pointerEvents:'none', zIndex:0, backgroundImage:`linear-gradient(${tokens.border} 1px,transparent 1px),linear-gradient(90deg,${tokens.border} 1px,transparent 1px)`, backgroundSize:'60px 60px', opacity: isDark ? 0.6 : 0.3 }} />

        {/* Nav */}
        <nav style={{ position:'sticky', top:0, zIndex:50, padding:'0 20px', height:60, display:'flex', alignItems:'center', gap:12, background:tokens.bgNav, backdropFilter:tokens.backdropBlur, borderBottom:`1px solid ${tokens.border}` }}>
          <button onClick={() => navigate('admin-dashboard')} style={{ background:'none', border:'none', cursor:'pointer', color:tokens.textMuted, display:'flex', alignItems:'center', padding:4, transition:'color 0.2s' }}
            onMouseEnter={e=>e.currentTarget.style.color=tokens.accent} onMouseLeave={e=>e.currentTarget.style.color=tokens.textMuted}>
            <svg width="18" height="18" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M10 19l-7-7m0 0l7-7m-7 7h18" /></svg>
          </button>
          <div style={{ width:1, height:20, background:tokens.border }} />
          <LabScanLogo size={26} gradientId="bulkLogoGrad" />
          <span style={{ fontFamily:"'Syne',sans-serif", fontWeight:800, fontSize:15, color: tokens.textPrimary }}>LabScan</span>
          <span style={{ fontFamily:"'Space Mono',monospace", fontSize:10, color:tokens.accent, letterSpacing:'0.12em', marginLeft:4 }}>/ BULK IMPORT</span>
        </nav>

        <main style={{ position:'relative', zIndex:1, maxWidth:760, margin:'0 auto', padding:'48px 24px 80px' }}>

          {/* Header */}
          <div style={{ marginBottom:36, animation:'fadeUp 0.4s ease forwards' }}>
            <div style={{ fontFamily:"'Space Mono',monospace", fontSize:11, letterSpacing:'0.2em', color:tokens.accent, marginBottom:8 }}>ADMIN</div>
            <h1 style={{ fontFamily:"'Syne',sans-serif", fontWeight:800, fontSize:28, letterSpacing:'-0.02em', marginBottom:8, color: tokens.textPrimary }}>Bulk Student Import</h1>
            <p style={{ fontSize:14, color:tokens.textMuted, lineHeight:1.6 }}>Upload a CSV file to create hundreds of student accounts at once. Duplicates are automatically skipped.</p>
          </div>

          {/* Step 1 — Download template */}
          <div style={{ border:`1px solid ${tokens.border}`, borderRadius:16, background:tokens.bgCard, padding:24, marginBottom:20, animation:'fadeUp 0.4s 0.05s ease both' }}>
            <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', gap:16, flexWrap:'wrap' }}>
              <div>
                <div style={{ fontFamily:"'Space Mono',monospace", fontSize:10, letterSpacing:'0.15em', color:tokens.textDimmer, marginBottom:6 }}>STEP 1</div>
                <div style={{ fontWeight:600, fontSize:15, marginBottom:4, color: tokens.textPrimary }}>Download the CSV Template</div>
                <p style={{ fontSize:13, color:tokens.textMuted }}>Fill it in with your student data. Required columns: <code style={{ fontFamily:"'Space Mono',monospace", fontSize:11, color:tokens.accent, background:tokens.accentMuted, padding:'1px 6px', borderRadius:4 }}>name, email, rollNumber, department, password</code></p>
              </div>
              <button onClick={downloadTemplate} style={{ padding:'10px 20px', background:'transparent', border:`1.5px solid ${tokens.accentBorder}`, borderRadius:10, cursor:'pointer', color:tokens.accent, fontFamily:"'Space Mono',monospace", fontSize:12, letterSpacing:'0.06em', display:'flex', alignItems:'center', gap:8, whiteSpace:'nowrap', transition:'all 0.2s' }}
                onMouseEnter={e=>{e.currentTarget.style.background=tokens.accentMuted; e.currentTarget.style.borderColor=tokens.accent;}}
                onMouseLeave={e=>{e.currentTarget.style.background='transparent'; e.currentTarget.style.borderColor=tokens.accentBorder;}}>
                <svg width="14" height="14" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" /></svg>
                Download Template
              </button>
            </div>

            {/* Column reference */}
            <div style={{ marginTop:20, padding:16, background:tokens.bgSurfaceHover, borderRadius:10, border:`1px solid ${tokens.border}` }}>
              <div style={{ fontFamily:"'Space Mono',monospace", fontSize:10, letterSpacing:'0.12em', color:tokens.textDimmer, marginBottom:12 }}>COLUMN REFERENCE</div>
              <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fill, minmax(200px, 1fr))', gap:8 }}>
                {[
                  { col:'name', req:true, desc:'Full name' },
                  { col:'email', req:true, desc:'Unique email address' },
                  { col:'rollNumber', req:true, desc:'Unique roll no. (e.g. 22CS001)' },
                  { col:'department', req:true, desc:'e.g. CSE, ECE, EEE' },
                  { col:'password', req:true, desc:'Min 6 chars (e.g. Welcome@123)' },
                  { col:'sectionId', req:false, desc:'Section ID from HOD dashboard' },
                ].map(({ col, req, desc }) => (
                  <div key={col} style={{ display:'flex', gap:8, alignItems:'flex-start' }}>
                    <span style={{ fontFamily:"'Space Mono',monospace", fontSize:11, color: req ? tokens.accent : tokens.textMuted, background: req ? tokens.accentMuted : tokens.bgPage, padding:'2px 7px', borderRadius:5, border: `1px solid ${req ? tokens.accentBorder : tokens.border}`, whiteSpace:'nowrap' }}>{col}{req ? ' *' : ''}</span>
                    <span style={{ fontSize:12, color:tokens.textMuted, paddingTop:2 }}>{desc}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Step 2 — Upload */}
          <div style={{ border:`1px solid ${tokens.border}`, borderRadius:16, background:tokens.bgCard, padding:24, marginBottom:20, animation:'fadeUp 0.4s 0.1s ease both' }}>
            <div style={{ fontFamily:"'Space Mono',monospace", fontSize:10, letterSpacing:'0.15em', color:tokens.textDimmer, marginBottom:6 }}>STEP 2</div>
            <div style={{ fontWeight:600, fontSize:15, marginBottom:16, color: tokens.textPrimary }}>Upload Your CSV</div>

            {/* Drop zone */}
            <div
              onDragOver={e=>{e.preventDefault(); setDragOver(true);}}
              onDragLeave={()=>setDragOver(false)}
              onDrop={handleDrop}
              onClick={()=>fileRef.current?.click()}
              style={{ border:`2px dashed ${dragOver ? tokens.accent : file ? tokens.success : tokens.borderStrong}`, borderRadius:12, padding:'36px 24px', textAlign:'center', cursor:'pointer', background: dragOver ? tokens.accentMuted : file ? tokens.successBg : 'transparent', transition:'all 0.2s' }}>
              <input ref={fileRef} type="file" accept=".csv" style={{ display:'none' }} onChange={e=>handleFile(e.target.files[0])} />
              {file ? (
                <>
                  <div style={{ fontSize:28, marginBottom:8 }}>📄</div>
                  <div style={{ fontFamily:"'Space Mono',monospace", fontSize:13, color:tokens.success, marginBottom:4 }}>{file.name}</div>
                  <div style={{ fontSize:12, color:tokens.textMuted }}>{(file.size / 1024).toFixed(1)} KB — click to change</div>
                </>
              ) : (
                <>
                  <svg width="36" height="36" fill="none" viewBox="0 0 24 24" stroke={tokens.borderStrong} strokeWidth={1.2} style={{ margin:'0 auto 12px' }}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
                  </svg>
                  <div style={{ fontSize:14, color:tokens.textSecondary, marginBottom:4 }}>Drop your CSV here or <span style={{ color:tokens.accent }}>click to browse</span></div>
                  <div style={{ fontSize:12, color:tokens.textMuted }}>Max 5 MB · .csv only</div>
                </>
              )}
            </div>

            {error && (
              <div style={{ marginTop:14, padding:'12px 16px', background:tokens.dangerBg, border:`1px solid ${tokens.dangerBorder}`, borderRadius:10, color:tokens.danger, fontSize:13, display:'flex', gap:10, alignItems:'center' }}>
                <svg width="15" height="15" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M12 9v4m0 4h.01M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z" /></svg>
                {error}
              </div>
            )}

            <button onClick={handleImport} disabled={importing || !file} style={{ marginTop:16, width:'100%', padding:'14px', background: importing || !file ? tokens.btnSecondaryBg : tokens.accentGrad, border:'none', borderRadius:10, cursor: importing || !file ? 'not-allowed' : 'pointer', color: importing || !file ? tokens.textDimmer : tokens.textInverse, fontFamily:"'Space Mono',monospace", fontWeight:700, fontSize:13, letterSpacing:'0.08em', display:'flex', alignItems:'center', justifyContent:'center', gap:8, transition:'all 0.2s' }}>
              {importing ? (
                <><div style={{ width:14, height:14, border:'2px solid rgba(0,0,0,0.2)', borderTopColor:tokens.textInverse, borderRadius:'50%', animation:'spin 0.8s linear infinite' }} /> Importing...</>
              ) : 'Import Students'}
            </button>
          </div>

          {/* Result panel */}
          {result && (
            <div style={{ border:`1px solid ${tokens.successBorder}`, borderRadius:16, background:tokens.successBg, padding:24, animation:'fadeUp 0.4s ease forwards' }}>
              <div style={{ fontFamily:"'Space Mono',monospace", fontSize:10, letterSpacing:'0.15em', color:tokens.textDimmer, marginBottom:16 }}>IMPORT RESULT</div>

              {/* Summary stats */}
              <div style={{ display:'grid', gridTemplateColumns:'repeat(3, 1fr)', gap:12, marginBottom: result.errors.length > 0 ? 20 : 0 }}>
                {[
                  { label:'Created', value:result.created, color:tokens.success },
                  { label:'Skipped', value:result.skipped, color:tokens.warning },
                  { label:'Errors', value:result.errors.length, color: result.errors.length > 0 ? tokens.danger : tokens.textDimmer },
                ].map(({ label, value, color }) => (
                  <div key={label} style={{ padding:'16px', background:tokens.bgSurface, borderRadius:10, border:`1px solid ${tokens.border}`, textAlign:'center' }}>
                    <div style={{ fontFamily:"'Syne',sans-serif", fontWeight:800, fontSize:28, color, marginBottom:4 }}>{value}</div>
                    <div style={{ fontFamily:"'Space Mono',monospace", fontSize:10, letterSpacing:'0.1em', color:tokens.textMuted }}>{label}</div>
                  </div>
                ))}
              </div>

              {/* Error detail table */}
              {result.errors.length > 0 && (
                <div>
                  <div style={{ fontFamily:"'Space Mono',monospace", fontSize:10, letterSpacing:'0.12em', color:tokens.danger, marginBottom:10 }}>ROWS WITH ISSUES ({result.errors.length})</div>
                  <div style={{ maxHeight:300, overflowY:'auto', border:`1px solid ${tokens.dangerBorder}`, borderRadius:10, background: tokens.bgSurface }}>
                    <table style={{ width:'100%', borderCollapse:'collapse', fontSize:12 }}>
                      <thead>
                        <tr style={{ background:tokens.dangerBg }}>
                          {['Row', 'Roll Number', 'Reason'].map(h => (
                            <th key={h} style={{ padding:'8px 12px', textAlign:'left', fontFamily:"'Space Mono',monospace", fontSize:10, letterSpacing:'0.08em', color:tokens.textMuted, borderBottom:`1px solid ${tokens.dangerBorder}` }}>{h}</th>
                          ))}
                        </tr>
                      </thead>
                      <tbody>
                        {result.errors.map((err, i) => (
                          <tr key={i} style={{ borderBottom:`1px solid ${tokens.borderMuted}` }}>
                            <td style={{ padding:'8px 12px', fontFamily:"'Space Mono',monospace", color:tokens.textSecondary }}>{err.row}</td>
                            <td style={{ padding:'8px 12px', fontFamily:"'Space Mono',monospace", color:tokens.accent }}>{err.rollNumber || '—'}</td>
                            <td style={{ padding:'8px 12px', color:tokens.danger }}>{err.reason}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                  <p style={{ fontSize:12, color:tokens.textMuted, marginTop:8 }}>Fix these rows and re-upload — duplicates will be skipped automatically.</p>
                </div>
              )}
            </div>
          )}
        </main>
      </div>
    </>
  );
}