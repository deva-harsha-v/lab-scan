import React, { useState } from 'react';
import { useTheme } from '../../../context/ThemeContext';
import { hodApi } from '../../../api/hod.api';
import { Card, Label, Input, Select, Btn, ErrBox, OkBox } from '../ui/HodUI';
import { font } from '../ui/hodTokens';

export default function SectionsTab({ sections, onRefresh }) {
  const { tokens } = useTheme();
  const [form, setForm] = useState({ name: '', department: '', semester: '', academicYear: '' });
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState('');
  const [ok, setOk] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault(); setErr(''); setOk('');
    setLoading(true);
    try {
      await hodApi.createSection(form);
      setOk(`Section "${form.name}" created successfully!`);
      setForm({ name: '', department: '', semester: '', academicYear: '' });
      onRefresh();
    } catch (e) { setErr(e.response?.data?.error || 'Failed to create section'); }
    finally { setLoading(false); }
  };

  return (
    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: 20, animation: 'fadeUp 0.4s ease forwards' }}>
      <Card>
        <div style={{ fontFamily: font.mono, fontSize: 11, letterSpacing: '0.15em', color: tokens.accent, marginBottom: 20, fontWeight: 700, textTransform: 'uppercase' }}>Initialize New Section</div>
        <ErrBox msg={err} /><OkBox msg={ok} />
        <form onSubmit={handleSubmit}>
          {[
            { key: 'name', label: 'Section Name', placeholder: 'e.g. CSE-A' },
            { key: 'department', label: 'Department', placeholder: 'e.g. CSE' },
            { key: 'academicYear', label: 'Academic Year', placeholder: 'e.g. 2025-26' },
          ].map(f => (
            <div key={f.key} style={{ marginBottom: 16 }}>
              <Label>{f.label}</Label>
              <Input placeholder={f.placeholder} value={form[f.key]} onChange={e => setForm({ ...form, [f.key]: e.target.value })} required />
            </div>
          ))}
          <div style={{ marginBottom: 24 }}>
            <Label>Semester</Label>
            <Select value={form.semester} onChange={e => setForm({ ...form, semester: e.target.value })} required>
              <option value="">Select semester</option>
              {[1,2,3,4,5,6,7,8].map(s => <option key={s} value={s}>Semester {s}</option>)}
            </Select>
          </div>
          <Btn type="submit" disabled={loading} style={{ width: '100%' }}>{loading ? 'Creating...' : 'Create Section'}</Btn>
        </form>
      </Card>

      <Card style={{ display: 'flex', flexDirection: 'column' }}>
        <div style={{ fontFamily: font.mono, fontSize: 12, letterSpacing: '0.15em', color: tokens.textSecondary, marginBottom: 20, fontWeight: 700, textTransform: 'uppercase' }}>All Sections ({sections.length})</div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12, maxHeight: 500, overflowY: 'auto', paddingRight: 4 }}>
          {sections.length === 0 && <div style={{ color: tokens.textMuted, fontSize: 14, textAlign: 'center', padding: 40, fontFamily: font.mono }}>No sections created yet.</div>}
          {sections.map(s => (
            <div key={s.id} className="row-item" style={{ padding: '16px 20px', background: tokens.bgSurface, border: `1px solid ${tokens.border}`, borderRadius: 12, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div>
                <div style={{ fontFamily: font.mono, fontSize: 14, color: tokens.textPrimary, fontWeight: 700 }}>{s.name}</div>
                <div style={{ fontSize: 12, color: tokens.textMuted, marginTop: 4 }}>{s.department} · Semester {s.semester} · {s.academicYear}</div>
              </div>
              <div style={{ textAlign: 'right' }}>
                <div style={{ fontFamily: font.mono, fontSize: 12, color: tokens.accent, fontWeight: 700 }}>{s._count?.students ?? 0} Students</div>
                <div style={{ fontFamily: font.mono, fontSize: 11, color: tokens.textDimmer, marginTop: 2 }}>{s._count?.assignments ?? 0} Labs Bound</div>
              </div>
            </div>
          ))}
        </div>
      </Card>
    </div>
  );
}