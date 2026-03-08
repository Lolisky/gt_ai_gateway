import type { BaseEntity, PaginationParams } from './index';

export type RequestStatus = 'init' | 'processing' | 'success' | 'failed';

export interface Record extends BaseEntity {
    user_id: number | null;
    model_id: number | null;
    request_data: string | null;
    response_data: string | null;
    status: RequestStatus | null;
    prompt_tokens: number | null;
    output_tokens: number | null;
    first_token_latency: number | null;
    start_at: string | null;
    end_at: string | null;

    // 关联数据
    user_name?: string;
    vendor_name?: string;
    model_name?: string;
}

export interface RecordRequestData {
    model: string;
    messages: Array<{
        role: string;
        content: string;
    }>;
    temperature?: number;
    max_tokens?: number;
    stream?: boolean;
}

export interface RecordResponseData {
    choices?: Array<{
        index: number;
        message?: {
            role: string;
            content: string;
        };
        delta?: {
            content: string;
        };
        finish_reason: string | null;
    }>;
    usage?: {
        prompt_tokens: number;
        completion_tokens: number;
        total_tokens: number;
    };
    error?: {
        message: string;
        code?: string;
    };
}

export interface RecordQuery extends PaginationParams {
    status?: RequestStatus;
    user_name?: string;
    model_name?: string;
    start_time?: string;
    end_time?: string;
}

export interface RecordListResponse {
    list: Record[];
    total: number;
}
