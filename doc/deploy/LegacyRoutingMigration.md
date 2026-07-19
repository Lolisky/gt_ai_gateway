# Legacy model routing map for C branch

## Decision

This migration carries only the request-model → ordered-upstream mapping. It does **not** import historical `record` rows or payloads.

For compatibility, the five legacy aliases are represented by separate enabled rows in `model`. No alias feature or source-code patch is required.

## Required import order

1. Deploy the C branch and run all built-in migrations (`npm run db:migrate:worker-cloud`).
2. Import `vendor` and `vendor_model`, preserving their original numeric IDs. The seed references those IDs.
3. Execute `legacy-routing-model-seed.sql` against the new D1.
4. Verify the model list and send one test request for each configured client model name.

Only the new D1 is written. Keep the old D1 unchanged as the rollback point.

## Fallback semantics

- Legacy `vendor.priority` semantics (confirmed with the original designer): **smaller value = higher preference = tried first**.
- `routing_mode = single`: one upstream.
- `routing_mode = failover`: `routing_config.upstreams` is ordered from first choice to last fallback (priority ascending).
- Every upstream has an explicit `vendor_id` and `vendor_model_id`; this is essential for aliases.
- On an upstream failure, C advances through the array. Health cooldown can temporarily skip an unhealthy upstream.
- The upstream request model is `vendor_model.model_id`; the client/request model remains `model.name`.

## Verified mapping (first choice → last fallback, vendor priority in parentheses)

| Request model name(s) | Order (vendor(prio) / vendor_model_id) |
|---|---|
| `claude-fable-5` | teamo(90) / vm67 |
| `claude-opus-4-8` | Krill Plan(10) / vm73 → teamo(90) / vm66 |
| `claude-sonnet-5` | Krill Plan(10) / vm38 → teamo(90) / vm22 |
| `deepseek-v4-flash` | aliyun(20) / vm20 → OpenCode Go New(25) / vm15 → OpenCode Go Old(26) / vm9 → DeepSeek(50) / vm29 |
| `deepseek-v4-flash:free` | aliyun(20) / vm20 → OpenCode Go New(25) / vm15 → OpenCode Go Old(26) / vm9 → DeepSeek(50) / vm29 |
| `deepseek-ai/DeepSeek-V4-Flash` | aliyun(20) / vm20 → OpenCode Go New(25) / vm15 → OpenCode Go Old(26) / vm9 → DeepSeek(50) / vm29 |
| `deepseek-v4-pro` | aliyun(20) / vm19 → aliyun 2(21) / vm56 → OpenCode Go New(25) / vm14 → OpenCode Go Old(26) / vm10 → DeepSeek(50) / vm30 |
| `deepseek-ai/DeepSeek-V4-Pro` | aliyun(20) / vm19 → aliyun 2(21) / vm56 → OpenCode Go New(25) / vm14 → OpenCode Go Old(26) / vm10 → DeepSeek(50) / vm30 |
| `gemini-3.1-pro-preview` | Krill Plan(10) / vm72 → teamo(90) / vm68 |
| `gemini-3.5-flash` | Krill Plan(10) / vm37 → teamo(90) / vm25 |
| `glm-5.2` | zai(4) / vm80 → aliyun(20) / vm17 → aliyun 2(21) / vm57 → OpenCode Go New(25) / vm13 → OpenCode Go Old(26) / vm11 → teamo(90) / vm71 |
| `GLM-5.2` | zai(4) / vm80 → aliyun(20) / vm17 → aliyun 2(21) / vm57 → OpenCode Go New(25) / vm13 → OpenCode Go Old(26) / vm11 → teamo(90) / vm71 |
| `zai-org/GLM-5.2` | zai(4) / vm80 → aliyun(20) / vm17 → aliyun 2(21) / vm57 → OpenCode Go New(25) / vm13 → OpenCode Go Old(26) / vm11 → teamo(90) / vm71 |
| `gpt-5.4-mini` | Krill Plan(10) / vm39 → teamo(90) / vm42 |
| `gpt-5.6-luna` | Krill Plan(10) / vm76 |
| `gpt-5.6-sol` | Krill Plan(10) / vm74 → teamo(90) / vm69 |
| `gpt-5.6-terra` | Krill Plan(10) / vm75 → teamo(90) / vm70 |
| `grok-4.5` | Krill Plan(10) / vm77 |
| `qwen3.8-max-preview` | aliyun(20) / vm53 → aliyun 2(21) / vm55 |

## Five compatibility aliases

| Alias | Canonical mapping |
|---|---|
| `deepseek-v4-flash:free` | `deepseek-v4-flash` routing chain |
| `deepseek-ai/DeepSeek-V4-Flash` | `deepseek-v4-flash` routing chain |
| `deepseek-ai/DeepSeek-V4-Pro` | `deepseek-v4-pro` routing chain |
| `GLM-5.2` | `glm-5.2` routing chain |
| `zai-org/GLM-5.2` | `glm-5.2` routing chain |

Aliases found in the source configuration:
`GLM-5.2`, `zai-org/GLM-5.2`, `deepseek-ai/DeepSeek-V4-Flash`, `deepseek-v4-flash:free`, `deepseek-ai/DeepSeek-V4-Pro`.

## Validation SQL

```sql
SELECT id, name, enable, routing_mode, routing_config FROM model ORDER BY id;
```

For each row, confirm that every `vendor_model_id` exists and belongs to the declared `vendor_id`, and that vendor priorities are non-decreasing along each chain.
