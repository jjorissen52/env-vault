#!/usr/bin/env bash

cleanup() {
  rm -rf dist
}
trap cleanup EXIT

yarn -s build && chmod +x dist/src/bin.js
bats tests/bats
