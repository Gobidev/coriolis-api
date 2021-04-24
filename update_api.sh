#!/bin/sh

# check for running api
check_screen=$(screen -ls | grep coriolis-api)

if [ "$check_screen" != "" ]; then
  echo "Running api found, terminating.."
  screen -XS coriolis-api quit
fi

# update api
. build.sh

# start api
screen -mdS coriolis-api node index.js
