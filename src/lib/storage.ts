import { DEFAULT_SETTINGS } from './types';
import type { Settings } from './types';

const SETTINGS_KEY = 'settings';

export async function loadSettings(): Promise<Settings> {
  const data = await chrome.storage.local.get(SETTINGS_KEY);
  const stored = data[SETTINGS_KEY] as Partial<Settings> | undefined;
  return { ...DEFAULT_SETTINGS, ...stored };
}

export async function saveSettings(settings: Settings): Promise<void> {
  await chrome.storage.local.set({ [SETTINGS_KEY]: settings });
}
