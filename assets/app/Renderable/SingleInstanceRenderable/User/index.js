import { HTML } from "imperative-html";
import SingleInstanceRenderable from "../index.js";

class User extends SingleInstanceRenderable {
	style = this.autoStyleByImport(import.meta.url);
	classes = [...this.classes, "user"];
	
	constructor(details, client) {
		super();
		this.details = details;
		this.client = client;
	}
	
	render() {
		const target = super.render();
		
		target.append(
			new HTML.div({class: "user-pfp"}),
			new HTML.div({class: "user-name"})
		)
		
		this.update();
		return target;
	}
	
	async updateRendered(target) {
		if(this.details.pfp) {
			target.classList.add("user-pfp-available");
		} else {
			target.classList.remove("user-pfp-available");
		}
		
		const userPfp = target.querySelector(".user-pfp");
		const userName = target.querySelector(".user-name");
		
		userPfp.setAttribute("style", `
			--image: url("/uploads/${this.details.pfp}");
		`);
		userName.innerText = this.details.displayname;
	}
}

export default User;