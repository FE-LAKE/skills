# Contributing

感谢你为本仓库贡献 Agent Skills。本仓库面向公共分享，目标是提供宿主中立、可安装、可维护、上下文成本可控的 skill。

## Repository Shape

```text
skills/
  {skill-name}/
    SKILL.md
    references/
    scripts/
AGENTS.md
CLAUDE.md
skills.sh.json
README.md
CONTRIBUTING.md
```

`skills/{skill-name}/SKILL.md` 是每个 skill 的入口。`references/` 用于放详细材料，`scripts/` 只用于宿主中立、可重复的自动化。

## Design Principles

### Host-neutral by default

本仓库不是某个 IDE 或 Agent 产品的专属包。文档和 skill 指令应使用公共 Agent Skills 语言。

Do:

- 使用 `Agent`、`host`、`subagent`、`MCP`、`review brief` 等相对通用的术语。
- 安装说明优先使用 `npx skills add fe-lake/skills`。
- 把宿主能力写成条件：`when the host supports subagents`。

Do not:

- 把某个宿主的本地目录作为默认安装路径。
- 在公共说明里假设一定存在 subagent、浏览器、MCP、终端或项目写权限。
- 使用内部黑话，例如 `fresh-context`。

### Skills should be self-contained

单个 skill 被安装后，应尽量独立可用。不要让 `SKILL.md` 依赖仓库根目录文档才能执行关键流程。

允许根目录文档讲维护规范，但运行时必需信息应在 skill 自己的 `SKILL.md` 或 `references/` 中。

### Progressive disclosure

保持 `SKILL.md` 精简，把细节放到一层 `references/`。

Rules:

- `SKILL.md` 目标控制在 500 行以内。
- `SKILL.md` 只链接一层 reference，例如 `references/mcp-setup.md`。
- 不要从 reference 再要求 Agent 继续追二级 reference，除非确实必要。
- 大段对照表、输出模板、MCP 配置、修复模式、执行策略放入 `references/`。

### Prefer evidence over guessing

Skill 应明确哪些证据足够行动，哪些情况必须停止或询问。

For Figma-related skills:

- Figma MCP 或 token 不可用时，不要猜设计稿。
- 视觉层问题可自动修复。
- 触及业务逻辑、API、路由、状态模型、持久化或组件公共 API 时，标记 `needs_decision`。

## Adding a Skill

### 1. Choose the scope

新增 skill 前先确认它是否应该独立存在。

独立 skill 适合：

- 有清晰触发词。
- 能独立完成一个任务。
- 不依赖另一个 skill 的私有上下文。
- 用户可能单独安装它。

不适合独立 skill 的情况：

- 只是现有 skill 的一个阶段。
- 只有在另一个 skill 完成后才有意义。
- 共享同一套输入、输出和执行策略。

这类能力应作为现有 skill 的 phase 或 reference，例如 `figma-to-code` 的 review phase。

### 2. Create the directory

```text
skills/{skill-name}/
  SKILL.md
```

Naming:

- 目录名使用 `kebab-case`。
- `SKILL.md` 必须大写，文件名固定。
- `frontmatter.name` 应与目录名一致，除非你有明确的兼容理由。

### 3. Write frontmatter

Use this template:

```markdown
---
name: {skill-name}
description: >-
  {English sentence describing the capability}. Use when {specific trigger
  phrases, URLs, file types, or user intents}.
license: MIT
metadata:
  author: fe-lake
  version: "1.0.0"
compatibility: {MCP/tool/runtime requirements, or "No special requirements."}
---
```

Description requirements:

- English, because many Agent hosts use the description for skill selection.
- Include both capability and trigger conditions.
- Include concrete trigger terms: URLs, file extensions, phrases, product names.
- Keep it specific enough that the Agent can choose this skill over others.
- Keep it under 1024 characters.

Bad:

```yaml
description: Helps with design.
```

Good:

```yaml
description: >-
  Convert Figma designs to production code and run a built-in visual review
  phase. Use when a message contains figma.com/design/ links, or when the user
  asks to implement from Figma, review visual fidelity, or turn a mockup into
  code.
```

### 4. Use the standard SKILL.md sections

Recommended structure:

```markdown
# {Skill Title}

{Short purpose statement.}

## When to Apply
## Prerequisites
## Capability Probe
## How It Works
## Pipeline / Usage
## Output
## Gotchas / Troubleshooting
## References
```

Adjust section names only when the skill clearly benefits from a different shape.

### 5. Add references only when useful

Use `references/` for material that is important but not always needed.

Common reference files:

- `mcp-setup.md` — MCP servers, tokens, capability checks.
- `execution-policy.md` — what the Agent may do automatically, when it must stop.
- `report-template.md` — final report or machine-readable output format.
- `{domain}-mapping.md` — domain-to-code or API mapping.
- `{phase}-policy.md` — rules for a specific phase.

Keep reference filenames lowercase kebab-case.

### 6. Add scripts only for deterministic work

Scripts are optional. Add them when they make the skill more reliable than free-form Agent reasoning.

Good script use cases:

- Parse URLs or identifiers.
- Validate generated JSON.
- Collect deterministic project metadata.
- Render or verify generated docs.
- Normalize assets or manifests.

