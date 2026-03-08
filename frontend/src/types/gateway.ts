export type ApiFormat = 'openai' | 'anthropic';

export interface TestMessage {
    role: 'system' | 'user' | 'assistant';
    content: string;
}

export interface ApiTestRequest {
    format: ApiFormat;
    model: string;
    messages: TestMessage[];
    temperature?: number;
    max_tokens?: number;
    stream?: boolean;
}

export interface ApiTestHistory {
    id: string;
    timestamp: number;
    request: ApiTestRequest;
    response: string;
    status: 'success' | 'error' | 'pending';
}

export interface StreamChunk {
    choices?: Array<{
        index: number;
        delta?: {
            content?: string;
            role?: string;
        };
        finish_reason?: string | null;
    }>;
    usage?: {
        prompt_tokens: number;
        completion_tokens: number;
        total_tokens: number;
    };
}

export interface ApiTestState {
    format: ApiFormat;
    model: string;
    messages: TestMessage[];
    temperature: number;
    max_tokens: number;
    stream: boolean;
}
