import { invoke } from '@tauri-apps/api/core';
import { listen } from '@tauri-apps/api/event';

async function initSplash() {
    const loadingState = document.getElementById('loadingState')!;
    const errorState = document.getElementById('errorState')!;
    const btnExit = document.getElementById('btnExit')!;
    const errorText = document.getElementById('errorText')!;

    let hasError = false;

    const showBackendError = (code: unknown) => {
        hasError = true;
        loadingState.style.display = 'none';
        errorState.style.display = 'flex';

        if (code === 98) {
            errorText.innerHTML = `后端 <b>8787</b> 端口被占用。 请清理占用端口的进程，或者修改配置文件中的服务端口。`;
        } else {
            errorText.innerHTML = `后端异常退出 (代码：${code})`;
        }
    };

    // Listen for backend error events from Rust
    listen('backend-error', (event) => {
        showBackendError(event.payload);
    });

    btnExit.addEventListener('click', async () => {
        await invoke('exit_app');
    });

    try {
        const url = await invoke<string>('get_backend_url');
        
        // Wait for backend to be ready. Rust events are fast, HTTP polling is the
        // fallback for missed events or stdout detection failures.
        const isReady = await new Promise<boolean>((resolve) => {
            if (hasError) return resolve(false);

            let isResolved = false;
            let pollTimer: ReturnType<typeof setTimeout> | undefined;
            const unlisteners: Array<() => void> = [];

            const timeoutId = setTimeout(() => finish(false), 15000);

            const finish = (result: boolean) => {
                if (isResolved) return;
                isResolved = true;
                clearTimeout(timeoutId);
                if (pollTimer) {
                    clearTimeout(pollTimer);
                }
                unlisteners.forEach((unlisten) => unlisten());
                resolve(result);
            };

            // 1. 先注册监听器，防止在检查状态期间事件漏掉
            listen('backend-ready', () => finish(true))
                .then((unlisten) => {
                    if (isResolved) {
                        unlisten();
                    } else {
                        unlisteners.push(unlisten);
                    }
                })
                .catch(console.error);
            listen('backend-error', () => finish(false))
                .then((unlisten) => {
                    if (isResolved) {
                        unlisten();
                    } else {
                        unlisteners.push(unlisten);
                    }
                })
                .catch(console.error);

            // 2. 然后主动检测是否已经崩溃或就绪
            const pollBackend = async () => {
                if (isResolved) return;

                try {
                    await invoke('check_backend_status');
                } catch (code) {
                    showBackendError(code);
                    finish(false);
                    return;
                }

                try {
                    const ready = await invoke<boolean>('is_backend_ready');
                    if (ready) {
                        finish(true);
                        return;
                    }
                } catch (code) {
                    showBackendError(code);
                    finish(false);
                    return;
                }

                try {
                    const resp = await fetch(`${url}/welcome`, { cache: 'no-store' });
                    if (resp.ok) {
                        finish(true);
                        return;
                    }
                } catch (e) {
                    // Backend is not reachable yet, keep polling.
                }

                pollTimer = setTimeout(pollBackend, 300);
            };

            pollBackend().catch((e) => {
                console.error(e);
                finish(false);
            });
        });

        if (hasError) {
            return; // Stop processing, error UI is shown
        }

        if (!isReady) {
            throw new Error("Backend failed to start within 15 seconds.");
        }

        // Backend is ready, fetch token
        const token = await invoke<string>('get_auth_token');
        
        // Save to localStorage for the Vue app to pick up
        localStorage.setItem('adminToken', token);
        localStorage.setItem('backendBaseURL', url);

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
            errorText.innerText = `Initialization Error: ${e.message || e}`;
        }
    }
}

initSplash().catch(console.error);
