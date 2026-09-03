import { useState } from 'react';
import TopBar from '@/components/TopBar';
import Footer from '@/components/Footer';
import SettingsPanel from '@/components/SettingsPanel';
import EmptyView from '@/components/views/EmptyView';
import LoadingView from '@/components/views/LoadingView';
import TranslatingView from '@/components/views/TranslatingView';
import SuccessView from '@/components/views/SuccessView';
import ErrorView from '@/components/views/ErrorView';
import { STATE_LABELS } from '@/lib/types';
import type { AppState, TranslationResult } from '@/lib/types';

const STATES: AppState[] = ['empty', 'loading', 'translating', 'success', 'error'];

// 临时示例结果，用于预览成功态；T8 联调后替换为真实翻译结果
const SAMPLE_RESULT: TranslationResult = {
  title: '示例文章标题',
  author: '作者名',
  url: 'https://example.com/article',
  original: '## Section\n\nHello world, this is the original text.',
  translation: '## 章节\n\n你好，世界，这是译文内容。',
};

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
        {state === 'success' && <SuccessView result={SAMPLE_RESULT} />}
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
