const cookieParser = require('cookie');

async function login(db, cookie) {
	if(!cookie) return false;
	let cookies = cookieParser.parse(cookie);
	let token = cookies.do_not_send_your_token_to_anyone;
	if(!token)
		return false;
	let tokenRow = await db.get("SELECT * FROM tokens WHERE token = ?", [token]);
	if(!tokenRow)
		return false;
	let user = await db.get("SELECT * FROM users WHERE userid = ?", [tokenRow.userid]);
	if(!user)
		return false;
	if(user.password !== tokenRow.password)
		return false;
	
	return user;
}

module.exports = login;
