import { HTML } from "imperative-html";
import Overlay from "../index.js";
import BannerBox from "../../BannerBox/index.js";
import LoadingScreen from "../LoadingScreen/index.js";

class LoginMenu extends Overlay {
	style = this.autoStyleByImport(import.meta.url);
	animateRemoveDuration = 1000;
	banners = new BannerBox();
	
	mode = "login";
	
	constructor(client) {
		super();
		this.client = client;
	}
	
	render() {
		const target = super.render();
		target.classList.add("login-menu")
		
		let usernameField,
			passwordField,
			confirmPasswordField,
			modeSwitchButton,
			submitButton,
			form;
		
		target.append(
			form = new HTML.form({class: "login-menu-popup base-popup"},
				new HTML.h1(
					new HTML.span({class: "login-menu-mode-login"},
						"Log in"),
					new HTML.span({class: "login-menu-mode-signup"},
						"Sign up")
				),
				new HTML.label("Username",
					usernameField = new HTML.input({type: "text", name: "username", class: "base-input"}),
				),
				new HTML.label("Password",
					passwordField = new HTML.input({type: "password", name: "password", class: "base-input"}),
				),
				new HTML.label({class: "login-menu-mode-signup"},
					"Confirm Password",
					confirmPasswordField = new HTML.input({type: "password", name: "confirm-password", class: "base-input"}),
				),
				new HTML.div({class: "base-buttonbox base-buttonbox-right base-buttonbox-bottom"},
					modeSwitchButton = new HTML.button({type: "button", class: "base-button base-button-secondary"},
						new HTML.span({class: "login-menu-mode-login"},
							"Sign up..."
						),
						new HTML.span({class: "login-menu-mode-signup"},
							"Log in..."
						),
					),
					submitButton = new HTML.button({class: "base-button base-button-primary"},
						new HTML.span({class: "login-menu-mode-login"},
							"Log in"
						),
						new HTML.span({class: "login-menu-mode-signup"},
							"Sign up"
						),
					)
				),
				this.banners.render(),
			)
		);
		
		modeSwitchButton.addEventListener("click", async () => {
			if(this.mode == "signup")
				this.mode = "login";
			else if(this.mode == "login")
				this.mode = "signup"
			
			this.update();
		});
		
		form.addEventListener("submit", async event => {
			event.preventDefault();
			
			if(this.mode == "login") {
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
			} else if(this.mode == "signup") {
				
			}
		});
		
		this.update();
		return target;
	}
	
	updateRendered(target) {
		super.updateRendered(target);
		
		target.classList.remove("login-menu-mode-login");
		target.classList.remove("login-menu-mode-signup");
		
		if(this.mode == "login")
			target.classList.add("login-menu-mode-login");
		else if(this.mode == "signup")
			target.classList.add("login-menu-mode-signup");
	}
	
	static async login(client) {
		const menu = new LoginMenu(client);
		menu.open();
		await menu.untilRemove();
	}
	
}

export default LoginMenu;