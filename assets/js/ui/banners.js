
function Banner(container, event) {
	
	container.els(".banner").forEach(banner => banner.hide());
	
	let bannerEl = container.crel("div").addc("banner").addc(event.banner).txt(event.message);
	
	bannerEl.offsetHeight; // force reflow on banner to get its size
	
	bannerEl.anim({
		height: [0, bannerEl.getBoundingClientRect().height],
		opacity: [0, 1],
		blur: [10, 0],
		duration: 100,
		easing: "ease-in-out"
	})
	bannerEl.style.paddingTop = "0px";
	bannerEl.style.paddingBottom = "0px";
	bannerEl.hide = () => {
		bannerEl.style.paddingTop = "0px";
		bannerEl.style.borderTop = "0px";
		bannerEl.style.borderBottom = "0px";
		bannerEl.anim({
			height: [bannerEl.getBoundingClientRect().height, 0],
			opacity: [1, 0],
			blur: [0, 10],
			duration: 100,
			easing: "ease-in-out"
		}).onfinish(() => {
			bannerEl.remove()
		});
	};
	
	setTimeout(bannerEl.hide, 5000);
	return bannerEl;
}

export default Banner;

