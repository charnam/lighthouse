
// Manages currently active users, updates caused by others, and notifications.
// If adding multi-server architecture support, this file is certainly an important one to change.

const Permissions = require("authentication/permissions.js");

class GlobalState {
	
	// For the sake of having things be easily changed in the future, please
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
		
		if(programid && sessions.some(session => session.currentProgram && session.currentProgram.programid == programid))
			return "program";
		
		if(groupid && sessions.some(session => session.currentGroup && session.currentGroup.groupid == groupid))
			return "group";
		
		return "online";
	}
	
	async refresh_notification(session, options) {
		switch(options.type) {
			case "message":
				
				let message = await session.db.get("SELECT programid FROM messages WHERE messageid = ?", options.messageid);
				if(!message)
					return false;
			
				let friendship = await session.db.get("SELECT * FROM friends WHERE programid = ?", message.programid);
				
				if(friendship) {
					let friends = [friendship.userid1, friendship.userid2];
					let sessions = this.activeSessions.filter(member => friends.includes(member.user.userid));
					sessions.forEach(session => session.refresh_friends());
				}
				
				let members = await session.permissions.program_members(message.programid);
				
				for(let session of this.activeSessions) {
					let member = members.find(member => member.userid == session.user.userid);
					if(!member) continue;
					
					if(session.currentProgram && session.currentProgram.programid == message.programid) {
						// give the client some time to read the message
						setTimeout(() => session.refresh_notifications().catch(err => console.error(err)), 2000);
					} else {
						session.refresh_notifications();
					}
				}
			
				break;
			case "friend_request":
			case "invite":
				
				let sessions = this.activeSessions.filter(session => session.user.userid == options.to);
				sessions.forEach(session => session.refresh_notifications());
				
				break;
		}
	}
	
	async refresh_members(groupid) {
		for(let session of this.activeSessions) {
			if(session.currentGroup && session.currentGroup.groupid == groupid) {
				session.refresh_members();
			}
		}
	}
	
	async refresh_friends(userid) {
		for(let session of this.activeSessions) {
			if(session.user.userid == userid)
				await session.refresh_friends();
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

