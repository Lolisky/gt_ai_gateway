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

- `routing_mode = single`: one upstream.
- `routing_mode = failover`: `routing_config.upstreams` is ordered from first choice to fallback.
- Every upstream has an explicit `vendor_id` and `vendor_model_id`; this is essential for aliases.
- On an upstream failure, C advances through the array. Health cooldown can temporarily skip an unhealthy upstream.
- The upstream request model is `vendor_model.model_id`; the client/request model remains `model.name`.

## Verified mapping

| Request model name(s) | Fallback order (vendor / vendor_model_id) |
|---|---|
| `claude-fable-5` | teamo / vm67 |
| `claude-opus-4-8` | teamo / vm66 → Krill Plan / vm73 |
| `claude-sonnet-5` | teamo / vm22 → Krill Plan / vm38 |
| `deepseek-v4-flash` | DeepSeek / vm29 → OpenCode Go Old / vm9 → OpenCode Go New / vm15 → aliyun / vm20 |
| `deepseek-v4-flash:free` | DeepSeek / vm29 → OpenCode Go Old / vm9 → OpenCode Go New / vm15 → aliyun / vm20 |
| `deepseek-ai/DeepSeek-V4-Flash` | DeepSeek / vm29 → OpenCode Go Old / vm9 → OpenCode Go New / vm15 → aliyun / vm20 |
| `deepseek-v4-pro` | DeepSeek / vm30 → OpenCode Go Old / vm10 → OpenCode Go New / vm14 → aliyun 2 / vm56 → aliyun / vm19 |
| `deepseek-ai/DeepSeek-V4-Pro` | DeepSeek / vm30 → OpenCode Go Old / vm10 → OpenCode Go New / vm14 → aliyun 2 / vm56 → aliyun / vm19 |
| `gemini-3.1-pro-preview` | teamo / vm68 → Krill Plan / vm72 |
| `gemini-3.5-flash` | teamo / vm25 → Krill Plan / vm37 |
| `glm-5.2` | teamo / vm71 → OpenCode Go Old / vm11 → OpenCode Go New / vm13 → aliyun 2 / vm57 → aliyun / vm17 → zai / vm80 |
| `GLM-5.2` | teamo / vm71 → OpenCode Go Old / vm11 → OpenCode Go New / vm13 → aliyun 2 / vm57 → aliyun / vm17 → zai / vm80 |
| `zai-org/GLM-5.2` | teamo / vm71 → OpenCode Go Old / vm11 → OpenCode Go New / vm13 → aliyun 2 / vm57 → aliyun / vm17 → zai / vm80 |
| `gpt-5.4-mini` | teamo / vm42 → Krill Plan / vm39 |
| `gpt-5.6-luna` | Krill Plan / vm76 |
| `gpt-5.6-sol` | teamo / vm69 → Krill Plan / vm74 |
| `gpt-5.6-terra` | teamo / vm70 → Krill Plan / vm75 |
| `grok-4.5` | Krill Plan / vm77 |
| `qwen3.8-max-preview` | aliyun 2 / vm55 → aliyun / vm53 |

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

For each row, confirm that every `vendor_model_id` exists and belongs to the declared `vendor_id`.
