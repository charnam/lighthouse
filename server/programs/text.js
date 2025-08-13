// This is unfinished, and so far it is unused. Please ignore this file. For better organization, code should be moved here in the future.

const Program = require("programs/program.js");

class TextProgram extends Program {
	handle_interaction(event) {
		
	}
	constructor(session, options) {
		session.currentProgram = options;
		super(session);
	}
}
