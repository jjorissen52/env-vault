#!/usr/bin/env bash

if [ -z "$1" ]; then
  echo "Please specify a release tag. exiting."
  exit 1
fi

cleanup() {
  rm -f ev-macos ev-linux ev-win.exe
  rm -rf ./dist
}
trap cleanup EXIT

yarn build
yarn compile:all

gh release create "$1" \
  './ev-macos#MacOs Binary' \
  './ev-linux#Linux Binary' \
  './ev-win.exe#Windows Binary'
