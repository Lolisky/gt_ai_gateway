import { Context } from "hono";
import clientConfigService from "../service/clientConfigService/core";


async function status(c: Context) {
    return c.json(await clientConfigService.getStatus());
}


async function create(c: Context) {
    const body = await c.req.json();
    return c.json(await clientConfigService.createConfig(body));
}


async function backup(c: Context) {
    const body = await c.req.json();
    return c.json(await clientConfigService.createBackup(body));
}


async function renameBackup(c: Context) {
    const body = await c.req.json();
    return c.json(await clientConfigService.renameBackup(body));
}


async function deleteBackup(c: Context) {
    const body = await c.req.json();
    return c.json(await clientConfigService.deleteBackup(body));
}


async function apply(c: Context) {
    const body = await c.req.json();
    return c.json(await clientConfigService.applyConfig(body));
}


export default {
    backup,
    create,
    deleteBackup,
    renameBackup,
    status,
    apply,
};
