import VersionedBitmask from "../util/VersionedBitmask.js";

class Permissions {
	
	// IMPORTANT:
	// The database stores these values in a "bitmask" format.

	// What this means for you is that you MAY NOT alter the order
	// of values presented here, if you plan to continue using
	// the same database.

	// If you are starting a new database, and do not care whatsoever
	// about backwards compatibility or your changes being merged
	// with the main release of Lighthouse, then feel free changing the order
	// of these values.
	
	// VersionedBitmask. Add another array after the first array.
	static bitmask = new VersionedBitmask([
		[
			{name: "VIEW_PROGRAM", default: true},
			{name: "SEND_MESSAGES", default: true},
			{name: "EDIT_GROUP", default: false},
			{name: "EDIT_PROGRAM", default: false},
			{name: "ADMIN", default: false},
			{name: "DELETE_PROGRAMS", default: false},
			{name: "SEND_FILES", default: true},
			{name: "EDIT_ROLES", default: false},
			{name: "EDIT_MESSAGES", default: true},
			{name: "DELETE_OWN_MESSAGES", default: true},
			{name: "DELETE_OTHER_MESSAGES", default: false},
			{name: "INVITE_OTHERS", default: false}
		]
	], false);
}

export default Permissions;