import { copyFileSync, existsSync, readFileSync, writeFileSync } from "node:fs";
import sqlite from "sqlite";
import sqlite3 from "sqlite3";
import mkdirSilent from "./util/simple/mkdirSilent.js";
import Upload from "./plugins/Upload.js";

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
	expressApp.use('/icons/', express.static('server/node_modules/bootstrap-icons/icons'));
	
	
	// # Server code
	Upload.setup(db, expressApp);

	io.on("connection", async function(socket) {
		let user = await userLogin(db, socket.request.headers.cookie);
		if(user === false) {
			let session = new StatedSession(db, socket);
		} else {
			socket.emit("logged-in", {
				user
			});
			let session = new StatedSession(db, socket, user);
		}
		
		
	})
	
	// # Start server
	httpServer.listen(8001, () => {
		logger.log(1, "Application ready, hosting on localhost:8001");
	});
}
main();
