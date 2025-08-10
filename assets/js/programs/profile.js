
import User from "../ui/users.js";
import wallpapers from "../ui/wallpapers.js";

function ProfileView(session) {
	let programContainerEl = doc.el("#current-program-container").html("");
	
	const user = session.currentProgram.user;
	
	wallpapers.createWallpaper(user.wallpaper);
	
	programContainerEl
		.crel("div")
			.addc("profile-page-container")
			.crel("div")
				.addc("profile-page")
				.append(User(user, session))
				.crel("div").addc("creationdate")
					.crel("img").addc("icon").attr("src", "/icons/cake.svg").prnt()
					.crel("span")
						.txt("Account created on ")
						.crel("b")
							.txt(new Date(user.creation).toLocaleString())
						.prnt()
					.prnt()
				.prnt()
				.crel("div").addc("bio")
					.txt(user.bio)
				.prnt()
	
}

export default ProfileView;
