
class Bitmask {
	byName = {};
	ordered = [];
	mask = 0;
	constructor(values) {
		for(let [index, value] of Object.entries(values)) {
			this.byName[value] = 1<<Number(index);
			this.ordered.push(value);
			
			this.mask = this.mask | this.byName[value];
		}
	}
	
	getNamedValues(bits) {
		let keys = [];
		for(let [key, value] of Object.entries(this.byName)) {
			if(bits & value) {
				keys.push(key);
			}
		}
		return keys;
	}
}

export default Bitmask;