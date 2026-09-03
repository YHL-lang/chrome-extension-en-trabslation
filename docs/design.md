# 网页文章翻译（Chrome 扩展）技术架构设计

> 版本：v1.0 ｜ 与 `proposal.md` 配套 ｜ 本文档仅描述技术架构与规范，不包含代码实现。

## 1. 技术选型总览

| 类别 | 选型 | 说明 |
| --- | --- | --- |
| 扩展框架 | WXT（Vite 驱动） | 现代 Web Extension 框架，统一管理 Manifest V3、各入口与构建 |
| UI 框架 | React + TypeScript | 与 `md-wx` 组件库无缝集成 |
| 清单版本 | Manifest V3 | 目标浏览器 Chrome |
| 内容提取 | `@mozilla/readability` + `turndown` | 正文抽取 + HTML 转 Markdown（详见 §3） |
| AI 翻译 | `openai`（OpenAI SDK） | 走 OpenAI 兼容协议，可切换模型；默认接入 Qwen（详见 §4） |
| Markdown 渲染 | `md-wx` | npm 包，`MarkdownRenderer` 组件呈现翻译结果（详见 §5） |
| 存储 | `chrome.storage.local` | 保存设置与最近一次翻译结果 |
| 工程规范 | ESLint + Prettier | 详见 §7 编码规范 |
| 包管理 | npm | |

## 2. 总体架构

```
┌─────────────────────────── 浏览器侧 ───────────────────────────┐
│  Action 图标点击                                            │
│     │ openSidePanel                                       │
│     ▼                                                      │
│  Side Panel（React 应用，UI 层）                            │
│  ┌────────────────────────────────────────────┐           │
│  │ App（状态机）                                │           │
│  │  EmptyView / LoadingView / TranslatingView  │           │
│  │  SuccessView（md-wx 渲染 + 展示模式）         │           │
│  │  ErrorView                                  │           │
│  └──────────────┬─────────────────────────────┘           │
│                 │ runtime.sendMessage / connect(Port)      │
│  ┌──────────────▼─────────────────────────────┐           │
│  │ Background Service Worker（调度层）          │           │
│  │  消息路由 · 正文提取调度 · 翻译流式调度        │           │
│  └──────┬──────────────────────┬───────────────┘           │
│         │ executeScript        │ fetch（OpenAI 兼容）        │
│  ┌──────▼───────────────┐  ┌───▼───────────────────────┐  │
│  │ Content Script        │  │ AI 模型适配器（openai SDK） │  │
│  │ Readability + turndown│  │ 默认 baseURL → Qwen        │  │
│  └──────────────────────┘  └────────────────────────────┘  │
│                 chrome.storage.local（存储层）               │
└──────────────────────────────────────────────────────────────┘
```

分层职责：

1. **UI 层（Side Panel）**：状态机渲染；接收用户指令与流式译文，用 `md-wx` 呈现结果，并按「展示模式」切换。
2. **调度层（Background Service Worker）**：统一消息路由，调度「提取正文」与「翻译」；承载 AI 网络请求与流式转发。
3. **提取层（Content Script）**：在页面上下文用 Readability 抽取正文，经 turndown 转 Markdown 后返回结构化数据。
4. **翻译层（AI 适配器）**：基于 `openai` SDK，通过 `baseURL` 指向 Qwen 兼容端点，输出结构化双语结果，支持流式。
5. **存储层**：`chrome.storage.local` 保存设置（模型 / Key / 提示词 / 目标语言 / 展示模式）与最近一次翻译结果。

关键设计约束：

- **跨域**：AI 请求统一由 background 发起，避免 content script / side panel 直接 `fetch` 受 CORS 与 MV3 限制。
- **流式**：翻译采用 OpenAI 流式接口（`stream: true`），background 通过长连接 `Port` 将分片转发给 Side Panel，实现打字机效果。

## 3. 核心方案一：内容提取（关键与难点）

### 3.1 方案调研

| 方案 | 定位 | 结论 |
| --- | --- | --- |
| `@mozilla/readability` | Firefox 阅读模式同款正文抽取引擎，按启发式评分定位正文容器 | **选用**：成熟、广泛验证、输出干净 |
| `turndown` | 将 HTML 转换为 Markdown | **选用**：承接 Readability 输出，保留图片语法 |
| Defuddle | 通用抽取 + 站点级元数据解析 | 备选，站点覆盖更细但更重 |
| `@postlight/parser` | 老牌正文抽取 | 已停止维护，不采用 |
| 直接 `document.body.innerHTML` 喂模型 | 全量 HTML | 不采用：噪音大、token 浪费、易超上下文 |

### 3.2 选定方案

- **正文抽取**：`@mozilla/readability`
- **HTML → Markdown**：`turndown`

### 3.3 关键要点

