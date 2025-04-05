import './bootstrap.js';
import { Command, program } from 'commander';
import { uploadCommand } from './commands/upload.js';
import { listCommand } from './commands/list.js';
import { downloadCommand } from './commands/download.js';
import { authCommand } from './commands/auth.js';
import { removeCommand } from './commands/remove.js';
import { showCommand } from './commands/show.js';

program.name('gdrive').description('Google Drive Command Line Uploader').version('1.0.0');
registerCommands(program);
program.parse(process.argv);
if (process.argv.length === 2) {
  program.outputHelp();
}

function registerCommands(program: Command) {
  authCommand(program);
  uploadCommand(program);
  listCommand(program);
  downloadCommand(program);
  removeCommand(program);
  showCommand(program);
}
