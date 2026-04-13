import { HTML } from "imperative-html";
import ClientPane from "../index.js";
import MessagesGroupIcon from "../../GroupIcon/MessagesGroupIcon/index.js";
import GroupIcon from "../../GroupIcon/index.js";

class GroupList extends ClientPane {
	style = [...this.style, "app/Renderable/SingleInstanceRenderable/ClientPane/GroupList/main.css"];
	classes = [...this.classes, "group-list"];
	
	render() {
		const target = super.render();
		
		target.append(
			new HTML.div({class: "group-list-messages-group-wrapper"},
				new MessagesGroupIcon(this.client).render(),
			),
			new HTML.div({class: "group-list-joined-groups"})
		);
		
		this.update();
		return target;
	}
	
	async updateRendered(target) {
		super.updateRendered(target);
		const joinedGroupsEl = target.querySelector(".group-list-joined-groups")
		
		const groupsResponse = await this.client.connection.request("group-list");
		
		for(let group of groupsResponse.data) {
			const groupInstances = [...joinedGroupsEl.children].filter(child => child.renderable.details.groupid == group.groupid);
			if(groupInstances.length > 0) {
				groupInstances[0].renderable.details = group;
				groupInstances[0].renderable.update();
			} else {
				new GroupIcon(this.client, group).renderTo(joinedGroupsEl);
			}
			for(let instance of groupInstances.slice(1)) {
				instance.renderable.remove();
			}
		}
		
		for(let groupEl of joinedGroupsEl.children) {
			if(!groupsResponse.data.some(item => item.groupid == groupEl.renderable.details.groupid)) {
				groupEl.renderable.remove();
			}
		}
	}
}

export default GroupList;