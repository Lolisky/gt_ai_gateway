import { Context } from "hono";
import clientConfigService from "../service/clientConfigService/core";


async function status(c: Context) {
    return c.json(await clientConfigService.getStatus());
}


async function apply(c: Context) {
    const body = await c.req.json();
    return c.json(await clientConfigService.applyConfig(body));
}


async function backup(c: Context) {
    const body = await c.req.json();
    return c.json(await clientConfigService.createBackup(body));
}


async function renameBackup(c: Context) {
    const body = await c.req.json();
    return c.json(await clientConfigService.renameBackup(body));
}


async function restore(c: Context) {
    const body = await c.req.json();
    return c.json(await clientConfigService.restoreConfig(body));
}


export default {
    backup,
    renameBackup,
    status,
    apply,
    restore,
};
