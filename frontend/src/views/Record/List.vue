<template>
    <div class="record-list">
        <div class="table-header">
            <a-form layout="inline">
                <a-form-item label="状态">
                    <a-select
                        v-model:value="searchForm.status"
                        placeholder="全部状态"
                        style="width: 120px"
                        allow-clear
                    >
                        <a-select-option value="success">成功</a-select-option>
                        <a-select-option value="failed">失败</a-select-option>
                        <a-select-option value="processing">处理中</a-select-option>
                        <a-select-option value="init">初始化</a-select-option>
                    </a-select>
                </a-form-item>
                <a-form-item label="用户">
                    <a-input
                        v-model:value="searchForm.user_name"
                        placeholder="搜索用户名"
                        allow-clear
                        style="width: 150px"
                    />
                </a-form-item>
                <a-form-item label="模型">
                    <a-input
                        v-model:value="searchForm.model_name"
                        placeholder="搜索模型名"
                        allow-clear
                        style="width: 150px"
                    />
                </a-form-item>
                <a-form-item label="时间范围">
                    <a-range-picker
                        v-model:value="dateRange"
                        :show-time="{ format: 'HH:mm' }"
                        format="YYYY-MM-DD HH:mm"
                        @change="handleDateChange"
                    />
                </a-form-item>
                <a-form-item>
                    <a-space>
                        <a-button type="primary" @click="handleSearch">搜索</a-button>
                        <a-button @click="handleReset">重置</a-button>
                    </a-space>
                </a-form-item>
            </a-form>
            <a-space>
                <a-tooltip title="自动刷新">
                    <a-switch
                        v-model:checked="autoRefreshEnabled"
                        checked-children="开"
                        un-checked-children="关"
                        @change="handleAutoRefreshChange"
                    />
                </a-tooltip>
                <span class="refresh-hint">自动刷新</span>
            </a-space>
        </div>

        <a-table
            :columns="columns"
            :data-source="recordStore.records"
            :loading="recordStore.loading"
            :pagination="pagination"
            @change="handleTableChange"
            :row-key="(record: Record) => record.id"
        >
            <template #bodyCell="{ column, record }">
                <template v-if="column.key === 'status'">
                    <a-tag :color="getStatusColor(record.status)">
                        {{ getStatusText(record.status) }}
                    </a-tag>
                </template>
                <template v-if="column.key === 'created_at'">
                    {{ formatDate(record.created_at) }}
                </template>
                <template v-if="column.key === 'action'">
                    <a-button type="link" @click="handleView(record)">
                        查看
                    </a-button>
                </template>
            </template>
        </a-table>
    </div>
</template>

<script setup lang="ts">
import { ref, onMounted, onUnmounted, reactive } from 'vue';
import { useRouter } from 'vue-router';
import { useRecordStore } from '@/stores/record';
import { useAutoRefresh } from '@/composables/useAutoRefresh';
import { formatDate } from '@/utils/format';
import type { Record, RecordQuery, RequestStatus } from '@/types/record';
import type { Dayjs } from 'dayjs';

const router = useRouter();
const recordStore = useRecordStore();

const autoRefreshEnabled = ref(false);
const dateRange = ref<[Dayjs, Dayjs] | null>(null);

const searchForm = reactive<{
    status?: RequestStatus;
    user_name?: string;
    model_name?: string;
    start_time?: string;
    end_time?: string;
}>({});

const pagination = reactive({
    current: 1,
    pageSize: 10,
    total: 0,
    showSizeChanger: true,
    showQuickJumper: true,
    pageSizeOptions: ['10', '20', '50', '100'],
});

const columns = [
    { title: 'ID', key: 'id', dataIndex: 'id', width: 80 },
    { title: '用户', key: 'user_name', dataIndex: 'user_name' },
    { title: '供应商', key: 'vendor_name', dataIndex: 'vendor_name' },
    { title: '模型', key: 'model_name', dataIndex: 'model_name' },
    { title: '状态', key: 'status', dataIndex: 'status', width: 100 },
    { title: '创建时间', key: 'created_at', dataIndex: 'created_at', width: 180 },
    { title: '操作', key: 'action', width: 80, fixed: 'right' as const },
];

const { start: startAutoRefresh, stop: stopAutoRefresh } = useAutoRefresh({
    callback: () => {
        loadData();
    },
    defaultInterval: 30000,
    immediate: false,
});

onMounted(() => {
    loadData();
});

onUnmounted(() => {
    stopAutoRefresh();
});

async function loadData() {
    const query: RecordQuery = {
        page: pagination.current,
        pageSize: pagination.pageSize,
        ...searchForm,
    };

    await recordStore.fetchRecords(query);
    pagination.total = recordStore.total;
}

function handleSearch() {
    pagination.current = 1;
    loadData();
}

function handleReset() {
    searchForm.status = undefined;
    searchForm.user_name = undefined;
    searchForm.model_name = undefined;
    searchForm.start_time = undefined;
    searchForm.end_time = undefined;
    dateRange.value = null;
    pagination.current = 1;
    pagination.pageSize = 10;
    loadData();
}

function handleTableChange(pag: any) {
    pagination.current = pag.current;
    pagination.pageSize = pag.pageSize;
    loadData();
}

function handleDateChange(dates: [Dayjs, Dayjs] | null) {
    if (dates) {
        searchForm.start_time = dates[0].format('YYYY-MM-DD HH:mm:ss');
        searchForm.end_time = dates[1].format('YYYY-MM-DD HH:mm:ss');
    } else {
        searchForm.start_time = undefined;
        searchForm.end_time = undefined;
    }
}

function handleAutoRefreshChange(checked: boolean) {
    if (checked) {
        startAutoRefresh();
    } else {
        stopAutoRefresh();
    }
}

function handleView(record: Record) {
    router.push(`/record/${record.id}`);
}

function getStatusColor(status: string | null): string {
    switch (status) {
        case 'success':
            return 'success';
        case 'failed':
            return 'error';
        case 'processing':
            return 'processing';
        case 'init':
        default:
            return 'default';
    }
}

function getStatusText(status: string | null): string {
    switch (status) {
        case 'success':
            return '成功';
        case 'failed':
            return '失败';
        case 'processing':
            return '处理中';
        case 'init':
            return '初始化';
        default:
            return '未知';
    }
}
</script>

<style scoped>
.record-list {
    background: #fff;
    padding: 24px;
}

.table-header {
    display: flex;
    justify-content: space-between;
    align-items: flex-start;
    margin-bottom: 16px;
}

.refresh-hint {
    font-size: 12px;
    color: #8c8c8c;
}
</style>
