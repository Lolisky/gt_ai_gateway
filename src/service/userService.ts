import {SgUser} from "../model/sgUser";


async function getUser(token:string):Promise<SgUser | null> {

    console.log("getUser",token);
    if( token == null)
        return null;

    const user = await SgUser.query().where('token', token).first();
    console.log("user:", user);

    return user;
}

export default {
    getUser
}
