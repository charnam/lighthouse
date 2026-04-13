
class ConnectionMessage {
	message = null;
	get isReply() {
		return this.message.type == "reply";
	}
	get data() {
		if(this.message.type == "reply") {
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
