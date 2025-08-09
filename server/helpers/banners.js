class Banners {
	static banner(type, message) {
		return {
			type: "banner",
			banner: type,
			message
		};
	}
	static error(message) {
		return this.banner("error", message);
	}
}
module.exports = Banners;
