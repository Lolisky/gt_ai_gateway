export interface DashboardStats {
    total_requests: number;
    success_count: number;
    failed_count: number;
    success_rate: number;
    active_users: number;
    active_models: number;
    today_requests: number;
}

export interface RecentRecord {
    id: number;
    user_name: string;
    model_name: string;
    status: string;
    created_at: string;
}

export interface TimeRangeStats {
    date: string;
    count: number;
    success_count: number;
    failed_count: number;
}
