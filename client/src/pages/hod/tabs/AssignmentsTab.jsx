import React, { useState } from 'react';
import { Trash2, UserCheck } from 'lucide-react';
import { useTheme } from '../../../context/ThemeContext';
import { hodApi } from '../../../api/hod.api';
import { Card, Label, Select, Btn, ErrBox, OkBox } from '../ui/HodUI';
import { font } from '../ui/hodTokens';

export default function AssignmentsTab({ assignments, sections, subjects, faculty, onRefresh }) {
  const { tokens } = useTheme();
  const [form, setForm] = useState({ sectionId: '', subjectId: '', facultyId: '' });
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState('');
  const [ok, setOk] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault(); setErr(''); setOk('');
    setLoading(true);
    try {
      await hodApi.createAssignment(form);
      setOk('Assignment created successfully!');
      setForm({ sectionId: '', subjectId: '', facultyId: '' });
      onRefresh();
    } catch (e) { setErr(e.response?.data?.error || 'Failed to create assignment'); }
    finally { setLoading(false); }
  };

  const handleDelete = async (id) => {
    if (!confirm('Delete this assignment?')) return;
    try { await hodApi.deleteAssignment(id); onRefresh(); }
    catch (e) { alert(e.response?.data?.error || 'Delete failed'); }
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 24, animation: 'fadeUp 0.4s ease forwards' }}>
      <Card>
        <div style={{ fontFamily: font.mono, fontSize: 11, letterSpacing: '0.15em', color: tokens.accent, fontWeight: 700, textTransform: 'uppercase', marginBottom: 20 }}>
          Assign Faculty → Section + Subject
        </div>
        <ErrBox msg={err} /><OkBox msg={ok} />
        <form onSubmit={handleSubmit}>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))', gap: 14, marginBottom: 24 }}>
            <div>
              <Label>Section</Label>
              <Select value={form.sectionId} onChange={e => setForm({ ...form, sectionId: e.target.value })} required>
                <option value="">Select section</option>
                {sections.map(s => <option key={s.id} value={s.id}>{s.name} ({s.department})</option>)}
              </Select>
            </div>
            <div>
              <Label>Subject</Label>
              <Select value={form.subjectId} onChange={e => setForm({ ...form, subjectId: e.target.value })} required>
                <option value="">Select subject</option>
                {subjects.map(s => <option key={s.id} value={s.id}>{s.name} ({s.code})</option>)}
              </Select>
            </div>
            <div>
              <Label>Faculty</Label>
              <Select value={form.facultyId} onChange={e => setForm({ ...form, facultyId: e.target.value })} required>
                <option value="">Select faculty</option>
                {faculty.map(f => <option key={f.id} value={f.id}>{f.name}</option>)}
              </Select>
            </div>
          </div>
          <Btn type="submit" disabled={loading}>{loading ? 'Saving...' : 'Create Assignment'}</Btn>
        </form>
      </Card>

      <div>
        <div style={{ fontFamily: font.mono, fontSize: 12, letterSpacing: '0.15em', color: tokens.textSecondary, marginBottom: 16, fontWeight: 700, textTransform: 'uppercase' }}>
          Active Assignments ({assignments.length})
        </div>
        {assignments.length === 0 && (
          <div style={{ color: tokens.textMuted, fontSize: 14, textAlign: 'center', padding: 40, fontFamily: font.mono, border: `1px solid ${tokens.border}`, borderRadius: 16 }}>
            No assignments yet.
          </div>
        )}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill,minmax(340px,1fr))', gap: 16 }}>
          {assignments.map(a => (
            <div key={a.id} className="session-card" style={{ padding: '24px', borderRadius: 16, display: 'flex', flexDirection: 'column', justifyContent: 'space-between', gap: 16 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                <div>
                  <span style={{ fontFamily: font.mono, fontSize: 11, fontWeight: 700, color: tokens.accent, background: tokens.accentMuted, border: `1px solid ${tokens.accentBorder}`, padding: '4px 10px', borderRadius: 6 }}>{a.section?.name || 'No Section'}</span>
                  <div style={{ fontSize: 15, fontWeight: 700, color: tokens.textPrimary, marginTop: 12 }}>{a.subject?.name || 'No Subject'}</div>
                  <div style={{ fontSize: 12, fontFamily: font.mono, color: tokens.textDimmer, marginTop: 4 }}>{a.subject?.code || 'N/A'}</div>
                </div>
                <button className="interactive-btn-danger" style={{ background: tokens.dangerBg, border: `1px solid ${tokens.dangerBorder}`, color: tokens.danger, padding: '8px 10px', borderRadius: '8px', cursor: 'pointer' }} onClick={() => handleDelete(a.id)}>
                  <Trash2 size={13} />
                </button>
              </div>

              <div style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '12px 14px', background: tokens.bgSurfaceHover, border: `1px solid ${tokens.border}`, borderRadius: 10 }}>
                <div style={{ width: 32, height: 32, borderRadius: 8, background: tokens.accentMuted, display: 'flex', alignItems: 'center', justifyContent: 'center', color: tokens.accent, border: `1px solid ${tokens.accentBorder}` }}>
                  <UserCheck size={14} />
                </div>
                <div>
                  <div style={{ fontSize: 13, color: tokens.textPrimary, fontWeight: 600 }}>{a.faculty?.name || 'Unknown'}</div>
                  <div style={{ fontSize: 11, color: tokens.textMuted, marginTop: 2 }}>{a.faculty?.email || ''}</div>
                </div>
              </div>

              <div style={{ display: 'flex', gap: 16, borderTop: `1px solid ${tokens.border}`, paddingTop: '12px', fontSize: 11, fontFamily: font.mono, color: tokens.textMuted }}>
                <div>Experiments: <span style={{ color: tokens.accent, fontWeight: 700 }}>{a._count?.experiments ?? a.experiments?.length ?? 0}</span></div>
                <div>Records: <span style={{ color: tokens.success, fontWeight: 700 }}>{a._count?.labRecords ?? 0}</span></div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}