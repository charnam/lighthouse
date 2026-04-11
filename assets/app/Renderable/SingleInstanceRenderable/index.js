import Renderable from "../index.js";

class SingleInstanceRenderable extends Renderable {
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

	async remove() {
		if (this.element) {
			const el = this.element;
			await this.beforeRemove();
			if (this._overlay) {
				this._overlay.remove();
			}
			el.remove();
		}
	}

}

export default SingleInstanceRenderable;