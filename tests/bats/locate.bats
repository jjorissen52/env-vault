#!/usr/bin/env bats

load util

@test "config location can be set with EV_CONFIG_DIR" {
  result="$(ev config locate)"
  [ "$result" == "$EV_CONFIG_DIR/ev.json" ]
}

@test "locate even if the config path doesn't exist" {
  result="$(ev config locate)"
  [ "$result" == "$EV_CONFIG_DIR/ev.json" ]
}

@test "locate even if the config path is a directory " {
  mkdir "$EV_CONFIG_DIR/ev.json"
  result="$(ev config locate)"
  [ "$result" == "$EV_CONFIG_DIR/ev.json" ]
}