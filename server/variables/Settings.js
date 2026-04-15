import VersionedBitmask from "../util/VersionedBitmask.js"

class Settings {
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
	bitmask = new VersionedBitmask([
		[
			{name: "SHOW_READ_INDICATORS", default: true},
			{name: "SHOW_WHEN_TYPING", default: true},
			{name: "MESSAGE_CHIMES", default: true},
			{name: "NOTIFICATION_SOUNDS", default: true},
			{name: "GROUP_NOTIFICATION_SOUNDS", default: true},
			{name: "RECEIVE_NOTIFICATIONS_FROM_GROUPS", default: false},
			{name: "HIDE_ACTIVITY", default: false},
			{name: "JOIN_MESSAGE_NOTIFICATIONS_TOGETHER", default: true},
			{name: "JOIN_INVITE_NOTIFICATIONS_TOGETHER", default: true},
		]
	])
}

export default Settings