
class MessageHandler {
	connection = null;
	callback = () => {}
	
	constructor(connection, callback = () => {}) {
		this.connection = connection;
		this.callback = callback;
	}
}

export default MessageHandler;
