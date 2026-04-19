import ContextMenuOption from "../index.js";

class ContextMenuClickableOption extends ContextMenuOption {
	style = this.autoStyleByImport(import.meta.url);
	classes = [...this.classes, "context-menu-clickable-option"];
	
	render() {
		const target = super.render();
		
		target.addEventListener("mouseup", () => {
			if(typeof this.details.callback == "function")
				this.details.callback(this);
			if(this.details.autoclose ?? true) {
				this.menu.remove();
			}
		})
		
		return target;
	}
}

export default ContextMenuClickableOption;