import { Command } from 'commander';
import { config } from '../config/config.js';
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
}
