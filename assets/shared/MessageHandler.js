
class MessageHandler {
	connection = null;
	callback = () => {};
	
	constructor(group, connection, callback = () => {}) {
		this.group = group;
		this.connection = connection;
		this.callback = callback;
	}
	
	disable() {
		this.group.handlers = this.group.handlers.filter(handler => handler !== this);
	}
	enable() {
		if(!this.group.handlers.includes(this))
			this.group.handlers.push(this);
	}
}

export default MessageHandler;
