
import User from "../ui/users.js";

function ProfileView(session) {
	let programContainerEl = doc.el("#current-program-container").html("");
	
	const user = session.currentProgram.user;
	
	programContainerEl
		.crel("div")
			.addc("profile-page-container")
			.crel("div")
				.addc("profile-page")
				.append(User(user, session))
	
}

export default ProfileView;
