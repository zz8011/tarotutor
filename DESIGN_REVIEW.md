# GSTACK DESIGN REVIEW REPORT — tarot-tutor

## 审查概览

| 项目 | 值 |
|------|-----|
| 审查技能 | design-review (gstack core pack) |
| 审查范围 | 全部 SCSS/CSS 文件 + tokens + 组件样式 |
| 审查文件 | 15 个样式文件 |
| 设计系统 | Superdesign AI Design System |

---

## 设计系统审计

### 设计令牌 (tokens.css) — 状态: 良好

**优点:**
- 完整的 CSS 变量系统，颜色、字体、间距、圆角、阴影全覆盖
- 语义化命名 (`--bg-deep`, `--text-primary`, `--color-emerald`)
- RGB 变体支持 rgba() 使用 (`--bg-deep-rgb`, `--color-primary-rgb`)
- 字体栈有中文回退: `'Noto Serif SC', 'Noto Sans SC', PingFang SC`
- 圆角按规范设置: 6px/8px/10px

**问题:**
| 行 | 问题 | 严重程度 |
|----|------|----------|
| 14-42 | `global.scss` 重复定义了 `:root` 变量，与 `tokens.css` 重复 | LOW |
| 28 | `--text-primary` 在 global.scss 中是 `#f0f0f0`，tokens.css 中是 `#f4ead8`，不一致 | MEDIUM |
| 33 | `--border-subtle` 在 global.scss 中是 `0.1` 透明度，tokens.css 中是 `0.2` | LOW |

**建议:** 移除 `global.scss` 中的 `:root` 重复定义，统一引用 `tokens.css`。

---

## 颜色审计

### 整体调色板 — 状态: 优秀

**优点:**
- 深色主题一致性高，`#0f0d0a` 深棕黑背景营造神秘氛围
- 金色主色 `#d4b066` 有温度，不是死板的纯金
- 翡翠绿 `#6fae9b` 和玫瑰棕 `#a76552` 作为辅助色有层次感
- 没有纯黑/纯灰，所有中性色都有暖色调

**问题:**
| 文件 | 行 | 问题 | 严重程度 |
|------|-----|------|----------|
| global.scss | 117 | `.text-gradient` 使用硬编码色值 `#f3e5ab`, `#8b6e37`，未使用 token | LOW |
| global.scss | 196 | `.btn-gold` 使用硬编码渐变 `#d4b066` → `#8b6e37`，应使用 `--color-primary` 和 `--color-primary-dark` | LOW |
| CardLibraryPage.scss | 107 | `.filter-tab.active` 背景渐变硬编码 | LOW |
| ProfilePage.scss | 301 | `.badge-circle` 边框使用 `var(--color-primary)`，但 locked 状态使用 `var(--border-subtle)`，对比度可能不足 | LOW |

---

## 排版审计

### 字体系统 — 状态: 良好

**优点:**
- 三层字体: `Cinzel` (展示) → `Noto Serif SC` (标题) → `Noto Sans SC` (正文)
- 中文回退完整
- 字重分级清晰: 300/400/500/600/700/800

**问题:**
| 文件 | 行 | 问题 | 严重程度 |
|------|-----|------|----------|
| global.scss | 83 | Google Fonts 使用 `@import url()`，会阻塞渲染。建议改用 `<link rel="preload">` | MEDIUM |
| HomePage.scss | 33 | `.title-gradient` 字体大小 `28px` 不在 token 中 (`--text-4xl: 30px`) | LOW |
| LearnPage.scss | 42 | `.card-arcana` 使用 `10px` 不在 token 中 (`--text-xs: 10px`，刚好匹配) | OK |
| SpreadPage.scss | 47 | `.header-title` `22px` 不在 token 中 | LOW |

**建议:** 所有字体大小应使用 token 变量，避免硬编码。

---

## 间距审计

### 间距系统 — 状态: 良好

**优点:**
- 有系统化的 spacing token: 4px/8px/16px/24px/32px/48px
- 页面底部统一留出 nav 高度 + safe-area
- 组件内部间距一致

**问题:**
| 文件 | 行 | 问题 | 严重程度 |
|------|-----|------|----------|
| HomePage.scss | 28 | header padding `56px 24px 0` — 56px 是硬编码状态栏高度，应考虑安全区 | LOW |
| HomePage.scss | 56 | `.home-main` padding `32px 24px` — 混合使用 px 和 token | LOW |
| LearnPage.scss | 11 | header padding `56px 20px 10px` — 左右不对称 (20px vs 其他页面 24px) | LOW |
| CardLibraryPage.scss | 11 | header padding `56px 20px 16px` — 同上 | LOW |
| ProfilePage.scss | 12 | header padding `56px 24px 32px` — 底部 32px 与其他页面不一致 | LOW |

**建议:** 统一所有页面的 header padding，使用 token 变量。

---

## 布局审计

### 页面结构 — 状态: 良好

