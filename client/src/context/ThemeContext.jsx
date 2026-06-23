import React, { createContext, useContext, useState, useEffect } from 'react';

const ThemeContext = createContext(null);

export const THEMES = {
  DARK: 'dark',
  LIGHT: 'light',
};

/**
 * Design tokens — every value is defined here.
 * Components consume via `useTheme().tokens` or CSS variables via `useTheme().cssVars`.
 */
export const DARK_TOKENS = {
  // Backgrounds
  bgPage:        '#050c14',
  bgNav:         'rgba(5,12,20,0.88)',
  bgSurface:     'rgba(255,255,255,0.025)',
  bgSurfaceHover:'rgba(255,255,255,0.045)',
  bgCard:        'rgba(255,255,255,0.03)',
  bgCardHover:   'rgba(255,255,255,0.05)',
  bgInput:       'rgba(255,255,255,0.04)',
  bgModal:       '#0d1e2e',
  bgModalOverlay:'rgba(5,12,20,0.85)',
  bgSidebar:     'rgba(5,12,20,0.95)',
  bgCodeBlock:   'rgba(0,0,0,0.3)',

  // Borders
  border:        'rgba(255,255,255,0.07)',
  borderMuted:   'rgba(255,255,255,0.04)',
  borderAccent:  'rgba(99,210,255,0.15)',
  borderInput:   'rgba(99,210,255,0.12)',
  borderStrong:  'rgba(255,255,255,0.12)',

  // Text
  textPrimary:   '#e2f4ff',
  textSecondary: 'rgba(200,220,235,0.7)',
  textMuted:     'rgba(200,220,235,0.45)',
  textDimmer:    'rgba(200,220,235,0.25)',
  textInverse:   '#050c14',

  // Brand / Accent
  accent:        '#63d2ff',
  accentHover:   '#82daff',
  accentMuted:   'rgba(99,210,255,0.08)',
  accentBorder:  'rgba(99,210,255,0.25)',
  accentGrad:    'linear-gradient(135deg,#63d2ff,#1e64ff)',

  // Semantic
  success:       '#4af0c4',
  successBg:     'rgba(74,240,196,0.08)',
  successBorder: 'rgba(74,240,196,0.3)',
  warning:       '#fbbf24',
  warningBg:     'rgba(251,191,36,0.08)',
  warningBorder: 'rgba(251,191,36,0.25)',
  danger:        '#f87171',
  dangerBg:      'rgba(248,113,113,0.1)',
  dangerBorder:  'rgba(248,113,113,0.25)',
  info:          '#a78bfa',
  infoBg:        'rgba(167,139,250,0.08)',
  infoBorder:    'rgba(167,139,250,0.25)',

  // Role colors
  roleAdmin:     '#a78bfa',
  roleFaculty:   '#63d2ff',
  roleStudent:   '#4af0c4',
  roleHod:       '#fbbf24',

  // Button — primary
  btnPrimaryBg:        '#0ea5e9',
  btnPrimaryBgHover:   '#0284c7',
  btnPrimaryText:      '#ffffff',
  btnSecondaryBg:      'rgba(255,255,255,0.05)',
  btnSecondaryBgHover: 'rgba(255,255,255,0.1)',
  btnSecondaryText:    '#e2f4ff',
  btnSecondaryBorder:  'rgba(255,255,255,0.12)',
  btnDangerBg:         'rgba(248,113,113,0.1)',
  btnDangerBgHover:    'rgba(248,113,113,0.2)',
  btnDangerText:       '#f87171',
  btnDangerBorder:     'rgba(248,113,113,0.25)',

  // Misc
  shadow:          '0 8px 32px rgba(0,0,0,0.45)',
  shadowCard:      '0 4px 20px rgba(0,0,0,0.35)',
  shadowModal:     '0 24px 80px rgba(0,0,0,0.6)',
  backdropBlur:    'blur(20px)',
  colorScheme:     'dark',
};

