import { HTML } from "imperative-html";
import SingleInstanceRenderable from "../index.js";
import ClientProgram from "../ClientProgram/index.js";

class GroupSidebarProgram extends SingleInstanceRenderable {
	style = [...this.style, "app/Renderable/SingleInstanceRenderable/GroupSidebarProgram/main.css"];
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
	
	updateRendered(target) {
		target.innerHTML = "";
		
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
	}
	
	open() {
		this.client.openProgram(this.details.programid);
	}
}

export default GroupSidebarProgram;