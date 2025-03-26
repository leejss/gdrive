import chalk from 'chalk';
import boxen from 'boxen';
import { FileInfo } from '../types/fileTypes.js';

/**
 * Format file size for display
 */
export function formatSize(bytes: number): string {
  if (bytes === 0) return '0 B';

  const units = ['B', 'KB', 'MB', 'GB', 'TB'];
  const i = Math.floor(Math.log(bytes) / Math.log(1024));

  return `${(bytes / Math.pow(1024, i)).toFixed(2)} ${units[i]}`;
}

/**
 * Format date for display
 */
export function formatDate(dateString: string): string {
  if (!dateString) return '';

  const date = new Date(dateString);
  return date.toLocaleString();
}

/**
 * Format file type for display
 */
export function formatFileType(mimeType: string): string {
  if (mimeType === 'application/vnd.google-apps.folder') {
    return 'Folder';
  }

  if (mimeType.startsWith('application/vnd.google-apps.')) {
    const type = mimeType.replace('application/vnd.google-apps.', '');
    return type.charAt(0).toUpperCase() + type.slice(1);
  }

  if (mimeType.startsWith('image/')) {
    return 'Image';
  }

  if (mimeType.startsWith('video/')) {
    return 'Video';
  }

  if (mimeType.startsWith('audio/')) {
    return 'Audio';
  }

  return mimeType.split('/')[1] || mimeType;
}

/**
 * Format list of files for display
 */
export function formatFileList(files: FileInfo[], verbose: boolean = false): string {
  if (verbose) {
    return formatVerboseFileList(files);
  } else {
    return formatSimpleFileList(files);
  }
}

/**
 * Format simple file list
 */
function formatSimpleFileList(files: FileInfo[]): string {
  return files
    .map(file => {
      const icon = file.isFolder ? '📁' : '📄';
      const name = file.isFolder ? chalk.blue(file.name) : file.name;
      return `${icon} ${name}`;
    })
    .join('\n');
}

/**
 * Format verbose file list
 */
function formatVerboseFileList(files: FileInfo[]): string {
  return files
    .map(file => {
      const icon = file.isFolder ? '📁' : '📄';
      const name = file.isFolder ? chalk.blue(file.name) : file.name;
      const id = chalk.gray(`ID: ${file.id}`);
      const type = chalk.yellow(formatFileType(file.mimeType));
      const size = file.size ? formatSize(file.size) : '';
      const modified = formatDate(file.modifiedTime);
      const shared = file.shared ? chalk.green('Shared') : '';

      return boxen(`${icon} ${name}\n${id}\n${type}   ${size}\nModified: ${modified}   ${shared}`, {
        padding: 1,
        margin: 0,
        borderStyle: 'round',
        borderColor: file.isFolder ? 'blue' : 'white',
      });
    })
    .join('\n');
}
