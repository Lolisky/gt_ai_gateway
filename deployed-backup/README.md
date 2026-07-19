# gt-gateway 线上部署版备份

来源: Cloudflare Worker "gt-gateway" 实际运行版本 (version #16, deployed 2026-07-01, 导出 2026-07-19)
文件: deployed-backup/worker-2026-07-19.js (esbuild bundle, 721KB, 无 sourcemap)

背景: 本仓库 master 于 2026-07-19 与上游 alexazhou/gt_ai_gateway 完全同步，
用户自研改版源码随之从所有代码库丢失。此 bundle 是该改版唯一存世实体。

改版独有功能（上游任何分支均无）:
- 模型分组: 按 vendor_model.name + aliases 聚合多上游路由
- 按 vendor.priority 排序的 fallback 循环 + circuit breaker (zn.isAvailable)
- 按 API 格式伪装 User-Agent: openai/responses=codex-cli/0.105.0, anthropic=claude-code/2.1.0
- 版本串仍为 1.7.3（基于 ~v1.7.x 改造）

已知缺陷:
- record.vendor_model_name 记录显示名(name||model_id)而非实际上游 model_id，
  配置 name!=model_id 的路由时日志与实际调用错位
- ormService 共享 D1 client + 每请求换 d1Driver 的并发 hack
