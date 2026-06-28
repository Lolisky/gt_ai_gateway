import type {
    ClientConfigContent,
    ClientConfigFileContent,
    ApiFormat,
    ClientName,
    ConfigAdapter,
} from "./types";
import fsUtil from "../../util/fsUtil";
import hostService from "../hostService";
import path from "path";


abstract class BaseConfigAdapter implements ConfigAdapter {
    readonly client: ClientName;
    readonly displayName: string;
    abstract readonly protocol: ApiFormat;
    abstract readonly defaultGatewaySuffix: string;
    readonly configPaths: string[];

    abstract parseConfigFileContent(configContent: ClientConfigFileContent): ClientConfigContent | null;
    abstract patchConfigFileContent(content: ClientConfigFileContent, fields: ClientConfigContent): ClientConfigFileContent;

    constructor(
        client: ClientName,
        displayName: string,
        configPaths: string[],
    ) {
        this.client = client;
        this.displayName = displayName;
        if (!configPaths || configPaths.length === 0) {
            throw new Error("configPaths cannot be empty");
        }
        this.configPaths = configPaths;
    }


    protected isGatewayUrl(url?: string): boolean {
        if (!url) {
            return false;
        }
        try {
            const parsed = new URL(url);
            const isLocalHost = parsed.hostname === "localhost" || parsed.hostname === "127.0.0.1";
            const port = hostService.getLocalPort();
            return isLocalHost && parsed.port === port;
        } catch {
            return false;
        }
    }


    async isInstalled(): Promise<boolean> {
        return await fsUtil.pathExists(path.dirname(this.configPaths[0]));
    }


    async readConfig(): Promise<ClientConfigFileContent> {
        const configContent: ClientConfigFileContent = {};

        for (const filePath of this.configPaths) {
            if (await fsUtil.pathExists(filePath)) {
                const fs = await fsUtil.loadFs();
                configContent[filePath] = await fs.readFile(filePath, "utf-8");
            }
        }

        return configContent;
    }


    async writeConfig(configContent: ClientConfigFileContent): Promise<void> {
        const fs = await fsUtil.loadFs();

        for (const [filePath, content] of Object.entries(configContent)) {
            if (!this.configPaths.includes(filePath)) {
                throw new Error(`Unsupported config file path: ${filePath}`);
            }

            await fs.mkdir(path.dirname(filePath), { recursive: true });
            await fs.writeFile(filePath, content, "utf-8");
        }

        for (const filePath of this.configPaths) {
            if (!(filePath in configContent)) {
                if (await fsUtil.pathExists(filePath)) {
                    await fs.unlink(filePath);
                }
            }
        }
    }
}


export default BaseConfigAdapter;
