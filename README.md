## What?
Synchronize your local environment from a secrets vault.

## Which?
Just 1password so far.

## Supports
Any functionality not indicated on the above support table is purely serendipitous.

| Platform | Arch  | Support |
|----------|-------|---------|
| MacOs    | amd64 | ✅       |
| MacOs    | m1    | ❓       |
| Linux    | amd64 | ✅       |
| Windows  | amd64 | ❌       |
| Other    | Other | ❌       |

Legend:

| Symbol | Status                  |
|--------|-------------------------|
| ✅      | Target platform         |
| ❓      | Not explicitly excluded |
| ❌      | No intention to support |

## Installation

You can add it to your current project with
```bash
npm install @jjorissen52/env-vault

# optional alias (assuming GNU readlink)
alias ev="$(readlink -f ./node_modules/.bin/ev)"
```

Or you can download the latest binary, found in the GitHub releases.

## Setup
Configuration is stored by default in `$HOME/.config/ev.json`. You can change the location like so:
```bash
export EV_CONFIG_DIR=~/.config/better-place.json
```

## Usage
At a high level, you create "comparison configurations" where you provide a path to a template
and a corresponding location to save the result environment file, and `ev` will populate your
file.

### Concepts
#### Comparison Configurations
These are descriptions of how to populate an env file. Any given comparison configuration should contain everything necessary
to populate an environment file.

#### Global Defaults
All comparison configuration options inherit from these when left unspecified.

#### Vault Defaults
Each vault has its own way of authenticating and thus its own set of defaults.
Comparison configuration options inherit from these when left unspecified. Note that right now
only the 1password vault type is supported.

### Examples
**Note: most examples below assume you have an alias or `ev` on your path.**

```bash
# show the location where your `ev` config will be stored
yarn ev config locate # using yarn
npx ev config locate # using npm
ev config locate # alias or binary on path


# show your entire ev config
ev config show

# add or update an existing comparison configuration
ev config 1password set test4 \
  --record test.record \
  --address my-org \
  --email example@email.com

# show a specific comparison configuration
ev config show test4
#{
#  "vault_type": "1password",
#  "name": "test4",
#  "address": "my-org",
#  "email": "example@email.com",
#  "vault": "My Vault",
#  "record": "test.record",
#  "template_path": "<path>",
#  "env_file_path": "<path>"
#}

# set the default template and environment file locations
ev config defaults \
  --template ./envs/dev.env \
  --env .env

# set defaults for the 1password configurations
ev config 1password defaults \
  --vault "My Vault" \
  --address my-org \
  --email email@example.com
```


## Attributions
This project started from the template [typescript-boilerplate](https://github.com/metachris/typescript-boilerplate/tree/v0.4.2), which is a fantastic asset. Thank you, metacris.
