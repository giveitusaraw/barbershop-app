export function hexToRgb(hex: string): { r: number; g: number; b: number } | null {
  const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
  return result
    ? {
        r: parseInt(result[1], 16),
        g: parseInt(result[2], 16),
        b: parseInt(result[3], 16),
      }
    : null;
}

export function rgbToHex(r: number, g: number, b: number): string {
  return '#' + [r, g, b].map(x => {
    const hex = x.toString(16);
    return hex.length === 1 ? '0' + hex : hex;
  }).join('');
}

export function lightenColor(hex: string, percent: number): string {
  const rgb = hexToRgb(hex);
  if (!rgb) return hex;

  const { r, g, b } = rgb;
  const amount = Math.round(2.55 * percent);

  const newR = Math.min(255, r + amount);
  const newG = Math.min(255, g + amount);
  const newB = Math.min(255, b + amount);

  return rgbToHex(newR, newG, newB);
}

export function darkenColor(hex: string, percent: number): string {
  const rgb = hexToRgb(hex);
  if (!rgb) return hex;

  const { r, g, b } = rgb;
  const amount = Math.round(2.55 * percent);

  const newR = Math.max(0, r - amount);
  const newG = Math.max(0, g - amount);
  const newB = Math.max(0, b - amount);

  return rgbToHex(newR, newG, newB);
}

export function isValidHexColor(hex: string): boolean {
  return /^#[0-9A-F]{6}$/i.test(hex);
}

export function generateColorShades(baseColor: string) {
  return {
    base: baseColor,
    light: lightenColor(baseColor, 10),
    lighter: lightenColor(baseColor, 20),
    dark: darkenColor(baseColor, 10),
    darker: darkenColor(baseColor, 20),
    hover: darkenColor(baseColor, 5),
  };
}

export interface ExtendedThemeColors {
  primaryColor: string;
  secondaryColor: string;
  accentColor: string;
  pageBgColor?: string;
  servicesSectionBgColor?: string;
  contactSectionBgColor?: string;
  cardBgColor?: string;
  textHeadingColor?: string;
  textBodyColor?: string;
}

export function applyThemeColors(
  primaryColor: string,
  secondaryColor: string,
  accentColor: string,
  extended?: Partial<ExtendedThemeColors>
): void {
  const root = document.documentElement;

  const primary = generateColorShades(primaryColor);
  const secondary = generateColorShades(secondaryColor);
  const accent = generateColorShades(accentColor);

  root.style.setProperty('--color-primary', primary.base);
  root.style.setProperty('--color-primary-light', primary.light);
  root.style.setProperty('--color-primary-lighter', primary.lighter);
  root.style.setProperty('--color-primary-dark', primary.dark);
  root.style.setProperty('--color-primary-darker', primary.darker);
  root.style.setProperty('--color-primary-hover', primary.hover);

  root.style.setProperty('--color-secondary', secondary.base);
  root.style.setProperty('--color-secondary-light', secondary.light);
  root.style.setProperty('--color-secondary-lighter', secondary.lighter);
  root.style.setProperty('--color-secondary-dark', secondary.dark);
  root.style.setProperty('--color-secondary-darker', secondary.darker);
  root.style.setProperty('--color-secondary-hover', secondary.hover);

  root.style.setProperty('--color-accent', accent.base);
  root.style.setProperty('--color-accent-light', accent.light);
  root.style.setProperty('--color-accent-lighter', accent.lighter);
  root.style.setProperty('--color-accent-dark', accent.dark);
  root.style.setProperty('--color-accent-darker', accent.darker);
  root.style.setProperty('--color-accent-hover', accent.hover);

  root.style.setProperty('--color-page-bg', extended?.pageBgColor || '#F9FAFB');
  root.style.setProperty('--color-services-section-bg', extended?.servicesSectionBgColor || '#F3F4F6');
  root.style.setProperty('--color-contact-section-bg', extended?.contactSectionBgColor || '#111827');
  root.style.setProperty('--color-card-bg', extended?.cardBgColor || '#FFFFFF');
  root.style.setProperty('--color-text-heading', extended?.textHeadingColor || '#111827');
  root.style.setProperty('--color-text-body', extended?.textBodyColor || '#4B5563');
}

export function removeThemeColors(): void {
  const root = document.documentElement;

  const properties = [
    '--color-primary',
    '--color-primary-light',
    '--color-primary-lighter',
    '--color-primary-dark',
    '--color-primary-darker',
    '--color-primary-hover',
    '--color-secondary',
    '--color-secondary-light',
    '--color-secondary-lighter',
    '--color-secondary-dark',
    '--color-secondary-darker',
    '--color-secondary-hover',
    '--color-accent',
    '--color-accent-light',
    '--color-accent-lighter',
    '--color-accent-dark',
    '--color-accent-darker',
    '--color-accent-hover',
    '--color-page-bg',
    '--color-services-section-bg',
    '--color-contact-section-bg',
    '--color-card-bg',
    '--color-text-heading',
    '--color-text-body',
  ];

  properties.forEach(prop => root.style.removeProperty(prop));
}

export function getContrastColor(hexColor: string): 'light' | 'dark' {
  const rgb = hexToRgb(hexColor);
  if (!rgb) return 'dark';

  const { r, g, b } = rgb;
  const luminance = (0.299 * r + 0.587 * g + 0.114 * b) / 255;

  return luminance > 0.5 ? 'dark' : 'light';
}

export function ensureReadableContrast(
  textColor: string,
  backgroundColor: string
): string {
  const bgContrast = getContrastColor(backgroundColor);

  if (bgContrast === 'light') {
    return '#111827';
  } else {
    return '#FFFFFF';
  }
}
