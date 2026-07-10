import React, { useState } from 'react';
import { Clock, ArrowRight } from 'lucide-react';
import { useTheme } from '../../../context/ThemeContext';
import { hodApi } from '../../../api/hod.api';
import { Card, Label, Select, Btn, ErrBox, OkBox } from '../ui/HodUI';
import { font } from '../ui/hodTokens';

export default function StudentsTab({ students, sections, onRefresh }) {
  const { tokens } = useTheme();
  const [mode, setMode] = useState('single');

  const [form, setForm] = useState({ studentId: '', sectionId: '' });
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState('');
  const [ok, setOk] = useState('');

  const [bulkSectionId, setBulkSectionId] = useState('');
  const [selectedStudentIds, setSelectedStudentIds] = useState([]);
  const [bulkLoading, setBulkLoading] = useState(false);
  const [bulkErr, setBulkErr] = useState('');
  const [bulkOk, setBulkOk] = useState('');

  const unassigned = students.filter(s => !s.sectionId);
  const sectionMap = Object.fromEntries(sections.map(s => [s.id, s.name]));

  const handleEnroll = async (e) => {
    e.preventDefault(); setErr(''); setOk('');
    setLoading(true);
    try {
      await hodApi.enrollStudent(form);
      setOk('Student enrolled successfully!');
      setForm({ studentId: '', sectionId: '' });
      onRefresh();
    } catch (e2) { setErr(e2.response?.data?.error || 'Enrollment failed'); }
    finally { setLoading(false); }
  };

  // ✅ BUG FIX: this function was missing, causing the blank page crash
  const handleBulkEnroll = async () => {
    if (!bulkSectionId) { setBulkErr('Please select a target section.'); return; }
    if (selectedStudentIds.length === 0) { setBulkErr('No students selected.'); return; }
    setBulkErr(''); setBulkOk('');
    setBulkLoading(true);
    try {
      await hodApi.bulkEnrollStudents({ studentIds: selectedStudentIds, sectionId: bulkSectionId });
      setBulkOk(`${selectedStudentIds.length} student(s) enrolled successfully.`);
      setSelectedStudentIds([]);
      setBulkSectionId('');
      onRefresh();
    } catch (e) {
      setBulkErr(e.response?.data?.error || 'Bulk enrollment failed.');
    } finally {
      setBulkLoading(false);
    }
  };

  const toggleStudentSelection = (id) => {
    setSelectedStudentIds(prev => prev.includes(id) ? prev.filter(s => s !== id) : [...prev, id]);
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 28, animation: 'fadeUp 0.4s ease forwards' }}>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: 20, alignItems: 'start' }}>

        {/* Left: Enroll Panel */}
        <Card>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
            <div>
              <div style={{ fontFamily: font.mono, fontSize: 11, letterSpacing: '0.12em', color: tokens.accent, fontWeight: 700, marginBottom: 12, textTransform: 'uppercase' }}>Enroll Students</div>
              {/* Mode toggle */}
              <div style={{ background: tokens.bgSurfaceHover, padding: 4, borderRadius: 14, border: `1px solid ${tokens.border}`, display: 'flex', position: 'relative', height: 40 }}>
                <div style={{ position: 'absolute', top: 3, bottom: 3, left: mode === 'single' ? '3px' : '50%', width: 'calc(50% - 6px)', background: tokens.accentGrad, borderRadius: 11, transition: 'all 0.25s cubic-bezier(0.16, 1, 0.3, 1)', zIndex: 1 }} />
                <button onClick={() => { setMode('single'); setErr(''); setOk(''); }} style={{ flex: 1, background: 'none', border: 'none', color: mode === 'single' ? tokens.textInverse : tokens.textSecondary, zIndex: 2, fontFamily: font.mono, fontSize: 12, fontWeight: 700, cursor: 'pointer', transition: 'color 0.2s' }}>Single</button>
                <button onClick={() => { setMode('bulk'); setBulkErr(''); setBulkOk(''); }} style={{ flex: 1, background: 'none', border: 'none', color: mode === 'bulk' ? tokens.textInverse : tokens.textSecondary, zIndex: 2, fontFamily: font.mono, fontSize: 12, fontWeight: 700, cursor: 'pointer', transition: 'color 0.2s' }}>Bulk Pipeline</button>
              </div>
            </div>

            {mode === 'single' && (
              <form onSubmit={handleEnroll} style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                <ErrBox msg={err} /><OkBox msg={ok} />
                <div>
                  <Label>Student</Label>
                  <Select value={form.studentId} onChange={e => setForm({ ...form, studentId: e.target.value })} required>
                    <option value="">Select student</option>
                    {students.map(s => <option key={s.id} value={s.id}>{s.name} {s.sectionId ? `[${sectionMap[s.sectionId]}]` : '[Unassigned]'}</option>)}
                  </Select>
                </div>
                <div>
                  <Label>Section</Label>
                  <Select value={form.sectionId} onChange={e => setForm({ ...form, sectionId: e.target.value })} required>
                    <option value="">Select section</option>
                    {sections.map(s => <option key={s.id} value={s.id}>{s.name} ({s.department})</option>)}
                  </Select>
                </div>
                <Btn type="submit" disabled={loading} style={{ width: '100%', marginTop: 8 }}>{loading ? 'Enrolling...' : 'Enroll Student'}</Btn>
              </form>
            )}

            {mode === 'bulk' && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                <ErrBox msg={bulkErr} /><OkBox msg={bulkOk} />
                <div>
                  <Label>Target Section</Label>
                  <Select value={bulkSectionId} onChange={e => setBulkSectionId(e.target.value)}>
                    <option value="">Select section</option>
                    {sections.map(s => <option key={s.id} value={s.id}>{s.name} — Sem {s.semester}</option>)}
                  </Select>
                </div>
                <div>
                  <Label>Quick Select</Label>
                  <div style={{ display: 'flex', gap: 8 }}>
                    <button onClick={() => setSelectedStudentIds(unassigned.map(s => s.id))} style={{ flex: 1, fontFamily: font.mono, fontSize: 10, color: tokens.accent, background: tokens.accentMuted, border: `1px solid ${tokens.accentBorder}`, borderRadius: 8, padding: '8px 10px', cursor: 'pointer', fontWeight: 700 }}>
                      All Unassigned ({unassigned.length})
                    </button>
                    {selectedStudentIds.length > 0 && (
                      <button onClick={() => setSelectedStudentIds([])} style={{ flex: 1, fontFamily: font.mono, fontSize: 10, color: tokens.textSecondary, background: tokens.bgSurfaceHover, border: `1px solid ${tokens.border}`, borderRadius: 8, padding: '8px 10px', cursor: 'pointer', fontWeight: 700 }}>
                        Clear
                      </button>
                    )}
                  </div>
                </div>

                {selectedStudentIds.length > 0 && (
                  <div style={{ background: tokens.bgSurfaceHover, border: `1px solid ${tokens.border}`, borderRadius: 12, padding: 14 }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10, borderBottom: `1px solid ${tokens.border}`, paddingBottom: 6 }}>
                      <span style={{ fontFamily: font.mono, fontSize: 11, fontWeight: 700, color: tokens.accent }}>Selected</span>
                      <span style={{ fontFamily: font.mono, fontSize: 11, fontWeight: 700, background: tokens.accentMuted, padding: '2px 8px', borderRadius: 4, color: tokens.accent, border: `1px solid ${tokens.accentBorder}` }}>{selectedStudentIds.length}</span>
                    </div>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 6, maxHeight: 110, overflowY: 'auto', paddingRight: 4 }}>
                      {students.filter(s => selectedStudentIds.includes(s.id)).map(s => (
                        <div key={s.id} style={{ fontSize: 12, color: tokens.textPrimary, display: 'flex', alignItems: 'center', gap: 6 }}>
                          <div style={{ width: 4, height: 4, borderRadius: '50%', background: tokens.accent }} />
                          <span style={{ whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{s.name}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                <button
                  onClick={handleBulkEnroll}
                  disabled={bulkLoading || selectedStudentIds.length === 0}
                  className="interactive-btn"
                  style={{ width: '100%', height: 52, background: selectedStudentIds.length === 0 ? tokens.btnSecondaryBg : tokens.accentGrad, border: selectedStudentIds.length === 0 ? `1px solid ${tokens.border}` : 'none', borderRadius: 12, color: selectedStudentIds.length === 0 ? tokens.textDimmer : tokens.textInverse, fontFamily: font.mono, fontWeight: 700, fontSize: 14, cursor: selectedStudentIds.length === 0 ? 'not-allowed' : 'pointer', display: 'inline-flex', alignItems: 'center', gap: 10, justifyContent: 'center', transition: 'all 0.2s cubic-bezier(0.16, 1, 0.3, 1)' }}
                >
                  <ArrowRight size={16} /> Enroll {selectedStudentIds.length} Students
                </button>
              </div>
            )}
          </div>
        </Card>

        {/* Right: Student Grid */}
        <Card style={{ display: 'flex', flexDirection: 'column', minHeight: 400 }}>
          <div style={{ fontFamily: font.mono, fontSize: 12, letterSpacing: '0.15em', color: tokens.textPrimary, fontWeight: 700, textTransform: 'uppercase', marginBottom: 20 }}>
            All Students ({students.length})
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(250px, 1fr))', gap: 14, maxHeight: 340, overflowY: 'auto', paddingRight: 4 }}>
            {students.length === 0 && (
              <div style={{ color: tokens.textMuted, fontSize: 14, textAlign: 'center', padding: '60px 20px', fontFamily: font.mono, gridColumn: '1 / -1' }}>No students registered yet.</div>
            )}
            {students.map(s => {
              const isSelected = selectedStudentIds.includes(s.id);
              return (
                <div key={s.id} onClick={() => mode === 'bulk' && toggleStudentSelection(s.id)}
                  style={{ borderRadius: 16, padding: 18, background: isSelected ? tokens.accentMuted : tokens.bgSurface, border: isSelected ? `1px solid ${tokens.accent}` : `1px solid ${tokens.border}`, cursor: mode === 'bulk' ? 'pointer' : 'default', transition: 'all 0.2s', display: 'flex', flexDirection: 'column', gap: 14, position: 'relative', boxShadow: tokens.shadowCard }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8, minWidth: 0 }}>
                      <span style={{ fontSize: 14 }}>👤</span>
                      <div style={{ fontSize: 14, color: tokens.textPrimary, fontWeight: 600, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{s.name}</div>
                    </div>
                    {s.sectionId
                      ? <span style={{ fontFamily: font.mono, fontSize: 10, color: tokens.success, background: tokens.successBg, padding: '3px 8px', borderRadius: 6, border: `1px solid ${tokens.successBorder}`, fontWeight: 700, flexShrink: 0 }}>{sectionMap[s.sectionId]}</span>
                      : <span style={{ fontFamily: font.mono, fontSize: 10, color: tokens.warning, background: tokens.warningBg, padding: '3px 8px', borderRadius: 6, border: `1px solid ${tokens.warningBorder}`, fontWeight: 700, flexShrink: 0 }}>Unassigned</span>
                    }
                  </div>
                  <div style={{ fontSize: 12, color: tokens.textMuted, fontFamily: font.mono, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{s.email}</div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 6, color: tokens.textDimmer, fontSize: 11, borderTop: `1px solid ${tokens.border}`, paddingTop: 10 }}>
                    <Clock size={11} /> <span>Registered</span>
                  </div>
                  {mode === 'bulk' && (
                    <div style={{ position: 'absolute', bottom: 16, right: 16, width: 16, height: 16, borderRadius: 4, border: `2px solid ${isSelected ? tokens.accent : tokens.borderStrong}`, background: isSelected ? tokens.accent : 'transparent', display: 'flex', alignItems: 'center', justifyContent: 'center', transition: 'all 0.15s ease' }}>
                      {isSelected && <span style={{ color: tokens.textInverse, fontSize: 10, fontWeight: 900 }}>✓</span>}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </Card>
      </div>
    </div>
  );
}