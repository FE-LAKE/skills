# 图片资产（figma-to-code · Step 5）

Step 5 内部 reference：转码流程中下载图标/图片/SVG 时用；不单独作为入口。

## 连接方式

用户未说明时询问：Framelink 远程 MCP（默认）或 Figma Desktop MCP。

选定后全程不混用：Desktop 分支只用 Desktop 工具；远程分支只用 Framelink/API 工具。

## Framelink 分支

1. 读 `download_figma_images` schema
2. `localPath`：默认 `public/images` 或用户指定；图标常用 `public/icons`
3. 含 `imageRef` 时必须传入；SVG 矢量可省略
4. 代码中必须真实引用；失败停止或经用户同意标记 `placeholder (user-approved)`

## Desktop 分支

1. 读 `use_figma` / Plugin API schema
2. 遍历节点导出 `exportSettings`（PNG/SVG/PDF）
3. 文件名清理：`node.name` → `[a-zA-Z0-9_]+`

## 批量去重

多 URL/多页面时按资源 URL 或 imageRef 去重，相同资源只下载一次。

## 图标入口（可选）

用户要求 SVGR 集成时，生成 `components/icons/index.ts` 统一 export。

## 输出

向主流程回报：`downloaded: N | linked: N | placeholder: N | deduped: N`
