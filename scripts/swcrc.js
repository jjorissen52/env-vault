#!/usr/bin/env node

/* eslint-disable @typescript-eslint/no-var-requires */
const fs = require("fs");
const path = require("path");
const swcConfig = require("tsconfig-to-swcconfig");

const projectDir = path.dirname(__dirname);
const swcrc = path.resolve(projectDir, ".swcrc");

fs.writeFileSync(swcrc, JSON.stringify(swcConfig.convert(), null, 2));
