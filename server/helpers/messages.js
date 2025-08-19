
class Messages {
	static MESSAGE_QUERY = `
		SELECT 
			messages.messageid,
			messages.programid,
			messages.content,
			messages.creation,
			messages.userid,
			messages.edits,
			
			users.userid AS sender_userid,
			users.displayname AS sender_displayname,
			users.username AS sender_username,
			users.pfp AS sender_pfp,
			
			replyto.messageid AS replyto_messageid,
			replyto.content AS replyto_content,
			
			replyto.userid AS replyto_userid,
			replyto_user.username AS replyto_username,
			replyto_user.displayname AS replyto_displayname,
			replyto_user.pfp AS replyto_pfp
		FROM messages
		LEFT JOIN users ON messages.userid = users.userid
		LEFT JOIN messages AS replyto ON messages.reply_to = replyto.messageid
		LEFT JOIN users AS replyto_user ON replyto.userid = replyto_user.userid
	`
	static async map_message(db, message) {
		let seenBy = await db.all("SELECT userid FROM read_indicators WHERE messageid = ?", message.messageid);
		seenBy = seenBy.map(event => event.userid);
		
		let mentions = await db.all("SELECT userid FROM message_mentions WHERE messageid = ?", message.messageid);
		mentions = mentions.map(event => event.userid);
		
		let attachments = await db.all("SELECT uploads.originalname, uploads.mimetype, uploads.uploadid, uploads.size FROM message_attachments JOIN uploads ON uploads.uploadid = message_attachments.uploadid WHERE message_attachments.messageid = ?", message.messageid);
		
		let output_message = {
			messageid: message.messageid,
			programid: message.programid,
			content: message.content,
			creation: message.creation,
			edits: message.edits,
			user: {
				userid: message.sender_userid,
				displayname: message.sender_displayname,
				username: message.sender_username,
				pfp: message.sender_pfp
			},
			replyTo: null,
			seenBy,
			attachments
		};
		
		if(message.replyto_messageid)
			output_message.replyTo = {
				user: {
					userid: message.replyto_userid,
					displayname: message.replyto_displayname,
					username: message.replyto_username,
					pfp: message.replyto_pfp
				},
				messageid: message.replyto_messageid,
				content: message.replyto_content
			};
		
		return output_message;
	}
	
	static async get_message(db, query, ...args) {
		let message = await db.get(`
			${this.MESSAGE_QUERY}
			${query}
		`, ...args);
		
		return await this.map_message(db, message);
	}
	static async get_messages(db, query, ...args) {
		let messages = await db.all(`
			${this.MESSAGE_QUERY}
			${query}
		`, ...args);
		
		for(let row in messages) {
			messages[row] = await this.map_message(db, messages[row]);
		}
		
		return messages;
	}
}

module.exports = Messages;
