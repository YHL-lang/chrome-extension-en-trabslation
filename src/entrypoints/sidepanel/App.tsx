import { useEffect, useRef, useState } from 'react';
import TopBar from '@/components/TopBar';
import Footer from '@/components/Footer';
import SettingsPanel from '@/components/SettingsPanel';
import EmptyView from '@/components/views/EmptyView';
import LoadingView from '@/components/views/LoadingView';
import TranslatingView from '@/components/views/TranslatingView';
import SuccessView from '@/components/views/SuccessView';
import ErrorView from '@/components/views/ErrorView';
import { loadSettings, loadTranslationResult } from '@/lib/storage';
import type { AppState, ArticleData, DisplayMode, TranslationResult } from '@/lib/types';

export default function App() {
  const [state, setState] = useState<AppState>('empty');
  const [showSettings, setShowSettings] = useState(false);
  const [result, setResult] = useState<TranslationResult | null>(null);
  const [errorMessage, setErrorMessage] = useState('未识别到正文');
  const [article, setArticle] = useState<ArticleData | null>(null);
  const [preview, setPreview] = useState('');
  const [displayMode, setDisplayMode] = useState<DisplayMode>('translation');
  const portRef = useRef<chrome.runtime.Port | null>(null);

  // 恢复默认展示模式与最近一次翻译结果（design §9）
  useEffect(() => {
    void loadSettings().then((settings) => setDisplayMode(settings.displayMode));
    void loadTranslationResult().then((saved) => {
      if (saved) {
        setResult(saved);
        setState('success');
      }
    });
  }, []);

  useEffect(() => {
    return () => portRef.current?.disconnect();
  }, []);

  const startTranslation = (target: ArticleData) => {
    const port = chrome.runtime.connect({ name: 'translation' });
    portRef.current = port;

    port.onMessage.addListener((message) => {
      if (message.type === 'TRANSLATION_CHUNK') {
        setPreview((prev) => prev + message.text);
      } else if (message.type === 'TRANSLATION_DONE') {
        setResult({
          title: target.title,
          author: target.author,
          url: target.url,
          original: target.markdown,
          translation: message.text,
        });
        setState('success');
        port.disconnect();
        portRef.current = null;
      } else if (message.type === 'TRANSLATION_ERROR') {
        setErrorMessage(message.error || '翻译失败');
        setState('error');
        port.disconnect();
        portRef.current = null;
      }
    });

    port.postMessage({ type: 'TRANSLATE_STREAM', markdown: target.markdown });
  };

  const handleTranslate = async () => {
    setState('loading');
    setErrorMessage('未识别到正文');
    setResult(null);
    setArticle(null);
    setPreview('');

    const extracted = (await chrome.runtime.sendMessage({
      type: 'EXTRACT_ARTICLE',
    })) as ArticleData | null;

    if (!extracted?.markdown) {
      setErrorMessage('未识别到正文');
      setState('error');
      return;
    }

    setArticle(extracted);
    setState('translating');
    startTranslation(extracted);
  };

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
        {state === 'empty' && <EmptyView onStart={handleTranslate} />}
        {state === 'loading' && <LoadingView />}
        {state === 'translating' && <TranslatingView title={article?.title} preview={preview} />}
        {state === 'success' && result && (
          <SuccessView result={result} initialMode={displayMode} />
        )}
        {state === 'error' && <ErrorView message={errorMessage} onRetry={handleTranslate} />}
      </main>
      <Footer state={state} />
    </div>
  );
}
