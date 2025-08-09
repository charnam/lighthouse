
const Banners = require("helpers/banners.js");

class Validation {
	static error_banner(text) {
		return Banners.error(text);
	}
	
	static success = {type: "success"}
	
	static async validate_username(username) {
		
		if(!/^[a-z0-9\-_.]+$/.test(username))
			return this.error_banner("Username contains invalid characters");
		
		if(username.length < 3)
			return this.error_banner("Username is too short - 3 characters minimum");
		
		if(username.length > 32)
			return this.error_banner("Username is longer than 32 characters")
		
		return this.success;
		
	}
	
	static async validate_new_username(username, db, exclude = null) {
		
		let usernameValidation = await this.validate_username(username);
		if(usernameValidation.type !== "success")
			return usernameValidation;
		
		let existingUser = await db.get("SELECT username FROM users WHERE username = ?", username);
		
		if(existingUser && existingUser.username !== exclude)
			return this.error_banner("There is already an account with this username")
		
		return this.success;
		
	}
	
	static async validate_password(password) {
		
		if(password.length < 8)
			return this.error_banner("Password too short - 8 characters minimum");
		
		if(password.length > 64)
			return this.error_banner("Password too long - 64 characters maximum");
		
		return this.success;
		
	}
	
	static async validate_display_name(displayname) {
		
		if(displayname.length < 1)
			return this.error_banner("Display name must not be empty");
		
		if(displayname.length > 64)
			return this.error_banner("Display name too long - 64 characters maximum");
		
		return this.success;
		
	}
	
	static async validate_group_name(groupname) {
		
		if(groupname.length < 1)
			return this.error_banner("Group name must not be empty");
		
		if(groupname.length > 64)
			return this.error_banner("Group name too long - 64 characters maximum");
		
		return this.success;
		
	}
	static async validate_program_name(programname) {
		
		if(programname.length < 1)
			return this.error_banner("Program name must not be empty");
		
		if(programname.length > 64)
			return this.error_banner("Program name too long - 64 characters maximum");
		
		return this.success;
		
	}
	static async validate_program_info(info_content) {
		
		if(info_content.length > 4096)
			return this.error_banner("Info content length too long - 4,096 characters maximum");
		
		return this.success;
	}
	
	static async validate_and_use_uploaded_file(session, id, type) {
		
		let validation = await this.validate_uploaded_file(session, id, type);
		if(validation.type !== "success")
			return validation;
		
		await session.db.run("UPDATE uploads SET autodelete = 0 WHERE uploadid = ?", id);
		
		return this.success;
	}
	static async validate_uploaded_file(session, id, type) {
		
		if(id == undefined || type == undefined)
			return this.error_banner("Server error");
		
		let upload = await session.db.get("SELECT * FROM uploads WHERE uploadid = ?", id);
		
		if(!upload)
			return this.error_banner("Uploaded file does not exist or has expired");
		
		if(upload.type !== type || upload.autodelete == 0)
			return this.error_banner("Upload cannot be used here");
		
		
		return this.success;
	}
	
}

module.exports = Validation;

