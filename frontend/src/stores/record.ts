import { defineStore } from 'pinia';
import { ref, computed } from 'vue';
import { listRecords, latestRecords, getRecord } from '@/api/record';
import type { Record, RecordQuery } from '@/types/record';

export const useRecordStore = defineStore('record', () => {
    // State
    const records = ref<Record[]>([]);
    const currentRecord = ref<Record | null>(null);
    const total = ref(0);
    const loading = ref(false);
    const autoRefresh = ref(false);

    // Getters
    const hasRecords = computed(() => records.value.length > 0);

    // Actions
    async function fetchRecords(query?: RecordQuery): Promise<void> {
        loading.value = true;
        try {
            const response = await listRecords(query);
            records.value = response.list || [];
            total.value = response.total || 0;
        } catch (error) {
            console.error('获取记录列表失败:', error);
            records.value = [];
            total.value = 0;
        } finally {
            loading.value = false;
        }
    }

    async function fetchLatest(limit: number = 10): Promise<void> {
        loading.value = true;
        try {
            const response = await latestRecords(limit);
            records.value = response || [];
        } catch (error) {
            console.error('获取最新记录失败:', error);
            records.value = [];
        } finally {
            loading.value = false;
        }
    }

    async function fetchRecordDetail(id: number): Promise<void> {
        loading.value = true;
        try {
            const response = await getRecord(id);
            currentRecord.value = response;
        } catch (error) {
            console.error('获取记录详情失败:', error);
            currentRecord.value = null;
        } finally {
            loading.value = false;
        }
    }

    function setAutoRefresh(value: boolean): void {
        autoRefresh.value = value;
    }

    function clearCurrentRecord(): void {
        currentRecord.value = null;
    }

    return {
        records,
        currentRecord,
        total,
        loading,
        autoRefresh,
        hasRecords,
        fetchRecords,
        fetchLatest,
        fetchRecordDetail,
        setAutoRefresh,
        clearCurrentRecord,
    };
});
