# CloudRacket Backend

Backend API for CloudRacket System - Badminton Court Management Platform

## Setup

1. Install dependencies:
```bash
npm install
```

2. Environment Setup:
```bash
# Copy environment template
cp .env.example .env

# Update .env with your actual values
```

3. Start development server:
```bash
npm run dev
```

## Environment Variables

| Variable | Description | Example |
|----------|-------------|---------|
| `DYNAMODB_ENDPOINT` | DynamoDB endpoint (local development) | `http://localhost:8000` |
| `DYNAMODB_AccessKeyId` | DynamoDB access key | `your_access_key` |
| `DYNAMODB_SecretAccessKey` | DynamoDB secret key | `your_secret_key` |
| `AWS_REGION` | AWS region | `ap-southeast-1` |
| `NODE_ENV` | Environment | `development` |
| `PORT` | Server port | `3000` |

## Project Structure

```
src/
├── config/          # Configuration files
├── constant/        # Constants and enums
├── controller/      # Route controllers
├── middleware/      # Custom middleware
├── models/          # Data models
│   ├── entities/    # Domain entities
│   └── schemas/     # Request/response schemas
├── repositories/    # Data access layer
├── routers/         # Route definitions
├── services/        # Business logic
└── utils/          # Utility functions
```