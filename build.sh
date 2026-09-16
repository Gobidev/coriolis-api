#!/bin/sh
set -eu

# Clone or update one of the upstream EDCD repositories.
updateRepo() {
  name="$1"
  repo="https://github.com/edcd/$name.git"
  if [ -d "$name/.git" ]; then
    echo "$name already exists, pulling new commits.."
    git -C "$name" pull --ff-only
  else
    echo "$name does not exist, cloning.."
    git clone "$repo" "$name"
  fi
}

updateRepo coriolis
updateRepo coriolis-data

# Generate the coriolis-data distribution (requires uglify-js).
if [ -f coriolis-data/package-lock.json ]; then
  ( cd coriolis-data && npm ci )
else
  ( cd coriolis-data && npm install )
fi
( cd coriolis-data && node generate_distribution.js )

# Install the API dependencies and bundle the API.
if [ -f package-lock.json ]; then
  npm ci
else
  npm install
fi
npm run build
