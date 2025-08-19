
import User from "../ui/users.js";
import MembersSidebar from "../ui/membersSidebar.js";
import ContextMenu from "../ui/contextmenu.js";
import UploadFile from "../ui/upload.js";

const messageReceiveSound = new Audio();
messageReceiveSound.src = "/audio/message-receive.mp3";

const messageSendSound = new Audio();
messageSendSound.src = "/audio/message-send.mp3";


function getFormattedBytes(pBytes) {
    if(pBytes == 0) return '0 Bytes';
    if(pBytes == 1) return '1 Byte';

    var bytes = Math.abs(pBytes)
	
	var orderOfMagnitude = Math.pow(2, 10);
	var abbreviations = ['Bytes', 'KiB', 'MiB', 'GiB', 'TiB', 'PiB', 'EiB', 'ZiB', 'YiB'];
	
    var i = Math.floor(Math.log(bytes) / Math.log(orderOfMagnitude));
    var result = (bytes / Math.pow(orderOfMagnitude, i));

    // This will get the sign right
    if(pBytes < 0) {
        result *= -1;
    }

    // This bit here is purely for show. it drops the percision on numbers greater than 100 before the units.
    // it also always shows the full number of bytes if bytes is the unit.
    if(result >= 99.995 || i==0) {
        return result.toFixed(0) + ' ' + abbreviations[i];
    } else {
        return result.toFixed(2) + ' ' + abbreviations[i];
    }
}


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
		
	let typing_users = [];
	
	function editMessageDirection(direction) {
		if(direction !== "up" && direction !== "down") return false;
		
		let editingMessage = doc.el(".message:has(.message-editor)")
		
		if(!editingMessage) {
			if(direction == "down") {
				if(doc.el(".message-editor"))
					doc.el(".message-editor").remove();
				return main_input.focus();
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
			return main_input.focus();
		}
		
		editMessage(editingMessage, true);
	}
	
	let chat_scroll_container = text_container
		.crel("div").addc("chat-relative-container")
	
	let messages_container = chat_scroll_container
		.crel("div").addc("messages")
	
	let load_wrapper = messages_container
		.crel("div").addc("load-wrapper")
	
	let attachments_container = chat_scroll_container
		.crel("div").addc("attachments")
	
	let message_box = text_container
		.crel("div").addc("message-box")
	
	let upload_field = message_box
		.crel("label").addc("upload-extra")
			.crel("img").addc("icon").attr("src", "/icons/upload.svg").prnt()
			.crel("input").attr("type", "file").prnt();
	
	async function add_attachment(file) {
		
		let attachmentEl = attachments_container
			.crel("div").addc("attachment")
				.attr("type", file)
				.attr("in-progress", "")
				.crel("div").addc("icon").prnt()
				.crel("div").addc("filename")
					.txt("Uploading...")
				.prnt()
		
		let upload = await UploadFile({
			file,
			uploadType: "attachment",
			progress: (progress) => {
				attachmentEl.attr("style", `
					--progress: ${progress}%;
				`);
			}
		});
		
		
		if(upload.type == "success") {
			attachmentEl.removeAttribute("in-progress");
			attachmentEl.attr("upload-id", upload.uploadid);
			
			attachmentEl.attr("type", upload.mimetype);
			attachmentEl.el(".filename").html("").txt(upload.originalname);
			
			attachmentEl
				.crel("div").addc("delete-button")
					.crel("img").addc("icon").attr("src", "/icons/trash.svg").prnt()
					.on("click", () => attachmentEl.remove());
			
		} else if(upload.type == "banner") {
			attachmentEl.attr(upload.banner, upload.message);
			setTimeout(() => attachmentEl.remove(), 5000);
		}
	}
	
	upload_field.on("change", async (event) => {
		await add_attachment(event.target.files[0]);
	})
	
	let lastTypingIndicator = 0;
	let main_input = message_box
		.crel("textarea")
			.attr("rows", "1")
			.attr("placeholder", "Send a message...")
			.on("input", autoresize)
			.on("keypress", event => {
				if(lastTypingIndicator < Date.now()-3000) {
					lastTypingIndicator = Date.now();
					session.program_interact({type: "typing"});
				}
			})
			.on("keydown", function(event) {
				if(event.key == "Enter" && !event.shiftKey) {
					if(attachments_container.el(".attachment[in-progress]")) return false;
					
					
					let attachments = [...attachments_container.els(".attachment[upload-id]")];
					attachments = attachments.map(attachmentEl => {
						let upload = attachmentEl.attr("upload-id");
						attachmentEl.remove();
						return upload;
					});
					
					session.program_interact({type: "send-message", text: event.target.value, attachments});
					event.target.value = "";
					lastTypingIndicator = 0;
					event.target.style.height = "";
					event.preventDefault();
				}
				if(event.key == "ArrowUp" && event.target.value == "") {
					event.preventDefault();
					editMessageDirection("up");
				}
			})
	
	main_input.on("paste", async event => {
		if(!event.clipboardData.files) return;
		
		for(let file of event.clipboardData.files) {
			add_attachment(file);
		}
	})
	
	let typing_indicators = text_container
		.crel("div").addc("typing-indicators")
	
	function check_typing() {
		typing_indicators.html("");
		for(let userid in typing_users) {
			if(typing_users[userid].time < Date.now()-4900)
				delete typing_users[userid];
		}
		
		let users = Object.values(typing_users).map(event => event.user);
		
		if(users.length == 1) {
			typing_indicators
				.append(User(users[0], session))
				.txt(" is typing")
		}
		if(users.length == 2) {
			typing_indicators
				.append(User(users[0], session))
				.txt(" and ")
				.append(User(users[1], session))
				.txt(" are typing")
		}
		if(users.length == 3) {
			typing_indicators
				.append(User(users[0], session))
				.txt(", ")
				.append(User(users[1], session))
				.txt(", and ")
				.append(User(users[2], session))
				.txt(" are typing")
		}
		if(users.length > 3) {
			typing_indicators
				.txt(users.length+" people are typing")
		}
		
	}
	
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
						main_input.focus();
					}
					if(event.key == "Escape") {
						event.preventDefault();
						if(messageEl.el(".buttons-container"))
							editMessage(messageEl, true);
						else {
							form.remove();
							main_input.focus();
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
					if(
						evt.target.classList.contains("message-content") ||
						evt.target.classList.contains("message") ||
						evt.target.classList.contains("message-text") ||
						evt.target.classList.contains("attachments") ||
						evt.target.classList.contains("message-time"))
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
		
				
		if(message.attachments.length > 0) {
			let attachments_container = messageEl.crel("div").addc("attachments");
			for(let attachment of message.attachments) {
				let attachmentEl = attachments_container
					.crel("div").addc("attachment").attr("type", attachment.mimetype)
						.crel("div").addc("icon").prnt()
						.crel("a").addc("filename")
							.attr("target", "_blank")
							.attr("href", "/uploads/"+attachment.uploadid+"/"+attachment.originalname)
							.attr("download", attachment.originalname)
							.txt(attachment.originalname)
						.prnt()
						.crel("div").addc("filesize").txt(getFormattedBytes(attachment.size)).prnt();
				
				if(attachment.mimetype.startsWith('image/')) {
					attachmentEl.addc("image");
					
					attachmentEl
						.crel("img").addc("image")
							.attr("src", "/uploads/"+attachment.uploadid+"/"+attachment.originalname);
				}
				if(attachment.mimetype.startsWith('video/')) {
					attachmentEl.addc("image");
					
					attachmentEl
						.crel("video").addc("image")
							.attr("src", "/uploads/"+attachment.uploadid+"/"+attachment.originalname)
							.attr("controls", "");
				}
				if(attachment.mimetype.startsWith('audio/')) {
					attachmentEl.addc("audio");
					
					const button_icons = {
						play: "/icons/play-fill.svg",
						pause: "/icons/pause-fill.svg"
					}
					
					let audio = attachmentEl
						.crel("audio").addc("audio")
							.attr("src", "/uploads/"+attachment.uploadid);
					
					let playerEl = attachmentEl
						.crel("div").addc("player");
					
					let playPauseButtonEl =
						playerEl
							.crel("div").addc("pause-play-button")
								.crel("img").addc("icon")
									.attr("src", button_icons.play)
								.prnt()
					
					let playerTimeEl =
						playerEl
							.crel("div").addc("player-time")
								.txt("00:00")
								
					let playerRangeEl =
						playerEl
							.crel("input")
								.attr("type", "range")
								.attr("min", "0")
								.attr("max", "1")
								.attr("value", "0")
								.attr("step", "0.001")
					
					let playerDurationEl =
						playerEl
							.crel("div").addc("player-time")
								.txt("00:00")
							
					playPauseButtonEl.on("click", () => {
						if(audio.paused)
							audio.play();
						else
							audio.pause();
					});
					
					audio.on("playing", () => {
						playPauseButtonEl.el("img").attr("src", button_icons.pause);
					});
					audio.on("pause", () => {
						playPauseButtonEl.el("img").attr("src", button_icons.play);
					});
					
					function formatTime(seconds) {
						seconds = Math.round(seconds);
						
						let minutes = Math.floor(seconds / 60);
						seconds = seconds % 60;
						
						minutes = String(minutes).padStart(2, "0");
						seconds = String(seconds).padStart(2, "0");
						
						return minutes+":"+seconds;
					}
					
					playerRangeEl.on("input", () => {
						let newTime = audio.currentTime = playerRangeEl.value * audio.duration;
						playerTimeEl.html("").txt(formatTime(newTime));
					});
					
					audio.on("timeupdate", () => {
						playerRangeEl.value = audio.currentTime / audio.duration;
						playerTimeEl.html("").txt(formatTime(audio.currentTime));
					});
					
					audio.on("loadedmetadata", () => {
						playerDurationEl.html("").txt(formatTime(audio.duration));
					});
				}
			}
		}
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
			
			readObserver.unobserve(entry.target);
			const markAsRead = () => session.program_interact({type: "read-message", messageid: entry.target.attr("messageid")});
			if(document.hasFocus)
				markAsRead();
			else {
				let listener = () => {
					markAsRead();
					document.removeEventListener("focus", listener);
				}
				document.addEventListener("focus", listener);
			}
		}
	})
	
	function loadMessages(parent, messages) {
		
		parent.addc("loaded");
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
		let initialScroll = chat_scroll_container.scrollTop;
		//let initialParentRect = parent.getBoundingClientRect();
		
		for(let message of messages) {
			lastMessageDetails = addMessage(parent, message, lastMessageDetails);
		}
		
		//let parentRect = parent.getBoundingClientRect();
		chat_scroll_container.scrollTop = initialScroll; // + parentRect.height //- initialParentRect.height;
		/*text_container.els(".load-wrapper:not(:empty) + .load-wrapper + .load-wrapper:not(:empty)").forEach(wrapper => {
			wrapper.html("");
		})*/
		return lastMessageDetails;
	}
	
	let latestMessageDetails = null;
	if(session.currentProgram.messageHistory) {
		latestMessageDetails = loadMessages(load_wrapper, session.currentProgram.messageHistory);
	}
	chat_scroll_container.scrollTop = 0;
	
	session.socket.on("program-output", function(event) {
		if(event.type == "message") {
			latestMessageDetails = addMessage(doc.el(".load-wrapper:last-child"), event, latestMessageDetails);
			
			let messages = chat_scroll_container;
			if(messages.scrollTop > messages.scrollHeight - messages.offsetHeight - 100 || event.user.userid == session.user.userid)
				messages.scrollTop = 0;
			
			delete typing_users[event.user.userid];
			check_typing();
			
			let sound;
			if(event.user.userid == session.user.userid) {
				sound = messageSendSound.cloneNode(true);
			} else {
				sound = messageReceiveSound.cloneNode(true);
			}
			sound.play();
			sound.onended = () => sound.remove();
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
		if(event.type == "typing" && event.user.userid !== session.user.userid) {
			typing_users[event.user.userid] = event;
			check_typing();
			setTimeout(check_typing, 5000);
		}
	})
	
	if(session.currentGroup.members)
		MembersSidebar(session);
	
	message_box
		.anim({
			opacity: [0, 1],
			translateY: [10, 0],
			duration: 200,
			easing: "ease-out"
		})
}

export default TextProgram;
