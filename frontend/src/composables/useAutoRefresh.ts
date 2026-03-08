import { ref, onUnmounted } from 'vue';

type RefreshCallback = () => void | Promise<void>;

interface UseAutoRefreshOptions {
    callback: RefreshCallback;
    defaultInterval?: number;
    immediate?: boolean;
}

interface UseAutoReturn {
    isRunning: ReturnType<typeof ref<boolean>>;
    interval: ReturnType<typeof ref<number>>;
    start: () => void;
    stop: () => void;
    restart: () => void;
    setIntervalValue: (value: number) => void;
}

export function useAutoRefresh(options: UseAutoRefreshOptions): UseAutoReturn {
    const { callback, defaultInterval = 30000, immediate = false } = options;

    const isRunning = ref(false);
    const interval = ref(defaultInterval);
    let timer: number | null = null;

    function start(): void {
        if (isRunning.value) return;

        isRunning.value = true;

        // 立即执行一次
        callback();

        // 启动定时器
        timer = window.setInterval(() => {
            callback();
        }, interval.value);
    }

    function stop(): void {
        if (timer) {
            clearInterval(timer);
            timer = null;
        }
        isRunning.value = false;
    }

    function restart(): void {
        stop();
        start();
    }

    function setIntervalValue(value: number): void {
        interval.value = value;
        if (isRunning.value) {
            restart();
        }
    }

    // 组件卸载时清理
    onUnmounted(() => {
        stop();
    });

    // 如果设置了立即执行，则启动
    if (immediate) {
        start();
    }

    return {
        isRunning,
        interval,
        start,
        stop,
        restart,
        setIntervalValue,
    };
}
