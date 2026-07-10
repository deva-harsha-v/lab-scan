import React from 'react';
import { CheckCircle, AlertTriangle } from 'lucide-react';
import { useTheme } from '../../../context/ThemeContext';
import { font } from './hodTokens';

export const Card = ({ children, style }) => {
  const { tokens } = useTheme();
  return (
    <div className="glass-card" style={{ border: `1px solid ${tokens.border}`, borderRadius: 16, background: tokens.bgCard, backdropFilter: tokens.backdropBlur, padding: 24, boxShadow: tokens.shadowCard, transition: 'all 0.3s cubic-bezier(0.16, 1, 0.3, 1)', ...style }}>
      {children}
    </div>
  );
};

export const Label = ({ children }) => {
  const { tokens } = useTheme();
  return (
    <label style={{ display: 'block', fontFamily: font.mono, fontSize: 11, letterSpacing: '0.08em', color: tokens.textSecondary, textTransform: 'uppercase', marginBottom: 8, fontWeight: 700 }}>
      {children}
    </label>
  );
};

export const Input = ({ style, ...props }) => {
  const { tokens } = useTheme();
  return <input className="focusable-input" style={{ width: '100%', padding: '12px 16px', background: tokens.bgInput, border: `1px solid ${tokens.borderInput}`, borderRadius: 10, color: tokens.textPrimary, fontSize: 14, fontFamily: font.sans, outline: 'none', colorScheme: tokens.colorScheme, transition: 'all 0.2s', ...style }} {...props} />;
};

export const Select = ({ children, style, ...props }) => {
  const { tokens } = useTheme();
  return (
    <select className="focusable-input" style={{ width: '100%', padding: '12px 16px', background: tokens.bgSurfaceHover, border: `1px solid ${tokens.borderInput}`, borderRadius: 10, color: tokens.textPrimary, fontSize: 14, fontFamily: font.sans, outline: 'none', colorScheme: tokens.colorScheme, transition: 'all 0.2s', ...style }} {...props}>
      {children}
    </select>
  );
};

export const Btn = ({ children, variant = 'primary', disabled, onClick, style, type }) => {
  const { tokens } = useTheme();
  const base = { padding: '12px 20px', border: 'none', borderRadius: 10, fontFamily: font.mono, fontWeight: 700, fontSize: 12, letterSpacing: '0.04em', cursor: disabled ? 'not-allowed' : 'pointer', transition: 'all 0.2s cubic-bezier(0.16, 1, 0.3, 1)', opacity: disabled ? 0.5 : 1, display: 'inline-flex', alignItems: 'center', gap: 8, justifyContent: 'center', ...style };
  if (variant === 'primary') return <button type={type} className="interactive-btn" onClick={onClick} disabled={disabled} style={{ ...base, background: tokens.accentGrad, color: tokens.textInverse, boxShadow: tokens.shadow }}>{children}</button>;
  if (variant === 'ghost') return <button type={type} className="interactive-btn-ghost" onClick={onClick} disabled={disabled} style={{ ...base, background: tokens.btnSecondaryBg, border: `1px solid ${tokens.btnSecondaryBorder}`, color: tokens.btnSecondaryText }}>{children}</button>;
  if (variant === 'danger') return <button type={type} className="interactive-btn-danger" onClick={onClick} disabled={disabled} style={{ ...base, background: tokens.dangerBg, border: `1px solid ${tokens.dangerBorder}`, color: tokens.danger }}>{children}</button>;
  return <button type={type} onClick={onClick} disabled={disabled} style={base}>{children}</button>;
};

export const ErrBox = ({ msg }) => {
  const { tokens } = useTheme();
  return msg ? <div style={{ padding: '12px 16px', background: tokens.dangerBg, border: `1px solid ${tokens.dangerBorder}`, borderRadius: 10, color: tokens.danger, fontSize: 13, marginBottom: 16, display: 'flex', alignItems: 'center', gap: 8 }}><AlertTriangle size={15} />{msg}</div> : null;
};

export const OkBox = ({ msg }) => {
  const { tokens } = useTheme();
  return msg ? <div style={{ padding: '12px 16px', background: tokens.successBg, border: `1px solid ${tokens.successBorder}`, borderRadius: 10, color: tokens.success, fontSize: 13, marginBottom: 16, display: 'flex', alignItems: 'center', gap: 8 }}><CheckCircle size={15} />{msg}</div> : null;
};