**优点:**
- 所有页面使用 `min-height: 100vh` 确保填满屏幕
- 底部导航固定定位，内容区域预留 padding
- 移动端优先设计，max-width 限制在 480px

**问题:**
| 文件 | 行 | 问题 | 严重程度 |
|------|-----|------|----------|
| global.scss | 111 | `.page-container` 使用 `padding-bottom: calc(var(--nav-height) + env(safe-area-inset-bottom) + 16px)`，但部分页面没有使用这个 class | LOW |
| HomePage.scss | 2 | `.home-page` 自己定义了 padding-bottom，与 `.page-container` 重复 | LOW |
| BottomNav.scss | 18 | `pointer-events: none` 在容器上，但子元素 `pointer-events: auto` — 这种 hack 可能导致点击穿透问题 | MEDIUM |
| CardLibraryPage.scss | 131 | `.card-grid` 使用 `grid-template-columns: repeat(3, 1fr)`，在超窄屏 (<320px) 可能太挤 | LOW |
| ProfilePage.scss | 170 | `.stats-row` 使用 `grid-template-columns: repeat(3, 1fr)`，同样问题 | LOW |

---

## 交互审计

### 状态与反馈 — 状态: 良好

**优点:**
- 按钮有 `:active` 状态 (scale 0.96/0.97)
- 输入框有 `:focus` 状态 (边框高亮)
- 导航项有 active 指示器 (顶部金色线条)
- 卡片翻转动画使用 `preserve-3d` 和 `backface-visibility`

**问题:**
| 文件 | 行 | 问题 | 严重程度 |
|------|-----|------|----------|
| global.scss | 205 | `.btn-gold` 没有 `:hover` 状态，桌面端反馈不足 | MEDIUM |
| global.scss | 224 | `.btn-ghost` 没有 `:hover` 状态 | MEDIUM |
| BottomNav.scss | 38 | `.nav-item` 只有 `:active`，没有 `:hover` | LOW |
| CardLibraryPage.scss | 137 | `.card-tile` 有 `transition: transform 0.2s` 但没有定义 hover 时的 transform | LOW |
| LearnPage.scss | 217 | `.orient-btn` 和 `.flip-btn` 没有 `:hover` 状态 | LOW |
| SpreadPage.scss | 336 | `.draw-btn` 没有 `:hover` 状态 | LOW |

**建议:** 为所有交互元素添加 `:hover` 状态，提升桌面端体验。

---

## 动画审计

### 动效系统 — 状态: 优秀

**优点:**
- 丰富的动画: twinkle, fadeIn, shimmer, rise, deal-fly, spin, firefly-float, particle-fly
- 使用 CSS 变量控制动画参数 (`--tx`, `--ty`, `--move-x`, `--move-y`)
- 缓动函数有设计感: `cubic-bezier(0.23, 1, 0.32, 1)` (ease-out), `cubic-bezier(0.175, 0.885, 0.32, 1.275)` (bounce)
- 卡片翻转使用 3D transform

**问题:**
| 文件 | 行 | 问题 | 严重程度 |
|------|-----|------|----------|
| global.scss | 162-182 | 所有动画都是 `infinite`，没有考虑 `prefers-reduced-motion` | MEDIUM |
| global.scss | 279 | `.firefly` 动画 4s infinite，对敏感用户可能造成不适 | LOW |

**建议:** 添加 `@media (prefers-reduced-motion: reduce)` 规则，禁用或简化动画。

---

## 响应式审计

### 移动端适配 — 状态: 良好

**优点:**
- 使用 `env(safe-area-inset-bottom)` 处理 iPhone 刘海
- 底部导航适配安全区
- SpreadPage 有 `@media (max-width: 359px)` 和 `@media (min-width: 560px)` 断点

**问题:**
| 文件 | 行 | 问题 | 严重程度 |
|------|-----|------|----------|
| 全局 | - | 缺少平板 (768px+) 和桌面 (1024px+) 的断点处理 | MEDIUM |
| CardLibraryPage.scss | 131 | 三列网格在平板可能仍然太宽 | LOW |
| HomePage.scss | 76 | `.card-container` 固定宽度 180px，在大屏上显得太小 | LOW |
| ProfilePage.scss | 170 | `.stats-row` 三列在宽屏上拉伸过度 | LOW |

**建议:** 添加更多断点: 768px (平板), 1024px (小桌面), 1440px (大桌面)。

---

## 反模式检查 (Anti-Patterns)

### 检查结果

