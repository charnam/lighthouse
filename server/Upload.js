
const fs = require('fs');
const uuid = require('uuid').v4;
const multer = require("multer");
const sharp = require("sharp");
const UPLOAD_FILE_PATH = "config/uploads";

const userLogin = require("authentication/userLogin.js");

const logger = require("helpers/logger.js");

const spawn = require("child_process").spawn;

function spawnPromise(command, args) {
	return new Promise(res => {
		let child = spawn(command, args);
		
		let stdout = "";
		let stderr = "";
		child.stdout.on("data", out => stdout+=out.toString());
		child.stderr.on("data", err => stderr+=err.toString());
		
		child.on("close", status => {
			res({
				status,
				stdout,
				stderr
			});
		})
		
	})
}

function movePromise(file, destination) {
	return new Promise(res =>
		fs.rename(file, destination, res)
	);
}

const MAGIC_FILETYPES = {
	"JPEG": "image/jpeg",
	"PNG": "image/png",
	"GIF": "image/gif",
	"WEBP": "image/webp",
	"BMP": "image/bmp"
};
async function identifyImage(filename) {
	let identification = await spawnPromise("magick", ["identify", "-quiet", "-format", "%m", `${UPLOAD_FILE_PATH}/${filename}`]);
	if(identification.status !== 0) {
		return {
			type: "banner",
			banner: "error",
			message: "Unsupported image type. Try converting it to a more common image format first."
		}
	} else {
		//let ftype = MAGIC_FILETYPES[identification.stdout]
		//if(identification.stdout)
		return {
			type: "success",
			filetype: MAGIC_FILETYPES[identification.stdout]
		}
	}
}


const upload = multer({
	storage: multer.diskStorage({
		destination: function (req, file, cb) {
			cb(null, `${UPLOAD_FILE_PATH}/`);
		},
		filename: function (req, file, cb) {
			cb(null, uuid());
		}
	})
})

const IMAGE_MIME_TYPES = [
	"image/jpeg",
	"image/png",
	"image/gif",
	"image/webp",
	"image/bmp",
	"image/tiff",
	"image/apng"
];

function setup(db, expressApp) {
	
	expressApp.post("/uploads/create", upload.single("file"), async function(req, res) {
		let fail = (message) => {
			fs.unlinkSync(req.file.path);
			res.json({
				type: "banner",
				banner: "error",
				message
			})
		};
		
		
		let user = await userLogin(db, req.headers.cookie);
		let iden = await identifyImage(req.file.filename);
		
		let mimetype = iden.filetype;
		
		if(!user) {
			return fail("Invalid session");
		}
		switch(req.body.uploadType) {
			case "pfp":
			case "groupicon":
			case "roleicon":
				if(!iden.filetype) {
					if(iden.type !== "success")
						return res.json(iden);
					else
						return res.json({
							type: "banner",
							banner: "error",
							message: "Filetype recognized, but not allowed. Ask for help."
						})
				}
				/*
					TODO: scaling of images
					try {
						await movePromise(req.file.filename, `${req.file.filename}-`);
						await
							sharp(req.file.filename)
								.resize({
									width: 256,
									height: 256,
									withoutEnlargement: true,
									fit: "cover"
								})
								.toFile(req.file.filename);
					} catch(err) {
						console.error(err);
						return res.json({
							type: "banner",
							banner: "error",
							message: "Unsupported image type."
						})
					}
				*/
				break;
			case "attachment":
				
				break;
			default:
				return fail("Invalid upload type");
				break;
		}
		
		let id = uuid();
		await db.run("INSERT INTO uploads (uploadid, type, originalname, filename, mimetype, autodelete) VALUES (?,?,?,?,?,?)", [
			id,
			req.body.uploadType,
			req.file.originalname,
			req.file.filename,
			mimetype ? mimetype : req.file.mimetype,
			Date.now()+30*60*1000
		]);
		res.json({
			type: "success",
			uploadid: id
		});
	})
	
	expressApp.use("/uploads/", async (req, res) => {
		let requestedFile = req.path.split("/")[1];
		let uploadData = await db.get("SELECT * FROM uploads WHERE uploadid = ?", requestedFile);
		if(uploadData == null)
			return res.json({type: "error", message: "Not found"});
		else {
			if(uploadData.autodelete !== 0)
				return res.json({type: "error", message: "Upload has not been used yet"});
			
			if(uploadData.filename.includes("."))
				return res.json({type: "error", message: "Invalid file"});
			res.sendFile(`${process.cwd()}/${UPLOAD_FILE_PATH}/${uploadData.filename}`,
			{
				headers: {
					"Content-Type": IMAGE_MIME_TYPES.includes(uploadData.mimetype) ? uploadData.mimetype : "application/octet-stream"
				}
			})
		}
	});
	
	setInterval(async () => {
		let toDelete = await db.all("SELECT * FROM uploads WHERE autodelete < ? AND NOT autodelete = 0", Date.now());
		toDelete.forEach(async upload => {
			console.log(upload, "deleted");
			await db.run("DELETE FROM uploads WHERE uploadid = ?", upload.uploadid);
			if(upload.filename.includes("."))
				throw new Error("Uploaded file path contains a dot. This is unsafe! Halted.");
			fs.unlinkSync(`${UPLOAD_FILE_PATH}/${upload.filename}`);
		});
	}, 30*1000) // every 30 seconds
	
}


module.exports = {
	UPLOAD_FILE_PATH,
	setup
}

