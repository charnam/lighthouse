
import Reordering from "./reordering.js";
import configMenu from "./config.js";
import ContextMenu from "./contextmenu.js";
import Banner from "./banners.js";
import Permissions from "/js/variables/permissions.js";

const HUMAN_READABLE_PERMISSIONS =
	{
		"VIEW_PROGRAM": "View and open programs",
		"SEND_MESSAGES": "Send messages in Text programs",
		"EDIT_GROUP": "Edit this group's name, picture, and programs list",
		"EDIT_PROGRAM": "Edit programs in this group",
		"ADMIN": "Group Admin",
		"DELETE_PROGRAMS": "Delete programs from this group",
		"SEND_FILES": "Send files in Text programs",
		"EDIT_ROLES": "Edit roles (Warning: Privilege escalation possible!)",
		"EDIT_MESSAGES": "Edit sent messages",
		"DELETE_OWN_MESSAGES": "Delete messages",
		"DELETE_OTHER_MESSAGES": "Delete messages sent by others",
		"INVITE_OTHERS": "Invite other people"
	}

class RolesManager {
	permission_name(id) {
		if(HUMAN_READABLE_PERMISSIONS[id])
			return HUMAN_READABLE_PERMISSIONS[id];
		else
			return id;
	}
	
	update_roles_list() {
		this.roles_list.html("");
		let orderedRoles = Object.values(this.state.roles).sort((a,b) => a.position - b.position);
		for(let role of orderedRoles) {
			let roleEl =
				this.roles_list
					.crel("div").addc("role")
						.crel("div").addc("role-icon").prnt()
						.txt(role.name)
						.attr("roleid", role.roleid)
						.attr("position", role.position)
						.on("click", () => this.edit_role(role.roleid))
						.on("contextmenu", event => ContextMenu(event, [
							{
								text: "Remove",
								action: context_menu => {
									context_menu.close();
									this.session.program_interact({type: "remove_role", roleid: role.roleid});
								}
							}
						]))
			
			
			if(role.icon) {
				roleEl.el(".role-icon").crel("img").attr("src", `/uploads/${role.icon}`);
			} else {
				roleEl.el(".role-icon").remove();
			}
			

			if(this.editing_role == role.roleid)
				roleEl.addc("selected");
		}
		Reordering.make_reorderable({
			elements: this.roles_list.els(".role"),
			callback: (el, new_pos) => {
				let roleid = el.attr("roleid");
				
				// update conflicting positions
				let test_pos = new_pos;
				let last_bump = roleid;
				while(true) {
					let otherRoles =
						Object.values(this.state.roles)
							.filter(role => role.roleid !== last_bump && role.position == test_pos)
					
					if(otherRoles.length == 0) break;
					
					for(let role of otherRoles) {
						this.state.roles[role.roleid].position++;
						last_bump = role.roleid;
					}
					test_pos++;
				}
				
				this.state.roles[el.attr("roleid")].position = new_pos;
				this.update_roles_list();
				this.setChanged(true);
			}
		});
		let add_button =
			this.roles_list
				.crel("div").addc("add")
					.crel("img").addc("icon")
						.attr("src", "/icons/plus.svg")
					.prnt();
		add_button.on("click", () => this.session.program_interact({type: "add_role"}));
	}
	edit_role(roleid) {
		this.editing_role = roleid;
		let role = this.state.roles[roleid];
		this.settings_container.html("").attr("tab", "style");
		
		if(roleid == null)
			return;
		
		this.settings_container
			.crel("div").addc("role-tabs")
				.crel("div").addc("tab")
					.txt("Style")
					.attr("tab", "style")
					.on("click", () => this.settings_container.attr("tab", "style"))
				.prnt()
				.crel("div").addc("tab")
					.txt("Permissions")
					.attr("tab", "permissions")
					.on("click", () => this.settings_container.attr("tab", "permissions"))
				.prnt()
			.prnt()
		this.tabbed_ui =
			this.settings_container
				.crel("div").addc("roles-tabbed")
		
		let style_tab =
			this.tabbed_ui
				.crel("div")
					.addc("tab-content")
					.attr("tab", "style")
					.txt("Style Tab")
				
		let permissions_tab =
			this.tabbed_ui
				.crel("div")
					.addc("tab-content")
					.attr("tab", "permissions")
					.txt("Permissions Tab")
		
		configMenu(style_tab, {
			items: [
				{
					label: "Name",
					input: "text",
					name: "name"
				},
				{
					label: "Icon",
					input: "image",
					name: "icon",
					aspectRatio: [1, 1],
					uploadType: "roleicon"
				},
			],
			defaults: {
				name: role.name,
				icon: role.icon
			},
			autosave: true
		}, (fields, special) => {
			role.name = fields.name;
			role.icon = fields.icon;
			this.setChanged(true);
			this.update_roles_list();
		})
		
		let configItems = [];
		let currentPermissions = {};
		
		for(let permission in Permissions) {
			
			// privilege escalation is possible with the EDIT_ROLES permission, so it's best to hide it from potential victims of an attack.
			// for giving users the ability to edit roles, ADMIN should be used instead.
			// it's okay that the client is technically able to do this. potential "hackers" can have their fun!
			
			// see the TODO note in StatedSession - privilege escalation should be patched before this is re-enabled.
			if(permission == "EDIT_ROLES") continue;
			
			configItems.push({
				label: this.permission_name(permission),
				input: "threeway",
				name: permission
			});
			if(role.allow_permissions & Permissions[permission])
				currentPermissions[permission] = "yes";
			else if(role.deny_permissions & Permissions[permission])
				currentPermissions[permission] = "no";
			else
				currentPermissions[permission] = "default";
		}
		
		configMenu(permissions_tab, {
			items: configItems,
			defaults: currentPermissions,
			autosave: true
		}, (fields, special) => {
			role.allow_permissions = 0;
			role.deny_permissions = 0;
			for(let field in fields) {
				let value = fields[field];
				if(Permissions[field]) {
					if(value == "yes")
						role.allow_permissions = role.allow_permissions | Permissions[field];
					if(value == "no")
						role.deny_permissions = role.deny_permissions | Permissions[field];
				} else {
					
				}
			}
			this.setChanged(true);
			this.update_roles_list();
		})
		
		this.update_roles_list();
	}
	setChanged(changed) {
		if(changed) {
			this.roles_leftside.el(".apply-button").addc("visible");
		} else {
			this.roles_leftside.el(".apply-button").remc("visible");
		}
	}
	constructor(session) {
		this.session = session;
		this.state = session.currentProgram;
		
		let container =
			doc.el("#current-program-container")
				.crel("div").addc("roles-manager");
		
		this.banner_container = container.crel("div").addc("banners");
		
		this.roles_leftside =
			container
				.crel("div").addc("roles-leftside")
		
		this.roles_list =
			this.roles_leftside
				.crel("div").addc("roles-list");
		
		this.roles_leftside
			.crel("button").addc("primary")
				.addc("apply-button")
				.txt("Apply Changes")
				.on("click", () => {
					this.session.program_interact({
						type: "submit",
						data: this.state.roles
					});
					this.session.socket.once("program-output", event => {
						if(event.type == "banner")
							new Banner(this.banner_container, event);
						else
							this.setChanged(false);
					})
				});
		
		this.settings_container =
			container
				.crel("div")
					.addc("settings-container");
		
		this.update_roles_list();
		
		
		this.session.socket.on("program-output", event => {
			if(event.type == "add_role") {
				this.state.roles[event.role.roleid] = event.role;
				this.edit_role(event.role.roleid);
			}
			if(event.type == "remove_role") {
				delete this.state.roles[event.roleid];
				this.update_roles_list();
				if(this.editing_role == event.roleid) {
					this.edit_role(null);
				}
			}
		});
		
	}
}
export default RolesManager;
