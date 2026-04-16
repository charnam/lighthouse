import { HTML } from "imperative-html";
import SingleInstanceRenderable from "../index.js";

class Banner extends SingleInstanceRenderable {
	style = this.autoStyleByImport(import.meta.url);
	animateRemoveDuration = 1000;
	
	constructor(type, text) {
		super();
		this.type = type;
		this.text = text;
	}
	
	render() {
		const target = super.render();
		target.classList.add("banner");
		target.classList.add("banner-type-"+this.type);
		target.innerText = this.text;
		return target;
	}
	
}

export default Banner;