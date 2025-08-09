


class NotificationHandler {
	
	notification_count = 0
	
	receive_notification_animation() {
		
		let ball = this.button.crel("div").addc("notification-ball");
		
		ball.anim({
			translateX: [-30, 0],
			opacity: [0, 1],
			scaleX: [1, 1.5],
			easing: "linear",
			duration: 90
		}).onfinish(() => {
			ball.remove();
			this.button.anim({
				translateX: [0, 5],
				opacity: [0, 1],
				brightness: [10, 1],
				easing: "ease-out",
				duration: 100
			}).onfinish(() =>
				this.button.anim({
					translateX: [5, 0],
					easing: "ease-in-out",
					duration: 300
				})
			);
			
			this.button.el(".icon").anim({
				rotate: [-10, 10, -10, 0],
				opacity: [0.5, 0.75, 0.9, 1],
				easing: "ease-out",
				duration: 500
			})
			this.button.attr("notification-count", ++this.notification_count);
		});
	}
	
	constructor(session) {
		this.session = session;
		this.button = doc.el("#notifications-group")
		if(session.notifications) {
			this.button.attr("notification-count", session.notifications.length);
			//for(let notification of session.notifications) {
				//this.receive_notification_animation();
			//}
		}
		
	}
}

export default NotificationHandler;
