# Review Policy

Review phase 用于对已生成或已有实现进行 Figma 视觉评审、自动修复与复查。

## Entry Conditions

进入 review phase 前必须具备：

- Figma URL 与目标 node，可来自用户输入、review brief 或源码 `@figma` 文件头。
- 可访问的 dev URL，或明确的页面路由和启动方式。
- Chrome DevTools MCP 或等价的浏览器截图能力。
- 需要评审的文件列表、视口、技术栈、重要 assumptions。

缺少 Figma 参照截图或实现页截图能力时输出 `blocked: capability unavailable`，不要猜测视觉差异。

若是 review-only mode 且没有文件列表，先根据 dev URL/路由和 `@figma` 文件头定位候选页面文件；多页面命中时自主选择最匹配项，无法判断时再询问用户。

## Autonomy

视觉层问题默认自动修复，不询问用户。Agent 应在每轮选择 1-3 类最高影响差异，修改后重新截图验证。

只有以下情况需要 `needs_decision`：

- 修复必须改变业务逻辑、API、路由、状态模型或持久化结构。
- 修复必须改变组件公共 API。
- Figma 与用户显式需求冲突。
- 设计稿缺少关键状态或内容，且无法从项目上下文推断。

## Round Limit

默认最多 3 轮。若高影响差异仍明显，Agent 可自主扩展到最多 5 轮。

达到 5 轮后必须停止并报告剩余问题，不进入无限循环。

## Priority Order

每轮按影响排序，不把低影响颜色微调排在结构错位之前：

1. 布局结构、对齐、宽高。
2. 间距。
3. 字体。
4. 颜色。
5. 阴影、圆角、图标、图片资产。
6. 响应式视口细节。

## Fix Patterns

### Layout / Alignment / Size

- 优先修容器宽高、主轴方向、对齐方式、gap、padding。
- Figma Auto Layout 对应 flex/grid；absolute 只用于叠加层、徽标、装饰图形等定位语义明确的元素。
- 页面整体偏移时先检查 root/container/max-width，而不是逐个子元素微调。
- 多个元素同时错位时优先修父容器。

### Spacing

- 优先使用项目已有 spacing token、Tailwind scale 或 CSS 变量。
- 间距差异集中在同一区域时修父级 gap/padding；只有局部例外才修单个 margin。
- 不为 1-2px 微差打断更高影响问题；若同轮只剩细节，可统一微调。

### Typography

- 先匹配 font family、font size、line-height、font weight，再处理 letter-spacing。
- 项目已有字体 token 时复用 token；不要把语义 token 降级成裸值。
- 文本换行不一致时同时检查宽度、line-height 和 white-space，不只改字号。

### Color

- 先查项目 token；存在语义 token 时使用 token。
- Figma 色值没有 token 对应时允许使用字面色值，并在最终摘要标记 `literals`。
- 颜色微差优先级低于布局、间距、字体错位。

### Border / Radius / Shadow

- 圆角、边框、阴影属于视觉层，可直接修。
- 阴影缺失或过重时优先对齐 offset、blur、spread、opacity，不随意换成项目无关的阴影风格。
- 多层阴影如果项目栈不支持，保留主要视觉层并记录 assumption。

### Icons / Images / Assets

- 优先使用 Figma 导出的资产或项目已有同源资产。
- 可自动修尺寸、object-fit、对齐、裁切和容器比例。
- 资产内容缺失且无法导出时停止或使用用户已确认的 placeholder，不猜图片内容。

### Responsive / Viewport

- 使用用户指定视口；未指定时 H5 默认 `375x812`，PC 默认 `1440x900`。
- 参照图和实现截图必须使用同一视口语义。
- 修响应式时优先保持设计稿主视口准确，再补相邻断点的视觉稳定性。

## Validation

每轮修改后运行项目提供的相关 lint/typecheck。若项目没有明确命令，按 skill 主流程记录的候选命令尝试。

校验失败时优先修复由本轮改动引入的问题；不要顺手修无关历史问题。
