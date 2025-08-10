function createWallpaper(image) {
	doc.el("#app-container")
		.crel("img").addc("wallpaper")
			.attr("src", `/uploads/${image}`)
			.attr("style", "opacity: 0;")
			.on("load", event =>
				event.target.anim({
					opacity: [0, 0.25],
					duration: 200,
					easing: "linear"
				})
			)
}
function removeWallpapers() {
	doc.els(".wallpaper").forEach(wallpaper =>
		wallpaper.anim({
			opacity: [0.25, 0],
			duration: 200
		}).onfinish(() => wallpaper.remove())
	);
}

export default {
	createWallpaper,
	removeWallpapers
}