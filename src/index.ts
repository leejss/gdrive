#!/usr/bin/env node

import { program } from 'commander';
import { uploadCommand } from './commands/upload.js';
import { listCommand } from './commands/list.js';
import { searchCommand } from './commands/search.js';
import { downloadCommand } from './commands/download.js';
import { authCommand } from './commands/auth.js';
import { shareCommand } from './commands/share.js';
import { removeCommand } from './commands/remove.js';
import { version } from '../package.json';

// Setup the CLI program
program.name('gup').description('Google Drive Command Line Uploader').version(version);

// Register commands
uploadCommand(program);
listCommand(program);
searchCommand(program);
downloadCommand(program);
authCommand(program);
shareCommand(program);
removeCommand(program);

// Parse command line arguments
program.parse(process.argv);

// Display help if no arguments provided
if (process.argv.length === 2) {
  program.outputHelp();
}
