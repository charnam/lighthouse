
import Permissions from "../variables/permissions.js";
import ContextMenu from "./contextmenu.js";
import animations from "./animations.js";

function render_user(rendered_user, session = false) {
	
	let member = null;
	if(rendered_user.roles) {
		member = rendered_user;
	} else if(session && session.currentGroup.members) {
		let matchingMembers = session.currentGroup.members.filter(member => member.userid == rendered_user.userid);
		if(matchingMembers.length > 0)
			member = matchingMembers[0];
	}
	
	let user =
		document.createElement("div").addc("user")
	
	let pfpEl =
		user
			.crel("div").addc("user-pfp").attr("style", "--image: url('/uploads/"+rendered_user.pfp+"');")
	
	let usernameEl =
		user
			.crel("div").addc("user-name").txt(rendered_user.displayname)
	
	if(rendered_user.username && rendered_user.username !== rendered_user.displayname)
		usernameEl
			.crel("div")
				.addc("user-tag")
				.txt(rendered_user.username);
	
	let roleIconsEl =
		usernameEl
			.crel("div").addc("role-icons");
	
	if(member) {
		if(member.roles)
			for(let role of member.roles) {
				if(role.icon != null && role.icon != "")
					roleIconsEl.crel("img")
						.attr("src", `/uploads/${role.icon}`)
						.attr("title", role.name);
			}
		
		if(member.state) {
			user.attr("state", member.state);
		}
	}
	
	
	user
		.on("contextmenu", (event) => {
			// if session is false, don't override contextmenu
			if(session !== false) {
				let relationshipButton = null;
				if(rendered_user.userid == session.user.userid)
					relationshipButton =
						{
							text: "Edit profile",
							icon: "icons/person-fill-gear.svg",
							action: async (contextMenu) => {
								contextMenu.close();
								session.join_group("special:settings");
							}
						}
				else if(session.friends.filter(friend => friend.userid === rendered_user.userid).length > 0)
					relationshipButton =
						{
							text: "Unfriend",
							icon: "icons/person-dash-fill.svg",
							action: (contextMenu) => {
								contextMenu.close();
								session.general_interact({type: "unfriend", userid: rendered_user.userid});
							}
						};
				else
					relationshipButton =
						{
							text: "Friend request",
							icon: "icons/person-plus-fill.svg"
						};
				
				let addRoleSubmenu = null;
				if(
					member &&
					session.currentGroup &&
					session.currentGroup.permissions & Permissions.EDIT_ROLES
				) {
					const makeSubmenu = () => {
						member = session.currentGroup.members.filter(member => member.userid == rendered_user.userid)[0];
						if(!member) {
							return [];
						}
						
						return session.currentGroup.roles.map(role => ({
							text: role.name,
							icon:
								member.roles.filter(member_role => member_role.roleid == role.roleid).length > 0
									? "/icons/check.svg" : null,
							action: (context_menu, submenu) => {
								session.group_interact({
									type: "toggle_role",
									roleid: role.roleid,
									userid: rendered_user.userid
								});
								session.socket.once("group-output", () => 
									submenu.update(makeSubmenu())
								);
							}
						}))	
					}
					addRoleSubmenu = {
						text: "Roles...",
						icon: "/icons/tag-fill.svg",
						submenu: makeSubmenu()
					}
				}
				ContextMenu(event, [
					{
						text: "View profile",
						action: async (contextMenu) => {
							contextMenu.close();
							await animations.groupOut();
							await session.general_interact({type: "show_profile", userid: rendered_user.userid});
						}
					},
					relationshipButton,
					addRoleSubmenu
				])
			}
		})
	
	return user;
}

export default render_user;

