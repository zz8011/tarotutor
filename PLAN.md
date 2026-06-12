# 塔罗项目修复计划 (gstack 评估后)

## 项目信息
- **项目**: tarot-tutor — AI 塔罗导师微信小程序
- **评估时间**: 2026-05-11
- **综合评分**: 5.95/10
- **当前分支**: main

## 修复原则 (Boil the Lake)
- 安全优先：P0 问题阻塞发布，必须修复
- 测试驱动：每个修复附带测试
- 渐进式：不破坏现有功能
- 文档同步：修改即更新

---

## P0 — 阻塞发布（立即执行）

### P0-1: 移除客户端直接 API 调用，强制云函数代理
**风险**: `VITE_DEEPSEEK_API_KEY` 等环境变量会打包到客户端代码中，任何人都可以通过浏览器 DevTools 获取 API Key。

**修改范围**:
- `src/services/ai.ts`: 移除 `AI_CONFIG` 直接调用逻辑
- 保留云函数代理作为唯一调用方式
- 开发环境通过本地代理服务器转发

**验收标准**:
- [ ] 生产构建中不包含任何 API Key
- [ ] 开发环境通过代理访问 API
- [ ] 所有 AI 调用走 `callCloudProxy`

### P0-2: 添加 DOMPurify 清理 AI 输出（XSS 防护）
**风险**: AI 返回的内容直接渲染到 DOM，如果 AI 返回 `<script>` 标签会被执行。

**修改范围**:
- `src/utils/aiText.ts`: 集成 DOMPurify
- `src/components/AiResponse.tsx`: 确保渲染前净化
- `package.json`: 添加 `dompurify` 依赖

**验收标准**:
- [ ] AI 输出中的 HTML 标签被净化
- [ ] 保留允许的格式（换行、列表）
- [ ] 测试验证 XSS payload 被过滤

---

## P1 — 高优先级（本周内）

### P1-3: 拆分 services/ai.ts 为多个模块
**问题**: 658 行单文件，包含配置、请求、提示词、流处理、错误处理等多重职责。

**目标结构**:
```
src/services/ai/
├── index.ts          # 统一导出
├── config.ts         # AI 配置（模型、温度等）
├── client.ts         # HTTP 客户端（fetch/wx.request 封装）
├── prompts.ts        # 提示词模板
├── stream.ts         # 流式响应处理
└── types.ts          # 服务层类型
```

**验收标准**:
- [ ] 每个文件 < 200 行
- [ ] 无循环依赖
- [ ] 所有现有功能保持不变

### P1-4: 编写 LearnPage 组件测试
**问题**: 已安装 `@testing-library/react` 和 `vitest` 但未写任何组件测试。

**测试范围**:
- `src/pages/LearnPage.test.tsx`: 学习流程测试
- `src/components/AiResponse.test.tsx`: AI 响应渲染测试
- `src/store/useAppStore.test.ts`: 状态管理测试

**验收标准**:
- [ ] 测试覆盖率 > 60%（核心文件）
- [ ] CI 中测试通过
- [ ] 模拟 AI 响应（不调用真实 API）

### P1-5: 配置 Vite manualChunks 代码分割 + 关闭生产 sourcemap
**问题**: 所有代码打包到一个 bundle，sourcemap 暴露源码。

**修改范围**:
- `vite.config.ts`: 添加 `manualChunks` 配置
- `vite.config.ts`: 生产环境关闭 sourcemap

**验收标准**:
- [ ] 生产构建生成多个 chunk
- [ ] 首屏加载 < 200KB (gzip)
- [ ] sourcemap 不在生产构建中

---

## P2 — 中优先级（2 周内）

### P2-6: 拆分 LearnPage.tsx 为子组件
**问题**: 1128 行单文件，包含学习流程的所有 UI 逻辑。

**目标结构**:
```
src/components/learn/
├── CardDisplay.tsx      # 牌面展示
├── ChatInterface.tsx    # 对话界面
├── StageProgress.tsx    # 阶段进度
├── QuizPanel.tsx        # 测验面板
├── ReflectionInput.tsx  # 反思输入
└── SymbolExtractor.tsx  # 符号提取
```

**验收标准**:
- [ ] LearnPage < 300 行
- [ ] 子组件可独立测试
- [ ] 无 props drilling（使用 context 或 store）

### P2-7: 添加图片懒加载
**问题**: 78 张牌面图片可能影响首屏性能。

**修改范围**:
- `src/components/cards/CardImage.tsx`: 新建懒加载组件
- `src/pages/CardLibraryPage.tsx`: 使用懒加载
- `src/pages/HomePage.tsx`: 每日抽牌图片懒加载

**验收标准**:
- [ ] 首屏只加载可见图片
- [ ] 滚动时平滑加载
- [ ] 有占位符/骨架屏

### P2-8: 清理空组件目录
**问题**: `achievement`, `cards`, `chat`, `common` 等目录为空，增加认知负担。

**修改范围**:
- 删除空目录
- 或将相关组件移入

**验收标准**:
- [ ] 无空目录
- [ ] 目录结构清晰

---

## P3 — 低优先级（1 个月内）

### P3-9: 将 activeDeck 全局变量改为 React state
**问题**: `tarotCards.ts` 中使用 `let activeDeck` 全局变量，不是纯函数，测试困难。

**修改范围**:
- `src/data/tarotCards.ts`: 移除全局变量
- `src/store/useAppStore.ts`: 添加 deck 状态
- 所有使用 `getCardImagePath` 的地方传入 deck 参数

**验收标准**:
- [ ] 无全局可变状态
- [ ] 测试可预测
- [ ] 牌组切换即时响应

### P3-10: 提取共用类型定义
**问题**: `dailyCard` 和 `dailyGuidance` 类型重复定义。

**修改范围**:
- `src/types/index.ts`: 提取 `DailyCardInfo` 共用类型
- 更新所有引用

**验收标准**:
- [ ] DRY 原则
- [ ] 类型检查通过

---

## 执行顺序

```
Phase 1 (Day 1-2):  P0-1 + P0-2  → 安全修复
Phase 2 (Day 3-5):  P1-3 + P1-5  → 架构优化
Phase 3 (Day 6-7):  P1-4         → 测试补充
Phase 4 (Week 2):   P2-6 + P2-7  → 性能优化
Phase 5 (Week 3-4): P2-8 + P3-9 + P3-10 → 代码整洁
```

## 检查点

每个 Phase 完成后：
1. 运行 `npm run build` 确保构建成功
2. 运行 `npm run lint` 确保无新警告
3. 运行 `npm run test` 确保测试通过
4. Git commit: `fix(gstack): <phase description>`
