import Connection from "../../Connection/index.js";
import LoadingScreen from "../LoadingScreen/index.js";
import Overlay from "../Overlay/index.js";

class Client extends Overlay {
	style = [...this.style, "app/Renderable/Client/main.css"];
	classes = [...this.classes, "client"];
	
	constructor(connection) {
		super();
		this.connection = connection;
	}
	
	static async create() {
		const loader = new LoadingScreen();
		loader.open();
		const connection = new Connection("/") // TODO: localsettings key
		const client = new Client(connection);
		client.renderTo(document.getElementById("app"));
		loader.remove();
	}
}

export default Client;