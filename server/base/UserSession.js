import MessageHandlerGroup from "../../assets/shared/MessageHandlerGroup.js";
import Database from "../util/Database.js";
import UserPermissions from "./UserPermissions.js";

class UserSession {
	constructor(client, userid) {
		this.client = client;
		this.userid = userid;
		this.db = new Database(this.userid);
		this.permissions = new UserPermissions(this.db, this.userid);
		
		this.userHandlers = new MessageHandlerGroup(this.client.connection);
		
		this.userHandlers.handle("group-list", async message => {
			message.reply(await this.db.helpers.selectGroupsForUser(this.userid));
		});
		
		this.userHandlers.handle("group-details", async message => {
			await this.db.helpers.selectGroupsForUser(this.userid);
			message.reply()
		});
	}
	
	
}

export default UserSession;