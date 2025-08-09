const uuid = require("uuid").v4;
const logger = require("helpers/logger.js")

async function create_token(db, user, hashed_pw) {
	let token = uuid();
	logger.log(1, "Created token for user", user)
	await db.run("INSERT INTO tokens (token,userid, password, creation) VALUES (?,?,?,?)", [token, user, hashed_pw, Date.now()]);
	return token;
}
module.exports = create_token;

