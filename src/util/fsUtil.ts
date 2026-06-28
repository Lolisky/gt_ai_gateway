import type { FileSystemApi } from "../service/clientConfigService/types";


let _fs: FileSystemApi | null = null;


async function loadFs(): Promise<FileSystemApi> {
    if (!_fs) {
        // TODO: Tauri 环境下替换为 Tauri fs API
        _fs = await import("fs/promises");
    }
    return _fs;
}


async function pathExists(filePath: string): Promise<boolean> {
    const fs = await loadFs();
    try {
        await fs.access(filePath);
        return true;
    } catch {
        return false;
    }
}


export default {
    loadFs,
    pathExists,
};
