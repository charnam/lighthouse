import GroupIcon from "../index.js";

class SmallGroupIcon extends GroupIcon {
	style = [...this.style, "app/Renderable/SingleInstanceRenderable/GroupIcon/SmallGroupIcon/main.css"];
	classes = [...this.classes, "small-group-icon"];
}

export default SmallGroupIcon;