import { HTML } from "imperative-html";
import ClientPane from "../index.js";
import GroupSidebarProgram from "../../GroupSidebarProgram/index.js";

class GroupSidebar extends ClientPane {
	style = [...this.style, "app/Renderable/SingleInstanceRenderable/ClientPane/GroupSidebar/main.css"];
	classes = [...this.classes, "group-pane", "group-sidebar"];
	
	groupid = null;
	
	constructor(client, groupid) {
		super(client);
		this.groupid = groupid;
	}
	
	render() {
		const target = super.render();
		
		target.append(
			new HTML.div({class: "group-sidebar-titlebar"}),
			new HTML.div({class: "group-sidebar-programs"})
		);
		
		this.update();
		return target;
	}
	
	async updateRendered(target) {
		super.updateRendered(target);
		const titlebarEl = target.querySelector(".group-sidebar-titlebar")
		const programsEl = target.querySelector(".group-sidebar-programs");
		
		const programList = await this.client.connection.request("group-programs", this.groupid);
		
		for(let program of programList.data) {
			const programRenderable = new GroupSidebarProgram(this.client, program);
			programRenderable.renderTo(programsEl);
		}
		
		const groupDetails = await this.client.connection.request("group-details", this.groupid);
		
		titlebarEl.innerText = groupDetails.data.groupname;
	}
}

export default GroupSidebar;