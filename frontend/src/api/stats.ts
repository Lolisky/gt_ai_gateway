import request from '@/utils/request';
import type { DashboardStats, RecentRecord } from '@/types/stats';

export function getDashboardStats(): Promise<DashboardStats> {
    return request.get('/stats/dashboard.json');
}

export function getRecentRecords(limit?: number): Promise<RecentRecord[]> {
    return request.get('/stats/recent.json', { params: { limit } });
}
