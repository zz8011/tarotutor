# 微信小程序适配说明

当前工程仍是 React + Vite Web 版本，但已经按“小程序优先”的方向做了第一层隔离和移动端重构。

## 已完成的适配基础

- 视觉容器收敛到 `--page-max: 480px`，底部导航统一使用安全区 `env(safe-area-inset-bottom)`。
- 持久化入口集中到 `src/platform/storage.ts`，Web 使用 `localStorage`，微信环境可直接走 `wx.getStorageSync` / `wx.setStorageSync`。
- 首页底部导航复用 `src/components/BottomNav.tsx`，减少页面级重复实现。
- AI 请求已存在云函数优先分支：微信环境使用 `wx.cloud.callFunction`，生产环境避免在前端暴露模型 API Key。
- 设计 token 集中在 `src/styles/global.scss`，后续迁移到 `app.wxss` 或 Taro/uni-app 主题变量时有单一来源。

## 迁移建议

1. 技术路线优先选 Taro + React 或 uni-app Vue/React。
   当前项目组件和状态逻辑偏 React，Taro 迁移成本最低。

2. 将页面组件按路由拆成小程序页面。
   当前路由与页面基本一一对应：`/`、`/quiz`、`/mentors`、`/learn`、`/library`、`/spread`、`/diary`、`/profile`。

3. 替换 Web-only API。
   重点排查 `alert`、`prompt`、`fetch`、`window`、DOM ref 滚动、`input onKeyPress`。对应替换为 `wx.showToast`、`wx.showModal`、`wx.request`、`ScrollView` 等。

4. 图片资源进入小程序静态资源或 CDN。
   78 张牌面图片体积较大，建议压缩后上 CDN，页面里保留稳定的资源映射。

5. 动画降级。
   `framer-motion` 在小程序不可直接使用。迁移时把页面进场、卡牌翻转等动画整理为 CSS animation 或 Taro/uni-app 支持的动画 API。

## 需要继续处理的文件

- `src/pages/ProfilePage.tsx`：`prompt` 需要替换成跨端弹窗组件。
- `src/pages/SpreadPage.tsx`：`alert` 需要替换成跨端 toast。
- `src/services/ai.ts`：Web 开发 fallback 使用 `fetch`，小程序生产应固定走云函数。
- `src/pages/LearnPage.tsx`：聊天区滚动行为需要小程序 `ScrollView` 版本。
