/**
 * File information structure
 */
export interface FileInfo {
  id: string;
  name: string;
  mimeType: string;
  size: number;
  createdTime: string;
  modifiedTime: string;
  isFolder: boolean;
  owner: string;
  shared: boolean;
}
