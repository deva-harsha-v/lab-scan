import React from 'react';
import { useTheme } from '../../../context/ThemeContext';
import { font } from './hodTokens';

export default function MetricCard({ value, label, accent, icon: Icon }) {
  const { tokens } = useTheme();
  const isLight = tokens.colorScheme === 'light';
  return (
    <div className="glass-card metric-card" style={{ border: `1px solid ${tokens.border}`, borderRadius: 18, background: tokens.bgCard, padding: '24px 22px', backdropFilter: tokens.backdropBlur, position: 'relative', overflow: 'hidden', transition: 'all 0.3s cubic-bezier(0.16, 1, 0.3, 1)' }}>
      {!isLight && <div style={{ position: 'absolute', top: 0, left: 0, width: '4px', height: '100%', background: accent }} />}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <div style={{ fontFamily: font.mono, fontSize: '36px', fontWeight: 700, color: tokens.textPrimary, lineHeight: 1.1 }}>{value !== undefined && value !== null ? value : '—'}</div>
          <div style={{ fontFamily: font.mono, fontSize: '11px', letterSpacing: '0.06em', color: tokens.textMuted, textTransform: 'uppercase', marginTop: 6, fontWeight: 700 }}>{label}</div>
        </div>
        {Icon && (
          <div style={{ padding: 10, borderRadius: 12, background: tokens.bgSurfaceHover, color: accent, display: 'flex', alignItems: 'center', justifyContent: 'center', border: `1px solid ${tokens.border}` }}>
            <Icon size={20} />
          </div>
        )}
      </div>
    </div>
  );
}