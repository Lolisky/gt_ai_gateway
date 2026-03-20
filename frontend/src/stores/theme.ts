import { defineStore } from 'pinia';
import { ref, watch } from 'vue';
import { theme } from 'ant-design-vue';

type ThemeMode = 'light' | 'dark';

export const useThemeStore = defineStore('theme', () => {
    const themeMode = ref<ThemeMode>((localStorage.getItem('theme') as ThemeMode) || 'light');
    const isDark = ref(themeMode.value === 'dark');

    watch(themeMode, (newMode) => {
        isDark.value = newMode === 'dark';
        localStorage.setItem('theme', newMode);
        updateHtmlClass();
    }, { immediate: true });

    function updateHtmlClass() {
        if (typeof document !== 'undefined') {
            const html = document.documentElement;
            if (isDark.value) {
                html.classList.add('dark');
            } else {
                html.classList.remove('dark');
            }
        }
    }

    function toggleTheme() {
        themeMode.value = themeMode.value === 'light' ? 'dark' : 'light';
    }

    function getAntdThemeConfig() {
        return {
            algorithm: isDark.value ? theme.darkAlgorithm : theme.defaultAlgorithm,
            token: {
                colorPrimary: isDark.value ? '#409cff' : '#258fff',
                colorInfo: isDark.value ? '#409cff' : '#258fff',
                colorLink: isDark.value ? '#409cff' : '#258fff',
                colorLinkHover: isDark.value ? '#66b2ff' : '#4aa4ff',
            },
        };
    }

    return {
        themeMode,
        isDark,
        toggleTheme,
        getAntdThemeConfig,
    };
});
