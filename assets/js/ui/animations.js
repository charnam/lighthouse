function programIn() {
	doc.el("#current-program-container")
		.anim({
			opacity: [0, 1],
			translateY: [-10, 0],
			duration: 250,
			easing: "ease-out"
		})
}
function programOut() {
	return new Promise(cont => {
		if(doc.el("#current-program-container") || doc.el("#program-members-container")) {
			
			doc.els("#current-program-container, #program-members-container")
				.anim({
					opacity: [1, 0],
					translateY: [0, 10],
					duration: 100,
					easing: "ease-in"
				})
				.onfinish(cont)
			
		} else cont();
	});
}
function groupIn() {
	doc.el("#current-group-container")
		.anim({
			opacity: [0, 1],
			translateY: [-20, 0],
			duration: 100,
			easing: "ease-out"
		})
}
function groupOut() {
	 return new Promise(cont => {
		if(doc.el("#current-group-container > *")) {
			
			doc.els("#current-group-container > *")
				.anim({
					opacity: [1, 0],
					translateY: [0, 30],
					duration: 100,
					easing: "ease-in",
					delayBetween: 20
				})
				.onfinish(cont)
			
		} else cont();
	});
}
function appIn() {
	doc.el("#app-container")
		.anim({
			"brightness": [0.5, 1],
			"opacity": [0, 1],
			"duration": 200,
			"easing": "ease-in-out",
		})
}
function appOut() {
	doc.el("#app-container")
		.anim({
			duration: 1000,
			scale: [1, 0.8],
			opacity: [1, 0]
		})
}
export default {
	programIn,
	programOut,
	groupIn,
	groupOut,
	appIn,
	appOut
}