
class Connection {
	_socket = null;
	get socket() {
		if(this._socket) return this._socket;
		else throw new Error("Data sent before socket was initialized!");
	}
	set socket(val) {
		this._socket = val;
	}
	
	constructor(serverOrSocket) {
		if(typeof serverOrSocket == "object") {
			this.socket = serverOrSocket;
		} else {
			this.server = serverOrSocket;
		}
	}
	
	connectClient() {
		return new Promise((res, err) => {
			this.socket = new WebSocket(this.server);
			
			this.socket.addEventListener("open", () => {
				res();
			});
			
			this.socket.addEventListener("error", (data) => {
				err(data);
			});
		})
	}
	
	sendObject(data) {
		this.socket.send(JSON.stringify(data));
	}
	
	sendEvent(type, data) {
		const uuid = crypto.randomUUID();
		this.sendObject({
			type,
			data,
			request: uuid
		});
		return uuid;
	}
	
	request(type, data) {
		const eventId = this.sendEvent(type, data);
		return new Promise(res => {
			this.socket.addEventListener("message", event => {
				const object = JSON.parse(event.data);
				
				if(object.type == "reply" && object.data.to == eventId) {
					res(object);
				}
			});
		});
	}
	
	reply(to, data) {
		this.sendEvent("reply", {
			to,
			data
		})
	}
	
	async requestObject(...args) {
		return (await this.request(...args)).data.data;
	}
	
	/*
	async sendMessage(room, content) {
		return await this.sendRequest("send-message", {room, content});
	}*/
}

export default Connection;