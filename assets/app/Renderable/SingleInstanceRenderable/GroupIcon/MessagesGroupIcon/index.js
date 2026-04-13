import GroupIcon from "../index.js";

class MessagesGroupIcon extends GroupIcon {
	style = [...this.style, "app/Renderable/SingleInstanceRenderable/GroupIcon/main.css"];
	classes = [...this.classes, "messages-group-icon", "bi-envelope-fill"]
	
	constructor(client) {
		super(client, {groupname: "Messages", groupid: "messages"});
	}
	
	async open() {
		await super.open();
	}
}

export default MessagesGroupIcon;