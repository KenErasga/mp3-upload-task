# MP3 File Analysis API

## Installation

Pre-req: Node installed

```bash
npm install
```

## Running the Application

```bash
# Development mode with hot reload
npm run start:dev

# Production mode
npm run build
npm run start:prod
```

The application will run on `http://localhost:3000`

## API Documentation

Swagger documentation is available at `http://localhost:3000/api-docs` when the application is running. You can also tryout the endpoint in swagger docs.

## API Endpoint

### POST /file-upload

Upload an MP3 file to count the number of frames.

**Request:**
- Method: `POST`
- Content-Type: `multipart/form-data`
- Body: Form data with a file field named `file`

**Response:**
```json
{
  "frameCount": 6090
}
```

**Example using curl:**
```bash
curl -X POST http://localhost:3000/file-upload \
  -F "file=path/file.mp3"
```

**Supported Format:**
- MPEG Version 1 Audio Layer 3 (.mp3)

## Testing

### Unit Tests

```bash
# Run unit tests
npm test

# Run tests in watch mode
npm run test:watch

# Run tests with coverage
npm run test:cov
```

### Integration/E2E Tests

```bash
# Run E2E tests
npm run test:e2e
```

The E2E tests validate the complete file upload flow, including:
- Uploading actual MP3 files and verifying frame count
- File validation (MIME type, format)
- Error handling scenarios


## Linting and Formatting

```bash
# Run ESLint
npm run lint

# Format code with Prettier
npm run format
```

## TODOs

- Implement GCP Cloud Storage or AWS S3 bucket for storing the files
- Add a limit to the file size
- Config file to put constants in
- Create a custom error handling for MP3 files
- Use commitezen for better commits
- Automated run of npm run lint and npm run format on commit

