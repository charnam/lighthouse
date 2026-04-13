
class Banners {
	static banner(type, text) {
		return {type: "banner", bannerType: type, text};
	}
	static error(text) {
		return {error: true, ...this.banner("error", text)};
	}
}

export default Banners;