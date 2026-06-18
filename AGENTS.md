# AGENTS.md

本文件为 AI 编码 Agent 在本仓库协作时的指引。

## 目录结构

```
skills/
  {skill-name}/           # kebab-case 目录名
    SKILL.md              # 必需：skill 定义（含 YAML frontmatter）
    scripts/              # 可选：可执行脚本
    references/           # 可选：按需加载的参考文档
AGENTS.md                 # 本文件
CLAUDE.md                 # 指向 AGENTS.md
skills.sh.json            # skills.sh 注册配置
README.md
```

## 命名约定

- **Skill 目录**：`kebab-case`（如 `figma-to-code`）
- **SKILL.md**：固定大写文件名
- **Scripts**：`kebab-case.sh` 或 `kebab-case.mjs`
- **参考文档**：放在 `references/`，从 SKILL.md 一级链接引用

## SKILL.md 格式

```markdown
---
name: {skill-name}
description: {英文一句话 + 触发短语，便于 Agent 激活}
license: MIT
metadata:
  author: fe-lake
  version: "1.0.0"
compatibility: Requires Framelink Figma MCP, Chrome DevTools MCP, and a Figma API token.
---

# {Skill Title}

{简要说明}

## When to Apply
## Prerequisites
## Capability Probe
## How It Works
## Pipeline / Usage
## Output
## Gotchas / Troubleshooting
## References
```

### 上下文效率

- **SKILL.md 控制在 500 行以内**，详细材料放 `references/`
- **description 含英文触发短语**，便于跨 Agent 识别
- **渐进式披露**：SKILL.md 只链接一层深度的 reference 文件
- **优先 scripts 而非内联大段代码** — 脚本执行不占 context（仅输出占）

## 新建 Skill

1. 在 `skills/` 下创建 `kebab-case` 目录
2. 添加 `SKILL.md`（含 frontmatter）
3. 可选添加 `references/`；暂不默认添加 scripts
4. 将 MCP 配置等运行时依赖文档放到 `references/mcp-setup.md`
5. 更新根目录 `README.md` 与 `skills.sh.json`

## 用户安装

**推荐（skills.sh）：**

```bash
npx skills add fe-lake/skills
npx skills add fe-lake/skills --skill figma-to-code
```

其他支持 Agent Skills 的宿主可按各自文档安装 `skills/figma-to-code`。不要在公共文档中把某个 IDE 或宿主的本地目录作为默认安装路径。

## MCP 依赖

各 skill 的 MCP 配置说明放在自己的 `references/mcp-setup.md` 中，安装单个 skill 时不应依赖仓库根目录文档。