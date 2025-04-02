import { drive_v3, google } from 'googleapis';
import * as fs from 'fs';
import * as path from 'path';
import * as mime from 'mime-types';
import { AuthService } from './authService.js';
import { FileInfo } from '../types/fileTypes.js';
import { config } from '@/config/config.js';

export class DriveService {
  private drive: drive_v3.Drive;
  private folderId: string | undefined = config.get('defaultFolderId');
  static instance: DriveService | null = null;

  static async create(): Promise<DriveService> {
    if (this.instance) {
      return this.instance;
    }
    const authService = AuthService.create();
    const authClient = await authService.getAuthClient();
    const drive = google.drive({ version: 'v3', auth: authClient });
    this.instance = new DriveService(drive);
    return this.instance;
  }

  constructor(drive: drive_v3.Drive) {
    this.drive = drive;
  }

  /**
   * Upload a file to Google Drive
   */
  async uploadFile(filePath: string, folderId?: string): Promise<string> {
    // Verify file exists
    if (!fs.existsSync(filePath)) {
      throw new Error(`File "${filePath}" does not exist`);
    }

    const fileName = path.basename(filePath);
    const mimeType = mime.lookup(filePath) || 'application/octet-stream';

    const targetFolderId = folderId || this.folderId;
    const parents = targetFolderId ? [targetFolderId] : undefined;

    // Prepare request metadata
    const fileMetadata: drive_v3.Schema$File = {
      name: fileName,
      parents,
    };

    // Prepare media
    const media = {
      mimeType,
      body: fs.createReadStream(filePath),
    };

    // Upload file
    const response = await this.drive.files.create({
      requestBody: fileMetadata,
      media,
      fields: 'id',
    });

    if (!response.data.id) {
      throw new Error('Failed to upload file: No file ID returned');
    }

    return response.data.id;
  }

  /**
   * Upload a directory to Google Drive
   */
  async uploadDirectory(
    dirPath: string,
    parentFolderId?: string,
    recursive: boolean = true
  ): Promise<string> {
    // Verify directory exists
    if (!fs.existsSync(dirPath)) {
      throw new Error(`Directory "${dirPath}" does not exist`);
    }

    if (!fs.statSync(dirPath).isDirectory()) {
      throw new Error(`"${dirPath}" is not a directory`);
    }

    const dirName = path.basename(dirPath);

    // Create folder in Google Drive
    const folderMetadata: drive_v3.Schema$File = {
      name: dirName,
      mimeType: 'application/vnd.google-apps.folder',
      parents: parentFolderId ? [parentFolderId] : undefined,
    };

    const folder = await this.drive.files.create({
      requestBody: folderMetadata,
      fields: 'id',
    });

    const folderId = folder.data.id;

    if (!folderId) {
      throw new Error('Failed to create folder: No folder ID returned');
    }

    // Read directory contents
    const files = fs.readdirSync(dirPath);

    // Upload each file/folder
    for (const file of files) {
      const filePath = path.join(dirPath, file);
      const stat = fs.statSync(filePath);

      if (stat.isDirectory() && recursive) {
        // Recursively upload subdirectory
        await this.uploadDirectory(filePath, folderId, recursive);
      } else if (stat.isFile()) {
        // Upload file
        await this.uploadFile(filePath, folderId);
      }
    }

    return folderId;
  }

  /**
   * List files in a folder
   */
  async listFiles(folderId?: string, fileType?: string): Promise<FileInfo[]> {
    let query = '';
    const targetFolderId = folderId || this.folderId || 'root';
    query += `'${targetFolderId}' in parents`;

    // Exclude trashed files
    query += ' and trashed = false';

    // Add file type filter if specified
    if (fileType) {
      if (fileType === 'folder') {
        query += " and mimeType = 'application/vnd.google-apps.folder'";
      } else if (fileType === 'document') {
        query += " and mimeType = 'application/vnd.google-apps.document'";
      } else if (fileType === 'spreadsheet') {
        query += " and mimeType = 'application/vnd.google-apps.spreadsheet'";
      } else if (fileType === 'presentation') {
        query += " and mimeType = 'application/vnd.google-apps.presentation'";
      } else if (fileType === 'image') {
        query += " and mimeType contains 'image/'";
      } else if (fileType === 'video') {
        query += " and mimeType contains 'video/'";
      } else if (fileType === 'audio') {
        query += " and mimeType contains 'audio/'";
      }
    }

    const response = await this.drive.files.list({
      q: query,
      fields: 'files(id, name, mimeType, size, createdTime, modifiedTime, owners, shared)',
      orderBy: 'name',
    });

    const files = response.data.files || [];

    return files.map(file => ({
      id: file.id || '',
      name: file.name || '',
      mimeType: file.mimeType || '',
      size: file.size ? parseInt(file.size) : 0,
      createdTime: file.createdTime || '',
      modifiedTime: file.modifiedTime || '',
      isFolder: file.mimeType === 'application/vnd.google-apps.folder',
      owner: file.owners?.[0]?.displayName || '',
      shared: file.shared || false,
    }));
  }

