export enum SgRecordStatus {
    INIT = "init",
    PROCESSING = "processing",
    SUCCESS = "success",
    FAILED = "failed",
}

export enum FailedCode {
    CLIENT_DISCONNECTED = "client_disconnected",
    UPSTREAM_DISCONNECTED = "upstream_disconnected",
    STREAM_INCOMPLETE = "stream_incomplete",
    UPSTREAM_ERROR = "upstream_error",
}

export enum VendorAuthMode {
    API_KEY = "api_key",
    BEARER_TOKEN = "bearer_token",
}

export enum ApiFormat {
    OPENAI = "openai",
    ANTHROPIC = "anthropic",
    RESPONSES = "responses",
    // [image-patch 2026-07-22] 文生图透传格式（/v1/images/generations）
    IMAGE = "image",
}

export enum ModelRoutingMode {
    SINGLE = "single",
    LOAD_BALANCE = "load_balance",
    FAILOVER = "failover",
}

export const UPSTREAM_FAILURE_COOLDOWN_MS = 30_000;

// [image-patch 2026-07-22] image 上游故障形态=挂起数小时~数天(如 krill 2026-07-21)，
// 短冷却会导致每个请求都拿超时去"探尸"，故 image 冷却 24h；恢复探测成本=每天1次超时
export const IMAGE_UPSTREAM_FAILURE_COOLDOWN_MS = 24 * 60 * 60 * 1000;

// [image-patch 2026-07-22] image 上游总超时：gpt-image-2 正常 18~53s，60s 区分"慢"与"挂死"
export const IMAGE_UPSTREAM_TIMEOUT_MS = 60_000;

export const RETRYABLE_UPSTREAM_STATUS_CODES = [
    401,
    403,
    408,
    429,
    500,
    502,
    503,
    504,
];

export enum ClientName {
    CLAUDE_CODE = "claude-code",
    CODEX = "codex",
}

export enum ConnectionMode {
    GATEWAY = "gateway",
    VENDOR = "vendor",
    OFFICIAL = "official",
}

export enum RunMode {
    WORKER = "worker",
    NODE = "node",
}

export enum RecordPayloadStorage {
    AUTO = "auto",
    DATABASE = "database",
    R2 = "r2",
}

export enum UserType {
    NORMAL = "normal",
    ADMIN = "admin",
    ROOT = "root",
}

export enum UserStatus {
    ACTIVE = "active",
    DISABLED = "disabled",
}

export const ROOT_USER_ID = -1;

export enum ConfigKey {
    CCH_REWRITE_ENABLED = "cch_rewrite_enabled",
    RESPONSES_PROMPT_CACHE_KEY_ENABLED = "responses_prompt_cache_key_enabled",
    CLAUDE_CODE_TRACKING_REWRITE_ENABLED = "claudecode_tracking_rewrite_enabled",
    HOST_KEY = "host_key",
    STREAM_LOG_ENABLED = "stream_log_enabled",
    AUTO_UPDATE_ENABLED = "auto_update_enabled",
    TELEMETRY_DISABLED = "telemetry_disabled",
    RECORD_PAYLOAD_ENABLED = "record_payload_enabled",
    RECORD_PAYLOAD_STORAGE = "record_payload_storage",
    MODULE_BILLING_ENABLED = "module_billing_enabled",
    MODULE_API_PLAYGROUND_ENABLED = "module_api_playground_enabled",
}
