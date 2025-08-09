
import render_user from "../ui/users.js";

function MembersSidebar(session) {
	
	let members_container =
		doc.el("#current-group-container")
			.crel("div")
				.addc("sidebar").sid("program-members-container")
					.crel("div").addc("state").addc("program-state").txt("Here").prnt()
					.crel("div").addc("state").addc("group-state").txt("Group").prnt()
					.crel("div").addc("state").addc("online-state").txt("Elsewhere").prnt()
					.crel("div").addc("state").addc("offline-state").txt("Offline").prnt()
					.crel("div").addc("members-container")
	
	doc.el("#program-members-container")
		.anim({
			opacity: [0, 1],
			translateY: [-10, 0],
			duration: 250,
			easing: "ease-out"
		});
	
	session.socket.on("program-output", (output) => {
		if(output.type == "members") {
			members_container.html("");
			for(let member of output.members) {
				members_container
					.append(render_user(member, session))
			}
		}
	});
}

export default MembersSidebar;

