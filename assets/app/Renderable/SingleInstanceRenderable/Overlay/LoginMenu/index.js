import { HTML } from "imperative-html";
import Overlay from "../index.js";
import BannerBox from "../../BannerBox/index.js";
import LoadingScreen from "../LoadingScreen/index.js";

class LoginMenu extends Overlay {
	style = [...this.style, "app/Renderable/SingleInstanceRenderable/Overlay/LoginMenu/main.css"];
	animateRemoveDuration = 1000;
	banners = new BannerBox();
	
	constructor(client) {
		super();
		this.client = client;
	}
	
	render() {
		const target = super.render();
		target.classList.add("login-menu")
		
		let usernameField,
			passwordField,
			signUpButton,
			logInButton,
			form;
		
		target.append(
			form = new HTML.form({class: "login-menu-popup base-popup"},
				new HTML.h1("Log in"),
				new HTML.label("Username",
					usernameField = new HTML.input({type: "text", name: "username", class: "base-input"}),
				),
				new HTML.label("Password",
					passwordField = new HTML.input({type: "password", name: "password", class: "base-input"}),
				),
				new HTML.div({class: "base-buttonbox base-buttonbox-right base-buttonbox-bottom"},
					signUpButton = new HTML.button({type: "button", class: "base-button base-button-secondary"},
						"Sign up..."
					),
					logInButton = new HTML.button({class: "base-button base-button-primary"},
						"Log in"
					)
				),
				this.banners.render(),
			)
		);
		
		signUpButton.addEventListener("click", async () => {
			
		});
		console.log(this);
		
		form.addEventListener("submit", async event => {
			event.preventDefault();
			
			const loader = new LoadingScreen();
			loader.open();
			const response = await this.client.connection.request("log-in", {
				username: usernameField.value,
				password: passwordField.value
			});
			
			if(this.banners.detect(response)) {
				loader.remove();
				return;
			}
			
			loader.remove();
			this.remove();
			
			localStorage.setItem("DO_NOT_SHARE_THIS_TOKEN_WITH_ANYONE_INCLUDING_ADMINS", response.data);
			this.client.connection.request("token", response.data);
		});
		
		this.update();
		return target;
	}
	
	updateRendered(target) {
		super.updateRendered(target);
	}
	
	static async login(client) {
		const menu = new LoginMenu(client);
		menu.open();
		await menu.untilRemove();
	}
	
}

export default LoginMenu;