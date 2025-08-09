
import Banner from "../ui/banners.js";
import User from "../ui/users.js";

function InvitesView(session) {
	const container = doc.el("#current-program-container");
	
	let invites = session.currentProgram.invites;
	let invites_view =
		container
			.crel("div").addc("invites-view");
	
	for(let invite of invites) {
		console.log(invite);
		invites_view
			.crel("div").addc("invite-container")
				.crel("div").addc("invite")
					.crel("span")
						.crel("b")
							.txt(invite.from.displayname)
						.prnt()
						.txt(" has invited you to ")
						.crel("b")
							.txt(invite.group.groupname)
						.prnt()
					.prnt()
					.crel("div").addc("friend-action")
						.crel("img").addc("icon").attr("src", "/icons/x.svg").prnt()
						.on('click', () => session.program_interact({
							type: "reject",
							groupid: invite.group.groupid
						}))
					.prnt()
					.crel("div").addc("friend-action")
						.crel("img").addc("icon").attr("src", "/icons/check.svg").prnt()
						.on('click', () => session.program_interact({
							type: "accept",
							groupid: invite.group.groupid
						}))
					.prnt()
	}
}

export default InvitesView;
