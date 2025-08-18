
const SERVER_ERRORS = require("variables/enums/serverErrors.js");
const bcrypt = require("bcrypt");
const uuid = require("uuid").v4;
const Validation = require("authentication/Validation.js");
const Permissions = require("authentication/permissions.js");
const create_token = require("authentication/create_token.js");
const logger = require("helpers/logger.js");
const Reorder = require("helpers/reorder.js");
const Banners = require("helpers/banners.js");
const Messages = require("helpers/messages.js");

const GlobalState = require("GlobalState.js");

class StatedSession {
	
	show_server_error(errorid, message) {
		this.sync_group({
			groupid: "special:server_error",
			special: "server_error"
		});
		let user_message = null;
		if(errorid & SERVER_ERRORS.BAD_ACTION)
			user_message = message;
		this.sync_program({type: "server_error", title: "Server Error", errorid, message: user_message});
		logger.log(0, "Showing server error "+errorid+" - "+message);
	}
	
	sync_group(group, handleInteraction) {
		this.socket.removeAllListeners("group-interaction");
		this.currentGroup = group;
		this.socket.on("group-interaction", event => {
			if(!event || !event.type)
				return this.show_server_error(SERVER_ERRORS.BAD_ACTION);
			if(handleInteraction)
				handleInteraction(event);
		});
		this.special_programs = {};
		this.special_program_handler = null;
		this.socket.emit("group-open", group);
	}
	sync_program(program, handleInteraction) {
		this.socket.leaveAll();
		this.socket.removeAllListeners("program-interaction");
		this.currentProgram = program;
		this.socket.on("program-interaction", event => {
			if(!event || !event.type) return this.show_server_error(SERVER_ERRORS.BAD_ACTION);
			handleInteraction(event);
		});
		this.socket.emit("program-open", program);
		if(this.user && this.user.userid)
			GlobalState.refresh_user(this.user.userid);
	}
	
	async refresh_group(id = false) {
		
		let groupid = id;
		
		if(!id && this.currentGroup)
			groupid = this.currentGroup.groupid;
		
		if(!groupid)
			return false;
		
		let group = await this.db.get("SELECT * FROM groups WHERE groupid = ?", [groupid]);
		
		if(!group)
			if(id !== false)
				return false; // return false if the group is initially loading so that a different error can be returned
			else
				return this.show_server_error(SERVER_ERRORS.SERVER_ERROR, "Group has been removed.");
		
		group.permissions = await this.permissions.permissions_group(group.groupid);
		group.members = await this.permissions.group_members(group.groupid);
		
		if(await this.permissions.permissions_group(group.groupid) & Permissions.ByName.EDIT_ROLES)
			group.roles = await this.db.all("SELECT roleid, name, icon FROM roles WHERE groupid = ? ORDER BY position", group.groupid);
		
		group.programs = await this.db.all(`
			SELECT programs.programid, name, type, position, latest_read_time IS NOT NULL AS unread
			FROM programs
			LEFT JOIN (
				SELECT messages.programid, MAX(read_indicators.creation) AS latest_read_time
				FROM messages
				LEFT JOIN read_indicators
				ON messages.messageid = read_indicators.messageid
				AND read_indicators.userid = ?
				GROUP BY messages.programid
				HAVING latest_read_time < MAX(messages.creation)
				ORDER BY latest_read_time
			) unread_message
			ON unread_message.programid = programs.programid
			WHERE groupid = ?
			ORDER BY position`,
			[this.user.userid, groupid]
		);
		
		this.currentGroup = group;
		if(id === false)
			this.socket.emit("group-output", {type: "update", group});
		
		return group;
		
	}
	
