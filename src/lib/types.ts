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
