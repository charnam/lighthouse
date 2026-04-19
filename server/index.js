import { copyFileSync, existsSync, readFileSync, writeFileSync } from "node:fs";
import express from "express";
import expressWs from "express-ws";
import mkdirSilent from "./util/simple/mkdirSilent.js";
import Upload from "./plugins/Upload.js";
import Connection from "../assets/shared/Connection.js";
import Logger from "./util/Logger.js";
import path from "node:path";
import ClientHandler from "./base/ClientHandler.js"
import Database from "./util/Database.js";
import Permissions from "./variables/Permissions.js";

// # Variables and Configuration
Logger.setLogLevel(0);
const cwd = process.cwd();

// # Initialization
mkdirSilent("cache");
mkdirSilent("config");
mkdirSilent(Upload.UPLOAD_FILE_PATH);
mkdirSilent(Upload.TEMP_UPLOAD_FILE_PATH);

if(!existsSync("config/release.txt"))
	copyFileSync("variables/default-release.txt", "config/release.txt");

let server_version = readFileSync("variables/version.txt").toString();
let release_info = readFileSync("config/release.txt").toString();

release_info = release_info.replace("{version}", server_version);

writeFileSync("cache/release.txt", release_info);

// # Database setup
const db = new Database("file-uploads");

// # Server setup
const expressApp = express();
const expressAppWs = expressWs(expressApp);

// # Helper functions
expressApp.ws("/lighthouse", (socket, req) => {
	const conn = new Connection(socket);
	new ClientHandler(conn);
});

expressApp.get('/', (_req, res) => {
	res.sendFile(path.join(cwd, '../assets/index.html'));
});

expressApp.get('/js/variables/release.txt', (req, res) => {
	res.sendFile(path.join(cwd, "cache/release.txt"));
});

expressApp.use("variables", express.static('variables'));
expressApp.use(express.static('../assets'));


// # Server code
Upload.setup(db, expressApp);

// # Start server
expressApp.listen(8001, () => console.log("Server is running on port 8001"));
