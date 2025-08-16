
class Messages {
	static MESSAGE_QUERY = `
		SELECT 
			messages.messageid, messages.programid, messages.content, messages.creation, messages.userid, messages.edits,
			users.userid AS sender_userid, users.displayname AS sender_displayname, users.username AS sender_username, users.pfp AS sender_pfp,
			replyto.messageid AS replyto_messageid
		FROM messages
		LEFT JOIN users ON messages.userid = users.userid
		LEFT JOIN messages AS replyto ON messages.reply_to = replyto.messageid
	`
	static async map_message(db, message) {
		let seenBy = await db.all("SELECT userid FROM read_indicators WHERE messageid = ?", message.messageid);
		seenBy = seenBy.map(event => event.userid);
		
		let mentions = await db.all("SELECT userid FROM message_mentions WHERE messageid = ?", message.messageid);
		mentions = mentions.map(event => event.userid);
		
		let attachments = await db.all("SELECT uploads.originalname, uploads.mimetype, uploads.uploadid, uploads.size FROM message_attachments JOIN uploads ON uploads.uploadid = message_attachments.uploadid WHERE message_attachments.messageid = ?", message.messageid);
		
		return {
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
			seenBy,
			attachments
		};
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
			SELECT 
				messages.messageid, messages.programid, messages.content, messages.creation, messages.userid, messages.edits,
				users.userid AS sender_userid, users.displayname AS sender_displayname, users.username AS sender_username, users.pfp AS sender_pfp,
				replyto.messageid AS replyto_messageid
			FROM messages
			LEFT JOIN users ON messages.userid = users.userid
			LEFT JOIN messages AS replyto ON messages.reply_to = replyto.messageid
			${query}
		`, ...args);
		
		for(let row in messages) {
			messages[row] = await this.map_message(db, messages[row]);
		}
		
		return messages;
	}
}

module.exports = Messages;
