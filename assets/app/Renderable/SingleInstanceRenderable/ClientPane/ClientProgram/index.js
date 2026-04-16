import ClientPane from "../index.js";

class ClientProgram extends ClientPane {
	style = this.autoStyleByImport(import.meta.url);
	classes = [...this.classes, "group-pane", "program-pane", "client-program"];
	
	constructor(client, details) {
		super();
		this.client = client;
		this.programid = details.programid;
	}
	
	
}

export default ClientProgram;
