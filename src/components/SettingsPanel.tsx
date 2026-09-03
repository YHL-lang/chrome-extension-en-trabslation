import { useEffect, useState } from 'react';
import { DEFAULT_SETTINGS, DISPLAY_MODE_LABELS } from '@/lib/types';
import type { DisplayMode, Settings } from '@/lib/types';
import { loadSettings, saveSettings } from '@/lib/storage';

const MODEL_OPTIONS = ['qwen-plus', 'qwen-turbo', 'qwen-max', 'qwen-long'];
const LANGUAGE_OPTIONS = ['中文', '英文', '日文', '韩文'];

interface SettingsPanelProps {
  onBack: () => void;
}

export default function SettingsPanel({ onBack }: SettingsPanelProps) {
  const [settings, setSettings] = useState<Settings>(DEFAULT_SETTINGS);

  useEffect(() => {
    loadSettings().then(setSettings);
  }, []);

  const updateField = (patch: Partial<Settings>) => {
    setSettings((prev) => ({ ...prev, ...patch }));
  };

  const handleSave = async () => {
    await saveSettings(settings);
    onBack();
  };

  return (
    <div className="settings">
      <header className="topbar">
        <button type="button" className="topbar__back" onClick={onBack}>
          ← 设置
        </button>
      </header>
      <div className="settings__form">
        <label className="field">
          <span className="field__label">baseURL</span>
          <input
            type="text"
            value={settings.baseURL}
            onChange={(e) => updateField({ baseURL: e.target.value })}
          />
        </label>
        <label className="field">
          <span className="field__label">模型</span>
          <select value={settings.model} onChange={(e) => updateField({ model: e.target.value })}>
            {MODEL_OPTIONS.map((model) => (
              <option key={model} value={model}>
                {model}
              </option>
            ))}
          </select>
        </label>
        <label className="field">
          <span className="field__label">API Key</span>
          <input
            type="password"
            value={settings.apiKey}
            onChange={(e) => updateField({ apiKey: e.target.value })}
          />
        </label>
        <label className="field">
          <span className="field__label">提示词</span>
          <textarea
            value={settings.prompt}
            onChange={(e) => updateField({ prompt: e.target.value })}
          />
        </label>
        <label className="field">
          <span className="field__label">目标语言</span>
          <select
            value={settings.targetLanguage}
            onChange={(e) => updateField({ targetLanguage: e.target.value })}
          >
            {LANGUAGE_OPTIONS.map((lang) => (
              <option key={lang} value={lang}>
                {lang}
              </option>
            ))}
          </select>
        </label>
        <label className="field">
          <span className="field__label">默认展示</span>
          <select
            value={settings.displayMode}
            onChange={(e) => updateField({ displayMode: e.target.value as DisplayMode })}
          >
            {(Object.keys(DISPLAY_MODE_LABELS) as DisplayMode[]).map((mode) => (
              <option key={mode} value={mode}>
                {DISPLAY_MODE_LABELS[mode]}
              </option>
            ))}
          </select>
        </label>
      </div>
      <div className="settings__footer">
        <button type="button" className="btn btn--primary" onClick={handleSave}>
          保存设置
        </button>
      </div>
    </div>
  );
}
