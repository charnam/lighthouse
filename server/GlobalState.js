
// Manages currently active users, updates caused by others, and notifications.
// If adding multi-server architecture support, this file is certainly an important one to refactor.

const Permissions = require("authentication/permissions.js");

class GlobalState {
	
	// For the sake of having things be easily refactored in the future, please
	// do not edit activeUsers directly. Use the helper functions instead.
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
	
	state_check(updated_session) {
		// TODO: don't iterate on all active sessions and the members of their groups
		let update_sessions = this.activeSessions.filter(session => session.currentGroup.members && session.currentGroup.members.filter(member => member.userid == updated_session.user.userid))
		for(let session of update_sessions) {
			// TODO: check what was changed and update as necessary
			session.refresh_members();
		}
	}
}

module.exports = new GlobalState();

