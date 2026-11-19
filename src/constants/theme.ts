import { Platform } from 'react-native';

// Material 3-inspired dark color roles: tonal surfaces, readable on-colors,
// semantic status colors, and consistent spacing/shape tokens.
export const BasePalette = {
  bg: '#111318',
  bgEdge: '#0B0D11',
  surface: '#191C20',
  surfaceElevated: '#20242B',
  surfaceSolid: '#1D2025',
  muted: '#C1C7D0',
  border: '#343941',
  borderStrong: '#555D69',
} as const;

export const Semantic = {
  red: '#F2B8B5',
  redSoft: 'rgba(242,184,181,0.14)',
  blue: '#A8C7FA',
  blueSoft: 'rgba(168,199,250,0.14)',
  neutral: '#C1C7D0',
  neutralSoft: 'rgba(193,199,208,0.12)',
  unregistered: '#8E9199',
} as const;

export const Colors = {
  light: { text: '#E3E2E9', background: BasePalette.bg, tint: Semantic.blue, icon: BasePalette.muted, tabIconDefault: BasePalette.muted, tabIconSelected: Semantic.blue },
  dark: { text: '#E3E2E9', background: BasePalette.bg, tint: Semantic.blue, icon: BasePalette.muted, tabIconDefault: BasePalette.muted, tabIconSelected: Semantic.blue },
};

export const SchoolColors = {
  background: BasePalette.bg,
  surface: BasePalette.surface,
  surfaceSolid: BasePalette.surfaceSolid,
  surfaceElevated: BasePalette.surfaceElevated,
  navBg: '#191C20',
  white: '#E3E2E9',
  navy: '#DCE2F0',
  textPrimary: '#E3E2E9',
  textSecondary: '#C1C7D0',
  textMuted: '#B7BEC9',
  textFaint: '#8E9199',
  cardBorder: BasePalette.border,
  cardBorderStrong: BasePalette.borderStrong,
  divider: '#343941',
  gray: Semantic.neutralSoft,
  muted: '#C1C7D0',
  green: '#A8DAB5',
  red: Semantic.red,
  blue: Semantic.blue,
  orange: '#F4BF77',
  greenSoft: 'rgba(168,218,181,0.14)',
  redSoft: Semantic.redSoft,
  blueSoft: Semantic.blueSoft,
  orangeSoft: 'rgba(244,191,119,0.14)',
  cardBg: BasePalette.surfaceSolid,
} as const;

export const SchoolDarkColors = SchoolColors;

export const Fonts = Platform.select({
  ios: { sans: 'System', serif: 'Georgia', rounded: 'System', mono: 'Menlo' },
  default: { sans: 'normal', serif: 'serif', rounded: 'normal', mono: 'monospace' },
  web: { sans: "Roboto, 'Inter', system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif", serif: "Georgia, 'Times New Roman', serif", rounded: "system-ui, sans-serif", mono: "SFMono-Regular, Menlo, Monaco, Consolas, monospace" },
});

export const Spacing = { xs: 4, sm: 8, md: 12, lg: 16, xl: 24, xxl: 32 } as const;
export const Radius = { sm: 12, md: 16, lg: 20, xl: 24, xxl: 28, pill: 999 } as const;
export const Shadow = {
  card: { shadowColor: '#000', shadowOffset: { width: 0, height: 8 }, shadowOpacity: 0.24, shadowRadius: 24, elevation: 6 },
} as const;

export const Typography = {
  regular: 'Inter_400Regular',
  medium: 'Inter_500Medium',
  semibold: 'Inter_600SemiBold',
  bold: 'Inter_700Bold',
} as const;
