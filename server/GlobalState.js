
// Manages currently active users, updates caused by others, and notifications.
// If adding multi-server architecture support, this file is certainly an important one to refactor.

const Permissions = require("authentication/permissions.js");

class GlobalState {
	
	// For the sake of having things be easily refactored in the future, please
	// do not edit variables here directly. Use the helper functions instead.
	activeSessions = []
	
	add_session(session) {
		if(!session.user) return false;
		this.activeSessions.push(session);
	}
	remove_session(session) {
		this.activeSessions = this.activeSessions.filter(test_session => test_session !== session);
	}
	
	user_state(userid, programid = null, groupid = null) {
		let sessions = this.activeSessions.filter(session => session.user.userid == userid);
		if(sessions.length == 0)
			return "offline";
		
		if(programid && sessions.filter(session => session.currentProgram && session.currentProgram.programid == programid).length > 0)
			return "program";
		
		if(groupid && sessions.filter(session => session.currentGroup && session.currentGroup.groupid == groupid).length > 0)
			return "group";
		
		return "online";
	}
	
	/*serialize_session(session) {
		let serialized = {};
		
		serialized.group = JSON.stringify(session.group);
		serialized.groups = JSON.stringify(session.groups);
		
	}
	
	check_changes(updated_session) {
		
		const old_serialized = updated_session.serialized;
		const new_serialized = this.serialize_session(updated_session);
		
		let serialized_entries_new = Object.entries(new_serialized);
		
		if(old_serialized.groups !== new_serialized.groups)
			this.update_groups(updated_session);
		
		
		
		updated_session.serialized = 
	}*/
	
	async refresh_members(groupid) {
		for(let session of this.activeSessions) {
			if(session.currentGroup && session.currentGroup.groupid == groupid) {
				session.refresh_members();
			}
		}
	}
	
	async refresh_user(userid) {
		for(let session of this.activeSessions) {
			if(
				session.currentGroup &&
				session.currentGroup.members &&
				session.currentGroup.members.some(member => member.userid == userid)
			)
				await session.refresh_members();
			
			if(Array.isArray(session.friends) && session.friends.some(friend => friend.userid == userid))
				await session.refresh_friends();
		}
	}
	
	async refresh_group(groupid) {
		for(let session of this.activeSessions) {
			if((await session.permissions.groups()).some(group => group.groupid == groupid))
				await session.refresh_groups();
			
			if(session.currentGroup && session.currentGroup.groupid == groupid) {
				await session.refresh_group();
				await session.refresh_members();
			}
		}
	}
}

module.exports = new GlobalState();

