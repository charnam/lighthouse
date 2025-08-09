
class NotificationHandler {
	
	notification_count = 0
	
	receive_notification_animation() {
		
		let ball = doc.el("#notifications-group").crel("div").addc("notification-ball");
		let button = doc.el("#notifications-group");
		
		ball.anim({
			translateX: [-30, 0],
			opacity: [0, 1],
			scaleX: [1, 1.5],
			easing: "linear",
			duration: 90
		}).onfinish(() => {
			ball.remove();
			button.anim({
				translateX: [0, 5],
				opacity: [0, 1],
				brightness: [10, 1],
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
			button.attr("notification-count", ++this.notification_count);
		});
	}
	
	constructor(session) {
		this.session = session;
		// get notification count
	}
}

export default NotificationHandler;
