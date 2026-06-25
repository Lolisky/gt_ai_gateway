import { SgUser } from "../../model/sgUser";
import type { FileSystemApi, GatewayUserInfo } from "./types";


async function pathExists(fs: FileSystemApi, path: string): Promise<boolean> {
    try {
        await fs.access(path);
        return true;
    } catch {
        return false;
    }
}


function parseJsonConfig(content: string): Record<string, any> {
    if (!content.trim()) {
        return {};
    }

    const parsed = JSON.parse(content);
    if (!parsed || typeof parsed !== "object" || Array.isArray(parsed)) {
        throw new Error("Config file must contain a JSON object");
    }

    return parsed;
}


async function findGatewayUserByToken(token: string): Promise<GatewayUserInfo | null> {
    if (!token) {
        return null;
    }

    const normalizedToken = token.replace(/^Bearer\s+/i, "");
    let user: SgUser | null = null;
    try {
        user = await SgUser.query().where("token", normalizedToken).first();
    } catch {
        return null;
    }

    if (!user) {
        return null;
    }

    return {
        id: user.id,
        name: user.name,
        type: user.type,
        status: user.status,
    };
}


export default {
    findGatewayUserByToken,
    parseJsonConfig,
    pathExists,
};
