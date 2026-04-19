import { HTML } from "imperative-html";
import SingleInstanceRenderable from "../index.js";

class ContextMenuOption extends SingleInstanceRenderable {
	style = this.autoStyleByImport(import.meta.url);
	classes = [...this.classes, "context-menu-option"];
	
	menu = null;
	details = {};
	
	constructor(details, menu) {
		super();
		this.details = details;
		this.menu = menu;
	}
	
	render() {
		const target = super.render();
		
		let textEl,
			iconEl;
		
		target.append(
			iconEl = new HTML.div({class: "context-menu-icon"}),
			textEl = new HTML.div({class: "context-menu-text"})
		);
		
		this.update();
		return target;
	}
	
	updateRendered(target) {
		const iconEl = target.querySelector(".context-menu-icon");
		const textEl = target.querySelector(".context-menu-text");
		
		for(let c of [...iconEl.classList]) {
			// Remove icon class
			if(c.startsWith("bi-")) iconEl.classList.remove(c);
		}
		
		// Add new icon class
		iconEl.classList.add(this.details.icon);
		textEl.innerText = this.details.text;
		
	}
}

export default ContextMenuOption