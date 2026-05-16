import { Drawer, Switch, Typography, Divider, Segmented, Button, App } from 'antd';
import { BulbOutlined, DeleteOutlined } from '@ant-design/icons';
import { useSettingsStore } from '../../stores/settingsStore';
import { useI18n } from '../../i18n';
import { SettingsService } from '../../services/api';
import { clearAllCache } from '../../hooks/usePersistence';

const { Text } = Typography;

export default function SettingsDrawer() {
  const { t, setLocale } = useI18n();
  const { modal, message } = App.useApp();
  const settingsOpen = useSettingsStore((s) => s.settingsOpen);
  const toggleSettingsPanel = useSettingsStore((s) => s.toggleSettingsPanel);
  const theme = useSettingsStore((s) => s.theme);
  const setTheme = useSettingsStore((s) => s.setTheme);
  const language = useSettingsStore((s) => s.language);
  const setLanguage = useSettingsStore((s) => s.setLanguage);
  const trayEnabled = useSettingsStore((s) => s.trayEnabled);
  const setTrayEnabled = useSettingsStore((s) => s.setTrayEnabled);
  const autoStart = useSettingsStore((s) => s.autoStart);
  const setAutoStart = useSettingsStore((s) => s.setAutoStart);

  const handleThemeChange = async (checked: boolean) => {
    const newTheme = checked ? 'dark' : 'light';
    setTheme(newTheme);
    try { await SettingsService.UpdateTheme(newTheme); message.success(t('settings.saved')); } catch { /* */ }
  };

  const handleTrayChange = async (checked: boolean) => {
    setTrayEnabled(checked);
    try { await SettingsService.UpdateTrayEnabled(checked); message.success(t('settings.saved')); } catch { /* */ }
  };

  const handleAutoStartChange = async (checked: boolean) => {
    setAutoStart(checked);
    try { await SettingsService.UpdateAutoStart(checked); message.success(t('settings.saved')); } catch { /* */ }
  };

  const handleLanguageChange = async (val: string) => {
    const lang = val as 'en' | 'zh';
    setLanguage(lang);
    setLocale(lang);
    try { await SettingsService.UpdateLanguage(lang); message.success(t('settings.saved')); } catch { /* */ }
  };

  return (
    <Drawer
      title={t('settings.title')}
      open={settingsOpen}
      onClose={toggleSettingsPanel}
      placement="right"
      width={320}
    >
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 24 }}>
        <div>
          <BulbOutlined style={{ marginRight: 8 }} />
          <Text>{t('settings.darkMode')}</Text>
        </div>
        <Switch checked={theme === 'dark'} onChange={handleThemeChange} />
      </div>

      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 24 }}>
        <Text>{t('settings.language')}</Text>
        <Segmented
          size="small"
          value={language}
          onChange={handleLanguageChange}
          options={[
            { label: t('settings.language.zh'), value: 'zh' },
            { label: t('settings.language.en'), value: 'en' },
          ]}
        />
      </div>

      <Divider />

      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 24 }}>
        <Text>{t('settings.tray')}</Text>
        <Switch checked={trayEnabled} onChange={handleTrayChange} />
      </div>

      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 24 }}>
        <div>
          <Text>{t('settings.autoStart')}</Text>
          <br />
          <Text type="secondary" style={{ fontSize: 12 }}>
            {t('settings.autoStart.desc')}
          </Text>
        </div>
        <Switch checked={autoStart} onChange={handleAutoStartChange} />
      </div>

      <Divider />

      <div style={{ marginBottom: 24 }}>
        <Button
          danger
          icon={<DeleteOutlined />}
          block
          onClick={() => {
            modal.confirm({
              title: t('settings.clearCache'),
              content: t('settings.clearCache.confirm'),
              okText: t('settings.clearCache'),
              okType: 'danger',
              cancelText: 'Cancel',
              onOk: async () => {
                await clearAllCache();
              },
            });
          }}
        >
          {t('settings.clearCache')}
        </Button>
        <Text type="secondary" style={{ fontSize: 12, display: 'block', marginTop: 8 }}>
          {t('settings.clearCache.desc')}
        </Text>
      </div>

      <Text type="secondary" style={{ fontSize: 12 }}>
        {t('settings.version')}
      </Text>
    </Drawer>
  );
}
