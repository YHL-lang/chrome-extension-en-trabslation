import { translateStream } from '@/lib/translator';
import { loadSettings } from '@/lib/storage';
import type { TranslateStreamRequest } from '@/lib/types';

export default defineBackground(() => {
  chrome.sidePanel.setPanelBehavior({ openPanelOnActionClick: true });

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
