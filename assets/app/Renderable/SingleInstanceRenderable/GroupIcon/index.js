import SingleInstanceRenderable from "../index.js";

class GroupIcon extends SingleInstanceRenderable {
	style = this.autoStyleByImport(import.meta.url);
	classes = [...this.classes, "group-icon"]
	
	client = null;
	details = {};
	
	constructor(client, details) {
		super();
		this.client = client;
		this.details = details;
	}
	
	render() {
		const target = super.render();
		target.addEventListener("click", () => this.open());
		this.update();
		return target;
	}
	
	async open() {
		this.element.classList.remove("group-icon-anim");
		void this.element.offsetWidth;
		this.element.classList.add("group-icon-anim");
		
		this.element.classList.add("group-icon-opening");
		await this.client.openGroup(this.details.groupid);
		this.element.classList.remove("group-icon-opening");
	}
	
	async updateRendered(target) {
		if(this.details.groupname) {
			target.setAttribute("title", this.details.groupname);
			target.setAttribute("group-icon-sym", this.details.groupname.slice(0,1));
		}
		if(this.details.icon) {
			target.classList.add("has-image")
			target.setAttribute("style", `--icon: url("/uploads/${this.details.icon}")`);
		} else {
			target.classList.remove("has-image")
		}
		const subscriptions = await this.client.connection.request("get-subscriptions");
		if(subscriptions.data.includes(this.details.groupid)) {
			target.classList.add("group-icon-open")
		} else {
			target.classList.remove("group-icon-open")
		}
	}
}

export default GroupIcon;