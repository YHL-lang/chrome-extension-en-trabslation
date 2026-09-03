# 项目开发规则（AI 参考）

> 本文档面向 AI，定义本项目开发必须遵循的高层指导原则。依据 `docs/design.md`。
> 规则侧重「该怎么做、不该怎么做」，具体实现以 `docs/task.md` 拆分的任务为准。

## 1. 技术栈与框架（固定，不得随意更换）

| 项 | 约定 |
| --- | --- |
| 扩展框架 | WXT（Vite 驱动），Manifest V3，目标浏览器 Chrome |
| UI | React + TypeScript（`strict: true`） |
| 内容提取 | `@mozilla/readability` + `turndown` |
| AI 翻译 | `openai`（OpenAI SDK 兼容协议），默认接入 Qwen |
| Markdown 渲染 | `md-wx`（`MarkdownRenderer` 组件） |
| 存储 | `chrome.storage.local` |

- 不得擅自引入上述清单之外的重量级框架/库；确有需要先说明理由并经用户确认。

## 2. NPM 包管理

- 统一使用 **npm**，不使用 yarn / pnpm。
- 新增依赖须明确用途；只安装任务真正需要的包。
- 锁定依赖版本（`package-lock.json` 纳入版本控制）。
- 依赖分层清晰：UI 组件、领域逻辑、工具函数各归其位，避免循环依赖。

## 3. 项目目录结构

遵循 `docs/design.md` §6 的目录规范，关键约束：

```
docs/          # 需求 / 设计 / 任务 / 布局文档（只增文档，不改代码）
src/
├─ entrypoints/  # WXT 入口：background / content / sidepanel
├─ components/   # 通用 UI 组件（TopBar / Footer / SettingsPanel / views/）
├─ lib/          # 领域逻辑（extractor / translator / storage / types）
└─ utils/        # 通用工具函数
```

- 新增文件必须放入对应层级，不得随意平铺。
- 文档统一放 `docs/`，任务文档为 `docs/task.md`。

## 4. 分层与依赖原则

- 单向依赖：`UI 层（components / entrypoints） → lib → utils`，**lib 不得反向依赖 UI**。
- 副作用（存储读写、网络请求）集中在 `lib` 与 `background`，React 组件保持纯展示。
- 跨运行环境协作走消息机制：content script / background / side panel 通过 `runtime` 消息或 `Port` 通信。
- AI 网络请求统一由 `background` 发起，避免在 content script / side panel 直接 `fetch` 触发 CORS 与 MV3 限制。

## 5. 代码风格与规范

- 组件一律用**函数组件 + Hooks**，禁止类组件。
- 禁止使用 `any`；接口优先用 `interface`，联合类型用 `type`。
- 注释用中文，仅对非自明逻辑添加，不写冗余注释。
- import 顺序：内置模块 → 第三方依赖 → 项目内模块（`@/` 别名）。
- 提交信息遵循 `type(scope): subject`（如 `feat(extract): 接入 Readability 正文提取`）。
- 提交前须通过 ESLint（typescript-eslint）与 Prettier。

### 命名规范

| 对象 | 规范 | 示例 |
| --- | --- | --- |
| 文件 / 目录 | kebab-case | `success-view.tsx` |
| 组件 / 类型 | PascalCase | `SuccessView`、`ArticleData` |
| 变量 / 函数 | camelCase | `extractArticle` |
| 常量 | UPPER_SNAKE_CASE | `DEFAULT_MODEL` |
| 布尔变量 | `is` / `has` 前缀 | `isTranslating`、`hasError` |

## 6. 数据与存储约定

- 配置项（模型、API Key、提示词、目标语言、展示模式）与「最近一次翻译结果」统一存 `chrome.storage.local`。
- 提取层输出统一的结构化 `ArticleData`（`title / author / url / markdown`），供翻译、渲染、存储复用。
- 翻译输出为结构化双语结果（`meta / original / translation`），支撑三种展示模式。

## 7. 安全与隐私

- **API Key 仅存本地**（`chrome.storage.local`），禁止硬编码，禁止提交到仓库。
- 翻译请求只发送被提取的正文与当前 URL，不额外上传历史数据。
- 任何密钥 / 敏感配置不得写入代码或提交。

## 8. AI 助手任务执行规范

为确保开发过程有序可控，AI 必须严格遵循以下规范：

### 8.1 任务范围控制

- **严格按任务拆分执行**：必须严格按 `docs/task.md` 中定义的任务范围执行，不得超出指定任务边界。
- **单一任务原则**：每次只执行一个明确指定的任务（如「T1」「T2」等），完成后等待用户确认再进行下一步。
- **禁止自动扩展**：不得基于架构文档或其它文档自行扩展任务范围；如需扩展，须先通知用户确认。

### 8.2 任务指令格式

用户应以以下格式明确指定任务：

- **明确任务编号**：「请执行任务 X.X：[任务名称]」。
- **范围限制**：「只完成任务 X.X 中列出的具体任务，不要超出范围」。
- **停止指令**：「完成后等待我确认再进行下一步」。

### 8.3 执行验收标准

- **任务完成确认**：每个任务完成后，必须对照 `docs/task.md` 中的「完成标准」进行自检。
- **范围边界检查**：确保所有创建的文件和代码都在指定任务范围内。
- **等待用户确认**：任务完成后向用户总结完成情况并等待确认，再进行下一个任务。

### 8.4 异常处理

- **任务描述不清晰**：若任务描述不清晰，应先询问具体范围，而不是自行决定。
- **依赖关系处理**：若当前任务依赖其它未完成的任务，应明确指出依赖关系并等待用户指示。
- **超出范围的代码**：若发现已创建超出任务范围的代码，应主动询问是否需要清理。
