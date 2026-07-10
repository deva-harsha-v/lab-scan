import React, { useState } from 'react';
import { useTheme } from '../../../context/ThemeContext';
import { hodApi } from '../../../api/hod.api';
import { Card, Label, Input, Select, Btn, ErrBox, OkBox } from '../ui/HodUI';
import { font } from '../ui/hodTokens';

export default function SubjectsTab({ subjects, onRefresh }) {
  const { tokens } = useTheme();
  const [form, setForm] = useState({ name: '', code: '', department: '', totalSlots: '10' });
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState('');
  const [ok, setOk] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault(); setErr(''); setOk('');
    setLoading(true);
    try {
      await hodApi.createSubject(form);
      setOk(`Subject "${form.name}" cataloged!`);
      setForm({ name: '', code: '', department: '', totalSlots: '10' });
      onRefresh();
    } catch (e) { setErr(e.response?.data?.error || 'Failed to create subject'); }
    finally { setLoading(false); }
  };

  return (
    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: 20, animation: 'fadeUp 0.4s ease forwards' }}>
      <Card>
        <div style={{ fontFamily: font.mono, fontSize: 11, letterSpacing: '0.15em', color: tokens.accent, marginBottom: 20, fontWeight: 700, textTransform: 'uppercase' }}>New Lab Subject</div>
        <ErrBox msg={err} /><OkBox msg={ok} />
        <form onSubmit={handleSubmit}>
          {[
            { key: 'name', label: 'Subject / Lab Title', placeholder: 'e.g. Object Oriented Programming Lab' },
            { key: 'code', label: 'Subject Code', placeholder: 'e.g. CS3101' },
            { key: 'department', label: 'Department', placeholder: 'e.g. CSE' },
          ].map(f => (
            <div key={f.key} style={{ marginBottom: 16 }}>
              <Label>{f.label}</Label>
              <Input placeholder={f.placeholder} value={form[f.key]} onChange={e => setForm({ ...form, [f.key]: e.target.value })} required />
            </div>
          ))}
          <div style={{ marginBottom: 24 }}>
            <Label>Total Experiment Slots</Label>
            <Select value={form.totalSlots} onChange={e => setForm({ ...form, totalSlots: e.target.value })}>
              {[5,8,10,12,15,20].map(n => <option key={n} value={n}>{n} Experiments</option>)}
            </Select>
          </div>
          <Btn type="submit" disabled={loading} style={{ width: '100%' }}>{loading ? 'Saving...' : 'Create Subject'}</Btn>
        </form>
      </Card>

      <Card style={{ display: 'flex', flexDirection: 'column' }}>
        <div style={{ fontFamily: font.mono, fontSize: 12, letterSpacing: '0.15em', color: tokens.textSecondary, marginBottom: 20, fontWeight: 700, textTransform: 'uppercase' }}>Registered Subjects ({subjects.length})</div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12, maxHeight: 500, overflowY: 'auto', paddingRight: 4 }}>
          {subjects.length === 0 && <div style={{ color: tokens.textMuted, fontSize: 14, textAlign: 'center', padding: 40, fontFamily: font.mono }}>No subjects added yet.</div>}
          {subjects.map(s => (
            <div key={s.id} className="row-item" style={{ padding: '16px 20px', background: tokens.bgSurface, border: `1px solid ${tokens.border}`, borderRadius: 12, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div>
                <div style={{ fontFamily: font.mono, fontSize: 14, color: tokens.textPrimary, fontWeight: 700 }}>{s.name}</div>
                <div style={{ fontSize: 12, color: tokens.textMuted, marginTop: 4 }}>Code: <span style={{ color: tokens.textPrimary, fontFamily: font.mono }}>{s.code}</span> · {s.department}</div>
              </div>
              <div style={{ fontFamily: font.mono, fontSize: 12, color: tokens.accent, background: tokens.accentMuted, border: `1px solid ${tokens.accentBorder}`, padding: '4px 12px', borderRadius: 6, fontWeight: 700 }}>{s.totalSlots} Slots</div>
            </div>
          ))}
        </div>
      </Card>
    </div>
  );
}