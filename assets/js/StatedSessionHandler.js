
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
			doc.els(':is(.group.open, .group.open-anim):not(#notifications-group)').forEach(groupButton => {
				groupButton.remc("open")
				groupButton.remc("open-anim");
			});
			
			let groupButton = doc.el(".group[groupid=\""+group.groupid+"\"]");
			
			if(groupButton) {
				groupButton.addc("open");
				groupButton.addc("open-anim");
			}
			
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
											},
											{
												text: "Leave...",
												icon: "icons/door-open-fill.svg",
												submenu: [
													{
														text: "Are you sure?"
													},
													{
														text: "Yes",
														action: context_menu => {
															context_menu.close();
															this.group_interact({type: "leave"});
														}
													}
												]
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
						
						group_sidebar.el(".group-title-container").html("").txt(this.currentGroup.groupname);
						
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
									.attr("unread", program.unread)
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
					let release_info_container = doc.el("#app-container").crel("div").addc("release-info");
					
					(async () => {
						let releaseInfo = await fetch("/js/variables/release.txt").then(res => res.text());
						release_info_container.html("").txt(releaseInfo);
					})();
					
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
	
	set_title(title) {
		document.title = title;
		doc.el("#titlebar-title").html("").txt(title);
	}
	
	sync_program(program) {
		this.socket.off("program-output");
		this.currentProgram = program;
		
		doc.els('.program.open').forEach(programButton => programButton.remc("open"));
		
		if(program == null) return this.set_title("...");
		
		doc.el("#current-program-container").html("")
		animations.programIn();
		
		let programButton = doc.el(".program[programid=\""+program.programid+"\"]");
		if(programButton)
			programButton.addc("open");
		
		if(program.title) {
			this.set_title(program.title);
		}
		
		doc.els(".responsive-sidebar-toggle").forEach(el => el.checked = false);
		
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
						error_container
							.crel("div").addc("error-subtitle")
								.txt("You tried to click something, but you weren't allowed to continue. Please create a bug report.")
							.prnt()
							.crel("div").addc("error-subtitle")
								.txt("Reason: ")
								.crel("i")
									.txt(program.message)
								.prnt()
							.prnt();
						break;
					default:
						error_container
							.crel("div").addc("error-subtitle")
								.txt("We're really not happy with you now. Do that again, and you're fired.")
							.prnt()
							.crel("div").addc("error-subtitle")
								.txt("The server didn't like that. Let's try something else.")
							.prnt()
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
			.crel("div").sid("titlebar-container")
				.crel("div").addc("responsive-sidebar-toggle-container")
					.crel("label")
						.crel("input").attr("type", "checkbox").sid("responsive-groups-sidebar-toggle").addc("responsive-sidebar-toggle")
						.prnt()
						.crel("img").addc("icon").attr("src", "/icons/list.svg").prnt()
					.prnt()
				.prnt()
				.crel("div").sid("titlebar-title").txt("Loading").prnt()
				.crel("div").addc("responsive-sidebar-toggle-container")
					.crel("label")
						.crel("input").attr("type", "checkbox").sid("responsive-members-sidebar-toggle").addc("responsive-sidebar-toggle")
						.prnt()
						.crel("img").addc("icon").attr("src", "/icons/people-fill.svg").prnt()
					.prnt()
				.prnt()
			.prnt()
			.crel("div").sid("app-container")
				.crel("div").sid("all-groups-container")
					.crel("div").sid("home-group-container")
						.crel("div").addc("group").sid("direct-group").attr("groupid", "special:direct")
							.on("click", () => {
								this.join_group("special:direct");
								doc.el("#direct-group .icon").anim({
									translateY: [0, -3, 0, 2, 0],
									scaleX: [1, 0.9, 0.8, 1.2, 1],
									duration: 400,
									easing: "ease-in-out"
								})
							})
							.crel("img").addc("icon").attr("src", "/icons/envelope-fill.svg").prnt()
						.prnt()
					.prnt()
					.crel("div").sid("groups-container")
					.prnt()
					.crel("div").sid("system-groups-container")
						.crel("div").addc("group").sid("notifications-group")
							.on("mousedown", () => {
								this.notifications.toggle_menu();
							})
							.crel("img").addc("icon").attr("src", "/icons/bell-fill.svg").prnt()
						.prnt()
						.crel("div").addc("group").sid("status-group")
							.on("mousedown", (event) => {
								event.preventDefault();
								doc.el("#status-group .icon").anim({
									translateY: [0, 3, -3, 0],
									scaleY: [1, 0.8, 1.2, 1],
									scaleX: [1, 1.2, 0.8, 1],
									duration: 400,
									easing: "ease-in-out"
								});
								doc.el("#status-group")
									.addc("open")
									.addc("open-anim");
								doc.el("#status-menu-container")
									.addc("visible");
							})
							.crel("img").addc("icon").attr("src", "/icons/chat-left-quote-fill.svg").prnt()
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
				.crel("div").addc("group-menu-container").sid("notifications-menu-container")
					.on("mousedown", (event) => {
						if(event.target.id == "notifications-menu-container") {
							this.notifications.close_menu();
							event.preventDefault();
						}
					})
					.crel("div").addc("group-menu").sid("notifications-menu")
					.prnt()
				.prnt()
				.crel("div").addc("group-menu-container").sid("status-menu-container")
					.on("mousedown", (event) => {
						if(event.target.id == "status-menu-container") {
							event.preventDefault();
							doc.el("#status-group").classList.remove("open");
							doc.el("#status-group").classList.remove("open-anim");
							doc.el("#status-menu-container").classList.remove("visible");
						}
					})
					.crel("div").addc("group-menu").sid("status-menu")
						.crel("input")
							.attr("type", "text")
							.attr("placeholder", "What's up?")
							.attr("maxlength", "256")
						.prnt()
						.crel("button")
							.txt("Update Status")
							.on("click", async () => {
								doc.el("#status-group").classList.remove("open");
								doc.el("#status-group").classList.remove("open-anim");
								doc.el("#status-menu-container").classList.remove("visible");
								
								doc.el("#status-group .icon").anim({
									scaleX: [1, 0.7, 1.2, 0.9, 1],
									scaleY: [1, 1.3, 0.8, 1.1, 1],
									duration: 350,
									easing: "ease-out"
								})
								
								this.general_interact({type: "status", status: doc.el("#status-menu input").value});
							})
						.prnt()
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
					.attr("position", group.position)
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
			
			if(group.unread)
				groupEl.addc("unread");
				
			if(this.currentGroup.groupid == group.groupid)
				groupEl.addc("open");
			
		})
		
		Reordering.make_reorderable({
			elements: doc.els("#groups-container > *"),
			callback: (el, new_pos) => {
				this.general_interact({
					type: "reorder_group",
					groupid: el.attr("groupid"),
					position: new_pos
				});
			}
		});
		
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
