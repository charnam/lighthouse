import ClientPane from "../index.js";

class ClientProgram extends ClientPane {
	style = this.autoStyleByImport(import.meta.url);
	classes = [...this.classes, "group-pane", "program-pane", "client-program"];
	
	constructor(client, details) {
		super();
		this.client = client;
		this.programid = details.programid;
		this.client.connection.request("program-subscribe", this.programid)
	}
	
	render() {
		const target = super.render();
		
		target.setAttribute("data-program-id", this.programid);
		
		return target;
	}
	
	async remove() {
		return Promise.all([
			super.remove(),
			this.client.connection.request("unsubscribe", this.programid)
		]);
	}
	
}

export default ClientProgram;
