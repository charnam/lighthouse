import Overlay from "../Overlay/index.js";

class Client extends Overlay {
	style = [...this.style, "app/Renderable/Client/main.css"];
	classes = [...this.classes, "client"];
	
	constructor(connection) {
		super();
		this.connection = connection;
	}
	
	static async create() {
		
	}
}

export default Client;