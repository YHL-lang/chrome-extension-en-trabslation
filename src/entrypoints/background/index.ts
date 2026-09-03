import { translateStream } from '@/lib/translator';
import { loadSettings } from '@/lib/storage';
import type { ArticleData, ExtractRequestMessage, TranslateStreamRequest } from '@/lib/types';

// 查询当前活动标签页，调度 content script 提取正文（design §2 调度层）
async function extractActiveArticle(): Promise<ArticleData | null> {
  const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
  if (!tab?.id) return null;
  try {
    const result = await chrome.tabs.sendMessage(tab.id, { type: 'EXTRACT_ARTICLE' });
    return (result as ArticleData | null) ?? null;
  } catch {
    return null;
  }
}

export default defineBackground(() => {
  chrome.sidePanel.setPanelBehavior({ openPanelOnActionClick: true });

  // Side Panel 请求提取正文 → 调度 content script 执行
  chrome.runtime.onMessage.addListener((message, _sender, sendResponse) => {
    if ((message as ExtractRequestMessage).type === 'EXTRACT_ARTICLE') {
      void extractActiveArticle().then((result) => sendResponse(result));
      return true; // 异步响应
    }
  });

  // Side Panel 经长连接 Port 发起流式翻译，background 承载 AI 请求并转发分片（design §4.3）
  chrome.runtime.onConnect.addListener((port) => {
    if (port.name !== 'translation') return;

    port.onMessage.addListener((message: TranslateStreamRequest) => {
      if (message.type !== 'TRANSLATE_STREAM') return;

      void loadSettings().then((settings) =>
        translateStream(settings, message.markdown, {
          onChunk: (text) => port.postMessage({ type: 'TRANSLATION_CHUNK', text }),
          onDone: (text) => port.postMessage({ type: 'TRANSLATION_DONE', text }),
          onError: (error) =>
            port.postMessage({ type: 'TRANSLATION_ERROR', error: error.message }),
        }),
      );
    });
  });
});
