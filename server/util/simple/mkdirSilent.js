const { existsSync, mkdirSync } = require("node:fs");

function mkdirSilent(dirname) {
	if(!existsSync(dirname))
		mkdirSync(dirname);
}

export default mkdirSilent;