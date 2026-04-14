import Bitmask from "./Bitmask.js";

class VersionedBitmask extends Bitmask {
	defaults = [];
	
	constructor(versions, useFirstVersion = true) {
		let bitmaskEntries = [];
		let defaults = [];
		let versionNumber = 1;
		for(let version of versions) {
			if(useFirstVersion || versionNumber > 1) {
				bitmaskEntries.push("HAS_VERSION_"+versionNumber);
			}
			for(let item of version) {
				bitmaskEntries.push(item.name);
				if(item.default === true) {
					defaults.push(item.name);
				}
			}
			versionNumber++;
		}
		super(bitmaskEntries);
		this.defaults = defaults;
		this.versions = versions;
	}
	
	updateVersioning(bits) {
		let versionNumber = 1;
		for(let version of this.versions) {
			if(!(this.byName["HAS_VERSION_"+versionNumber] & bits)) {
				bits = bits | this.byName["HAS_VERSION_"+versionNumber];
				bits = this.applyVersionDefaults(version, bits)
			}
			versionNumber++;
		}
		return bits;
	}
	
	applyVersionDefaults(version, bits) {
		for(let item of version) {
			if(item.default) {
				bits = bits | this.byName[item.name];
			}
		}
		return bits;
	}
}

export default VersionedBitmask;