export const LIGHT_TOKENS = {
  // Backgrounds — clean Stripe/Linear/Vercel inspired
  bgPage:        '#f8f9fb',
  bgNav:         'rgba(255,255,255,0.92)',
  bgSurface:     '#ffffff',
  bgSurfaceHover:'#f1f5f9',
  bgCard:        '#ffffff',
  bgCardHover:   '#f8fafc',
  bgInput:       '#ffffff',
  bgModal:       '#ffffff',
  bgModalOverlay:'rgba(15,23,42,0.45)',
  bgSidebar:     '#ffffff',
  bgCodeBlock:   '#f1f5f9',

  // Borders
  border:        '#e2e8f0',
  borderMuted:   '#f1f5f9',
  borderAccent:  'rgba(14,165,233,0.3)',
  borderInput:   '#cbd5e1',
  borderStrong:  '#cbd5e1',

  // Text
  textPrimary:   '#0f172a',
  textSecondary: '#334155',
  textMuted:     '#64748b',
  textDimmer:    '#94a3b8',
  textInverse:   '#ffffff',

  // Brand / Accent
  accent:        '#0ea5e9',
  accentHover:   '#0284c7',
  accentMuted:   'rgba(14,165,233,0.08)',
  accentBorder:  'rgba(14,165,233,0.25)',
  accentGrad:    'linear-gradient(135deg,#0ea5e9,#6366f1)',

  // Semantic
  success:       '#059669',
  successBg:     'rgba(5,150,105,0.08)',
  successBorder: 'rgba(5,150,105,0.2)',
  warning:       '#d97706',
  warningBg:     'rgba(217,119,6,0.08)',
  warningBorder: 'rgba(217,119,6,0.2)',
  danger:        '#dc2626',
  dangerBg:      'rgba(220,38,38,0.07)',
  dangerBorder:  'rgba(220,38,38,0.2)',
  info:          '#7c3aed',
  infoBg:        'rgba(124,58,237,0.07)',
  infoBorder:    'rgba(124,58,237,0.2)',

  // Role colors
  roleAdmin:     '#7c3aed',
  roleFaculty:   '#0284c7',
  roleStudent:   '#059669',
  roleHod:       '#d97706',

  // Button — primary
  btnPrimaryBg:        '#0ea5e9',
  btnPrimaryBgHover:   '#0284c7',
  btnPrimaryText:      '#ffffff',
  btnSecondaryBg:      '#f8fafc',
  btnSecondaryBgHover: '#f1f5f9',
  btnSecondaryText:    '#334155',
  btnSecondaryBorder:  '#e2e8f0',
  btnDangerBg:         'rgba(220,38,38,0.07)',
  btnDangerBgHover:    'rgba(220,38,38,0.12)',
  btnDangerText:       '#dc2626',
  btnDangerBorder:     'rgba(220,38,38,0.2)',

  // Misc
  shadow:          '0 4px 16px rgba(15,23,42,0.08)',
  shadowCard:      '0 1px 3px rgba(15,23,42,0.08), 0 4px 12px rgba(15,23,42,0.05)',
  shadowModal:     '0 20px 60px rgba(15,23,42,0.15)',
  backdropBlur:    'blur(20px)',
  colorScheme:     'light',
};

export function ThemeProvider({ children }) {
  const [theme, setTheme] = useState(() => {
    // 1. Check localStorage first (user's explicit preference)
    const saved = localStorage.getItem('labscan_theme');
    if (saved === THEMES.DARK || saved === THEMES.LIGHT) return saved;
    // 2. Fall back to system preference
    if (window.matchMedia('(prefers-color-scheme: light)').matches) return THEMES.LIGHT;
    return THEMES.DARK;
  });

  const tokens = theme === THEMES.DARK ? DARK_TOKENS : LIGHT_TOKENS;

  // Apply theme class to <html> for Tailwind dark: support
  useEffect(() => {
    const root = document.documentElement;
    root.classList.remove('dark', 'light');
    root.classList.add(theme);
    root.setAttribute('data-theme', theme);

    // Inject CSS custom properties for components using var(--token)
    const vars = Object.entries(tokens)
      .map(([k, v]) => `--${k.replace(/([A-Z])/g, '-$1').toLowerCase()}: ${v};`)
      .join('\n  ');
    let styleEl = document.getElementById('labscan-theme-vars');
    if (!styleEl) {
      styleEl = document.createElement('style');
      styleEl.id = 'labscan-theme-vars';
      document.head.appendChild(styleEl);
    }
    styleEl.textContent = `:root {\n  ${vars}\n}`;
  }, [theme, tokens]);

  const toggleTheme = () => {
    setTheme(prev => {
      const next = prev === THEMES.DARK ? THEMES.LIGHT : THEMES.DARK;
      localStorage.setItem('labscan_theme', next);
      return next;
    });
  };

  return (
    <ThemeContext.Provider value={{ theme, tokens, toggleTheme, isDark: theme === THEMES.DARK }}>
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme() {
  const ctx = useContext(ThemeContext);
  if (!ctx) throw new Error('useTheme must be used within ThemeProvider');
  return ctx;
}
