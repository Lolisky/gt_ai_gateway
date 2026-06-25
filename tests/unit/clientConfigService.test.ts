import { afterAll, afterEach, beforeAll, beforeEach, describe, expect, it } from "vitest";
import { mkdtemp, mkdir, readFile, rm, writeFile } from "fs/promises";
import { join } from "path";
import { tmpdir } from "os";
import clientConfigService from "../../src/service/clientConfigService/core";
import ormService from "../../src/service/ormService";
import SgClientConfigBackup from "../../src/model/sgClientConfigBackup";
import { ClientName } from "../../src/constants";


describe("clientConfigService", () => {
    let tempRoot = "";
    let tempDir = "";
    let dbPath = "";
    let originalHome: string | undefined;
    let originalCodexHome: string | undefined;
    let originalOrmMode: "worker" | "node";

    beforeAll(async () => {
        originalHome = process.env.HOME;
        originalCodexHome = process.env.CODEX_HOME;
        originalOrmMode = ormService.mode;
        tempRoot = await mkdtemp(join(tmpdir(), "gt-client-config-"));
        dbPath = join(tempRoot, "test.db");
        await ormService.init({ mode: "node", dbPath });
    });

    beforeEach(async () => {
        await SgClientConfigBackup.query().delete();
        ormService.mode = "node";
        tempDir = await mkdtemp(join(tempRoot, "home-"));
        process.env.HOME = tempDir;
        process.env.CODEX_HOME = join(tempDir, ".codex");
        await mkdir(join(tempDir, ".claude"), { recursive: true });
        await mkdir(process.env.CODEX_HOME, { recursive: true });
    });

    afterEach(async () => {
        process.env.HOME = originalHome;
        process.env.CODEX_HOME = originalCodexHome;
        ormService.mode = originalOrmMode;
        await rm(tempDir, { recursive: true, force: true });
    });

    afterAll(async () => {
        await rm(tempRoot, { recursive: true, force: true });
    });

    it("reports unavailable in worker mode", async () => {
        ormService.mode = "worker";

        const status = await clientConfigService.getStatus();

        expect(status.available).toBe(false);
        expect(status.clients).toEqual([]);
        expect(status.reason).toContain("本地安装");
    });

    it("writes and restores Claude Code settings", async () => {
        const configPath = join(tempDir, ".claude", "settings.json");
        await writeFile(configPath, JSON.stringify({ permissions: { allow: ["Bash(npm test)"] } }, null, 4));
        const backup = await clientConfigService.createBackup({ client: ClientName.CLAUDE_CODE, name: "original" });
        const renamed = await clientConfigService.renameBackup({
            client: ClientName.CLAUDE_CODE,
            backupId: backup.id,
            name: "renamed original",
        });
        expect(renamed.name).toBe("renamed original");

        const status = await clientConfigService.applyConfig({
            client: ClientName.CLAUDE_CODE,
            gatewayUrl: "http://127.0.0.1:8720",
            apiKey: "test-token",
            model: "test-model",
        });

        expect(status.configured).toBe(true);
        expect(status.backupExists).toBe(true);
        expect(status.backupCount).toBe(1);
        const updated = JSON.parse(await readFile(configPath, "utf-8"));
        expect(updated.permissions.allow).toEqual(["Bash(npm test)"]);
        expect(updated.env.ANTHROPIC_BASE_URL).toBe("http://127.0.0.1:8720/llm");
        expect(updated.env.ANTHROPIC_AUTH_TOKEN).toBe("test-token");
        expect(updated.model).toBe("test-model");

        await clientConfigService.restoreConfig({ client: ClientName.CLAUDE_CODE, backupId: backup.id });
        const restored = JSON.parse(await readFile(configPath, "utf-8"));
        expect(restored).toEqual({ permissions: { allow: ["Bash(npm test)"] } });
    });

    it("does not create backups automatically when applying config", async () => {
        const configPath = join(tempDir, ".claude", "settings.json");
        await writeFile(configPath, "{}");

        const status = await clientConfigService.applyConfig({
            client: ClientName.CLAUDE_CODE,
            gatewayUrl: "http://127.0.0.1:8720",
            apiKey: "test-token",
            model: "test-model",
        });

        expect(status.configured).toBe(true);
        expect(status.backupExists).toBe(false);
        expect(status.backupCount).toBe(0);
    });

    it("writes Codex provider config", async () => {
        const configPath = join(tempDir, ".codex", "config.toml");
        const authPath = join(tempDir, ".codex", "auth.json");
        await writeFile(configPath, "approval_policy = \"on-request\"\n\n[features]\nhooks = true\n");
        await writeFile(authPath, "{\"auth_mode\":\"chatgpt\"}\n");
        const backup = await clientConfigService.createBackup({ client: ClientName.CODEX, name: "codex original" });

        const status = await clientConfigService.applyConfig({
            client: ClientName.CODEX,
            gatewayUrl: "http://127.0.0.1:8720/",
            apiKey: "test-token",
            model: "test-model",
        });

        expect(status.configured).toBe(true);
        expect(status.backupExists).toBe(true);
        expect(status.backupCount).toBe(1);
        expect(status.backups[0].fileCount).toBe(2);
        const updated = await readFile(configPath, "utf-8");
        expect(updated).toContain("approval_policy = \"on-request\"");
        expect(updated).toContain("model = \"test-model\"");
        expect(updated).toContain("model_provider = \"gt_ai_gateway\"");
        expect(updated).toContain("[model_providers.gt_ai_gateway]");
        expect(updated).toContain("base_url = \"http://127.0.0.1:8720/llm/v1\"");
        expect(updated).toContain("wire_api = \"responses\"");
        expect(updated).toContain("experimental_bearer_token = \"test-token\"");
        expect(updated).toContain("[features]");

        await clientConfigService.restoreConfig({ client: ClientName.CODEX, backupId: backup.id });
        expect(await readFile(configPath, "utf-8")).toBe("approval_policy = \"on-request\"\n\n[features]\nhooks = true\n");
        expect(await readFile(authPath, "utf-8")).toBe("{\"auth_mode\":\"chatgpt\"}\n");
    });

    it("writes direct upstream Claude Code settings without gateway path", async () => {
        const configPath = join(tempDir, ".claude", "settings.json");
        await writeFile(configPath, "{}");

        await clientConfigService.applyConfig({
            client: ClientName.CLAUDE_CODE,
            connectionMode: "vendor",
            protocol: "anthropic",
            gatewayUrl: "https://api.anthropic.com/v1/messages",
            apiKey: "vendor-token",
            model: "claude-sonnet",
        });

        const updated = JSON.parse(await readFile(configPath, "utf-8"));
        expect(updated.env.ANTHROPIC_BASE_URL).toBe("https://api.anthropic.com");
        expect(updated.env.ANTHROPIC_AUTH_TOKEN).toBe("vendor-token");
        expect(updated.model).toBe("claude-sonnet");
    });

    it("writes direct upstream Codex provider config without gateway path", async () => {
        const configPath = join(tempDir, ".codex", "config.toml");
        await writeFile(configPath, "");

        await clientConfigService.applyConfig({
            client: ClientName.CODEX,
            connectionMode: "vendor",
            protocol: "responses",
            gatewayUrl: "https://api.openai.com/v1/chat/completions",
            apiKey: "vendor-token",
            model: "gpt-5",
        });

        const updated = await readFile(configPath, "utf-8");
        expect(updated).toContain("base_url = \"https://api.openai.com/v1\"");
        expect(updated).toContain("experimental_bearer_token = \"vendor-token\"");
        expect(updated).toContain("model = \"gpt-5\"");
    });
});
