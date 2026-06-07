export type ColorScheme = { bg: string; border: string; text: string; light: string };

export const READER_COLORS: Record<string, ColorScheme> = {
  forest:  { bg: '#bbf7d0', border: '#15803d', text: '#14532d', light: '#f0fdf4' },
  violet:  { bg: '#ede9fe', border: '#7c3aed', text: '#3730a3', light: '#f5f3ff' },
  sunshine: { bg: '#fefce8', border: '#eab308', text: '#713f12', light: '#fefce8' },
  rose:    { bg: '#fee2e2', border: '#ef4444', text: '#991b1b', light: '#fef2f2' },
  sky:     { bg: '#e0f2fe', border: '#0ea5e9', text: '#0c4a6e', light: '#f0f9ff' },
  navy:    { bg: '#dbeafe', border: '#1d4ed8', text: '#1e3a8a', light: '#eff6ff' },
  lime:    { bg: '#ecfccb', border: '#84cc16', text: '#3f6212', light: '#f7fee7' },
  orange:  { bg: '#fed7aa', border: '#f97316', text: '#7c2d12', light: '#fff7ed' },
  pink:    { bg: '#fdf2f8', border: '#f9a8d4', text: '#9d174d', light: '#fdf2f8' },
};

export const COLOR_NAMES = Object.keys(READER_COLORS);

export function getColor(name: string): ColorScheme {
  return READER_COLORS[name] ?? READER_COLORS.forest;
}
