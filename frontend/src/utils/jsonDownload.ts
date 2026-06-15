class JsonDownload {
    static async downloadJson(data: string, filename: string): Promise<boolean> {
        const formatted = JsonDownload.formatJson(data);

        if (JsonDownload.isTauri()) {
            return await JsonDownload.saveWithTauri(filename, formatted);
        }

        JsonDownload.downloadWithBrowser(filename, formatted);
        return true;
    }


    private static formatJson(data: string): string {
        const parsed = JSON.parse(data);
        return JSON.stringify(parsed, null, 2);
    }


    private static isTauri(): boolean {
        return typeof window !== 'undefined' && '__TAURI_INTERNALS__' in window;
    }


    private static async saveWithTauri(filename: string, content: string): Promise<boolean> {
        const { save } = await import('@tauri-apps/plugin-dialog');
        const { writeTextFile } = await import('@tauri-apps/plugin-fs');
        const filePath = await save({
            defaultPath: filename,
            filters: [{ name: 'JSON', extensions: ['json'] }],
        });

        if (!filePath) {
            return false;
        }

        await writeTextFile(filePath, content);
        return true;
    }


    private static downloadWithBrowser(filename: string, content: string): void {
        const blob = new Blob([content], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');

        link.href = url;
        link.download = filename;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        URL.revokeObjectURL(url);
    }
}

export default JsonDownload;
