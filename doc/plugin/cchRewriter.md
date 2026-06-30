# CCH Rewriter (Context Caching Header Rewriter)

## 简介
`cchRewriter` 插件主要用于处理 Anthropic 协议下系统提示词（System Prompt）中关于缓存（Context Caching）的特定请求头（如 `x-anthropic-billing-header` 中包含的 `cch` 参数）。

## 工作原理
Anthropic 的 Prompt Caching 机制会在某些特定的计费或缓存标记变动时导致缓存失效。该插件通过拦截发送给上游 Anthropic 的请求体，利用正则表达式查找并在系统提示词中自动重写 `x-anthropic-billing-header` 里的 `cch` 值为固定的常量（如 `A1234`），以此来规避因为动态计费/缓存 ID 变化造成的缓存未命中问题。

## 处理逻辑
1. 检查 `upstreamBody` 中是否包含 `system` 字段。
2. 支持处理 `system` 字段为纯字符串格式，或包含 `type: "text"` 的区块数组格式。
3. 如果 `system` 内容以 `x-anthropic-billing-header:` 开头，则自动将其中的 `cch=...;` 替换为 `cch=A1234;`。
4. 修改完成后返回序列化后的 JSON，并在控制台记录 `[cchRewriter] Rewrote cch in system prompt`。

## 适用场景
主要针对请求 Anthropic 原生 API 时，优化和稳定系统层面的上下文缓存命中率。
