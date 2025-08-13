
import Permissions from "./variables/permissions.js";

import NotificationHandler from "./ui/notifications.js";
import ContextMenu from "./ui/contextmenu.js";
import Reordering from "./ui/reordering.js";
import RolesManager from "./ui/roles.js";
import render_user from "./ui/users.js";

import wallpapers from "./ui/wallpapers.js";

import InfoProgram from "./programs/info.js";
import TextProgram from "./programs/text.js";

import FriendsProgram from "./programs/friends.js";
import InvitesProgram from "./programs/invites.js";
import ConfigMenuProgram from "./programs/configMenuProgram.js";
import ProfileView from "./programs/profile.js";
import animations from "./ui/animations.js";

class StatedSessionHandler {
	
	currentGroup = null
	currentProgram = null
	
	
	user = null
	groups = null
	
	sync_group(group) {
		this.socket.off("group-output");
		this.currentGroup = group;
		
		wallpapers.removeWallpapers();
		
		let current_group_container = doc.el("#current-group-container").html("");
		
		if(group !== null) {
			doc.els('.group.open:not(#notifications-group)').forEach(groupButton => groupButton.remc("open"));
			let groupButton = doc.el(".group[groupid=\""+group.groupid+"\"]");
			if(groupButton)
				groupButton.addc("open");
			
			switch(group.special) {
				case undefined:
					
					if(group.groupid == undefined) {
						return false;
					}
					
					let group_sidebar =
						current_group_container
							.crel("div").sid("group-programs-container").addc("sidebar")
								.on("contextmenu", event => {
									if(event.target.id == "group-programs-container") {
										ContextMenu(event, [
											~group.permissions & Permissions.EDIT_GROUP ? null : {
												text: "Add...",
												icon: "icons/plus.svg",
												submenu: [
													{
														text: "Separator",
														action: async context_menu => {
															context_menu.close();
															this.group_interact({type: "add_program", program_type: "separator"});
														}
													},
													{
														text: "Text",
														icon: "icons/hash.svg",
														action: async context_menu => {
															context_menu.close();
															this.group_interact({type: "add_program", program_type: "text"});
														}
													},
													{
														text: "Voice",
														icon: "icons/volume-up-fill.svg",
													},
													{
														text: "Info",
														icon: "icons/journal-bookmark-fill.svg",
														action: async context_menu => {
															context_menu.close();
															this.group_interact({type: "add_program", program_type: "info"});
														}
													},
													{
														text: "Bulletin",
														icon: "icons/pin-angle-fill.svg"
													},
												]
											},
											~group.permissions & Permissions.INVITE_OTHERS ? null : {
												text: "Invite...",
												icon: "icons/person-plus-fill.svg",
												submenu: this.friends.map(friend => ({
													text: friend.displayname,
													icon: friend.pfp ? "/uploads/"+friend.pfp : undefined,
													action: async (context_menu) => {
														context_menu.close();
														await this.group_interact({type: "send_invite", userid: friend.userid});
														/*await this.join_group("special:direct");
														this.program_interact({type: "open-dm", userid: friend.userid});
														await new Promise(res => this.socket.once("program-open", res));
														this.program_interact({type: "send-group-invite", groupid: group.groupid});*/
													}
												}))
											},
											~group.permissions & Permissions.EDIT_GROUP ? null : {
												text: "Edit Group",
												icon: "icons/gear-fill.svg",
												action: async context_menu => {
													context_menu.close();
													await animations.programOut();
													this.group_interact({type: "edit_group"});
												}
											},
											~group.permissions & Permissions.EDIT_ROLES ? null : {
												text: "Edit Roles",
												icon: "icons/tag-fill.svg",
												action: async context_menu => {
													context_menu.close();
													await animations.programOut();
													this.group_interact({type: "edit_roles"});
												}
											}
										])
									}
								})
								.crel("div").addc("group-title-container")
									.txt(group.groupname)
								.prnt()
								.crel("div").addc("group-programs-container")
								.prnt()
							.prnt()
					
					
					
					current_group_container
						.crel("div").sid("current-program-container");
					
					let lastWallpaper = null;
					
					const refresh_group = () => {
						
						let programs_container =
							group_sidebar.el(".group-programs-container").html("");
						
						if(lastWallpaper != this.currentGroup.wallpaper) {
							lastWallpaper = this.currentGroup.wallpaper;
							
							wallpapers.removeWallpapers();
							wallpapers.createWallpaper(this.currentGroup.wallpaper);
						}
						
						if(this.currentGroup.programs.length == 0) {
							programs_container.html("")
								.crel("div").addc("no-programs-notice")
									.txt("No content")
						} else {
							for(let program of this.currentGroup.programs) {
								
								let programEl = programs_container.crel("div")
									.addc("program")
									.attr("programid", program.programid)
									.attr("program-type", program.type)
									.attr("position", program.position)
									.txt(program.name)
									.on("click", () => {
										if(program.type !== "separator")
											this.join_program(program.programid);
									})
									.on("contextmenu", event => {
										ContextMenu(event, [
											~this.currentGroup.permissions & Permissions.EDIT_PROGRAM ? null : {
												text: "Edit",
												action: async context_menu => {
													context_menu.close();
													await animations.programOut();
													this.group_interact({
														type: "edit_program",
														programid: program.programid
													})
												}
											},
											/*{
												text: "Migrate to...",
												submenu: this.groups.map(group => ({
													text: group.groupname
												}))
											},*/
											~this.currentGroup.permissions & Permissions.DELETE_PROGRAMS ? null : {
												text: "Remove...",
												submenu: [
													{text: "Really?"},
													{text: "Yes", action: context_menu => {
														context_menu.close();
														this.group_interact({
															type: "remove_program",
															programid: program.programid
														});
													}}
												]
											},
										])
									})
								
								if(program.type == "separator")
									programEl.remc("program").addc("separator");
								
								if(this.currentProgram && this.currentProgram.programid == program.programid)
									programEl.addc("open");
								
								
							}
							
							if(group.permissions & Permissions.EDIT_GROUP)
								Reordering.make_reorderable({
									elements: doc.els(".group-programs-container > *"),
									callback: (el, new_pos) => {
										this.group_interact({
											type: "reorder_program",
											programid: el.attr("programid"),
											order: new_pos
										});
									}
								});
							
						}
					}
					
					refresh_group();
					this.socket.on("group-output", (output) => {
						if(output.type == "update") {
							this.currentGroup = output.group;
							refresh_group();
						}
					})
					
					break;
					
				case "registration":
					
					doc.el("#all-groups-container").attr("style", "display: none");
					
					current_group_container
						.crel("div").sid("current-program-container");
					
					break;
				case "direct":
					
					let friendsSidebar =
						current_group_container
							.crel("div").sid("group-programs-container").addc("sidebar")
					
					let specials =
						friendsSidebar
							.crel("div").sid("local-programs")
					
					specials
						.crel("div").addc("local-program")
							.crel("img").addc("icon").attr("src", "/icons/person-fill.svg").prnt()
							.crel("div").addc("local-program-name").txt("Friends").prnt()
							.on("click", async () => {
								await animations.programOut();
								this.group_interact({type: "friends_list"});
							})
						.prnt()
						.crel("div").addc("local-program")
							.crel("img").addc("icon").attr("src", "/icons/card-heading.svg").prnt()
							.crel("div").addc("local-program-name").txt("Invites").prnt()
							.on("click", async () => {
								await animations.programOut();
								this.group_interact({type: "invites"});
							})
						.prnt()
					
					let friendsList =
						friendsSidebar
							.crel("div").sid("sidebar-friends-list");
					
					let refreshFriends = () => {
						friendsList.html("");
						if(this.friends)
							for(let friend of this.friends) {
								friendsList
									.crel('div').addc("friend").addc("appear-clickable")
										.append(render_user(friend, this))
										.on("click", async () => {
											await animations.programOut();
											this.general_interact({type: "open-dm", userid: friend.userid});
										})
							}
					}
					
					refreshFriends();
					
					this.socket.on("friends", event => {
						refreshFriends();
					});
					
					
				default:
					
					current_group_container
						.crel("div").sid("current-program-container");
					
					break;
			}
			this.sync_program(null);
		}
		
		
		animations.groupIn();
		
	}
	