| 反模式 | 状态 | 说明 |
|--------|------|------|
| 紫色渐变/青色光晕 AI-saas 调色板 | 未出现 | 金色+翡翠绿+玫瑰棕，有特色 |
| 蓝色作为默认强调色 | 未出现 | 使用金色 |
| 纯黑/纯灰死中性色 | 未出现 | 所有中性色都有暖色调 |
| Bootstrap 卡片默认布局 | 未出现 | 自定义卡片设计 |
| 卡片嵌套 | 未出现 | 无嵌套卡片 |
| 所有内容居中 | 未出现 | 有明确的左对齐和居中混合 |
| 等间距 everywhere | 未出现 | 间距有层次 |
| 重边框分隔符 | 未出现 | 使用细边框或背景色区分 |
| 4等宽统计卡片 | 未出现 | Profile 使用3列，但有内容支撑 |
| 每页相同卡片网格结构 | 未出现 | 各页面布局不同 |
| 暗模式作为默认因为"dashboard" | 不适用 | 暗色主题是产品定位 |
| 少于5个部分的侧边栏导航 | 未出现 | 使用底部导航 |
| 每部分相同视觉权重 | 未出现 | 有明确的 hero/次要区分 |
| rounded-lg 每个表面 | 轻微 | 大部分圆角适中，但可检查 |
| zinc/slate 唯一背景调色板 | 未出现 | 使用暖棕色系 |
| 缺少 hover/focus/active 状态 | 出现 | 多个按钮缺少 hover |
| 弹性缓动 | 未出现 | 使用合理的缓动函数 |
| 触摸优先表面的仅悬停 affordance | 未出现 | 移动端设计 |
| 微小点击目标 | 未出现 | 按钮最小 42-44px |
| 模态框因为更容易 | 未出现 | 模态使用合理 |
| 彩色图标圆圈不在 brief 中 | 未出现 | 图标使用品牌色 |
| 占位符文案 | 未出现 | 使用真实内容 |
| 随机阴影/光晕/模糊作为"润色" | 轻微 | 金色阴影有目的性 |
| 无信息价值的装饰性 sparkline | 未出现 | 无图表 |
| 流氓间距值和近失对齐 | 轻微 | 部分硬编码间距 |

---

## 可访问性审计

### A11y 检查 — 状态: 需改进

**问题:**
| 文件 | 行 | 问题 | 严重程度 |
|------|-----|------|----------|
| global.scss | 98 | 自定义滚动条宽度 3px，可能难以触摸 | LOW |
| global.scss | 189-228 | `.btn-gold` 和 `.btn-ghost` 没有 `:focus-visible` 样式 | MEDIUM |
| BottomNav.scss | 20 | `.nav-item` 是 `<button>`，但没有 `aria-label` | LOW |
| LearnPage.scss | 498 | `textarea` 没有关联的 `<label>` | MEDIUM |
| SpreadPage.scss | 114 | `.question-input` 没有关联的 `<label>` | MEDIUM |
| 全局 | - | 没有 `:focus-visible` 的全局样式 | MEDIUM |

**建议:**
1. 添加全局 `:focus-visible` 样式
2. 为所有输入框添加 `<label>` 或 `aria-label`
3. 确保颜色对比度符合 WCAG AA 标准

---

## 设计评分

| 维度 | 评分 | 说明 |
|------|------|------|
| 颜色系统 | 8.5/10 | 暖色调深色主题有特色，token 化良好，少量硬编码 |
| 排版系统 | 7.5/10 | 三层字体栈优秀，但部分硬编码大小 |
| 间距系统 | 7/10 | 有 token，但页面间不一致 |
| 布局结构 | 7.5/10 | 移动端优先，但缺少平板/桌面断点 |
| 交互反馈 | 6.5/10 | active 状态完整，但 hover 缺失较多 |
| 动画动效 | 8/10 | 丰富有设计感，但缺少 reduced-motion 支持 |
| 响应式 | 6/10 | 移动端良好，但缺少大屏适配 |
| 可访问性 | 5.5/10 | focus 状态缺失，部分输入无 label |
| 设计一致性 | 7/10 | 整体一致，但 token 重复定义和硬编码值 |
| **总分** | **7.0/10** | 良好，有设计感，但细节需打磨 |

---

## 修复建议 (按优先级)

### HIGH (建议立即修复)

1. **统一设计令牌**: 移除 `global.scss` 中的 `:root` 重复定义，统一引用 `tokens.css`
2. **添加 hover 状态**: 为 `.btn-gold`, `.btn-ghost`, `.nav-item`, `.card-tile` 等添加 `:hover`
3. **添加 focus-visible**: 全局添加 `:focus-visible` 样式
4. **支持 prefers-reduced-motion**: 为所有动画添加媒体查询

### MEDIUM (建议本轮修复)

5. **统一 header padding**: 所有页面 header 使用相同的 padding token
6. **字体大小 token 化**: 移除所有硬编码字体大小
7. **添加响应式断点**: 768px, 1024px, 1440px
8. **修复颜色不一致**: `--text-primary` 和 `--border-subtle` 统一

### LOW (可延后)

9. **Google Fonts 预加载**: 改用 `<link rel="preload">`
10. **输入框 label**: 为所有输入添加 `<label>` 或 `aria-label`
11. **卡片网格自适应**: 小屏时改为 2 列
