# Yueda Task Board REST API

This is the first provider supported by `personal-task-agent`.

Base URL:

```text
https://ydtask.htvrzrk.cc
```

Authentication:

```http
Authorization: Bearer ydk_xxxxx
```

The bundled client reads the token from `.skills.env` and never prints it.

## Token Setup

1. 登录悦达任务看板。
2. 头像 → 个人设置。
3. 找到“API token”区域。
4. 新建 token，复制一次性明文 token。
5. 写入当前工作仓库根目录 `.skills.env`，或 `skills/personal-task-agent/.skills.env`：

```dotenv
YUEDA_TASK_TOKEN=ydk_xxxxx
```

Do not commit `.skills.env`.

## Endpoints

| Method | Path | Purpose |
| --- | --- | --- |
| `GET` | `/api/v1/me` | Verify token and get current user |
| `GET` | `/api/v1/me/tasks?status=unfinished` | List tasks assigned to me |
| `GET` | `/api/v1/me/projects?stage=open` | List projects owned by me |
| `GET` | `/api/v1/tasks/:id` | Get task detail, including comments |
| `PATCH` | `/api/v1/tasks/:id` | Update task fields |
| `POST` | `/api/v1/tasks` | Create task |
| `POST` | `/api/v1/tasks/:id/comments` | Add task comment |
| `POST` | `/api/v1/tasks/:id/transitions` | Transition task status |
| `GET` | `/api/v1/projects/:id` | Get project detail, including child tasks and comments |
| `POST` | `/api/v1/projects/:id/comments` | Add project comment |
| `POST` | `/api/v1/projects/:id/transitions` | Transition project stage |

## Client Commands

Run from the target repository root:

```bash
node skills/personal-task-agent/scripts/task-board-client.mjs me
node skills/personal-task-agent/scripts/task-board-client.mjs my-tasks --status unfinished
node skills/personal-task-agent/scripts/task-board-client.mjs my-projects --stage open
node skills/personal-task-agent/scripts/task-board-client.mjs task TASK_ID
node skills/personal-task-agent/scripts/task-board-client.mjs project PROJECT_ID
```

Comment examples:

```bash
node skills/personal-task-agent/scripts/task-board-client.mjs comment-task TASK_ID --content "AI 已分析，建议拆 3 个子任务"
node skills/personal-task-agent/scripts/task-board-client.mjs comment-project PROJECT_ID --content "今日进度已同步"
```

Transition examples:

```bash
node skills/personal-task-agent/scripts/task-board-client.mjs transition-task TASK_ID --action complete --note "AI workflow auto-close"
node skills/personal-task-agent/scripts/task-board-client.mjs transition-project PROJECT_ID --to-stage dev_doing --note "进入开发中"
```

Create task example:

```bash
node skills/personal-task-agent/scripts/task-board-client.mjs create-task --json '{"title":"AI 生成的子任务 - 联调登录接口","projectId":"PROJECT_ID","priority":"P2","taskCategory":"tech_backend","dueDate":"2026-06-01","assigneeIds":["USER_ID"]}'
```

## Task Transitions

`POST /api/v1/tasks/:id/transitions`

Body:

```json
{ "action": "complete", "note": "optional note" }
```

| Action | Meaning | Allowed Current Status |
| --- | --- | --- |
| `start` | Start work | `pending`, `rejected` |
| `submit` | Submit for review | `in_progress` |
| `accept` | Accept review | `in_review` |
| `reject` | Reject | `in_review` |
| `reopen` | Reopen | `done`, `rejected` |
| `complete` | Complete directly | Any non-`done` status |
| `uncomplete` | Undo completion | `done` |

## Project Stages

`POST /api/v1/projects/:id/transitions`

Body:

```json
{ "toStage": "dev_doing", "note": "optional note" }
```

Legal stages:

```text
backlog
review
confirmed
design_todo
design_doing
dev_todo
dev_doing
integration
testing
acceptance
launched
completed
paused
closed
delayed
```

## Create Task

`POST /api/v1/tasks`

Required:

- `title`
- one ownership field from `projectId`, `productLineId`, `parentTaskId`

Common fields:

```json
{
  "title": "AI 生成的子任务 - 联调登录接口",
  "projectId": "PROJECT_ID",
  "priority": "P2",
  "taskCategory": "tech_backend",
  "dueDate": "2026-06-01",
  "assigneeIds": ["USER_ID"]
}
```

## Task Categories

```text
ui_design
tech_frontend
tech_backend
tech_dev
test
acceptance
launch
retro
```

`tech_dev` is legacy data and maps to backend work.

## Error Responses

API errors return:

```json
{ "error": "中文错误说明" }
```

Common status codes:

- `401`: token missing, invalid, or revoked.
- `403`: current user has no permission.
- `404`: resource does not exist or is not visible to current user.
- `400`: request body does not match schema.

## Write Safety

- Comments can be sent only when the user clearly asks to comment, reply, or record progress.
- Creating tasks, task transitions, and project transitions require a prior human confirmation.
- Do not print tokens or raw authorization headers.
