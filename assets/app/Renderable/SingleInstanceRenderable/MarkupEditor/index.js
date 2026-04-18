import { HTML } from "imperative-html";
import SingleInstanceRenderable from "../index.js";

class MarkupEditor extends SingleInstanceRenderable {
	style = this.autoStyleByImport(import.meta.url);
	classes = [...this.classes, "markup-editor"]
	
	get value() {
		return this.composeBox.innerText;
	}
	set value(value) {
		this.composeBox.innerText = value;
	}
	
	render() {
		const target = super.render();
		
		target.append(
			this.composeBox = new HTML.div({
				class: "markup-editor-compose",
				contenteditable: "plaintext-only",
				placeholder: "Send a message..."
			})
		);
		
		this.composeBox.addEventListener("input", event => {
			if(this.value == "\n") {
				this.value = "";
			}
		})
		
		this.composeBox.addEventListener("paste", event => {
			event.preventDefault()
			let text = event.clipboardData ? event.clipboardData.getData("text/plain") : "";
			
			if(document.queryCommandSupported?.("insertText")) {
				document.execCommand('insertText', false, text)
			} else {
				const selection = document.getSelection();
				if (!selection) {
					
				} else {
					const range = selection.getRangeAt(0);
					range.deleteContents();
					range.insertNode(new Text(text));
					range.collapse(); // select nothing
					selection.removeAllRanges(); // position caret after inserted text
					selection.addRange(range); // show caret
				}
			}
		});
		
		return target;
	}
	
}

export default MarkupEditor;