import MessageHandlerGroup from "../../../assets/shared/MessageHandlerGroup.js";

class UserProgramHandlers {
	constructor(session) {
		this.session = session;
		this.handlers = new MessageHandlerGroup(this.session.client.connection);
		this.setupHandlers();
	}
	setupHandlers() {
		this.handlers.handle("program-details", async message => {
			const programid = message.data;
			if(!programid) return;
			
			message.reply(await this.getDetails(programid));
		});
	}
	
	async getDetails(programid) {
		return await this.session.db.helpers.getProgramDetailsAsUser(programid, this.session.userid);
	}
}

export default UserProgramHandlers;