import { program } from 'commander';
import { uploadCommand } from './commands/upload.js';
import { listCommand } from './commands/list.js';
import { searchCommand } from './commands/search.js';
import { downloadCommand } from './commands/download.js';
import { authCommand } from './commands/auth.js';
import { shareCommand } from './commands/share.js';
import { removeCommand } from './commands/remove.js';
import dotenv from 'dotenv';

dotenv.config();

/* -------------------------------------------------------------------------- */
/*                              Setup CLI Program                             */
/* -------------------------------------------------------------------------- */
program.name('gd-up').description('Google Drive Command Line Uploader').version('1.0.0');

/* -------------------------------------------------------------------------- */
/*                              Register Commands                             */
/* -------------------------------------------------------------------------- */
uploadCommand(program);
listCommand(program);
searchCommand(program);
downloadCommand(program);
authCommand(program);
removeCommand(program);
// shareCommand(program);

/* -------------------------------------------------------------------------- */
/*                              Parse Command Line                            */
/* -------------------------------------------------------------------------- */
// Parse command line arguments
program.parse(process.argv);

/* -------------------------------------------------------------------------- */
/*                              Display Help                                */
/* -------------------------------------------------------------------------- */
// Display help if no arguments provided
if (process.argv.length === 2) {
  program.outputHelp();
}
