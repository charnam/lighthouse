import Banners from "../../server/util/simple/Banners.js";
import MessageHandler from "./MessageHandler.js";

class MessageHandlerGroup {
	connection = null;
	handler = null;
	enabled = true;
	
	constructor(group, connection) {
		if(!connection) connection = group;
		this.group = group;
		this.connection = connection;
		this.handler = new MessageHandler(group, connection, message => {
			if(this.enabled) {
				for(let handler of this.handlers) {
					handler.callback(message);
				}
			}
		});
		this.enable();
	}
	
	enable() {
		if(!this.group.handlers.includes(this.handler)) {
			this.group.handlers.push(this.handler);
		}
	}
	
	disable() {
		this.group.handlers = this.group.handlers.filter(handler => handler !== this.handler)
	}
	
	handlers = [];
	handle(type, callback) {
		const handler = new MessageHandler(this, this.connection, message => {
			if(message.message?.type == type) {
				try {
					callback(message);
				} catch(err) {
					message.reply(Banners.error("An internal error has occurred. Please report this!\n\nID: "+Date.now()));
				}
			}
		});
		this.handlers.push(handler);
		return handler;
	}
	
	removeHandler(handler) {
		this.handlers = this.handlers.filter(testHandler => testHandler !== handler);
	}
}

export default MessageHandlerGroup;
