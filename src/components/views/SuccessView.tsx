import { useEffect, useState } from 'react';
import { MarkdownRenderer } from 'md-wx';
import 'md-wx/dist/style.css';
import { DISPLAY_MODE_LABELS } from '@/lib/types';
import type { DisplayMode, TranslationResult } from '@/lib/types';
import { saveTranslationResult } from '@/lib/storage';

interface SuccessViewProps {
  result: TranslationResult;
  initialMode?: DisplayMode;
  onRestart: () => void;
}

const MODES: DisplayMode[] = ['translation', 'bilingual', 'original'];

// 按展示模式返回当前应渲染 / 复制 / 导出的正文（design §5.2）
function contentForMode(result: TranslationResult, mode: DisplayMode): string {
  if (mode === 'translation') return result.translation;
  if (mode === 'original') return result.original;
  return `## 原文\n\n${result.original}\n\n## 译文\n\n${result.translation}`;
}

// 导出时附加元数据头部
function buildExportMarkdown(result: TranslationResult, mode: DisplayMode): string {
  const author = result.author || '未知';
  const header = `# ${result.title}\n\n> 作者：${author}\n> 原文链接：${result.url}\n\n---\n\n`;
  return header + contentForMode(result, mode);
}

function downloadMarkdown(filename: string, content: string): void {
  const blob = new Blob([content], { type: 'text/markdown;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}

export default function SuccessView({ result, initialMode = 'translation', onRestart }: SuccessViewProps) {
  const [mode, setMode] = useState<DisplayMode>(initialMode);

  useEffect(() => {
    void saveTranslationResult(result);
  }, [result]);

  const handleCopy = async () => {
    await navigator.clipboard.writeText(contentForMode(result, mode));
  };

  const handleDownload = () => {
    downloadMarkdown(`${result.title || '译文'}.md`, buildExportMarkdown(result, mode));
  };

  return (
    <div className="view view--success">
      <header className="success__meta">
        <h1 className="success__title">{result.title}</h1>
        {result.author && <p className="success__meta-item">作者：{result.author}</p>}
        <a className="success__meta-item" href={result.url} target="_blank" rel="noreferrer">
          {result.url}
        </a>
      </header>

      <div className="success__modes">
        {MODES.map((m) => (
          <button
            key={m}
            type="button"
            className={m === mode ? 'success__mode success__mode--active' : 'success__mode'}
            onClick={() => setMode(m)}
          >
            {DISPLAY_MODE_LABELS[m]}
          </button>
        ))}
      </div>

      <div className="success__body">
        {mode === 'bilingual' ? (
          <div className="success__columns">
            <MarkdownRenderer markdown={result.original} showSettings={false} enableCopy={false} />
            <MarkdownRenderer markdown={result.translation} showSettings={false} enableCopy={false} />
          </div>
        ) : (
          <MarkdownRenderer
            markdown={mode === 'original' ? result.original : result.translation}
            showSettings={false}
            enableCopy={false}
          />
        )}
      </div>

      <footer className="success__actions">
        <button type="button" className="btn btn--secondary" onClick={handleCopy}>
          复制
        </button>
        <button type="button" className="btn btn--primary" onClick={handleDownload}>
          下载 Markdown
        </button>
        <button type="button" className="btn btn--ghost" onClick={onRestart}>
          重新翻译本页
        </button>
      </footer>
    </div>
  );
}
