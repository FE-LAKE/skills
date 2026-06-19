# Agent Skills

可分享的 [Agent Skills](https://agentskills.io/) 集合，专注 **Figma 设计稿 → 生产代码 → 视觉评审优化** 工作流。结构参考 [vercel-labs/agent-skills](https://github.com/vercel-labs/agent-skills)。

[![skills.sh](https://skills.sh/b/fe-lake/skills)](https://skills.sh/fe-lake/skills)

## Available Skills

### figma-to-code

将 Figma 设计稿转换为生产级代码（Vue / React / HTML / CSS），并包含视觉评审与自动优化流程。Agent 会读取 Figma、拆解结构、映射样式、下载资产、生成代码、运行 lint/typecheck，然后生成 review brief 并优先交给隔离的 `figma-review-phase` helper 自动修复视觉差异。

**Use when:**

- 消息含 `figma.com/design/` 或 `figma.com/file/` 链接
- 「按设计稿实现」「照这个写组件」「把这个变成代码」
- 需要从 Figma 生成页面或组件代码
- 「验收」「视觉对比」「figma review」「还原度检查」

### figma-review-phase

内部 helper skill。它接收 `figma-to-code` 生成的固定 review brief，在 `context: fork` 隔离上下文中执行截图对比、视觉评审、自动修复与复查。通常不要直接调用它；用户的转码和验收请求仍由 `figma-to-code` 接住。

## 推荐工作流

```
Figma 链接 → figma-to-code（转码 + lint/typecheck）
                    ↓ review brief
              figma-review-phase（隔离 review）
                    ↓
              截图对比 → 自动视觉修复 → 复查
```

视觉评审默认最多 3 轮；高影响差异仍明显时，Agent 可自主扩展到最多 5 轮。视觉层问题默认自动修复；只有触及业务逻辑、API、路由、状态模型、持久化或组件公共 API 时才停止并标记 `needs_decision`。宿主支持 `context: fork` skill 时优先调用 `figma-review-phase`；否则按 subagent / 等价隔离能力、当前会话 fallback 的顺序执行。

## Installation

```bash
npx skills add fe-lake/skills
```

安装单个 skill：

```bash
npx skills add fe-lake/skills --skill figma-to-code
```

如需单独安装且保留完整隔离 review 工作流，请同时安装内部 helper：

```bash
npx skills add fe-lake/skills --skill figma-review-phase
```

其他支持 Agent Skills 的宿主可按各自文档安装 `skills/figma-to-code`；完整 workflow 需要 `skills/figma-review-phase` 同时可用。

## Usage

安装后 skill 会在相关任务时由 Agent 自动激活。

**转码示例：**

```
按这个设计稿实现登录页：https://figma.com/design/xxx/...?node-id=1-2
技术栈 Vue 3 + Tailwind，文件放到 src/pages/login/
```

**验收示例：**

```
对比登录页与设计稿还原度，dev 地址 http://localhost:5173/login
```

**文件头约定**（视觉评审可自动发现页面）：

```typescript
/**
 * @file LoginPage.tsx
 * @description 登录页
 * @figma https://figma.com/design/<fileKey>/...?node-id=1-2
 */
```

## MCP 依赖

`figma-to-code` 需配置 Framelink Figma MCP、Chrome DevTools MCP 与 Figma API token。安装包内自带配置说明：

- [figma-to-code/references/mcp-setup.md](./skills/figma-to-code/references/mcp-setup.md)

## Skill Structure

每个 skill 包含：

- `SKILL.md` — Agent 指令（必需）
- `references/` — 按需加载的参考文档（可选）
- `scripts/` — 宿主中立的自动化脚本（可选）

贡献新 skill 或更新现有 skill 前，请阅读 [CONTRIBUTING.md](./CONTRIBUTING.md)。

## License

[MIT](./LICENSE)
