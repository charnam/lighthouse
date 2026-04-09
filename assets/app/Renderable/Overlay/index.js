import SingleInstanceRenderable from "../SingleInstanceRenderable/index.js";

class Overlay extends SingleInstanceRenderable {
	style = [...this.style, "app/Renderable/Overlay/main.css"];
	
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