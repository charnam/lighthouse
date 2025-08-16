import animations from "./animations.js";

class NotificationHandler {
	
	play_sound() {
		const aud = new Audio();
		aud.src = "/audio/notify.mp3";
		aud.play();
		aud.onended = () => aud.remove();
	}
	
	receive_notification_animation(new_count) {
		
		
		this.play_sound();
		let button = doc.el("#notifications-group");
		let ball = button.crel("div").addc("notification-ball");
		
		ball.anim({
			translateX: [-30, 0],
			opacity: [0, 1],
			scaleX: [1, 1.5],
			easing: "linear",
			duration: 80
		}).onfinish(() => {
			ball.remove();
			button.anim({
				translateX: [0, 5],
				easing: "ease-out",
				duration: 100
			}).onfinish(() =>
				button.anim({
					translateX: [5, 0],
					easing: "ease-in-out",
					duration: 300
				})
			);
			
			button.el(".icon").anim({
				rotate: [-10, 10, -10, 0],
				opacity: [0.5, 0.75, 0.9, 1],
				easing: "ease-out",
				duration: 500
			})
			button.attr("notification-count", new_count);
		});
	}
	open_menu() {
		doc.el("#notifications-group").classList.add("open");
		doc.el("#notifications-group").classList.add("open-anim");
		doc.el("#notifications-menu-container").classList.add("visible");
	}
	close_menu() {
		doc.el("#notifications-group").classList.remove("open");
		doc.el("#notifications-group").classList.remove("open-anim");
		doc.el("#notifications-menu-container").classList.remove("visible");
	}
	
	toggle_menu() {
		
		doc.el("#notifications-group .icon").anim({
			rotate: [0, -30, 0, 30, 0, -20, 0],
			duration: 500,
			easing: "ease-out"
		})
		if(doc.el("#notifications-group.open"))
			this.close_menu();
		else
			this.open_menu();
		
	}
	
	constructor(session) {
		this.session = session;
		this.notifications = [];
		
		session.socket.on("notifications", (notifications) => {
			if(this.notifications.length < notifications.length)
				this.receive_notification_animation(notifications.length);
			else
				doc.el("#notifications-group")
					.attr("notification-count", notifications.length);
			
			this.notifications = notifications;
			
			let notifications_menu = doc.el("#notifications-menu").html("");
			
			for(let notification of notifications) {
				let notificationEl = notifications_menu
					.crel("div")
						.addc("notification")
				
				switch(notification.type) {
					case "message":
						notificationEl
							.addc("message-notification")
							.txt("You have a new message from "+notification.message.user.username);
						break;
					case "messages":
						notificationEl
							.addc("message-notification")
							.txt(notification.count+" unread direct message"+(notification.count > 1 ? "s" : "")+" from ")
							.crel("b")
								.txt(notification.username)
							.prnt()
							.on("mouseup", async () => {
								this.close_menu();
								if(this.session.currentGroup.special == "direct")
									await animations.programOut();
								else
									await animations.groupOut();
								this.session.general_interact({type: "open-dm", userid: notification.userid})
							})
						break;
					case "friend_requests":
						notificationEl
							.addc("message-notification")
							.txt(notification.count+" unaccepted friend request"+(notification.count > 1 ? "s" : ""))
							.on("mouseup", async () => {
								this.close_menu();
								this.session.join_group("special:direct");
							})
						break;
					case "invites":
						notificationEl
							.addc("message-notification")
							.txt(notification.count+" unaccepted invite"+(notification.count > 1 ? "s" : ""))
							.on("mouseup", async () => {
								this.close_menu();
								if(this.session.currentGroup.special !== "direct")
									await this.session.join_group("special:direct");
								else
									await animations.programOut();
								await this.session.group_interact({type: "invites"});
							})
						break;
				}
			}
				
		})
	}
}

export default NotificationHandler;