1. **先克隆再解析**：Readability 会修改传入的 DOM，必须在 `document.cloneNode(true)` 的副本上执行，避免污染原页面。
2. **保留图片**：Readability 的 `parse()` 返回 `content`（HTML）而非 `textContent`，需取 `content` 交给 turndown，`<img>` 才不会被丢弃。
3. **图片格式**：由 turndown 将 `<img>` 映射为 Markdown 图片语法 `![alt][src]`（与需求约定一致）。
4. **元数据提取**：标题取自 `parse().title`（回退 `document.title`），作者取自 `parse().byline`，原文链接取 `location.href`。
5. **能力边界**：Readability 抓取的是当前 DOM 快照，对懒加载内容、SPA 动态渲染、需登录页面的覆盖率有限；本期面向静态/已渲染的资讯文章，无正文时给出提示。

### 3.4 提取数据契约

提取层输出统一的结构化数据（供翻译层、渲染层与存储层复用）：

- `title`：文章标题
- `author`：作者名（可为空）
- `url`：原文链接
- `markdown`：转换后的正文 Markdown（图片为 `![alt][src]`）

## 4. 核心方案二：AI 翻译（OpenAI SDK 兼容 + Qwen）

### 4.1 选型说明

- 采用 **OpenAI SDK（`openai`）**，其请求协议被大量模型服务兼容。
- 通过可配置的 `baseURL` 切换到不同模型服务，实现「改配置即切换模型」。
- 本项目默认接入 **Qwen（通义千问，DashScope）** 的 OpenAI 兼容端点，模型默认 `qwen-plus`（可配置为 `qwen-turbo` / `qwen-max` / `qwen-long` 等）。

### 4.2 可配置项（存于 `chrome.storage.local`）

| 配置项 | 说明 |
| --- | --- |
| `baseURL` | 模型服务 OpenAI 兼容端点（默认指向 Qwen） |
| `model` | 模型名（默认 `qwen-plus`） |
| `apiKey` | 调用密钥（仅本地存储，不硬编码、不进仓库） |
| `prompt` | 翻译提示词（可自定义） |
| `targetLanguage` | 目标语言（默认中文） |
| `displayMode` | 展示模式（`translation` 译文优先 / `bilingual` 中英对照 / `original` 仅原文） |

### 4.3 翻译流程与流式

1. Side Panel 发起翻译请求，携带结构化正文与提示词。
2. Background 调用 `openai` SDK，以 `stream: true` 请求流式补全。
3. Background 通过 `Port` 将分片实时转发到 Side Panel。
4. Side Panel 累积分片，驱动 `md-wx` 打字机式渲染。

### 4.4 翻译结果结构

翻译输出为**结构化双语结果**，以支撑多种展示模式：

- `meta`：标题、作者、原文链接
- `original`：原文 Markdown 正文
- `translation`：译文 Markdown 正文

### 4.5 提示词与格式约束

- 目标语言由 `targetLanguage` 决定（默认中文）。
- 提示词需明确：保留 Markdown 结构、图片语法 `![alt][src]` 不被改写；只翻译正文，不改写标题 / 作者 / 链接等元数据。

## 5. 核心方案三：结果渲染（md-wx）

- 翻译结果使用 npm 包 **`md-wx`** 的 `MarkdownRenderer` 组件呈现。
- 安装：`npm install md-wx`；在 React 中引入 `MarkdownRenderer` 并加载 `md-wx/dist/style.css`。

### 5.1 关键 Props（用于本插件）

| Prop | 说明 |
| --- | --- |
| `markdown` | 渲染的 Markdown 内容 |
| `theme` | 主题，默认 `minimal`，支持 `sakura` / `forest` / `ocean` / `sunset` |
| `enableCopy` | 是否启用一键复制（对应 F7 复制功能） |
| `showSettings` | 是否显示 md-wx 自带设置面板 |
| `defaultViewMode` | 默认视图模式（`mobile` / `tablet` / `desktop`） |
| `onCopy` | 复制回调（用于状态反馈） |

### 5.2 展示模式映射

| 展示模式 | 渲染内容 | md-wx 用法 |
| --- | --- | --- |
| `translation` 译文优先 | 仅译文正文（含标题 / 作者 / 链接头部） | 单个 `MarkdownRenderer` |
| `bilingual` 中英对照 | 原文与译文并排对照 | 左右两个 `MarkdownRenderer` |
| `original` 仅原文 | 仅原文正文 | 单个 `MarkdownRenderer` |

- 打字机效果实现于 Side Panel 层：将流式分片累积为 Markdown 字符串后，以 `markdown` prop 传入 `MarkdownRenderer`，由渲染层动态展示。

## 6. 目录结构规范

