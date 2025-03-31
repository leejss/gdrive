import { Command } from 'commander';
import { DriveService } from '../services/driveService.js';
import { logger } from '../utils/logger.js';
import { createSpinner } from '../utils/spinner.js';
import { formatFileList } from '../utils/formatter.js';

export function searchCommand(program: Command): void {
  program
    .command('search <query>')
    .alias('s')
    .description('Search for files in Google Drive')
    .option('-t, --type <type>', 'Filter by file type (e.g., document, image, video)')
    .option('-v, --verbose', 'Show detailed information')
    .action(async (query, options) => {
      const spinner = createSpinner(`Searching for "${query}" in Google Drive`);
      const driveService = await DriveService.create();

      try {
        const files = await driveService.searchFiles(query, options.type);
        spinner.succeed(`Found ${files.length} file(s) matching "${query}"`);

        if (files.length > 0) {
          console.log(formatFileList(files, options.verbose));
        } else {
          logger.info('No matching files found');
        }
      } catch (error) {
        spinner.fail('Search failed');
        logger.error(error instanceof Error ? error.message : String(error));
      }
    });
}
