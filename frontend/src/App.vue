<template>
    <a-config-provider :theme="themeConfig">
        <div :class="['app-container', themeStore.isDark ? 'dark' : 'light']">
            <router-view />
        </div>
    </a-config-provider>
</template>

<script setup lang="ts">
import { computed } from 'vue';
import { useThemeStore } from '@/stores/theme';

const themeStore = useThemeStore();

const themeConfig = computed(() => themeStore.getAntdThemeConfig());
</script>

<style>
* {
    margin: 0;
    padding: 0;
    box-sizing: border-box;
}

html, body {
    height: 100%;
}

#app {
    height: 100%;
}

.app-container {
    height: 100%;
}

/* Light 模式 */
.app-container.light {
    --bg-layout: #f0f2f5;
    --bg-header: #ffffff;
    --bg-sidebar: #ffffff;
    --bg-sidebar-gradient: linear-gradient(180deg, #ffffff 0%, #fbfcff 100%);
    --bg-card: #ffffff;
    --bg-page: #ffffff;
    --bg-info-item: #fafafa;
    --border-color: #e8edf5;
    --border-info-item: #f0f0f0;
    --text-primary: #243247;
    --text-secondary: #8c8c8c;
    --text-sidebar: #243247;
    --text-sidebar-icon: #5b6b83;
    --text-version: #95a1b2;
    --text-description: #666;
    --sidebar-hover: rgba(37, 143, 255, 0.08);
    --sidebar-selected: rgba(37, 143, 255, 0.12);
    --sidebar-selected-border: rgba(37, 143, 255, 0.18);
    --sidebar-selected-text: var(--accent-primary);
    --sidebar-hover-text: var(--accent-primary);
    --collapse-btn-bg: #f4f7fb;
    --collapse-btn-text: #4f5d75;
    --token-divider: #d9d9d9;
    --accent-primary: #258fff;
    --accent-primary-hover: #4aa4ff;
    --accent-primary-soft: rgba(37, 143, 255, 0.16);
    --accent-primary-border: rgba(37, 143, 255, 0.28);
}

/* Dark 模式 */
.app-container.dark {
    --bg-layout: #141414;
    --bg-header: #1f1f1f;
    --bg-sidebar: #1f1f1f;
    --bg-sidebar-gradient: linear-gradient(180deg, #1f1f1f 0%, #1a1a1a 100%);
    --bg-card: #1f1f1f;
    --bg-page: #1f1f1f;
    --bg-info-item: #262626;
    --border-color: #303030;
    --border-info-item: #303030;
    --text-primary: rgba(255, 255, 255, 0.85);
    --text-secondary: rgba(255, 255, 255, 0.45);
    --text-sidebar: rgba(255, 255, 255, 0.85);
    --text-sidebar-icon: rgba(255, 255, 255, 0.65);
    --text-version: rgba(255, 255, 255, 0.45);
    --text-description: rgba(255, 255, 255, 0.45);
    --sidebar-hover: rgba(64, 156, 255, 0.10);
    --sidebar-selected: rgba(64, 156, 255, 0.20);
    --sidebar-selected-border: rgba(94, 176, 255, 0.28);
    --sidebar-selected-text: var(--accent-primary);
    --sidebar-hover-text: var(--accent-primary);
    --collapse-btn-bg: rgba(255, 255, 255, 0.08);
    --collapse-btn-text: rgba(255, 255, 255, 0.65);
    --token-divider: rgba(255, 255, 255, 0.15);
    --accent-primary: #409cff;
    --accent-primary-hover: #66b2ff;
    --accent-primary-soft: rgba(64, 156, 255, 0.20);
    --accent-primary-border: rgba(94, 176, 255, 0.28);
}
</style>
