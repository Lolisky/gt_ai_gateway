# Responses → OpenAI 协议转换器

## 目标

实现 `ResponsesToOpenAIConverter`：客户端用 Responses API 格式，上游用 OpenAI Chat Completions 格式。

- `clientFormat = ApiFormat.RESPONSES`，`upstreamFormat = ApiFormat.OPENAI`
- `convertRequest`: ResponsesRequest → OpenAIRequest
- `convertResponse`: OpenAIResponse → ResponsesNonStreamResponse
- `convertStreamEvent`: OpenAIChunk → Responses 流式事件

注册到 `ConverterFactory`，并把它接入 `resolveUpstreamFormat` 的 fallback 列表，让 Responses 客户端在只有 OpenAI 上游时也能用。

## 设计

### 1. 新建 `src/util/protocolConverter/ResponsesToOpenAIConverter.ts`

参照 `ResponsesToAnthropicConverter`（请求侧 Responses→X、响应侧 X→Responses、流式 X→Responses）和 `AnthropicToOpenAIConverter`（OpenAI 请求/响应目标）。

#### convertRequest: ResponsesRequest → OpenAIRequest

- `instructions` → system message
- `input` 字符串 → `{role:"user", content:"..."}`
- `input` 数组项：
  - `message` role=system/developer → system message
  - `message` role=user/assistant，content parts：
    - `input_text`/`output_text` → 拼成 `content` 字符串
    - `input_image` → OpenAI 多模态 content 数组 `{type:"image_url", image_url:{url}}`（若混入文本则用数组形式）
  - `function_call` → assistant message 带 `tool_calls`
  - `function_call_output` → `{role:"tool", tool_call_id, content}`
  - `reasoning` → 跳过（OpenAI Chat Completions 没有等价输入项；reasoning 由模型内部处理）
- `max_output_tokens` → `max_tokens`
- `temperature`/`top_p` 直传
- `tools`（function 类型）→ OpenAI `{type:"function", function:{name,description,parameters}}`
- `tool_choice` → OpenAI tool_choice（auto/none/required/{type:"function",name})
- `reasoning.effort` → `reasoning_effort`（用 `thinkingConfigToOpenAI(buildThinkingConfigFromOpenAIResponses(req.reasoning))`）

#### convertResponse: OpenAIResponse → ResponsesNonStreamResponse

- `choices[0].message.content` → output `{type:"message", role:"assistant", status:"completed", content:[{type:"output_text", text}]}`
- `choices[0].message.reasoning_content` → output `{type:"reasoning", summary:[{type:"summary_text", text}]}`
- `choices[0].message.tool_calls[]` → output `{type:"function_call", call_id, name, arguments, status:"completed"}`
- `finish_reason` → 顶层 `status`（"completed" 或 "failed"）
- `usage`：`prompt_tokens`→`input_tokens`、`completion_tokens`→`output_tokens`、`total_tokens`、`prompt_tokens_details.cached_tokens`→`input_tokens_details.cached_tokens`、`completion_tokens_details.reasoning_tokens`→`output_tokens_details.reasoning_tokens`
- `id` 用 `requestId || upstreamRes.id`，`created_at` 用 `Math.floor(Date.now()/1000)`

#### doConvertStreamEvent: OpenAIChunk → Responses 事件

状态机字段（仿 `ResponsesToAnthropicConverter`）：
- `seq`、`responseId`、`currentMsgId`、`messageOpen`、`contentPartOpen`
- `textBuf`、`inputTokens`、`outputTokens`、`cacheReadTokens`
- `reasoningActive`、`reasoningItemId`、`reasoningBuf`、`reasoningIndex`
- `funcArgsBuf`/`funcNames`/`funcCallIds`（按 OpenAI tool_call index 归集）
- `createdEmitted`（首帧发 response.created + response.in_progress）

OpenAI 流式帧处理：
1. 首个 chunk（`delta.role` 存在或首次进入）：发 `response.created` + `response.in_progress`，从 chunk 拿 model/id
2. `delta.reasoning_content`：发 reasoning 的 `output_item.added` + `reasoning_summary_part.added`（首次），然后 `reasoning_summary_text.delta`
3. `delta.content`：发 message 的 `output_item.added` + `content_part.added`（首次），然后 `output_text.delta`
4. `delta.tool_calls`：新 id → `output_item.added`（function_call）；arguments → `function_call_arguments.delta`
5. `finish_reason` 出现：收尾各 open block（`output_text.done`/`content_part.done`/`output_item.done`、`function_call_arguments.done`/`output_item.done`、reasoning 的 done），把 finish_reason 映射到 status，但不在这里发 `response.completed`（等 usage 帧）
6. usage 帧（choices 为空、含 usage）：发 `response.completed`（带最终 output 数组、usage、status）
7. `[DONE]`：`handleDoneEvent` 默认返回空（response.completed 已在 usage 帧发；若未发则兜底发）

finish_reason → status 映射：`stop`/`tool_calls`/`length`/`content_filter` → `completed`（OpenAI 没有显式 failed finish_reason，错误走非 200 路径）。

### 2. 注册到 ConverterFactory

`ConverterFactory.create` 增加：
```ts
if (clientFormat === ApiFormat.RESPONSES && upstreamFormat === ApiFormat.OPENAI) {
    return new ResponsesToOpenAIConverter(requestModel);
}
```
删除该处 `Responses ↔ OpenAI` 的「暂不支持」注释中 RESPONSES→OPENAI 那行。反向（OPENAI→RESPONSES）仍不实现，保留注释。

### 3. 接入 resolveUpstreamFormat fallback

`src/service/senderService.ts`：
```ts
[ApiFormat.RESPONSES]: [ApiFormat.ANTHROPIC, ApiFormat.OPENAI],
```
（OPENAI 的 fallback 不动，仍只有 ANTHROPIC，因为 OPENAI→RESPONSES 未实现）

### 4. 单元测试

新建 `tests/unit/protocolConverter/ResponsesToOpenAIConverter.test.ts`，仿 `ResponsesToAnthropicConverter.test.ts` 结构：
- convertRequest：纯文本、string input、instructions→system、多模态图片、function_call/function_call_output、tools、tool_choice、reasoning
- convertResponse：纯文本、tool_calls、reasoning_content、usage 映射（含 cached_tokens）
- convertStreamEvent：纯文本流、tool_call 流、reasoning 流、usage 帧 → response.completed
- ConverterFactory 路由：RESPONSES→OPENAI 返回新 converter

### 5. 不在范围

- 不实现 `OpenAIToResponsesConverter`（OpenAI 客户端 → Responses 上游），ConverterFactory 该方向继续返回 null
- 不改 `handleResponsesStreamResponse`/`handleResponsesNonStreamResponse`，现有 dispatch 已支持（format=RESPONSES 时走这两个函数，converter 把 OpenAI 事件/响应转成 Responses）
- 不动 sseAccumulator / responsesAccumulator

## 自检
- `npm run backend:test:type`
- `npx vitest --run tests/unit/protocolConverter`
- 视情况跑 `tests/api/ai` 端到端（mock 上游是 OpenAI 格式，配一个 Responses 客户端模型可触发转换路径）
