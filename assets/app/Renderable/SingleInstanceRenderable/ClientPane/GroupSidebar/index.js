import { HTML } from "imperative-html";
import ClientPane from "../index.js";
import GroupSidebarProgram from "../../GroupSidebarProgram/index.js";

class GroupSidebar extends ClientPane {
	style = this.autoStyleByImport(import.meta.url);
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
		
		const programList = await this.client.connection.expect("group-programs", this.groupid, "Failed to fetch group programs; error 6");
		
		for(let program of programList) {
			const programRenderable = new GroupSidebarProgram(this.client, program);
			programRenderable.renderTo(programsEl);
		}
		
		const groupDetails = await this.client.connection.expect("group-details", this.groupid, "Failed to fetch group details; error 7");
		
		titlebarEl.innerText = groupDetails.groupname;
	}
}

export default GroupSidebar;