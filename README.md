# AI 塔罗导师 — 微信小程序

基于 React + TypeScript + Vite 构建的塔罗学习小程序。

## 技术栈

- React 19.2 + TypeScript 6.0
- Vite 8.0 (构建工具)
- react-router-dom (页面路由)
- zustand + persist (状态管理)
- framer-motion (动画)
- lucide-react (图标)
- vitest + @testing-library/react (测试)

## 项目结构

```
src/
├── pages/          # 8 个页面组件
│   ├── HomePage.tsx        首页
│   ├── QuizPage.tsx        性格测试
│   ├── MentorSelectPage.tsx 导师选择
│   ├── LearnPage.tsx       学习会话
│   ├── CardLibraryPage.tsx 牌库
│   ├── SpreadPage.tsx      牌阵
│   ├── DiaryPage.tsx       日记
│   └── ProfilePage.tsx     个人中心
├── components/     # 共享组件
│   ├── BottomNav.tsx       底部导航
│   └── ErrorBoundary.tsx   错误边界
├── data/           # 静态数据
│   ├── tarotCards.ts       78 张塔罗牌数据
│   ├── mentors.ts          6 位 AI 导师
│   ├── quizQuestions.ts    性格测试题库
│   └── spreads.ts          牌阵定义
├── services/       # 业务服务
│   └── ai.ts               AI 对话服务
├── store/          # 状态管理
│   └── useAppStore.ts      zustand store
├── types/          # TypeScript 类型
│   └── index.ts
├── styles/         # 全局样式
│   └── global.scss         主题变量 + 动画
└── __tests__/      # 单元测试
```

## 可用脚本

```bash
npm run dev      # 开发服务器
npm run build    # 生产构建
npm run test     # 运行测试
npm run lint     # ESLint 检查
npm run preview  # 预览构建产物
```

## 设计规范

### 配色

| Token | 值 | 用途 |
|-------|-----|------|
| `--bg-deep` | `#0a0a1a` | 页面背景 |
| `--bg-card` | `#12122a` | 卡片背景 |
| `--primary-purple` | `#7c3aed` | 主色调 |
| `--accent-gold` | `#f59e0b` | 强调/高亮 |
| `--text-primary` | `#f1f5f9` | 主文字 |
| `--text-secondary` | `#94a3b8` | 次要文字 |

### 字体

- 标题：`Noto Serif SC`（衬线体，营造神秘感）
- 正文：`Noto Sans SC`（无衬线，保证可读性）

### 圆角

- 小：`8px`（按钮、标签）
- 中：`16px`（卡片）
- 大：`24px`（弹窗）
- 全圆：`9999px`（头像、FAB）

## 页面路由

| 路径 | 页面 | 说明 |
|------|------|------|
| `/` | 首页 | 每日抽牌、功能入口 |
| `/quiz` | 性格测试 | 10 题匹配 6 位导师 |
| `/mentors` | 导师选择 | 浏览/切换 AI 导师 |
| `/learn/:cardId?` | 学习会话 | AI 多轮对话学单张牌 |
| `/library` | 牌库 | 78 张牌浏览/搜索 |
| `/spread` | 牌阵 | 经典牌阵练习 |
| `/diary` | 日记 | 学习记录 |
| `/profile` | 个人中心 | 进度/成就/设置 |

## 数据说明

- 78 张塔罗牌：22 张大阿尔卡纳 + 56 张小阿尔卡纳（4 花色 × 14 张）
- 6 位 AI 导师：星澜(Luna)、索尔(Sol)、米拉(Mira)、奥赖恩(Orion)、塞伦(Seren)、凯(Kai)
- 牌阵：单张、三张、凯尔特十字、关系牌阵

## 注意事项

1. **API Key 安全**：`.env.local` 中的 `VITE_DEEPSEEK_API_KEY` 仅用于开发。生产环境必须通过后端代理。
2. **图片资源**：牌面图片位于 `public/cards/`，构建时自动复制到 `dist/`。
3. **状态持久化**：学习进度通过 `zustand/persist` 保存到 `localStorage`。

## 微信小程序适配

- 设计稿基准宽度：`375px`（iPhone SE/mini）
- 安全区域适配：底部导航避开 `env(safe-area-inset-bottom)`
- 禁止缩放：`viewport` 已设置 `maximum-scale=1.0, user-scalable=no`
- 主题色：`theme-color` 设为 `#0a0a1a` 匹配深色背景

## 许可证

MIT
