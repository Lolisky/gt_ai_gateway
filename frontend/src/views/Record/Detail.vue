<template>
    <div class="record-detail">
        <a-page-header
            title="请求记录详情"
            @back="handleBack"
        />

        <a-spin :spinning="recordStore.loading">
            <div v-if="recordStore.currentRecord" class="detail-content">
                <!-- 基本信息 -->
                <a-card title="基本信息" class="detail-card">
                    <a-descriptions :column="2" bordered>
                        <a-descriptions-item label="请求 ID">
                            {{ recordStore.currentRecord.id }}
                        </a-descriptions-item>
                        <a-descriptions-item label="状态">
                            <a-tag :color="getStatusColor(recordStore.currentRecord.status)">
                                {{ getStatusText(recordStore.currentRecord.status) }}
                            </a-tag>
                        </a-descriptions-item>
                        <a-descriptions-item label="用户">
                            {{ recordStore.currentRecord.user_name || '-' }}
                        </a-descriptions-item>
                        <a-descriptions-item label="模型">
                            {{ recordStore.currentRecord.model_name || '-' }}
                        </a-descriptions-item>
                        <a-descriptions-item label="供应商">
                            {{ recordStore.currentRecord.vendor_name || '-' }}
                        </a-descriptions-item>
                        <a-descriptions-item label="创建时间">
                            {{ formatDate(recordStore.currentRecord.created_at) }}
                        </a-descriptions-item>
                        <a-descriptions-item label="提示词 Token" v-if="recordStore.currentRecord.prompt_tokens">
                            {{ recordStore.currentRecord.prompt_tokens }}
                        </a-descriptions-item>
                        <a-descriptions-item label="输出 Token" v-if="recordStore.currentRecord.output_tokens">
                            {{ recordStore.currentRecord.output_tokens }}
                        </a-descriptions-item>
                        <a-descriptions-item label="首 Token 延迟" v-if="recordStore.currentRecord.first_token_latency">
                            {{ recordStore.currentRecord.first_token_latency }}ms
                        </a-descriptions-item>
                    </a-descriptions>
                </a-card>

                <!-- 请求数据 -->
                <a-card title="请求数据" class="detail-card">
                    <JsonViewer :data="recordStore.currentRecord.request_data" />
                </a-card>

                <!-- 响应数据 -->
                <a-card title="响应数据" class="detail-card">
                    <JsonViewer :data="recordStore.currentRecord.response_data" />
                </a-card>

                <!-- 错误信息 -->
                <a-card
                    v-if="recordStore.currentRecord.status === 'failed'"
                    title="错误信息"
                    class="detail-card error-card"
                >
                    <a-alert
                        type="error"
                        :message="getErrorMessage(recordStore.currentRecord.response_data)"
                        show-icon
                    />
                </a-card>
            </div>

            <a-empty v-else description="记录不存在" />
        </a-spin>
    </div>
</template>

<script setup lang="ts">
import { onMounted, onUnmounted } from 'vue';
import { useRouter, useRoute } from 'vue-router';
import { useRecordStore } from '@/stores/record';
import { formatDate } from '@/utils/format';
import JsonViewer from '@/components/common/JsonViewer.vue';

const router = useRouter();
const route = useRoute();
const recordStore = useRecordStore();

onMounted(() => {
    const id = parseInt(route.params.id as string, 10);
    if (!isNaN(id)) {
        recordStore.fetchRecordDetail(id);
    }
});

onUnmounted(() => {
    recordStore.clearCurrentRecord();
});

function handleBack() {
    router.back();
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

function getErrorMessage(responseData: string | null): string {
    if (!responseData) return '未知错误';
    try {
        const parsed = JSON.parse(responseData);
        return parsed.error?.message || parsed.error || '请求失败';
    } catch {
        return responseData || '请求失败';
    }
}
</script>

<style scoped>
.record-detail {
    background: #fff;
    min-height: 100%;
}

.detail-content {
    padding: 0 24px 24px;
}

.detail-card {
    margin-top: 16px;
}

.detail-card:first-child {
    margin-top: 0;
}

.error-card {
    border-color: #ff4d4f;
}

.error-card :deep(.ant-card-head) {
    border-color: #ff4d4f;
    color: #ff4d4f;
}
</style>
