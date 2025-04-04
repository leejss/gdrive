import { Command } from 'commander';
import * as path from 'path';
import * as fs from 'fs';
import { DriveService } from '../services/driveService.js';
import { logger } from '../utils/logger.js';
import { createSpinner } from '../utils/spinner.js';
import { config } from '../config/config.js';

export function downloadCommand(program: Command): void {
  program
    .command('get <fileId>')
    .alias('g')
    .description('Download a file from Google Drive')
    .option('-o, --output <path>', 'Output directory for the downloaded file')
    .option('-n, --name <name>', 'Save the file with a different name')
    .action(async (fileId, options) => {
      const spinner = createSpinner('Downloading file from Google Drive');
      const driveService = await DriveService.create();

      try {
        // Determine output directory
        let outputDir = options.output || config.get('defaultDownloadLocation') || process.cwd();
        outputDir = path.resolve(outputDir);

        // Create output directory if it doesn't exist
        if (!fs.existsSync(outputDir)) {
          fs.mkdirSync(outputDir, { recursive: true });
        }

        // Get file details
        spinner.text = 'Getting file information...';
        const fileInfo = await driveService.getFileInfo(fileId);

        if (!fileInfo) {
          spinner.fail(`File with ID "${fileId}" not found`);
          return;
        }

        // Determine output filename
        const outputFileName = options.name || fileInfo.name;
        const outputPath = path.join(outputDir, outputFileName);

        // Download the file
        spinner.text = `Downloading "${fileInfo.name}"...`;
        await driveService.downloadFile(fileId, outputPath);

        spinner.succeed(`Downloaded "${fileInfo.name}" to ${outputPath}`);
      } catch (error) {
        spinner.fail('Download failed');
        logger.error(error instanceof Error ? error.message : String(error));
      }
    });
}
