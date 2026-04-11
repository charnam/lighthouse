BEGIN TRANSACTION;
CREATE TABLE IF NOT EXISTS "friend_requests" (
	"id"	INTEGER,
	"requestor"	TEXT NOT NULL,
	"requestee"	TEXT NOT NULL,
	"creation"	INTEGER,
	PRIMARY KEY("id" AUTOINCREMENT),
	FOREIGN KEY("requestee") REFERENCES "users"("userid"),
	FOREIGN KEY("requestor") REFERENCES "users"("userid")
);
CREATE TABLE IF NOT EXISTS "friends" (
	"id"	INTEGER,
	"userid1"	TEXT NOT NULL,
	"userid2"	TEXT NOT NULL,
	"programid"	TEXT,
	"creation"	INTEGER NOT NULL DEFAULT 0,
	PRIMARY KEY("id" AUTOINCREMENT),
	FOREIGN KEY("programid") REFERENCES "programs"("programid"),
	FOREIGN KEY("userid1") REFERENCES "users"("userid"),
	FOREIGN KEY("userid2") REFERENCES "users"("userid")
);
CREATE TABLE IF NOT EXISTS "group_invites" (
	"id"	INTEGER NOT NULL UNIQUE,
	"from_userid"	TEXT NOT NULL,
	"to_userid"	TEXT NOT NULL,
	"groupid"	TEXT NOT NULL,
	"creation"	INTEGER NOT NULL,
	PRIMARY KEY("id" AUTOINCREMENT),
	FOREIGN KEY("from_userid") REFERENCES "users"("userid"),
	FOREIGN KEY("groupid") REFERENCES "groups"("groupid"),
	FOREIGN KEY("to_userid") REFERENCES "users"("userid")
);
CREATE TABLE IF NOT EXISTS "groups" (
	"groupid"	TEXT NOT NULL UNIQUE,
	"userid"	TEXT NOT NULL,
	"groupname"	INTEGER NOT NULL,
	"icon"	TEXT,
	"wallpaper"	TEXT,
	"creation"	INTEGER NOT NULL,
	"modification"	INTEGER NOT NULL,
	PRIMARY KEY("groupid"),
	FOREIGN KEY("icon") REFERENCES "uploads"("uploadid"),
	FOREIGN KEY("userid") REFERENCES "users"("userid"),
	FOREIGN KEY("wallpaper") REFERENCES "uploads"("uploadid")
);
CREATE TABLE IF NOT EXISTS "message_attachments" (
	"messageid"	TEXT NOT NULL,
	"uploadid"	TEXT NOT NULL,
	FOREIGN KEY("messageid") REFERENCES "messages"("messageid"),
	FOREIGN KEY("uploadid") REFERENCES "uploads"("uploadid")
);
CREATE TABLE IF NOT EXISTS "message_mentions" (
	"id"	INTEGER NOT NULL,
	"messageid"	TEXT NOT NULL,
	"userid"	TEXT NOT NULL,
	PRIMARY KEY("id" AUTOINCREMENT),
	FOREIGN KEY("messageid") REFERENCES "messages"("messageid"),
	FOREIGN KEY("userid") REFERENCES "users"("userid")
);
CREATE TABLE IF NOT EXISTS "messages" (
	"messageid"	TEXT NOT NULL,
	"userid"	TEXT NOT NULL,
	"programid"	TEXT NOT NULL,
	"content"	TEXT NOT NULL,
	"attachments"	TEXT NOT NULL DEFAULT '[]',
	"creation"	INTEGER NOT NULL,
	"edits"	INTEGER NOT NULL DEFAULT 0,
	"reply_to"	TEXT,
	PRIMARY KEY("messageid"),
	FOREIGN KEY("userid") REFERENCES "users"("userid")
);
CREATE TABLE IF NOT EXISTS "notifications" (
	"id"	TEXT NOT NULL UNIQUE,
	"userid"	TEXT NOT NULL,
	"content"	TEXT NOT NULL,
	"seenAt"	INTEGER,
	"creation"	INTEGER NOT NULL,
	PRIMARY KEY("id"),
	FOREIGN KEY("userid") REFERENCES "users"("userid")
);
CREATE TABLE IF NOT EXISTS "program_notification_overrides" (
	"userid"	TEXT NOT NULL,
	"programid"	TEXT NOT NULL,
	"preferences"	INTEGER
);
CREATE TABLE IF NOT EXISTS "programs" (
	"programid"	TEXT NOT NULL,
	"type"	TEXT NOT NULL DEFAULT 'text',
	"groupid"	TEXT,
	"is_dm"	INTEGER DEFAULT 0,
	"name"	TEXT NOT NULL,
	"position"	INTEGER,
	"default_permissions"	TEXT NOT NULL DEFAULT 3,
	"creation"	INTEGER NOT NULL,
	"modification"	INTEGER NOT NULL,
	"info_content"	TEXT NOT NULL DEFAULT '',
	PRIMARY KEY("programid"),
	FOREIGN KEY("groupid") REFERENCES "groups"("groupid")
);
CREATE TABLE IF NOT EXISTS "read_indicators" (
	"id"	INTEGER UNIQUE,
	"userid"	TEXT NOT NULL,
	"messageid"	TEXT NOT NULL,
	"creation"	INTEGER NOT NULL,
	PRIMARY KEY("id" AUTOINCREMENT),
	FOREIGN KEY("messageid") REFERENCES "messages"("messageid"),
	FOREIGN KEY("userid") REFERENCES "users"("userid")
);
CREATE TABLE IF NOT EXISTS "role_assignation" (
	"id"	INTEGER NOT NULL UNIQUE,
	"userid"	TEXT NOT NULL,
	"roleid"	TEXT NOT NULL,
	PRIMARY KEY("id" AUTOINCREMENT),
	FOREIGN KEY("roleid") REFERENCES "roles"("roleid"),
	FOREIGN KEY("userid") REFERENCES "users"("userid")
);
CREATE TABLE IF NOT EXISTS "role_program_permissions" (
	"roleid"	TEXT NOT NULL,
	"programid"	TEXT NOT NULL,
	"allow_permissions"	INTEGER NOT NULL DEFAULT 0,
	"deny_permissions"	INTEGER NOT NULL DEFAULT 0,
	FOREIGN KEY("programid") REFERENCES "programs"("programid"),
	FOREIGN KEY("roleid") REFERENCES "roles"("roleid")
);
CREATE TABLE IF NOT EXISTS "roles" (
	"roleid"	TEXT NOT NULL UNIQUE,
	"name"	TEXT NOT NULL,
	"groupid"	TEXT NOT NULL,
	"allow_permissions"	INTEGER NOT NULL DEFAULT 0,
	"deny_permissions"	INTEGER NOT NULL DEFAULT 0,
	"position"	INTEGER NOT NULL DEFAULT 0,
	"icon"	TEXT,
	PRIMARY KEY("roleid"),
	FOREIGN KEY("groupid") REFERENCES "groups"("groupid"),
	FOREIGN KEY("icon") REFERENCES "uploads"("uploadid")
);
CREATE TABLE IF NOT EXISTS "tokens" (
	"token"	TEXT NOT NULL UNIQUE,
	"userid"	TEXT NOT NULL,
	"password"	TEXT NOT NULL,
	"creation"	INTEGER NOT NULL,
	PRIMARY KEY("token")
);
CREATE TABLE IF NOT EXISTS "uploads" (
	"uploadid"	TEXT NOT NULL UNIQUE,
	"userid"	TEXT,
	"type"	TEXT NOT NULL,
	"originalname"	TEXT NOT NULL DEFAULT 'file',
	"filename"	TEXT NOT NULL UNIQUE,
	"mimetype"	TEXT NOT NULL,
	"size"	INTEGER NOT NULL,
	"autodelete"	INTEGER NOT NULL DEFAULT 1,
	PRIMARY KEY("uploadid"),
	FOREIGN KEY("userid") REFERENCES "users"("userid")
);
CREATE TABLE IF NOT EXISTS "user_group_relationships" (
	"id"	INTEGER UNIQUE,
	"userid"	TEXT NOT NULL,
	"groupid"	TEXT NOT NULL,
	"position"	INTEGER NOT NULL DEFAULT 0,
	PRIMARY KEY("id" AUTOINCREMENT),
	FOREIGN KEY("groupid") REFERENCES "groups"("groupid"),
	FOREIGN KEY("userid") REFERENCES "users"("userid")
);
CREATE TABLE IF NOT EXISTS "users" (
	"userid"	TEXT NOT NULL,
	"username"	TEXT NOT NULL,
	"password"	TEXT NOT NULL,
	"displayname"	TEXT NOT NULL,
	"permissions"	INTEGER NOT NULL DEFAULT 1,
	"pfp"	TEXT,
	"wallpaper"	TEXT,
	"bio"	TEXT NOT NULL DEFAULT '',
	"status"	TEXT NOT NULL DEFAULT '',
	"creation"	INTEGER NOT NULL,
	"modification"	INTEGER NOT NULL DEFAULT 0,
	"settings"	INTEGER NOT NULL DEFAULT 0,
	"notifications"	INTEGER NOT NULL DEFAULT 0,
	PRIMARY KEY("userid"),
	FOREIGN KEY("pfp") REFERENCES "uploads"("uploadid"),
	FOREIGN KEY("wallpaper") REFERENCES "uploads"("uploadid")
);
COMMIT;
