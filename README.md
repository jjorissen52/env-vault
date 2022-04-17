## What?
This bot pretty much just exists to tell me when a GPU has become available.

## Installation

Clone this repository, and run `yarn install`. The CLI will be available with the command `yarn cli`.

You can use yarn to interface with the CLI, but I recommend creating an alias instead. It's much faster.

```bash
alias cli="./node_modules/.bin/ts-node src/cli.ts"
```

## Setup
The bot keeps configuration in `config.json` in the project root. Set it up with your bot like so:

```bash
cli config --token <your discord token> --client-id <your bots client id>
```

You can then register the slash commands with your guild (or "server" as they are often called):
```bash
cli register <guildId>
```

## Attributions
This project started from the template [typescript-boilerplate](https://github.com/metachris/typescript-boilerplate/tree/v0.4.2), which is a fantastic asset. Thank you, metacris.