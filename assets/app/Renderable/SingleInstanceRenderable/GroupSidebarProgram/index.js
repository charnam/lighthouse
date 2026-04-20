import { HTML } from "imperative-html";
import SingleInstanceRenderable from "../index.js";
import ClientProgram from "../ClientPane/ClientProgram/index.js";

class GroupSidebarProgram extends SingleInstanceRenderable {
	style = this.autoStyleByImport(import.meta.url);
	classes = [...this.classes, "group-sidebar-program"];
	
	constructor(client, details) {
		super();
		this.client = client;
		this.details = details;
	}
	
	render() {
		const target = super.render();
		target.addEventListener("click", () => this.open());
		
		this.update();
		return target;
	}
	
	async updateRendered(target) {
		target.innerHTML = "";
		
		target.setAttribute("data-program-id", this.details.programid)
		target.append(
			new HTML.style(`
				#app:has(.client-program[data-program-id="${this.details.programid}"]:not(.is-removing)) .group-sidebar-program[data-program-id="${this.details.programid}"] {
					background: #fff1;
					outline: 1px solid #fff6;
					outline-offset: 0px;
				}
			`)
		);
		
		let nameField;
		target.append(
			nameField = new HTML.div({class: "group-sidebar-program-name"})
		);
		
		nameField.innerText = this.details.name;
		
		switch(this.details.type) {
			case "text":
				target.classList.add("bi-hash");
				break;
			case "info":
				target.classList.add("bi-journal-bookmark-fill");
				break;
		}
		
		const subscriptions = (await this.client.connection.request("get-subscriptions")).data;
		
		if(subscriptions.includes(this.details.programid)) {
			target.classList.add("open");
		} else {
			target.classList.remove("open");
		}
		
	}
	
	open() {
		this.client.openProgram(this.details.programid);
	}
}

export default GroupSidebarProgram;