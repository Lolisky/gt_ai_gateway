# Responses Prompt Cache Key Rewriter

## 简介
`responsesPromptCacheKeyRewriter` 插件主要用于 OpenAI Responses API 协议，目的是在请求体中自动注入 `prompt_cache_key` 以提高缓存命中率。

## 工作原理
在使用部分兼容或基于 OpenAI Responses API 扩展的接口时（例如 O1 或部分中转服务），通过在 JSON 请求体中显式指定一个业务/客户端维度的 `prompt_cache_key`，可以让服务端针对相同的 Prompt 提供更有效的粘性路由和缓存优化。

## 处理逻辑
1. 接收网关透传的 `upstreamBody`、`hostKey` 以及客户端标识 `clientName`。
2. 解析 `upstreamBody`，如果请求体中已经包含有效的 `prompt_cache_key`（不为空），则跳过处理，尊重客户端原始配置。
3. 如果未包含，则调用 `buildResponsesPromptCacheKey` 自动生成一个缓存键：
   - 格式为：`{safeHostKey}:{safeClientName}`
   - 默认容错：如果 `hostKey` 为空则降级为 `local`，如果 `clientName` 为空则降级为 `unknown`。
4. 将生成的 `prompt_cache_key` 注入回 JSON 请求体中并序列化返回。

## 适用场景
适用于网关接收客户端的 OpenAI Responses API 格式请求时，统一附加粘性路由标记，以此获得更好的供应商侧 Prompt 缓存性能。可以在前端的高级设置中动态启用或关闭。
