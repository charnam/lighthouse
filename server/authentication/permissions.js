
const enums = require("helpers/enums.js");
const GlobalState = require("GlobalState.js");

const _permissions = enums.make_bitmask(
	"VIEW_PROGRAM",
	"SEND_MESSAGES",
	"EDIT_GROUP",
	"EDIT_PROGRAM",
	"ADMIN",
	"DELETE_PROGRAMS",
	"SEND_FILES",
	"EDIT_ROLES",
	"EDIT_MESSAGES",
	"DELETE_OWN_MESSAGES",
	"DELETE_OTHER_MESSAGES",
	"INVITE_OTHERS"
)

class Permissions {
	
	static ByName = _permissions

	static DEFAULT_PERMISSIONS =
		_permissions.VIEW_PROGRAM |
		_permissions.SEND_MESSAGES |
		_permissions.SEND_FILES |
		_permissions.EDIT_MESSAGES |
		_permissions.DELETE_OWN_MESSAGES |
		_permissions.INVITE_OTHERS
	
	static DM_DEFAULT_PERMISSIONS =
		_permissions.VIEW_PROGRAM |
		_permissions.SEND_MESSAGES |
		_permissions.SEND_FILES |
		_permissions.EDIT_MESSAGES |
		_permissions.DELETE_OWN_MESSAGES
	
	static FULL_PERMISSIONS = 2147483647;
	
	async group_members(groupid, programid = null) {
		let members = await this.db.all(
			`SELECT userid, username, displayname, pfp, status FROM users
			WHERE userid IN
				(
					SELECT userid FROM user_group_relationships WHERE groupid = ?
						UNION
					SELECT userid FROM groups WHERE groupid = ?
				)
			ORDER BY displayname`,
			[groupid, groupid]
		);
		
		for(let member of members) {
			member.roles = await this.db.all("SELECT roles.roleid, roles.name, roles.icon FROM roles WHERE roleid IN (SELECT roleid FROM role_assignation WHERE userid = ?) AND groupid = ? ORDER BY position", [member.userid, groupid]);
			member.state = GlobalState.user_state(member.userid, programid, groupid);
		}
		
		if(programid) {
			// TODO: return group members as well as program members
			// sort them on the client in different categories
			
			let program_members = [];
			
			// TODO: don't iterate with database queries over all group members
			for(let member of members)
				if(await this.user_permissions_program(member.userid, programid) & Permissions.ByName.VIEW_PROGRAM)
					program_members.push(member);
			
			return program_members;
		}
		
		return members;
	}
	
	async program_members(programid) {
		let program = await this.db.get("SELECT programid, is_dm, groupid FROM programs WHERE programid = ?", programid);
		if(!program) return false;
		let members = [];
		if(program.is_dm) {
			members = await this.db.all(
				`SELECT userid, username, displayname, pfp FROM users
				WHERE userid IN
					(
						SELECT userid1 FROM friends WHERE programid = ?
							UNION
						SELECT userid2 FROM friends WHERE programid = ?
					)
				ORDER BY displayname`,
				[program.programid, program.programid]
			);
		} else if(program.groupid) {
			members = await this.group_members(program.groupid, program.programid);
		}
		
		return members;
	}
	
	async user_in_group(userid, groupid) {
		let group = await this.db.get("SELECT userid FROM groups WHERE groupid = ?", groupid);
		
		if(group == null)
			return false;
		
		if(group.userid == userid)
			return true;
		
		let relationship = await this.db.get("SELECT * FROM user_group_relationships WHERE userid = ? AND groupid = ?", [userid, groupid]);
		
		if(relationship == null)
			return false;
		else
			return true;
	}
	
	async get_roles(userid, groupid) {
		if(!await this.user_in_group(userid, groupid))
			return []
		
		let roles = await this.db.all(
			`SELECT roles.allow_permissions, roles.deny_permissions, roles.roleid, roles.name, roles.position
			FROM role_assignation
			JOIN roles ON roles.roleid = role_assignation.roleid
			WHERE role_assignation.userid = ? AND roles.groupid = ? ORDER BY roles.position DESC`,
			[userid, groupid]
		);
		return roles;
	}
	
	async user_permissions_group(userid, groupid) {
		let group = await this.db.get("SELECT userid FROM groups WHERE groupid = ?", groupid);
		if(group.userid == userid)
			return Permissions.FULL_PERMISSIONS
		
		if(!await this.user_in_group(userid, groupid))
			return 0;
		
		let permissions = Permissions.DEFAULT_PERMISSIONS;
		
		let roles = await this.get_roles(userid, groupid)
		roles.forEach(role => {
			permissions = permissions & (~role.deny_permissions);
			permissions = permissions | role.allow_permissions;
		});
		
		if(permissions & Permissions.ByName.ADMIN)
			return Permissions.FULL_PERMISSIONS;
		
		return permissions;
	}
	
	async user_permissions_program(userid, programid) {
		let program = await this.db.get("SELECT is_dm, groupid FROM programs WHERE programid = ?", programid);
		if(!program) return 0;
		if(program.is_dm) {
			let relationship = await this.db.get("SELECT * FROM friends WHERE (userid1 = ? OR userid2 = ?) AND programid = ?", [userid, userid, programid]);
			if(relationship)
				return Permissions.DM_DEFAULT_PERMISSIONS;
			else
				return 0;
		}
		if(!program.groupid)
			return Permissions.DEFAULT_PERMISSIONS;
		
		let permissions = await this.user_permissions_group(userid, program.groupid);
		
		let roles = await this.get_roles(userid, program.groupid)
		for(let role of roles) {
			let program_permissions = await this.db.get("SELECT * FROM role_program_permissions WHERE roleid = ? AND programid = ?", [role.roleid, programid]);
			if(program_permissions) {
				permissions = permissions & (~program_permissions.deny_permissions);
				permissions = permissions | program_permissions.allow_permissions;
			}
		}
		
		if(permissions & Permissions.ByName.ADMIN)
			return Permissions.FULL_PERMISSIONS;
		
		return permissions;
	}
	
	async user_groups(userid) {
		let groups = await this.db.all(
			`SELECT groups.*, user_group_relationships.position
			FROM groups
				LEFT JOIN user_group_relationships
				ON user_group_relationships.groupid = groups.groupid
			WHERE user_group_relationships.userid = ?
			OR groups.userid = ?
			ORDER BY user_group_relationships.position, user_group_relationships.id`,
			[userid, userid]
		);
		return groups;
	}
	
	async in_group(groupid) {
		return await this.user_in_group(this.session.user.userid, groupid);
	}
	async groups() {
		return await this.user_groups(this.session.user.userid);
	}
	async permissions_group(groupid) {
		return await this.user_permissions_group(this.session.user.userid, groupid);
	}
	async permissions_program(programid) {
		return await this.user_permissions_program(this.session.user.userid, programid);
	}
	constructor(session) {
		this.session = session;
		this.db = session.db;
	}
}

module.exports = Permissions;

