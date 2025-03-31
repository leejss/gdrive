import { Command } from 'commander';
import { DriveService } from '../services/driveService.js';
import { logger } from '../utils/logger.js';
import { createSpinner } from '../utils/spinner.js';

export function shareCommand(program: Command): void {
  program
    .command('share <fileId>')
    .description('Share a file with others')
    .requiredOption('--with <email>', 'Email address to share with')
    .option('--role <role>', 'Permission role (reader, writer, commenter)', 'reader')
    .option('--message <message>', 'Optional message to include in the notification email')
    .option('--notify', 'Send notification email', true)
    .action(async (fileId, options) => {
      const spinner = createSpinner('Sharing file');
      const driveService = await DriveService.create();

      try {
        // Validate role
        const validRoles = ['reader', 'writer', 'commenter'];
        if (!validRoles.includes(options.role)) {
          spinner.fail(`Invalid role: ${options.role}`);
          logger.error(`Role must be one of: ${validRoles.join(', ')}`);
          return;
        }

        // Get file details
        spinner.text = 'Getting file information...';
        const fileInfo = await driveService.getFileInfo(fileId);

        if (!fileInfo) {
          spinner.fail(`File with ID "${fileId}" not found`);
          return;
        }

        // Share the file
        spinner.text = `Sharing "${fileInfo.name}" with ${options.with}...`;
        await driveService.shareFile(
          fileId,
          options.with,
          options.role,
          options.notify,
          options.message
        );

        spinner.succeed(`Shared "${fileInfo.name}" with ${options.with} (${options.role})`);
      } catch (error) {
        spinner.fail('Sharing failed');
        logger.error(error instanceof Error ? error.message : String(error));
      }
    });
}
