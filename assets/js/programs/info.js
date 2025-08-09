
import MembersSidebar from "../ui/membersSidebar.js";

function InfoProgram(session) {
	let container = doc.el("#current-program-container");
	
	let info_container = container
		.crel("div").addc("info-screen")
	
	info_container.txt(session.currentProgram.info_content);
	
	MembersSidebar(session);
}

export default InfoProgram;
