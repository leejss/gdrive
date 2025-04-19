import { Command } from 'commander';
import inquirer from 'inquirer';
import { DriveService } from '../services/driveService.js';
import { logger } from '../utils/logger.js';
import { createSpinner } from '../utils/spinner.js';

export function removeCommand(program: Command, driveService: DriveService): void {
  program
    .command('remove <fileId>')
    .alias('rm')
    .description('Remove a file from Google Drive')
    .option('-f, --force', 'Skip confirmation', false)
    .action(async (fileId, options) => {
      try {
        // Get file details
        const spinner = createSpinner('Getting file information');
        const fileInfo = await driveService.getFileInfo(fileId);
        spinner.stop();

        if (!fileInfo) {
          logger.error(`File with ID "${fileId}" not found`);
          return;
        }

        // Confirm deletion unless force flag is set
        if (!options.force) {
          const answer = await inquirer.prompt([
            {
              type: 'confirm',
              name: 'confirm',
              message: `Are you sure you want to delete "${fileInfo.name}"?`,
              default: false,
            },
          ]);

          if (!answer.confirm) {
            logger.info('Operation cancelled');
            return;
          }
        }

        // Delete the file
        const deleteSpinner = createSpinner(`Deleting "${fileInfo.name}"`);
        await driveService.deleteFile(fileId);
        deleteSpinner.succeed(`Deleted "${fileInfo.name}"`);
      } catch (error) {
        logger.error('Delete failed');
        logger.error(error instanceof Error ? error.message : String(error));
      }
    });
}
