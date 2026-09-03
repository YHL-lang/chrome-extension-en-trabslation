import { DEFAULT_SETTINGS } from './types';
import type { Settings, TranslationResult } from './types';

const SETTINGS_KEY = 'settings';
const LAST_RESULT_KEY = 'lastResult';

export async function loadSettings(): Promise<Settings> {
  const data = await chrome.storage.local.get(SETTINGS_KEY);
  const stored = data[SETTINGS_KEY] as Partial<Settings> | undefined;
  return { ...DEFAULT_SETTINGS, ...stored };
}

export async function saveSettings(settings: Settings): Promise<void> {
  await chrome.storage.local.set({ [SETTINGS_KEY]: settings });
}

export async function saveTranslationResult(result: TranslationResult): Promise<void> {
  await chrome.storage.local.set({ [LAST_RESULT_KEY]: result });
}

export async function loadTranslationResult(): Promise<TranslationResult | null> {
  const data = await chrome.storage.local.get(LAST_RESULT_KEY);
  return (data[LAST_RESULT_KEY] as TranslationResult | undefined) ?? null;
}
