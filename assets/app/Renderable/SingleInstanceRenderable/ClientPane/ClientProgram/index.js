import ClientPane from "../index.js";

class ClientProgram extends ClientPane {
	style = this.autoStyleByImport(import.meta.url);
	classes = [...this.classes, "group-pane", "program-pane", "client-program"];
	
	constructor(client, details) {
		super();
		this.client = client;
		this.programid = details.programid;
		this.client.connection.expect("program-subscribe", this.programid, "Failed to join program; error 1")
	}
	
	render() {
		const target = super.render();
		
		target.setAttribute("data-program-id", this.programid);
		
		return target;
	}
	
	async remove() {
		return Promise.all([
			super.remove(),
			this.client.connection.expect("unsubscribe", this.programid, "Failed to leave program; error 2")
		]);
	}
	
}

export default ClientProgram;