	async join_group(id) {
		if(!id) return this.show_server_error(SERVER_ERRORS.BAD_ACTION, "Group ID is not a string value");
		
		if(this.user == null && id !== "special:registration") return this.show_server_error(SERVER_ERRORS.BAD_ACTION, "Logged-out user attempted to open restricted group 'settings'");
		
		if(id.startsWith("special:")) {
			id = id.slice(8);
			await this.join_special_group(id);
		} else {
			if(!await this.permissions.in_group(id))
				return this.show_server_error(SERVER_ERRORS.BAD_ACTION, "User attempted to open a group without permission");
			
			let group = await this.refresh_group(id);
			if(!group) return this.show_server_error(SERVER_ERRORS.SERVER_ERROR, "User is in group, however the group is missing. It may have been removed.");
			
			this.sync_group(group, async event => {
				
				switch(event.type) {
					case "leave":
						await this.db.run("DELETE FROM user_group_relationships WHERE userid = ? AND groupid = ?", [this.user.userid, group.groupid]);
						await GlobalState.refresh_members(group.groupid);
						
						await this.refresh_groups();
						await this.join_group("special:direct");
						break;
					case "edit_group":
						if(~await this.permissions.permissions_group(group.groupid) & Permissions.ByName.EDIT_GROUP)
							return this.show_server_error(SERVER_ERRORS.BAD_ACTION, "User attempted to edit a group without sufficient privileges");
						let show_edit_group = () => {
							this.sync_program({
								type: "settings",
								config: {
									items: [
										{
											title: "Edit Group",
										},
										{
											label: "Icon",
											name: "icon",
											input: "image",
											aspectRatio: [1,1],
											uploadType: "groupicon"
										},
										{
											label: "Group Wallpaper",
											name: "wallpaper",
											input: "image",
											aspectRatio: [16,9],
											uploadType: "wallpaper"
										},
										{
											label: "Name",
											name: "name",
											input: "text"
										},
									],
									defaults: {
										name: group.groupname,
										icon: group.icon,
										wallpaper: group.wallpaper
									}
								}
							}, async event => {
								if(event.type == "submit") {
									if(!event.fields) {
										return false;
									}
									
									// validation
									let name_validation = await Validation.validate_group_name(event.fields.name);
									
									if(name_validation.type !== "success")
										return this.socket.emit('program-output', name_validation);
									
									if(event.fields.icon != group.icon) {
										if(event.fields.icon !== "") {
											
											let icon_validation =
												await Validation.validate_and_use_uploaded_file(this, event.fields.icon, "groupicon");
											
											if(icon_validation.type !== "success")
												return this.socket.emit("program-output", icon_validation);
											
										} else event.fields.icon = null;
									}
									
									if(event.fields.wallpaper != group.wallpaper) {
										if(event.fields.wallpaper !== "") {
											let wallpaper_validation =
												await Validation.validate_and_use_uploaded_file(this, event.fields.wallpaper, "wallpaper");
											if(wallpaper_validation.type !== "success")
												return this.socket.emit("program-output", wallpaper_validation);
										} else event.fields.wallpaper = null;
									}
									
									// change values
									group.groupname = event.fields.name;
									group.icon = event.fields.icon;
									group.wallpaper = event.fields.wallpaper;
									
									
									// sync changes
									await this.db.run("UPDATE groups SET groupname = ?, icon = ?, wallpaper = ? WHERE groupid = ?", [
										group.groupname,
										group.icon,
										group.wallpaper,
										group.groupid
									]);
									
									// return final success state
									this.socket.emit('program-output', {type: "success"});
									setTimeout(async () => {
										await GlobalState.refresh_group(group.groupid);
										show_edit_group();
									}, 500);
								}
							})
						}
						show_edit_group();
						break;
					case "open_program":
						let program = await this.db.get("SELECT programid FROM programs WHERE programid = ? AND groupid = ?", [event.programid, this.currentGroup.groupid]);
						
						if(program !== null)
							this.join_program(program.programid);
						else
							return this.show_server_error(SERVER_ERRORS.BAD_ACTION, "Attempted to join program ID which is not part of the current group");
						
						break;
					case "add_program":
						if(~await this.permissions.permissions_group(group.groupid) & Permissions.ByName.EDIT_PROGRAM)
							return this.show_server_error(SERVER_ERRORS.BAD_ACTION, "User attempted to add a program without sufficient privileges");
						
						let programid = uuid();
						
						
						switch(event.program_type) {
							case "text":
								
								await this.db.run("INSERT INTO programs (programid, type, groupid, name, position, creation, modification) VALUES (?,?,?,?,?,?,?)", [programid, "text", group.groupid, "Chatroom", Date.now(), Date.now(), Date.now()]);
								await this.refresh_group();
								await this.join_program(programid);
								
								break;
							/* case "bulletin":
								
								await this.db.run("INSERT INTO programs (programid, type, groupid, name, position, creation, modification) VALUES (?,?,?,?,?,?,?)", [programid, "bulletin", group.groupid, "Bulletin", Date.now(), Date.now(), Date.now()]);
								await this.refresh_group();
								await this.join_program(programid);
								
								break; */
							case "info":
								
								await this.db.run("INSERT INTO programs (programid, type, groupid, name, position, creation, modification) VALUES (?,?,?,?,?,?,?)", [programid, "info", group.groupid, "Info", Date.now(), Date.now(), Date.now()]);
								await this.refresh_group();
								await this.join_program(programid);
								
								break;
							case "separator":
								await this.db.run("INSERT INTO programs (programid, type, groupid, name, position, creation, modification) VALUES (?,?,?,?,?,?,?)", [programid, "separator", group.groupid, "Separator", Date.now(), Date.now(), Date.now()]);
								await this.refresh_group();
								break;
							default:
								return this.show_server_error(SERVER_ERRORS.BAD_ACTION, "User attempted to create unknown program type '"+event.program_type+"'");
								break;
						}
						break;
					case "edit_program":
						
						if(~await this.permissions.permissions_program(event.programid) & Permissions.ByName.EDIT_PROGRAM)
							return this.show_server_error(SERVER_ERRORS.BAD_ACTION, "User attempted to edit a program without sufficient privileges");
						
						let program_details = await this.db.get("SELECT * FROM programs WHERE programid = ? AND groupid = ?", [event.programid, this.currentGroup.groupid]);
						
						if(!program_details)
							return this.show_server_error(SERVER_ERRORS.BAD_ACTION, "User attempted to edit program that does not exist or is not part of the current group.");
						
						let show_edit_program = () => {
							this.sync_program({
								type: "settings",
								config: {
									items: [
										{
											title: program_details.name,
										},
										{
											label: "Name",
											name: "name",
											input: "text"
										},
										program_details.type !== "info" ? null : {
											label: "Content",
											name: "content",
											input: "textarea"
										}
									],
									defaults: {
										name: program_details.name,
										content: program_details.info_content
									}
								}
							}, async event => {
								if(event.type == "submit") {
									if(!event.fields) {
										return false;
									}
									
									// validation
									let name_validation = await Validation.validate_program_name(event.fields.name);
									
									if(name_validation.type !== "success")
										return this.socket.emit('program-output', name_validation);
									
									if(program_details.type == "info") {
										let info_validation = await Validation.validate_info_content(event.fields.content);
										
									}
									
									// change values
									program_details.name = event.fields.name;
									if(program_details.type == "info")
										program_details.info_content = event.fields.content;
									
									// sync changes
									await this.db.run("UPDATE programs SET name = ?, info_content = ?, modification = ? WHERE programid = ?", [
										program_details.name,
										program_details.info_content,
										Date.now(),
										program_details.programid
									]);
									
									// return final success state
									this.socket.emit('program-output', {type: "success"});
									setTimeout(async () => {
										await this.refresh_group();
										show_edit_program();
									}, 500);
								}
							})
						}
						show_edit_program();
						break;
					case "reorder_program":
						if(~await this.permissions.permissions_program(event.programid) & Permissions.ByName.EDIT_PROGRAM)
							return this.show_server_error(SERVER_ERRORS.BAD_ACTION, "User attempted to reorder programs without sufficient privileges");
						
						let result = await Reorder.reorder_program(this.db, event.programid, event.order);
						
						if(result.type !== "success") {
							return this.show_server_error(SERVER_ERRORS.SERVER_ERROR, "Error occurred while reordering groups - "+result.message);
						}
						await this.refresh_group();
						break;
					case "toggle_role":
						
						if(~await this.permissions.permissions_group(group.groupid) & Permissions.ByName.EDIT_ROLES)
							return this.show_server_error(SERVER_ERRORS.BAD_ACTION, "User attempted to add a role without sufficient privileges");
						
						let role = await this.db.get("SELECT groupid, roleid FROM roles WHERE roleid = ?", event.roleid);
						if(!role || role.groupid !== group.groupid)
							return this.show_server_error(SERVER_ERRORS.BAD_ACTION, "User attempted to add invalid role to group member");
						
						let membership = (await this.permissions.group_members(group.groupid)).filter(member => member.userid == event.userid);
						if(membership.length == 0)
							return this.show_server_error(SERVER_ERRORS.BAD_ACTION, "User attempted to add a role to a non-member of the current group");
						
						let user_has_role = await this.db.get("SELECT id FROM role_assignation WHERE userid = ? AND roleid = ?", [event.userid, event.roleid]);
						
						if(event.action !== "remove" && !user_has_role)
							await this.db.run("INSERT INTO role_assignation (userid, roleid) VALUES (?,?)", [event.userid, role.roleid]);
						
						if(event.action !== "add" && user_has_role)
							await this.db.run("DELETE FROM role_assignation WHERE userid = ? AND roleid = ?", [event.userid, role.roleid]);
						
						await GlobalState.refresh_group(group.groupid);
						
						break;
					case "edit_roles":
						if(~await this.permissions.permissions_group(group.groupid) & Permissions.ByName.EDIT_ROLES)
							return this.show_server_error(SERVER_ERRORS.BAD_ACTION, "User attempted to edit roles without sufficient privileges");
						
						let group_roles = await this.db.all("SELECT * FROM roles WHERE groupid = ? ORDER BY position", group.groupid);
						
						// transform roles into roleid: roledata keypairs rather than an array
						group_roles = Object.fromEntries(group_roles.map(role => [role.roleid, role]));
						
						this.sync_program({
							type: "roles",
							title: "Role Manager",
							group: true,
							roles: group_roles
						}, async event => {
							if(~await this.permissions.permissions_group(group.groupid) & Permissions.ByName.EDIT_ROLES)
								return this.show_server_error(SERVER_ERRORS.BAD_ACTION, "User attempted to edit roles without sufficient privileges");
							if(event.type == "add_role") {
								let new_id = uuid();
								await this.db.run("INSERT INTO roles (roleid, name, groupid, position) VALUES (?,?,?,?)", [new_id, "new role", group.groupid, Date.now()]);
								this.socket.emit("program-output", {
									type: "add_role",
									role: await this.db.get("SELECT * FROM roles WHERE roleid = ?", new_id)
								});
							}
							if(event.type == "remove_role") {
								let has_role = await this.db.get("SELECT * FROM roles WHERE roleid = ? AND groupid = ?", [event.roleid, group.groupid]);
								
								if(has_role == null)
									return this.socket.emit("program-output", Banners.error("Role does not exist or has already been deleted"));
								
								await this.db.run("DELETE FROM roles WHERE roleid = ? AND groupid = ?", [event.roleid, group.groupid]);
								await this.db.run("DELETE FROM role_assignation WHERE roleid = ?", event.roleid);
								
								this.socket.emit("program-output", {
									type: "remove_role",
									roleid: event.roleid
								});
							}
							if(event.type == "submit") {
								// validation
								let role_update_data = {};
								role_update_data = event.data;
								
								// TODO: fix privilege escalation exploits in roles menu (the client is not able to enable the EDIT_ROLES permission at this time - ADMIN should be used instead)
								
								/*
									const user_roles = await this.permissions.get_roles(this.user.userid, group.groupid);
									let max_role_pos = Math.min(...user_roles.map(role => role.position));
									
									if(await this.permissions.permissions_group(group.groupid) & Permissions.ByName.ADMIN)
										max_role_pos = 0;
								*/
								
								let max_role_pos = 0;
								
								
								for(let roleid in role_update_data) {
									let role = await this.db.get("SELECT * FROM roles WHERE roleid = ?", roleid);
									if(!role)
										return this.socket.emit("program-output", Banners.error("Role ID not present. Try closing this menu and opening it again."))
									
									if(role.position < max_role_pos) {
										delete role_update_data[roleid];
										continue;
									}
									
									let updated_role = role_update_data[roleid];
									if(typeof updated_role.allow_permissions !== "number" ||
										typeof updated_role.deny_permissions !== "number")
										return this.socket.emit(Banners.error("Allowed or denied permissions are not numeric."))
									
									if(updated_role.allow_permissions & updated_role.deny_permissions)
										return this.socket.emit("program-output", Banners.error("Permission values appear to be both allowed and denied"));
									
									if(~await this.permissions.permissions_group(group.groupid) &
											(role.allow_permissions ^ updated_role.allow_permissions))
										return this.socket.emit("program-output", Banners.error("You cannot grant a role permissions which you don't already have."));
									
									/*
									TODO: fix privilege escalation in roles menu
									if(updated_role.position < max_role_pos) {
										console.log(updated_role.position, max_role_pos)
										return this.socket.emit("program-output", Banners.error("You cannot rearrange a role to be in a higher position than your own."))
									}
									*/
									
									let roleNameVerification = await Validation.validate_role_name(updated_role.name);
									if(roleNameVerification.type !== "success")
										return this.socket.emit("program-output", roleNameVerification);
									
									if(role.icon !== updated_role.icon) {
										if(updated_role.icon == "") updated_role.icon = null;
										else {
											let icon_validation =
												await Validation.validate_and_use_uploaded_file(this, updated_role.icon, "roleicon");
											if(icon_validation.type !== "success")
												return this.socket.emit("program-output", icon_validation);
										}
									}
								}
								
								let role_positions_db = await this.db.all("SELECT roleid, position FROM roles WHERE groupid = ?", group.groupid);
								role_positions_db = Object.fromEntries(role_positions_db.map(role => [role.roleid, role.position]));
								
								let role_positions_user = Object.fromEntries(
									Object.values(role_update_data).map(role => [role.roleid, role.position])
								);
								let role_positions = {...role_positions_db, ...role_positions_user};
								
								// replace values that have been modified by the user
								role_positions = Object.values(role_positions);
								
								for(let test_pos of role_positions) {
									let similar = role_positions.filter(role_pos => role_pos == test_pos);
									if(similar.length > 1)
										return this.socket.emit("program-output", Banners.error("Multiple roles have the same position value here. This seems like a client issue..."));
								}
								
								// change values
								
								// sync changes
								for(let roleid in role_update_data) {
									let role = role_update_data[roleid];
									await this.db.run("UPDATE roles SET name = ?, icon = ?, position = ?, allow_permissions = ?, deny_permissions = ? WHERE roleid = ?", [role.name, role.icon, role.position, role.allow_permissions, role.deny_permissions, roleid]);
								}
								
								// return final success state
								this.socket.emit('program-output', {type: "success"});
								await GlobalState.refresh_group(group.groupid);
							}
						})
						break;
					case "remove_program":
						if(~await this.permissions.permissions_program(event.programid) & Permissions.ByName.DELETE_PROGRAMS)
							return this.show_server_error(SERVER_ERRORS.BAD_ACTION, "User attempted to remove a program without sufficient privileges");
						await this.db.run("UPDATE programs SET groupid = null WHERE programid = ?", event.programid);
						await this.refresh_group();
						if(this.currentProgram.programid == event.programid)
							this.join_group(this.currentGroup.groupid);
						break;
					case "send_invite":
						if(~await this.permissions.permissions_group(group.groupid) & Permissions.ByName.INVITE_OTHERS)
							return this.show_server_error(SERVER_ERRORS.BAD_ACTION, "User attempted to invite to a group without permission");
						
						let invitee_relationship = await this.db.get("SELECT * FROM friends WHERE (userid1 = ? AND userid2 = ?) OR (userid1 = ? AND userid2 = ?)", [event.userid, this.user.userid, this.user.userid, event.userid]);
						if(invitee_relationship == null)
							return this.show_server_error(SERVER_ERRORS.BAD_ACTION, "User attempted to invite a user with no friendship status");
						
						let already_sent = await this.db.get("SELECT * FROM group_invites WHERE from_userid = ? AND to_userid = ? AND groupid = ?", [this.user.userid, event.userid, group.groupid]);
						if(already_sent)
							return this.show_server_error(SERVER_ERRORS.BAD_ACTION, "User has already been invited");
						
						let already_in_group = await this.db.get("SELECT * FROM user_group_relationships WHERE userid = ? AND groupid = ?", [event.userid, group.groupid])
						if(already_in_group)
							return this.show_server_error(SERVER_ERRORS.BAD_ACTION, "User is already in group");
						
						await this.db.run("INSERT INTO group_invites (from_userid, to_userid, groupid, creation) VALUES (?,?,?,?)", [this.user.userid, event.userid, group.groupid, Date.now()]);
						
						await GlobalState.refresh_notification(this, {
							type: "invite",
							to: event.userid
						});
						
						break;
					default:
						this.show_server_error(SERVER_ERRORS.BAD_ACTION, "Unknown group interaction event");
						break;
				}
				
				if(event.type == "edit") {
					
				}
				if(event.type == "add_program") {
					
				}
				
			});
			
			let joinable_programs = this.currentGroup.programs.filter(program => program.type !== "separator");
			if(joinable_programs.length > 0) await this.join_program(joinable_programs[0].programid);
			
		}
	}
	async join_program(id) {
		if(!id) return this.show_server_error(SERVER_ERRORS.BAD_ACTION, "Program ID is not a string value");
		
		if(id.startsWith("special:")) {
			id = id.slice(8);
			await this.join_special_program(id);
		} else {
			let program = await this.db.get("SELECT * FROM programs WHERE programid = ?", [id]);
			if(!program) return this.show_server_error(SERVER_ERRORS.UNKNOWN_PROGRAM_ID);
			
			{ // wrapped in a block to prevent the `permissions` variable from being reused accidentally - they may be changed later
				let permissions = await this.permissions.permissions_program(id)
				
				if(!(permissions & Permissions.ByName.VIEW_PROGRAM))
					return this.show_server_error(
						SERVER_ERRORS.BAD_ACTION,
						"User does not have the required privilege level to open this program."
					);
			}
			
			switch(program.type) {
				case "separator":
					return false;
					break;
				case "info":
					this.sync_program(
						{
							type: "info",
							name: program.name,
							title: program.name,
							programid: program.programid,
							info_content: program.info_content
						},
						() => {}
					);
					break;
				case "text":
					let dm_details = null;
					
					
					if(program.is_dm) {
						
						let relationship = await this.db.get(
							"SELECT userid1, userid2 FROM friends WHERE programid = ?", program.programid
						);
						
						if(!relationship ||
							(
								relationship.userid1 !== this.user.userid &&
								relationship.userid2 !== this.user.userid
							)
						)
							return this.show_server_error(SERVER_ERRORS.BAD_ACTION, "Attempted to join DM without permission");
						
						let other_userid = relationship.userid1;
						
						if(other_userid == this.user.userid)
							other_userid = relationship.userid2;
						
						let other_user = await this.db.get("SELECT username FROM users WHERE userid = ?", other_userid);
						
						dm_details = {
							other_username: other_user.username
						}
						
					}
					
					
					
					let messageHistory = await Messages.get_messages(this.db, `
						WHERE messages.programid = ?
						ORDER BY messages.creation DESC
						LIMIT 50`,
						program.programid
					);
					messageHistory = messageHistory.reverse();
					
					let lastNotificationTimeout = null; // used to prevent spam in refreshing notifications on message read
					this.sync_program(
						{
							type: program.type,
							name: program.name,
							title: program.is_dm ? "Chat with "+dm_details.other_username : program.name,
							programid: program.programid,
							messageHistory: messageHistory,
						},
						async event => {
							switch(event.type) {
								case "typing":
									
									this.socket.to(this.currentProgram.programid).emit("program-output", {
										type: "typing",
										time: Date.now(),
										user: {
											displayname: this.user.displayname,
											username: this.user.username,
											userid: this.user.userid,
											pfp: this.user.pfp,
										}
									});
									
									break;
								case "read-message":
									let alreadyRead = await this.db.get("SELECT * FROM read_indicators WHERE userid = ? AND messageid = ?", this.user.userid, event.messageid);
									if(alreadyRead) return false;
									
									let message = await this.db.get("SELECT programid FROM messages WHERE messageid = ?", event.messageid);
									
									if(!message) return false;
									if(message.programid !== program.programid) return false;
									
									await this.db.run("INSERT INTO read_indicators (userid, messageid, creation) VALUES (?,?,?)", this.user.userid, event.messageid, Date.now());
									
									let myTimeout = lastNotificationTimeout = setTimeout(() => {
										// used to prevent spam in refreshing notifications upon message read
										if(myTimeout == lastNotificationTimeout)
											this.refresh_notifications();
									}, 1000)
									
									break;
								case "load-messages":
									if(typeof event.offset !== "number")
										return this.show_server_error(SERVER_ERRORS.BAD_ACTION, "User attempted to load messages with a non-numeric offset value")
									
									let messages = await Messages.get_messages(this.db, `
										WHERE messages.programid = ?
										ORDER BY messages.creation DESC
										LIMIT 50 OFFSET ?`,
										[program.programid, event.offset]
									);
									messages = messages.reverse();
									
									this.socket.emit("program-output", {
										type: "load",
										offset: event.offset,
										messages
									})
									break;
								case "delete-message":
									{
										let message = await this.db.get("SELECT * FROM messages WHERE programid = ? AND messageid = ?", program.programid, event.messageid);
										
										if(!message)
											return this.show_server_error(SERVER_ERRORS.BAD_ACTION, "Could not find deleted message.");
										
										if(~this.permissions.permissions_program(program.programid) & Permissions.DELETE_MESSAGES)
										if((this.user.userid == message.userid && ~this.permissions.permissions_program(program.programid) & Permissions.DELETE_OWN_MESSAGES))
											return this.show_server_error(SERVER_ERRORS.BAD_ACTION, "You do not have permission to delete messages.");
										
										let edit_content_validation = await Validation.validate_message_content(event.content);
										if(edit_content_validation.type !== "success")
											return this.show_server_error(SERVER_ERRORS.BAD_ACTION, edit_content_validation.message);
										
										await this.db.run("UPDATE messages SET content = ?, edits = ? WHERE messageid = ?", event.content, message.edits+1, message.messageid)
										
										this.socket.to(this.currentProgram.programid).emit("program-output", {
											type: "edit",
											messageid: message.messageid,
											content: event.content
										});
									}
									break;	
								case "edit-message":
									{
										let message = await this.db.get("SELECT * FROM messages WHERE userid = ? AND programid = ? AND messageid = ?", this.user.userid, program.programid, event.messageid);
										
										if(!message)
											return this.show_server_error(SERVER_ERRORS.BAD_ACTION, "Could not find edited message.");
										
										if(~this.permissions.permissions_program(program.programid) & Permissions.EDIT_MESSAGES)
											return this.show_server_error(SERVER_ERRORS.BAD_ACTION, "You do not have permission to edit messages.");
										
										let edit_content_validation = await Validation.validate_message_content(event.content);
										if(edit_content_validation.type !== "success")
											return this.show_server_error(SERVER_ERRORS.BAD_ACTION, edit_content_validation.message);
										
										await this.db.run("UPDATE messages SET content = ?, edits = ? WHERE messageid = ?", event.content, message.edits+1, message.messageid)
										
										this.socket.to(this.currentProgram.programid).emit("program-output", {
											type: "edit",
											...await Messages.get_message(this.db, "WHERE messages.messageid = ?", message.messageid)
										});
									}
									break;
								case "send-message":
									
									if(typeof event.text !== "string") return false;
									
									const hasAttachments = Array.isArray(event.attachments) && event.attachments.length > 0;
									
									if(event.text.trim() == "" && !hasAttachments)
										return false;
									
									if(~await this.permissions.permissions_program(program.programid) & Permissions.ByName.SEND_MESSAGES)
										return this.show_server_error(SERVER_ERRORS.BAD_ACTION, "You're not allowed to send messages here.");
									
									let creation = Date.now();
									let messageid = uuid();
									
									let message_content_validation = await Validation.validate_message_content(event.text, hasAttachments);
									if(message_content_validation.type !== "success")
										this.show_server_error(SERVER_ERRORS.BAD_ACTION, message_content_validation.message);
									
									if(hasAttachments) {
										// validation
										if(~await this.permissions.permissions_program(program.programid) & Permissions.ByName.SEND_FILES)
											return this.show_server_error(SERVER_ERRORS.BAD_ACTION, "You're not allowed to send files here.");
										
										for(let uploadid of event.attachments) {
											let attachment_validation =
												await Validation.validate_uploaded_file(this, uploadid, "attachment");
											
											if(attachment_validation.type !== "success")
												return this.socket.emit("program-output", attachment_validation);
										}
										
										// use files
										for(let uploadid of event.attachments) {
											await this.db.run("UPDATE uploads SET autodelete = 0 WHERE uploadid = ?", uploadid);
											await this.db.run("INSERT INTO message_attachments (messageid, uploadid) VALUES (?,?)", [messageid, uploadid]);
										}
									}
									
									await this.db.run(
										`INSERT INTO messages (messageid, userid, programid, content, creation) VALUES (?,?,?,?,?)`,
										[messageid, this.user.userid, this.currentProgram.programid, event.text, creation]
									);
									
									const newMessage = await Messages.get_message(this.db, `
										WHERE messages.messageid = ?
										LIMIT 1`,
										messageid
									);
									if(!newMessage) return this.show_server_error(SERVER_ERRORS.SERVER_ERROR);
									
									// broadcast message
									this.socket.to(this.currentProgram.programid).emit("program-output", {
										type: 'message',
										...newMessage
									});
									
									await GlobalState.refresh_notification(this, {
										type: "message",
										messageid
									});
									
									break
							}
						}
					);
					
					this.socket.join(program.programid);
					
					break;
			}
			
		}
	}
	
