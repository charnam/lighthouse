


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
}

module.exports = Reorder;

