
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
		
		if(programid && sessions.filter(session => session.currentProgram.programid == programid).length > 0)
			return "program";
		
		if(groupid && sessions.filter(session => session.currentGroup.groupid == groupid).length > 0)
			return "group";
		
		return "online";
	}
	
	serialize_session(session) {
		let serialized = {};
		
		serialized.group = JSON.stringify(session.group);
		serialized.groups = JSON.stringify(session.groups);
		
	}
	
	check_changes(updated_session) {
		
		
	}
	
	// TODO: remove state_check entirely and replace it with something less general-purpose (i.e "member_refresh", "group_refresh" or "role_refresh")
	state_check(updated_session) {
		if(!updated_session || !updated_session.user) return false;
		// TODO: don't iterate on all active sessions and the members of their groups so often
		let update_sessions = this.activeSessions.filter(session =>
			session.currentGroup.members &&
			session.currentGroup.members.filter(member => member.userid == updated_session.user.userid).length > 0
		);
		
		for(let session of update_sessions) {
			session.refresh_members();
		}
	}
}

module.exports = new GlobalState();

