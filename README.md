# AI 塔罗导师 — Tarot Tutor

基于 React + TypeScript + Vite 构建的塔罗学习应用，支持 Web（H5）与微信小程序双端运行。
核心玩法：与 AI 导师多轮对话，按「观察 → 符号 → 教学 → 情境 → 测验」五阶段渐进式学习 78 张塔罗牌，并通过间隔复习巩固记忆。

## 技术栈

- React 19 + TypeScript 6
- Vite 6（构建工具）
- react-router-dom 7（页面路由）
- zustand + persist（状态管理，持久化到 localStorage）
- framer-motion（动画）
- lucide-react（图标）
- vitest + @testing-library/react（测试）
- 微信云函数 `tarot-chat`（AI 请求转发，密钥不落前端）

## 项目结构

```
src/
├── pages/              # 8 个页面组件（每页配套 .scss）
│   ├── HomePage.tsx          首页（每日抽牌、待复习提醒）
│   ├── QuizPage.tsx          性格测试（匹配导师）
│   ├── MentorSelectPage.tsx  导师选择
│   ├── LearnPage.tsx         学习会话（五阶段学习流程）
│   ├── CardLibraryPage.tsx   牌库（78 张牌浏览/搜索）
│   ├── SpreadPage.tsx        牌阵练习（梯度解锁 + 占卜历史）
│   ├── DiaryPage.tsx         学习日记（日历打卡 + 自动沉淀复述）
│   ├── ReviewPage.tsx        快速复习（到期卡测验）
│   └── ProfilePage.tsx       个人中心（真实成就 + 学习目标）
├── components/
│   ├── learn/                学习会话子组件（CardDisplay / ChatInterface /
│   │                         QuizPanel / ReflectionInput / StageProgress…）
│   ├── common/               通用组件
│   ├── AiResponse.tsx        AI 富文本渲染（DOMPurify 净化）
│   ├── BottomNav.tsx         底部导航
│   └── ErrorBoundary.tsx     错误边界
├── services/
│   ├── ai/                   AI 服务层
│   │   ├── client.ts             云函数/HTTP 代理调用封装
│   │   ├── stream.ts             chatCompletion / 流式输出 / mock 降级
│   │   ├── prompts.ts            各场景 prompt 构建
│   │   ├── config.ts             模型与云函数端点配置
│   │   └── index.ts              对外 API（今日运势/学牌/牌阵解读…）
│   └── learning/
│       └── lessonContent.ts      学习流程纯函数层（开场白/测验/情境/复习调度）
├── platform/           # 平台适配（wx 优先，Web 回退）
│   ├── feedback.ts           toast 提示
│   └── storage.ts            存储
├── data/               # 静态数据（78 张牌、6 位导师、题库、牌阵、资源清单）
├── store/              # zustand store（useAppStore）
├── types/              # 全局 TypeScript 类型
├── styles/             # tokens.css（设计变量唯一来源）+ global.scss
└── __tests__/          # 单元测试
cloudfunctions/
└── tarot-chat/         # 微信云函数：转发 AI 请求（DeepSeek 主 + GLM 备）
scripts/
└── dev-ai-proxy.mjs    # 本地 AI 代理（Web 开发时模拟云函数）
```

## 快速开始

```bash
npm install
npm run dev          # 启动开发服务器（无 Key 时 AI 自动降级为 mock 响应）
```

连接真实 AI 模型（Web 开发环境）：

```bash
cp .env.example .env.local   # 填入 DEEPSEEK_API_KEY（或 GLM_API_KEY）
npm run dev:proxy            # 终端 A：启动本地 AI 代理（默认 :8787）
npm run dev                  # 终端 B：启动前端
```

## 可用脚本

```bash
npm run dev        # 开发服务器
npm run dev:proxy  # 本地 AI 代理服务器（模拟云函数）
npm run build      # 生产构建（tsc + vite build）
npm run test       # 运行测试（vitest）
npm run lint       # ESLint 检查
npm run preview    # 预览构建产物
```

CI：GitHub Actions（`.github/workflows/ci.yml`）在 push/PR 时自动跑 lint + test + build。

