import request from '../utils/request';
import type {
    ApplyClientConfigRequest,
    ClientConfigBackupInfo,
    ClientConfigStatus,
    ClientConfigStatusResponse,
    CreateClientConfigBackupRequest,
    CreateClientConfigRequest,
    DeleteClientConfigBackupRequest,
    RenameClientConfigBackupRequest,
} from '../types/clientConfig';

export async function getClientConfigStatus(): Promise<ClientConfigStatusResponse> {
    return request.get('/client-config/status.json');
}

export async function createClientConfig(data: CreateClientConfigRequest): Promise<ClientConfigStatus> {
    return request.post('/client-config/create.json', data);
}

export async function applyClientConfig(data: ApplyClientConfigRequest): Promise<ClientConfigStatus> {
    return request.post('/client-config/apply.json', data);
}

export async function createClientConfigBackup(data: CreateClientConfigBackupRequest): Promise<ClientConfigBackupInfo> {
    return request.post('/client-config/backup.json', data);
}

export async function renameClientConfigBackup(data: RenameClientConfigBackupRequest): Promise<ClientConfigBackupInfo> {
    return request.post('/client-config/backup/rename.json', data);
}

export async function deleteClientConfigBackup(data: DeleteClientConfigBackupRequest): Promise<ClientConfigStatus> {
    return request.post('/client-config/backup/delete.json', data);
}
