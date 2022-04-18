#!/usr/bin/env bash

if [ -z "$1" ]; then
  echo "Please specify a release tag. exiting."
  exit 1
fi

cleanup() {
  rm -f dist
  rm -f ev-mac ev-linux ev.exe
}
trap cleanup EXIT

yarn compile:all

gh release create "$1" \
  './ev-macos#MacOs Binary' \
  './ev-linux#Linux Binary' \
  './ev-win.exe#Windows Binary' \
  "$@"
