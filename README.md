ReadMe

# 项目命令
```
npm install
npm run dev
```

```
npm run deploy
```

# DB 管理工具

项目提供 `script/db.ts` 脚本用于数据库运维，支持以下命令和环境：

## 命令

| 命令 | 说明 |
|------|------|
| `migrate` | 执行待应用的数据库迁移 |
| `status` | 查看所有迁移文件的应用状态 |
| `clear` | 清空数据库（删除所有自定义表） |

## 环境（`--env`）

| 环境 | 说明 |
|------|------|
| `local`（默认） | 本地 Node.js 环境，操作 `local.db` |
| `worker-local` | Wrangler 本地 D1 模拟器 |
| `worker-cloud` | Cloudflare D1 云端数据库 |

## 使用示例

```bash
# 执行迁移（local 环境）
npm run db:migrate:local

# 查看迁移状态
npm run db:status:local

# 清空数据库
npm run db:clear:local

# 指定 worker 环境
npx tsx script/db.ts migrate --env worker-local
npx tsx script/db.ts migrate --env worker-cloud
```


