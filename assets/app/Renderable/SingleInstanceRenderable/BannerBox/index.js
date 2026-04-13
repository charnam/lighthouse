import { HTML } from "imperative-html";
import SingleInstanceRenderable from "../index.js";
import Banner from "../Banner/index.js";

class BannerBox extends SingleInstanceRenderable {
	style = [...this.style, "app/Renderable/SingleInstanceRenderable/BannerBox/main.css"];
	
	render() {
		const target = super.render();
		
		target.append(
			new HTML.div({class: "banner-box"})
		);
		
		return target;
	}
	
	currentBanner = null;
	showMessage(type, text) {
		if(this.currentBanner) {
			this.currentBanner.remove();
		}
		
		const box = this.element.querySelector(".banner-box");
		const banner = new Banner(type, text);
		this.currentBanner = banner;
		banner.renderTo(box);
		
		setTimeout(() => {
			banner.remove();
		}, 4000);
	}
	
	show(event) {
		this.showMessage(event.data.bannerType, event.data.text);
	}
	detect(event) {
		if(event.data.type == "banner") {
			this.show(event);
			return true;
		} else {
			return false;
		}
	}
}

export default BannerBox;