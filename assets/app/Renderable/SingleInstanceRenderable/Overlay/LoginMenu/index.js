import { HTML } from "imperative-html";
import Overlay from "../index.js";

class LoginMenu extends Overlay {
	style = [...this.style, "app/Renderable/SingleInstanceRenderable/Overlay/LoginMenu/main.css"];
	
	constructor(client) {
		this.client = client;
	}
	
	render() {
		const target = super.render();
		target.classList.add("login-menu")
		
		target.append(
			new HTML.div({class: "login-menu-popup base-popup"},
				
			)
		)
		
		return target;
	}
	
	login() {
		
	}
	
}

export default LoginMenu;