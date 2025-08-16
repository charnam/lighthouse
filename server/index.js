// # Imports
const fs = require('node:fs');
const express = require('express');
const sqlite3 = require("sqlite3");
const sqlite = require("sqlite");
const http = require('node:http');
const path = require('node:path');
const socketio = require('socket.io');

// Local generic imports
const logger = require('helpers/logger.js');

// Local imports
const userLogin = require("authentication/userLogin.js");
const StatedSession = require("StatedSession.js");
const Upload = require("Upload.js");
const Permissions = require("authentication/permissions.js");

function mkdirSilent(dirname) {
	if(!fs.existsSync(dirname))
		fs.mkdirSync(dirname);
}

// # Main program
async function main() {
	// # Variables and Configuration
	logger.setLogLevel(0);
	const cwd = process.cwd();
	
	// # Initialization
	mkdirSilent("cache");
	mkdirSilent("config");
	mkdirSilent(Upload.UPLOAD_FILE_PATH);
	mkdirSilent(Upload.TEMP_UPLOAD_FILE_PATH);
	
	if(!fs.existsSync("config/release.txt"))
		fs.copyFileSync("server/variables/default-release.txt", "config/release.txt");
	
	let server_version = fs.readFileSync("server/variables/version.txt").toString();
	let release_info = fs.readFileSync("config/release.txt").toString();
	
	release_info = release_info.replace("{version}", server_version);
	
	fs.writeFileSync("cache/release.txt", release_info);
	
	// # Database setup
	let db = await sqlite.open({
		filename: "config/database.db",
		driver: sqlite3.Database
	});
	
	let database_structure = fs.readFileSync("server/variables/structure.sql").toString();
	await db.exec(database_structure);
	
	// # Server setup
	const expressApp = express();
	const httpServer = http.createServer(expressApp);
	const io = new socketio.Server(httpServer);
	
	// # Helper functions
	expressApp.get('/', (req, res) => {
		res.sendFile(path.join(cwd, 'assets/index.html'));
	});
	
	expressApp.get('/js/variables/release.txt', (req, res) => {
		res.sendFile(path.join(cwd, "cache/release.txt"));
	});
	
	expressApp.get('/js/variables/permissions.js', (req, res) => {
		res.type('text/javascript');
		res.send(
			`
				export default ${JSON.stringify(Permissions.ByName)};
			`
			.trim()
		);
	});
	
	expressApp.use(express.static('assets'));
	
	
	// # Server code
	Upload.setup(db, expressApp);

	io.on("connection", async function(socket) {
		let user = await userLogin(db, socket.request.headers.cookie);
		if(user === false) {
			let session = new StatedSession(db, socket);
			session.join_group("special:registration");
		} else {
			socket.emit("logged-in", {
				user
			});
			let session = new StatedSession(db, socket, user);
			session.join_group("special:direct");
		}
		
		
	})
	
	// # Start server
	httpServer.listen(8001, () => {
		logger.log(1, "Application ready, hosting on localhost:8001");
	});
}
main();
