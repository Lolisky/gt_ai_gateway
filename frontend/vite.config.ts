import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'
import { fileURLToPath, URL } from 'node:url'
import Components from 'unplugin-vue-components/vite'
import { AntDesignVueResolver } from 'unplugin-vue-components/resolvers'

// https://vite.dev/config/
export default defineConfig({
    plugins: [
        vue(),
        Components({
            resolvers: [
                AntDesignVueResolver({
                    importStyle: false, // Ant Design Vue 4.x uses CSS-in-JS
                }),
            ],
        }),
    ],
    resolve: {
        alias: {
            '@': fileURLToPath(new URL('./src', import.meta.url)),
        },
    },
    server: {
        port: 5173,
        strictPort: true, // 如果 5173 被占用，直接报错退出，不再尝试下一个端口
        host: '127.0.0.1',
        allowedHosts: true,
        proxy: {
            '/api': {
                target: 'http://localhost:8787',
                changeOrigin: true,
                rewrite: (path) => path.replace(/^\/api/, ''),
            },
        },
    },
    build: {
        rollupOptions: {
            input: {
                main: fileURLToPath(new URL('./index.html', import.meta.url)),
                splash: fileURLToPath(new URL('./splash.html', import.meta.url)),
            },
        },
    },
})
