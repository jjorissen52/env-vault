#!/usr/bin/env node

/* eslint-disable @typescript-eslint/no-var-requires */
const fs = require("fs");
const path = require("path");
const swcConfig = require("tsconfig-to-swcconfig");

const projectDir = path.dirname(__dirname);
const swcrcPath = path.resolve(projectDir, ".swcrc");
const swcrc = swcConfig.convert();
swcrc.module.strict = false;

fs.writeFileSync(swcrcPath, JSON.stringify(swcrc, null, 2));
