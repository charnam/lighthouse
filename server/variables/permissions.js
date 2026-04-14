// IMPORTANT:
// The database stores these values in a "bitmask" format.

// What this means for you is that you MAY NOT alter the order
// of values presented here, if you plan to continue using
// the same database.

// You may only add new values to the END of this list.
// Any values added in the middle of the list or otherwise
// rearranged will cause improper reading of previous data.

// If you are starting a new database, and do not care whatsoever
// about backwards compatibility or your changes being merged
// with the main release of Lighthouse, then feel free changing the order
// of these values.

class Permissions {
	permissions = new Bitmask(
		"VIEW_PROGRAM",
		"SEND_MESSAGES",
		"EDIT_GROUP",
		"EDIT_PROGRAM",
		"ADMIN",
		"DELETE_PROGRAMS",
		"SEND_FILES",
		"EDIT_ROLES",
		"EDIT_MESSAGES",
		"DELETE_OWN_MESSAGES",
		"DELETE_OTHER_MESSAGES",
		"INVITE_OTHERS"
	);

}
