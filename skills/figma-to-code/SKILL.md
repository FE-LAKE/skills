---
name: figma-to-code
description: >-
  Convert Figma designs to production code (Vue / React / HTML / CSS) and run a
  built-in visual review phase. Use when a message contains figma.com/design/ or
  figma.com/file/ links, or the user asks to implement from a design, build a
  component from Figma, review visual fidelity, or turn a mockup into code. Do
  not output UI code before get_figma_data succeeds.
license: MIT
metadata:
  author: fe-lake
  version: "1.0.0"
compatibility: Requires Framelink Figma MCP, Chrome DevTools MCP, and a Figma API token.
---

# Figma to Code

将 Figma 设计稿转换为生产级代码，并完成后续视觉评审与自动优化。Agent 会读取 Figma、生成代码、运行 lint/typecheck、生成 review brief，并优先把视觉评审交给隔离的 `figma-review-phase` helper 执行。

## When to Apply

- 消息含 `figma.com/design/` 或 `figma.com/file/` 链接
- 「按设计稿实现」「照这个写组件」「把这个变成代码」
- 需要从 Figma 生成页面或组件代码
- 「验收」「视觉对比」「还原度检查」「figma review」

## Prerequisites

- 已配置 Framelink Figma MCP、Chrome DevTools MCP 与 Figma API token，见 [references/mcp-setup.md](references/mcp-setup.md)
- 执行策略见 [references/execution-policy.md](references/execution-policy.md)
- `get_figma_data` 成功前禁止输出任何界面代码

## Capability Probe

开始前探测当前会话暴露的能力，不按宿主产品分支：

1. 查找可用 MCP 工具，确认存在 Figma 读取能力（至少 `get_figma_data`）。
2. 确认图片资产下载能力（如 `download_figma_images`）或记录可用替代方式。
3. 确认浏览器截图/DevTools 能力是否可用，供 review phase 使用。
4. 确认当前仓库可读写，并记录可用 lint/typecheck/dev 命令。

若没有 Figma MCP 或 token 不可用，立即输出 `blocked: Figma MCP unavailable`，不要猜测 UI 代码。若浏览器能力缺失，不阻塞转码，但最终必须说明 review phase 被阻塞。

## How It Works

1. 判断入口模式：从 Figma 生成代码，或对已有实现直接进入 review phase。
2. 读取项目上下文（技术栈、目录约定、现有组件风格）。
3. 解析 Figma URL，调用 MCP 抓取节点树。
4. 结构拆解 → 尺寸锚点 → 样式映射 → 下载资产。
5. 生成代码并执行 lint/typecheck。
6. 生成固定格式 review brief，并优先交给 `figma-review-phase` fork helper 运行 review phase。
7. 若 helper 不可用，按 subagent / 等价隔离能力、当前会话 fallback 的顺序执行 review phase。
8. review phase 获取 Figma 参照图与实现页截图，自动修复视觉差异并复查。

## Pipeline

### Step 0 · 能力与项目上下文（第一行代码前必做）

先判断入口模式：

- **generate mode**：用户提供 Figma 链接，要求实现页面或组件。
- **review-only mode**：用户要求验收、视觉对比、还原度检查，已有实现可访问。

generate mode 中，用户未提供则询问目标技术栈、目标文件落地路径。能从项目中确认的信息直接使用，不反复询问。

review-only mode 中，输入优先级为：用户直接提供的 Figma URL + dev URL/路由 > 源码 `@figma` 文件头 + 用户提供的 dev URL/路由 > 询问用户。不要要求目标落地路径。

若当前仓库存在则读取（不存在则跳过，不阻塞）：

- `AGENTS.md` / `CLAUDE.md` — Agent 协作规则、代码边界、仓库约定
- `README.md` — 项目说明、安装/运行、lint/typecheck、dev 命令
- `postcss.config.js` / `vite.config.*` — px 换算
- 现有同类页面/组件 — 单位与命名风格
- 页面文件头 `@figma` — review-only mode 的设计稿来源

### Step 1 · 准备与抓取

解析 URL：fileKey 从 `figma.com/design/<fileKey>/` 或 `figma.com/file/<fileKey>/` 提取；nodeId：`node-id=1234-5678` → `1234:5678`。
调用 `get_figma_data` 前先读其 schema 确认参数格式。
跳过 `visible: false` 节点并记入 Assumptions。
失败立即停止，输出 `Figma MCP: <错误类型>`，不继续写代码。

review-only mode 若没有 Figma URL，则扫描页面文件（`pages/**`、`app/**`、`src/pages/**`、`src/views/**` 等）的文件头：

```typescript
/** @figma https://figma.com/design/<fileKey>/...?node-id=1-2 */
```

仍未找到则询问用户提供 Figma URL 与 dev URL/路由。

### Step 2 · 结构拆解（代码前必做）

review-only mode 跳过 Step 2-6，直接进入 Step 8。

结合 Step 0 与 MCP 节点树判断页面类型，套 region 模板：

| 类型 | 判断信号 | Region checklist |
|------|----------|------------------|
| mobile-single-column | 用户或 README 判定为 H5 | header / content-sections / footer / overlays |
| dashboard | 侧栏与主内容并列 | top / sidebar / main / overlays |
| component | 单组件 frame | root / variants-or-slots / overlays |
| unknown | 无法判断 | 按节点树列 region，写入 Assumptions |

