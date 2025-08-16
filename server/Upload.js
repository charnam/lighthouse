
const fs = require('fs');
const uuid = require('uuid').v4;
const multer = require("multer");
const sharp = require("sharp");
const UPLOAD_FILE_PATH = "config/uploads";
const TEMP_UPLOAD_FILE_PATH = "config/temp-uploads";
const ALLOWED_MIME_TYPES = [
	"image/jpeg",
	"image/png",
	"image/gif",
	"image/webp",
	"image/bmp",
	"image/tiff",
	"image/apng",
	"audio/mp3",
	"audio/x-wav"
];

const userLogin = require("authentication/userLogin.js");
const logger = require("helpers/logger.js");

function movePromise(file, destination) {
	return new Promise(res =>
		fs.rename(file, destination, res)
	);
}


const upload = multer({
	storage: multer.diskStorage({
		destination: function (req, file, cb) {
			cb(null, `${TEMP_UPLOAD_FILE_PATH}/`);
		},
		filename: function (req, file, cb) {
			cb(null, uuid());
		}
	})
})

function setup(db, expressApp) {
	
	expressApp.post("/uploads/create", upload.single("file"), async function(req, res) {
		const tempPath = req.file.path;
		const targetPath = `${UPLOAD_FILE_PATH}/${req.file.filename}`;
		let fail = (message) => {
			
			if(fs.existsSync(tempPath))
				fs.unlinkSync(tempPath);
			
			if(fs.existsSync(targetPath))
				fs.unlinkSync(targetPath);
			
			res.json({
				type: "banner",
				banner: "error",
				message
			})
		};
		
		
		const user = await userLogin(db, req.headers.cookie);
		let mimetype;
		
		if(!user) {
			return fail("Invalid session");
		}
		
		const convert = async (type, width, height, quality) => {
			try {
				
				let constructed =
					sharp(tempPath, { animated: true })
						.resize({
							width, 
							height,
							withoutEnlargement: true,
							fit: "cover"
						});
				
				if(type == "webp") {
					constructed = constructed.webp({quality, alphaQuality: 100, lossless: quality == 100});
					mimetype = "image/webp";
				} else if(type == "png") {
					constructed = constructed.png();
					mimetype = "image/png";
				}
				
				await constructed.toFile(targetPath);
				
				fs.unlinkSync(tempPath);
				
				return true;
			} catch(err) {
				if(err.message.includes("unsupported image format")) {
					fail("Unsupported image type.");
				} else if(err.message.includes("exceeds pixel limit")) {
					fail("Uploaded image is too big. If this is an animation, try reducing the frame rate.");
				} else {
					fail("Failed to process image.");
					logger.log(0, "Failed to process uploaded image "+tempPath+". Error log: "+err);
				}
				return false;
			}
		}
		
		switch(req.body.uploadType) {
			case "pfp":
			case "groupicon":
				if(!await convert(
					"webp",
					256, 256,
					80
				)) return false;
				break;
			case "wallpaper":
				if(!await convert(
					"webp",
					1280, 720,
					70
				)) return false;
				break;
			case "roleicon":
				if(!await convert(
					"webp",
					16, 16,
					100
				)) return false;
				break;
			case "attachment":
				await movePromise(tempPath, targetPath);
				mimetype = req.file.mimetype;
				break;
			default:
				return fail("Unknown upload type.");
				break;
		}
		
		if(!mimetype)
			return fail("Unable to determine filetype of uploaded file.");
		
		let id = uuid();
		await db.run("INSERT INTO uploads (uploadid, userid, type, originalname, filename, size, mimetype, autodelete) VALUES (?,?,?,?,?,?,?,?)", [
			id,
			user.userid,
			req.body.uploadType,
			req.file.originalname,
			req.file.filename,
			req.file.size,
			mimetype,
			Date.now()+30*60*1000
		]);
		res.json({
			type: "success",
			uploadid: id,
			originalname: req.file.originalname,
			mimetype
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
					"Content-Type": ALLOWED_MIME_TYPES.includes(uploadData.mimetype) ? uploadData.mimetype : "application/octet-stream"
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
			try {
				fs.unlinkSync(`${UPLOAD_FILE_PATH}/${upload.filename}`);
			} catch(err) {
				logger.log(4, err)
			}
		});
	}, 30*1000) // every 30 seconds
	
}


module.exports = {
	UPLOAD_FILE_PATH,
	TEMP_UPLOAD_FILE_PATH,
	setup
}

