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
