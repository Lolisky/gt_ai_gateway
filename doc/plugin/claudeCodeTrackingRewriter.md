# Claude Code Tracking Rewriter

## 简介
`claudeCodeTrackingRewriter` 插件主要用于拦截和清理官方 Claude Code 客户端发送给大模型系统提示词中的隐藏追踪信息（如时间戳、地区、时区、以及相关公司二进制标记等）。

## 工作原理
Claude Code 客户端在发起请求时，常常会在 System Prompt 首个区块内植入一段包含客户端元数据的跟踪文本（例如当前具体的日期、时间、时区和一些标识二进制数据）。由于这些时间或区域信息是强动态的，在每一次请求时都会发生细微的变化，从而严重破坏了 Anthropic Prompt Caching 机制的命中率。
此插件通过拦截外发请求并做精准清洗，移除了这些追踪标记，使得请求能够最大概率地复用已有的 Context Cache，从而节省大量 Token 花费并降低请求延迟。

## 处理逻辑
1. 解析 `upstreamBody` 请求体，验证当前 `clientName` 是否包含或等于 `claudecode` 标识。
2. 检查 `system` 字段，确认是否为数组格式且至少包含一个文本区块（通常这种 tracking info 会附加在第一个 block）。
3. 使用精确匹配的模式寻找包含特定文本（如 `This is the current date:` 和 `This is the current date and time:` 连带时区的字符串）以及紧随其后的 `<binary>...` 和相关 `<example>` 引导文本。
4. 将匹配到的动态跟踪区块安全剔除，同时保留用户正常的 System 提示词内容不变。
5. 成功剔除后，序列化并覆盖更新原始请求体。

## 适用场景
在使用 Claude Code 命令行工具，且对接网关时建议开启此功能。可以在网关前端的“高级设置”中通过“屏蔽 Claude Code 跟踪”选项来统一管理它的启用状态。
