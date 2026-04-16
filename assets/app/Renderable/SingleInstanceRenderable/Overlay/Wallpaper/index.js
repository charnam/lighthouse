import Overlay from "../index.js";

class Wallpaper extends Overlay {
	style = this.autoStyleByImport(import.meta.url);
	classes = [...this.classes, "wallpaper"];
	
	animateRemoveDuration = 1000;
	
	constructor(url) {
		super();
		this.url = url;
	}
	
	render() {
		const target = super.render();
		this.update();
		return target;
	}
	
	async updateRendered(target) {
		super.updateRendered(target);
		target.setAttribute("style", `
			background-image: url("${this.url}");
		`)
	}
}

export default Wallpaper;
