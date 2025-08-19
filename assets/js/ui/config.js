
import Banner from "./banners.js";
import UploadFile from "./upload.js";
import animations from "./animations.js";

function quicklySerializeForm(formEl) {
	return new URLSearchParams(new FormData(formEl)).toString()
}

function configMenu(parent, config, action, session = null) {
	let programContainerEl = parent.html("");
	
	let configFormEl = programContainerEl.crel("form").addc("config-screen");
	let configOptionsEl = configFormEl.crel("div").addc("config-options");
	
	if(config.groupCreation) {
		configFormEl.addc("group-creation");
	}
	for(let configItem of config.items) {
		
		if(configItem == null)
			continue;
		
		let optionEl = configOptionsEl
			.crel("div").addc("config-option")
		
		let inputContainer = optionEl;
		
		// above item
		if(configItem.label != undefined) {
			inputContainer = optionEl.crel("label").addc("config-option-label")
				.crel("div").addc("config-option-label-text").txt(configItem.label).prnt();
		}
		
		if(configItem.title != undefined) {
			optionEl.crel("div").addc("config-option-title").txt(configItem.title);
		}
		
		// if this is a normal input, find proper input type and use it
		if(configItem.input != undefined) {
			let inputWrapper = inputContainer.crel("div").addc("config-option-input");
			optionEl.attr("type", configItem.input);
			if(!configItem.name) {
				throw new Error("Config option lacking required 'name' field.");
			}
			let input;
			switch(configItem.input) {
				case "toggle":
					input = inputWrapper.crel("input")
						.attr("type", "checkbox")
						.attr("name", configItem.name);
					
					if(config.defaults[configItem.name] != undefined)
						input.attr("checked", "true");
					
					break;
				case "radio":
					input = inputWrapper.crel("input")
						.attr("type", "radio")
						.attr("name", configItem.name);
					
					if(config.defaults[configItem.name] == configItem.value)
						input.attr("checked", "true");
					
					break;
				case "threeway":
					
					let threewaySwitch =
						inputWrapper
							.crel("div").addc("threeway")
					for(let i = 0; i < 3; i++) {
						let itemValues = ["yes", "default", "no"];
						let itemIcons = [
							"/icons/check.svg",
							"/icons/slash.svg",
							"/icons/x.svg",
						];
						let input =
							threewaySwitch
								.crel("input")
									.attr("type", "radio")
									.attr("name", configItem.name)
									.attr("value", itemValues[i])
									.crel("img")
										.addc("icon")
										.attr("src", itemIcons[i])
									.prnt()
						
						//threewaySwitch
						
						if(itemValues[i] == config.defaults[configItem.name])
							input.attr("checked", "true");
					}
					
					break;
				case "image":
					
					let fileInput =
						document.createElement("input")
							.attr("type", "file");
					
					let imageUploadStyle = `
							--aspect-ratio: ${configItem.aspectRatio[0]} / ${configItem.aspectRatio[1]};
							--image: url("/uploads/${config.defaults[configItem.name]}");
						`
					let imageUploadButton = inputWrapper
						.crel("div").addc("image-upload")
							.attr("style", imageUploadStyle)
							.attr("name", configItem.name)
							.attr("type", configItem.uploadType)
							.on("click", () => fileInput.click());
					
					let formInput = imageUploadButton
						.crel("input")
							.attr("type", "hidden")
							.attr("name", configItem.name)
							.attr("value", config.defaults[configItem.name] ?? "");
					
					fileInput.onchange = async (event) => {
						
						imageUploadButton.attr("in-progress", "yes");
						
						let image = URL.createObjectURL(event.target.files[0]);
						
						imageUploadStyle += `\n--image: url('${image}');`
						
						let upload = await UploadFile({
							file: event.target.files[0],
							uploadType: imageUploadButton.attr("type"),
							progress: (progress) => {
								imageUploadButton.attr("style", `
									${imageUploadStyle}
									--progress:${progress}%;
								`);
							}
						});
						
						imageUploadButton.removeAttribute("in-progress");
						if(upload.type !== "success") {
							return new Banner(bannersEl, upload);
						}
						formInput.value = upload.uploadid;
						checkChange();
					}
					
					break;
				case "textarea":
					input = inputWrapper.crel("textarea")
						.attr("name", configItem.name);
					
					if(config.defaults[configItem.name] != undefined)
						input.value = input.defaultValue = config.defaults[configItem.name];
					
					break;
				case "text":
				case "password":
					input = inputWrapper.crel("input")
						.attr("type", configItem.input)
						.attr("name", configItem.name);
					
					if(config.defaults[configItem.name] != undefined)
						input.attr("value", config.defaults[configItem.name]);
					
					break;
				default:
					throw new Error("Unknown input type: "+configItem.input);
			}
		}
		
		if(configItem.special) {
			switch(configItem.special) {
				case "friends-picker":
					let useCheckboxes = false;
					if(configItem.many) {
						useCheckboxes = true;
					}
					
					let friendsScrollerContainer = optionEl.crel("div").addc("friend-chooser");
					
					for(let friend of friends) {
						
						friendsScrollerContainer
							.crel("label").addc("friend")
								.crel("input").attr("type", useCheckboxes ? "checkbox" : "radio").attr("name", configItem.name).attr("value", friend.userid)
								.append(render_user(friend))
						
					}
					
					
					break;
				case "button-group":
					
					break;
				case "log-in-sign-up":
					{
						let btns = optionEl.crel("div").addc("new-group-navbtns");
						
						let mainButtonText;
						let secondaryButtonText;
						let secondaryButtonAction;
						
						if(configItem.current == "log-in") {
							mainButtonText = "Log in";
							secondaryButtonText = "Sign up instead";
							secondaryButtonAction = async () => {
								await formHelper.hide();
								session.program_interact({type: "signup"});
							}
						}
						if(configItem.current == "sign-up") {
							mainButtonText = "Sign up";
							secondaryButtonText = "Log in instead";
							secondaryButtonAction = async () => {
								await formHelper.hide();
								session.program_interact({type: "login"});
							}
						}
						
						btns.crel("input").attr("value", mainButtonText).attr("type", "submit");
						btns.crel("button").txt(secondaryButtonText).addc("back-btn").attr('type', "button").on('click', function(){
							secondaryButtonAction();
						});
					}
					break;
				case "newgroupsteps":
					let steps_container = optionEl.crel("div").addc("steps-container");
					let dots = steps_container
						.crel("div").addc("new-group-dots")
					
					for(let i = 0; i < configItem.steps; i++) {
						dots.crel("div").addc("new-group-dot")
							.crel("img").addc("icon").attr("src", configItem.step < i ? "/icons/circle.svg" : "/icons/circle-fill.svg").prnt()
					}
					
					let navbtns = steps_container.crel("div").addc("new-group-navbtns");
					if(configItem.step == 0)
						navbtns.addc("first-step");
					if(configItem.step == configItem.steps)
						navbtns.addc("last-step");
					
					navbtns.crel("button").addc("back-btn").txt("Back").attr('type', "button").on('click', function(){
						formHelper.submit({isBack: true});
					});
					navbtns.crel("input").attr("type", "submit").attr("value", "Next");
					break;
				case "logout":
					optionEl
						.crel("button").addc("logout-button")
							.txt("Log out")
							.attr('type', 'button')
							.on("click", function(evt){
								document.cookie = "do_not_send_your_token_to_anyone=;expires=Thu, 01 Jan 1970 00:00:00 GMT;path=/;";
								session.socket.disconnect();
								session.socket.connect();
							})
						.prnt();
			}
		}
		
		if(configItem.separator) {
			optionEl.crel("div").addc("config-option-separator");
		}
	}
	
	configFormEl.els(".config-option").anim({
		duration: 200,
		delayBetween: 30,
		easing: "ease-out",
		translateY: [10, 0],
		opacity: [0, 1]
	})
	
	let initialState = quicklySerializeForm(configFormEl);
	
	let saveButtonContainer =
		configFormEl.crel("div").addc("config-save-button-container")
			.crel("label").txt("You've made changes. Do you want to save them?").prnt()
			.crel("div").addc("config-save-button-buttons")
				.crel("input").attr("type", "submit").attr("value", "Yes").prnt()
				.crel("input").attr("type", "reset").attr("value", "Undo Changes").prnt()
			.prnt();
	
	let bannersEl =
		saveButtonContainer.crel("div")
			.addc("banners")
	
	
	let checkChange = () => {
		if(config.autosave) {
			formHelper.submit({causedByChange: true});
		} else {
			configFormEl.els(".banner").forEach(banner => banner.hide());
			
			if(quicklySerializeForm(configFormEl) !== initialState) {
				saveButtonContainer.addc("visible");
			} else {
				saveButtonContainer.remc("visible");
			}
		}
	}
	configFormEl.on("change", checkChange);
	configFormEl.on("input", checkChange);
	configFormEl.on("reset", () => {
		saveButtonContainer.remc("visible");
	});
	
	let formHelper = {
		hide: () => {
			return new Promise(res => {
				saveButtonContainer.remc("visible");
				configFormEl.els(".config-option").anim({
					opacity: [1, 0],
					translateY: [0, -100],
					easing: "ease-in",
					duration: 300,
					delayBetween: 10
				}).onfinish(() => setTimeout(res, 100))
			});
		},
		submit: async (special) => {
			if(configFormEl.els("[in-progress]").length > 0) {
				return new Banner(bannersEl, {
					type: "banner",
					banner: "error",
					message: "One or more uploads are in progress. Please wait."
				})
			}
			let formDataJSON = Object.fromEntries(new FormData(configFormEl));
			
			let actionOutput = await action(formDataJSON, special);
			
			if(!session) {
				initialState = quicklySerializeForm(configFormEl);
				if(!special || !special.causedByChange)
					checkChange();
			} else {
				if(actionOutput.type == "banner") {
					new Banner(bannersEl, actionOutput);
				}
			}
		}
	};
	
	configFormEl.on("submit", async (event) => {
		event.preventDefault();
		formHelper.submit();
	})
	
	return formHelper
}


export default configMenu;
