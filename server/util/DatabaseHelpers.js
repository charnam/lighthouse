
class DatabaseHelpers {
	constructor(db) {
		this.db = db;
	}
	
	async selectGroupsForUser(userid) {
		const uid = await this.db.val(userid);
		
		return await this.db.all(`
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
	
	async group_members(groupid, programid = null) {
		let groupidVal = this.db.val(groupid);
		
		let members = await this.db.all(
			`SELECT userid, username, displayname, pfp, status FROM users
			WHERE userid IN
				(
					SELECT userid FROM user_group_relationships WHERE groupid = ${groupidVal}
						UNION
					SELECT userid FROM groups WHERE groupid = ${groupidVal}
				)
			ORDER BY displayname`
		);

		for (let member of members) {
			member.roles = await this.db.all(
				`SELECT roles.roleid, roles.name, roles.icon FROM roles
				WHERE roleid IN
					(
						SELECT roleid FROM role_assignation WHERE userid = ${this.db.val(member.userid)}
					)
				AND
					groupid = ${this.db.val(groupid)}
				ORDER BY position`);
			member.state = GlobalState.user_state(member.userid, programid, groupid);
		}

		if (programid) {
			// TODO: return group members as well as program members
			// sort them on the client in different categories

			let program_members = [];

			// TODO: don't iterate with database queries over all group members
			for (let member of members)
				if (await this.user_permissions_program(member.userid, programid) & Permissions.ByName.VIEW_PROGRAM)
					program_members.push(member);
			
			return program_members;
		}

		return members;
	}

}

export default DatabaseHelpers;
