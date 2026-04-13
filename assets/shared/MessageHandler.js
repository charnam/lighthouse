
class MessageHandler {
	connection = null;
	handle = () => {}
	
	constructor(connection, handle = () => {}) {
		this.connection = connection;
		this.handle = handle;
	}
	
	remove() {
		this.connection.handlers = this.connection.handlers.filter(handler => handler !== this);
	}
	
}

export default MessageHandler;
