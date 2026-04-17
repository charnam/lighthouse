
class UserProgramHandlers {
	constructor(session) {
		this.session = session;
		this.setupHandlers();
	}
	setupHandlers() {
		this.session.programHandlers.handle("program-details", async message => {
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