	async join_special_group(id) {
		// helper function - to be put in a better place later
		let show_error_banner = (error) => {
			this.socket.emit("program-output", Banners.error(error));
		}
		
		switch(id) {
			case "registration":
				
				this.sync_group({groupid: "special:registration", special: "registration"});
				this.special_programs = {
					
					login: () => {
						this.sync_program(
							{
								type: "settings",
								title: "Log in",
								config: {
									groupCreation: true,
									items: [
										{
											title: "Log in"
										},
										{
											label: "Username",
											input: "text",
											name: "username"
										},
										{
											label: "Password",
											input: "password",
											name: "password"
										},
										{
											special: "log-in-sign-up",
											current: "log-in"
										}
									],
									defaults: {}
								}
							},
							async event => {
								if(event.type == "signup") return this.join_program("special:signup")
									
								if(!event.fields) return false;
								let userRecord = await this.db.get("SELECT userid, password FROM users WHERE username = ?", [event.fields.username]);
								if(!userRecord)
									return show_error_banner("Account does not exist.");
								if(userRecord.password.length == 0)
									return show_error_banner("Account has been blocked.");
								if(!(await bcrypt.compare(event.fields.password, userRecord.password)))
									return show_error_banner("Invalid password.");
								
								let token = await create_token(this.db, userRecord.userid, userRecord.password);
								
								this.socket.emit("log-in", token)
							}
						);
					},
					
					signup: () => {
						this.sync_program(
							{
								type: "settings",
								title: "Sign up",
								config: {
									groupCreation: true,
									items: [
										{
											title: "New Account"
										},
										{
											label: "Username",
											input: "text",
											name: "username"
										},
										{
											label: "Password",
											input: "password",
											name: "password"
										},
										{
											label: "Verify Password",
											input: "password",
											name: "password2"
										},
										{
											special: "log-in-sign-up",
											current: "sign-up"
										}
									],
									defaults: {}
								}
							},
							async event => {
								if(event.type == "login") return this.join_program("special:login")
								
								if(!event.fields) return;
								
								if(event.fields.password2 !== event.fields.password)
									return show_error_banner("Passwords do not match!");
								
								let username_validation = await Validation.validate_new_username(event.fields.username, this.db);
								
								if(username_validation.type !== "success")
									return this.socket.emit('program-output', username_validation);
								
								let password_validation = await Validation.validate_password(event.fields.password);
								
								if(password_validation.type !== "success")
									return this.socket.emit('program-output', password_validation);
								
								let userid = uuid();
								let hashed_password = await bcrypt.hash(event.fields.password, 12);
								
								await this.db.run("INSERT INTO users (userid, username, password, displayname, creation, modification) VALUES (?,?,?,?,?,?)", [userid, event.fields.username, hashed_password, event.fields.username, Date.now(), Date.now()]);
								
								let token = await create_token(this.db, userid, hashed_password);
								
								this.socket.emit("log-in", token)
							}
						);
					},
					
				}
				this.join_program("special:login");
				
				break;
			case "direct":
				if(this.user == null) return this.show_server_error(SERVER_ERRORS.BAD_ACTION, "Logged-out user attempted to open restricted group 'settings'");
				this.sync_group({
					groupid: "special:direct",
					special: "direct"
				}, event => {
					switch(event.type) {
						case "friends_list":
							this.join_program("special:friends");
							break;
						case "invites":
							this.join_program("special:invites");
							break;
					}
				});
				this.special_programs = {
					friends: async () => {
						
						let requests = await this.db.all("SELECT requestor FROM friend_requests WHERE requestee = ?", this.user.userid);
						
						for(let r = 0; r < requests.length; r++)
							requests[r] = await this.db.get(
								"SELECT userid, displayname, pfp FROM users WHERE userid = ?", requests[r].requestor
							);
						
						
						this.sync_program(
							{
								type: "friends",
								title: "Friends",
								requests: requests
							},
							async event => {
								switch(event.type) {
									
									case "request":
										
										let requestUser = await this.db.get("SELECT userid FROM users WHERE username = ?", event.username);
										if(!requestUser)
											return show_error_banner("Couldn't find anyone by that name, sorry.");
										if(requestUser.userid == this.user.userid)
											return show_error_banner("You can't send a friend request to yourself.");
										let checkRequest = await this.db.get("SELECT id FROM friend_requests WHERE (requestor = ? AND requestee = ?) OR (requestor = ? AND requestee = ?)", [this.user.userid, requestUser.userid, requestUser.userid, this.user.userid])
										if(checkRequest)
											return show_error_banner("Request already sent");
										
										let isFriends = await this.db.get("SELECT * FROM friends WHERE (userid1 = ? OR userid2 = ?) AND (userid1 = ? OR userid2 = ?)", [this.user.userid, this.user.userid, requestUser.userid, requestUser.userid]);
										if(isFriends)
											return show_error_banner("You're already friends");
										
										await this.db.run("INSERT INTO friend_requests (requestor, requestee) VALUES (?, ?)", [this.user.userid, requestUser.userid]);
										this.socket.emit("program-output", Banners.banner("success", "Friend request sent!"));
										
										await GlobalState.refresh_notification(this, {
											type: "friend_request",
											to: requestUser.userid
										});
										
										break;
									
									case "accept-request":
										let request = await this.db.get("SELECT * FROM friend_requests WHERE requestor = ? AND requestee = ?", [event.userid, this.user.userid]);
										if(!request) return false;
										await this.db.run("INSERT INTO friends (userid1, userid2, creation) VALUES (?,?, ?)", [request.requestor, request.requestee, Date.now()]);
									case "reject-request":
										await this.db.run("DELETE FROM friend_requests WHERE requestor = ? AND requestee = ?", [event.userid, this.user.userid]);
										await this.refresh_friends();
										await GlobalState.refresh_friends(event.userid);
										await this.refresh_notifications();
										await this.join_program("special:friends");
										break;
									
									default:
										logger.log(2, "Unknown event", event);
										break;
								}
							}
						);
						
						
					},
					invites: async () => {
						let invites = await this.db.all("SELECT * FROM group_invites WHERE to_userid = ? ORDER BY creation", this.user.userid);
						
						for(let row in invites)
							invites[row] = {
								from: await this.db.get(
									"SELECT displayname FROM users WHERE userid = ?", invites[row].from_userid
								),
								group: await this.db.get(
									"SELECT groupid, groupname, icon FROM groups WHERE groupid = ?", invites[row].groupid
								)
							}
						
						this.sync_program(
							{
								type: "invites",
								title: "Invites",
								invites
							},
							async event => {
								if(event.type == "accept" || event.type == "reject") {
									let invite = await this.db.get(
										`SELECT * FROM group_invites
										WHERE groupid = ? AND to_userid = ?`,
										[event.groupid, this.user.userid]
									);
									if(!invite) return false;
									if(event.type == "accept") {
										let already_in_group = await this.db.get("SELECT * FROM user_group_relationships WHERE userid = ? AND groupid = ?", [this.user.userid, invite.groupid]);
										if(!already_in_group) {
											await this.db.run("INSERT INTO user_group_relationships (userid, groupid, position) VALUES (?,?,?)", [this.user.userid, invite.groupid, Date.now()]);
											await GlobalState.refresh_members(invite.groupid);
										}
									}
									await this.db.run("DELETE FROM group_invites WHERE to_userid = ? AND groupid = ?", [this.user.userid, invite.groupid]);
									this.join_program("special:invites");
									this.refresh_groups();
									this.refresh_notifications();
								}
							}
						);
					}
				}
				await this.join_program("special:friends");
				break;
			case "settings":
				if(this.user == null) return this.show_server_error(SERVER_ERRORS.BAD_ACTION, "Logged-out user attempted to open restricted group 'direct'");
				this.sync_group({
					groupid: "special:settings",
					special: "settings"
				});
				this.special_programs = {
					settings: async () => {
						this.sync_program(
							{
								type: "settings",
								title: "Settings",
								config: {
									items: [
										{
											"title": "Settings"
										},
										{
											"label": "Profile"
										},
										{
											"label": "Picture",
											"input": "image",
											"aspectRatio": [1, 1],
											"name": "pfp",
											"uploadType": "pfp"
										},
										{
											"input": "text",
											"name": "username",
											"label": "Username"
										},
										{
											"input": "text",
											"name": "displayname",
											"label": "Display Name"
										},
										{
											"input": "textarea",
											"name": "bio",
											"label": "Bio"
										},
										{
											"label": "Profile Wallpaper",
											"input": "image",
											"aspectRatio": [16, 9],
											"name": "wallpaper",
											"uploadType": "wallpaper",
											"separator": true
										},
										/*
										TODO: these options
										{
											"label": "Privacy"
										},
										{
											"input": "toggle",
											"name": "readindicators",
											"label": "Send 'read' indicators"
										},
										{
											"input": "toggle",
											"name": "typingindicators",
											"label": "Send typing indicators",
											"separator": true
										},
										{
											"label": "Feedback"
										},
										{
											"input": "toggle",
											"name": "notifications",
											"label": "Notifications"
										},
										{
											"input": "toggle",
											"name": "msgchimes",
											"label": "Send and receive chimes",
											"separator": true
										},*/
										{
											"special": "logout"
										}
									],
									defaults: {
										displayname: this.user.displayname,
										username: this.user.username,
										pfp: this.user.pfp,
										wallpaper: this.user.wallpaper,
										bio: this.user.bio
									}
								}
							},
							async event => {
								if(event.type == "submit") {
									if(!event.fields) {
										return false;
									}
									
									// validation
									let username_validation = await Validation.validate_new_username(event.fields.username, this.db, this.user.username);
									
									if(username_validation.type !== "success")
										return this.socket.emit('program-output', username_validation);
									
									let display_name_validation = await Validation.validate_display_name(event.fields.displayname);
									
									if(display_name_validation.type !== "success")
										return this.socket.emit("program-output", display_name_validation);
									
									if(event.fields.pfp != this.user.pfp) {
										if(event.fields.pfp !== "") {
											let pfp_validation =
												await Validation.validate_and_use_uploaded_file(this, event.fields.pfp, "pfp");
											if(pfp_validation.type !== "success")
												return this.socket.emit("program-output", pfp_validation);
											this.user.pfp = event.fields.pfp;
										} else this.user.pfp = null;
									}
									
									if(event.fields.wallpaper != this.user.wallpaper) {
										if(event.fields.wallpaper !== "") {
											let wallpaper_validation =
												await Validation.validate_and_use_uploaded_file(this, event.fields.wallpaper, "wallpaper");
											
											if(wallpaper_validation.type !== "success")
												return this.socket.emit("program-output", wallpaper_validation);
											
											this.user.wallpaper = event.fields.wallpaper;
										} else this.user.wallpaper = null;
									}
									
									let bio_validation = await Validation.validate_bio(event.fields.bio);
									if(bio_validation.type !== "success")
										return this.socket.emit("program-output", bio_validation);
									
									// change values
									this.user.username = event.fields.username;
									this.user.displayname = event.fields.displayname;
									this.user.bio = event.fields.bio;
									
									// sync changes
									await this.db.run("UPDATE users SET username = ?, displayname = ?, pfp = ?, wallpaper = ?, bio = ? WHERE userid = ?", [
										this.user.username,
										this.user.displayname,
										this.user.pfp,
										this.user.wallpaper,
										this.user.bio,
										this.user.userid
									]);
									
									GlobalState.refresh_user(this.user.userid);
									// return final success state
									this.socket.emit('program-output', {type: "success"})
									setTimeout(() => {
										this.join_program("special:settings");
									}, 500);
								}
							}
						);
					}
				}
				await this.join_program("special:settings");
				break;
			case "new":
				if(this.user == null) return this.show_server_error(SERVER_ERRORS.BAD_ACTION, "Logged-out user attempted to open restricted group 'new'");
				this.sync_group({
					groupid: "special:new",
					special: "new"
				});
				this.special_programs = {
					"new": async () => {
						let new_group_set_page = (page) => {
							if(this.currentProgram.type !== "new") return false;
							let defaults = this.currentProgram.enteredValues;
							
							let stepsItem =
								{
									special: "newgroupsteps",
									step: page,
									steps: null
								};
							let pages = [
								{
									groupCreation: true,
									items: [
										{
											title: "New Group"
										},
										{
											label: "Group Name:",
											input: "text",
											name: "groupname"
										},
										stepsItem
									],
									defaults: defaults
								},
								/*{
									groupCreation: true,
									items: [
										{
											title: "Pick an Image:"
										},
										{
											label: "Choose your group's icon.",
										},
										{
											name: "icon",
											input: "image",
											aspectRatio: [1,1],
											uploadType: "groupicon"
										},
										{
											label: "(You can also do this later.)",
										},
										stepsItem
									],
									defaults: defaults
								},*/
								{
									groupCreation: true,
									items: [
										{
											label: "This menu is not finished yet. Click 'Next' to create your group."
										},
										stepsItem
									],
									defaults: defaults
								}
							]
							
							stepsItem.steps = pages.length;
							
							if(page >= pages.length)
								return true;
							if(page < 0)
								return false;
							
							this.currentProgram.page = page;
							this.socket.emit("program-output", {type: "set-config", config: pages[page]});
							
							return false;
						}
						this.sync_program(
							{
								type: "new",
								title: "Group Creation Wizard",
								enteredValues: {}
							},
							async event => {
								if(event.type == "submit") {
									if(event.special && event.special.isBack && this.currentProgram.page == 0) return this.show_server_error(SERVER_ERRORS.BAD_ACTION);
									
									this.currentProgram.enteredValues = {...this.currentProgram.enteredValues, ...event.fields};
									
									if(this.currentProgram.page == 0) {
										let groupNameValidation = await Validation.validate_group_name(this.currentProgram.enteredValues.groupname);
										if(groupNameValidation.type !== "success")
											return this.socket.emit("program-output", groupNameValidation);
									}
									
									let tempValue = this.currentProgram.tempValue = Math.random();
									this.socket.emit("program-output", {type: "success"});
									setTimeout(async () => {
										if(this.currentProgram.tempValue !== tempValue) return false;
										let lastPage = new_group_set_page(this.currentProgram.page + (event.special && event.special.isBack ? -1 : 1));
										
										if(lastPage === true) {
											
											
											let newGroupId = uuid();
											
											await this.db.run(
												`INSERT INTO groups (groupid, userid, groupname, creation, modification)
												VALUES (?,?,?,?,?)`,
												[
													newGroupId,
													this.user.userid,
													this.currentProgram.enteredValues.groupname,
													Date.now(), Date.now()
												]
											);
											
											let newProgramId = uuid();
											
											await this.db.run(
												`INSERT INTO programs (programid, type, groupid, name, position, creation, modification)
												VALUES (?,?,?,?,?,?,?)`,
												[
													newProgramId,
													"text",
													newGroupId,
													"Chatroom",
													Date.now(), Date.now(), Date.now()
												]
											);
											
											await this.refresh_groups();
											this.join_group(newGroupId);
											
										}
									}, 500);
									
									//}
								}
							}
						);
						new_group_set_page(0);
					}
				}
				this.join_program("special:new");
				break;
			case "profile":
				break;
			default:
				this.show_server_error(SERVER_ERRORS.UNKNOWN_GROUP_ID, "Group "+id+" not found");
				break;
		}
	}
	
