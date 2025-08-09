#!/bin/sh

cd "$(dirname "$0")/..";
NODE_PATH=server/ node server/index.js;