	sync_program(program) {
		this.socket.off("program-output");
		this.currentProgram = program;
		
		doc.els('.program.open').forEach(programButton => programButton.remc("open"));
		
		if(program == null) return document.title = "...";
		
		doc.el("#current-program-container").html("")
		animations.programIn();
		
		let programButton = doc.el(".program[programid=\""+program.programid+"\"]");
		if(programButton)
			programButton.addc("open");
		
		if(program.title) {
			document.title = program.title;
		}
		
		let membersSidebar = doc.el("#program-members-container");
		if(membersSidebar) membersSidebar.remove();
		
		switch(program.type) {
			case undefined:
				break;
			case "settings":
				ConfigMenuProgram(this);
				break;
			case "roles":
				new RolesManager(this);
				break;
			case "friends":
				FriendsProgram(this);
				break;
			case "invites":
				InvitesProgram(this);
				break;
			case "text":
				TextProgram(this);
				break;
			case "info":
				InfoProgram(this);
				break;
			case "profile":
				ProfileView(this);
				break;
			case "new":
				this.socket.on("program-output", (event) => {
					if(event.type == "set-config") {
						this.currentProgram.config = event.config;
						ConfigMenuProgram(this);
					}
				})
				break;
			case "server_error":
				let error_container =
					doc.el("#current-program-container")
						.crel("div").addc("error-page")
							.crel("div").addc("img")
								.crel("img").attr("src", "/icons/x-circle-fill.svg").addc("icon").prnt()
							.prnt()
							.crel("div").addc("error-title")
								.txt("Uh oh!")
							.prnt()
							
				switch(program.errorid) {
					case 2:
						error_container.crel("div").addc("error-subtitle")
							.txt("We're really not happy with you now. Do that again, and you're fired.")
						.prnt();
						error_container.crel("div").addc("error-subtitle")
							.txt("Reason: ")
							.crel("i")
								.txt(program.message)
							.prnt()
						.prnt();
						break;
					default:
						error_container.crel("div").addc("error-subtitle")
							.txt("The server didn't like that. Let's try something else.")
						break;
				}
				break;
			default:
				doc.el("#current-program-container")
					.crel("div").addc("error-page")
						.crel("div").addc("img")
							.crel("img").attr("src", "/icons/x-circle-fill.svg").addc("icon").prnt()
						.prnt()
						.crel("div").addc("error-title")
							.txt("What..?")
						.prnt()
						.crel("div").addc("error-subtitle")
							.txt("Looks like this feature isn't supported in your client yet. Maybe try reloading the page? (Unsupported program type: "+program.type+")")
						.prnt()
					.prnt()
				break;
		}
	}
	
