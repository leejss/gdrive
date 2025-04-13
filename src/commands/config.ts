import { Command } from 'commander';
import inquirer from 'inquirer';
import { config } from '../config/config.js';
import { DriveService } from '../services/driveService.js';
import { logger } from '../utils/logger.js';
import { createSpinner } from '../utils/spinner.js';

export function configCommand(program: Command): void {
  program
    .command('config')
    .description('Manage configuration settings')
    .addCommand(
      new Command('set-folder')
        .description('Set default folder ID')
        .argument('[folderId]', 'Google Drive folder ID to use as default')
        .option('-t, --temp', 'Set temporarily (for this session only)')
        .action(async (folderId, options) => {
          // 폴더 ID가 제공되지 않은 경우 대화형으로 입력 받기
          if (!folderId) {
            const answers = await inquirer.prompt([
              {
                type: 'input',
                name: 'folderId',
                message: 'Enter Google Drive folder ID to use as default:',
                validate: input => input.trim() !== '' || 'Folder ID cannot be empty',
              },
            ]);
            folderId = answers.folderId;
          }

          const spinner = createSpinner(`Setting default folder ID to ${folderId}`);

          try {
            // 폴더 ID 유효성 검사
            const driveService = await DriveService.create();
            const folderInfo = await driveService.getFileInfo(folderId);

            if (!folderInfo) {
              spinner.fail('Invalid folder ID: Folder not found');
              return;
            }

            if (!folderInfo.isFolder) {
              spinner.fail('Invalid folder ID: The ID belongs to a file, not a folder');
              return;
            }
            // 폴더 ID 설정
            const persistent = !options.temp;
            driveService.setDefaultFolderId(folderId, persistent);

            spinner.succeed(
              `Default folder ID set to ${folderId}${persistent ? ' (saved permanently)' : ' (for this session only)'}`
            );
            logger.info(`Folder name: ${folderInfo.name}`);
          } catch (error) {
            spinner.fail('Failed to set default folder ID');
            logger.error(error instanceof Error ? error.message : String(error));
          }
        })
    )
    .addCommand(
      new Command('clear-folder')
        .description('Clear default folder ID setting')
        .action(async () => {
          const spinner = createSpinner('Clearing default folder ID setting');

          try {
            // 설정에서 폴더 ID 제거
            config.setConfig('DEFAULT_FOLDER_ID', '');

            // DriveService 인스턴스가 있으면 해당 인스턴스에서도 제거
            const driveService = await DriveService.create();
            driveService.setDefaultFolderId('', true);

            spinner.succeed('Default folder ID setting cleared');
          } catch (error) {
            spinner.fail('Failed to clear default folder ID setting');
            logger.error(error instanceof Error ? error.message : String(error));
          }
        })
    );
}
