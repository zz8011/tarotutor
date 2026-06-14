# tarotutor 后端 — SPARC Spec（S + A + P + R）

> SPARC: Specification → Pseudocode → Architecture → Refinement → Code
> 本文档固化前四步，Code 阶段按此实施。

## S — Specification（规格）

后端要解决的核心问题：当前数据全在浏览器 localStorage，换设备/清缓存即丢失；
导师每轮失忆。做线上服务必须：

1. **用户系统**：注册/登录（邮箱+密码起步），JWT 会话，数据按 user 隔离。
2. **学习数据持久**：进度/会话/学习日志(间隔重复)/日记/成就/占卜/每日牌 全上云。
3. **导师记忆（差异化核心）**：每用户每导师的事实记忆 + 向量检索，对话开场注入。
4. **多端复用**：Web 现在做，小程序迁移时后端 API 100% 复用。

非目标（本阶段不做）：微信登录、手机号、付费、管理后台、多语言。

## A — Architecture（架构）

栈（复用 sinktalk，零学习成本）：
- Fastify 5 + pg（原生 SQL，无 ORM）+ zod（校验）+ @fastify/helmet/rate-limit
- PostgreSQL + **pgvector**（关系数据 + 向量记忆一个库）
- 认证：bcrypt + JWT（复用 sinktalk `infra/auth/fastify-auth.ts` 模式）
- 迁移：原生 SQL migrations（复用 sinktalk `infra/db/run-migrations.ts` 模式）
- embedding：GPUStack Qwen3-Embedding-4B 2560d（已接，免费/离线）

后端目录（DDD，同构 sinktalk）：
```
server/
  src/
    domain/{user,progress,session,record,diary,achievement,divination,mentor}/
      schema.ts        # 该 domain 的 SQL + zod
      routes.ts        # Fastify 路由
    infra/
      auth/            # 复用 sinktalk fastify-auth 模式
      db/              # pg pool + run-migrations
      embedding/       # GPUStack Qwen3-Embedding 客户端
    app/server.ts      # Fastify 装配
  migrations/*.sql
```

部署：腾讯云 CVM（与 taro.renchengzhang.com 同台或新开），nginx 反代 /api → Fastify。

## P — Pseudocode（关键流程）

### 认证
register(email, pw): hash=bcrypt(pw) → INSERT users → return JWT(user_id)
login(email, pw): SELECT password_hash → bcrypt.compare → JWT(user_id)
中间件: verify(JWT) → req.userId（所有 /api 路由强制）

### 间隔重复（已有算法，搬后端）
on session_complete(card_id): record = upsert study_records(card_id, stage, mastered)
  if mastered: next_review_at = today + (reviewCount==0?1 :==1?3 :==2?7 :14)
晨间任务: SELECT * WHERE next_review_at <= today → 待复习列表

### 导师记忆（核心）
on session_end: facts = LLM_extract_facts(transcript)  # 用户偏好/进度/疑问
  for fact: emb = Qwen3-Embedding(fact); INSERT mentor_memory(user, mentor, fact, emb)
on session_start: q_emb = Qwen3-Embedding(开场语)
  memories = SELECT * FROM mentor_memory ORDER BY embedding <-> q_emb LIMIT 5
  prompt = system_prompt + memories.inject()
导师开口即带相关记忆 → "记得你"成立。

## R — Refinement（精化点）

1. **数据隔离**：所有表带 user_id，所有查询 WHERE user_id = req.userId（中间件强制）。
2. **前端 store 改造**：zustand persist 底层从 localStorage 切后端 API（游客 mode 仍 localStorage，
   登录后 sync），store action 签名不变 → 组件零改动。
3. **旧数据导入**：首次登录检测 localStorage 旧数据 → 一次性 POST /import → 清本地。
4. **向量维度**：mentor_memory.embedding = vector(2560)，对齐 GPUStack Qwen3-Embedding。
5. **AI 内容 sanitize**：保留现有 sanitizeAiText（prompt 注入防护），后端也过一遍。
6. **分阶段上线**：阶段1(骨架+认证+users) → 2(核心5表API) → 3(前端切换) → 4(占卜/每日) → 5(导师记忆)。