	join_group(id) {
		return new Promise(async res => {
			
			await animations.groupOut();
			
			this.socket.emit("group-open", id);
			
			// all groups will automatically open a placeholder program
			this.socket.once("program-open", res);
			
		});
	}
	
	join_program(id) {
		return new Promise(async res => {
			
			await animations.programOut();
			
			this.group_interact({
				type: "open_program",
				programid: id
			})
			this.socket.once("program-open", res);
		});
	}
	
	program_interact(event) {
		this.socket.emit("program-interaction", event);
	}
	group_interact(event) {
		this.socket.emit("group-interaction", event);
	}
	general_interact(event) {
		this.socket.emit("general-interaction", event);
	}
	
	initialize_session() {
		
		this.user = null;
		
		
		doc.el("#app").html("")
			.crel("div").sid("app-container")
				.crel("div").sid("all-groups-container")
					.crel("div").sid("home-group-container")
						.crel("div").addc("group").sid("direct-group").attr("groupid", "special:direct")
							.on("click", () => {
								this.join_group("special:direct");
								doc.el("#direct-group .icon").anim({
									translateY: [0, -3, 2, 0],
									duration: 300,
									easing: "ease-in-out"
								})
							})
							.crel("img").addc("icon").attr("src", "/icons/envelope-fill.svg").prnt()
						.prnt()
					.prnt()
					.crel("div").sid("groups-container")
					.prnt()
					.crel("div").sid("system-groups-container")
						.crel("div").addc("group").sid("notifications-group").attr("groupid", "special:notifications")
							.on("mousedown", () => {
								this.notifications.toggle_menu();
							})
							.crel("img").addc("icon").attr("src", "/icons/bell-fill.svg").prnt()
						.prnt()
						.crel("div").addc("group").sid("settings-group").attr("groupid", "special:settings")
							.on("click", () => {
								doc.el("#settings-group .icon").anim({
									rotate: [0, 90],
									duration: 300,
									easing: "ease-out"
								})
								this.join_group("special:settings");
							})
							.crel("img").addc("icon").attr("src", "/icons/gear-fill.svg").prnt()
						.prnt()
					.prnt()
				.prnt()
				.crel("div").sid("current-group-container")
				.prnt()
				.crel("div").sid("notifications-menu-container")
					.on("mousedown", (event) => {
						if(event.target.id == "notifications-menu-container") {
							this.notifications.close_menu();
							event.preventDefault();
						}
					})
					.crel("div").sid("notifications-menu")
					.prnt()
				.prnt()
		
		animations.appIn();
		
		// sync_group and sync_program rely on DOM structure
		
		this.sync_group({});
		this.sync_program(null);
		
	}
	
