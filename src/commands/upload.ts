import { Command } from 'commander';
import * as fs from 'fs';
import { DriveService } from '../services/driveService.js';
import { logger } from '../utils/logger.js';
import { createSpinner } from '../utils/spinner.js';

export function uploadCommand(program: Command, driveService: DriveService) {
  program
    .command('upload [files...]')
    .description('Upload files to Google Drive')
    .option('-f, --folderId <folderId>', 'Destination folder in Google Drive')
    .action(async (files: string[], options: { folderId?: string }) => {
      if (files.length === 0) {
        logger.error('No files specified for upload');
        return;
      }

      if (files.length === 1 && (files[0] === '.' || files[0] === './')) {
        const currentDir = process.cwd();
        const dirContents = fs.readdirSync(currentDir, { withFileTypes: true });

        const filteredContents = dirContents.filter(
          content =>
            !content.name.startsWith('.') &&
            content.name !== 'node_modules' &&
            content.name !== 'DS_Store'
        );

        for (const file of filteredContents) {
          if (file.isDirectory()) {
            await driveService.uploadDirectory(file.name, options.folderId);
          } else {
            await driveService.uploadFile(file.name, options.folderId);
          }
        }
        return;
      }

      const spinner = createSpinner('Uploading files to Google Drive');

      try {
        for (const file of files) {
          spinner.text = `Uploading ${file}...`;
          await driveService.uploadFile(file, options.folderId);
          logger.success(`Successfully uploaded ${file}`);
        }
        spinner.succeed(`Successfully uploaded ${files.length} file(s)`);
        process.exit(0);
      } catch (error) {
        spinner.fail('Upload failed');
        logger.error(error instanceof Error ? error.message : String(error));
        process.exit(1);
      }
    });

  // Directory upload command
  program
    .command('directory <dir>')
    .alias('d')
    .description('Upload a directory to Google Drive')
    .option('-f, --folderId <folderId>', 'Destination folderId in Google Drive')
    .option('-r, --recursive', 'Upload recursively', true)
    .action(async (dir: string, options: { folderId?: string; recursive?: boolean }) => {
      if (!fs.existsSync(dir)) {
        logger.error(`Directory "${dir}" does not exist`);
        return;
      }

      if (!fs.statSync(dir).isDirectory()) {
        logger.error(`"${dir}" is not a directory`);
        return;
      }

      const spinner = createSpinner(`Uploading directory "${dir}" to Google Drive`);
      try {
        await driveService.uploadDirectory(dir, options.folderId, options.recursive);
        spinner.succeed(`Successfully uploaded directory "${dir}"`);
        process.exit(0);
      } catch (error) {
        spinner.fail('Directory upload failed');
        logger.error(error instanceof Error ? error.message : String(error));
        process.exit(1);
      }
    });
}
