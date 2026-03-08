<template>
    <div class="stream-output">
        <div class="stream-header">
            <div class="stream-status">
                <a-badge :status="badgeStatus" :text="statusText" />
            </div>
            <a-space>
                <a-button
                    v-if="loading"
                    size="small"
                    danger
                    @click="handleStop"
                >
                    停止
                </a-button>
                <a-button
                    size="small"
                    @click="handleClear"
                >
                    清除
                </a-button>
            </a-space>
        </div>
        <div class="stream-content">
            <div v-if="content" class="stream-text">{{ content }}</div>
            <div v-else-if="loading" class="stream-placeholder">
                <a-spin size="small" />
                <span class="placeholder-text">等待响应...</span>
            </div>
            <div v-else class="stream-placeholder">
                响应内容将显示在这里
            </div>
        </div>
    </div>
</template>

<script setup lang="ts">
import { computed } from 'vue';

interface Props {
    content: string;
    loading: boolean;
}

const props = defineProps<Props>();

const emit = defineEmits<{
    stop: [];
    clear: [];
}>();

const badgeStatus = computed(() => {
    if (props.loading) return 'processing' as const;
    if (props.content) return 'success' as const;
    return 'default' as const;
});

const statusText = computed(() => {
    if (props.loading) return '生成中';
    if (props.content) return '已完成';
    return '等待中';
});

function handleStop() {
    emit('stop');
}

function handleClear() {
    emit('clear');
}
</script>

<style scoped>
.stream-output {
    border: 1px solid #e1e4e8;
    border-radius: 6px;
    overflow: hidden;
    display: flex;
    flex-direction: column;
    height: 100%;
}

.stream-header {
    padding: 12px 16px;
    background: #f6f8fa;
    border-bottom: 1px solid #e1e4e8;
    display: flex;
    justify-content: space-between;
    align-items: center;
}

.stream-status {
    display: flex;
    align-items: center;
}

.stream-content {
    flex: 1;
    padding: 16px;
    overflow: auto;
    background: #fff;
}

.stream-text {
    white-space: pre-wrap;
    word-wrap: break-word;
    line-height: 1.6;
    font-size: 14px;
    color: #24292e;
}

.stream-placeholder {
    display: flex;
    align-items: center;
    justify-content: center;
    height: 100%;
    color: #8c8c8c;
    gap: 8px;
}

.placeholder-text {
    margin-left: 8px;
}
</style>
