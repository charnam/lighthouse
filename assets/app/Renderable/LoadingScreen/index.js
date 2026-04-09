import Overlay from "../Overlay/index.js";

class LoadingScreen extends Overlay {
	render() {
		const target = super.render();
		target.classList.add("loading-screen");
		return target;
	}
}

export default LoadingScreen;