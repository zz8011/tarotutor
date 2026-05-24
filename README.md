# AI 塔罗导师

基于 React + TypeScript + Vite 构建的塔罗学习应用。

## 技术栈

- **前端框架**: React 19 + TypeScript 6 + Vite 6
- **路由**: react-router-dom
- **状态管理**: zustand + persist
- **动画**: framer-motion
- **图标**: lucide-react
- **测试**: vitest + @testing-library/react
- **代码规范**: ESLint

## 快速开始

```bash
# 安装依赖
npm install

# 本地开发
npm run dev

# 生产构建
npm run build

# 运行测试
npm run test

# 代码检查
npm run lint
```

## 项目结构

```
tarot-tutor/
├── src/
│   ├── pages/          # 页面组件 (8个)
│   ├── components/     # 共享组件
│   ├── data/           # 静态数据 (塔罗牌、导师、牌阵等)
│   ├── services/       # 业务服务 (AI对话)
│   ├── store/          # Zustand状态管理
│   ├── types/          # TypeScript类型定义
│   ├── styles/         # 全局样式
│   └── utils/          # 工具函数
├── public/
│   └── cards/          # 78张塔罗牌牌面图片
├── cloudfunctions/     # 腾讯云函数 (后端代理)
├── deploy/             # 部署脚本
└── docs/               # 设计文档
```

## 核心功能

- **首页**: 每日抽牌、学习入口
- **性格测试**: 10题匹配AI导师
- **学习会话**: AI多轮对话学单张牌
- **牌库**: 78张塔罗牌浏览搜索
- **牌阵练习**: 单张、三张、凯尔特十字等
- **日记**: 学习记录

## 页面路由

| 路径 | 页面 |
|------|------|
| `/` | 首页 |
| `/quiz` | 性格测试 |
| `/mentors` | 导师选择 |
| `/learn/:cardId?` | 学习会话 |
| `/library` | 牌库 |
| `/spread` | 牌阵 |
| `/diary` | 日记 |
| `/profile` | 个人中心 |

## 环境变量

```bash
# 本地开发 (开发环境)
cp .env.local .env.local

# 生产环境配置
cp .env.production .env.production
```

## 部署

```bash
# 腾讯云部署
npm run deploy:tencent

# 上传静态资源到COS
npm run cos:upload
```

## License

MIT