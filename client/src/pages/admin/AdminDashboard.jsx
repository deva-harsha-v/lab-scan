import React, { useState, useEffect } from 'react';
import LabScanLogo from '../../components/LabScanLogo';
import { useAuth } from '../../context/AuthContext';
import { useRouter } from '../../App';
import { useTheme } from '../../context/ThemeContext';
import { makeStyles } from '../../utils/makeStyles';
import ThemeToggle from '../../components/ThemeToggle';
import client from '../../api/client';

function RoleBadge({ role, tokens }) {
  const colorMap = { ADMIN: tokens.roleAdmin, FACULTY: tokens.roleFaculty, STUDENT: tokens.roleStudent, HOD: tokens.roleHod };
  const color = colorMap[role] || tokens.textMuted;
  return (
    <span style={{ padding:'2px 8px', borderRadius:100, border:`1px solid ${color}44`, background:tokens.accentMuted, color, fontSize:10, fontFamily:"'Space Mono',monospace", letterSpacing:'0.06em', flexShrink:0 }}>{role}</span>
  );
}

function UserRow({ u, onDelete, onEdit, tokens }) {
  const S = makeStyles(tokens);
  return (
    <div style={{ display:'grid', gridTemplateColumns:'1fr auto auto auto', padding:'clamp(10px, 2vw, 16px)', borderBottom:`1px solid ${tokens.borderMuted}`, alignItems:'center', minWidth:'100%', gap: 8 }}>
      <div style={{ minWidth: 0 }}>
        <div style={{ fontSize:'clamp(12px, 2vw, 14px)', color:tokens.textPrimary, fontWeight: 600 }}>{u.name}</div>
        <div style={{ fontSize:'clamp(10px, 1.5vw, 11px)', color:tokens.textMuted, fontFamily:"'Space Mono',monospace", overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{u.email}</div>
        {u.employeeId && <div style={{ fontSize:'clamp(10px, 1.5vw, 11px)', color:tokens.roleHod, fontFamily:"'Space Mono',monospace", marginTop:2 }}>EMP#{u.employeeId}</div>}
        {u.rollNumber  && <div style={{ fontSize:'clamp(10px, 1.5vw, 11px)', color:tokens.roleStudent, fontFamily:"'Space Mono',monospace", marginTop:2 }}>#{u.rollNumber}</div>}
      </div>
      <div style={{ fontSize:'clamp(10px, 1.5vw, 11px)', color:tokens.textMuted, fontFamily:"'Space Mono',monospace", whiteSpace: 'nowrap' }}>{u.department || '—'}</div>
      <div><RoleBadge role={u.role} tokens={tokens} /></div>
      <div style={{ textAlign:'right', display:'flex', gap:6, justifyContent:'flex-end', flexShrink: 0 }}>
        {(u.role === 'FACULTY' || u.role === 'HOD') && (
          <button onClick={() => onEdit(u)}
            style={{ ...S.btnIcon, color:tokens.accent, borderColor:tokens.accentBorder }}
            onMouseEnter={e => { e.target.style.background=tokens.accentMuted; e.target.style.color=tokens.accent; }}
            onMouseLeave={e => { e.target.style.background='none'; e.target.style.color=tokens.accent; }}>
            Edit
          </button>
        )}
        <button onClick={() => onDelete(u.id)}
          style={{ ...S.btnIcon, color:tokens.danger, borderColor:tokens.dangerBorder }}
          onMouseEnter={e => { e.target.style.background=tokens.dangerBg; }}
          onMouseLeave={e => { e.target.style.background='none'; }}>
          Delete
        </button>
      </div>
    </div>
  );
}

function EditUserModal({ user: u, onClose, onSave, tokens }) {
  const S = makeStyles(tokens);
  const [isHod, setIsHod] = useState(u.role === 'HOD');
  const [saving, setSaving] = useState(false);
  const [err, setErr] = useState('');

  const handleSave = async () => {
    setSaving(true); setErr('');
    try {
      const res = await client.patch(`/auth/users/${u.id}`, { isHod });
      onSave(res.data.user);
      onClose();
    } catch (e) {
      setErr(e.response?.data?.error || 'Failed to update user');
    } finally { setSaving(false); }
  };

  return (
    <div style={S.modalOverlay} onClick={e => { if (e.target === e.currentTarget) onClose(); }}>
      <div style={S.modal}>
        <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', marginBottom:20 }}>
          <h3 style={{ fontFamily:"'Syne',sans-serif", fontWeight:700, fontSize:18, color:tokens.textPrimary }}>Edit Faculty Account</h3>
          <button onClick={onClose} style={{ background:'none', border:'none', color:tokens.textMuted, fontSize:18, cursor:'pointer', lineHeight:1 }}>✕</button>
        </div>

        <div style={{ ...S.cardSurface, marginBottom:20, padding: '12px 16px', borderRadius: 12, border: `1px solid ${tokens.border}` }}>
          <div style={{ fontSize:14, color:tokens.textPrimary, fontWeight:500 }}>{u.name}</div>
          <div style={{ fontSize:11, color:tokens.textMuted, fontFamily:"'Space Mono',monospace", marginTop:3 }}>{u.email}</div>
          {u.employeeId && <div style={{ fontSize:11, color:tokens.roleHod, fontFamily:"'Space Mono',monospace", marginTop:3 }}>EMP#{u.employeeId} · {u.department}</div>}
        </div>

        <div style={{ padding:'14px 16px', borderRadius:10,
          border: isHod ? `1px solid ${tokens.warningBorder}` : `1px solid ${tokens.border}`,
          background: isHod ? tokens.warningBg : tokens.bgSurface,
          cursor:'pointer', transition:'all 0.2s', marginBottom:16 }}
          onClick={() => setIsHod(v => !v)}>
          <div style={{ display:'flex', alignItems:'center', gap:12 }}>
            <div style={{ width:20, height:20, borderRadius:5, border: isHod ? `2px solid ${tokens.warning}` : `2px solid ${tokens.border}`, background: isHod ? tokens.warning : 'transparent', display:'flex', alignItems:'center', justifyContent:'center', transition:'all 0.2s', flexShrink:0 }}>
              {isHod && <span style={{ color: tokens.textInverse, fontSize:13, fontWeight:700, lineHeight:1 }}>✓</span>}
            </div>
            <div>
              <div style={{ fontSize:13, color: isHod ? tokens.warning : tokens.textPrimary, fontWeight:500 }}>Promote to HOD</div>
              <div style={{ fontSize:11, color:tokens.textMuted, fontFamily:"'Space Mono',monospace", marginTop:2 }}>
                HOD retains all faculty features + gains HOD dashboard access
              </div>
            </div>
          </div>
        </div>

        {isHod && <div style={{ ...S.warningBanner, marginBottom:16, fontSize:11, fontFamily:"'Space Mono',monospace", lineHeight:1.6 }}>🏛️ This faculty member will have access to both their Faculty Dashboard and the HOD Dashboard.</div>}
        {!isHod && u.role === 'HOD' && <div style={{ ...S.errorBanner, marginBottom:16, fontSize:11, fontFamily:"'Space Mono',monospace", lineHeight:1.6 }}>⚠️ This will demote the HOD back to Faculty. They will lose access to the HOD Dashboard.</div>}
        {err && <div style={{ ...S.errorBanner, marginBottom:14 }}>{err}</div>}

        <div style={{ display:'flex', gap:10 }}>
          <button onClick={onClose} style={{ ...S.btnSecondary, flex:1 }}>Cancel</button>
          <button onClick={handleSave} disabled={saving} style={{ flex:2, padding:'11px', background: isHod ? `linear-gradient(135deg,${tokens.warning},#c2780a)` : tokens.accentGrad, border:'none', borderRadius:9, color: tokens.textInverse, fontFamily:"'Space Mono',monospace", fontWeight:700, fontSize:12, cursor: saving ? 'wait' : 'pointer', display:'flex', alignItems:'center', justifyContent:'center', gap:6 }}>
            {saving ? <div style={{ width:14, height:14, border:`2px solid rgba(0,0,0,0.2)`, borderTopColor:tokens.textInverse, borderRadius:'50%', animation:'spin 0.8s linear infinite' }} /> : 'Save Changes'}
          </button>
        </div>
      </div>
    </div>
  );
}

function groupByDate(users) {
  const today = new Date(); today.setHours(0,0,0,0);
  const yesterday = new Date(today); yesterday.setDate(today.getDate() - 1);
  const groups = {};
  users.forEach(u => {
    const d = new Date(u.createdAt); d.setHours(0,0,0,0);
    let label;
    if (d.getTime() === today.getTime()) label = 'Today';
    else if (d.getTime() === yesterday.getTime()) label = 'Yesterday';
    else label = d.toLocaleDateString('en-GB', { day:'2-digit', month:'short', year:'numeric' });
    if (!groups[label]) groups[label] = [];
    groups[label].push(u);
  });
  return groups;
}

export default function AdminDashboard() {
  const { user, logout } = useAuth();
  const { navigate } = useRouter();
  const { tokens } = useTheme();
  const S = makeStyles(tokens);
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState('users');
  const [form, setForm] = useState({ name:'', email:'', password:'', role:'FACULTY', department:'', employeeId:'', rollNumber:'' });
  const [creating, setCreating] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [editingUser, setEditingUser] = useState(null);

  const DEPARTMENTS = ['CSE','ECE','EEE','Mechanical','Civil','Chemical','IT','Other'];

  useEffect(() => {
    client.get('/auth/users')
      .then(r => setUsers(r.data))
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  const handleCreate = async (e) => {
    e.preventDefault();
    setError(''); setSuccess(''); setCreating(true);
    try {
      const res = await client.post('/auth/register', form);
      setUsers(prev => [res.data.user, ...prev]);
      setSuccess(`"${form.name}" created successfully!`);
      setForm({ name:'', email:'', password:'', role:'FACULTY', department:'', employeeId:'', rollNumber:'' });
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to create user');
    } finally { setCreating(false); }
  };

  const handleSaveEdit = (updatedUser) => setUsers(prev => prev.map(u => u.id === updatedUser.id ? updatedUser : u));
  const handleDelete = async (id) => {
    if (!confirm('Delete this user? This cannot be undone.')) return;
    try {
      await client.delete(`/auth/users/${id}`);
      setUsers(prev => prev.filter(u => u.id !== id));
    } catch (err) { alert(err.response?.data?.error || 'Failed to delete user'); }
  };

  const hodList = users.filter(u => u.role === 'HOD');
  const facultyList = users.filter(u => u.role === 'FACULTY');
  const studentList = users.filter(u => u.role === 'STUDENT');
  const historyGroups = groupByDate(users);

  return (
    <>
      {editingUser && <EditUserModal user={editingUser} onClose={() => setEditingUser(null)} onSave={handleSaveEdit} tokens={tokens} />}
      <link href="https://fonts.googleapis.com/css2?family=Space+Mono:wght@400;700&family=DM+Sans:wght@300;400;500&family=Syne:wght@700;800&display=swap" rel="stylesheet" />
      <style>{`
        @keyframes fadeUp{from{opacity:0;transform:translateY(20px);}to{opacity:1;transform:translateY(0);}}
        @keyframes spin{to{transform:rotate(360deg);}}
        .admin-select option { background: ${tokens.bgSurface}; color: ${tokens.textPrimary}; }
        .admin-input::placeholder { color: ${tokens.textDimmer}; }
      `}</style>

      <div style={{ ...S.page, background: tokens.bgPage, color: tokens.textPrimary, minHeight: '100vh', transition: 'background 0.3s ease' }}>
        {/* Subtle grid background */}
        <div style={{ position:'fixed', inset:0, pointerEvents:'none', opacity: tokens.colorScheme === 'dark' ? 1 : 0.4,
          backgroundImage:`linear-gradient(${tokens.borderMuted} 1px,transparent 1px),linear-gradient(90deg,${tokens.borderMuted} 1px,transparent 1px)`,
          backgroundSize:'60px 60px' }} />

        {/* Nav */}
        <nav style={{ ...S.nav, background: tokens.bgNav, backdropFilter: tokens.backdropBlur, borderBottom: `1px solid ${tokens.border}`, position:'relative', zIndex: 10 }}>
          <div style={{ display:'flex', gap:10, padding: '0 24px', height: 70, alignItems: 'center', justifyContent: 'space-between', width: '100%' }}>
            <div style={{ display:'flex', alignItems:'center', gap:10 }}>
              <LabScanLogo size={28} gradientId="adminDashLogoGrad" />
              <span style={{ fontFamily:"'Syne',sans-serif", fontWeight:800, fontSize:16, letterSpacing:'-0.02em', color:tokens.textPrimary }}>LabScan</span>
              <span style={{ marginLeft:4, padding:'2px 8px', borderRadius:4, background:tokens.infoBg, border:`1px solid ${tokens.infoBorder}`, fontFamily:"'Space Mono',monospace", fontSize:10, color:tokens.info, letterSpacing:'0.1em' }}>ADMIN</span>
            </div>
            <div style={{ display:'flex', alignItems:'center', gap:12 }}>
              <span style={{ fontSize:11, fontFamily:"'Space Mono',monospace", color:tokens.textMuted }}>{user?.name}</span>
              <ThemeToggle size="sm" />
              <button onClick={() => { logout(); navigate('login'); }} style={{ ...S.btnDanger, padding:'6px 14px', fontSize:11, fontFamily:"'Space Mono',monospace", letterSpacing:'0.06em' }}>LOGOUT</button>
            </div>
          </div>
        </nav>

        <main style={{ position:'relative', zIndex:1, maxWidth:1200, margin:'0 auto', padding:'40px 24px 80px', animation:'fadeUp 0.5s ease forwards' }}>
          <div style={{ marginBottom:32 }}>
            <div style={{ fontFamily:"'Space Mono',monospace", fontSize:11, letterSpacing:'0.2em', color:tokens.info, textTransform:'uppercase', marginBottom:8 }}>Admin Panel</div>
            <h1 style={{ fontFamily:"'Syne',sans-serif", fontWeight:800, fontSize:30, color: tokens.textPrimary }}>User Management</h1>
            <p style={{ fontSize:14, color:tokens.textMuted, marginTop:4 }}>Create and manage faculty and student accounts</p>
          </div>

          {/* Stats */}
          <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fit, minmax(130px, 1fr))', gap:12, marginBottom:32 }}>
            {[
              { label:'Total Users', value:users.length,       accent:tokens.accent },
              { label:'HODs',        value:hodList.length,     accent:tokens.roleHod },
              { label:'Faculty',     value:facultyList.length, accent:tokens.roleFaculty },
              { label:'Students',    value:studentList.length, accent:tokens.roleStudent },
            ].map(s => (
              <div key={s.label} style={{ background: tokens.bgCard, border: `1px solid ${tokens.border}`, padding: 24, borderRadius: 16, textAlign:'center' }}>
                <div style={{ fontFamily:"'Syne',sans-serif", fontSize:36, fontWeight:800, color:s.accent, letterSpacing:'-0.03em' }}>{s.value}</div>
                <div style={{ fontSize:11, fontFamily:"'Space Mono',monospace", color:tokens.textMuted, letterSpacing:'0.1em', textTransform:'uppercase', marginTop:4 }}>{s.label}</div>
              </div>
            ))}
          </div>

          {/* Tabs */}
          <div style={{ display:'flex', gap:4, marginBottom:24, background:tokens.bgSurface, borderRadius:10, padding:4, border:`1px solid ${tokens.border}`, overflowX:'auto', WebkitOverflowScrolling:'touch' }}>
            {[{id:'users',label:'All Users'},{id:'create',label:'+ Create User'}].map(t => (
              <button key={t.id} onClick={() => { setTab(t.id); setError(''); setSuccess(''); }}
                style={{ padding:'8px 20px', borderRadius:7, border:'none', fontFamily:"'Space Mono',monospace", fontSize:11, letterSpacing:'0.06em', cursor:'pointer', transition:'all 0.2s',
                  background: tab===t.id ? tokens.accentMuted : 'transparent',
                  color: tab===t.id ? tokens.accent : tokens.textMuted }}>
                {t.label}
              </button>
            ))}
            <button onClick={() => navigate('admin-bulk-import')}
              style={{ padding:'8px 20px', borderRadius:7, border:'none', fontFamily:"'Space Mono',monospace", fontSize:11, letterSpacing:'0.06em', cursor:'pointer', transition:'all 0.2s', background:'transparent', color:tokens.textMuted }}
              onMouseEnter={e => e.currentTarget.style.color = tokens.accent}
              onMouseLeave={e => e.currentTarget.style.color = tokens.textMuted}>
              📥 Bulk Import
            </button>
          </div>

          {/* ALL USERS */}
          {tab === 'users' && (
            <div style={{ background: tokens.bgCard, border: `1px solid ${tokens.border}`, borderRadius: 16, padding: 16 }}>
              <div style={{ overflowX:'auto', WebkitOverflowScrolling:'touch' }}>
                <div style={{ display:'grid', gridTemplateColumns:'1fr 120px 90px 80px', padding:'10px 16px', borderBottom:`1px solid ${tokens.border}`, background:tokens.bgSurface, minWidth:480 }}>
                  {['Name / Email','Department','Role',''].map((h,i) => (
                    <div key={i} style={{ fontSize:11, fontFamily:"'Space Mono',monospace", color:tokens.textMuted, textTransform:'uppercase', letterSpacing:'0.05em' }}>{h}</div>
                  ))}
                </div>
                {loading ? (
                  <div style={{ display:'flex', justifyContent:'center', padding:40 }}>
                    <div style={{ width:24, height:24, border:`2px solid ${tokens.accentMuted}`, borderTopColor:tokens.accent, borderRadius:'50%', animation:'spin 0.8s linear infinite' }} />
                  </div>
                ) : users.length === 0 ? (
                  <div style={{ textAlign:'center', padding:'40px 16px', color:tokens.textMuted, fontSize:14 }}>No users yet. Create your first account.</div>
                ) : (
                  users.map(u => <UserRow key={u.id} u={u} onDelete={handleDelete} onEdit={setEditingUser} tokens={tokens} />)
                )}
              </div>
            </div>
          )}

          {/* CREATE USER */}
          {tab === 'create' && (
            <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fit, minmax(280px, 1fr))', gap:20, alignItems:'start' }}>
              {/* Form */}
              <div style={{ background: tokens.bgCard, border: `1px solid ${tokens.border}`, borderRadius: 16, padding: 28 }}>
                <h2 style={{ fontFamily:"'Syne',sans-serif", fontWeight:700, fontSize:18, color: tokens.textPrimary, marginBottom:20 }}>Create New User</h2>
                {error   && <div style={{ background: tokens.dangerBg, color: tokens.danger, padding: 12, borderRadius: 8, marginBottom:16 }}>{error}</div>}
                {success && <div style={{ background: tokens.successBg, color: tokens.success, padding: 12, borderRadius: 8, marginBottom:16 }}>{success}</div>}

                <form onSubmit={handleCreate}>
                  <div style={{ marginBottom:16 }}>
                    <label style={{ display:'block', fontSize:11, fontFamily:"'Space Mono',monospace", color:tokens.textMuted, marginBottom:8 }}>Role *</label>
                    <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fit, minmax(100px, 1fr))', gap:8 }}>
                      {[
                        { r:'FACULTY', icon:'👨‍🏫', accent:tokens.roleFaculty },
                        { r:'STUDENT', icon:'🎓',   accent:tokens.roleStudent },
                      ].map(({ r, icon, accent }) => (
                        <div key={r} onClick={() => setForm({...form, role:r, employeeId:'', rollNumber:''})}
                          style={{ padding:'12px 10px', borderRadius:10,
                            border: form.role===r ? `1px solid ${accent}` : `1px solid ${tokens.border}`,
                            background: form.role===r ? tokens.accentMuted : tokens.bgSurface,
                            cursor:'pointer', textAlign:'center', transition:'all 0.2s' }}>
                          <div style={{ fontSize:18, marginBottom:4 }}>{icon}</div>
                          <div style={{ fontFamily:"'Space Mono',monospace", fontSize:10,
                            color: form.role===r ? accent : tokens.textMuted, letterSpacing:'0.06em' }}>{r}</div>
                        </div>
                      ))}
                    </div>
                  </div>

                  {[
                    { key:'name', label:'Full Name', type:'text', ph:'Dr. Ravi Kumar / Priya Sharma' },
                    { key:'email', label:'Email Address', type:'email', ph:'user@university.edu' },
                    { key:'password', label:'Password', type:'password', ph:'Set a secure password' },
                  ].map(f => (
                    <div key={f.key} style={{ marginBottom:16 }}>
                      <label style={{ display:'block', fontSize:11, fontFamily:"'Space Mono',monospace", color:tokens.textMuted, marginBottom:8 }}>{f.label} *</label>
                      <input type={f.type} className="admin-input" style={{ width:'100%', padding:'12px', background:tokens.bgSurface, border:`1px solid ${tokens.borderInput}`, borderRadius:10, color:tokens.textPrimary }} placeholder={f.ph} value={form[f.key]} onChange={e => setForm({...form, [f.key]:e.target.value})} required />
                    </div>
                  ))}

                  {form.role === 'FACULTY' && (
                    <div style={{ marginBottom:16 }}>
                      <label style={{ display:'block', fontSize:11, fontFamily:"'Space Mono',monospace", color:tokens.textMuted, marginBottom:8 }}>Employee ID *</label>
                      <input type="text" className="admin-input"
                        style={{ width:'100%', padding:'12px', background:tokens.bgSurface, border:`1px solid ${tokens.borderInput}`, borderRadius:10, color:tokens.textPrimary, fontFamily:"'Space Mono',monospace", letterSpacing:'0.05em' }}
                        placeholder="e.g. EMP2024001"
                        value={form.employeeId}
                        onChange={e => setForm({...form, employeeId:e.target.value.toUpperCase()})}
                        required />
                    </div>
                  )}

                  {form.role === 'STUDENT' && (
                    <div style={{ marginBottom:16 }}>
                      <label style={{ display:'block', fontSize:11, fontFamily:"'Space Mono',monospace", color:tokens.textMuted, marginBottom:8 }}>Roll Number *</label>
                      <input type="text" className="admin-input" style={{ width:'100%', padding:'12px', background:tokens.bgSurface, border:`1px solid ${tokens.borderInput}`, borderRadius:10, color:tokens.textPrimary, fontFamily:"'Space Mono',monospace", letterSpacing:'0.05em' }} placeholder="e.g. 22CS001" value={form.rollNumber} onChange={e => setForm({...form, rollNumber:e.target.value.toUpperCase()})} required />
                    </div>
                  )}

                  <div style={{ marginBottom:24 }}>
                    <label style={{ display:'block', fontSize:11, fontFamily:"'Space Mono',monospace", color:tokens.textMuted, marginBottom:8 }}>Department *</label>
                    <select className="admin-select" style={{ width:'100%', padding:'12px', background:tokens.bgSurface, border:`1px solid ${tokens.borderInput}`, borderRadius:10, color:tokens.textPrimary, colorScheme:tokens.colorScheme }} value={form.department} onChange={e => setForm({...form, department:e.target.value})} required>
                      <option value="">Select department</option>
                      {DEPARTMENTS.map(d => <option key={d} value={d}>{d}</option>)}
                    </select>
                  </div>

                  <button type="submit" disabled={creating} style={{ width:'100%', padding:'13px', background:tokens.accentGrad, border:'none', borderRadius:10, color: tokens.textInverse, fontFamily:"'Space Mono',monospace", fontWeight:700, fontSize:13, letterSpacing:'0.08em', cursor: creating ? 'wait' : 'pointer', display:'flex', alignItems:'center', justifyContent:'center', gap:8 }}>
                    {creating ? <div style={{ width:16, height:16, border:'2px solid rgba(0,0,0,0.2)', borderTopColor: tokens.textInverse, borderRadius:'50%', animation:'spin 0.8s linear infinite' }} /> : form.role === 'FACULTY' ? 'CREATE FACULTY ACCOUNT' : 'CREATE STUDENT ACCOUNT'}
                  </button>
                </form>
              </div>

              {/* Creation History */}
              <div style={{ background: tokens.bgCard, border: `1px solid ${tokens.border}`, borderRadius: 16, padding: 24, display:'flex', flexDirection:'column' }}>
                <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', marginBottom:16 }}>
                  <div>
                    <h2 style={{ fontFamily:"'Syne',sans-serif", fontWeight:700, fontSize:18, color:tokens.textPrimary }}>Creation History</h2>
                    <p style={{ fontSize:11, color:tokens.textMuted, fontFamily:"'Space Mono',monospace", marginTop:3 }}>All accounts · persists across restarts</p>
                  </div>
                </div>

                {loading ? (
                  <div style={{ display:'flex', justifyContent:'center', padding:40 }}>
                    <div style={{ width:20, height:20, border:`2px solid ${tokens.accentMuted}`, borderTopColor:tokens.accent, borderRadius:'50%', animation:'spin 0.8s linear infinite' }} />
                  </div>
                ) : users.length === 0 ? (
                  <div style={{ textAlign:'center', padding:'40px 16px', color:tokens.textMuted, fontSize:14 }}>📋<br />No accounts yet.</div>
                ) : (
                  <div style={{ maxHeight:500, overflowY:'auto', display:'flex', flexDirection:'column', gap:16, paddingRight:4 }}>
                    {Object.entries(historyGroups).map(([dateLabel, entries]) => (
                      <div key={dateLabel}>
                        <div style={{ display:'flex', alignItems:'center', gap:10, marginBottom:8 }}>
                          <span style={{ fontFamily:"'Space Mono',monospace", fontSize:10, letterSpacing:'0.12em', color:tokens.textDimmer, textTransform:'uppercase', whiteSpace:'nowrap' }}>{dateLabel}</span>
                          <div style={{ flex:1, height:1, background:tokens.border }} />
                          <span style={{ fontFamily:"'Space Mono',monospace", fontSize:10, color:tokens.textDimmer }}>{entries.length}</span>
                        </div>
                        <div style={{ display:'flex', flexDirection:'column', gap:8 }}>
                          {entries.map(u => (
                            <div key={u.id} style={{ background: tokens.bgSurface, border: `1px solid ${tokens.border}`, padding:'11px 14px', borderRadius: 12 }}>
                              <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', gap:8, marginBottom:3 }}>
                                <span style={{ fontSize:13, color:tokens.textPrimary, fontWeight:500, overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}>{u.name}</span>
                                <RoleBadge role={u.role} tokens={tokens} />
                              </div>
                              <div style={{ fontSize:11, color:tokens.textMuted, fontFamily:"'Space Mono',monospace", overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap', marginBottom:4 }}>{u.email}</div>
                              <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between' }}>
                                <div style={{ display:'flex', gap:8 }}>
                                  {u.department  && <span style={{ fontSize:10, color:tokens.textMuted, fontFamily:"'Space Mono',monospace" }}>{u.department}</span>}
                                  {u.employeeId  && <span style={{ fontSize:10, color:tokens.roleHod,          fontFamily:"'Space Mono',monospace" }}>EMP#{u.employeeId}</span>}
                                  {u.rollNumber  && <span style={{ fontSize:10, color:tokens.roleStudent,      fontFamily:"'Space Mono',monospace" }}>#{u.rollNumber}</span>}
                                </div>
                                <span style={{ fontSize:10, color:tokens.textDimmer, fontFamily:"'Space Mono',monospace", whiteSpace:'nowrap' }}>
                                  {new Date(u.createdAt).toLocaleTimeString('en-US', { hour:'2-digit', minute:'2-digit' })}
                                </span>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          )}
        </main>
      </div>
    </>
  );
}