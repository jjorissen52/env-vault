load util

@test "shows config" {
  ev config show | jq
}

@test "config saved once written" {
  ev config show 2>&1 > /dev/null
  # config is not a file
  [ ! -f "$(ev config locate)" ]
  ev config defaults --env .
  # config is a json file
  check-config
}

@test "sets defaults" {
  location=$(ev config locate)
  env_dest=.env
  template_dest=template.env

  # one at a time
  ev config defaults --env $env_dest
  ev config defaults --template $template_dest
  check-config

  env_path=$(jq -r ".default_env_file_path" $location)
  template_path=$(jq -r ".default_template_path" $location)
  [ "$env_path" == "$env_dest" ]
  [ "$template_path" == "$template_dest" ]
  delete-config

  # all at once
  ev config defaults \
    --env $env_dest \
    --template $template_dest
  check-config

  env_path=$(jq -r ".default_env_file_path" $location)
  template_path=$(jq -r ".default_template_path" $location)
  [ "$env_path" == "$env_dest" ]
  [ "$template_path" == "$template_dest" ]
  delete-config
}

check-1password () {
  config_name="$1"
  env="$(abspath "$2")"
  template="$(abspath "$3")"
  address="$4"
  email="$5"
  vault="$6"
  record="$7"
  location="$(ev config locate)"
  get () {
    jq -r ".comparisons.$config_name$1" $location
  }

  # env file matches
  [ "$(get .env_file_path)" == "$env" ]
  # template matches
  [ "$(get .template_path)" == "$template" ]
  # address matches
  [ "$(get .address)" == "$address" ]
  # email matches
  [ "$(get .email)" == "$email" ]
  # vault matches
  [ "$(get .vault)" == "$vault" ]
  # record matches
  [ "$(get .record)" == "$record" ]
}

@test "adds comparisons" {
  ev config 1password set 'test' \
    --env .env \
    --template template.env \
    --address myaddress \
    --email myemail \
    --vault 'Software Engineering' \
    --record 'test.db.env'

  check-1password 'test' .env template.env myaddress myemail 'Software Engineering' 'test.db.env'
}

@test "adds comparisons when defaults are set" {
  generate-global-defaults
  env_path=$(jq -r ".default_env_file_path" <(ev config defaults))
  template_path=$(jq -r ".default_template_path" <(ev config defaults))

  ev config 1password set 'test' \
    --address myaddress \
    --email myemail \
    --vault 'Software Engineering' \
    --record 'test.db.env'
  check-config

  check-1password 'test' "$env_path" "$template_path" myaddress myemail 'Software Engineering' 'test.db.env'
}


@test "adds 1password comparisons when 1password defaults are set" {
  generate-global-defaults
  ev config 1password defaults --vault 'Software Engineering' --address myaddress --email myemail

  env_path=$(jq -r ".default_env_file_path" <(ev config defaults))
  template_path=$(jq -r ".default_template_path" <(ev config defaults))
  vault=$(jq -r '.vault_defaults["1password"].vault' <(ev config 1password defaults))
  address=$(jq -r '.vault_defaults["1password"].address' <(ev config 1password defaults))
  email=$(jq -r '.vault_defaults["1password"].email' <(ev config 1password defaults))

  ev config 1password set 'test' \
    --vault 'Software Engineering' \
    --record 'test.db.env'
  check-config

  check-1password 'test' "$env_path" "$template_path" myaddress myemail 'Software Engineering' 'test.db.env'
}
