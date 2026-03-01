// Worker 环境的资源文件加载器
// 仅在 Worker 入口 (index.ts) 中导入，不在 local.ts 中使用
// 通过 wrangler rules 将 .sql 文件打包为 Text 模块

import migrate_0001 from '../resource/migrate_0001.sql'
import migrate_0002 from '../resource/migrate_0002.sql'
import { registerFile } from './fileService'

// 注册所有资源文件
registerFile('src/resource/migrate_0001.sql', migrate_0001)
registerFile('src/resource/migrate_0002.sql', migrate_0002)
