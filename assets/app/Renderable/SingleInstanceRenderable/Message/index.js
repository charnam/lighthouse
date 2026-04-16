import { HTML } from "imperative-html";
import SingleInstanceRenderable from "../index.js";

class Message extends SingleInstanceRenderable {
	style = this.autoStyleByImport(import.meta.url);
	classes = [...this.classes, "message"];
	
	constructor(details, client) {
		this.details = details;
		this.client = client;
	}
	
	render() {
		const target = super.render();
		
		target.innerText = this.details.content + " - " + this.details.user.displayname;
		
		return target;
	}
}

export default Message;