/**
 * Shared style builders for dashboard pages.
 * All dashboards call makeStyles(tokens) to get consistent, theme-aware inline styles.
 */

export function makeStyles(tokens) {
  const font = {
    mono: "'Space Mono',monospace",
    sans: "'DM Sans',sans-serif",
    syne: "'Syne',sans-serif",
  };

  return {
    font,

    page: {
      minHeight: '100vh',
      background: tokens.bgPage,
      color: tokens.textPrimary,
      fontFamily: font.sans,
    },

    nav: {
      position: 'sticky',
      top: 0,
      zIndex: 50,
      height: 60,
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'space-between',
      padding: '0 20px',
      background: tokens.bgNav,
      backdropFilter: tokens.backdropBlur,
      borderBottom: `1px solid ${tokens.border}`,
    },

    card: {
      border: `1px solid ${tokens.border}`,
      borderRadius: 14,
      background: tokens.bgCard,
      backdropFilter: 'blur(12px)',
      padding: 24,
      boxShadow: tokens.shadowCard,
    },

    cardSurface: {
      border: `1px solid ${tokens.border}`,
      borderRadius: 12,
      background: tokens.bgSurface,
      padding: '16px 20px',
    },

    input: {
      width: '100%',
      padding: '10px 13px',
      background: tokens.bgInput,
      border: `1px solid ${tokens.borderInput}`,
      borderRadius: 8,
      color: tokens.textPrimary,
      fontSize: 13,
      fontFamily: font.sans,
      outline: 'none',
      colorScheme: tokens.colorScheme,
      transition: 'all 0.2s',
    },

    label: {
      fontFamily: font.mono,
      fontSize: 11,
      letterSpacing: '0.1em',
      color: tokens.textMuted,
      textTransform: 'uppercase',
      display: 'block',
      marginBottom: 8,
    },

    sectionTitle: {
      fontFamily: font.syne,
      fontWeight: 700,
      fontSize: 16,
      color: tokens.textPrimary,
      letterSpacing: '-0.01em',
    },

    pageTitle: {
      fontFamily: font.syne,
      fontWeight: 700,
      fontSize: 22,
      color: tokens.textPrimary,
      letterSpacing: '-0.02em',
    },

    muted: {
      fontSize: 12,
      color: tokens.textMuted,
      fontFamily: font.mono,
    },

    // Sidebar
    sidebar: {
      width: 240,
      minHeight: '100%',
      background: tokens.bgSidebar,
      borderRight: `1px solid ${tokens.border}`,
      padding: '20px 0',
      flexShrink: 0,
    },

    sidebarItem: (active) => ({
      display: 'flex',
      alignItems: 'center',
      gap: 10,
      padding: '9px 16px',
      margin: '2px 8px',
      borderRadius: 8,
      cursor: 'pointer',
      background: active ? tokens.accentMuted : 'transparent',
      color: active ? tokens.accent : tokens.textMuted,
      border: active ? `1px solid ${tokens.accentBorder}` : '1px solid transparent',
      fontSize: 13,
      fontWeight: active ? 600 : 400,
      transition: 'all 0.2s',
    }),

    // Buttons
    btnPrimary: {
      padding: '10px 20px',
      borderRadius: 9,
      border: 'none',
      background: tokens.btnPrimaryBg,
      color: tokens.btnPrimaryText,
      fontSize: 13,
      fontFamily: font.sans,
      fontWeight: 600,
      cursor: 'pointer',
      transition: 'all 0.2s',
    },

    btnSecondary: {
      padding: '9px 16px',
      borderRadius: 8,
      border: `1px solid ${tokens.btnSecondaryBorder}`,
      background: tokens.btnSecondaryBg,
      color: tokens.btnSecondaryText,
      fontSize: 13,
      fontFamily: font.sans,
      fontWeight: 500,
      cursor: 'pointer',
      transition: 'all 0.2s',
    },

    btnDanger: {
      padding: '9px 16px',
      borderRadius: 8,
      border: `1px solid ${tokens.btnDangerBorder}`,
      background: tokens.btnDangerBg,
      color: tokens.btnDangerText,
      fontSize: 13,
      fontFamily: font.sans,
      fontWeight: 500,
      cursor: 'pointer',
      transition: 'all 0.2s',
    },

    btnIcon: {
      background: 'none',
      border: `1px solid ${tokens.border}`,
      borderRadius: 7,
      color: tokens.textMuted,
      padding: '6px 10px',
      cursor: 'pointer',
      fontSize: 11,
      fontFamily: font.mono,
      transition: 'all 0.2s',
    },

    // Table
    tableHeader: {
      background: tokens.bgSurface,
      borderBottom: `1px solid ${tokens.border}`,
      padding: '10px 16px',
      fontSize: 11,
      fontFamily: font.mono,
      color: tokens.textMuted,
      letterSpacing: '0.07em',
      textTransform: 'uppercase',
    },

    tableRow: {
      borderBottom: `1px solid ${tokens.borderMuted}`,
      padding: '12px 16px',
    },

    // Modal
    modalOverlay: {
      position: 'fixed',
      inset: 0,
      zIndex: 200,
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      background: tokens.bgModalOverlay,
      backdropFilter: 'blur(8px)',
    },

    modal: {
      background: tokens.bgModal,
      border: `1px solid ${tokens.borderStrong}`,
      borderRadius: 16,
      padding: 28,
      width: 440,
      maxWidth: '92vw',
      boxShadow: tokens.shadowModal,
    },

    // Status / badge
    statusBadge: (type) => {
      const map = {
        ACTIVE:   { color: tokens.success,  bg: tokens.successBg,  border: tokens.successBorder },
        GRACE:    { color: tokens.accent,   bg: tokens.accentMuted, border: tokens.accentBorder },
        DRAFT:    { color: tokens.textMuted, bg: tokens.bgSurface,  border: tokens.border },
        CLOSED:   { color: tokens.danger,   bg: tokens.dangerBg,   border: tokens.dangerBorder },
        REVIEWED: { color: tokens.success,  bg: tokens.successBg,  border: tokens.successBorder },
        PENDING:  { color: tokens.warning,  bg: tokens.warningBg,  border: tokens.warningBorder },
        SUBMITTED:{ color: tokens.accent,   bg: tokens.accentMuted, border: tokens.accentBorder },
      };
      const c = map[type] || map.DRAFT;
      return {
        display: 'inline-flex',
        alignItems: 'center',
        gap: 5,
        padding: '3px 10px',
        borderRadius: 100,
        border: `1px solid ${c.border}`,
        background: c.bg,
        color: c.color,
        fontSize: 11,
        fontFamily: "'Space Mono',monospace",
        fontWeight: 700,
        letterSpacing: '0.04em',
      };
    },

    // Role badge
    roleBadge: (role) => {
      const colorMap = {
        ADMIN:   tokens.roleAdmin,
        FACULTY: tokens.roleFaculty,
        STUDENT: tokens.roleStudent,
        HOD:     tokens.roleHod,
      };
      const c = colorMap[role] || tokens.textMuted;
      return {
        padding: '2px 8px',
        borderRadius: 100,
        border: `1px solid ${c}44`,
        background: c + '12',
        color: c,
        fontSize: 10,
        fontFamily: "'Space Mono',monospace",
        letterSpacing: '0.06em',
        flexShrink: 0,
      };
    },

    // Error / info banners
    errorBanner: {
      padding: '12px 16px',
      background: tokens.dangerBg,
      border: `1px solid ${tokens.dangerBorder}`,
      borderRadius: 10,
      color: tokens.danger,
      fontSize: 13,
    },

    infoBanner: {
      padding: '12px 16px',
      background: tokens.accentMuted,
      border: `1px solid ${tokens.accentBorder}`,
      borderRadius: 10,
      color: tokens.accent,
      fontSize: 13,
    },

    successBanner: {
      padding: '12px 16px',
      background: tokens.successBg,
      border: `1px solid ${tokens.successBorder}`,
      borderRadius: 10,
      color: tokens.success,
      fontSize: 13,
    },

    warningBanner: {
      padding: '12px 16px',
      background: tokens.warningBg,
      border: `1px solid ${tokens.warningBorder}`,
      borderRadius: 10,
      color: tokens.warning,
      fontSize: 13,
    },

    // Divider
    divider: {
      borderTop: `1px solid ${tokens.border}`,
    },

    // Empty state
    emptyState: {
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      padding: '48px 24px',
      color: tokens.textMuted,
      fontFamily: "'Space Mono',monospace",
      fontSize: 13,
      textAlign: 'center',
    },
  };
}

/** Quick role → color mapping helper */
export function roleColor(role, tokens) {
  const map = {
    ADMIN:   tokens.roleAdmin,
    FACULTY: tokens.roleFaculty,
    STUDENT: tokens.roleStudent,
    HOD:     tokens.roleHod,
  };
  return map[role] || tokens.textMuted;
}
