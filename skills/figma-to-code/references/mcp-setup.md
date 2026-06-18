# MCP 配置指南

`figma-to-code` 依赖 Framelink Figma MCP、Chrome DevTools MCP 与 Figma API token。

## 1. Framelink Figma MCP

用于读取 Figma 设计稿结构与下载图片资产。

```json
{
  "mcpServers": {
    "Framelink Figma MCP": {
      "command": "npx",
      "args": ["-y", "figma-developer-mcp", "--figma-api-key=YOUR_FIGMA_TOKEN", "--stdio"]
    }
  }
}
```

**获取 Figma Token**：Figma → Settings → Security → Personal access tokens → Generate new token。

常用工具：`get_figma_data`、`download_figma_images`。

## 2. Chrome DevTools MCP

用于后续 review phase 的页面导航、截图与交互状态检视。

```json
{
  "mcpServers": {
    "chrome-devtools": {
      "command": "npx",
      "args": ["-y", "chrome-devtools-mcp@latest"]
    }
  }
}
```

需要本机已安装 Chrome / Chromium。

## 验证

配置完成后，在 Agent 对话中发送 Figma 链接测试：

```
按这个设计稿实现登录页：https://figma.com/design/xxx/...?node-id=1-2
```

Agent 应能调用 `get_figma_data` 并成功返回节点树。若报错 `Figma MCP: ...`，检查 token 权限与 node-id 格式。

## 可选：Figma Desktop MCP

若使用 Figma Desktop 客户端而非 API，[asset-pipeline.md](asset-pipeline.md) 支持 Desktop 分支。配置方式见 [Figma Desktop MCP 文档](https://github.com/anthropics/figma-mcp)（以官方最新说明为准）。
