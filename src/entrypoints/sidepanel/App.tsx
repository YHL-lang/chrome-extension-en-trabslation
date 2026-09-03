import { useState } from 'react';
import TopBar from '@/components/TopBar';
import Footer from '@/components/Footer';
import SettingsPanel from '@/components/SettingsPanel';
import EmptyView from '@/components/views/EmptyView';
import LoadingView from '@/components/views/LoadingView';
import TranslatingView from '@/components/views/TranslatingView';
import ErrorView from '@/components/views/ErrorView';
import { STATE_LABELS } from '@/lib/types';
import type { AppState } from '@/lib/types';

const STATES: AppState[] = ['empty', 'loading', 'translating', 'success', 'error'];

export default function App() {
  const [state, setState] = useState<AppState>('empty');
  const [showSettings, setShowSettings] = useState(false);

  if (showSettings) {
    return (
      <div className="app">
        <SettingsPanel onBack={() => setShowSettings(false)} />
      </div>
    );
  }

  return (
    <div className="app">
      <TopBar onSettings={() => setShowSettings(true)} />
      <main className="app__body">
        {state === 'empty' && <EmptyView onStart={() => setState('loading')} />}
        {state === 'loading' && <LoadingView />}
        {state === 'translating' && <TranslatingView />}
        {state === 'success' && <p className="view__desc">成功态视图将在 T7 实现</p>}
        {state === 'error' && <ErrorView onRetry={() => setState('loading')} />}
      </main>
      {/* 开发调试：切换查看各状态视图，T8 联调后移除 */}
      <div className="debug-switch">
        {STATES.map((s) => (
          <button key={s} type="button" onClick={() => setState(s)} disabled={s === state}>
            {STATE_LABELS[s]}
          </button>
        ))}
      </div>
      <Footer state={state} />
    </div>
  );
}