Avoid scripts for:

- Host-specific installation.
- Work that depends on private local paths.
- One-off logic that belongs in prose.
- Large dependencies unless the value is clear.

Script rules:

- Prefer `.mjs` for Node scripts.
- Use relative paths in docs, e.g. `node scripts/parse-url.mjs`.
- Write status logs to stderr.
- Write machine-readable JSON to stdout.
- Keep output deterministic when another script or Agent step consumes it.
- Document required runtime assumptions.

### 7. Update registry and docs

After adding a skill, update:

- `skills.sh.json`
- `README.md`
- `AGENTS.md` current public skill list, if needed

`skills.sh.json` must include the new `frontmatter.name`:

```json
{
  "title": "Figma",
  "description": "Skills for ...",
  "skills": ["figma-to-code", "sky"]
}
```

If a new grouping is needed, add one with a clear title and description.

### 8. Verify before opening a PR

Run a local check equivalent to:

```bash
node -e "JSON.parse(require('fs').readFileSync('skills.sh.json','utf8')); console.log('skills.sh.json OK')"
```

Then verify manually:

- `skills/{skill-name}/SKILL.md` exists.
- `frontmatter.name` matches `skills.sh.json`.
- `description` has concrete trigger terms.
- `SKILL.md` is under 500 lines.
- Every `references/...` link in `SKILL.md` exists.
- No host-specific install paths appear in public docs.
- No obsolete skill names remain in README or registry.
- MCP requirements are documented if the skill depends on MCP.
- The final output contract is clear.

For Figma skills, also check:

- `get_figma_data` gate is explicit before UI code generation.
- Visual review and code generation boundaries are clear.
- Business logic/API/routing/state changes require `needs_decision`.

## Updating Existing Skills

Keep changes scoped. If a change only affects one phase, update that phase's reference file instead of expanding `SKILL.md`.

Common changes:

| Change | Edit | Check |
|---|---|---|
| Trigger or routing behavior | `SKILL.md` frontmatter and `When to Apply` | Description remains specific and under 1024 chars |
| Execution boundary | `references/execution-policy.md` | No conflict with `SKILL.md` |
| Review or validation loop | Phase policy reference | Output still matches report template |
| Output format | `references/report-template.md` and `SKILL.md` Output | Existing examples still make sense |
| MCP requirement | `references/mcp-setup.md` and `compatibility` | Capability probe mentions the tool |
| Registry | `skills.sh.json` | Registered skill directory exists |
| User-facing docs | `README.md` | No host-specific assumptions |

## Public Documentation Standards

README should be concise and user-facing:

- What skills exist.
- When to use them.
- How to install with `skills.sh`.
- Minimal examples.
- MCP requirements.

README should not contain:

- Long implementation details.
- Host-specific local installation paths as the default.
- Internal process terms unless needed to explain behavior.

AGENTS.md is for Agent maintainers:

- Repository structure.
- Naming conventions.
- SKILL.md template.
- Context-efficiency rules.
- Current public skill list.

CONTRIBUTING.md is for humans:

- How to add or update skills.
- Review checklist.
- Release expectations.
- Script and documentation standards.

## Terminology

Use terms consistently:

| Term | Meaning |
|---|---|
| `skill` | A packaged Agent capability under `skills/{name}` |
| `phase` | A stage inside a skill workflow |
| `review brief` | Structured handoff data for review phase |
| `subagent` | Optional host capability for isolated work |
| `host` | The Agent runtime or product executing the skill |
| `references/` | On-demand supporting docs for a skill |
| `needs_decision` | A required human decision before changing non-visual behavior |
| `blocked` | Required tool, data, or permission is unavailable |

Avoid unclear internal terms:

- `fresh-context`
- product-specific local paths
- unexplained abbreviations

## Security and Privacy

Do not commit:

- API tokens.
- `.env` files.
- Figma personal access tokens.
- Browser profiles, cookies, screenshots containing private customer data.
- Generated assets that are not licensed or intended for redistribution.

When documenting MCP setup:

- Use placeholder tokens like `YOUR_FIGMA_TOKEN`.
- Tell users where to create tokens.
- Do not ask users to paste secrets into chat.

## Pull Request Checklist

Before asking for review:

- [ ] The skill has a clear purpose and trigger terms.
- [ ] `SKILL.md` is under 500 lines.
- [ ] References are one level deep and all links resolve.
- [ ] `skills.sh.json` is valid JSON and includes the right skill names.
- [ ] README reflects the public skill list.
- [ ] AGENTS.md reflects repository conventions.
- [ ] No host-specific install paths or product assumptions leaked into public docs.
- [ ] MCP/tool requirements are documented.
- [ ] Any scripts are deterministic and documented.
- [ ] No secrets, private screenshots, or generated local artifacts are committed.

## Release Notes

When changing public behavior, mention it in the PR description:

- New skill added.
- Skill renamed or removed.
- Trigger behavior changed.
- Required MCP/tooling changed.
- Output format changed.
- Automation script added or removed.

For unpublished or pre-release work, prefer replacing old structures cleanly over adding compatibility shims. For published behavior, document migration paths clearly.
