import React, { useState } from 'react';
import { submissionsApi } from '../../api/submissions.api';
import { useTheme } from '../../context/ThemeContext';

export default function SubmissionCard({ submission, onReviewed, maxMarks = 50 }) {
  const { tokens } = useTheme();
  const [marks, setMarks] = useState(submission.marks ?? '');
  const [note, setNote] = useState(submission.reviewNote ?? '');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [expanded, setExpanded] = useState(false);

  const isReviewed = submission.marks !== null && submission.marks !== undefined;
  const isDark = tokens.colorScheme === 'dark';

  const handleSave = async () => {
    const marksNum = parseInt(marks);
    if (isNaN(marksNum) || marksNum < 0 || marksNum > maxMarks) {
      setError(`Marks must be 0–${maxMarks}`);
      return;
    }
    setError('');
    setSaving(true);
    try {
      const res = await submissionsApi.review(submission.id, {
        marks: marksNum,
        reviewNote: note,
      });
      onReviewed?.(res.data);
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to save review');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div 
      style={{
        border: isReviewed ? `1px solid ${tokens.successBorder}` : `1px solid ${tokens.border}`,
        background: isReviewed ? tokens.successBg : tokens.bgCard,
        borderRadius: '16px',
        padding: '20px',
        marginBottom: '16px',
        boxShadow: tokens.shadowCard,
        transition: 'all 0.25s ease'
      }}
    >
      {/* Header */}
      <div className="flex items-start justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-0.5">
            <h3 style={{ color: tokens.textPrimary }} className="font-semibold">{submission.studentName}</h3>
            {isReviewed && (
              <span 
                style={{ 
                  background: tokens.successBg, 
                  color: tokens.success, 
                  borderColor: tokens.successBorder 
                }} 
                className="text-xs border px-2 py-0.5 rounded-full font-mono font-bold"
              >
                Marked: {submission.marks}/{maxMarks}
              </span>
            )}
          </div>
          <p style={{ color: tokens.textSecondary }} className="text-sm">
            Roll: <span style={{ color: tokens.textPrimary }} className="font-mono">{submission.rollNumber}</span>
          </p>
          <p style={{ color: tokens.textMuted }} className="text-xs mt-0.5">
            {new Date(submission.submittedAt).toLocaleString()}
          </p>
        </div>
        <button
          onClick={() => setExpanded(!expanded)}
          style={{ color: tokens.textMuted }}
          className="hover:opacity-85 transition-opacity"
        >
          <svg
            className={`w-5 h-5 transition-transform ${expanded ? 'rotate-180' : ''}`}
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
          </svg>
        </button>
      </div>

      {/* Expanded content */}
      {expanded && (
        <div className="mt-4 space-y-4 animate-fade-in">
          {/* Observation photo */}
          <div>
            <p style={{ color: tokens.textDimmer }} className="text-xs uppercase tracking-wide mb-2">Observation Photo</p>
            <a
              href={submission.observationPhotoUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="block"
            >
              <img
                src={submission.observationPhotoUrl}
                alt={`Observation by ${submission.studentName}`}
                style={{ 
                  background: tokens.bgSurfaceHover, 
                  borderColor: tokens.border 
                }}
                className="w-full max-h-64 object-contain rounded-xl border hover:opacity-95 transition-opacity"
              />
            </a>
          </div>

          {/* Result notes */}
          {submission.resultNotes && (
            <div>
              <p style={{ color: tokens.textDimmer }} className="text-xs uppercase tracking-wide mb-2">Result Notes</p>
              <div 
                style={{ 
                  background: tokens.bgInput, 
                  borderColor: tokens.borderInput, 
                  color: tokens.textPrimary 
                }} 
                className="rounded-lg border p-3 text-sm font-mono whitespace-pre-wrap break-words"
              >
                {(() => {
                  try {
                    return JSON.stringify(JSON.parse(submission.resultNotes), null, 2);
                  } catch {
                    return submission.resultNotes;
                  }
                })()}
              </div>
            </div>
          )}

          {/* Review section */}
          <div style={{ borderTop: `1px solid ${tokens.border}` }} className="pt-2">
            <p style={{ color: tokens.textDimmer }} className="text-xs uppercase tracking-wide mb-3">Review</p>
            <div className="space-y-3">
              <div className="flex items-center gap-3">
                <div className="w-28">
                  <label style={{ color: tokens.textSecondary }} className="block text-xs mb-1">Marks (0–{maxMarks})</label>
                  <input
                    type="number"
                    min={0}
                    max={maxMarks}
                    value={marks}
                    onChange={(e) => setMarks(e.target.value)}
                    placeholder="—"
                    style={{
                      width: '100%',
                      padding: '6px 12px',
                      background: tokens.bgInput,
                      border: `1px solid ${tokens.borderInput}`,
                      borderRadius: '8px',
                      color: tokens.textPrimary,
                      outline: 'none',
                      colorScheme: tokens.colorScheme
                    }}
                    className="text-sm font-mono"
                  />
                </div>
              </div>
              <div>
                <label style={{ color: tokens.textSecondary }} className="block text-xs mb-1">Review Note (optional)</label>
                <textarea
                  rows={2}
                  value={note}
                  onChange={(e) => setNote(e.target.value)}
                  placeholder="Add feedback for the student…"
                  style={{
                    width: '100%',
                    padding: '8px 12px',
                    background: tokens.bgInput,
                    border: `1px solid ${tokens.borderInput}`,
                    borderRadius: '8px',
                    color: tokens.textPrimary,
                    outline: 'none',
                    resize: 'none'
                  }}
                  className="text-sm"
                />
              </div>
              {error && <p style={{ color: tokens.danger }} className="text-xs font-semibold">{error}</p>}
              <button
                onClick={handleSave}
                disabled={saving}
                style={{
                  padding: '8px 16px',
                  background: tokens.accentGrad,
                  color: tokens.textInverse,
                  border: 'none',
                  borderRadius: '8px',
                  fontWeight: 600,
                  cursor: saving ? 'wait' : 'pointer',
                  boxShadow: tokens.shadow,
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px',
                  transition: 'opacity 0.2s'
                }}
                className="text-sm hover:opacity-90 disabled:opacity-50"
              >
                {saving ? (
                  <div style={{ borderTopColor: tokens.textInverse }} className="w-3.5 h-3.5 border-2 border-white/30 rounded-full animate-spin" />
                ) : (
                  <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                )}
                Save Review
              </button>

              {isReviewed && submission.reviewedAt && (
                <p style={{ color: tokens.textMuted }} className="text-xs italic">
                  Reviewed by {submission.reviewedBy} on{' '}
                  {new Date(submission.reviewedAt).toLocaleString()}
                </p>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}