完成 checklist 前禁止写代码。

### Step 3 · 尺寸锚点（代码前必做，≥ 6 项）

明确：**设计稿倍率**、**CSS 写法**、**换算公式**（Figma px → 代码值）。项目已有换算规则时直接沿用。

| 元素/区域 | 来源节点 | Figma px | 换算后 | 计划 class/token |
| --------- | -------- | -------- | ------ | ---------------- |

### Step 4 · 样式映射

映射前查项目现有组件，能复用不重写。
Figma → CSS 对照见 [references/css-mapping.md](references/css-mapping.md)。

规则：不造 token 名；不把语义 token 降级成 hex；无法确认组件 API 时不猜 props，写 TODO 或 `needs_decision`。

### Step 5 · 图片资产

默认走 [references/asset-pipeline.md](references/asset-pipeline.md) 的 Framelink 分支；用户指定 Desktop MCP 时走 Desktop 分支。

### Step 6 · 生成代码

布局：flex/grid + gap/padding；absolute 仅限叠加层。
Auto Layout → flex-direction；重复 COMPONENT → 有复用价值则抽文件。
事件处理写 `// TODO: wire handler`，不写业务逻辑。

**页面/路由组件文件头**（必须）：

```typescript
/**
 * @file LoginPage.tsx
 * @description 登录页
 * @figma https://figma.com/design/<fileKey>/...?node-id=1-2
 */
```

### Step 7 · lint / typecheck

执行 Step 0 记录的命令；无则依次尝试 `pnpm lint`、`pnpm type-check`、`npm run lint`。失败则修复后重跑。

### Step 8 · Review phase

完成代码生成与 lint/typecheck 后，先生成固定格式 review brief，再执行 [references/review-policy.md](references/review-policy.md)。

执行顺序：

1. 若宿主支持 `context: fork` skill，优先调用内部 helper `figma-review-phase`，只传 review brief。
2. 若 helper 不可用，但宿主支持 subagent 或等价隔离执行能力，把同一份 brief 交给隔离执行。
3. 若隔离能力不可用，在当前会话按同一份 brief 执行。

review brief 必须使用此模板：

```markdown
## Review Brief

- mode: generate | review-only
- figmaUrl: <Figma URL>
- nodeId: <target node id, e.g. 1234:5678>
- modifiedFiles:
  - <path>
- devCommand: <command or "unknown">
- devUrl: <URL or "unknown">
- route: <route or "unknown">
- viewport: <width>x<height>
- techStack: <framework / styling / build info>
- assumptions:
  - <item or "none">
- assetsSummary: downloaded: N | linked: N | placeholder: N
- tokensSummary: figma: N | project: N | literals: N
- lintTypecheckResult: pass | failed (<command>) | not-run (<reason>)
- allowedFixScope: visual-only
- blockedConditions:
  - business logic
  - API
  - routing
  - state model
  - persistence
  - public component API
```

当前会话 fallback 时，不要沿用生成阶段的视觉猜测；只使用 brief、Figma 参照、实现截图与代码证据做判断。

review phase 默认最多 3 轮；高影响差异仍明显时 Agent 可自主扩展到最多 5 轮。视觉层问题默认自动修复，越界才 `needs_decision`。

## Output

最终摘要：

```
Figma MCP            : success | <错误类型>
Assumptions          : <无则"无">
TODOs                : <无则"无">
Assets               : downloaded: N | linked: N | placeholder: N
Tokens               : figma: N | project: N | literals: N
Lint/Typecheck       : pass | failed (<命令>)
Review executor      : figma-review-phase | subagent | current-session | blocked
Review phase         : pass | partial | blocked (<原因>)
Fix rounds           : N / 3 | N / 5
Remaining issues     : <列表或"无">
needs_decision       : <列表或"无">
```

## Gotchas / Troubleshooting

- `get_figma_data` 失败时不要补写“看起来差不多”的 UI，先让用户修 token、权限或 node-id。
- Figma URL 中 `node-id=1234-5678` 需要传为 MCP 要求的格式，常见为 `1234:5678`。
- 自动生成的代码只能补展示层 TODO，不要实现业务 API、权限、路由策略或复杂表单行为。
- 图片资产下载失败时停止或使用用户确认的 placeholder，并在最终摘要里标明。
- review phase 优先调用 `figma-review-phase` fork helper；helper 不可用时再用 subagent 或等价隔离能力。
- 不要给整个 `figma-to-code` 加 `context: fork`；fork 粒度是整个 skill，若加在这里会让生成与 review 都进入同一个子上下文。

## References

- [mcp-setup.md](references/mcp-setup.md) — MCP 配置
- [execution-policy.md](references/execution-policy.md) — Agent 执行策略
- [review-policy.md](references/review-policy.md) — review phase 与视觉修复策略
- [report-template.md](references/report-template.md) — review phase 输出模板
- [css-mapping.md](references/css-mapping.md) — Figma → CSS 对照
- [asset-pipeline.md](references/asset-pipeline.md) — 图片资产下载
