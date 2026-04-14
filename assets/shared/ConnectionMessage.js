
class ConnectionMessage {
	message = null;
	get type() {
		return this.message.type;
	}
	get isReply() {
		return this.type == "reply";
	}
	get data() {
		if(this.type == "reply") {
			return this.message?.data?.data;
		} else {
			return this.message?.data;
		}
	}
	
	constructor(connection, messageData) {
		this.connection = connection;
		this.message = messageData;
	}
	
	async reply(message) {
		return await this.connection.reply(this.message?.request, message);
	}
}

export default ConnectionMessage;
