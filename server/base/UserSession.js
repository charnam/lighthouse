import MessageHandlerGroup from "../../assets/shared/MessageHandlerGroup.js";
import Database from "../util/Database.js";
import UserPermissions from "./UserPermissions.js";

class UserSession {
	static sessions = [];
	static registerSession(session) {
		this.sessions.push(session);
	}
	static deregisterSession(session) {
		this.sessions = this.sessions.filter(tSession => tSession !== session);
	}
	static findSessionsByUserId(userid) {
		return this.sessions.filter(session => session.userid == userid);
	}
	static getState(userid, programid, groupid) {
		let sessions = this.findSessionsByUserId(userid);
		
		if(sessions.length == 0)
			return "offline";
		if(sessions.some(session => session.subscriptions.includes(programid)))
			return "program";
		if(sessions.some(session => session.subscriptions.includes(groupid)))
			return "group";
		
		return "online";
	}
	
	subscriptions = [];
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
			if(typeof message.data == "string") {
				const groupDetails = await this.db.helpers.getGroupDetailsAsUser(message.data, this.userid);
				message.reply(groupDetails)
			}
		});
		
		this.userHandlers.handle("group-programs", async message => {
			if(typeof message.data == "string") {
				const groupDetails = await this.db.helpers.getGroupProgramsAsUser(message.data, this.userid);
				message.reply(groupDetails)
			}
		});
		
		this.userHandlers.handle("get-subscriptions", async message => {
			message.reply(this.subscriptions);
		});
		
		this.userHandlers.handle("program-details", async message => {
			if(typeof message.data == "string") {
				message.reply(await this.db.helpers.getProgramDetailsAsUser(message.data, this.userid));
			}
		});
	}
}

export default UserSession;