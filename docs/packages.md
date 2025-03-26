# Project Dependencies

This document describes the primary dependencies used in the `gup` project, explaining their purpose and how they're used in our codebase.

## Core Dependencies

### googleapis

**Purpose**: Provides official Google API client library for Node.js, used for interacting with Google Drive API.

**Usage**: Used throughout the `DriveService` class to handle all Google Drive operations such as uploading, downloading, listing, and sharing files.

```typescript
// Example from driveService.ts
import { drive_v3, google } from 'googleapis';

export class DriveService {
  private drive: drive_v3.Drive;
  
  constructor() {
    const authService = new AuthService();
    const auth = authService.getAuthClient();
    this.drive = google.drive({ version: 'v3', auth });
  }
  
  // Drive API methods...
}
```

### commander

**Purpose**: Command-line interface solution that provides a complete solution for parsing command-line arguments and creating a well-structured CLI application.

**Usage**: Used in the main entry point to define and handle all command-line commands, options, and arguments.

```typescript
// Example from index.ts
import { program } from 'commander';

// Setup the CLI program
program
  .name('gup')
  .description('Google Drive Command Line Uploader')
  .version(version);

// Register commands
uploadCommand(program);
listCommand(program);
// Other commands...

program.parse(process.argv);
```

### inquirer

**Purpose**: Interactive command-line user interface, providing features like asking questions, parsing input, and validating answers.

**Usage**: Used in the `removeCommand` to confirm file deletion and could be used for other interactive prompts throughout the application.

```typescript
// Example from remove.ts
import inquirer from 'inquirer';

// Inside the remove command action
if (!options.force) {
  const answer = await inquirer.prompt([{
    type: 'confirm',
    name: 'confirm',
    message: `Are you sure you want to delete "${fileInfo.name}"?`,
    default: false
  }]);
  
  if (!answer.confirm) {
    logger.info('Operation cancelled');
    return;
  }
}
```

### chalk

**Purpose**: Terminal string styling that allows adding colors and styles to console output, making the CLI more readable and user-friendly.

**Usage**: Used in the logger utility to provide colored output for different types of messages.

```typescript
// Example from logger.ts
import chalk from 'chalk';

export const logger = {
  info: (message: string): void => {
    console.log(chalk.blue('9'), message);
  },
  
  success: (message: string): void => {
    console.log(chalk.green(''), message);
  },
  
  // Other log methods...
};
```

### ora

**Purpose**: Elegant terminal spinner that provides visual feedback during long-running processes.

**Usage**: Used throughout the command handlers to show loading indicators when performing operations that might take time.

```typescript
// Example from spinner.ts and usage in commands
import ora, { Ora } from 'ora';

export function createSpinner(text: string): Ora {
  return ora({
    text,
    spinner: 'dots',
    color: 'blue'
  }).start();
}

// Usage example
const spinner = createSpinner('Uploading files to Google Drive');
try {
  // Some async operation
  spinner.succeed('Successfully uploaded files');
} catch (error) {
  spinner.fail('Upload failed');
}
```

### boxen

**Purpose**: Creates boxes in the terminal, useful for highlighting information or creating visually distinct sections.

**Usage**: Used in the formatter utility to display file information in a visually appealing box format.

```typescript
// Example from formatter.ts
import boxen from 'boxen';

// Inside formatVerboseFileList function
return boxen(
  `${icon} ${name}\n${id}\n${type}   ${size}\nModified: ${modified}   ${shared}`,
  {
    padding: 1,
    margin: 0,
    borderStyle: 'round',
    borderColor: file.isFolder ? 'blue' : 'white'
  }
);
```

### conf

**Purpose**: Simple configuration storage that persists between application runs.

**Usage**: Used to manage user configurations, such as default settings for file operations.

```typescript
// Example from config.ts
import Conf from 'conf';

export class Config {
  private conf: Conf<ConfigSchema>;
  
  constructor() {
    this.conf = new Conf<ConfigSchema>({
      projectName: 'gup',
      schema: {
        defaultFolder: {
          type: 'string'
        },
        defaultDownloadLocation: {
          type: 'string',
          default: path.join(os.homedir(), 'Downloads')
        },
        verbose: {
          type: 'boolean',
          default: false
        }
      },
      configName: '.guprc'
    });
  }
  
  // Config methods...
}
```

### mime-types

**Purpose**: Provides MIME type mapping between file extensions and MIME types.

**Usage**: Used in the DriveService to determine the MIME type of files being uploaded to Google Drive.

```typescript
// Example from driveService.ts
import * as mime from 'mime-types';

// Inside uploadFile method
const mimeType = mime.lookup(filePath) || 'application/octet-stream';

// Prepare request metadata
const fileMetadata: drive_v3.Schema$File = {
  name: fileName,
  parents: folderId ? [folderId] : undefined
};

// Prepare media
const media = {
  mimeType,
  body: fs.createReadStream(filePath)
};
```

### open

**Purpose**: Open URLs, files, executables in a cross-platform way.

**Usage**: Used in the AuthService to open the browser for OAuth authentication.

```typescript
// Example from authService.ts
import * as open from 'open';

// Inside authenticate method
// Generate auth URL
const authUrl = client.generateAuthUrl({
  access_type: 'offline',
  scope: this.SCOPES,
  prompt: 'consent'
});

// Open browser for authentication
console.log('Opening browser for authentication...');
await open.default(authUrl);
```

## Usage Patterns

Our application follows a modular architecture, where each dependency serves a specific purpose:

1. **Core API Interaction**: googleapis
2. **Command-Line Interface**: commander
3. **User Interaction**: inquirer, chalk, ora, boxen
4. **File Operations**: mime-types
5. **Configuration Management**: conf
6. **System Integration**: open

These packages are carefully selected to provide a robust, user-friendly command-line experience while ensuring efficient interaction with Google Drive APIs.
