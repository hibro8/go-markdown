import { useCallback, useState } from 'react';
import { Window } from '@wailsio/runtime';
import { SettingOutlined } from '@ant-design/icons';
import { useSettingsStore } from '../../stores/settingsStore';
import { useI18n } from '../../i18n';

export default function TitleBar() {
  const { t } = useI18n();
  const [isMaximised, setIsMaximised] = useState(false);
  const toggleSettingsPanel = useSettingsStore((s) => s.toggleSettingsPanel);

  const handleMinimize = useCallback(() => {
    Window.Minimise().catch(() => {});
  }, []);

  const handleMaximize = useCallback(() => {
    Window.ToggleMaximise().catch(() => {});
    setIsMaximised((v) => !v);
  }, []);

  const handleClose = useCallback(() => {
    Window.Close().catch(() => {});
  }, []);

  return (
    <div className="titlebar">
      <img src="/logo.svg" alt="logo" className="titlebar-logo" />
      <span className="titlebar-title">{t('app.title')} v0.1.0</span>
      <div className="titlebar-spacer" />
      <button className="titlebar-btn" onClick={toggleSettingsPanel} title={t('sidebar.settings')}>
        <SettingOutlined style={{ fontSize: 13 }} />
      </button>
      <button className="titlebar-btn" onClick={handleMinimize} title="Minimize">
        &#x2013;
      </button>
      <button className="titlebar-btn" onClick={handleMaximize} title="Maximize">
        {isMaximised ? '⧉' : '□'}
      </button>
      <button className="titlebar-btn close" onClick={handleClose} title="Close">
        &#x2715;
      </button>
    </div>
  );
}
