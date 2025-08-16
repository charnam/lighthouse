
const Banners = require("helpers/banners.js");

class Validation {
	static error_banner(text) {
		return Banners.error(text);
	}
	
	static success = {type: "success"}
	
	static async validate_message_content(content, ignoreBlank) {
		
		if(typeof content !== "string")
			return this.error_banner("Message content is not a string value.");
		
		if(content.length > 2048)
			return this.error_banner("Message is over 2,048 characters");
		if(content.length == 0 && !ignoreBlank)
			return this.error_banner("Message cannot be blank");
		
		return this.success;
	}
	
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
		
		if(typeof password !== "string")
			return this.error_banner("Password is not a string value");
		
		if(password.length < 8)
			return this.error_banner("Password too short - 8 characters minimum");
		
		if(password.length > 64)
			return this.error_banner("Password too long - 64 characters maximum");
		
		return this.success;
		
	}
	
	static async validate_display_name(displayname) {
		
		if(typeof displayname !== "string")
			return this.error_banner("Display name is not a string value");
		
		if(displayname.length < 1)
			return this.error_banner("Display name must not be empty");
		
		if(displayname.length > 64)
			return this.error_banner("Display name too long - 64 characters maximum");
		
		return this.success;
		
	}
	
	static async validate_group_name(groupname) {
		
		if(typeof groupname !== "string")
			return this.error_banner("Group name is not a string value");
		
		if(groupname.length < 1)
			return this.error_banner("Group name must not be empty");
		
		if(groupname.length > 64)
			return this.error_banner("Group name too long - 64 characters maximum");
		
		return this.success;
		
	}
	static async validate_program_name(programname) {
		
		if(typeof programname !== "string")
			return this.error_banner("Program name is not a string value");
		
		if(programname.length < 1)
			return this.error_banner("Program name must not be empty");
		
		if(programname.length > 64)
			return this.error_banner("Program name too long - 64 characters maximum");
		
		return this.success;
		
	}
	static async validate_role_name(rolename) {
		
		if(typeof rolename !== "string")
			return this.error_banner("Role name is not a string value");
		
		if(rolename.length < 1)
			return this.error_banner("Role name must not be empty");
		
		if(rolename.length > 32)
			return this.error_banner("Role name too long - 32 characters maximum");
		
		return this.success;
		
		
	}
	
	static async validate_info_content(info_content) {
		
		if(typeof info_content !== "string")
			return this.error_banner("Info content is not a string value");
		
		if(info_content.length > 4096)
			return this.error_banner("Info content length too long - 4,096 characters maximum");
		
		return this.success;
	}
	
	static async validate_bio(bio_content) {
		
		if(typeof bio_content !== "string")
			return this.error_banner("Bio is not a string value");
		
		if(bio_content.length > 4096)
			return this.error_banner("Bio length too long - 4,096 characters maximum");
		
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
		
		if(upload.userid !== session.user.userid)
			return this.error_banner("Uploaded file: Session mismatch (try logging in again?)")
		
		return this.success;
	}
	
}

module.exports = Validation;

