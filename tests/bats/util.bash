ev () {
   ./dist/src/bin.js "$@"
}

abspath () {
  if command -v "greadlink" > /dev/null; then
    greadlink -f "$1"
  else
    readlink -f "$1"
  fi
}

check-config() {
  jq -r "." $(ev config locate) > /dev/null
}

delete-config() {
  rm -f $(ev config locate)
}

generate-global-defaults() {
  template=$(mktemp)
  env_file=$(mktemp)
  ev config defaults \
    --env "$env_file" \
    --template "$template"
  check-config
}

setup () {
  export EV_CONFIG_DIR="$(mktemp -d)"
}

teardown () {
  rm -rf "$EV_CONFIG_DIR"
}