import { useEffect } from 'react';
import { ConfigProvider, theme, App as AntApp } from 'antd';
import AppLayout from './components/layout/AppLayout';
import { useSettingsStore } from './stores/settingsStore';
import { useI18n } from './i18n';
import { usePersistence } from './hooks/usePersistence';

export default function App() {
  const appTheme = useSettingsStore((s) => s.theme);
  const language = useSettingsStore((s) => s.language);
  const setLocale = useI18n((s) => s.setLocale);

  usePersistence();

  useEffect(() => {
    document.documentElement.setAttribute('data-theme', appTheme);
  }, [appTheme]);

  useEffect(() => {
    setLocale(language === 'zh' ? 'zh' : 'en');
  }, [language, setLocale]);

  return (
    <ConfigProvider
      theme={{
        algorithm:
          appTheme === 'dark' ? theme.darkAlgorithm : theme.defaultAlgorithm,
      }}
    >
      <AntApp>
        <AppLayout />
      </AntApp>
    </ConfigProvider>
  );
}
