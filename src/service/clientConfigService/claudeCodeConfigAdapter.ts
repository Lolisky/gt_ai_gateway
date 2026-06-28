import type { ClientConfigFileContent, ClientConfigContent } from "./types";
import BaseConfigAdapter from "./baseConfigAdapter";
import configAdapterUtils from "./configAdapterUtils";
import { ClientName, ConnectionMode, ApiFormat } from "../../constants";
import path from "path";


class ClaudeCodeConfigAdapter extends BaseConfigAdapter {
    readonly protocol: ApiFormat = ApiFormat.ANTHROPIC;
    readonly defaultGatewaySuffix = "/llm";

    constructor(homeDir: string) {
        super(ClientName.CLAUDE_CODE, "Claude Code", [path.join(homeDir, ".claude", "settings.json")]);
    }

    private buildBaseUrl(fields: ClientConfigContent): string {
        const url = fields.gatewayUrl.replace(/\/+$/, "");
        if ((fields.connectionMode || ConnectionMode.GATEWAY) === ConnectionMode.VENDOR) {
            return url
                .replace(/\/v1\/messages\/?$/, "")
                .replace(/\/v1\/?$/, "");
        }
        if (url.endsWith(this.defaultGatewaySuffix)) {
            return url;
        }
        return `${url}${this.defaultGatewaySuffix}`;
    }

    parseConfigFileContent(configContent: ClientConfigFileContent, connectionMode?: ConnectionMode): ClientConfigContent | null {
        const content = configContent[this.configPaths[0]] || "";
        if (!content) {
            return null;
        }

        const config = configAdapterUtils.parseJsonConfig(content);
        const backendUrl = config.env?.ANTHROPIC_BASE_URL || "";
        const token = config.env?.ANTHROPIC_AUTH_TOKEN || config.env?.ANTHROPIC_API_KEY || "";
        const mode = (!backendUrl || backendUrl === "https://api.anthropic.com") ? ConnectionMode.OFFICIAL : (this.isGatewayUrl(backendUrl) ? ConnectionMode.GATEWAY : ConnectionMode.VENDOR);
        
        if (!token) {
            return null;
        }

        return {
            version: "v1",
            connectionMode: mode,
            gatewayUrl: backendUrl,
            apiKey: token,
            model: config.env?.ANTHROPIC_MODEL || config.env?.CLAUDE_CODE_SUBAGENT_MODEL || config.model || "",
            effortLevel: config.env?.CLAUDE_CODE_EFFORT_LEVEL || "",
        };
    }

    patchConfigFileContent(content: ClientConfigFileContent, fields: ClientConfigContent, connectionMode?: ConnectionMode): ClientConfigFileContent {
        const oldContent = content[this.configPaths[0]] || "";
        const config = configAdapterUtils.parseJsonConfig(oldContent);
        if (fields.apiKey) {
            config.env = {
                ...(config.env || {}),
                ANTHROPIC_AUTH_TOKEN: fields.apiKey,
            };
        }

        if (fields.connectionMode === ConnectionMode.OFFICIAL) {
            if (config.env) {
                delete config.env.ANTHROPIC_BASE_URL;
                if (!fields.apiKey) {
                    delete config.env.ANTHROPIC_AUTH_TOKEN;
                }
                if (Object.keys(config.env).length === 0) {
                    delete config.env;
                }
            }
        } else {
            config.env = {
                ...(config.env || {}),
                ANTHROPIC_BASE_URL: this.buildBaseUrl(fields),
            };
        }
        
        // Remove old deprecated configs
        delete config.model;
        if (config.env) {
            delete config.env.CLAUDE_CODE_ENABLE_GATEWAY_MODEL_DISCOVERY;
        }

        if (fields.model.trim()) {
            const model = fields.model.trim();
            if (!config.env) config.env = {};
            config.env.ANTHROPIC_MODEL = model;
            config.env.ANTHROPIC_DEFAULT_OPUS_MODEL = model;
            config.env.ANTHROPIC_DEFAULT_SONNET_MODEL = model;
            config.env.ANTHROPIC_DEFAULT_HAIKU_MODEL = model;
            config.env.CLAUDE_CODE_SUBAGENT_MODEL = model;
        } else if (config.env) {
            delete config.env.ANTHROPIC_MODEL;
            delete config.env.ANTHROPIC_DEFAULT_OPUS_MODEL;
            delete config.env.ANTHROPIC_DEFAULT_SONNET_MODEL;
            delete config.env.ANTHROPIC_DEFAULT_HAIKU_MODEL;
            delete config.env.CLAUDE_CODE_SUBAGENT_MODEL;
            if (Object.keys(config.env).length === 0) {
                delete config.env;
            }
        }

        if (fields.effortLevel?.trim()) {
            if (!config.env) config.env = {};
            config.env.CLAUDE_CODE_EFFORT_LEVEL = fields.effortLevel.trim();
        } else if (config.env) {
            delete config.env.CLAUDE_CODE_EFFORT_LEVEL;
            if (Object.keys(config.env).length === 0) {
                delete config.env;
            }
        }

        return {
            [this.configPaths[0]]: `${JSON.stringify(config, null, 4)}\n`,
        };
    }
}


export default ClaudeCodeConfigAdapter;
