# Badminton Court Finder Platform

A serverless badminton court booking platform built on AWS with TypeScript, featuring AI-powered recommendations and real-time booking management.

## Architecture Overview

- **Frontend**: Next.js with TypeScript (AWS Amplify)
- **Backend**: AWS Lambda + API Gateway
- **Database**: Amazon DynamoDB
- **AI/ML**: Amazon Personalize
- **Authentication**: Amazon Cognito
- **Storage**: Amazon S3
- **Email**: Amazon SES
- **Maps**: AWS Location Service

## Project Structure

```
badminton-court-finder/
├── frontend/                 # Next.js frontend application
├── backend/                  # AWS Lambda functions
├── infrastructure/           # AWS CDK/CloudFormation
├── shared/                   # Shared types and utilities
├── docs/                     # Documentation
└── scripts/                  # Build and deployment scripts
```

## Getting Started

1. Install dependencies: `npm install`
2. Configure AWS credentials
3. Deploy infrastructure: `npm run deploy:infra`
4. Deploy backend: `npm run deploy:backend`
5. Deploy frontend: `npm run deploy:frontend`

## Development

- `npm run dev` - Start local development
- `npm run build` - Build all packages
- `npm run test` - Run tests
- `npm run lint` - Lint code