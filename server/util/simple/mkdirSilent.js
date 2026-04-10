
import {existsSync, mkdirSync} from "fs";

function mkdirSilent(dirname) {
	if(!existsSync(dirname))
		mkdirSync(dirname);
}

export default mkdirSilent;