  /**
   * Search for files by name
   */
  async searchFiles(query: string, fileType?: string): Promise<FileInfo[]> {
    let queryString = `name contains '${query}'`;

    // Add file type filter if specified
    if (fileType) {
      if (fileType === 'folder') {
        queryString += " and mimeType = 'application/vnd.google-apps.folder'";
      } else if (fileType === 'document') {
        queryString += " and mimeType = 'application/vnd.google-apps.document'";
      } else if (fileType === 'spreadsheet') {
        queryString += " and mimeType = 'application/vnd.google-apps.spreadsheet'";
      } else if (fileType === 'presentation') {
        queryString += " and mimeType = 'application/vnd.google-apps.presentation'";
      } else if (fileType === 'image') {
        queryString += " and mimeType contains 'image/'";
      } else if (fileType === 'video') {
        queryString += " and mimeType contains 'video/'";
      } else if (fileType === 'audio') {
        queryString += " and mimeType contains 'audio/'";
      }
    }

    const response = await this.drive.files.list({
      q: queryString,
      fields: 'files(id, name, mimeType, size, createdTime, modifiedTime, owners, shared)',
      orderBy: 'modifiedTime desc',
    });

    const files = response.data.files || [];

    return files.map(file => ({
      id: file.id || '',
      name: file.name || '',
      mimeType: file.mimeType || '',
      size: file.size ? parseInt(file.size) : 0,
      createdTime: file.createdTime || '',
      modifiedTime: file.modifiedTime || '',
      isFolder: file.mimeType === 'application/vnd.google-apps.folder',
      owner: file.owners?.[0]?.displayName || '',
      shared: file.shared || false,
    }));
  }

  /**
   * Get file information
   */
  async getFileInfo(fileId: string): Promise<FileInfo | null> {
    try {
      const response = await this.drive.files.get({
        fileId,
        fields: 'id, name, mimeType, size, createdTime, modifiedTime, owners, shared',
      });

      const file = response.data;

      return {
        id: file.id || '',
        name: file.name || '',
        mimeType: file.mimeType || '',
        size: file.size ? parseInt(file.size) : 0,
        createdTime: file.createdTime || '',
        modifiedTime: file.modifiedTime || '',
        isFolder: file.mimeType === 'application/vnd.google-apps.folder',
        owner: file.owners?.[0]?.displayName || '',
        shared: file.shared || false,
      };
    } catch (error) {
      if ((error as any).code === 404) {
        return null;
      }
      throw error;
    }
  }

  /**
   * Download a file
   */
  async downloadFile(fileId: string, destination: string): Promise<void> {
    const dest = fs.createWriteStream(destination);

    const response = await this.drive.files.get(
      { fileId, alt: 'media' },
      { responseType: 'stream' }
    );

    return new Promise((resolve, reject) => {
      response.data
        .on('end', () => {
          resolve();
        })
        .on('error', (err: Error) => {
          reject(err);
        })
        .pipe(dest);
    });
  }

  /**
   * Share a file with another user
   */
  async shareFile(
    fileId: string,
    email: string,
    role: string = 'reader',
    sendNotification: boolean = true,
    emailMessage?: string
  ): Promise<void> {
    await this.drive.permissions.create({
      fileId,
      requestBody: {
        type: 'user',
        role,
        emailAddress: email,
      },
      sendNotificationEmail: sendNotification,
      emailMessage,
    });
  }

  /**
   * Delete a file
   */
  async deleteFile(fileId: string): Promise<void> {
    await this.drive.files.delete({ fileId });
  }
}
