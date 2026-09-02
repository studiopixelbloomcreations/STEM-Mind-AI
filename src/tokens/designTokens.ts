/*NEXLEARN — Design Token System
 * Single source of truth for both marketing site and application.
 * All values expressed as CSS custom properties for runtime accessibility.
 * Tokens defined in index.css :root block and exported here as JS values.
 */

/* Export token values as const object for use in JSX style objects */
export const designTokens = {
  /* Color scale */
  colorBase: '#0a0a0f',
  colorBaseSoft: '#11111a',
  colorSurface: '#14141f',
  colorSurfaceElevated: '#1a1a24',
  colorAccent: '#00d4aa',
  colorAccentHover: '#00f5c4',
  colorAccentSoft: 'rgba(0, 212, 170, 0.12)',
  colorAccentSecondary: '#6366f1',
  colorAccentSecondarySoft: 'rgba(99, 102, 241, 0.12)',
  colorSuccess: '#22c55e',
  colorWarning: '#f59e0b',
  colorError: '#ef4444',
  colorInfo: '#3b82f6',
  colorTextPrimary: '#f8fafc',
  colorTextSecondary: '#9ca3af',
  colorTextMuted: '#6b7280',
  colorBorder: '#374151',
  colorDivider: '#1f2937',
  colorBgSubtle: 'rgba(10, 10, 15, 0.6)',
  colorBgLayer: '#12121a',

  /* Typography */
  fontHeading: '"Nunito Sans", system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
  fontBody: '"Inter", system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',

  /* Spacing */
  space1: '0.25rem',
  space2: '0.5rem',
  space3: '0.75rem',
  space4: '1rem',
  space5: '1.5rem',
  space6: '2rem',
  space7: '3rem',
  space8: '4rem',

  /* Radius */
  radiusSm: '6px',
  radiusMd: '10px',
  radiusLg: '16px',
  radiusFull: '9999px',

  /* Shadow */
  shadowSm: '0 2px 8px rgba(0, 0, 0, 0.3)',
  shadowMd: '0 4px 16px rgba(0, 0, 0, 0.4)',
  shadowLg: '0 12px 40px rgba(0, 0, 0, 0.5)',

  /* Motion */
  easeSettle: 'cubic-bezier(0.4, 0, 0.2, 1)',
  easeExit: 'cubic-bezier(0.4, 0, 0.2, 1)',
  easeSpring: 'cubic-bezier(0.34, 1.56, 0.64, 1)',
  easeFlow: 'cubic-bezier(0.4, 0, 0.2, 1)',
  durationFast: '150ms',
  durationNormal: '250ms',
  durationSlow: '400ms',
  durationEnter: '350ms',
  durationExit: '250ms',

  /* Z-index */
  zDropdown: 100,
  zSticky: 101,
  zModal: 1000,

  /* Theme */
  resolvedTheme: 'dark',
};