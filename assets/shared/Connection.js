import ConnectionMessage from "./ConnectionMessage.js";
import MessageHandler from "./MessageHandler.js";

class Connection {
	_socket = null;
	get socket() {
		if(this._socket) return this._socket;
		else throw new Error("Data sent before socket was initialized!");
	}
	set socket(val) {
		this._socket = val;
	}
	
	onerror(error) {
		if(typeof alert !== "undefined") {
			alert(error+"\n\nThe page will now reload. Please report this bug! :(");
			window.location.reload();
		} else {
			console.log(error);
		}
	}
	
	constructor(serverOrSocket) {
		if(typeof serverOrSocket == "object") {
			this.socket = serverOrSocket;
			this.setupSocket();
		} else {
			this.server = serverOrSocket;
		}
	}
	
	setupSocket() {
		this.socket.addEventListener("message", async event => {
			const object = JSON.parse(event.data);
			
			for(let handler of this.handlers) {
				const message = new ConnectionMessage(this, object);
				handler.callback(message);
			}
		})
	}
	
	connectClient() {
		return new Promise((res, err) => {
			this.socket = new WebSocket(this.server);
			
			this.setupSocket();
			
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
			const handler = this.handle("reply", message => {
				if(message.message?.data?.to == eventId) {
					res(message);
					this.removeHandler(handler);
				}
			});
		});
	}
	
	async expect(type, requestData, errorMessage) {
		const reply = await this.request(type, requestData);
		const data = reply.data;
		if(!data || typeof data == "object" && data.type == "banner") {
			this.onerror(errorMessage + (data?.type == "banner" ? "\n\n" + data.message : ""));
			return false;
		}
		return data;
	}
	
	reply(to, data) {
		return this.request("reply", {
			to,
			data
		});
	}
	
	async requestObject(...args) {
		return (await this.request(...args)).data.data;
	}
	
	handlers = [];
	handle(type, callback) {
		const handler = new MessageHandler(this, this, message => {
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

export default Connection;