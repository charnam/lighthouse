import MessageHandler from "./MessageHandler.js";

class MessageHandlerGroup {
	connection = null;
	
	enabled = true;
	
	constructor(connection) {
		this.connection = connection;
		connection.handlers.push(new MessageHandler(connection, message => {
			if(this.enabled) {
				for(let handler of this.handlers) {
					handler.callback(message);
				}
			}
		}))
	}
	
	enable() {
		this.enabled = true;
	}
	
	disable() {
		this.enabled = false;
	}
	
	handlers = [];
	handle(type, callback) {
		const handler = new MessageHandler(this.connection, message => {
			if(message.message?.type == type) {
				callback(message);
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
