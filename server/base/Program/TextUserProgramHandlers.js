import Permissions from "../../variables/Permissions.js";
import UserSession from "../UserSession.js";
import UserProgramHandlers from "./UserProgramHandlers.js";

class TextUserProgramHandlers extends UserProgramHandlers {
	setupHandlers() {
		super.setupHandlers();
		this.handlers.handle("text-program-get-message-history", async message => {
			const details = message.data;
			let point = "initial";
			let direction = "historic";
			let programid = details?.programid;
			
			point = details?.point || point;
			direction = details?.direction || direction;
			
			if(!(await this.session.db.helpers.getUserProgramPermissions(this.session.userid, programid) & Permissions.bitmask.byName.VIEW_PROGRAM)) {
				return message.reply(false);
			}
			
			const messages = await this.session.db.helpers.getMessages(programid, point, direction);
			
			message.reply(messages);
		});
		this.handlers.handle("text-program-send-message", async message => {
			const details = message.data;
			
			if(!(await this.session.db.helpers.getUserProgramPermissions(this.session.userid, details.programid) & Permissions.bitmask.byName.SEND_MESSAGES)) {
				return message.reply(false);
			}
			
			const messageid = crypto.randomUUID();
			
			await this.session.db.exec(`
				INSERT INTO messages
					(messageid, userid, programid, content, creation, reply_to)
				VALUES
					(
						${this.session.db.val(messageid)},
						${this.session.db.val(this.session.userid)},
						${this.session.db.val(details.programid)},
						${this.session.db.val(details.content)},
						${this.session.db.val(Date.now())},
						NULL
					)
			`);
			
			const messageData = await this.session.db.helpers.getMessage(messageid);
			const residents = UserSession.sessions.filter(session => session.subscriptions.includes(messageData.programid));
			for(let session of residents) {
				
				session.client.connection.request("text-program-receive-message", messageData);
				
			}
			
			message.reply();
		});
	}
}

export default TextUserProgramHandlers;