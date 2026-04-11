import Connection from "../../../../../shared/Connection.js";
import LoadingScreen from "../LoadingScreen/index.js";
import Overlay from "../index.js";

class Client extends Overlay {
	style = [...this.style, "app/Renderable/SingleInstanceRenderable/Overlay/Client/main.css"];
	classes = [...this.classes, "client"];
	
	constructor(connection) {
		super();
		this.connection = connection;
	}
	
	render() {
		const target = super.render();
		this.update();
		return target;
	}
	
	async updateRendered(target) {
		console.log(await this.connection.request("session-state"));
	}
	
	static async create() {
		const loader = new LoadingScreen();
		loader.open();
		
		const connection = new Connection("/lighthouse") // TODO: localsettings key
		await connection.connectClient();
		
		const client = new Client(connection);
		client.renderTo(document.getElementById("app"));
		loader.remove();
	}
}

export default Client;