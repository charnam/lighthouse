
let LOGLEVEL = 3;
function log(loglvl, ...msg) {
	if(LOGLEVEL <= loglvl || loglvl >= 4) {
		console.log(`[${["DEBUG", "NOTICE", "WARNING", "ERROR", "CRITICAL"][loglvl]}]`, ...msg);
	}
}

module.exports.log = log;
module.exports.setLogLevel = (newloglevel) => {
	LOGLEVEL = newloglevel
};

