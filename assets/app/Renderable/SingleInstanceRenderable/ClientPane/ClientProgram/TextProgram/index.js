import { HTML } from "imperative-html";
import ClientProgram from "../index.js";
import Message from "../../../Message/index.js";
import MarkupEditor from "../../../MarkupEditor/index.js";

class TextProgram extends ClientProgram {
	style = this.autoStyleByImport(import.meta.url);
	classes = [...this.classes, "text-program"]
	
	textbox = new MarkupEditor();
	
	render() {
		const target = super.render();
		
		let uploadButton,
			sendButton,
			loadHistoric,
			loadFuturistic;
		
		target.append(
			new HTML.div({class: "text-program-message-history-scroll"},
				loadFuturistic = new HTML.div({class: "text-program-message-history-load-futuristic"}),
				new HTML.div({class: "text-program-message-history"}),
				loadHistoric = new HTML.div({class: "text-program-message-history-load-historic"}),
			),
			new HTML.div({class: "text-program-box"},
				uploadButton = new HTML.div({class: "text-program-box-upload bi-upload"}),
				this.textbox.render(),
				sendButton = new HTML.div({class: "text-program-box-send"}),
			),
			new HTML.div({class: "text-program-typing-alerts"}),
		);
		
		this.textbox.composeBox.addEventListener("keydown", event => {
			if(event.key == "Enter" && !event.shiftKey) {
				event.preventDefault();
				this.send();
			}
		});
		
		sendButton.addEventListener("click", () => {
			this.send();
		})
		
		this.handler = this.client.connection.handle("text-program-receive-message", message => {
			const historyEl = target.querySelector(".text-program-message-history");
			
			new Message(message.data, this.client)
				.renderTo(historyEl)
			
			const sound = new Audio();
			sound.autoplay = true;
			
			if(message.data.userid == this.client.userid) {
				sound.src = "/audio/message-receive.mp3";
			} else {
				sound.src = "/audio/message-send.mp3";
			}
		})
		
		
		
		this.updateMessageHistory(target);
		
		return target;
	}
	
	async beforeRemove() {
		this.handler.disable();
		await super.beforeRemove();
	}
	
	async send() {
		const sent = this.textbox.value;
		this.textbox.value = "";
		
		this.client.connection.request("text-program-send-message", {
			programid: this.programid,
			content: sent
		});
	}
	
	async updateMessageHistory(target, event = {}) {
		const scroller = target.querySelector(".text-program-message-history-scroll");
		const history = target.querySelector(".text-program-message-history");
		const messageElements = [...history.querySelectorAll(".message")]
		
		const pointMessage = messageElements.find(message => message.getAttribute("messageid") == event.point);
		
		let originalScroll;
		
		if(pointMessage) {
			originalScroll = pointMessage.getBoundingClientRect().y;
		}
		
		event = {
			point: "initial",
			direction: "historic",
			...event
		};
		
		const messages = await this.client.connection.request("text-program-get-message-history", {
			...event,
			programid: this.programid, 
		});
		
		let targetMessage;
		if(event.point == "initial") {
			targetMessage = null;
		}
		
		for(let message of messages.data) {
			const foundMessage =
				messageElements
					.find(child => child.renderable.details.messageid == message.messageid);
			
			if(foundMessage) {
				targetMessage = foundMessage;
			}
		}
		
		for(let message of messages.data) {
			const messageEl = new Message(message, this.client).render();
			
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
		
		if(pointMessage) {
			scroller.scrollTop += originalScroll - pointMessage.getBoundingClientRect().y;
		}
	}
	
}

export default TextProgram;