## AI 调用架构

```
前端（Web / 小程序）
   │  不持有任何 API Key
   ├─ 微信小程序 → wx.cloud.callFunction('tarot-chat')
   ├─ Web 开发   → POST {VITE_API_PROXY_URL}/api/tarot-chat（dev-ai-proxy）
   └─ 无代理配置 → 开发环境降级 mock；生产环境抛错
                      │
                      ▼
            DeepSeek（主） → 失败自动切换 GLM（备）
```

## 设计规范

设计变量唯一来源是 `src/styles/tokens.css`，主要 token：

| Token | 值 | 用途 |
|-------|-----|------|
| `--bg-deep` | `#0f0d0a` | 页面背景 |
| `--bg-card` | `rgba(28, 23, 17, 0.9)` | 卡片背景 |
| `--color-primary` | `#d4b066` | 主色（鎏金） |
| `--color-emerald` | `#6fae9b` | 强调（青玉） |
| `--text-primary` | `#f0f0f0` | 主文字 |
| `--text-secondary` | `#c8bba5` | 次要文字 |

- 字体：标题 `Cinzel` / `Noto Serif SC`，正文 `Noto Sans SC`
- 圆角：6 / 8 / 10 / 16px，全圆 `9999px`

## 页面路由

| 路径 | 页面 | 说明 |
|------|------|------|
| `/` | 首页 | 每日抽牌、功能入口、待复习提醒 |
| `/quiz` | 性格测试 | 测试匹配 6 位导师 |
| `/mentors` | 导师选择 | 浏览/切换 AI 导师 |
| `/learn/:cardId?` | 学习会话 | 五阶段渐进学习单张牌 |
| `/library` | 牌库 | 78 张牌浏览/搜索 |
| `/spread` | 牌阵 | 经典牌阵练习（22/40/78 张梯度解锁，含占卜历史） |
| `/diary` | 日记 | 学习记录（日历按真实日期点亮） |
| `/review` | 快速复习 | 到期卡直接出测验，按间隔重复推进 |
| `/profile` | 个人中心 | 进度/成就勋章/每日学习目标 |

## 数据说明

- 78 张塔罗牌：22 张大阿尔卡纳 + 56 张小阿尔卡纳（4 花色 × 14 张）
- 6 位 AI 导师：星澜(Luna)、索尔(Sol)、米拉(Mira)、奥赖恩(Orion)、塞伦(Seren)、凯(Kai)
- 牌阵：单张、三张牌、关系之镜、马蹄形、凯尔特十字（按学习进度 22/40/78 张梯度解锁）
- 复习调度：按 1 → 3 → 7 → 14 → 30 天间隔安排复习；`/review` 出快速测验，全对推进间隔，有错次日重来
- 成就系统：`src/data/achievements.ts` 声明式规则表，学习/打卡/日记/占卜动作后自动评估解锁并弹 toast
- 连续打卡：基于本地时区日期（`src/utils/date.ts`）判定，同天去重，断签自动归一

## 注意事项

1. **API Key 安全**：前端不持有任何模型密钥。小程序密钥配置在云函数环境变量；Web 开发密钥仅供 `dev-ai-proxy` 本地读取（`.env.local` 已 gitignore）。
2. **XSS 防护**：所有 AI 返回文本经 `sanitizeAiText`（DOMPurify）净化后才渲染。
3. **图片资源**：牌面图片托管于 OSS/COS，经 `assetManifest` 解析；本地有兜底图。
4. **状态持久化**：学习进度通过 `zustand/persist` 保存到 localStorage（小程序映射至 wx storage）。

## 微信小程序适配

- 设计稿基准宽度：`375px`（iPhone SE/mini）
- 安全区域适配：底部导航避开 `env(safe-area-inset-bottom)`
- 平台分支统一收敛在 `src/platform/`（feedback、storage）
- 云函数部署：`cloudfunctions/tarot-chat/`，环境变量配置 `DEEPSEEK_API_KEY` / `GLM_API_KEY`

## 许可证

MIT
