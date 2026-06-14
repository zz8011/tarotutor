# tarot-tutor 健康修复 + taro.renchengzhang.com 部署 实现计划

> **For agentic workers:** REQUIRED SUB-SKILL: superpowers:subagent-driven-development. 蜂群按模块边界并行, 每路 subagent 只改文件不 commit, 控制器统一验证 + commit。

**Goal:** 清掉 knip/shellcheck 暴露的真实死代码与脚本问题, 让 `/health` 维度可恢复, 然后 ship 到 GitHub 并部署到 taro.renchengzhang.com。

**Architecture:** 4 路蜂群按模块边界切(data / ai / hooks+types / cleanup+ops), 模块内自治处理连锁。控制器统一跑 tsc + eslint + vitest + knip + shellcheck 抓残余连锁, 全绿后单次 commit。部署走现有 deploy/deploy-tencent.sh(SSH 到腾讯云 CVM, /var/www/tarot-tutor, nginx reload)。

**Tech Stack:** React 19 + Vite 6 + TS 6 + Zustand + vitest 4 + eslint 10 + knip + shellcheck + 腾讯云 CVM + 阿里云 OSS + nginx。

---

## 探查基线 (2026-06-14)

- tsc: 0 error, eslint: 0 problem, vitest: 64/64
- knip: 2 unused files, 20 unused exports, 20 unused types, 2 duplicate exports, 1 unlisted binary (powershell, 跨平台误报)
- shellcheck: deploy-tencent.sh SC1090 (disable 注释失效) + SC2029 (info)
- 部署: taro.renchengzhang.com 零配置; OSS bucket 是占位符

---

## 蜂群任务分解

### 流 A1: data 模块死代码

**Files:**
- Modify: `src/data/spreads.ts:213-237` (删 getSpreadByChineseName, getSpreadsByCardCount, getAllSpreadIds, getSpreadCount)
- Modify: `src/data/achievements.ts:87+, 9+` (删 getAchievementRuleById 函数 + AchievementContext 类型; 先确认未被文件内其它代码引用)
- Modify: `src/data/mentors.ts:11+` (删 MentorColorTheme 类型)
- Delete: `src/data/tarotDeckGuides.ts` (整文件, 仅 tarotDeckGuides 一个 export 且未用)

**Steps:**
1. 删除上述导出/类型/函数声明
2. 删除整个 `src/data/tarotDeckGuides.ts`
3. `npx tsc -b --noEmit` 预期 0 error (若报未定义, 说明 knip 漏了内部引用, 恢复并上报)
4. 不 commit

### 流 A2: services/ai 模块死代码

**Files:**
- Modify: `src/services/ai/index.ts` (删 8 个 re-export: CLOUD_FUNCTIONS, proxyBaseURL, isWechat, callCloudProxy, buildCardLearningPrompt, buildSpreadInterpretationPrompt, buildDailyCardPrompt, buildWelcomePrompt)
- Modify: `src/services/ai/prompts.ts:51+,62+` (删 buildDeckPromptContext, buildCardVisualContext)
- Modify: `src/services/ai/types.ts` (删 5 类型: ChatCompletionOptions, ChatMessage, TarotCard, CardSpread, TarotDeck)

**Steps:**
1. 删 index.ts 的 8 个 re-export 行
2. 删 prompts.ts 2 个函数 (连带其内部依赖若变未用一并清)
3. 删 types.ts 5 个类型
4. tsc 预期 0 error
5. 不 commit

### 流 A3: hooks + types barrel + learning 死代码

**Files:**
- Modify: `src/hooks/useFireflies.ts` (修重复导出: 去掉 `export { useFireflies }` 或 `export default` 其一, 保留未用 default 则一并简化)
- Modify: `src/hooks/useMagicParticles.ts` (同上)
- Modify: `src/components/learn/index.ts` (删未用 re-export: ReflectionInput; 类型 CardDisplayProps, ChatInterfaceProps, StageProgressProps, QuizPanelProps, ReflectionInputProps, Orientation)
- Modify: `src/types/index.ts` (删未用类型 re-export: Arcana, Suit, Element, PersonalityDimension, MessageRole, SpreadPosition, CourseModule)
- Modify: `src/services/learning/lessonContent.ts:170+` (删 sanitizeUserInput)

**Steps:**
1. 修 hooks 重复导出
2. 删 barrel 未用 re-export
3. 删 sanitizeUserInput
4. tsc 预期 0 error
5. 不 commit

### 流 A4: 孤立文件删除 + shellcheck + knip 配置

**Files:**
- Delete: `cloudfunctions/tarot-chat/index.js` (云函数, 非前端代码, knip 误扫; 先 grep 全仓确认无 import 引用)
- Delete: `scripts/static-preview.cjs` (未用脚本, grep 确认)
- Modify: `deploy/deploy-tencent.sh:32-33` (把 `# shellcheck disable=SC1090` 移到紧贴 `source "$ENV_FILE"` 上一行, 让 disable 生效)
- Create: `knip.jsonc` (project 内忽略 powershell binary + cloudfunctions 目录)

**knip.jsonc 内容:**
```jsonc
{
  "$schema": "https://unpkg.com/knip@latest/schema.json",
  "ignoreBinaries": ["powershell"],
  "ignore": ["cloudfunctions/**"]
}
```

**Steps:**
1. grep 确认 cloudfunctions/tarot-chat/index.js 与 scripts/static-preview.cjs 无引用后删除
2. 修 shellcheck disable 位置
3. 写 knip.jsonc
4. shellcheck 复跑预期 0 warning; knip 复跑预期只剩合理的 unlisted (若有)
5. 不 commit

---

## 控制器: 统一验证 + 连锁收尾

所有蜂群完成后:
1. `npx tsc -b --noEmit` — 0 error
2. `npx eslint .` — 0 problem
3. `npx vitest run` — 64/64
4. `npx knip --no-exit-code` — 检查连锁是否暴露新未用; 有则补一轮删除
5. `shellcheck deploy/*.sh` (docker) — 0 warning
6. 重跑 `/health` 出新仪表盘, 对比趋势

---

## Ship

```bash
git add -A
git status   # 人工确认无意外文件 (dist/, node_modules/ 等应被 .gitignore)
git commit -m "refactor: 清理 knip 死代码 + 修 shellcheck SC1090 + 配 knip.jsonc

- 删 40+ 未用导出/类型/函数 (data/ai/hooks/types 模块)
- 删 2 孤立文件 (cloudfunctions/tarot-chat, scripts/static-preview.cjs)
- 修 deploy-tencent.sh shellcheck disable 注释位置
- 加 knip.jsonc 忽略 powershell/cloudfunctions
- 恢复 /health 死代码维度检测能力"
git push origin master
```

---

## Deploy (阻塞: 需用户提供 OSS bucket / DNS / HTTPS 决策)

前置: 用户提供真实 OSS_ASSET_BASE_URL + 确认 taro.renchengzhang.com DNS + HTTPS 方案。

1. 写 `.env.tencent.local` (gitignored):
   - TENCENT_SSH_HOST=tencent-cloud (复用 ~/.ssh/config 别名)
   - TENCENT_REMOTE_DIR=/var/www/tarot-tutor
   - ASSET_BASE_URL=<真实 OSS URL>
2. 服务器侧 nginx server_name 改/加 taro.renchengzhang.com, 配 HTTPS (certbot 或通配证书)
3. `bash deploy/deploy-tencent.sh`
4. 验证: `curl -I https://taro.renchengzhang.com` + 浏览器打开确认卡牌图加载
