#!/bin/sh

# chdir to parent directory
cd "$(dirname "$0")/..";

# start server
NODE_PATH=server/ node server/index.js;
