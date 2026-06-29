---
name: personal-task-agent
description: >-
  Manual-only skill for external task board REST APIs and personal AI task
  workflows. Use when explicitly invoked to check assigned tasks or projects,
  summarize task details, add comments, create tasks, or move task/project
  status. The first provider is 悦达任务看板.
license: MIT
metadata:
  author: fe-lake
  version: "1.0.0"
compatibility: Requires Node.js 18+ for the bundled REST client and a local `.skills.env` file containing the current provider token.
disable-model-invocation: true
---

# Personal Task Agent

帮助 Agent 处理外部任务看板上的个人任务工作流：查看我负责的任务/需求、读取详情、添加评论、新建任务、任务状态流转和需求阶段流转。

## When to Apply

仅在用户手动调用该 skill 时使用。不要由模型根据普通任务描述自动触发。

适用意图：

- 查看个人任务或需求列表。
- 总结任务或需求详情。
- 给任务或需求添加评论。
- 新建任务。
- 推进任务状态或需求阶段。
- 使用悦达任务看板 API。

## Prerequisites

- 用户已在当前 provider 中生成个人 API token。
- 当前工作仓库根目录存在 `.skills.env`，或本 skill 目录存在 `skills/personal-task-agent/.skills.env`。
- 第一版悦达 provider 的 `.skills.env` 格式固定为：

```dotenv
YUEDA_TASK_TOKEN=ydk_xxxxx
```

不要要求用户把 token 粘贴到对话中。token 缺失时，停止并提示用户在 `.skills.env` 中配置。

## Capability Probe

开始调用 API 前：

1. 确认可运行 Node.js 18+。
2. 确认 `scripts/task-board-client.mjs` 存在。
3. 通过 `node skills/personal-task-agent/scripts/task-board-client.mjs me` 验证 token。
4. 若验证失败，输出 `blocked: token unavailable or unauthorized`，不要继续执行写操作。

## How It Works

默认使用内置脚本调用 API，避免临时手写 curl：

```bash
node skills/personal-task-agent/scripts/task-board-client.mjs <command> [args]
```

常用命令：

- `me`：验证 token 并读取当前用户。
- `my-tasks --status unfinished`：读取我负责的任务。
- `my-projects --stage open`：读取我负责的需求。
- `task <id>`：读取任务详情和评论。
- `project <id>`：读取需求详情、子任务和评论。
- `comment-task <id> --content "..."`
- `comment-project <id> --content "..."`
- `transition-task <id> --action complete --note "..."`
- `transition-project <id> --to-stage dev_doing --note "..."`
- `create-task --json '{"title":"...","projectId":"...","priority":"P2","taskCategory":"tech_backend","assigneeIds":["..."]}'`

悦达 provider 的 API 细节见 [references/yueda-api.md](references/yueda-api.md)。

## Execution Policy

读取类操作可直接执行：

- `me`
- `my-tasks`
- `my-projects`
- `task`
- `project`

评论可自动发送，但必须满足用户明确要求“评论 / 回复 / 记录进度 / 写一条评论”等意图。不要在仅总结、分析或规划时顺手写入评论。

以下写操作必须先展示操作摘要，并等待用户用“好的 / 可以 / 确认 / 执行”等自然肯定语确认：

- `create-task`
- `transition-task`
- `transition-project`

确认摘要至少包含：

- 目标接口或脚本命令
- 目标任务/需求 ID
- 请求体摘要
- 可能造成的影响

批量写操作必须先汇总全部计划，等待一次明确确认后再执行。不要静默执行批量状态流转或批量创建。

## Pipeline

1. 判断用户意图：读取、总结、评论、创建任务或状态流转。
2. 读取或验证 token；失败则停止。
3. 对读取/总结类请求，直接调用对应命令并基于结果回答。
4. 对评论请求，确认用户明确要求写评论后调用评论命令。
5. 对新建任务或状态流转，先展示确认摘要；用户确认后再调用脚本。
6. API 返回错误时，保留中文错误说明并给出下一步建议。

## Output

最终回复应简洁说明：

```markdown
Action              : read | comment | create-task | transition-task | transition-project | blocked
Provider            : yueda
Target              : <task/project/user/list id or "none">
Result              : success | failed | blocked
Summary             : <关键结果>
Needs confirmation  : yes | no
```

若执行了写操作，必须说明实际写入的对象和返回结果。不要输出 token、Authorization header 或 `.skills.env` 内容。

## Gotchas / Troubleshooting

- `401` 通常表示 token 缺失、无效或已撤销。
- `403` 表示当前账号无权操作目标资源。
- `404` 表示任务/需求不存在或当前账号不可见。
- `400` 表示请求体字段不符合 schema。
- `projectId`、`productLineId`、`parentTaskId` 三选一，创建任务时必须提供一个归属。
- 任务状态流转必须使用合法 action；需求阶段必须使用合法 stage。

## References

- [yueda-api.md](references/yueda-api.md) — 悦达任务看板 REST API 摘要

