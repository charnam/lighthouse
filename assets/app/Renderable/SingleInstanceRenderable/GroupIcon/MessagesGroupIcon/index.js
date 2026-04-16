import GroupIcon from "../index.js";

class MessagesGroupIcon extends GroupIcon {
	style = this.autoStyleByImport(import.meta.url);
	classes = [...this.classes, "messages-group-icon", "bi-envelope-fill"]
	
	constructor(client) {
		super(client, {groupname: "Messages", groupid: "messages"});
	}
	
	async open() {
		await super.open();
	}
}

export default MessagesGroupIcon;