#!/usr/bin/env node
/***
 * This file exists solely to have an entrypoint with a node shebang at the top so shells
 * know what to do with the outputted .js module.
 */

// @ts-ignore
import program from "./cli";

program.parse(process.argv);
