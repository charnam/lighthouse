
function ContextMenu(event, options) {
	event.preventDefault();
	
	let contextMenuEl =
		doc.el("#app")
			.crel("div").addc("context-menu-overlay")
				.on("contextmenu", event => {
					contextMenu.close();
					event.preventDefault();
					return false;
				})
				.crel("div").addc("context-menu");
	
	let contextMenuOverlayEl = contextMenuEl.prnt();
	
	let contextMenu = {
		update: options => {
			addOptions(contextMenuEl, options, contextMenu);
		},
		close: function(){
			contextMenuOverlayEl.attr("style", "pointer-events: none;");
			contextMenuOverlayEl.anim({
				translateY: [0, 30],
				opacity: [1, 0],
				easing: "ease-in",
				duration: 100
			}).onfinish(function(){
				contextMenuOverlayEl.remove();
			});
		}
	};
	
	contextMenuOverlayEl.on('mousedown', function(evt){
		if(evt.target !== contextMenuOverlayEl) return;
		contextMenu.close();
		evt.preventDefault();
	});
	
	let addOptions = (contextMenuEl, options, submenu) => {
		contextMenuEl.html("");
		for(let _option of options) {
			// option changes as loop goes on. keep the current option in memory so that click events can use it
			let option = _option;
			if(!option) continue;
			
			let optionEl = contextMenuEl.crel("div").addc("context-menu-option");
			
			if(option.icon) optionEl.crel("img").attr("src", option.icon).addc("icon");
			
			optionEl.txt(option.text);
			if(option.action)
				optionEl.addc("has-action").on("mouseup", () => option.action(contextMenu, submenu));
			else
				optionEl.addc("disabled");
			if(option.submenu) {
				optionEl.remc("disabled").addc("has-submenu");
				optionEl.crel("img").addc("icon").addc("submenu-icon").attr("src", "/icons/caret-right-fill.svg");
				let submenuEl = optionEl.crel("div").addc("submenu");
				
				const submenuHelper = {
					update: options => {
						addOptions(submenuEl, options, submenuHelper);
					}
				};
				
				addOptions(submenuEl, option.submenu, submenuHelper);
			}
		}
	}
	contextMenu.update(options);
	
	let x = event.clientX;
	let y = event.clientY;
	
	contextMenuEl.attr("style", `--x: ${x}px; --y: ${y}px;`);
	
	for(let menu of [contextMenuEl, ...contextMenuEl.els(".submenu")]) {
		let boundingBox = menu.getBoundingClientRect();
		
		if(boundingBox.right > window.innerWidth) {
			menu.style.transform = menu.style.transform+` translateX(${(window.innerWidth - boundingBox.width - 5) - boundingBox.left}px)`;
		}
		if(boundingBox.bottom > window.innerHeight) {
			menu.style.transform = menu.style.transform+` translateY(${(window.innerHeight - boundingBox.height - 5) - boundingBox.top}px)`;
		}
	}
	
	return contextMenu;
}


export default ContextMenu;
