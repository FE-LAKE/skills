#!/usr/bin/env node

import { existsSync, readFileSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const PROVIDER = "yueda";
const BASE_URL = "https://ydtask.htvrzrk.cc";
const TOKEN_KEY = "YUEDA_TASK_TOKEN";

const TASK_ACTIONS = new Set([
  "start",
  "submit",
  "accept",
  "reject",
  "reopen",
  "complete",
  "uncomplete",
]);

const PROJECT_STAGES = new Set([
  "backlog",
  "review",
  "confirmed",
  "design_todo",
  "design_doing",
  "dev_todo",
  "dev_doing",
  "integration",
  "testing",
  "acceptance",
  "launched",
  "completed",
  "paused",
  "closed",
  "delayed",
]);

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const skillRoot = path.resolve(__dirname, "..");

function usage() {
  return `Usage:
  node skills/personal-task-agent/scripts/task-board-client.mjs me
  node skills/personal-task-agent/scripts/task-board-client.mjs my-tasks [--status unfinished]
  node skills/personal-task-agent/scripts/task-board-client.mjs my-projects [--stage open]
  node skills/personal-task-agent/scripts/task-board-client.mjs task <id>
  node skills/personal-task-agent/scripts/task-board-client.mjs project <id>
  node skills/personal-task-agent/scripts/task-board-client.mjs comment-task <id> --content "..."
  node skills/personal-task-agent/scripts/task-board-client.mjs comment-project <id> --content "..."
  node skills/personal-task-agent/scripts/task-board-client.mjs transition-task <id> --action complete [--note "..."]
  node skills/personal-task-agent/scripts/task-board-client.mjs transition-project <id> --to-stage dev_doing [--note "..."]
  node skills/personal-task-agent/scripts/task-board-client.mjs create-task --json '{"title":"...","projectId":"..."}'

Provider:
  ${PROVIDER}

Token:
  Create .skills.env in the current repository root or skills/personal-task-agent/.skills.env:
  ${TOKEN_KEY}=ydk_xxxxx
`;
}

function parseEnvFile(filePath) {
  const env = {};
  if (!existsSync(filePath)) return env;

  const text = readFileSync(filePath, "utf8");
  for (const rawLine of text.split(/\r?\n/)) {
    const line = rawLine.trim();
    if (!line || line.startsWith("#")) continue;

    const equalsIndex = line.indexOf("=");
    if (equalsIndex === -1) continue;

    const key = line.slice(0, equalsIndex).trim();
    let value = line.slice(equalsIndex + 1).trim();
    if (
      (value.startsWith('"') && value.endsWith('"')) ||
      (value.startsWith("'") && value.endsWith("'"))
    ) {
      value = value.slice(1, -1);
    }
    env[key] = value;
  }
  return env;
}

function loadToken() {
  const candidates = [
    path.resolve(process.cwd(), ".skills.env"),
    path.resolve(skillRoot, ".skills.env"),
  ];

  for (const filePath of candidates) {
    const env = parseEnvFile(filePath);
    if (env[TOKEN_KEY]) {
      return { token: env[TOKEN_KEY], source: filePath };
    }
  }

  throw new ClientError(
    "missing_token",
    `Missing ${TOKEN_KEY}. Create .skills.env in the current repository root or skills/personal-task-agent/.skills.env.`,
  );
}

class ClientError extends Error {
  constructor(code, message, details = undefined) {
    super(message);
    this.name = "ClientError";
    this.code = code;
    this.details = details;
  }
}

function parseArgs(argv) {
  const positionals = [];
  const flags = {};

  for (let index = 0; index < argv.length; index += 1) {
    const item = argv[index];
    if (!item.startsWith("--")) {
      positionals.push(item);
      continue;
    }

    const key = item.slice(2);
    const next = argv[index + 1];
    if (!next || next.startsWith("--")) {
      flags[key] = true;
      continue;
    }

    flags[key] = next;
    index += 1;
  }

  return { command: positionals[0], args: positionals.slice(1), flags };
}

function requireValue(value, label) {
  if (!value || value === true) {
    throw new ClientError("missing_argument", `Missing required argument: ${label}`);
  }
  return value;
}

function parseJsonFlag(flags) {
  const raw = requireValue(flags.json, "--json");
  try {
    return JSON.parse(raw);
  } catch (error) {
    throw new ClientError("invalid_json", `Invalid JSON passed to --json: ${error.message}`);
  }
}

function buildUrl(pathname, query = {}) {
  const url = new URL(pathname, BASE_URL);
  for (const [key, value] of Object.entries(query)) {
    if (value !== undefined && value !== null && value !== "") {
      url.searchParams.set(key, String(value));
    }
  }
  return url;
}

async function request(method, pathname, { query, body } = {}) {
  const { token } = loadToken();
  const response = await fetch(buildUrl(pathname, query), {
    method,
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
    },
    body: body === undefined ? undefined : JSON.stringify(body),
  });

  const text = await response.text();
  let data = null;
  if (text) {
    try {
      data = JSON.parse(text);
    } catch {
      data = text;
    }
  }

  if (!response.ok) {
    throw new ClientError("api_error", `API request failed with ${response.status}`, {
      status: response.status,
      response: data,
    });
  }

  return data;
}

