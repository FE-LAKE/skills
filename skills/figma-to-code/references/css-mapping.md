# Figma → CSS 速查（figma-to-code · Step 4/6）

Step 4/6 内部 reference：样式映射与代码生成时查阅。

| Figma 属性 | CSS 映射 | 备注 |
|------------|----------|------|
| `fills` (SOLID) | `background-color` / `color` | 文本节点用 `color`，容器用 `background-color` |
| `fills` (GRADIENT) | `background: linear-gradient(...)` | 按 gradientStops 与 gradientHandlePositions 换算角度 |
| `cornerRadius` | `border-radius` | 四角不同用四值简写 |
| `rectangleCornerRadii` | `border-radius: tl tr br bl` | 按顺序映射 |
| `stroke` | `border` | `strokeWeight` → width；`strokeAlign` 影响 box model |
| `effects` (DROP_SHADOW) | `box-shadow` | offsetX/Y、radius、spread、color |
| `effects` (INNER_SHADOW) | `box-shadow: inset ...` | |
| `effects` (LAYER_BLUR) | `filter: blur()` | 仅装饰层使用 |
| `fontSize` | `font-size` | 配合项目 rem/px 策略换算 |
| `fontWeight` | `font-weight` | |
| `fontFamily` | `font-family` | 优先映射项目字体 token |
| `lineHeight` | `line-height` | px 或 unitless |
| `letterSpacing` | `letter-spacing` | Figma 值为 px |
| `textAlignHorizontal` | `text-align` | LEFT/CENTER/RIGHT/JUSTIFIED |
| `opacity` | `opacity` | 节点级；fill opacity 需与 fill color alpha 合并 |
| `textAutoResize` | 宽度策略 | WIDTH_AND_HEIGHT → 不设宽；HEIGHT → 固定宽 |
| `layoutMode` (HORIZONTAL/VERTICAL) | `display: flex` + `flex-direction` | |
| `primaryAxisAlignItems` | `justify-content` | |
| `counterAxisAlignItems` | `align-items` | |
| `itemSpacing` | `gap` | |
| `padding*` | `padding` | 四边分别映射 |
| `absoluteBoundingBox` | `width` / `height` / `position` | 仅非 Auto Layout 或 overlay 时使用 absolute |

优先级：Figma 变量/Code Connect → 项目 token/class → CSS 变量 → Tailwind → 局部字面量。
