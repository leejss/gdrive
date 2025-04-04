# gdrive - Google Drive Command Line Helper

A command-line tool for interacting with Google Drive, built with TypeScript.

## Features

- Upload files to Google Drive
- Upload directories recursively
- List files and directories in your Google Drive
- Download files from Google Drive
- Remove files from Google Drive

## Installation

```bash
# Install globally
npm install -g gdrive

# Or install locally
npm install gdrive
```

## Setup

Before using gdrive, you need to authenticate with Google Drive:

```bash
gdrive auth
```

This will open a browser window where you can authenticate and authorize the application to access your Google Drive.

## Usage

### Upload Files

```bash
# Upload a single file
gdrive file.txt

# Upload multiple files
gdrive file1.txt file2.jpg document.pdf

# Upload to a specific folder in Google Drive
gdrive --folderId "1234567890" file.txt
```

### Upload Directories

```bash
# Upload a directory recursively
gdrive -d my-directory

# Upload a directory to a specific folder in Google Drive
gdrive -d my-directory --folderId "1234567890"
```

### List Files and Directories

```bash
# List files in your Google Drive root
gdrive list

# List files in a specific folder
gdrive list --folderId "My Folder"

# List with more details
gdrive list --verbose
```

### Search for Files

```bash
# Search for files by name
gdrive list --search "document"

# Search with file type filter
gdrive list --search "photo" --type image
```

### Download Files

```bash
# Download a file by ID
gdrive download FILE_ID

# Download a file by name
gdrive download --name "document.pdf"

# Download to a specific directory
gdrive download FILE_ID --output ~/Downloads
```

### Remove Files

```bash
# Remove a file by ID
gdrive remove FILE_ID

# Remove a file by name
gdrive remove --name "document.pdf"

# Remove multiple files
gdrive remove FILE_ID1 FILE_ID2 FILE_ID3
```

## Options

| Option | Alias | Description |
|--------|-------|-------------|
| `--folderId` | `-f` | Specify the destination folderId in Google Drive |
| `--name` | `-n` | Specify a custom name for the uploaded file |
| `--recursive` | `-r` | Upload directories recursively |
| `--verbose` | `-v` | Show detailed information |
| `--output` | `-o` | Specify download location |
| `--type` | `-t` | Filter by file type |
| `--quiet` | `-q` | Suppress output |
| `--help` | `-h` | Show help |
| `--version` | | Show version |

## Examples

```bash
# Upload multiple files to a specific folder
gdrive --folderId "Work Documents" report.docx presentation.pptx

# Upload a directory with custom naming
gdrive -d project-files --name "Project X Files"

# Search for images and show details
gdrive list --search "vacation" --type image --verbose

# Download a file to a specific location
gdrive download 1a2b3c4d5e --output ~/Downloads/important-docs/

# Remove multiple files
gdrive remove 1a2b3c4d5e 2f3g4h5i6j
```
