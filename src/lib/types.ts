// 侧边栏状态机：五种状态
export type AppState = 'empty' | 'loading' | 'translating' | 'success' | 'error';

// 状态对应的中文标签（供 TopBar / Footer 等展示）
export const STATE_LABELS: Record<AppState, string> = {
  empty: '初始态',
  loading: '提取中',
  translating: '翻译中',
  success: '成功态',
  error: '失败态',
};

// 提取出的文章结构化数据（design §3.4 数据契约）
export interface ArticleData {
  title: string;
  author: string;
  url: string;
  markdown: string;
}

// background 请求 content script 提取正文的消息
export interface ExtractRequestMessage {
  type: 'EXTRACT_ARTICLE';
}

// Side Panel → Background：发起流式翻译（经长连接 Port，design §4.3）
export interface TranslateStreamRequest {
  type: 'TRANSLATE_STREAM';
  markdown: string;
}

// Background → Side Panel：流式翻译分片
export interface TranslationChunkMessage {
  type: 'TRANSLATION_CHUNK';
  text: string;
}

// Background → Side Panel：翻译完成，text 为完整译文
export interface TranslationDoneMessage {
  type: 'TRANSLATION_DONE';
  text: string;
}

// Background → Side Panel：翻译失败
export interface TranslationErrorMessage {
  type: 'TRANSLATION_ERROR';
  error: string;
}

// 展示模式（design §4.2 / §5.2）
export type DisplayMode = 'translation' | 'bilingual' | 'original';

export const DISPLAY_MODE_LABELS: Record<DisplayMode, string> = {
  translation: '译文优先',
  bilingual: '中英对照',
  original: '仅原文',
};

// 设置项（design §4.2 可配置项）
export interface Settings {
  baseURL: string;
  model: string;
  apiKey: string;
  prompt: string;
  targetLanguage: string;
  displayMode: DisplayMode;
}

export const DEFAULT_SETTINGS: Settings = {
  baseURL: 'https://dashscope.aliyuncs.com/compatible-mode/v1',
  model: 'qwen-plus',
  apiKey: '',
  prompt:
    '请将以下 Markdown 文章正文翻译为中文，保留 Markdown 结构、标题层级与图片语法（![alt](src)）不被改写，只翻译正文内容。',
  targetLanguage: '中文',
  displayMode: 'translation',
};
