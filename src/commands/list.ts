import { Command } from 'commander';
import { DriveService } from '../services/driveService.js';
import { logger } from '../utils/logger.js';
import { createSpinner } from '../utils/spinner.js';
import { formatFileList } from '../utils/formatter.js';

export function listCommand(program: Command): void {
  program
    .command('list [folder]')
    .alias('ls')
    .description('List files and folders in Google Drive')
    .option('-v, --verbose', 'Show detailed information')
    .option('-t, --type <type>', 'Filter by file type (e.g., document, image, video)')
    .action(async (folder, options) => {
      const spinner = createSpinner('Fetching files from Google Drive');
      const driveService = new DriveService();

      try {
        const files = await driveService.listFiles(folder, options.type);
        spinner.succeed(`Found ${files.length} file(s)`);

        if (files.length > 0) {
          console.log(formatFileList(files, options.verbose));
        } else {
          logger.info('No files found');
        }
      } catch (error) {
        spinner.fail('Failed to list files');
        logger.error(error instanceof Error ? error.message : String(error));
      }
    });
}
