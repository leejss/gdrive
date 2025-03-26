# gup - Google Drive Command Line Uploader

A command-line tool for interacting with Google Drive, built with TypeScript.

## Features

- Upload files to Google Drive
- Upload directories recursively
- List files and directories in your Google Drive
- Search for files and directories
- Download files from Google Drive
- Manage file permissions and sharing

## Installation

```bash
# Install globally
npm install -g gup

# Or install locally
npm install gup
```

## Setup

Before using gup, you need to authenticate with Google Drive:

```bash
gup auth
```

This will open a browser window where you can authenticate and authorize the application to access your Google Drive.

## Usage

### Upload Files

```bash
# Upload a single file
gup file.txt

# Upload multiple files
gup file1.txt file2.jpg document.pdf

# Upload to a specific folder in Google Drive
gup --folder "My Folder" file.txt

# Upload with a different filename
gup --name "new-filename.txt" original-file.txt
```

### Upload Directories

```bash
# Upload a directory recursively
gup -d my-directory

# Upload a directory to a specific folder in Google Drive
gup -d my-directory --folder "My Folder"
```

### List Files and Directories

```bash
# List files in your Google Drive root
gup -ls

# List files in a specific folder
gup -ls "My Folder"

# List with more details
gup -ls --verbose
```

### Search for Files

```bash
# Search for files by name
gup -s "document"

# Search with file type filter
gup -s "photo" --type image
```

### Download Files

```bash
# Download a file by ID
gup -g FILE_ID

# Download a file by name
gup -g --name "document.pdf"

# Download to a specific directory
gup -g FILE_ID --output ~/Downloads
```

### File Management

```bash
# Delete a file
gup --rm FILE_ID

# Share a file
gup --share FILE_ID --with user@example.com

# Change sharing permissions
gup --share FILE_ID --with user@example.com --role writer
```

## Options

| Option | Alias | Description |
|--------|-------|-------------|
| `--folder` | `-f` | Specify the destination folder in Google Drive |
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
gup --folder "Work Documents" report.docx presentation.pptx

# Upload a directory with custom naming
gup -d project-files --name "Project X Files"

# Search for images and show details
gup -s "vacation" --type image --verbose

# Download a file to a specific location
gup -g 1a2b3c4d5e --output ~/Downloads/important-docs/
```

## Configuration

You can create a configuration file at `~/.guprc` to set default options:

```json
{
  "defaultFolder": "My Uploads",
  "verbose": true,
  "defaultDownloadLocation": "~/Downloads"
}
```

## Development

This project uses:

- TypeScript for type safety
- ESLint for code linting
- Prettier for code formatting

To set up the development environment:

```bash
# Install dependencies
npm install

# Build the project
npm run build

# Run in development mode
npm run dev

# Format code
npm run format

# Run linting
npm run lint
```

For more details, see [CONTRIBUTING.md](CONTRIBUTING.md).

## License

ISC
