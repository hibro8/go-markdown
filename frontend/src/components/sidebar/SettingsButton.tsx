import { SettingOutlined } from '@ant-design/icons';
import { useSettingsStore } from '../../stores/settingsStore';
import { useI18n } from '../../i18n';

export default function SettingsButton() {
  const { t } = useI18n();
  const toggleSettingsPanel = useSettingsStore((s) => s.toggleSettingsPanel);

  return (
    <div
      style={{
        marginTop: 'auto',
        padding: '10px 16px',
        borderTop: '1px solid var(--md-border)',
        display: 'flex',
        alignItems: 'center',
        cursor: 'pointer',
        color: 'var(--md-text)',
      }}
      onClick={toggleSettingsPanel}
    >
      <SettingOutlined style={{ fontSize: 18, marginRight: 8 }} />
      <span style={{ fontSize: 13 }}>{t('sidebar.settings')}</span>
    </div>
  );
}
