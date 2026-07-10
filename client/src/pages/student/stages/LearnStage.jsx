import React, { useState } from 'react';
import ResultCompareTable from '../../../components/ResultCompareTable';
import 'katex/dist/katex.min.css';
import { InlineMath, BlockMath } from 'react-katex';
import { useTheme } from '../../../context/ThemeContext';

function decodeLabel(raw) {
  const m = (raw || '').match(/^__s(\d+)__(.*)$/s);
  return m ? { stageId: parseInt(m[1]), label: m[2] } : { stageId: 1, label: raw || '' };
}

// Renders text that may contain $...$ (inline) and $$...$$ (block) LaTeX
function MathText({ text }) {
  if (!text) return null;

  const segments = [];
  const blockParts = text.split(/(\$\$[\s\S]+?\$$)/g);

  blockParts.forEach((part) => {
    if (part.startsWith('$$') && part.endsWith('$$')) {
      const math = part.slice(2, -2).trim();
      segments.push({ type: 'block', math });
    } else {
      const inlineParts = part.split(/(\$[^\$]+?\$)/g);
      inlineParts.forEach((ip) => {
        if (ip.startsWith('$') && ip.endsWith('$') && ip.length > 2) {
          segments.push({ type: 'inline', math: ip.slice(1, -1) });
        } else if (ip) {
          segments.push({ type: 'text', content: ip });
        }
      });
    }
  });

  return (
    <>
      {segments.map((seg, i) => {
        if (seg.type === 'block') return <div key={i} className="my-3 overflow-x-auto"><BlockMath math={seg.math} /></div>;
        if (seg.type === 'inline') return <InlineMath key={i} math={seg.math} />;
        return <span key={i} style={{ whiteSpace: 'pre-wrap' }}>{seg.content}</span>;
      })}
    </>
  );
}

/**
 * Returns a Cloudinary PDF URL that the browser will render inline.
 *
 * PDFs must stay on the /raw/upload/ endpoint — Cloudinary's /image/upload/
 * endpoint cannot serve PDFs and returns a blank/broken response.
 * We inject fl_attachment:false into the /raw/upload/ path so Cloudinary
 * sets Content-Disposition: inline instead of triggering a download.
 */
function toInlinePdfUrl(url) {
  if (!url) return url;

  // Fix duplicate path segments first
  let fixed = url.replace(/labscan\/pdfs\/labscan\/pdfs\//g, 'labscan/pdfs/');

  // If it was incorrectly converted to /image/upload/ before, revert it
  if (fixed.includes('/image/upload/fl_attachment:false/')) {
    fixed = fixed.replace('/image/upload/fl_attachment:false/', '/raw/upload/fl_attachment:false/');
    return fixed;
  }
  if (fixed.includes('/image/upload/')) {
    fixed = fixed.replace('/image/upload/', '/raw/upload/fl_attachment:false/');
    return fixed;
  }

  // Correct path: inject fl_attachment:false into /raw/upload/
  if (fixed.includes('/raw/upload/') && !fixed.includes('fl_attachment:false')) {
    fixed = fixed.replace('/raw/upload/', '/raw/upload/fl_attachment:false/');
  }

  return fixed;
}

function PdfViewer({ url, label }) {
  const { tokens } = useTheme();
  const [expanded, setExpanded] = useState(false);

  if (!url) return null;

  const pdfUrl = toInlinePdfUrl(url);

  return (
    <div style={{ background: tokens.bgCard, border: `1px solid ${tokens.border}`, padding: '16px', borderRadius: '12px', marginBottom: '16px' }}>
      <div className="flex items-center justify-between gap-3 flex-wrap sm:flex-nowrap">
        {/* Icon + title */}
        <div className="flex items-center gap-3 min-w-0">
          <div style={{ background: `${tokens.accent}22` }} className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0">
            <svg style={{ color: tokens.accent }} className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5}
                d="M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
            </svg>
          </div>
          <div className="min-w-0">
            <p style={{ color: tokens.textPrimary }} className="text-sm font-medium truncate">{label || 'Reference Document'}</p>
            <p style={{ color: tokens.textMuted }} className="text-xs mt-0.5">PDF Document</p>
          </div>
        </div>

        {/* Actions */}
        <div className="flex items-center gap-2 ml-auto">
          <button
            type="button"
            onClick={() => setExpanded(!expanded)}
            style={{
              background: expanded ? `${tokens.accent}22` : tokens.btnSecondaryBg,
              color: expanded ? tokens.accent : tokens.btnSecondaryText,
              borderColor: expanded ? `${tokens.accent}55` : tokens.btnSecondaryBorder,
              padding: '6px 16px',
              fontSize: '12px',
              fontWeight: 500,
              borderRadius: '8px',
              borderWidth: '1px',
              transition: 'all 0.2s ease',
              display: 'flex',
              alignItems: 'center',
              gap: '6px'
            }}
          >
            <svg width="14" height="14" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              {expanded
                ? <path strokeLinecap="round" strokeLinejoin="round" d="M5 15l7-7 7 7" />
                : <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
              }
            </svg>
            {expanded ? 'Collapse' : 'View PDF'}
          </button>
        </div>
      </div>

      {expanded && (
        <div style={{ borderTop: `1px solid ${tokens.border}` }} className="mt-4 pt-4">
          <div style={{ borderColor: tokens.border, background: tokens.bgInput }} className="rounded-lg overflow-hidden border h-[640px]">
            <iframe
              src={`https://docs.google.com/viewer?url=${encodeURIComponent(pdfUrl)}&embedded=true`}
              title={label || 'PDF Document'}
              className="w-full h-full border-none block"
            />
          </div>
        </div>
      )}
    </div>
  );
}

export default function LearnStage({ experiment }) {
  const { tokens } = useTheme();
  const contents = (experiment?.contents || []).filter((c) => {
    const { stageId } = decodeLabel(c.label);
    return stageId === 1;
  });

  const textItems   = contents.filter((c) => c.type === 'TEXT');
  const pdfItems    = contents.filter((c) => c.type === 'PDF');
  const sampleItems = contents.filter((c) => c.type === 'SAMPLE_RESULT');

  const getLabel = (item) => decodeLabel(item.label).label;

  return (
    <div className="space-y-6">
      {textItems.map((item) => (
        <div key={item.id} style={{ background: tokens.bgCard, border: `1px solid ${tokens.border}`, padding: '24px', borderRadius: '16px' }}>
          {getLabel(item) && (
            <h3 style={{ color: tokens.accent }} className="text-xs font-semibold uppercase tracking-wide mb-3">{getLabel(item)}</h3>
          )}
          <div style={{ color: tokens.textSecondary }} className="leading-relaxed text-sm">
            <MathText text={item.content} />
          </div>
        </div>
      ))}

      {pdfItems.map((item) => (
        <PdfViewer key={item.id} url={item.content} label={getLabel(item)} />
      ))}

      {sampleItems.map((item) => (
        <div key={item.id} style={{ background: tokens.bgCard, border: `1px solid ${tokens.border}`, padding: '24px', borderRadius: '16px' }}>
          <h3 style={{ color: tokens.accent }} className="text-xs font-semibold uppercase tracking-wide mb-3">
            {getLabel(item) || 'Expected Results'}
          </h3>
          <ResultCompareTable sampleResult={item.content} studentNotes={null} />
        </div>
      ))}

      {contents.length === 0 && (
        <div style={{ color: tokens.textDimmer }} className="text-center py-10 text-sm">
          No learning content has been added for this experiment yet.
        </div>
      )}
    </div>
  );
}