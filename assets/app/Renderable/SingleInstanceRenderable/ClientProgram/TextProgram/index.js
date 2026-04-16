import ClientProgram from "../index.js";

class TextProgram extends ClientProgram {
	style = [...this.style, "app/Renderable/SingleInstanceRenderable/ClientProgram/TextProgram/main.css"];
	classes = [...this.classes, "text-program"]
	
	
}
ClientProgram.register(TextProgram);

export default TextProgram;