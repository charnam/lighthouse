import { HTML } from "imperative-html";

class Renderable {
	DEBUG = false;
	
	style = ["app/Renderable/main.css"];
	_classes = ["renderable"];
	set classes(val) {
		this._classes = val;
		this.update();
	}
	get classes() {
		return this._classes;
	}
	
	boundTo = [];
	render() {
		const target = new HTML.div({class: "is-renderable is-loading-style"});
		target.renderable = this;
		
		if(this.DEBUG) {
			target.classList.add("is-debug-target");
		}
		
		Promise.all(this.style.map(style => this.loadStyle(style))).then(() => {
			setTimeout(() => {
				target.classList.remove("is-loading-style");
			}, 10);
		});
		
		if(this.DEBUG) {
			console.log("Created attached instance of %s at %s", this.constructor.name, new Date().toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit", fractionalSecondDigits: 3 }), target);
		}
		
		for(let cl of this.classes) {
			target.classList.add(cl);
		}
		this.boundTo.push(target);
		
		return target;
	}
	
	update() {
		//this.boundTo = this.boundTo.filter(item => document.body.contains(item));
		return Promise.all(this.boundTo.map(target => target ? this.updateRendered(target) : true));
	}
	
	updateRendered(el) {
		if(this.DEBUG) {
			console.log("Updated attached instance of %s at %s", this.constructor.name, new Date().toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit", fractionalSecondDigits: 3 }), el);
		}
		for(let cl of this.classes) {
			el.classList.add(cl);
		}
	}
	
	async loadStyle(style) {
		await new Promise(res => {
			const thisStyle = style;
			const styleElements = document.querySelectorAll("link[rel=\"stylesheet\"]");
			
			if (![...styleElements].some(element => element.getAttribute("href") == thisStyle)) {
				const link = new HTML.link({ rel: "stylesheet", href: thisStyle });
				document.head.appendChild(link);
				link.onload = link.onerror = () => res();
			} else {
				res();
			}
		});
	}

}

export default Renderable;