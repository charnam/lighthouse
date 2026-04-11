import Overlay from "../index.js";

class LoadingScreen extends Overlay {
	style = [...this.style, "app/Renderable/SingleInstanceRenderable/Overlay/LoadingScreen/main.css"];
	
	render() {
		const target = super.render();
		target.classList.add("loading-screen");
		return target;
	}
}

export default LoadingScreen;