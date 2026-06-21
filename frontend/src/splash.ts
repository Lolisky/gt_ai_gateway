import { invoke } from '@tauri-apps/api/core';
import { listen } from '@tauri-apps/api/event';

async function initSplash() {
    const loadingState = document.getElementById('loadingState')!;
    const errorState = document.getElementById('errorState')!;
    const btnExit = document.getElementById('btnExit')!;
    const errorText = document.getElementById('errorText')!;

    let hasError = false;

    const formatError = (error: unknown): string => {
        if (error instanceof Error) {
            return error.message;
        }
        if (typeof error === 'string') {
            return error;
        }
        const serialized = JSON.stringify(error);
        if (serialized) {
            return serialized;
        }
        return String(error);
    };

    const showInitializationError = (message: string) => {
        hasError = true;
        loadingState.style.display = 'none';
        errorState.style.display = 'flex';
        errorText.innerText = `初始化失败：${message}`;
    };

    const showBackendError = (code: unknown) => {
        hasError = true;
        loadingState.style.display = 'none';
        errorState.style.display = 'flex';

        if (code === 98) {
            errorText.innerHTML = `后端 <b>6722</b> 端口被占用。 请清理占用端口的进程，或者修改配置文件中的服务端口。`;
        } else {
            errorText.innerHTML = `后端异常退出 (代码：${code})`;
        }
    };

    btnExit.addEventListener('click', async () => {
        await invoke('exit_app');
    });

    try {
        // Wait for the sidecar backend state reported by Rust. Do not probe HTTP
        // here: another local process may already be serving the configured port.
        const isReady = await new Promise<boolean>((resolve) => {
            if (hasError) return resolve(false);

            let isResolved = false;
            let timeoutId: ReturnType<typeof setTimeout> | undefined;
            const unlisteners: Array<() => void> = [];

            const finish = (result: boolean) => {
                if (isResolved) return;
                isResolved = true;
                if (timeoutId) {
                    clearTimeout(timeoutId);
                }
                unlisteners.forEach((unlisten) => unlisten());
                resolve(result);
            };

            const finishWithInitializationError = (message: string) => {
                if (isResolved) return;
                showInitializationError(message);
                finish(false);
            };

            const finishWithBackendError = (code: unknown) => {
                if (isResolved) return;
                showBackendError(code);
                finish(false);
            };

            async function checkInitialBackendState() {
                try {
                    await invoke('check_backend_status');
                } catch (code) {
                    if (typeof code === 'number') {
                        finishWithBackendError(code);
                    } else {
                        finishWithInitializationError(`检查后端进程状态失败：${formatError(code)}`);
                    }
                    return;
                }

                try {
                    const ready = await invoke<boolean>('is_backend_ready');
                    if (ready) {
                        finish(true);
                    }
                } catch (error) {
                    finishWithInitializationError(`读取后端就绪状态失败：${formatError(error)}`);
                }
            }

            timeoutId = setTimeout(() => {
                finishWithInitializationError('后端启动超时：15 秒内没有收到后端就绪事件。');
            }, 15000);

            Promise.all([
                listen('backend-ready', () => finish(true)),
                listen('backend-error', (event) => {
                    finishWithBackendError(event.payload);
                }),
            ])
                .then((listeners) => {
                    if (isResolved) {
                        listeners.forEach((unlisten) => unlisten());
                    } else {
                        unlisteners.push(...listeners);
                        checkInitialBackendState().catch((e) => {
                            console.error(e);
                            finishWithInitializationError(`检查后端初始状态异常：${formatError(e)}`);
                        });
                    }
                })
                .catch((e) => {
                    console.error(e);
                    finishWithInitializationError(`注册后端启动事件监听失败：${formatError(e)}`);
                });
        });

        if (hasError) {
            return; // Stop processing, error UI is shown
        }

        if (!isReady) {
            throw new Error("Backend failed to start for an unknown reason.");
        }

        // 如果配置了环境变量 VITE_SPLASH_DELAY_SEC，则人为增加对应秒数的延迟
        const delaySec = Number(import.meta.env.VITE_SPLASH_DELAY_SEC) || 0;
        if (delaySec > 0) {
            await new Promise(r => setTimeout(r, delaySec * 1000));
        }

        // Tell Rust to open the main window and close this splash screen
        await invoke('open_main_window');

    } catch (e: any) {
        if (!hasError) {
            loadingState.style.display = 'none';
            errorState.style.display = 'flex';
            errorText.innerText = `初始化失败：${formatError(e)}`;
        }
    }
}

initSplash().catch(console.error);
