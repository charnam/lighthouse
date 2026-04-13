import LoadingScreen from "./Renderable/SingleInstanceRenderable/Overlay/LoadingScreen/index.js";
const loader = new LoadingScreen();
loader.open();

await (async () => {
	const Client = (await import("./Renderable/SingleInstanceRenderable/Overlay/Client/index.js")).default;
	Client.create()
})();

loader.remove();