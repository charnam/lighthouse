
import User from "../ui/users.js";
import MembersSidebar from "../ui/membersSidebar.js";
import ContextMenu from "../ui/contextmenu.js";

function TextProgram(session) {
	let container = doc.el("#current-program-container");
	
	let text_container = container
		.crel("div").addc("messages-screen")
	
	let lastMessageDate = null;
	
	let lastMessageTime = null;
	let lastMessageUser = null;
	
	text_container
			.crel("div").addc("messages").prnt()
			.crel("div").addc("message-box")
				.crel("upload-extra")
					
				.prnt()
				.crel("textarea")
					.attr("rows", "1")
					.attr("placeholder", "Send a message...")
					.on("input", function(event) {
						
						const target = event.target;
						target.style.height = "";
						target.style.height = Math.min(target.scrollHeight, 400) + "px";
						
					})
					.on("keydown", function(event) {
						if(event.key == "Enter" && !event.shiftKey) {
							session.program_interact({type: "send-message", text: event.target.value});
							event.target.value = "";
							event.target.style.height = "";
							event.preventDefault();
						}
						//drafts[program.id] = event.target.value; TODO: drafts
					})
				.prnt()
			.anim({
				opacity: [0, 1],
				translateY: [10, 0],
				duration: 200,
				easing: "ease-out"
			})
	
	function addMessage(event, isLast = null) {
		let messages = text_container.el(".messages");
		let willScroll = false;
		if(isLast == true || (isLast !== false && messages.scrollTop > messages.scrollHeight - messages.offsetHeight - 100))
			willScroll = true;
		
		let creationTime = new Date(event.creation);
		let creationDate = creationTime.toLocaleDateString()
		
		if(creationDate !== lastMessageDate)
			messages.crel("div").addc("message-date-marker").txt(creationDate).prnt();
		
		const message = messages
			.crel("div").addc("message")
				.addc(
					lastMessageUser !== event.sender.user.userid || lastMessageTime < creationTime-(60000*8)
						? "is-first" : "is-not-first"
				)
				.on("contextmenu", evt => {
					if(!evt.target.parentElement.classList.contains("user"))
						ContextMenu(evt, [
							{
								text: "Copy message",
								icon: "icons/copy.svg",
								action: (contextMenu) => {
									navigator.clipboard.writeText(event.content);
									contextMenu.close();
								}
							}
						])
				})
				.crel("div").addc("sender").append(User(event.sender.user, session)).prnt()
				.crel("div").addc("message-content")
					.crel("div").addc("message-time").txt(new Date(event.creation).toLocaleTimeString([], {hour12: false, hour: '2-digit', minute:'2-digit'})).prnt()
					.crel("div").addc("message-text").txt(event.content).prnt()
				.prnt()
		
		lastMessageDate = creationDate;
		lastMessageTime = creationTime;
		lastMessageUser = event.sender.user.userid;
		
		if(willScroll)
			messages.scrollTop = messages.scrollHeight;
		
		return message;
		
	}
	
	if(session.currentProgram.messageHistory) {
		let messageHistory = session.currentProgram.messageHistory;
		for(let i = 0; i < messageHistory.length; i++) {
			addMessage(messageHistory[i], i == messageHistory.length - 1);
		}
	}
	
	session.socket.on("program-output", function(event) {
		if(event.type == "message") {
			addMessage(event);
		}
	})
	
	if(session.currentGroup.members)
		MembersSidebar(session);
}

export default TextProgram;
