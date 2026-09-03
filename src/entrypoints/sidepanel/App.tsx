import { useState } from 'react';
import TopBar from '@/components/TopBar';
import Footer from '@/components/Footer';
import { STATE_LABELS } from '@/lib/types';
import type { AppState } from '@/lib/types';

const STATES: AppState[] = ['empty', 'loading', 'translating', 'success', 'error'];

export default function App() {
  const [state, setState] = useState<AppState>('empty');

  return (
    <div className="app">
      <TopBar />
      <main className="app__body">
        <p className="app__state-label">{STATE_LABELS[state]}</p>
        {/* 临时占位：用于验证状态切换，T3 接入真实状态视图后移除 */}
        <div className="app__switch">
          {STATES.map((s) => (
            <button
              key={s}
              type="button"
              onClick={() => setState(s)}
              disabled={s === state}
            >
              {STATE_LABELS[s]}
            </button>
          ))}
        </div>
      </main>
      <Footer state={state} />
    </div>
  );
}
