import OpenAI from 'openai';
import type { Settings } from './types';

// 流式翻译回调：分片 / 完成 / 失败（design §4.3）
export interface StreamHandlers {
  onChunk: (text: string) => void;
  onDone: (fullText: string) => void;
  onError: (error: Error) => void;
}

// 基于 openai SDK 调用 OpenAI 兼容端点，流式返回译文分片
export async function translateStream(
  settings: Settings,
  markdown: string,
  handlers: StreamHandlers,
): Promise<void> {
  const client = new OpenAI({
    apiKey: settings.apiKey,
    baseURL: settings.baseURL,
    // Service Worker 会被 SDK 识别为浏览器环境；API Key 由用户本地提供，故显式放行
    dangerouslyAllowBrowser: true,
  });

  const messages: OpenAI.Chat.ChatCompletionMessageParam[] = [
    { role: 'system', content: settings.prompt },
    { role: 'user', content: markdown },
  ];

  try {
    const stream = await client.chat.completions.create({
      model: settings.model,
      messages,
      stream: true,
    });

    let fullText = '';
    for await (const chunk of stream) {
      const delta = chunk.choices[0]?.delta?.content ?? '';
      if (delta) {
        fullText += delta;
        handlers.onChunk(delta);
      }
    }
    handlers.onDone(fullText);
  } catch (error) {
    handlers.onError(error instanceof Error ? error : new Error(String(error)));
  }
}
