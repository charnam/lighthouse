import Permissions from "../../variables/Permissions.js";
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
			
			if(this.session.db.helpers.getUserProgramPermissions(this.session.userid, programid) & Permissions.bitmask.byName.VIEW_PROGRAM) {
				message.reply(false);
			}
			
			const messages = await this.session.db.helpers.getMessages(programid, point, direction);
			
			message.reply(messages);
		});
		this.handlers.handle("text-program-get-message", async message => {
			const id = message.data;
			
		});
	}
}

export default TextUserProgramHandlers;