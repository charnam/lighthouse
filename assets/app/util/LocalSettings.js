
class LocalSettings {
	static default = {
		"server": "/"
	};
	
	static async get() {
		try {
			return localStorage.getItem("lh-settings") ?? "{}"
		} catch(err) {
			return {};
		}
	}
	
	static overrideServerSettings(serverSettings) {
		
	}
}

export default LocalSettings;