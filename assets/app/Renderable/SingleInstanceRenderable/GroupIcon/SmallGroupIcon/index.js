import GroupIcon from "../index.js";

class SmallGroupIcon extends GroupIcon {
	style = this.autoStyleByImport(import.meta.url);
	classes = [...this.classes, "small-group-icon"];
}

export default SmallGroupIcon;