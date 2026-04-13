import Connection from "../../../../../shared/Connection.js";
import GroupList from "../../ClientPane/GroupList/index.js";
import LoadingScreen from "../LoadingScreen/index.js";
import LoginMenu from "../LoginMenu/index.js";
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
		super.updateRendered(target);
	}
	
	static async create() {
		const loader = new LoadingScreen();
		loader.open();
		
		const connection = new Connection("/lighthouse") // TODO: localsettings key
		await connection.connectClient();
		
		const client = new Client(connection);
		client.renderTo(document.getElementById("app"));
		
		const token = localStorage.getItem("DO_NOT_SHARE_THIS_TOKEN_WITH_ANYONE_INCLUDING_ADMINS");
		let loginSuccess = false;
		if(token) {
			loginSuccess = (await connection.request("token", token)).data;
		}
		
		loader.remove();
		
		if(!loginSuccess) {
			await LoginMenu.login(client);
		}
		
		new GroupList(client).renderTo(client.element);
	}
	
	async openGroup(id) {
		const groupPanes = this.element.querySelectorAll(".group-pane");
		
		if(groupPanes.length > 0) {
			await Promise.all(groupPanes.map(pane => pane.renderable.remove()));
		}
		
		const detailsResponse = await this.connection.request("group-details", id);
		
		console.log(detailsResponse);
		if(detailsResponse) {
			
		}
	}
}

export default Client;