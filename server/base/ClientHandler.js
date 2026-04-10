
class ClientHandler {
	constructor(connection) {
		this.connection = connection;
		this.connection.socket.addEventListener("message", console.log);
	}
}
