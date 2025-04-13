import { Command } from 'commander';
import { config } from '../config/config.js';
import { DriveService } from '../services/driveService.js';
import { logger } from '../utils/logger.js';
import { createSpinner } from '../utils/spinner.js';
import chalk from 'chalk';
import boxen from 'boxen';

export function showCommand(program: Command): void {
  const showCommand = program.command('show').description('Display information');

  showCommand
    .command('config')
    .description('Display configuration')
    .action(() => {
      const allConfig = config.getAllConfig();

      // Format config object to string with color highlighting
      const configString = Object.entries(allConfig)
        .map(
          ([key, value]) => `${chalk.cyan(key)}: ${chalk.yellow(JSON.stringify(value, null, 2))}`
        )
        .join('\n\n');

      // Display in a box with title
      console.log(
        boxen(configString, {
          title: chalk.green.bold('Configuration'),
          titleAlignment: 'center',
          padding: 1,
          margin: 1,
          borderStyle: 'round',
          borderColor: 'green',
        })
      );
    });

  // 현재 폴더 정보 보기 명령어 추가
  showCommand
    .command('folder')
    .description('Display current default folder information')
    .action(async () => {
      const spinner = createSpinner('Fetching folder information');

      try {
        const driveService = await DriveService.create();
        const folderId = driveService.getCurrentFolderId();

        if (!folderId) {
          spinner.succeed('No default folder is set');
          logger.info('You can set a default folder using the "config set-folder" command');
          return;
        }

        const folderInfo = await driveService.getFileInfo(folderId);
        spinner.stop();

        if (!folderInfo) {
          logger.warning(`Default folder ID is set to ${folderId}, but the folder was not found`);
          logger.info('The folder may have been deleted or you may not have access to it');
          logger.info('You can set a new default folder using the "config set-folder" command');
          return;
        }

        // 폴더 정보 표시
        const folderInfoString = [
          `${chalk.cyan('Folder ID')}: ${chalk.yellow(folderId)}`,
          `${chalk.cyan('Name')}: ${chalk.yellow(folderInfo.name)}`,
          `${chalk.cyan('Created')}: ${chalk.yellow(new Date(folderInfo.createdTime).toLocaleString())}`,
          `${chalk.cyan('Modified')}: ${chalk.yellow(new Date(folderInfo.modifiedTime).toLocaleString())}`,
          `${chalk.cyan('Owner')}: ${chalk.yellow(folderInfo.owner)}`,
          `${chalk.cyan('Shared')}: ${chalk.yellow(folderInfo.shared ? 'Yes' : 'No')}`,
        ].join('\n');

        console.log(
          boxen(folderInfoString, {
            title: chalk.green.bold('Default Folder Information'),
            titleAlignment: 'center',
            padding: 1,
            margin: 1,
            borderStyle: 'round',
            borderColor: 'green',
          })
        );
      } catch (error) {
        spinner.fail('Failed to fetch folder information');
        logger.error(error instanceof Error ? error.message : String(error));
      }
    });
}
