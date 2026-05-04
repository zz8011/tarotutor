# AI塔罗导师 质量优化计划

> **For Hermes:** 按优先级从高到低执行，每完成一个 Phase 验证构建通过。

**Goal:** 将项目从 6.5/10 提升到 8.5+，修复所有 P0/P1 问题

**Architecture:** React 18 + Vite + TypeScript + Zustand

---

## Phase 1: P0 必须修复 (预估 20min)

### Task 1.1: 添加 React ErrorBoundary
- 创建 `src/components/ErrorBoundary.tsx`
- 在 App.tsx 中包裹 Routes
- 验证: 故意抛错测试降级UI

### Task 1.2: 修复首页导航按钮
- 已有 `useNavigate` + `navigate('/quiz')` 调用，需排查按钮点击不生效原因
- 可能是 JS 事件冒泡或按钮被遮挡
- 验证: 浏览器点击"性格测试"按钮能跳转

### Task 1.3: 配置 vitest 测试框架
- 安装 vitest + @testing-library/react + jsdom
- 创建 `vitest.config.ts`
- 在 package.json 添加 test 脚本
- 验证: `npm run test` 能运行

### Task 1.4: 编写核心数据单元测试
- `src/__tests__/tarotCards.test.ts` — 78张牌完整性
- `src/__tests__/mentors.test.ts` — 6导师数据完整
- `src/__tests__/quizQuestions.test.ts` — 计分和推荐逻辑
- 验证: 所有测试通过

---

## Phase 2: P1 应该修复 (预估 15min)

### Task 2.1: 开启 TypeScript strict 模式
- 修改 `tsconfig.app.json`: strict: true
- 修复因此暴露的类型错误
- 验证: tsc --noEmit 零错误

### Task 2.2: 优化构建产物 (按需加载)
- 78张牌数据已在 lazy 组件中，检查 tarotCards 是否打入主包
- 如果 store 引用 tarotCards 导致主包膨胀，改用动态 import
- 验证: 主包从 230KB 降低

### Task 2.3: 修复无障碍问题
- 返回按钮加 aria-label="返回"
- 发送按钮加 aria-label="发送"
- 输入框加 aria-label 或关联 label
- 验证: 无障碍扫描无 error

---

## Phase 3: P2 建议改进 (预估 10min)

### Task 3.1: 添加 SEO meta 标签
- index.html 添加 meta description
- 验证: 页面源码包含

### Task 3.2: 清理 console.warn (ai.ts)
- console.warn 用于开发模式提示，构建时保留但不影响体验
- 可选: 替换为自定义 logger

---

## 验证清单

每个 Phase 完成后执行:
- [ ] `npm run build` 通过
- [ ] `npm run test` 通过
- [ ] `npm run dev` 所有页面正常渲染
- [ ] 无 TypeScript 类型错误
