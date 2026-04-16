import SingleInstanceRenderable from "../index.js";

class ClientPane extends SingleInstanceRenderable {
	style = [...this.style, "app/Renderable/SingleInstanceRenderable/ClientPane/main.css"];
	classes = [...this.classes, "client-pane"];
	
	animateRemoveDuration = 180;
	
	constructor(client) {
		super();
		this.client = client;
	}
	
	open() {
		this.render();
	}
}

export default ClientPane;