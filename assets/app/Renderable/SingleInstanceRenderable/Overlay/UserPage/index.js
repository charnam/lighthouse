import { HTML } from "imperative-html";
import User from "../../User/index.js";
import Overlay from "../index.js";
import LoadingScreen from "../LoadingScreen/index.js";
import Wallpaper from "../Wallpaper/index.js";

class UserPage extends Overlay {
	style = this.autoStyleByImport(import.meta.url);
	classes = [...this.classes, "user-page"];
	
	animateRemoveDuration = 1000;
	
	client = null;
	
	constructor(userid, client, openFrom) {
		super();
		this.client = client;
		this.userid = userid;
		this.openFrom = openFrom;
	}
	
	render() {
		const target = super.render();
		
		let closeButton;
		
		target.append(
			closeButton = new HTML.div({class: "user-page-close bi-arrow-left"}),
			new HTML.div({class: "user-page-user-details"},
				new User(this.userid, this.client, {clickable: false}).render(),
				new HTML.div({class: "user-page-user-bio"}),
				new HTML.div({class: "user-page-user-creation bi-cake2"})
			),
			new HTML.div({class: "user-page-wallpaper-wrap"})
		)
		
		if(this.openFrom) {
			const originPfp = this.openFrom.querySelector(".user-pfp");
			
			const originRect = originPfp.getBoundingClientRect();
			
			target.setAttribute("style", `
				--pfp-x-origin: ${originRect.x}px;
				--pfp-y-origin: ${originRect.y}px;
				--pfp-width-origin: ${originRect.width}px;
				--pfp-height-origin: ${originRect.height}px;
			`)
		}
		
		closeButton.addEventListener("click", () => {
			this.remove();
		})
		
		this.update();
		return target;
	}
	
	async beforeRemove() {
		await super.beforeRemove();
		
		
	}
	
	async updateRendered(target) {
		await super.updateRendered(target);
		
		const loader = new LoadingScreen();
		loader.open();
		
		const details = (await this.client.connection.request("profile-details", this.userid)).data;
		
		const wallpaperWrapper = target.querySelector(".user-page-wallpaper-wrap");
		wallpaperWrapper.innerHTML = "";
		wallpaperWrapper.append(
			new Wallpaper(`/uploads/${details.wallpaper}`).render()
		);
		
		const bio = target.querySelector(".user-page-user-bio")
		bio.innerText = details.bio;
		
		const creation = target.querySelector(".user-page-user-creation")
		creation.innerText = new Date(details.creation).toLocaleString(undefined, {dateStyle: "full", timeStyle: "short"});
		
		loader.remove();
	}
}

export default UserPage
