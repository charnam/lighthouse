import { applyToElement, HTML } from "imperative-html";
import SingleInstanceRenderable from "../index.js";
import MessageHandler from "../../../../shared/MessageHandler.js";
import User from "../User/index.js";
import ClientProgram from "../ClientPane/ClientProgram/index.js";

class Message extends SingleInstanceRenderable {
	style = this.autoStyleByImport(import.meta.url);
	classes = [...this.classes, "message"];
	
	program = null;
	handler = null;
	
	constructor(details, clientOrProgram) {
		super();
		this.details = details;
		if(clientOrProgram instanceof ClientProgram) {
			this.program = clientOrProgram;
			this.client = this.program.client;
		} else {
			this.client = clientOrProgram;
		}
		
		this.handler = this.client.connection.handle("text-program-message-update", message => {
			if(message.data.messageid == this.details.messageid) {
				this.details = message.data;
				this.update();
			}
		});
		this.handler.disable();
	}
	
	render() {
		const target = super.render();
		
		this.handler.enable();
		
		target.append(
			new User(this.details.user, this.client).render(),
			new HTML.div({class: "message-content"}),
			new HTML.div({class: "message-attachments"}),
			new HTML.div({class: "message-time"})
		);
		
		this.update();
		return target;
	}
	
	updateRendered(target) {
		//this.details = await this.client.
		
		const messageDate = 
			new Date(this.details.creation);
		const previousMessageDate = 
			new Date(this.details.previous.creation);
		
		let differentDay =
			messageDate.getDay() !== previousMessageDate.getDay() ||
			messageDate.getMonth() !== previousMessageDate.getMonth() ||
			messageDate.getFullYear() !== previousMessageDate.getFullYear();
		
		let timeEl = target.querySelector(".message-time");
		if(
			this.details.previous.userid !== this.details.user.userid ||
			this.details.previous.creation == null ||
			this.details.previous.creation <= this.details.creation - 60000 * 8 ||
			differentDay
		) {
			// First message in group
			target.classList.add("message-is-first")
			timeEl.innerText = messageDate.toLocaleString(undefined, {
				dateStyle: "long",
				timeStyle: "short"
			});
		} else {
			// NOT first message in group
			target.classList.remove("message-is-first")
			
			const formatter = new Intl.DateTimeFormat(undefined, {
				hour: 'numeric',
				minute: '2-digit',
				hour12: true
			});
			
			const parts = formatter.formatToParts(messageDate);
			
			const time = parts
				.filter(part => part.type !== 'dayPeriod')
				.map(part => part.value)
				.join('');
			
			timeEl.innerText = time;
		}
		
		timeEl.setAttribute("title", messageDate.toLocaleString());
		
		if(differentDay) {
			target.classList.add("message-is-different-day");
		} else {
			target.classList.remove("message-is-different-day");
		}
		
		let contentEl = target.querySelector(".message-content");
		contentEl.innerText = this.details.content;
		
	}
	async beforeRemove() {
		this.handler.disable();
	}
}

export default Message;