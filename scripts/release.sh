#!/usr/bin/env bash

cleanup() {
  rm -f ev-macos ev-linux ev-win.exe
  rm -rf ./dist
}
trap cleanup EXIT

yarn build
yarn compile:all

gh release create "$(jq < ./package.json -r ".version")" \
  './ev-macos#MacOs Binary' \
  './ev-linux#Linux Binary' \
  './ev-win.exe#Windows Binary'
