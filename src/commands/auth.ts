import { type Command } from 'commander';
import { logger } from '../utils/logger.js';
import { createSpinner } from '../utils/spinner.js';
import type { AuthService } from '../services/authService.js';

export function authCommand(program: Command, authService: AuthService): void {
  program
    .command('auth')
    .description('Authenticate with Google Drive')
    .action(async () => {
      const spinner = createSpinner('Opening browser for authentication...');
      try {
        await Promise.race([
          authService.authenticate(),
          new Promise((_, reject) =>
            setTimeout(() => reject(new Error('Authentication timed out')), 20000)
          ),
        ]);

        spinner.succeed('Authentication successful');
        logger.info('You are now authenticated with Google Drive');
        process.exit(0);
      } catch (error) {
        spinner.fail('Authentication failed');
        logger.error(error instanceof Error ? error.message : String(error));
        process.exit(1);
      }
    });

  program
    .command('logout')
    .description('Revoke Google Drive authentication')
    .action(async () => {
      const spinner = createSpinner('Logging out');

      try {
        await authService.logout();
        spinner.succeed('Successfully logged out from Google Drive');
      } catch (error) {
        spinner.fail('Logout failed');
        logger.error(error instanceof Error ? error.message : String(error));
      }
    });
}
