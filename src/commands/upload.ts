import { Command } from 'commander';
import * as fs from 'fs';
import * as path from 'path';
import { DriveService } from '../services/driveService.js';
import { logger } from '../utils/logger.js';
import { createSpinner } from '../utils/spinner.js';

export function uploadCommand(program: Command): void {
  // Basic upload command
  program
    .command('upload [files...]')
    .description('Upload files to Google Drive')
    .option('-f, --folder <folder>', 'Destination folder in Google Drive')
    .option('-n, --name <name>', 'Custom name for the uploaded file')
    .action(async (files, options) => {
      if (files.length === 0) {
        logger.error('No files specified for upload');
        return;
      }

      const spinner = createSpinner('Uploading files to Google Drive');
      const driveService = new DriveService();

      try {
        for (const file of files) {
          spinner.text = `Uploading ${file}...`;
          await driveService.uploadFile(file, options.folder, options.name);
        }

        spinner.succeed(`Successfully uploaded ${files.length} file(s)`);
      } catch (error) {
        spinner.fail('Upload failed');
        logger.error(error instanceof Error ? error.message : String(error));
      }
    });

  // Directory upload command
  program
    .command('directory <dir>')
    .alias('d')
    .description('Upload a directory to Google Drive')
    .option('-f, --folder <folder>', 'Destination folder in Google Drive')
    .option('-n, --name <name>', 'Custom name for the uploaded directory')
    .option('-r, --recursive', 'Upload recursively', true)
    .action(async (dir, options) => {
      if (!fs.existsSync(dir)) {
        logger.error(`Directory "${dir}" does not exist`);
        return;
      }

      if (!fs.statSync(dir).isDirectory()) {
        logger.error(`"${dir}" is not a directory`);
        return;
      }

      const spinner = createSpinner(`Uploading directory "${dir}" to Google Drive`);
      const driveService = new DriveService();

      try {
        await driveService.uploadDirectory(dir, options.folder, options.name, options.recursive);
        spinner.succeed(`Successfully uploaded directory "${dir}"`);
      } catch (error) {
        spinner.fail('Directory upload failed');
        logger.error(error instanceof Error ? error.message : String(error));
      }
    });
}
