import { ClientName } from "../../constants";
import type { ClientConfigContent } from "../../model/sgClientConfigBackup";


type ConnectionMode = "gateway" | "vendor";
type ClientProtocol = "anthropic" | "responses";

interface ClientConfigFields {
    connectionMode?: ConnectionMode;
    protocol?: ClientProtocol;
    gatewayUrl: string;
    apiKey: string;
    model: string;
    effortLevel?: string;
}

interface CreateClientConfigParams extends ClientConfigFields {
    client: ClientName;
}

interface ApplyClientConfigParams {
    client: ClientName;
    backupId: number;
}

interface DeleteClientConfigBackupParams {
    client: ClientName;
    backupId: number;
}

interface UpdateClientConfigBackupParams extends CreateClientConfigParams {
    backupId: number;
}

interface RenameClientConfigBackupParams {
    client: ClientName;
    backupId: number;
    name: string;
}

interface CreateClientConfigBackupParams {
    client: ClientName;
    name?: string;
    enabled?: boolean;
}

interface ClientConfigStatusResponse {
    available: boolean;
    reason?: string;
    clients: ClientConfigStatus[];
}

interface AdapterConfigStatus {
    client: ClientName;
    displayName: string;
    installed: boolean;
    configured: boolean;
    currentConfig: ClientConfigFields | null;
    defaultGatewaySuffix: string;
    configPath: string;
    configPaths: string[];
    message?: string;
}

interface ClientConfigStatus extends AdapterConfigStatus {
    backupExists: boolean;
    backupCount: number;
    backups: ClientConfigBackupInfo[];
    activeBackupId?: number;
    activeConfigModified: boolean;
    currentConfig: CurrentClientConfigWithUser | null;
}

interface CurrentClientConfig extends ClientConfigFields {
    configPath: string;
}

interface CurrentClientConfigWithUser extends CurrentClientConfig {
    gatewayUser: GatewayUserInfo | null;
}

interface GatewayUserInfo {
    id: number;
    name: string;
    type: string;
    status: string;
}

interface ClientConfigBackupInfo {
    id: number;
    client: ClientName;
    name: string;
    fileCount: number;
    createdAt: string;
    enabled: boolean;
    config: CurrentClientConfig | null;
}

interface FileSystemApi {
    access(path: string): Promise<void>;
    mkdir(path: string, options: { recursive: boolean }): Promise<string | undefined>;
    readFile(path: string, encoding: "utf-8"): Promise<string>;
    writeFile(path: string, content: string, encoding: "utf-8"): Promise<void>;
    unlink(path: string): Promise<void>;
}

interface PathApi {
    dirname(path: string): string;
    join(...paths: string[]): string;
}

interface ConfigAdapter {
    readonly client: ClientName;
    readonly displayName: string;
    readonly defaultGatewaySuffix: string;
    readonly configPath: string;
    readonly configPaths: string[];

    isInstalled(): Promise<boolean>;
    readConfig(): Promise<ClientConfigContent>;
    writeConfig(content: ClientConfigContent): Promise<void>;
    patchConfigContent(content: ClientConfigContent, fields: ClientConfigFields): ClientConfigContent;
    parseConfigContent(content: ClientConfigContent): ClientConfigFields | null;
}

export type {
    AdapterConfigStatus,
    ApplyClientConfigParams,
    ClientConfigBackupInfo,
    ClientConfigContent,
    ClientConfigFields,
    ClientConfigStatus,
    ClientConfigStatusResponse,
    ClientProtocol,
    ConfigAdapter,
    ConnectionMode,
    CreateClientConfigBackupParams,
    CreateClientConfigParams,
    CurrentClientConfig,
    CurrentClientConfigWithUser,
    DeleteClientConfigBackupParams,
    FileSystemApi,
    GatewayUserInfo,
    PathApi,
    RenameClientConfigBackupParams,
    UpdateClientConfigBackupParams,
};

export { ClientName };
