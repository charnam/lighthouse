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
		this.options = options ?? {};
	}
	
	render() {
		const target = super.render();
		
		target.append(
			new HTML.div({class: "user-pfp"},
				new HTML.div({class: "user-activity"})
			),
			new HTML.div({class: "user-name"}),
			new HTML.div({class: "user-status"}),
			new HTML.div({class: "user-tag"}),
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
			
			if(this.options.clickable ?? true) {
				target.classList.add("user-is-clickable")
				target.addEventListener("click", () => {
					this.openProfile();
				})
			}
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
			this.details = (await this.client.connection.request("user-details", {
				userid: this.userid,
				programid: this.options.programid,
				groupid: this.options.groupid
			})).data;
		}
		
		if(this.details.pfp) {
			target.classList.add("user-pfp-available");
		} else {
			target.classList.remove("user-pfp-available");
		}
		
		const userPfp = target.querySelector(".user-pfp");
		const userName = target.querySelector(".user-name");
		const userTag = target.querySelector(".user-tag");
		const userStatus = target.querySelector(".user-status");
		const userActivity = target.querySelector(".user-activity");
		
		userPfp.setAttribute("style", `
			--image: url("/uploads/${this.details.pfp}");
		`);
		userName.innerText = this.details.displayname;
		userTag.innerText = this.details.username;
		userStatus.innerText = this.details.status;
		userActivity.setAttribute("activity", this.details.activity);
		
	}
}

export default User;