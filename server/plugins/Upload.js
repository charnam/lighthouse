
import { existsSync, unlinkSync } from 'fs';
import { v4 as uuid } from 'uuid';
import multer, { diskStorage } from "multer";
import sharp from "sharp";

import Logger from "../util/Logger.js";
import { rename, unlink } from 'fs/promises';

class Upload {
	static UPLOAD_FILE_PATH = "config/uploads";
	static TEMP_UPLOAD_FILE_PATH = "config/temp-uploads"
	static ALLOWED_MIME_TYPES = [
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
	
	static MULTER = multer({
		storage: diskStorage({
			destination: function (req, file, cb) {
				cb(null, `${this.TEMP_UPLOAD_FILE_PATH}/`);
			},
			filename: function (req, file, cb) {
				cb(null, uuid());
			}
		})
	});
	
	
	static setup(db, expressApp) {
		expressApp.post("/uploads/create", this.MULTER.single("file"), async function(req, res) {
			const tempPath = req.file.path;
			const targetPath = `${this.UPLOAD_FILE_PATH}/${req.file.filename}`;
			let fail = async (message) => {
				res.json({
					type: "banner",
					banner: "error",
					message
				});
				
				if(existsSync(tempPath)) {
					await unlink(tempPath);
				}
				
				if(existsSync(targetPath)) {
					await unlink(targetPath);
				}
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
					
					unlinkSync(tempPath);
					
					return true;
				} catch(err) {
					if(err.message.includes("unsupported image format")) {
						fail("Unsupported image type.");
					} else if(err.message.includes("exceeds pixel limit")) {
						fail("Uploaded image is too big. If this is an animation, try reducing the frame rate.");
					} else {
						fail("Failed to process image.");
						log(0, "Failed to process uploaded image "+tempPath+". Error log: "+err);
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
					await rename(tempPath, targetPath);
					mimetype = req.file.mimetype;
					break;
				default:
					return fail("Unknown upload type.");
					break;
			}
			
			if(!mimetype)
				return fail("Unable to determine filetype of uploaded file.");
			
			let id = uuid();
			await db.run(`
				INSERT INTO uploads
					(uploadid, userid, type, originalname, filename, size, mimetype, autodelete)
				VALUES (
					${db.val(id)},
					${db.val(user.userid)},
					${db.val(req.body.uploadType)},
					${db.val(req.file.originalname)},
					${db.val(req.file.filename)},
					${db.val(req.file.size)},
					${db.val(mimetype)},
					${db.val(Date.now()+30*60*1000)}
				)
			`);
			res.json({
				type: "success",
				uploadid: id,
				originalname: req.file.originalname,
				mimetype
			});
		})
		
		expressApp.use("/uploads/", async (req, res) => {
			let requestedFile = req.path.split("/")[1];
			let uploadData = await db.get(`SELECT * FROM uploads WHERE uploadid = ${db.val(requestedFile)}`);
			if(uploadData == null)
				return res.json({type: "error", message: "Not found"});
			else {
				if(uploadData.autodelete !== 0)
					return res.json({type: "error", message: "Upload has not been used yet"});
				
				if(uploadData.filename.includes("."))
					return res.json({type: "error", message: "Invalid file"});
				res.sendFile(`${process.cwd()}/${this.UPLOAD_FILE_PATH}/${uploadData.filename}`,
				{
					headers: {
						"Content-Type": this.ALLOWED_MIME_TYPES.includes(uploadData.mimetype) ? uploadData.mimetype : "application/octet-stream"
					}
				})
			}
		});
		
		setInterval(async () => {
			let toDelete = await db.all(`SELECT * FROM uploads WHERE autodelete < ${db.val(Date.now())} AND NOT autodelete = 0`);
			toDelete.forEach(async upload => {
				console.log(upload, "deleted");
				await db.run(`DELETE FROM uploads WHERE uploadid = ${db.val(upload.uploadid)}`);
				if(upload.filename.includes("."))
					throw new Error("Uploaded file path contains a dot. This is unsafe! Halted.");
				try {
					await unlink(`${this.UPLOAD_FILE_PATH}/${upload.filename}`);
				} catch(err) {
					Logger.log(4, err)
				}
			});
		}, 30*1000) // every 30 seconds
		
	}
	
}

export default Upload;

