#!/usr/bin/env bash

if [ -z "$1" ]; then
  echo "Please specify a release tag. exiting."
  exit 1
fi

cleanup() {
  rm -f ev-mac ev-linux ev.exe
}
trap cleanup EXIT

yarn compile:mac && mv ev ev-mac
yarn compile:linux && mv ev ev-linux
yarn compile:win

gh release create "$1" \
  './ev-mac#MacOs Binary' \
  './ev-linux#Linux Binary' \
  './ev.exe#Windows Binary'
