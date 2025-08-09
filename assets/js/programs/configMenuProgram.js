import configMenu from "../ui/config.js";

function ConfigMenuProgram(session) {
	let menu = configMenu(doc.el("#current-program-container"), session.currentProgram.config, (fields, special) => {
		session.socket.emit("program-interaction", {
			type: "submit",
			fields,
			special
		});
		return new Promise(res => {
			session.socket.once("program-output", (event) => {
				if(event.type == "success") {
					menu.hide();
				}
				res(event);
			})
		})
	}, session);
}

export default ConfigMenuProgram;
