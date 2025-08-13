
const logger = require("helpers/logger.js");

class Program {
	handle_interaction(event) {
		if(event)
			logger.log(0, "Received event "+event.type+", not handled");
	}
	output(data) {
		this.socket.emit("program-output", data);
	}
	sync() {
		this.session.sync_program(this, this.handle_interaction);
	}
	constructor(session) {
		this.session = session;
		this.program = session.currentProgram;
		
		session.socket.on("program-interaction", this.handle_interaction);
		this.sync();
	}
}

module.exports = Program;