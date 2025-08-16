


class Reorder {
	static async reorder_program(db, programid, new_placement) {
		let program = await db.get("SELECT groupid, position FROM programs WHERE programid = ?", programid);
		
		if(!program || !program.groupid)
			return {
				type: "banner",
				banner: "error",
				message: "Program does not exist or is not part of group"
			};
		if(typeof new_placement !== "number")
			return {
				type: "banner",
				banner: "error",
				message: "Invalid placement"
			};
			
		
		let groupid = program.groupid;
		
		// push all other program positions up
		let testFor = {
			position: new_placement,
			programid: programid
		};
		while(testFor !== false) {
			let cont = await db.get("SELECT programid FROM programs WHERE groupid = ? AND position = ? AND NOT programid = ?", [groupid, testFor.position, testFor.programid]);
			if(cont) {
				await db.get("UPDATE programs SET position = ? WHERE programid = ?", [++testFor.position, cont.programid]);
				testFor.programid = cont.programid;
			} else {
				testFor = false;
			}
		}
		
		await db.run("UPDATE programs SET position = ? WHERE programid = ?", [new_placement, programid]);
		return { type: "success" };
	}
	static async reorder_group(db, userid, groupid, new_placement) {
		
		// push all other group positions up
		let testFor = {
			position: new_placement,
			groupid: groupid
		};
		while(testFor !== false) {
			let cont = await db.get("SELECT groupid FROM user_group_relationships WHERE userid = ? AND position = ? AND NOT groupid = ?", [userid, testFor.position, testFor.groupid]);
			if(cont) {
				await db.get("UPDATE user_group_relationships SET position = ? WHERE groupid = ? AND userid = ?", [++testFor.position, cont.groupid, userid]);
				testFor.groupid = cont.groupid;
			} else {
				testFor = false;
			}
		}
		
		await db.run("UPDATE user_group_relationships SET position = ? WHERE groupid = ? AND userid = ?", [new_placement, groupid, userid]);
		return { type: "success" };
	}
}

module.exports = Reorder;

