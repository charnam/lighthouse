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
				loadHistoric = new HTML.div({class: "text-program-message-history-load text-program-message-history-load-historic"}),
				new HTML.div({class: "text-program-message-history"}),
				loadFuturistic = new HTML.div({class: "text-program-message-history-load text-program-message-history-load-futuristic"}),
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
		
		this.handler = this.client.connection.handle("text-program-receive-message", async message => {
			const historyEl = target.querySelector(".text-program-message-history");
			
			new Message(message.data, this.client)
				.renderTo(historyEl)
			
			const sound = new Audio();
			sound.autoplay = true;
			
			if(message.data.user.userid == this.client.userid) {
				sound.src = "/audio/message-receive.mp3";
			} else {
				sound.src = "/audio/message-send.mp3";
			}
		})
		
		this.observeIntersectionsOn(loadHistoric, "historic");
		this.observeIntersectionsOn(loadFuturistic, "futuristic");
		
		this.updateMessageHistory(target);
		
		loadFuturistic.style.display = "none";
		
		return target;
	}
	
	observers = [];
	observeIntersectionsOn(target, type) {
		const observer = new IntersectionObserver((entries) => {
			if(!entries.some(entry => entry.isIntersecting)) return;
			
			const messages = this.element.querySelector(".text-program-message-history").children;
			
			if(messages.length <= 0) return;
			
			this.updateMessageHistory(this.element, {
				direction: type,
				point: type == "historic" ?
					messages[0].renderable.details.messageid :
					messages[messages.length-1].renderable.details.messageid
			})
		},
		{
			
		});
		
		observer.observe(target);
	}
	
	checkObservations() {
		
		
	}
	
	async beforeRemove() {
		this.handler.disable();
		await super.beforeRemove();
	}
	
	async send() {
		const sent = this.textbox.value;
		this.textbox.value = "";
		
		this.client.connection.expect("text-program-send-message", {
			programid: this.programid,
			content: sent
		}, "Failed to send message; error 3");
	}
	
	async updateMessageHistory(target, event = {}) {
		const scroller = target.querySelector(".text-program-message-history-scroll");
		const history = target.querySelector(".text-program-message-history");
		const loadHistoric = document.querySelector(".text-program-message-history-load-historic");
		const loadFuturistic = document.querySelector(".text-program-message-history-load-futuristic");
		let messageElements = [...history.querySelectorAll(".message")]
		
		event = {
			point: "initial",
			direction: "historic",
			...event
		};
		
		await new Promise(res => setTimeout(res, 200));
		const messages = await this.client.connection.expect("text-program-get-message-history", {
			...event,
			programid: this.programid, 
		}, "Failed to get message history; error 4");
		
		let targetMessage;
		if(event.point == "initial") {
			targetMessage = null;
		}
		
		const pointMessage = messageElements.find(message => message.renderable.details.messageid == event.point);
		
		let originalPointMessage;
		
		if(pointMessage) {
			originalPointMessage = pointMessage.getBoundingClientRect().y;
		}
		
		for(let message of messages) {
			const foundMessage =
				messageElements
					.find(child => child.renderable.details.messageid == message.messageid);
			
			if(foundMessage) {
				targetMessage = foundMessage;
			}
		}
		
		let messagesChanged = 0;
		for(let message of messages) {
			if(messageElements.some(messageEl => messageEl.renderable.details.messageid == message.messageid)) continue;
			
			messagesChanged++;
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
		
		if(messagesChanged == 0) {
			if(event.direction == "historic") {
				loadHistoric.style.display = "none";
			} else {
				loadFuturistic.style.display = "none";
			}
		}
		
		messageElements = [...history.querySelectorAll(".message")];
		for(let [index, el] of Object.entries(event.direction == "historic" ? messageElements : messageElements.reverse())) {
			if(index > 80) {
				el.remove();
				if(event.direction == "historic") {
					loadFuturistic.style.display = "";
				} else {
					loadHistoric.style.display = "";
				}
			}
		}
		
		setTimeout(() => {
			scroller.scrollHeight;
			if(pointMessage) {
				console.log(
					"Scroll amount:",
					pointMessage.getBoundingClientRect().y - originalPointMessage,
					"Message:",
					pointMessage,
					"Original Y position:",
					originalPointMessage,
					"New Y position:",
					pointMessage.getBoundingClientRect().y);
				scroller.scrollTop += originalPointMessage - pointMessage.getBoundingClientRect().y;
			}
		}, 0);
	}
	
}

export default TextProgram;