	async join_special_program(id) {
		if(!this.special_programs) return this.show_server_error(SERVER_ERRORS.SERVER_ERROR, `program ${id} not found in special programs list. group ${JSON.stringify(this.currentGroup)}`);
		if(this.special_programs[id])
			await this.special_programs[id]();
		else if(this.special_program_handler)
			this.special_program_handler(id);
		else
			return this.show_server_error(SERVER_ERRORS.UNKNOWN_PROGRAM_ID, "Unknown special program ID: "+id);
	}
	
	async refresh_groups() {
		if(!this.user) return false;
		let groups = await this.permissions.groups();
		this.socket.emit("groups", groups);
	}
	
	async refresh_members() {
		if(this.currentGroup && this.currentGroup.members) {
			this.refresh_group();
		}
		this.socket.emit("program-output",
			{
				type: "members",
				members: await this.permissions.program_members(this.currentProgram.programid)
			}
		);
	}
	
	async refresh_friends() {
		if(!this.user) return false;
		let relations = await this.db.all(
			`SELECT friends.*, COALESCE(MAX(messages.creation), friends.creation) AS last_message_time
			FROM friends
			LEFT JOIN messages ON messages.programid = friends.programid
			WHERE friends.userid1 = ? OR friends.userid2 = ?
			GROUP BY friends.id
			ORDER BY last_message_time DESC`,
			[this.user.userid, this.user.userid]
		);
		for(let r = 0; r < relations.length; r++) {
			relations[r] = await this.db.get(
				"SELECT userid, displayname, pfp, status FROM users WHERE userid = ?", relations[r].userid1 == this.user.userid ? relations[r].userid2 : relations[r].userid1
			);
			relations[r].state = await GlobalState.user_state(relations[r].userid);
		}
		this.friends = relations;
		this.socket.emit("friends", relations);
		
		if(this.currentProgram && this.currentProgram.type == "friends") {
			this.socket.emit("program-output", {type: "update_friends"});
		}
	}
	
	
	async refresh_notifications() {
		if(!this.user)
			return false;
		
		let notifications = [];
		
		
		let message_counts = await this.db.all(`
			SELECT COUNT(messageid) AS count, users.username, users.userid, MAX(messages.creation) AS creation FROM messages
			JOIN users ON users.userid = messages.userid
			WHERE messages.programid IN
				(SELECT programid FROM friends WHERE userid1 = ? OR userid2 = ?)
					AND
				NOT messages.userid = ?
					AND
				NOT messages.messageid IN
					(SELECT messageid FROM read_indicators WHERE userid = ?)
			GROUP BY messages.programid`,
			[this.user.userid, this.user.userid, this.user.userid, this.user.userid]
		);
		
		for(let row of message_counts) {
			notifications.push({
				type: "messages",
				count: row.count,
				username: row.username,
				userid: row.userid,
				creation: row.creation
			});
		}
		
		let friend_requests = await this.db.get(`
			SELECT COUNT(id) AS count, MAX(creation) AS creation FROM friend_requests
			WHERE requestee = ?
			GROUP BY requestee`,
			this.user.userid)
			
		if(friend_requests && friend_requests.count > 0)
			notifications.push({
				type: "friend_requests",
				count: friend_requests.count,
				creation: friend_requests.creation
			});
		
		let invites = await this.db.get(`
			SELECT COUNT(id) AS count, MAX(creation) AS creation FROM group_invites
			WHERE to_userid = ?
			GROUP BY to_userid`,
			this.user.userid)
			
		if(invites && invites.count > 0)
			notifications.push({
				type: "invites",
				count: invites.count,
				creation: invites.creation
			});
		
		
		
		notifications = notifications.sort((notifA, notifB) => notifA.creation - notifB.creation);
		this.socket.emit("notifications", notifications);
		
		this.refresh_group();
	}
	
