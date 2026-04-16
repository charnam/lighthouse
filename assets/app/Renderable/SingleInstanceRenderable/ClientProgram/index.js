import SingleInstanceRenderable from "../index.js";

class ClientProgram extends SingleInstanceRenderable {
	static types = {};
	static handle(type, object) {
		this.types[type] = object;
	}
	
	style = [...this.style, "app/Renderable/SingleInstanceRenderable/ClientProgram/main.css"];
	classes = [...this.classes, "group-pane", "program-pane", "client-program"];
	
	constructor(client, details) {
		if(this.prototype instanceof ClientProgram) {
			return new this.prototype.types[details.type](client, details);
		}
		
		this.client = client;
		this.id = details.programid;
	}
	
	
}

export default ClientProgram;
