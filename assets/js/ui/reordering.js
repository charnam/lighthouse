
class Reordering {
	static make_reorderable(obj) {
		if(!obj.elements) throw new Error("elements is a required field")
		if(!obj.callback) throw new Error("callback is a required field")
		
		let dragging = null;
		
		obj.elements.forEach(element => {
			element
				.attr("draggable", "true")
				.on("dragstart", event => {
					dragging = element;
					event.target.addc("dragging");
				})
				.on("dragend", event => {
					dragging = null;
					event.target.remc("dragging");
				})
				.on("dragover", event => {
					if(!dragging) return;
					event.preventDefault();
					event.target.addc("dropping-on");
				})
				.on("dragleave", event => {
					event.target.remc("dropping-on");
				})
				.on("drop", event => {
					event.target.remc("dropping-on");
					if(!dragging) return;
					if(dragging.attr("position")) {
						event.preventDefault();
						let new_position = Number(event.target.attr("position"));
						if(dragging.attr("position") < new_position)
							new_position++;
						
						obj.callback(dragging, new_position);
						dragging = null;
					}
				})
		});
	}
}
export default Reordering;
