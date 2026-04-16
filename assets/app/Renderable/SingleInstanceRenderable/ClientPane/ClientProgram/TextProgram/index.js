import { HTML } from "imperative-html";
import ClientProgram from "../index.js";
import Message from "../../../Message/index.js";

class TextProgram extends ClientProgram {
	style = this.autoStyleByImport(import.meta.url);
	classes = [...this.classes, "text-program"]
	
	render() {
		const target = super.render();
		
		target.append(
			new HTML.div({class: "text-program-message-history"}),
			new HTML.div({class: "text-program-typing-alerts"}),
			new HTML.div({class: "text-program-box"},
				new HTML.div({class: "text-program-box-upload bi-upload"}),
				new HTML.div({class: "text-program-box-compose"}),
				new HTML.div({class: "text-program-box-send"}),
			)
		);
		
		this.updateMessageHistory(target);
		
		return target;
	}
	
	async updateMessageHistory(target, event = {}) {
		const history = target.querySelector(".text-program-message-history");
		
		event = {
			point: "initial",
			direction: "historic",
			...event
		};
		
		const messages = await this.client.connection.request("message-history", {
			...event,
			programid: this.programid, 
		});
		
		let targetMessage;
		if(event.point == "initial") {
			targetMessage = null;
		}
		
		let messageElements =
			[...history.querySelectorAll(".message")]
		for(let message of messages.data) {
			const foundMessage =
				messageElements
					.find(child => child.renderable.details.messageid == message.messageid);
			
			if(foundMessage) {
				targetMessage = foundMessage;
			}
		}
		
		for(let message of messages.data) {
			const messageEl = new Message(message).render();
			
			if(targetMessage) {
				if(event.direction == "historic") {
					targetMessage.insertAdjacentElement("beforebegin", messageEl);
				} else {
					targetMessage.insertAdjacentElement("afterend", messageEl);
				}
			} else {
				history.append(messageEl);
			}
			
			targetMessage = messageEl;
		}
		
	}
	
}

export default TextProgram;