import { HTML } from "imperative-html";
import Overlay from "../index.js";

class LoadingScreen extends Overlay {
	style = this.autoStyleByImport(import.meta.url);
	animateRemoveDuration = 1000;
	
	render() {
		const target = super.render();
		target.classList.add("loading-screen");
		target.append(
			new HTML.div({class: "loading-screen-wrap"})
		);
		return target;
	}
}

export default LoadingScreen;