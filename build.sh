#!/bin/sh

updateRepo() {
  if test -d "$1"; then
    echo "$1 already exists, pulling new commits.."
    cd "$1" && git pull
    cd ..
  else
    echo "$1 does not exist, cloning.."
    git clone "https://github.com/edcd/$1.git"
  fi
}

updateRepo "coriolis"
updateRepo "coriolis-data"

# Install node modules of coriolis-data and generate dist
cd "coriolis-data" || exit 1
npm i && node generate_distribution.js
cd ..

# Install node modules of coriolis-api
npm i

# build api
python3 generate_api.py
