# 图片资产（figma-to-code · Step 5）

Step 5 内部 reference：转码流程中下载图标/图片/SVG 时用；不单独作为入口。

## 连接方式

用户未说明时询问：Framelink 远程 MCP（默认）或 Figma Desktop MCP。

选定后全程不混用：Desktop 分支只用 Desktop 工具；远程分支只用 Framelink/API 工具。

## Framelink 分支

1. 读 `download_figma_images` schema
2. `localPath`：用户指定优先；否则扫描并沿用项目现有同类资产目录（如 `src/assets`、`public/assets`、`assets/images`、`public/images` 等）。无法判断时询问用户；图标同理，优先沿用现有 icons/assets 目录。
3. 含 `imageRef` 时必须传入；SVG 矢量可省略
4. 代码中必须真实引用；失败停止或经用户同意标记 `placeholder (user-approved)`

## Desktop 分支

1. 读 `use_figma` / Plugin API schema
2. 遍历节点导出 `exportSettings`（PNG/SVG/PDF）
3. 文件名清理：`node.name` → `[a-zA-Z0-9_]+`

## 批量去重

多 URL/多页面时按资源 URL 或 imageRef 去重，相同资源只下载一次。

## 输出

向主流程回报：`downloaded: N | linked: N | placeholder: N | deduped: N`
