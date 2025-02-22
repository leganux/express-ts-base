# Google Drive Plugin

This plugin provides functionality to interact with Google Drive, specifically for handling Excel and Word documents.

## Features

- Read Excel files from Google Drive
- Write Excel files to Google Drive
- Read Word documents from Google Drive
- Write Word documents to Google Drive

## Prerequisites

1. Set up a Google Cloud Project
2. Create a Service Account and download the credentials JSON file
3. Set the environment variable:
   ```
   GOOGLE_APPLICATION_CREDENTIALS=/path/to/your/credentials.json
   ```

## API Endpoints

### Excel Operations

#### Read Excel File
```http
POST /googledrive/excel/read
```

Request body:
```json
{
  "fileId": "google_drive_file_id"
}
```

Response:
```json
{
  "data": [
    {"column1": "value1", "column2": "value2"},
    {"column1": "value3", "column2": "value4"}
  ]
}
```

#### Write Excel File
```http
POST /googledrive/excel/write
```

Request body:
```json
{
  "fileName": "example.xlsx",
  "data": [
    {"column1": "value1", "column2": "value2"},
    {"column1": "value3", "column2": "value4"}
  ]
}
```

Response:
```json
{
  "fileId": "created_google_drive_file_id"
}
```

### Word Operations

#### Read Word File
```http
POST /googledrive/word/read
```

Request body:
```json
{
  "fileId": "google_drive_file_id"
}
```

Response:
```json
{
  "content": "Document content as text"
}
```

#### Write Word File
```http
POST /googledrive/word/write
```

Request body:
```json
{
  "fileName": "example.docx",
  "content": "Your document content"
}
```

Response:
```json
{
  "fileId": "created_google_drive_file_id"
}
```

## Error Responses

- 400 Bad Request: When required parameters are missing
- 500 Internal Server Error: When file operations fail

## Database Schema

### File Operation Model
```typescript
{
  fileId: string;        // Google Drive file ID
  fileName: string;      // Original file name
  operation: string;     // 'read' or 'write'
  fileType: string;      // 'excel' or 'word'
  status: string;        // 'success' or 'error'
  error?: string;        // Error message if operation failed
  createdAt: Date;       // Operation timestamp
}
```

## Dependencies

- googleapis: For Google Drive API interaction
- xlsx: For Excel file handling
- docx: For Word file handling
