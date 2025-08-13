
import User from "../ui/users.js";
import MembersSidebar from "../ui/membersSidebar.js";
import ContextMenu from "../ui/contextmenu.js";

function autoresize(event) {
	
	let target;
	
	if(event instanceof Element)
		target = event;
	else
		target = event.target;
	
	target.style.height = "";
	target.style.height = Math.min(target.scrollHeight, 400) + "px";
	
}

function TextProgram(session) {
	let container = doc.el("#current-program-container");
	
	let text_container = container
		.crel("div").addc("messages-screen")
	
	function editMessageDirection(direction) {
		if(direction !== "up" && direction !== "down") return false;
		
		let editingMessage = doc.el(".message:has(.message-editor)")
		
		if(!editingMessage) {
			if(direction == "down") {
				if(doc.el(".message-editor"))
					doc.el(".message-editor").remove();
				return mainInput.focus();
			}
			let allMessages = doc.els(".message");
			if(direction == "up") {
				let lastMessage = allMessages[allMessages.length - 1];
				editingMessage = lastMessage;
			}
		}
		
		while(editingMessage && (editingMessage.el(".message-editor") || editingMessage.attr("sender") !== session.user.userid)) {
			if(direction == "up")
				editingMessage = editingMessage.previousSibling;
			if(direction == "down")
				editingMessage = editingMessage.nextSibling;
		}
		
		if(doc.el(".message-editor"))
			doc.el(".message-editor").remove();
		
		if(!editingMessage) {
			return mainInput.focus();
		}
		
		editMessage(editingMessage, true);
	}
	
	text_container
			.crel("div").addc("messages")
				.crel("div").addc("load-wrapper")
				.prnt()
			.prnt()
			.crel("div").addc("message-box")
				.crel("upload-extra")
					
				.prnt()
				.crel("textarea")
					.attr("rows", "1")
					.attr("placeholder", "Send a message...")
					.on("input", autoresize)
					.on("keydown", function(event) {
						if(event.key == "Enter" && !event.shiftKey) {
							session.program_interact({type: "send-message", text: event.target.value});
							event.target.value = "";
							event.target.style.height = "";
							event.preventDefault();
						}
						if(event.key == "ArrowUp" && event.target.value == "") {
							event.preventDefault();
							editMessageDirection("up");
						}
					})
				.prnt()
			.anim({
				opacity: [0, 1],
				translateY: [10, 0],
				duration: 200,
				easing: "ease-out"
			})
	
	const messagesContainer = text_container.el(".messages")
	const mainInput = text_container.el(".message-box textarea");
	
	function editMessage(messageEl, startedByArrow) {
		
		if(doc.el(".message-editor"))
			doc.el(".message-editor").remove();
		
		let form = messageEl.el(".message-content")
			.crel("form").addc("message-editor")
		
		let input = form
			.crel("textarea")
				.attr("rows", "1")
				.on("input", autoresize)
				.on("keydown", event => {
					if(event.key == "Enter" && !event.shiftKey) { // save on enter
						event.preventDefault();
						if(input.value == input.defaultValue)
							form.remove();
						else
							save_edits();
						mainInput.focus();
					}
					if(event.key == "Escape") {
						event.preventDefault();
						if(messageEl.el(".buttons-container"))
							editMessage(messageEl, true);
						else {
							form.remove();
							mainInput.focus();
						}
					}
					if(event.key == "ArrowUp" && input.value == input.defaultValue && input.selectionStart == cursorStartPos && input.selectionEnd == cursorStartPos) {
						event.preventDefault();
						editMessageDirection("up");
					}
					if(event.key == "ArrowDown" && input.value == input.defaultValue && input.selectionStart == cursorStartPos && input.selectionEnd == cursorStartPos) {
						event.preventDefault();
						editMessageDirection("down");
					}
				});
		
		let save_edits = () => {
			session.socket.emit("program-interaction", {type: "edit-message", messageid: messageEl.attr("messageid"), content: input.value});
			form.remove();
		}
		
		input.value = input.defaultValue = messageEl.el(".message-text").innerText;
		let cursorStartPos = input.selectionStart = input.selectionEnd = input.value.length; // move cursor to the end of the edited message
		
		autoresize(input);
		
		function add_buttons() {
			form
				.crel("div").addc("buttons-container")
					.crel("button").addc("primary")
						.txt("Save")
					.prnt()
					.crel("button").addc("cancel")
						.attr("type", "button")
						.txt("Discard")
						.on("click", () => {
							form.remove();
						})
					.prnt();
		}
		
		input.on("input", function() {
			messageEl.scrollIntoView();
			if(!form.el(".buttons-container"))
				add_buttons();
		});
		
		if(!startedByArrow)
			add_buttons();
		
		form.on("submit", event => {
			event.preventDefault();
			save_edits();
		});
		
		input.focus();
		
		messageEl.scrollIntoView();
	}
	
	function fillOutContent(message, messageEl) {
		messageEl.el(".message-text").attr("edits", message.edits)
			.html("")
			.txt(message.content)
	}
	function addMessage(messages, message, lastMessageDetails) {
		
		let messageDetails = getMessageDetails(message);
		
		if(messageDetails.date !== lastMessageDetails.date)
			messages.crel("div").addc("message-date-marker").txt(messageDetails.date).prnt();
		
		const messageEl = messages
			.crel("div").addc("message").attr("sender", message.user.userid)
				.addc(
					lastMessageDetails.user !== messageDetails.user || lastMessageDetails.time < messageDetails.time-(60000*8)
						? "is-first" : "is-not-first"
				)
				.attr("messageid", message.messageid)
				.on("contextmenu", evt => {
					if(!evt.target.parentElement.classList.contains("user"))
						ContextMenu(evt, [
							{
								text: "Copy message",
								icon: "icons/copy.svg",
								action: (contextMenu) => {
									navigator.clipboard.writeText(message.content);
									contextMenu.close();
								}
							},
							message.user.userid !== session.user.userid ? null : {
								text: "Edit message",
								icon: "icons/pencil-fill.svg",
								action: contextMenu => {
									contextMenu.close();
									editMessage(messageEl);
								}
							}
						])
				})
				.crel("div").addc("sender").append(User(message.user, session)).prnt()
				.crel("div").addc("message-content")
					.crel("div").addc("message-time").txt(new Date(message.creation).toLocaleTimeString([], {hour12: false, hour: '2-digit', minute:'2-digit'})).prnt()
					.crel("div").addc("message-text").prnt()
				.prnt()
		
		if(!message.seenBy.includes(session.user.userid)) {
			readObserver.observe(messageEl);
		}
		
		fillOutContent(message, messageEl);
		
		
		return messageDetails;
	}
	function getMessageDetails(message) {
		let time = new Date(message.creation);
		let date = time.toLocaleDateString()
		let user = message.user.userid;
		return {time, date, user};
	}
	
	const wrapperObserver = new IntersectionObserver(entries => {
		for(let entry of entries) {
			if(entry.intersectionRatio <= 0) continue;
			if(!entry.target.classList.contains("load-wrapper") || entry.target.els("*").length > 0) {
				continue;
			}
			
			session.program_interact({type: "load-messages", offset: parseInt(entry.target.attr("offset"))});
		}
	});
	const readObserver = new IntersectionObserver(entries => {
		for(let entry of entries) {
			if(entry.intersectionRatio <= 0) continue;
			
			session.program_interact({type: "read-message", messageid: entry.target.attr("messageid")});
			readObserver.unobserve(entry.target);
		}
	})
	
	function loadMessages(parent, messages) {
		
		let lastMessageDetails = {time: null, date: null, user: null};
		if(messages.length >= 50) {
			lastMessageDetails = getMessageDetails(messages.shift());
			
			let offset = parseInt(parent.attr("offset"));
			if(!offset)
				offset = 0;
			offset+=messages.length;
			
			let wrapper;
			
			wrapper = parent.crelBefore("div").addc("load-wrapper").attr("offset", offset) // add new blank message loader before this one
			wrapperObserver.observe(wrapper);
			
			//wrapper = parent.crelBefore("div").addc("load-wrapper").attr("offset", offset)
			//wrapperObserver.observe(wrapper);
		}
		let initialScroll = messagesContainer.scrollTop;
		let initialParentRect = parent.getBoundingClientRect();
		
		for(let message of messages) {
			lastMessageDetails = addMessage(parent, message, lastMessageDetails);
		}
		
		let parentRect = parent.getBoundingClientRect();
		messagesContainer.scrollTop = initialScroll + parentRect.height - initialParentRect.height;
		/*text_container.els(".load-wrapper:not(:empty) + .load-wrapper + .load-wrapper:not(:empty)").forEach(wrapper => {
			wrapper.html("");
		})*/
		return lastMessageDetails;
	}
	
	let latestMessageDetails = null;
	if(session.currentProgram.messageHistory) {
		latestMessageDetails = loadMessages(doc.el(".load-wrapper:empty"), session.currentProgram.messageHistory);
	}
	
	messagesContainer.scrollTop = messagesContainer.scrollHeight;
	
	session.socket.on("program-output", function(event) {
		if(event.type == "message") {
			latestMessageDetails = addMessage(doc.el(".load-wrapper:last-child"), event, latestMessageDetails);
			
			let messages = messagesContainer;
			if(messages.scrollTop > messages.scrollHeight - messages.offsetHeight - 100 || message.user.userid == session.user.userid)
				messages.scrollTop = messages.scrollHeight;
		}
		if(event.type == "load") {
			loadMessages(doc.el(".load-wrapper[offset=\""+event.offset+"\"]"), event.messages);
		}
		if(event.type == "edit") {
			let messageEl = doc.el(".message[messageid='"+event.messageid+"']");
			if(messageEl)
				fillOutContent(event, messageEl);
		}
		if(event.type == "delete") {
			let messageEl = doc.el(".message[messageid='"+event.messageid+"']");
			if(messageEl)
				messageEl.remove();
		}
	})
	
	if(session.currentGroup.members)
		MembersSidebar(session);
}

export default TextProgram;
