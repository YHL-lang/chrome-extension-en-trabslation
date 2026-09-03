# 开发任务拆分（tasks）

> 依据 `docs/proposal.md`、`docs/design.md` 与 `docs/layouts/` 规划。任务按优先级与依赖排序，每个任务独立可完成、完成后可见效果，供 AI 分步骤实现。

## 1. 任务总览

| 任务 | 名称 | 优先级 | 依赖 | 完成后效果 | 对应需求 | 参考示意图 |
| --- | --- | --- | --- | --- | --- | --- |
| T1 | 工程初始化与脚手架 | P0 | — | 扩展可 `dev`/`build` 并可加载 | — | design §1/§6/§7 |
| T2 | 侧边栏外壳：状态机 + 共享组件 | P0 | T1 | 打开面板可见顶栏/底栏与状态框架 | F1/F5 | 00-页面总览 |
| T3 | 状态视图（初始/提取/翻译/失败） | P0 | T2 | 面板内可查看并切换四种状态页面 | F5 | 01/02/03/05 |
| T4 | 正文提取（content script） | P0 | T1 | 能提取当前页正文为 Markdown | F2 | design §3 |
| T5 | 设置面板与本地存储 | P1 | T1 | 可保存/读取模型配置 | F6 | 06-设置面板 |
| T6 | AI 翻译适配器（流式） | P0 | T1 | 可调用 Qwen 流式返回译文 | F3 | design §4 |
| T7 | 成功态渲染（md-wx + 展示模式 + 下载） | P0 | T2/T4/T6 | 完整展示译文并可复制/下载 | F4/F7 | 04-成功态 |
| T8 | 端到端联调与打包 | P0 | T3~T7 | 一键翻译全流程可用 | F1~F7 | 00-页面总览 |

## 2. 任务详情

### T1 工程初始化与脚手架

- **目标**：搭建可运行的 WXT + React + TypeScript 工程，并安装全部依赖。
- **涉及文件**：`wxt.config.ts`、`tsconfig.json`、`eslint.config.js`、`.prettierrc`、`package.json`、`src/entrypoints/background/index.ts`、`src/entrypoints/sidepanel/index.html`。
- **参考示意图**：`design.md` §1（技术选型）、§6（目录结构）、§7（编码规范）。
- **实现要点**
  1. 初始化 WXT 项目，配置 React 接入。
  2. 安装依赖：`md-wx`、`openai`、`@mozilla/readability`、`turndown`。
  3. 配置 Manifest 权限：`sidePanel`、`storage`、`scripting`、`activeTab`。
  4. 接入 ESLint（typescript-eslint）与 Prettier。
- **完成标准**：`npm run dev` / `npm run build` 通过；扩展可在 `chrome://extensions` 加载；Action 点击可弹出空侧边栏。
- **依赖**：无。

### T2 侧边栏外壳：状态机 + 共享组件

- **目标**：实现 Side Panel 的状态机骨架与共享组件 TopBar / Footer。
- **涉及文件**：`src/entrypoints/sidepanel/main.tsx`、`App.tsx`、`style.css`、`components/TopBar.tsx`、`components/Footer.tsx`、`lib/types.ts`。
- **参考示意图**：`00-页面总览.md`（共享模块 TopBar / Footer）、`design.md` §8（状态机）。
- **实现要点**
  1. 定义五态状态机：`empty / loading / translating / success / error`。
  2. 实现 TopBar：左标题「网页文章翻译」，右 ⚙ 设置入口（先占位）。
  3. 实现 Footer：显示版本号与当前状态。
  4. 用占位内容渲染各状态，保证状态可切换。
- **完成标准**：打开面板可见 TopBar / Footer；状态切换逻辑可运行。
- **依赖**：T1。

### T3 状态视图（初始 / 提取 / 翻译 / 失败）

- **目标**：实现四种状态视图的静态页面，并接入状态机。
- **涉及文件**：`components/views/EmptyView.tsx`、`LoadingView.tsx`、`TranslatingView.tsx`、`ErrorView.tsx`。
- **参考示意图**：`01-侧边栏-初始态.md`、`02-侧边栏-提取中.md`、`03-侧边栏-翻译中.md`、`05-侧边栏-失败态.md`。
- **实现要点**
  1. EmptyView：说明文案 + 主按钮「一键翻译本页」。
  2. LoadingView：加载指示 + 「正在提取文章正文…」。
  3. TranslatingView：加载指示 + 「正在调用 AI 模型…」 + 流式预览占位区。
  4. ErrorView：错误图标 + 原因 + 「重试」按钮。
  5. 绑定「一键翻译本页」→ `loading`、「重试」→ `loading` 的状态流转。
