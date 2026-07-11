/**
 * fetch 工具 — 封装 undici Agent 用于 TLS 证书绕过。
 *
 * 背景：Node.js 全局 fetch（底层 undici）默认验证 TLS 证书。
 * 内网自签证书环境下，fetch 会抛出 self-signed certificate in certificate chain。
 * 通过 undici Agent 的 connect.rejectUnauthorized = false 可跳过验证。
 *
 * Cloudflare Workers 环境不使用 dispatcher 选项，传入 undefined 即走默认行为。
 */

import type { Agent as UndiciAgent } from "undici";

/**
 * 跳过 TLS 证书验证的 undici Agent 实例（惰性创建，全局复用）。
 * 多次 fetch 共享同一个连接池，避免频繁创建 Agent 导致的资源泄露。
 */
let insecureAgent: UndiciAgent | null = null;

/**
 * 根据 skipTlsVerify 标志返回对应的 undici dispatcher。
 *
 * 注意：undici 通过运行时动态 import 加载，避免 Worker 打包时引入
 * undici（其内部使用 MessagePort，Cloudflare Worker 运行时不支持）。
 *
 * @param skipTlsVerify - 是否跳过 TLS 证书验证
 * @returns 需要跳过时返回带 rejectUnauthorized: false 的 Agent；否则返回 undefined（默认行为）
 */
export async function getDispatcher(skipTlsVerify: boolean): Promise<UndiciAgent | undefined> {
    if (skipTlsVerify) {
        if (!insecureAgent) {
            const { Agent } = await import("undici");
            insecureAgent = new Agent({ connect: { rejectUnauthorized: false } });
        }
        return insecureAgent;
    } else {
        return undefined;
    }
}

export default {
    getDispatcher,
};
