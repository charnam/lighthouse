import { copyFileSync, existsSync, readFileSync, writeFileSync } from "node:fs";
import express from "express";
import expressWs from "express-ws";
import sqlite from "sqlite";
import sqlite3 from "sqlite3";
import mkdirSilent from "./util/simple/mkdirSilent.js";
import Upload from "./plugins/Upload.js";

// # Variables and Configuration
logger.setLogLevel(0);
const cwd = process.cwd();

// # Initialization
mkdirSilent("cache");
mkdirSilent("config");
mkdirSilent(Upload.UPLOAD_FILE_PATH);
mkdirSilent(Upload.TEMP_UPLOAD_FILE_PATH);

if(!existsSync("config/release.txt"))
	copyFileSync("server/variables/default-release.txt", "config/release.txt");

let server_version = readFileSync("server/variables/version.txt").toString();
let release_info = readFileSync("config/release.txt").toString();

release_info = release_info.replace("{version}", server_version);

writeFileSync("cache/release.txt", release_info);

// # Database setup
let db = await sqlite.open({
	filename: "config/database.db",
	driver: sqlite3.Database
});

let database_structure = readFileSync("server/variables/structure.sql").toString();
await db.exec(database_structure);

// # Server setup
const expressApp = express();
const expressAppWs = expressWs(expressApp);
const httpServer = http.createServer(expressApp);

// # Helper functions
expressApp.get('/', (_req, res) => {
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
expressApp.get('/js/variables/settings.js', (req, res) => {
	res.type('text/javascript');
	res.send(
		`
			export default ${JSON.stringify(Settings.ByName)};
		`
		.trim()
	);
});

expressApp.use(express.static('assets'));

expressApp.ws("/lighthouse", (ws, req) => {
	
	
	
});


// # Server code
Upload.setup(db, expressApp);

// # Start server
httpServer.listen(8001, () => {
	logger.log(1, "Application ready, hosting on localhost:8001");
});
