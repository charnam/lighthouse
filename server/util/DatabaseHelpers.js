import UserSession from "../base/UserSession.js";
import Permissions from "../variables/Permissions.js";

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
					ON unread_message.programid IN (
						SELECT programid
						FROM programs
						WHERE groupid = groups.groupid
					)
				WHERE user_group_relationships.userid = ${uid}
				OR groups.userid = ${uid}
				GROUP BY groups.groupid
				ORDER BY user_group_relationships.position, user_group_relationships.id
		`);
	}
	
	async userInGroup(userid, groupid) {
		let group = await this.db.get(`
			SELECT userid
				FROM groups
				WHERE groupid = ${this.db.val(groupid)}
		`);
		
		if(group == null)
			return false;
		
		if(group.userid == userid)
			return true;
		
		let relationship = await this.db.get(`
			SELECT *
				FROM user_group_relationships
				WHERE userid = ${this.db.val(userid)}
				AND groupid = ${this.db.val(groupid)}
		`);
		
		if(relationship == null)
			return false;
		else
			return true;
	}
	
	async getRoles(userid, groupid) {
		if(!await this.userInGroup(userid, groupid))
			return []
		
		let roles = await this.db.all(`
			SELECT roles.allow_permissions, roles.deny_permissions, roles.roleid, roles.name, roles.position
				FROM role_assignation
				JOIN roles
					ON roles.roleid = role_assignation.roleid
				WHERE role_assignation.userid = ${this.db.val(userid)}
					AND roles.groupid = ${this.db.val(groupid)}
				ORDER BY roles.position DESC
		`);
		
		return roles;
	}
	
	async getUserGroupPermissions(userid, groupid) {
		let group = await this.db.get(`
			SELECT userid
			FROM groups
			WHERE groupid = ${this.db.val(groupid)}
		`);
		
		if(group.userid == userid) {
			return Permissions.bitmask.mask;
		}
		
		if(!await this.userInGroup(userid, groupid)) {
			return 0;
		}
		
		let permissions = Permissions.bitmask.getDefaults();
		
		let roles = await this.getRoles(userid, groupid)
		roles.forEach(role => {
			permissions = permissions & (~role.deny_permissions);
			permissions = permissions | role.allow_permissions;
		});
		
		if(permissions & Permissions.bitmask.byName.ADMIN)
			return Permissions.bitmask.mask;
		
		return permissions;
	}
	
	async getUserProgramPermissions(userid, programid) {
		let program = await this.db.get(`
			SELECT is_dm, groupid FROM programs
				WHERE programid = ${this.db.val(programid)}
		`);
		if(!program) return 0;
		if(program.is_dm) {
			let relationship = await this.db.get(`
				SELECT * FROM friends
					WHERE (userid1 = ${this.db.val(userid)} OR userid2 = ${this.db.val(userid)})
					AND programid = ${this.db.val(programid)}
			`);
			if(relationship)
				return Permissions.DM_DEFAULT_PERMISSIONS;
			else
				return 0;
		}
		if(!program.groupid)
			return Permissions.DEFAULT_PERMISSIONS;
		
		let permissions = await this.getUserGroupPermissions(userid, program.groupid);
		
		let roles = await this.getRoles(userid, program.groupid)
		for(let role of roles) {
			let program_permissions = await this.db.get(`
				SELECT * FROM role_program_permissions
				WHERE roleid = ${this.db.val(role.roleid)}
					AND programid = ${this.db.val(programid)}
			`);
			if(program_permissions) {
				permissions = permissions & (~program_permissions.deny_permissions);
				permissions = permissions | program_permissions.allow_permissions;
			}
		}
		
		if(permissions & Permissions.bitmask.byName.ADMIN)
			return Permissions.bitmask.mask;
		
		return permissions;
	}
	
	
	async getMembersInGroup(groupid, programid = null) {
		let groupidVal = this.db.val(groupid);
		
		let members = await this.db.all(`
			SELECT userid, username, displayname, pfp, status FROM users
				WHERE userid IN
					(
						SELECT userid FROM user_group_relationships WHERE groupid = ${groupidVal}
							UNION
						SELECT userid FROM groups WHERE groupid = ${groupidVal}
					)
				ORDER BY displayname
		`);

		for (let member of members) {
			member.roles = await this.db.all(`
				SELECT roles.roleid, roles.name, roles.icon FROM roles
					WHERE roleid IN
						(
							SELECT roleid
								FROM role_assignation
								WHERE userid = ${this.db.val(member.userid)}
						)
					AND
						groupid = ${this.db.val(groupid)}
					ORDER BY position
			`);
			member.state = UserSession.getState(member.userid, programid, groupid);
		}

		if (programid) {
			// TODO: return group members as well as program members
			// sort them on the client in different categories

			let program_members = [];

			// TODO: don't iterate with database queries over all group members
			for (let member of members) {
				const permissionsMask = await this.userPermissionsProgram(member.userid, programid);
				if(permissionsMask & Permissions.bitmask.byName.VIEW_PROGRAM) {
					program_members.push(member);
				}
			}
			
			return program_members;
		}

		return members;
	}
	
	async getGroupDetailsAsUser(groupid, userid) {
		let group = await this.db.get(`
			SELECT *
				FROM groups
				WHERE groupid = ${this.db.val(groupid)}
		`);
		
		if(!group)
			return null;
		
		const permissions = await this.getUserGroupPermissions(userid, group.groupid);
		
		group.permissions = permissions;
		group.members = await this.getMembersInGroup(group.groupid);
		
		if(group.permissions & Permissions.bitmask.byName.EDIT_ROLES) {
			group.roles = await this.db.all(`
				SELECT roleid, name, icon
					FROM roles
					WHERE groupid = ${this.db.val(group.groupid)}
					ORDER BY position
			`);
		}
		
		return group;
	}
	
	async getGroupProgramsAsUser(groupid, userid) {
		const programs = await this.db.all(`
			SELECT programs.programid, name, type, position, latest_read_time IS NOT NULL AS unread
			FROM programs
			LEFT JOIN (
				SELECT messages.programid, COALESCE(MAX(read_indicators.creation), 0) AS latest_read_time
				FROM messages
				LEFT JOIN read_indicators
				ON messages.messageid = read_indicators.messageid
				AND read_indicators.userid = ${this.db.val(userid)}
				GROUP BY messages.programid
				HAVING latest_read_time < MAX(messages.creation)
				ORDER BY latest_read_time
			) unread_message
			ON unread_message.programid = programs.programid
			WHERE groupid = ${this.db.val(groupid)}
			ORDER BY position
		`);
		
		let programs_filtered = [];
		for(let program of programs) {
			if(await this.getUserProgramPermissions(userid, program.programid) & Permissions.bitmask.byName.VIEW_PROGRAM) {
				programs_filtered.push(program);
			}
		}
		
		return programs_filtered;
	}
	
	async getProgramDetailsAsUser(programid, userid) {
		const programQuery = await this.db.get(`
			SELECT groupid FROM programs WHERE programid = ${this.db.val(programid)}
		`);
		if(!programQuery)
			return null;
		
		const permissions = await this.getUserProgramPermissions(userid, programid);
		if(!(permissions & Permissions.bitmask.byName.VIEW_PROGRAM))
			return null;
		
		const programs = await this.getGroupProgramsAsUser(programQuery.groupid, userid);
		
		const program = programs.find(program => program.programid == programid);
		if(!program)
			return null;
		else
			return program;
	}
	
	async getMessages(programid, point, direction, limit = 50) {
		const messages = await this.db.all(`
			SELECT 
				messages.messageid,
				messages.programid,
				messages.content,
				messages.creation,
				messages.userid,
				messages.edits,
				
				LAG(messages.creation) OVER (ORDER BY messages.creation) AS prev_creation,
				LAG(messages.userid)   OVER (ORDER BY messages.creation) AS prev_userid,
				
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
			WHERE messages.programid = ${this.db.val(programid)}
				${point == "initial" ? "" : `
					AND messages.creation ${direction == "historic" ? "<=" : ">="} (SELECT creation FROM messages WHERE messageid = ${this.db.val(point)})
				`}
			ORDER BY messages.creation ${direction == "historic" ? "DESC" : "ASC"}
			LIMIT ${this.db.val(limit)}
		`);
		
		await Promise.all(messages.map(async (message, index) => {
			let seenBy = await this.db.all(`SELECT userid FROM read_indicators WHERE messageid = ${this.db.val(message.messageid)}`);
			seenBy = seenBy.map(event => event.userid);
			
			let mentions = await this.db.all(`SELECT userid FROM message_mentions WHERE messageid = ${this.db.val(message.messageid)}`);
			mentions = mentions.map(event => event.userid);
			
			let attachments = await this.db.all(`
				SELECT
					uploads.originalname,
					uploads.mimetype,
					uploads.uploadid,
					uploads.size
				FROM message_attachments
				JOIN uploads
				ON
					uploads.uploadid = message_attachments.uploadid
				WHERE message_attachments.messageid = ${this.db.val(message.messageid)}
			`);
			
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
				previous: {
					creation: message.prev_creation,
					userid: message.prev_userid
				},
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
			
			messages[index] = output_message;
		}));
		
		return messages;
	}
	
	async getMessage(messageid) {
		const message = await this.db.get(`
			SELECT programid
			FROM messages
			WHERE messageid = ${this.db.val(messageid)}
		`);
		if(message)
			return (await this.getMessages(message.programid, messageid, "historic", 1))[0];
		else
			return null;
	}

}

export default DatabaseHelpers;
