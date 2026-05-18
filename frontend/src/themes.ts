export interface ThemeOption {
  key: string;
  i18nKey: string;
  isDark: boolean;
}

export const THEME_OPTIONS: ThemeOption[] = [
  { key: 'light',          i18nKey: 'settings.theme.light',          isDark: false },
  { key: 'solarized-light', i18nKey: 'settings.theme.solarizedLight', isDark: false },
  { key: 'dark',            i18nKey: 'settings.theme.dark',           isDark: true  },
  { key: 'solarized-dark',  i18nKey: 'settings.theme.solarizedDark',  isDark: true  },
  { key: 'dracula',        i18nKey: 'settings.theme.dracula',        isDark: true  },
  { key: 'nord',           i18nKey: 'settings.theme.nord',           isDark: true  },
  { key: 'one-dark',       i18nKey: 'settings.theme.oneDark',        isDark: true  },
  { key: 'monokai',        i18nKey: 'settings.theme.monokai',        isDark: true  },
];

export function getThemeOption(key: string): ThemeOption | undefined {
  return THEME_OPTIONS.find((t) => t.key === key);
}

export function isDarkTheme(key: string): boolean {
  return getThemeOption(key)?.isDark ?? key === 'dark';
}
