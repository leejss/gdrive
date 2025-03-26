import { Command } from 'commander';
import { AuthService } from '../services/authService.js';
import { logger } from '../utils/logger.js';
import { createSpinner } from '../utils/spinner.js';

export function authCommand(program: Command): void {
  program
    .command('auth')
    .description('Authenticate with Google Drive')
    .action(async () => {
      const spinner = createSpinner('Starting authentication process');
      const authService = new AuthService();

      try {
        spinner.text = 'Opening browser for authentication...';
        await authService.authenticate();

        spinner.succeed('Authentication successful');
        logger.info('You are now authenticated with Google Drive');
      } catch (error) {
        spinner.fail('Authentication failed');
        logger.error(error instanceof Error ? error.message : String(error));
        logger.info('Please try again or check your internet connection');
      }
    });

  program
    .command('logout')
    .description('Revoke Google Drive authentication')
    .action(async () => {
      const spinner = createSpinner('Logging out');
      const authService = new AuthService();

      try {
        await authService.logout();
        spinner.succeed('Successfully logged out from Google Drive');
      } catch (error) {
        spinner.fail('Logout failed');
        logger.error(error instanceof Error ? error.message : String(error));
      }
    });
}
