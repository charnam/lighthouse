import { HTML } from "imperative-html";
import Overlay from "../index.js";

class ContextMenu extends Overlay {
	style = this.autoStyleByImport(import.meta.url);
	classes = [...this.classes, "context-menu-overlay"];
	
	x = 0;
	y = 0;
	
	constructor(options) {
		super();
		this.options = options;
		for(let option of options) {
			option.menu = this;
		}
	}
	
	render() {
		const target = super.render();
		
		target.append(
			new HTML.div({class: "context-menu"},
				new HTML.div({class: "context-menu-options-list"})
			)
		);
		
		target.addEventListener("mousedown", event => {
			if(event.target == target)
				this.remove();
		})
		
		this.update();
		return target;
	}
	
	updateRendered(target) {
		target.setAttribute("style", `
			--x: ${this.x}px;
			--y: ${this.y}px;
		`)
		const optionsList = target.querySelector(".context-menu-options-list");
		for(let option of this.options) {
			option.menu = this;
			option.renderTo(optionsList);
		}
	}
	
	handleDefaultContextMenu(target) {
		target.addEventListener("contextmenu", event => {
			const selection = document.getSelection();
			if(selection.rangeCount > 0) {
				let range = selection.getRangeAt(0);
				if(range.toString().length > 0) {
					return;
				}
			}
			
			event.stopPropagation();
			event.preventDefault();
			this.x = event.clientX;
			this.y = event.clientY;
			this.open();
		});
	}
	
}

export default ContextMenu;