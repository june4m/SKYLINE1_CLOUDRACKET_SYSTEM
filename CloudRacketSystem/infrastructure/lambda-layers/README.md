# Lambda Layers

This directory contains Lambda Layers for the Cloud Racket Platform.

## Structure

```
lambda-layers/
├── common/
│   └── nodejs/
│       ├── index.ts      # AWS SDK clients and common utilities
│       └── package.json  # Dependencies (AWS SDK, uuid, lodash)
└── utils/
    └── nodejs/
        ├── index.ts      # Business logic utilities
        └── package.json  # Package metadata
```

## Layers

### Common Layer
Contains AWS SDK clients and shared utilities:
- AWS SDK v3 clients (DynamoDB, S3, SES, Cognito, Location)
- UUID generation
- Lodash utilities
- Response helpers
- Logger utility

### Utils Layer
Contains business logic utilities:
- Validators (email, phone, UUID, date, coordinates, etc.)
- Date utilities
- String utilities
- Number formatting
- Error classes (AppError, ValidationError, NotFoundError, etc.)
- Pagination utilities
- Geolocation utilities

## Building Layers

Before deploying, install dependencies in each layer:

```bash
cd lambda-layers/common/nodejs && npm install
cd lambda-layers/utils/nodejs && npm install
```

## Usage in Lambda Functions

```typescript
// Import from common layer
import { DynamoDBClient, successResponse, logger } from '/opt/nodejs/index';

// Import from utils layer
import { validators, dateUtils, ValidationError } from '/opt/nodejs/index';
```
