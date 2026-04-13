import Renderable from "../index.js";

class SingleInstanceRenderable extends Renderable {
	style = [...this.style, "app/Renderable/SingleInstanceRenderable/main.css"];
	animateRemoveDuration = 0;

	get element() {
		return this.boundTo[0];
	}

	render() {
		if (this.element) {
			throw new Error("Attempted to re-render SingleInstanceRenderable, " + this.constructor.name);
		}
		return super.render();
	}
	
	renderTo(element) {
		const target = this.render();
		element.append(target);
		return target;
	}

	async beforeRemove() {
		if (this.element) {
			this.element.classList.add("is-removing")
			await new Promise(res => setTimeout(res, this.animateRemoveDuration));
		}
		this.boundTo = [];
	}
	
	removeListeners = [];
	async remove() {
		if (this.element) {
			const el = this.element;
			await this.beforeRemove();
			if (this._overlay) {
				this._overlay.remove();
			}
			for(let listener of this.removeListeners) {
				listener();
			}
			el.remove();
		}
	}
	
	untilRemove() {
		return new Promise(res => {
			const tListener = () => {
				this.removeListeners = this.removeListeners.filter(listener => listener !== tListener);
				res();
			}
			this.removeListeners.push(tListener);
		})
	}

}

export default SingleInstanceRenderable;