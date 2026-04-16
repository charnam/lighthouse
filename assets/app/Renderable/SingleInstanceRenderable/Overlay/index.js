import SingleInstanceRenderable from "../index.js";

class Overlay extends SingleInstanceRenderable {
	style = this.autoStyleByImport(import.meta.url);
	
	render() {
		const target = super.render();
		target.classList.add("overlay");
		return target;
	}
	
	open() {
		const target = this.render();
		document.getElementById("app").append(target);
		return target;
	}
}

export default Overlay;