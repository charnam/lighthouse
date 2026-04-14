import bcrypt from "bcrypt"
import Database from "../util/Database.js";
import UserSession from "./UserSession.js";
import Banners from "../util/simple/Banners.js";
import MessageHandlerGroup from "../../assets/shared/MessageHandlerGroup.js";

class ClientHandler {
	constructor(connection) {
		this.logindb = new Database(null);
		this.connection = connection;
		this.loginHandlers = new MessageHandlerGroup(this.connection);
		
		this.loginHandlers.handle("token", async message => {
			const success = await this.login(message?.data);
			message.reply(success);
			if(success) {
				this.loginHandlers.disable();
			}
		});
		
		this.loginHandlers.handle("log-in", async message => {
			if(!this.user) {
				const username = message?.data?.username;
				const password = message?.data?.password;
				
				const userRow = await this.logindb.get(`SELECT userid, username, password FROM users WHERE username = ${this.logindb.val(username)}`);
				if(!userRow) {
					return Banners.error("Please check the username and try again.");
				}
				
				const passwordIsValid = await bcrypt.compare(password, userRow.password);
				if(!passwordIsValid) {
					return Banners.error("Invalid password, please try again.");
				}
				
				const token = crypto.randomUUID();
				await this.logindb.exec(`
					INSERT INTO tokens
						(token, userid, password, creation)
					VALUES
						(
							${this.logindb.val(token)},
							${this.logindb.val(userRow.userid)},
							${this.logindb.val(userRow.password)},
							${this.logindb.val(Date.now())}
						)
				`);
				
				message.reply(token);
			}
		});
		this.loginHandlers.handle("sign-up", async message => {
			if(!this.user) {
				const success = await this.login(message?.data?.token);
				message.reply(success);
			}
		});
	}
	
	async login(token) {
		const tokenRow = await this.logindb.get(`SELECT userid FROM tokens WHERE token = ${this.logindb.val(token)}`);
		if(tokenRow) {
			this.user = new UserSession(this, tokenRow.userid);
			return true;
		} else {
			return false;
		}
	}
}

export default ClientHandler;