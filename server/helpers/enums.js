
function make_enum_simple(...keys) {
	let output = {};
	for(let i = 0; i < keys.length; i++) {
		output[keys[i]] = i;
	}
	return output;
}

function make_enum_bitmask(...keys) {
	let output = {};
	for(let i = 0; i < keys.length; i++) {
		output[keys[i]] = 1<<i
	}
	return output;
}

module.exports.make_simple = make_enum_simple;
module.exports.make_bitmask = make_enum_bitmask;

