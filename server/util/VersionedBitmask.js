import Bitmask from "./Bitmask.js";

class VersionedBitmask extends Bitmask {
	defaults = [];
	get none() {
		let bits = 0;
		for(let version = 0; version < this.versions.length; version++) {
			bits = bits | (this.byName["HAS_VERSION_"+version] ?? 0);
		}
		return bits;
	}
	
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
		this.useFirstVersion = useFirstVersion;
		this.defaults = defaults;
		this.versions = versions;
	}
	
	getDefaults() {
		if(this.useFirstVersion)
			return this.updateVersioning(0);
		else {
			let mask = 0;
			
			for(let name of this.defaults) {
				mask = mask | this.byName[name];
			}
			
			mask = this.updateVersioning(mask);
			
			return mask;
		}
	}
	
	updateVersioning(bits) {
		let versionNumber = 1;
		for(let version of this.versions) {
			if(!(this.byName["HAS_VERSION_"+versionNumber] & bits) && (versionNumber > 1 || this.useFirstVersion)) {
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