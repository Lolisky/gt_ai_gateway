# GT Gateway C 版上线部署档案（2026-07-20）

> 本文件为运维档案，不含任何 token/密钥。私密导入 SQL 位于 `private/`（含 token，禁止提交/外传）。

## 生产现状（已验证）

| 项 | 值 |
|---|---|
| 生产 Worker | `gt-gateway`（自定义域名 `gate.newszzx.net` 挂载于此） |
| 中间 Worker | `gt-ai-gateway`（无域名，冗余，可保留或日后由用户删除） |
| 生产 D1 | `gt_ai_gateway_v2` = `f95c5a35-913f-49af-bb79-4856690fe1bf` |
| 旧 D1（回滚点，勿删） | `gt_ai_gateway` = `1938b437-d251-49de-b2ff-6ff44f1d8d2a` |
| 代码 | Lolisky/gt_ai_gateway master `dfddfdf`（C routing 版 + /v1 兼容） |
| R2 | 未绑定（wrangler token 无 r2 权限）→ payload 落 D1 `storage_record` 表 |
| ROOT_TOKEN | gt-gateway 原有 secret，覆盖部署自动保留 |

## 端到端验证结果（gate.newszzx.net）

- 前端新版资源 `main-B_DxuBB9.js` ✅
- `/v1/models`（旧路径兼容）200，19 个模型（14 基础 + 5 别名）✅
- `/llm/v1/models` 200 ✅
- `/v1/chat/completions` glm-5.2 真实调用 200 ✅
- 新库 record：请求模型=glm-5.2（model_id 正确解析，旧日志错位 bug 修复）、首选 zai(priority 4，升序生效)、openai→anthropic 协议转换 ✅

## 部署命令序列（可复现）

```bash
# 在 fork/ 目录（需要项目内 wrangler 4，全局 wrangler 3 不兼容此配置）
npm install
npx wrangler d1 create gt_ai_gateway_v2
# wrangler.toml: database_name/database_id 指向 v2
npx tsx script/db.ts migrate --env worker-cloud --db-name gt_ai_gateway_v2
npx wrangler d1 execute gt_ai_gateway_v2 --remote --file ../private/import_v2.sql
npx wrangler d1 execute gt_ai_gateway_v2 --remote --file doc/deploy/legacy-routing-model-seed.sql
npm ci --prefix frontend --progress=false && npm run frontend:build
npx wrangler deploy --minify --config .wrangler.deploy.toml   # .wrangler.deploy.toml = wrangler.toml 去掉 r2_buckets 段
```

## 踩坑记录

1. D1 `--file` 导入拒绝显式 `BEGIN TRANSACTION`（导入本身原子）。
2. 官方 migration 会预置一行 config → 导入旧 config 前需 `DELETE FROM config`。
3. C 版 LLM 路径是 `/llm/v1/*`，旧版是 `/v1/*` → 已加兼容路由（src/routes.ts）。
4. 裸 urllib 调 workers.dev 被 Cloudflare 边缘 1010 拦截 → 需浏览器 UA。
5. 部署到与域名挂载无关的 Worker 不会影响线上 → 先确认域名挂在哪个 Worker。

## 回滚

- 代码回滚：旧自研 bundle 在 `origin/backup/deployed-worker-20260719`（worker-2026-07-19.js.min），重新部署到 gt-gateway 并把 DB 绑定指回旧 D1 即可。
- 数据回滚：旧 D1 原封未动。

## 用户待办

1. 打开 https://gate.newszzx.net/ 验证管理后台可用原 ROOT_TOKEN 登录。
2. 绑 GitHub Actions 时设置 secrets：`CLOUDFLARE_ACCOUNT_ID`、`CLOUDFLARE_API_TOKEN`、`ROOT_TOKEN`、`CLOUDFLARE_D1_NAME=gt_ai_gateway_v2`。
3. 观察期过后可自行删除旧 D1 / gt-ai-gateway Worker（不紧急）。
4. 如需 R2：建桶 `gt-ai-gateway-objects` 后恢复 wrangler.toml 的 r2 绑定段再部署。