- **完成标准**：四种页面样式符合示意图；按钮能触发状态切换。
- **依赖**：T2。

### T4 正文提取（content script）

- **目标**：在页面上下文用 Readability + turndown 提取正文并转 Markdown。
- **涉及文件**：`src/entrypoints/content/index.ts`、`lib/extractor.ts`、`lib/types.ts`。
- **参考示意图**：`design.md` §3（内容提取关键要点与数据契约）。
- **实现要点**
  1. content script 中克隆 DOM 后执行 Readability 解析。
  2. 取 `parse().content`（HTML）交给 turndown，保留图片 `![alt][src]`。
  3. 提取元数据：标题（`parse().title`）、作者（`parse().byline`）、链接（`location.href`）。
  4. 输出结构化 `ArticleData`：`title / author / url / markdown`。
- **完成标准**：在常见英文文章页可提取出含标题/作者/链接/图片的 Markdown（可用临时 console 验证）。
- **依赖**：T1。

### T5 设置面板与本地存储

- **目标**：实现设置面板与 `chrome.storage.local` 读写封装。
- **涉及文件**：`components/SettingsPanel.tsx`、`lib/storage.ts`、`lib/types.ts`。
- **参考示意图**：`06-设置面板.md`。
- **实现要点**
  1. 实现配置表单：baseURL、模型、API Key、提示词、目标语言、默认展示。
  2. `storage.ts` 封装 `chrome.storage.local` 读写。
  3. 实现「保存设置」写入存储；TopBar ⚙ 点击进入设置页。
- **完成标准**：设置可保存并在重开面板后恢复。
- **依赖**：T1。

### T6 AI 翻译适配器（流式）

- **目标**：基于 `openai` SDK 实现 Qwen 流式翻译，并由 background 转发到 Side Panel。
- **涉及文件**：`lib/translator.ts`、`src/entrypoints/background/index.ts`。
- **参考示意图**：`design.md` §4（AI 翻译）。
- **实现要点**
  1. `translator.ts` 用 `openai` SDK，通过可配置 `baseURL` 指向 Qwen，`stream: true`。
  2. background 承载 AI 请求，经长连接 `Port` 将分片转发给 Side Panel。
  3. 提示词约束：保留 Markdown 结构与图片语法，只翻译正文。
- **完成标准**：能调用模型流式返回译文分片（可临时在侧边栏打印）。
- **依赖**：T1。

### T7 成功态渲染（md-wx + 展示模式 + 下载）

- **目标**：用 `md-wx` 渲染翻译结果，支持三种展示模式与复制 / 下载。
- **涉及文件**：`components/views/SuccessView.tsx`。
- **参考示意图**：`04-侧边栏-成功态.md`。
- **实现要点**
  1. 接入 `MarkdownRenderer` 渲染译文正文。
  2. 展示模式切换：译文优先（单渲染）/ 中英对照（左右两个渲染）/ 仅原文（单渲染）。
  3. 元数据头部：标题 / 作者 / 原文链接。
  4. 底部操作：「复制」与「下载 Markdown」（导出 `.md` 文件）。
  5. 结果写入 `chrome.storage.local`，重开面板恢复。
- **完成标准**：成功态可展示译文、切换展示模式、复制与下载 Markdown。
- **依赖**：T2、T4、T6。

### T8 端到端联调与打包

- **目标**：串起完整流程，处理异常态与最近结果持久化，验证构建。
- **涉及文件**：跨 `src/` 各层。
- **参考示意图**：`00-页面总览.md`（实现步骤总规划）、`design.md` §9（数据流）。
- **实现要点**
  1. 串起「提取 → 翻译 → 渲染」完整链路与状态流转。
  2. 补齐异常处理：无正文 / 翻译超时 → `error` 态。
  3. 持久化最近一次翻译结果，下次打开恢复展示。
  4. 验证 `build` 产物可加载、全流程可用。
- **完成标准**：点击「一键翻译本页」→ 提取 → 流式翻译 → 成功渲染 → 可下载，异常态可重试。
- **依赖**：T3~T7。

## 3. 依赖关系

```
T1 ──► T2 ──► T3 ──────────────┐
  │                             │
  ├──► T4 ──────────────────────┤
  │                             ├──► T8
  ├──► T5 ──────────────────────┤
  │                             │
  └──► T6 ──────────────────────┤
                                │
              T7（依赖 T2/T4/T6）─┘
```

说明：

- T4 / T5 / T6 仅依赖 T1，可在 T2 / T3 完成后并行实现。
- T7 依赖 T2（外壳）、T4（原文）、T6（译文）三者的产出。
- T8 为最终集成与验证。
