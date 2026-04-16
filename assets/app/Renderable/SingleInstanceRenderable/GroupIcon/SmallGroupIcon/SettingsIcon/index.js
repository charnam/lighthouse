import SmallGroupIcon from "../index.js";

class SettingsIcon extends SmallGroupIcon {
	style = this.autoStyleByImport(import.meta.url);
	classes = [...this.classes, "bi-gear-fill"];
	
	constructor(client) {
		super(client, {groupname: "Settings", groupid: "settings"});
	}
	
	render() {
		const target = super.render();
		this.update();
		return target;
	}
}

export default SettingsIcon;
