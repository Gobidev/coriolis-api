#!/bin/sh
set -eu

if ! command -v screen >/dev/null 2>&1; then
  echo "screen is required to run this script" >&2
  exit 1
fi

# Stop the running API, if any.
if screen -ls | grep -q coriolis-api; then
  echo "Running api found, terminating.."
  screen -XS coriolis-api quit
fi

# Update and rebuild the API.
./build.sh

# Start the API.
screen -L -Logfile api.log -mdS coriolis-api node coriolis-api.js
