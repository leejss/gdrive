import { Command, program } from 'commander';
import { uploadCommand } from './commands/upload.js';
import { listCommand } from './commands/list.js';
import { downloadCommand } from './commands/download.js';
import { authCommand } from './commands/auth.js';
import { removeCommand } from './commands/remove.js';
import { showCommand } from './commands/show.js';
import { CONFIG_FILE, getConfig, initializeConfig } from './config.js';
import * as fs from 'fs';
import inquirer from 'inquirer';
import { AuthService } from './services/authService.js';
import { DriveService } from './services/driveService.js';

function checkFirstRun() {
  return !fs.existsSync(CONFIG_FILE);
}

async function promptConfig(): Promise<{
  clientId: string;
  clientSecret: string;
  defaultFolderId: string;
  defaultDownloadLocation?: string;
  verbose?: boolean;
}> {
  console.log('구글 드라이브 API 접근을 위한 설정이 필요합니다.');
  console.log('Google Cloud 콘솔에서 OAuth 2.0 클라이언트 ID와 비밀번호를 생성하세요.');
  console.log(
    '또한 기본 폴더 ID가 필요합니다. 구글 드라이브에서 원하는 폴더 URL의 ID 부분을 복사하세요.\n'
  );

  return inquirer.prompt([
    {
      type: 'input',
      name: 'clientId',
      message: 'client ID를 입력하세요:',
      validate: input => {
        if (!input) {
          return 'client ID는 필수입니다.';
        }
        return true;
      },
    },
    {
      type: 'input',
      name: 'clientSecret',
      message: 'client secret를 입력하세요:',
      validate: input => {
        if (!input) {
          return 'client secret는 필수입니다.';
        }
        return true;
      },
    },
    {
      type: 'input',
      name: 'defaultFolderId',
      message: 'default folder ID를 입력하세요:',
      validate: input => {
        if (!input) {
          return 'default folder ID는 필수입니다.';
        }

        return true;
      },
    },
    {
      type: 'input',
      name: 'defaultDownloadLocation',
      message: '기본 다운로드 위치를 입력하세요 (선택사항, 기본값: ~/Downloads):',
      default: '',
    },
    {
      type: 'confirm',
      name: 'verbose',
      message: '상세 로깅을 활성화하시겠습니까?',
      default: false,
    },
  ]);
}

async function initialize(program: Command) {
  const isFirstRun = checkFirstRun();
  if (isFirstRun) {
    const configValues = await promptConfig();
    initializeConfig(configValues);
  }

  const config = getConfig();
  const authService = AuthService.create({ config });

  if (isFirstRun) {
    await authService.authenticate();
  }

  const driveService = await DriveService.create({
    authClient: await authService.getAuthClient(),
    config,
  });

  authCommand(program, authService);
  uploadCommand(program, driveService);
  listCommand(program, driveService);
  downloadCommand(program, driveService);
  removeCommand(program, driveService);
  showCommand(program, driveService);

  // configCommand(program);
}

function main() {
  program.name('gdrive').description('Google Drive Command Line Uploader').version('1.0.0');

  // if (process.argv.length === 2) {
  //   program.outputHelp();
  // }

  program.parse(process.argv);
  initialize(program);
}

main();