	async general_interaction(event) {
		if(!this.user) return;
		
		switch(event.type) {
			case "unfriend":
				{
					let relationship = await this.db.get("SELECT id FROM friends WHERE (userid1 = ? AND userid2 = ?) OR (userid1 = ? AND userid2 = ?)", [event.userid, this.user.userid, this.user.userid, event.userid])
					if(!relationship) return;
					
					await this.db.run("DELETE FROM friends WHERE id = ?", relationship.id);
					
					await GlobalState.refresh_friends(event.userid);
					await this.refresh_friends();
				}
				break;
			case "friend-request":
				{
					if(event.userid == this.user.userid)
						return this.show_server_error(SERVER_ERRORS.BAD_ACTION, "You cannot send a friend request to yourself");
					
					let requestUser = await this.db.get("SELECT * FROM users WHERE userid = ?", event.userid);
					
					if(requestUser == null)
						return this.show_server_error(SERVER_ERRORS.BAD_ACTION, "Attempted to friend nonexistent user");
					
					let checkRequest = await this.db.get("SELECT id FROM friend_requests WHERE requestor = ? AND requestee = ?", [this.user.userid, requestUser.userid])
					if(checkRequest)
						return this.show_server_error(SERVER_ERRORS.BAD_ACTION, "Attempted to send a user another friend request");
					
					let isFriends = await this.db.get("SELECT * FROM friends WHERE (userid1 = ? OR userid2 = ?) AND (userid1 = ? OR userid2 = ?)", [this.user.userid, this.user.userid, requestUser.userid, requestUser.userid]);
					if(isFriends)
						return this.show_server_error(SERVER_ERRORS.BAD_ACTION, "Attempted to send a friend a friend request");
					
					await this.db.run("INSERT INTO friend_requests (requestor, requestee) VALUES (?, ?)", [this.user.userid, requestUser.userid]);
					
				}
				break;
			case "open-dm":
				{
					let relationship = await this.db.get("SELECT id, programid FROM friends WHERE (userid1 = ? AND userid2 = ?) OR (userid1 = ? AND userid2 = ?)", [this.user.userid, event.userid, event.userid, this.user.userid]);
					if(!relationship) return this.show_server_error(SERVER_ERRORS.BAD_ACTION, "Attempted to open a direct message with someone who is not friends with the current user.");
					
					if(this.currentGroup.special !== "direct")
						await this.join_group("special:direct");
					if(relationship.programid)
						await this.join_program(relationship.programid);
					else {
						let programid = uuid();
						
						await this.db.run("INSERT INTO programs (programid, type, is_dm, name, creation, modification) VALUES (?,?,?,?,?,?)", [programid, "text", 1, "", Date.now(), Date.now()]);
						await this.db.run("UPDATE friends SET programid = ? WHERE id = ?", [programid, relationship.id])
						
						await this.join_program(programid);
					}
				}
				break;
			case "status":
				{
					let status_validation = await Validation.validate_status(event.status);
					
					if(status_validation.type !== "success")
						return this.show_server_error(SERVER_ERRORS.BAD_ACTION, status_validation.message);
					
					await this.db.run("UPDATE users SET status = ? WHERE userid = ?", [event.status, this.user.userid]);
					GlobalState.refresh_user(this.user.userid);
				}
				break;
			case "show_profile":
				{
					let user = await this.db.get("SELECT username, userid, displayname, pfp, wallpaper, creation, bio, status FROM users WHERE userid = ?", event.userid);
					if(!user)
						return this.show_server_error(SERVER_ERRORS.BAD_ACTION, "Attempted to show the profile of a user that does not exist.");
					
					this.sync_group({
						groupid: "special:profile",
						special: "profile"
					});
					
					user.state = await GlobalState.user_state(user.userid);
					
					this.sync_program({
						type: "profile",
						title: user.username+"'s profile",
						user,
					}, () => {});
					
				}
				break;
			case "reorder_group":
				{
					if(typeof event.position !== "number")
						return this.show_server_error(SERVER_ERRORS.BAD_ACTION, "Attempted to reorder group with non-numeric position value");
					
					await Reorder.reorder_group(this.db, this.user.userid, event.groupid, event.position);
					
					await this.refresh_groups();
				}
				break;
			default:
				return this.show_server_error(SERVER_ERRORS.BAD_ACTION, "Unknown interaction type");
				break;
		}
	}
	
	constructor(db, socket, user = null) {
		this.db = db;
		this.socket = socket;
		this.user = user;
		
		this.permissions = new Permissions(this);
		
		this.special_programs = null;
		this.special_program_handler = null;
		this.friends = [];
		
		if(this.user && this.user.userid) {
			GlobalState.add_session(this);
			GlobalState.refresh_user(this.user.userid);
		}
		socket.on("group-open", async (id) => {
			await this.join_group(id);
		})
		socket.on("general-interaction", (event) => {
			this.general_interaction(event);
		});
		
		socket.on("disconnect", () => {
			if(this.user && this.user.userid) {
				GlobalState.remove_session(this);
				GlobalState.refresh_user(this.user.userid);
			}
		});
		
		(async () => {
			await this.refresh_groups();
			await this.refresh_friends();
			await this.refresh_notifications();
			if(user == null)
				await this.join_group("special:registration");
			else
				await this.join_group("special:direct");
		})();
	}
}


module.exports = StatedSession;
