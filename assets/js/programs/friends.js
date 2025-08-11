
import animations from "../ui/animations.js";
import Banner from "../ui/banners.js";
import User from "../ui/users.js";

function FriendsView(session) {
	const container = doc.el("#current-program-container");
	
	const friend_request_form = container
		.crel("form").addc("friend-request-form")
			.crel("input").attr("type", "text").attr("name", "friendname").attr("placeholder", "Send a friend request?").prnt()
			.crel("input").attr("type", "submit").attr("value", "Send Request").prnt()
			.on("submit", function(event) {
				event.preventDefault();
				session.program_interact({
					type: "request",
					username: new FormData(friend_request_form).get("friendname")
				});
				friend_request_form.reset();
			});
	
	friend_request_form.els("*").anim({
		duration: 300,
		delayBetween: 30,
		easing: "ease-out",
		translateY: [-10, 0],
		opacity: [0, 1]
	});
	
	let bannersEl = container
		.crel("div").addc("banners")
	
	session.socket.on("program-output", function(event) {
		if(event.type == "banner") {
			let banner = new Banner(bannersEl, event);
		}
	})
	const friend_requests = container
		.crel("div").addc("friend-requests")
	if(session.currentProgram.requests.length > 0) {
		
		friend_requests
			.crel("div").addc("discrete-header").txt("Friend Requests").prnt()
		
	}
	
	session.currentProgram.requests.forEach(
		request => friend_requests
			.crel("div").addc("friend").addc("friend-request")
				.append(User(request, session))
				.crel("div").addc("friend-action")
					.crel("img").addc("icon").attr("src", "/icons/x.svg").prnt()
					.on('click', () => session.program_interact({
						type: "reject-request",
						userid: request.userid
					}))
				.prnt()
				.crel("div").addc("friend-action")
					.crel("img").addc("icon").attr("src", "/icons/check.svg").prnt()
					.on('click', () => session.program_interact({
						type: "accept-request",
						userid: request.userid
					}))
				.prnt()
	)
	
	const friends_list = container
		.crel("div").addc("friends-list")
			.crel("div").addc("discrete-header").txt("Friends").prnt()
	
	session.currentProgram.friends.forEach(friend => {
		
		friends_list.crel("div").addc("friend").addc("appear-clickable")
			.on("click", async () => {
				
				await animations.programOut();
				
				session.general_interact({
					type: "open-dm",
					userid: friend.userid
				})
				
			})
			.append(User(friend, session));
		
	})
	friends_list.els(".friend").anim({
		translateX: [-10, 0],
		opacity: [0, 1],
		duration: 100,
		delayBetween: 30,
		easing: "ease-out"
	});
	
}

export default FriendsView;
