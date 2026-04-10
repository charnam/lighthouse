#!/bin/sh

# chdir to server directory
cd "$(dirname "$0")/server/";

# don't do dependency install if fast startup is desired
if ! [ "$1" = "--quick" ]; then
	# install dependencies
	npm install
	
	# chdir to non-server directory
	cd "$(dirname "$0")/assets/";
	
	# install dependencies
	npm install;
fi

# leave directory
cd ..

# start server
cd server;
node index.js;
