import React, { useState } from 'react';
import ResultCompareTable from '../../../components/ResultCompareTable';
import { useTheme } from '../../../context/ThemeContext';

function getYouTubeId(url) {
  if (!url) return null;
  const patterns = [
    /(?:youtube\.com\/watch\?v=|youtu\.be\/|youtube\.com\/embed\/)([^&\n?#]+)/,
    /youtube\.com\/shorts\/([^&\n?#]+)/,
  ];
  for (const pattern of patterns) {
    const m = url.match(pattern);
    if (m) return m[1];
  }
  return null;
}

function decodeLabel(raw) {
  const m = (raw || '').match(/^__s(\d+)__(.*)$/s);
  return m ? { stageId: parseInt(m[1]), label: m[2] } : { stageId: 2, label: raw || '' };
}

function VirtualLabEmbed({ url, label }) {
  const { tokens } = useTheme();
  const [isExpanded, setIsExpanded] = useState(false);

  return (
    <div style={{ background: tokens.bgCard, border: `1px solid ${tokens.border}`, padding: '24px', borderRadius: '16px', overflow: 'hidden' }}>
      {label && (
        <h3 style={{ color: tokens.accent }} className="text-xs font-semibold uppercase tracking-wide mb-3">{label}</h3>
      )}
      {!label && (
        <h3 style={{ color: tokens.accent }} className="text-xs font-semibold uppercase tracking-wide mb-3">🔬 Virtual Lab Simulation</h3>
      )}

      {/* Expand/collapse toggle */}
      <div style={{ marginBottom: 10, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <span style={{ fontSize: 12, color: tokens.textMuted, wordBreak: 'break-all' }}>{url}</span>
        <button
          type="button"
          onClick={() => setIsExpanded(!isExpanded)}
          style={{
            padding: '5px 14px',
            background: isExpanded ? tokens.successBg : tokens.btnSecondaryBg,
            border: `1px solid ${isExpanded ? tokens.successBorder : tokens.btnSecondaryBorder}`,
            borderRadius: 6, 
            cursor: 'pointer',
            color: isExpanded ? tokens.success : tokens.btnSecondaryText,
            fontSize: 12, 
            fontFamily: 'monospace',
            transition: 'all 0.2s',
            whiteSpace: 'nowrap', 
            flexShrink: 0, 
            marginLeft: 10,
          }}
        >
          {isExpanded ? '⊟ Collapse' : '⊞ Open Lab'}
        </button>
      </div>

      {isExpanded && (
        <div style={{
          borderRadius: 10, 
          overflow: 'hidden',
          border: `1px solid ${tokens.successBorder}`,
          background: '#000',
          height: 600,
          position: 'relative',
        }}>
          <iframe
            src={url}
            title={label || 'Virtual Lab Simulation'}
            style={{ width: '100%', height: '100%', border: 'none' }}
            allow="fullscreen; accelerometer; camera; microphone"
            sandbox="allow-scripts allow-same-origin allow-forms allow-popups allow-popups-to-escape-sandbox allow-top-navigation-by-user-activation"
          />
        </div>
      )}

      {!isExpanded && (
        <div style={{
          borderRadius: 10, 
          overflow: 'hidden',
          border: `1px dashed ${tokens.border}`,
          background: tokens.bgSurfaceHover,
          height: 80,
          display: 'flex', 
          alignItems: 'center', 
          justifyContent: 'center',
          gap: 12, 
          color: tokens.textSecondary,
        }}>
          <span style={{ fontSize: 22 }}>🔬</span>
          <span style={{ fontSize: 13 }}>Click "Open Lab" to launch the simulation</span>
        </div>
      )}
    </div>
  );
}

export default function WatchStage({ experiment }) {
  const { tokens } = useTheme();
  const contents = (experiment?.contents || []).filter((c) => {
    const { stageId } = decodeLabel(c.label);
    return stageId === 2;
  });

  const youtubeItems    = contents.filter((c) => c.type === 'YOUTUBE');
  const virtualLabItems = contents.filter((c) => c.type === 'VIRTUAL_LAB');
  const stepItems       = contents.filter((c) => c.type === 'STEP');

  const getLabel = (item) => decodeLabel(item.label).label;

  // Checklist state: track which steps are ticked
  const [checked, setChecked] = useState({});
  const toggle = (key) => setChecked((prev) => ({ ...prev, [key]: !prev[key] }));

  return (
    <div className="space-y-6">
      {/* YouTube videos */}
      {youtubeItems.map((item) => {
        const videoId = getYouTubeId(item.content);
        return (
          <div key={item.id} style={{ background: tokens.bgCard, border: `1px solid ${tokens.border}`, padding: '24px', borderRadius: '16px' }}>
            {getLabel(item) && (
              <h3 style={{ color: tokens.accent }} className="text-xs font-semibold uppercase tracking-wide mb-3">{getLabel(item)}</h3>
            )}
            {videoId ? (
              <div className="aspect-video rounded-xl overflow-hidden bg-black">
                <iframe
                  className="w-full h-full"
                  src={`https://www.youtube.com/embed/${videoId}?rel=0`}
                  title={getLabel(item) || 'Experiment video'}
                  frameBorder="0"
                  allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                  allowFullScreen
                />
              </div>
            ) : (
              <div style={{ background: tokens.bgSurfaceHover, border: `1px solid ${tokens.border}` }} className="aspect-video rounded-xl flex items-center justify-center">
                <div className="text-center">
                  <p style={{ color: tokens.textMuted }} className="text-sm mb-2">Invalid YouTube URL</p>
                  <a href={item.content} target="_blank" rel="noopener noreferrer" style={{ color: tokens.accent }} className="text-sm underline">Open link →</a>
                </div>
              </div>
            )}
          </div>
        );
      })}

      {/* Virtual Lab iframes */}
      {virtualLabItems.map((item) => (
        <VirtualLabEmbed key={item.id} url={item.content} label={getLabel(item)} />
      ))}

      {/* Procedure checklists */}
      {stepItems.map((item) => {
        const lines = item.content.split('\n').filter(Boolean);
        return (
          <div key={item.id} style={{ background: tokens.bgCard, border: `1px solid ${tokens.border}`, padding: '24px', borderRadius: '16px' }}>
            {getLabel(item) && (
              <h3 style={{ color: tokens.accent }} className="text-xs font-semibold uppercase tracking-wide mb-3">{getLabel(item)}</h3>
            )}
            {!getLabel(item) && (
              <h3 style={{ color: tokens.accent }} className="text-xs font-semibold uppercase tracking-wide mb-3">Procedure Checklist</h3>
            )}
            <div className="space-y-2">
              {lines.map((line, i) => {
                const key = `${item.id}-${i}`;
                const cleanLine = line.replace(/^\d+\.\s*/, '');
                const isDone = !!checked[key];
                return (
                  <button
                    key={key}
                    type="button"
                    onClick={() => toggle(key)}
                    style={{
                      background: isDone ? tokens.successBg : tokens.bgSurface,
                      borderColor: isDone ? tokens.successBorder : tokens.border,
                      borderWidth: '1px'
                    }}
                    className="w-full flex items-start gap-3 px-3 py-2.5 rounded-lg text-left transition-all"
                  >
                    <div 
                      style={{
                        background: isDone ? tokens.success : 'transparent',
                        borderColor: isDone ? tokens.success : tokens.borderStrong
                      }}
                      className="w-5 h-5 rounded flex items-center justify-center flex-shrink-0 mt-0.5 border-2 transition-colors"
                    >
                      {isDone && (
                        <svg className="w-3 h-3 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                        </svg>
                      )}
                    </div>
                    <span style={{ color: isDone ? tokens.textMuted : tokens.textSecondary }} className={`text-sm leading-relaxed ${isDone ? 'line-through' : ''}`}>
                      <span style={{ color: tokens.textDimmer }} className="font-mono mr-1">{i + 1}.</span>
                      {cleanLine}
                    </span>
                  </button>
                );
              })}
            </div>
            {/* Progress bar */}
            {lines.length > 0 && (() => {
              const done = lines.filter((_, i) => checked[`${item.id}-${i}`]).length;
              const pct = Math.round((done / lines.length) * 100);
              return (
                <div className="mt-3">
                  <div style={{ color: tokens.textMuted }} className="flex justify-between text-xs mb-1">
                    <span>Progress</span>
                    <span>{done}/{lines.length} steps done</span>
                  </div>
                  <div style={{ background: tokens.bgSurfaceHover }} className="h-1.5 rounded-full overflow-hidden">
                    <div
                      style={{ width: `${pct}%`, background: tokens.success }}
                      className="h-full rounded-full transition-all duration-300"
                    />
                  </div>
                </div>
              );
            })()}
          </div>
        );
      })}

      {contents.length === 0 && (
        <div style={{ background: tokens.bgCard, border: `1px solid ${tokens.border}`, padding: '48px' }} className="text-center rounded-2xl">
          <div style={{ background: tokens.bgSurfaceHover }} className="w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
            <svg style={{ color: tokens.textMuted }} className="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5}
                d="M15 10l4.553-2.069A1 1 0 0121 8.87v6.259a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
            </svg>
          </div>
          <p style={{ color: tokens.textMuted }} className="text-sm">No videos, simulations, or procedure steps added yet.</p>
        </div>
      )}
    </div>
  );
}