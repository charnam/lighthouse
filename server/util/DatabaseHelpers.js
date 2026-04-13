
class DatabaseHelpers {
	constructor(database) {
		this.database = database;
	}
	
	async selectGroupsForUser(userid) {
		const uid = await this.database.val(userid);
		
		return await this.database.all(`
			SELECT groups.*, user_group_relationships.position, latest_read_time IS NOT NULL AS unread
				FROM groups
					LEFT JOIN user_group_relationships
					ON user_group_relationships.groupid = groups.groupid
					AND user_group_relationships.userid = ${uid}
					LEFT JOIN (
						SELECT programid, COALESCE(MAX(read_indicators.creation), 0) AS latest_read_time
						FROM messages
						LEFT JOIN read_indicators
						ON read_indicators.messageid = messages.messageid
						AND read_indicators.userid = ${uid}
						GROUP BY messages.programid
						HAVING latest_read_time < MAX(messages.creation)
						ORDER BY latest_read_time
					) unread_message
					ON unread_message.programid IN (SELECT programid FROM programs WHERE groupid = groups.groupid) 
				WHERE user_group_relationships.userid = ${uid}
				OR groups.userid = ${uid}
				GROUP BY groups.groupid
				ORDER BY user_group_relationships.position, user_group_relationships.id
		`);
	}
}

export default DatabaseHelpers;
