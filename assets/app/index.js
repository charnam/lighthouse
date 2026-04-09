
import StatedSessionHandler from "./StatedSessionHandler.js";

if(!window.io || !window.doc)
	throw alert("Looks like an important resource failed to load. Please refresh the page.");

window.onload = function() {
	const socket = io();
	const session = new StatedSessionHandler(socket);
	if(window.location.hash == "#DEBUG")
		window._SESSION = session;
}

