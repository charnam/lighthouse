import SingleInstanceRenderable from "../SingleInstanceRenderable/index.js";

class ClientPane extends SingleInstanceRenderable {
	style = [...this.style, "app/Renderable/ClientPane/main.css"];
	classes = [...this.classes, "client-pane"];
	
	constructor(client) {
		super();
		this.client = client;
	}
	
	open() {
		this.render();
	}
}

export default ClientPane;