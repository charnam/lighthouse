import { HTML } from "imperative-html";
import SingleInstanceRenderable from "../index.js";
import ContextMenu from "../Overlay/ContextMenu/index.js";
import ContextMenuClickableOption from "../ContextMenuOption/ContextMenuClickableOption/index.js";
import UserPage from "../Overlay/UserPage/index.js";

class User extends SingleInstanceRenderable {
	style = this.autoStyleByImport(import.meta.url);
	classes = [...this.classes, "user"];
	
	constructor(detailsOrUserId, client, options) {
		super();
		if(typeof detailsOrUserId == "string") {
			this.userid = detailsOrUserId;
		} else {
			this.details = detailsOrUserId;
			this.userid = detailsOrUserId.userid;
		}
		this.client = client;
		this.options = options;
	}
	
	render() {
		const target = super.render();
		
		target.append(
			new HTML.div({class: "user-pfp"}),
			new HTML.div({class: "user-name"})
		);
		if(this.client) {
			target.classList.add("user-has-client");
			
			const menu = new ContextMenu([
				new ContextMenuClickableOption({
					text: "View Profile",
					callback: () => {
						this.openProfile();
					}
				})
			]);
			menu.handleDefaultContextMenu(target);
			
			target.addEventListener("click", () => {
				this.openProfile();
			})
		}
		
		this.update();
		return target;
	}
	
	openProfile() {
		const page = new UserPage(this.details.userid, this.client, this.element);
		page.open();
	}
	
	async updateRendered(target) {
		if(!this.details) {
			this.details = (await this.client.connection.request("user-details", this.userid)).data;
		}
		
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