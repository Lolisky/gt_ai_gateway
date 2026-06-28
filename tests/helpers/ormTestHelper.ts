import { sutando } from "sutando";
import config from "../config";
import ormService from "../../src/service/ormService";


let connected = false;


async function connectNodeOrm(): Promise<void> {
    ormService.mode = "node";

    if (connected) {
        return;
    }

    sutando.addConnection({
        client: "better-sqlite3",
        connection: {
            filename: config.DB_CONFIG.path,
        },
        useNullAsDefault: true,
    });

    connected = true;
}


export default {
    connectNodeOrm,
};
