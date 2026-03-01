import { ormService } from './service/ormService'
import './service/resourceLoader'  // Worker 环境：注册资源文件
import app from './routes'

// 初始化云端配置
await ormService.init({ mode: 'cloud' })

export default app
