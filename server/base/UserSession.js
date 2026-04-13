import Database from "../util/Database.js";

class UserSession {
	constructor(client, userid) {
		this.client = client;
		this.userid = userid;
		this.db = new Database(this.userid);
		
		this.client.connection.handle("group-list", async () => {
			return await this.db.helpers.selectGroupsForUser(this.userid);
		});
	}
}

export default UserSession;