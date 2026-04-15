import { useEffect } from 'react';
import { applyThemeColors, removeThemeColors, ExtendedThemeColors } from '../lib/themeUtils';

interface ThemeColors extends ExtendedThemeColors {}

const DEFAULT_COLORS: ThemeColors = {
  primaryColor: '#FACC15',
  secondaryColor: '#111827',
  accentColor: '#F59E0B',
  pageBgColor: '#F9FAFB',
  servicesSectionBgColor: '#F3F4F6',
  contactSectionBgColor: '#111827',
  cardBgColor: '#FFFFFF',
  textHeadingColor: '#111827',
  textBodyColor: '#4B5563',
};

export function useThemeColors(colors?: ThemeColors | null): void {
  useEffect(() => {
    const themeColors = colors || DEFAULT_COLORS;

    applyThemeColors(
      themeColors.primaryColor,
      themeColors.secondaryColor,
      themeColors.accentColor,
      {
        pageBgColor: themeColors.pageBgColor,
        servicesSectionBgColor: themeColors.servicesSectionBgColor,
        contactSectionBgColor: themeColors.contactSectionBgColor,
        cardBgColor: themeColors.cardBgColor,
        textHeadingColor: themeColors.textHeadingColor,
        textBodyColor: themeColors.textBodyColor,
      }
    );

    return () => {
      removeThemeColors();
    };
  }, [colors]);
}
