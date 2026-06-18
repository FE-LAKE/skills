# Execution Policy

Agent 执行 `figma-to-code` 时应遵守以下策略。这里不是用户说明文档；Agent 应基于 Figma MCP、项目代码、浏览器截图与工具结果自主推进。

## Core Rule

默认相信 Agent 的判断。能从工具和代码证据确认的事情直接执行，不为视觉层或展示层细节反复询问用户。

必须停止的情况只有：

- Figma MCP、Figma token 或目标 node 不可用，导致无法读取设计稿。
- 用户未提供且项目中无法推断目标技术栈或落地路径。
- 需要修改业务逻辑、API、路由、状态模型、持久化结构或组件公共 API。
- 图片资产缺失且没有可接受的 Figma 导出、项目现有资产或用户确认的 placeholder。

## Evidence Order

决策依据按优先级使用：

1. 用户显式要求。
2. Figma MCP 返回的节点、截图、尺寸、样式、资产信息。
3. 当前项目已有组件、样式系统、token、目录约定和 lint/typecheck 命令。
4. 浏览器或 DevTools 的页面截图与运行时结果。
5. 工程常识推断。

若 1-4 足以判断，直接执行。只有会改变非视觉行为或公共接口时才输出 `needs_decision`。

## Code Generation Scope

允许自动生成或修改：

- 页面/组件的展示结构。
- spacing、size、color、typography、border、radius、shadow。
- flex/grid 布局、响应式断点、safe-area 视觉适配。
- 图片、图标、静态资产引用与尺寸对齐。
- 展示层 TODO，例如 `// TODO: wire handler`。

禁止自动生成或修改：

- 真实 API 请求、权限、登录态、表单提交、校验规则。
- 路由结构、状态管理、数据模型、持久化结构。
- 已发布组件的公共 props / events / slots 语义。
- 与 Figma 无关的重构。

## Figma Data Gate

`get_figma_data` 成功前禁止输出界面代码。失败时报告错误类型并停止，不用想象补 UI。

允许基于 Figma 节点与项目模式做工程推断，例如组件拆分、class 命名、响应式容器写法；不允许在缺少设计稿数据时猜测布局、颜色、字体或图片内容。

## Review Phase Handoff

代码生成、资产处理、lint/typecheck 结束后进入 review phase。先生成 review brief，包含 Figma URL、修改文件、dev URL、视口、技术栈、assumptions 与校验结果。

若宿主支持 subagent 或等价隔离执行能力，优先把 review brief 交给隔离执行。若不支持，则在当前会话中按同一份 brief 执行独立评审步骤。当前会话 fallback 时，不要沿用生成阶段的视觉猜测；只使用 brief、Figma 参照、实现截图与代码证据做判断。