```
chrome-extension-en-trabslation/
├─ docs/                          # 需求 / 设计 / 任务文档
├─ src/
│  ├─ entrypoints/                # WXT 入口
│  │  ├─ background/
│  │  │  └─ index.ts             # Service Worker：消息路由、翻译调度、流式转发
│  │  ├─ content/
│  │  │  └─ index.ts             # Content Script：正文提取（Readability + turndown）
│  │  └─ sidepanel/              # 侧边栏入口
│  │     ├─ index.html
│  │     ├─ main.tsx             # React 挂载
│  │     ├─ App.tsx              # 状态机根组件
│  │     └─ style.css            # 全局样式
│  ├─ components/                 # 通用 UI 组件
│  │  ├─ TopBar.tsx
│  │  ├─ Footer.tsx
│  │  ├─ SettingsPanel.tsx       # 设置面板（模型 / Key / 提示词 / 目标语言 / 展示模式）
│  │  └─ views/                   # 状态容器
│  │     ├─ EmptyView.tsx        # 初始态
│  │     ├─ LoadingView.tsx      # 提取正文中
│  │     ├─ TranslatingView.tsx  # 翻译中
│  │     ├─ SuccessView.tsx      # 成功（md-wx 渲染 + 展示模式）
│  │     └─ ErrorView.tsx        # 失败 / 重试
│  ├─ lib/                        # 领域逻辑（与 UI 解耦）
│  │  ├─ extractor.ts            # 正文提取封装
│  │  ├─ translator.ts           # AI 翻译适配器（openai SDK）
│  │  ├─ storage.ts              # chrome.storage.local 读写封装
│  │  └─ types.ts                # 共享类型定义
│  └─ utils/                      # 通用工具函数
├─ wxt.config.ts
├─ tsconfig.json
├─ eslint.config.js
├─ .prettierrc
├─ package.json
└─ ...
```

## 7. 编码规范

### 7.1 语言与风格

- 语言：TypeScript（`strict: true`）。
- 组件：函数组件 + Hooks，禁止类组件。
- 类型：禁止 `any`；接口优先使用 `interface`，联合类型用 `type`。

### 7.2 命名规范

| 对象 | 规范 | 示例 |
| --- | --- | --- |
| 文件 / 目录 | kebab-case | `success-view.tsx`、`lib/` |
| 组件 / 类型 | PascalCase | `SuccessView`、`ArticleData` |
| 变量 / 函数 | camelCase | `extractArticle`、`translatedText` |
| 常量 | UPPER_SNAKE_CASE | `DEFAULT_MODEL` |
| 布尔变量 | `is` / `has` 前缀 | `isTranslating`、`hasError` |

### 7.3 组织与依赖

- 单向依赖：`UI 层（components / entrypoints） → lib → utils`，lib 不得反向依赖 UI。
- 副作用（存储读写、网络请求）集中在 `lib` 与 background，组件保持纯展示。
- import 顺序：内置模块 → 第三方依赖 → 项目内模块（`@/` 别名）。

### 7.4 注释与提交

- 注释语言：中文；仅对非自明逻辑添加注释，不写冗余注释。
- 提交信息遵循 `type(scope): subject` 语义化格式（如 `feat(extract): 接入 Readability 正文提取`）。

### 7.5 工程质量

- 强制通过 ESLint（typescript-eslint）与 Prettier 检查后方可提交。
- 不在仓库提交任何密钥 / 敏感配置。

## 8. 状态机与展示模式（Side Panel）

| 状态 | 视图 | 触发 |
| --- | --- | --- |
| `empty` | EmptyView | 打开面板 / 新页面 |
| `loading` | LoadingView | 点击翻译，开始提取正文 |
| `translating` | TranslatingView | 正文就绪，请求模型（流式进行中） |
| `success` | SuccessView | 收到完整译文，md-wx 渲染 |
| `error` | ErrorView | 任一步骤异常，提供重试 |

展示模式（`displayMode`）仅作用于 `success` 状态，决定 SuccessView 渲染「译文优先 / 中英对照 / 仅原文」中的哪一种。

## 9. 关键数据流

1. 用户点击 Action → 打开 Side Panel（`empty`）。
2. 用户触发翻译 → `loading` → background 调度 content script 执行提取。
3. content script 返回结构化 `ArticleData` → `translating` → background 调 AI 流式翻译。
4. background 经 `Port` 转发分片 → Side Panel 累积 → `success` 后按展示模式用 md-wx 渲染。
5. 翻译完成后写入 `chrome.storage.local`，下次打开恢复展示。

## 10. 里程碑（开发顺序）

1. 任务 1：工程初始化（WXT + React + TS + ESLint/Prettier，安装 `md-wx`）。
2. 任务 2：Side Panel 状态机与静态视图接入。
3. 任务 3：正文提取（content script + Readability + turndown）。
4. 任务 4：AI 翻译适配器（openai SDK + Qwen）与设置存储。
5. 任务 5：端到端联调、流式打字机、展示模式、构建打包验证。