async function dispatch({ command, args, flags }) {
  switch (command) {
    case undefined:
    case "help":
    case "--help":
    case "-h":
      return { provider: PROVIDER, help: usage() };

    case "me":
      return request("GET", "/api/v1/me");

    case "my-tasks":
      return request("GET", "/api/v1/me/tasks", {
        query: { status: flags.status ?? "unfinished" },
      });

    case "my-projects":
      return request("GET", "/api/v1/me/projects", {
        query: { stage: flags.stage ?? "open" },
      });

    case "task": {
      const id = requireValue(args[0], "task id");
      return request("GET", `/api/v1/tasks/${encodeURIComponent(id)}`);
    }

    case "project": {
      const id = requireValue(args[0], "project id");
      return request("GET", `/api/v1/projects/${encodeURIComponent(id)}`);
    }

    case "comment-task": {
      const id = requireValue(args[0], "task id");
      const content = requireValue(flags.content, "--content");
      return request("POST", `/api/v1/tasks/${encodeURIComponent(id)}/comments`, {
        body: { content },
      });
    }

    case "comment-project": {
      const id = requireValue(args[0], "project id");
      const content = requireValue(flags.content, "--content");
      return request("POST", `/api/v1/projects/${encodeURIComponent(id)}/comments`, {
        body: { content },
      });
    }

    case "transition-task": {
      const id = requireValue(args[0], "task id");
      const action = requireValue(flags.action, "--action");
      if (!TASK_ACTIONS.has(action)) {
        throw new ClientError("invalid_action", `Invalid task action: ${action}`);
      }

      return request("POST", `/api/v1/tasks/${encodeURIComponent(id)}/transitions`, {
        body: optionalBody({ action, note: flags.note }),
      });
    }

    case "transition-project": {
      const id = requireValue(args[0], "project id");
      const toStage = requireValue(flags["to-stage"], "--to-stage");
      if (!PROJECT_STAGES.has(toStage)) {
        throw new ClientError("invalid_stage", `Invalid project stage: ${toStage}`);
      }

      return request("POST", `/api/v1/projects/${encodeURIComponent(id)}/transitions`, {
        body: optionalBody({ toStage, note: flags.note }),
      });
    }

    case "create-task": {
      const body = parseJsonFlag(flags);
      validateCreateTaskBody(body);
      return request("POST", "/api/v1/tasks", { body });
    }

    default:
      throw new ClientError("unknown_command", `Unknown command: ${command}`);
  }
}

function optionalBody(body) {
  return Object.fromEntries(
    Object.entries(body).filter(([, value]) => value !== undefined && value !== true),
  );
}

function validateCreateTaskBody(body) {
  if (!body || typeof body !== "object" || Array.isArray(body)) {
    throw new ClientError("invalid_body", "create-task --json must be a JSON object");
  }
  if (!body.title) {
    throw new ClientError("invalid_body", "create-task requires title");
  }

  const owners = ["projectId", "productLineId", "parentTaskId"].filter((key) => body[key]);
  if (owners.length === 0) {
    throw new ClientError(
      "invalid_body",
      "create-task requires one of projectId, productLineId, or parentTaskId",
    );
  }
}

async function main() {
  try {
    const result = await dispatch(parseArgs(process.argv.slice(2)));
    process.stdout.write(`${JSON.stringify({ ok: true, data: result }, null, 2)}\n`);
  } catch (error) {
    const payload =
      error instanceof ClientError
        ? { ok: false, error: error.code, message: error.message, details: error.details }
        : { ok: false, error: "unexpected_error", message: error.message };

    process.stdout.write(`${JSON.stringify(payload, null, 2)}\n`);
    process.exitCode = 1;
  }
}

await main();
