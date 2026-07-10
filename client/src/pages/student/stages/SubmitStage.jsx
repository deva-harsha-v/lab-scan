import React, { useState } from 'react';
import FileUpload from '../../../components/FileUpload';
import { submissionsApi } from '../../../api/submissions.api';
import { useTheme } from '../../../context/ThemeContext';

// members = [{ name, roll }, ...]
export default function SubmitStage({ experiment, session, members = [] }) {
  const { tokens } = useTheme();
  const [experimentNumber, setExperimentNumber] = useState('');
  const [photo, setPhoto] = useState(null);
  const [submitted, setSubmitted] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const primaryMember = members[0] || {};

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    if (!experimentNumber.toString().trim()) { setError('Please enter the experiment number.'); return; }
    if (!photo) { setError('Please upload your observation photo.'); return; }
    if (!primaryMember.roll) { setError('Roll number missing. Please go back and re-join.'); return; }
    setLoading(true);
    try {
      const formData = new FormData();
      formData.append('sessionCode', session.code);
      // studentName will be resolved server-side from the roll number
      // Send member names; server will resolve/override from roll numbers in DB
      formData.append('studentName', members.map(m => m.name || m.roll).join(', '));
      formData.append('rollNumber', members.map(m => m.roll).join(', '));
      formData.append('experimentName', `Experiment ${experimentNumber.toString().trim()}`);
      formData.append('resultNotes', JSON.stringify({ experimentNumber: experimentNumber.toString().trim() }));
      formData.append('observationPhoto', photo);
      await submissionsApi.create(formData);
      setSubmitted(true);
    } catch (err) {
      if (err.response?.status === 409) setError('Already submitted for this session.');
      else if (err.response?.status === 410) setError('Session closed. Submissions no longer accepted.');
      else setError(err.response?.data?.error || 'Submission failed. Please try again.');
    } finally { setLoading(false); }
  };

  const card = { border:`1px solid ${tokens.border}`, borderRadius:14, background:tokens.bgCard, padding:'20px', marginBottom:16, transition: 'background 0.3s ease, border-color 0.3s ease' };
  const label = { display:'block', fontFamily:"'Space Mono',monospace", fontSize:10, letterSpacing:'0.12em', color:tokens.textMuted, textTransform:'uppercase', marginBottom:8 };
  const input = { width:'100%', padding:'10px 13px', background:tokens.bgInput, border:`1px solid ${tokens.borderInput}`, borderRadius:8, color:tokens.textPrimary, fontSize:14, fontFamily:"'DM Sans',sans-serif", outline:'none', colorScheme:tokens.colorScheme, transition: 'all 0.2s ease' };

  if (submitted) {
    return (
      <div style={{ ...card, textAlign:'center', padding:'40px 24px' }}>
        <div style={{ width:60, height:60, background:tokens.successBg, border: `1px solid ${tokens.successBorder}`, color: tokens.success, borderRadius:'50%', display:'flex', alignItems:'center', justifyContent:'center', margin:'0 auto 16px', fontSize:28 }}>✓</div>
        <h2 style={{ fontFamily:"'Syne',sans-serif", fontWeight:800, fontSize:22, color:tokens.textPrimary, marginBottom:8 }}>Submitted!</h2>
        <p style={{ color:tokens.textMuted, fontSize:14, lineHeight:1.6, marginBottom:20 }}>Your observation has been submitted. Your instructor will review it shortly.</p>
        <div style={{ padding:'10px 16px', background:tokens.successBg, border:`1px solid ${tokens.successBorder}`, borderRadius:10, fontSize:12, fontFamily:"'Space Mono',monospace", color:tokens.textSecondary, letterSpacing:'0.06em' }}>
          Session {session?.code} · {members.map(m => m.roll).join(', ')}
        </div>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit}>
      {session?.status === 'GRACE' && (
        <div style={{ marginBottom:16, padding:'12px 16px', background:tokens.warningBg, border:`1px solid ${tokens.warningBorder}`, borderRadius:10 }}>
          <span style={{ color:tokens.warning, fontSize:13 }}>⚠ Grace period active — session ended but submissions still accepted.</span>
        </div>
      )}

      {/* Group members (read-only) */}
      <div style={card}>
        <div style={label}>Group Roll Numbers</div>
        {members.map((m, i) => (
          <div key={i} style={{ display:'flex', justifyContent:'space-between', alignItems:'center', padding:'6px 0', borderBottom: i < members.length-1 ? `1px solid ${tokens.border}` : 'none' }}>
            <span style={{ color:tokens.textMuted, fontSize:12, fontFamily:"'Space Mono',monospace" }}>Member {i+1}</span>
            <span style={{ color:tokens.success, fontSize:13, fontFamily:"'Space Mono',monospace", fontWeight:700 }}>{m.roll}</span>
          </div>
        ))}
      </div>

      {/* Experiment number */}
      <div style={card}>
        <label style={label}>Experiment Number <span style={{ color:tokens.danger }}>*</span></label>
        <input style={input} type="number" min="1" placeholder="e.g. 3" value={experimentNumber} onChange={e => setExperimentNumber(e.target.value)} required autoFocus />
        <p style={{ fontSize:11, color:tokens.textMuted, marginTop:6 }}>Enter the experiment number assigned by your instructor.</p>
      </div>

      {/* Photo */}
      <div style={card}>
        <div style={label}>Observation Photo <span style={{ color:tokens.danger }}>*</span></div>
        <FileUpload accept="image/*" label="Upload your observation photo" onFileSelect={setPhoto} preview />
        <p style={{ fontSize:11, color:tokens.textMuted, marginTop:8 }}>Take a clear photo of your experiment result. Max 20MB.</p>
      </div>

      {error && <div style={{ marginBottom:16, padding:'12px 16px', background:tokens.dangerBg, border:`1px solid ${tokens.dangerBorder}`, borderRadius:10, color:tokens.danger, fontSize:13 }}>{error}</div>}

      <button type="submit" disabled={loading} style={{ width:'100%', padding:'14px', background: loading ? tokens.btnSecondaryBg : 'linear-gradient(135deg,#4af0c4,#1e64ff)', border: loading ? `1px solid ${tokens.border}` : 'none', borderRadius:10, color: loading ? tokens.textDimmer : tokens.textInverse, fontFamily:"'Space Mono',monospace", fontWeight:700, fontSize:13, letterSpacing:'0.08em', cursor: loading ? 'wait' : 'pointer', display:'flex', alignItems:'center', justifyContent:'center', gap:8, transition:'all 0.25s', boxShadow: loading ? 'none' : tokens.shadow }}>
        {loading ? <><div style={{ width:16, height:16, border:`2px solid ${tokens.border}`, borderTopColor:tokens.textInverse, borderRadius:'50%', animation:'spin 0.8s linear infinite' }} /> Submitting…</> : '📤 Submit Observation'}
      </button>
    </form>
  );
}