class Logger {
	static logLevel = 3;
	
	static log(loglvl, ...msg) {
		if(LOGLEVEL <= loglvl || loglvl >= 4) {
			console.log(`[${["DEBUG", "NOTICE", "WARNING", "ERROR", "CRITICAL"][loglvl]}]`, ...msg);
		}
	}
	
	static setLogLevel(newloglevel) {
		this.logLevel = newloglevel
	}
}

export default Logger;