	constructor(socket) {
		this.socket = socket;
		
		this.socket.on("connect", async () => {
			this.initialize_session();
		});
		
		this.socket.on("group-open", (group) => {
			this.sync_group(group);
		});
		this.socket.on("program-open", (program) => {
			this.sync_program(program);
		});
		
		this.socket.on("groups", (groups) => {
			this.refresh_groups(groups);
		});
		this.socket.on("friends", (friends) => {
			this.friends = friends;
		});
		
		this.socket.on("logged-in", async (info) => {
			
			if(info.user)
				this.user = info.user;
			
		});
		
		this.socket.on("log-in", (token) => {
			document.cookie = "do_not_send_your_token_to_anyone="+token+"; path=/";
			this.socket.disconnect();
			this.socket.connect();
		});
		
		this.socket.on("disconnect", () => {
			animations.appOut();
			doc.el("#app-container")
		});
		
		this.notifications = new NotificationHandler(this);
	}
	refresh_groups(groups) {
		
		this.groups = groups;
		
		doc.el("#groups-container").html("");
		
		groups.forEach(group => {
			
			let groupEl = doc.el("#groups-container")
				.crel("div").addc("group")
					.attr("groupid", group.groupid)
					.attr("style", `
						--image: url("/uploads/${group.icon}")
					`)
					.on("click", () => {
						this.join_group(group.groupid);
					})
					.on("contextmenu", function(evt){
						evt.preventDefault();
						ContextMenu(evt, [
							{
								text: group.groupname
							}
						]);
					})
					.crel("img").addc("icon").attr("src", "/icons/people-fill.svg").prnt()
			
			if(this.currentGroup.groupid == group.groupid)
				groupEl.addc("open");
			
		})
		doc.el("#groups-container")
			.crel("div").addc("group").addc("add-group")
				.attr("groupid", "special:new")
				.on("click", () => {
					doc.el(".add-group .icon").anim({
						scale: [1, 0.7, 1.1, 1],
						translateY: [0, 1, -1, 0],
						//rotate: [0, -15, 45, 90],
						duration: 300,
						easing: "ease-in-out"
					})
					this.join_group("special:new");
				})
				.crel("img").addc("icon").attr("src", "/icons/plus.svg").prnt()
				
	}
	
}

export default StatedSessionHandler;
