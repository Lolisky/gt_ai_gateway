/**
 * 自签 TLS 证书场景下 skip_tls_verify 的端到端验证。
 *
 * 使用 openssl 生成自签名证书，启动临时 HTTPS mock server。
 * 测试 testVendor 连通性检测在 skip_tls_verify=true/false 时的行为。
 */
import { describe, it, expect, beforeAll, afterAll } from "vitest";
import { createServer as createHttpsServer } from "https";
import { execSync } from "child_process";
import { mkdtempSync, readFileSync, rmSync } from "fs";
import { join } from "path";
import { tmpdir } from "os";
import requestHelper from "../../helpers/requestHelper";
import { setupAdminUser } from "../../globalSetup";

const HTTPS_PORT = 9998;

let skipVendorId: number;
let noSkipVendorId: number;
let adminToken: string;
let httpsServer: ReturnType<typeof createHttpsServer> | null = null;

beforeAll(async () => {
    adminToken = await setupAdminUser();

    // 用 openssl 生成自签名证书
    let certDir: string;
    try {
        certDir = mkdtempSync(join(tmpdir(), "ssl-test-"));
        execSync(
            `openssl req -x509 -newkey rsa:2048 -nodes \
  -keyout "${certDir}/test.key" \
  -out "${certDir}/test.crt" \
  -days 36500 -subj "/CN=localhost"`,
            { stdio: "pipe", timeout: 10000 },
        );
    } catch {
        // openssl 不可用（Windows 无 openssl 等），skip 整个 test suite
        console.warn("[testUntrustedSSL] openssl not available, skipping SSL tests");
        return;
    }

    const key = readFileSync(join(certDir, "test.key"), "utf-8");
    const cert = readFileSync(join(certDir, "test.crt"), "utf-8");
    rmSync(certDir, { recursive: true, force: true });

    // 启动自签 HTTPS mock server
    await new Promise<void>((resolve, reject) => {
        httpsServer = createHttpsServer({ key, cert }, (req, res) => {
            const body = JSON.stringify({
                id: "mock-ssl-chatcmpl-001",
                object: "chat.completion",
                created: Math.floor(Date.now() / 1000),
                model: "mock-gpt-4o",
                choices: [{
                    index: 0,
                    message: { role: "assistant", content: "SSL test OK" },
                    finish_reason: "stop",
                }],
                usage: { prompt_tokens: 5, completion_tokens: 3, total_tokens: 8 },
            });
            res.writeHead(200, { "Content-Type": "application/json" });
            res.end(body);
        });
        httpsServer.on("error", reject);
        httpsServer.listen(HTTPS_PORT, () => resolve());
    });

    const suffix = `SSL ${Date.now()}`;

    // skip_tls_verify = true
    const skipRes = await requestHelper.post("/vendor/create.json", {
        type: "other",
        name: `Skip ${suffix}`,
        token: "ssl-test-token",
        urls: { openai: `https://localhost:${HTTPS_PORT}` },
        config: { skip_tls_verify: true },
    }, adminToken);
    skipVendorId = skipRes.body.id;

    // skip_tls_verify = false
    const noSkipRes = await requestHelper.post("/vendor/create.json", {
        type: "other",
        name: `NoSkip ${suffix}`,
        token: "ssl-test-token",
        urls: { openai: `https://localhost:${HTTPS_PORT}` },
        config: { skip_tls_verify: false },
    }, adminToken);
    noSkipVendorId = noSkipRes.body.id;
});

afterAll(async () => {
    if (httpsServer) {
        await new Promise<void>((resolve) => httpsServer!.close(() => resolve()));
    }
});

describe("testVendor with self-signed HTTPS", () => {
    it("should fail when skip_tls_verify is false", async () => {
        if (!httpsServer) {
            console.warn("[testUntrustedSSL] HTTPS server not started, skipping");
            return;
        }
        const res = await requestHelper.post(
            `/vendor/${noSkipVendorId}/test.json`,
            { model: "mock-gpt-4o" },
            adminToken,
        );

        expect(res.status).toBe(200);
        expect(res.body.success).toBe(false);
        expect(res.body.error).toMatch(/self.signed|certificate|TLS|SSL|EPROTO|DEPTH_ZERO/i);
    });

    it("should succeed when skip_tls_verify is true", async () => {
        if (!httpsServer) {
            console.warn("[testUntrustedSSL] HTTPS server not started, skipping");
            return;
        }
        const res = await requestHelper.post(
            `/vendor/${skipVendorId}/test.json`,
            { model: "mock-gpt-4o" },
            adminToken,
        );

        expect(res.status).toBe(200);
        expect(res.body.success).toBe(true);
        expect(res.body.duration).toBeGreaterThan(0);
    });
});
