import Connection from "../../../../../shared/Connection.js";
import GroupList from "../../ClientPane/GroupList/index.js";
import GroupSidebar from "../../ClientPane/GroupSidebar/index.js";
import TextProgram from "../../ClientPane/ClientProgram/TextProgram/index.js";
import ClientProgram from "../../ClientPane/ClientProgram/index.js";
import LoadingScreen from "../LoadingScreen/index.js";
import LoginMenu from "../LoginMenu/index.js";
import Wallpaper from "../Wallpaper/index.js";
import Overlay from "../index.js";

class Client extends Overlay {
	style = this.autoStyleByImport(import.meta.url);
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
	
	_groupOpenTransitionId = null;
	async openGroup(id) {
		if(this.wallpaper)
			this.wallpaper.remove();
		
		const groupPanes = this.element.querySelectorAll(".group-pane");
		
		let transitionId = this._groupOpenTransitionId = Date.now();
		if(groupPanes.length > 0) {
			await Promise.all([...groupPanes].map(pane => pane.renderable.remove()));
		}
		const groupDetails = (await this.connection.request("group-details", id)).data;
		
		if(transitionId == this._groupOpenTransitionId) {
			const sidebar = new GroupSidebar(this, id);
			sidebar.renderTo(this.element);
			
			if(groupDetails.wallpaper) {
				this.wallpaper = new Wallpaper("/uploads/"+groupDetails.wallpaper);
				this.wallpaper.renderTo(this.element);
			}
		}
	}
	
	_programOpenTransitionId = null;
	async openProgram(id) {
		const programPanes = this.element.querySelectorAll(".program-pane");
		
		let transitionId = this._programOpenTransitionId = Date.now();
		if(programPanes.length > 0) {
			await Promise.all([...programPanes].map(pane => pane.renderable.remove()));
		}
		
		const program = (await this.connection.request("program-details", id)).data;
		if(transitionId == this._programOpenTransitionId) {
			let programView;
			switch(program.type) {
				case "text":
					programView = new TextProgram(this, program);
					break;
				case "info":
					programView = new TextProgram(this, program);
					break;
			}
			
			
			programView.renderTo(this.element);
		}
	}
}

export default Client;