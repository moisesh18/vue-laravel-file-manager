import { defineConfig, loadEnv } from 'vite';
import vue from '@vitejs/plugin-vue';

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => {
    // Load env file based on `mode` in the current working directory.
    const env = loadEnv(mode, process.cwd(), '');

    // Extract proxy target from VITE_APP_LFM_AXIOS_BASE_URL
    const baseUrl = env.VITE_APP_LFM_AXIOS_BASE_URL || env.VITE_LFM_BASE_URL || '';
    const proxyTarget = baseUrl ? new URL(baseUrl).origin : 'http://localhost';

    return {
        plugins: [vue()],
        server: {
            proxy: {
                '/file-manager': {
                    target: proxyTarget,
                    changeOrigin: true,
                    secure: false,
                    configure: (proxy) => {
                        proxy.on('proxyReq', (proxyReq, req) => {
                            // Rewrite referer to match the target server for ACL compatibility
                            // This ensures Laravel ACL can extract the correct path from referer
                            let targetReferer = null;

                            if (req.headers.referer) {
                                const originalUrl = new URL(req.headers.referer);
                                targetReferer = `${proxyTarget}${originalUrl.pathname}${originalUrl.search || ''}`;
                            } else {
                                // If no referer, construct one from the request path
                                targetReferer = `${proxyTarget}${req.url}`;
                            }

                            if (targetReferer) {
                                proxyReq.setHeader('referer', targetReferer);
                            }
                        });
                    },
                },
            },
        },
        build: {
            minify: true,
            cssCodeSplit: false,
            rollupOptions: {
                output: {
                    manualChunks: {
                        vendor: [],
                    },
                },
            },
        },

        css: { preprocessorOptions: { scss: { charset: false } } },
    };
});
