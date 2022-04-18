## What?
Synchronize your local environment from a secrets vault.

## Which?
Just 1password so far.

## Installation

Clone this repository, and run `yarn install`. The CLI will be available with the command `yarn ev`.

You can also generate a binary which will be named `ev`:
```bash
# pick your poison, x64 only
yarn compile:mac
yarn compile:linux
yarn compile:win
```

Or an alias...
```bash
alias ev="./src/cli.ts"
```

## Setup
Configuration is stored by default in `$HOME/.config/ev.json`. You can change the location like so:
```bash
export EV_CONFIG_DIR=~/.config/better-place.json
```
You can always check where `ev` is looking for a config file with `ev config locate`.


## Attributions
This project started from the template [typescript-boilerplate](https://github.com/metachris/typescript-boilerplate/tree/v0.4.2), which is a fantastic asset. Thank you, metacris.
