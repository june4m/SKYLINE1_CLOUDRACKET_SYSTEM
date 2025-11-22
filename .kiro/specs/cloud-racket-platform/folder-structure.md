# Folder Structure - AWS Serverless Microservices

## Tổng quan

Đây là cấu trúc thư mục được thiết kế đặc biệt cho **AWS Serverless Microservices** sử dụng Lambda, API Gateway, DynamoDB, S3, và các AWS services khác.

## Điểm khác biệt so với kiến trúc truyền thống

### Kiến trúc truyền thống (Express.js):
```
Request → Router → Controller → Service → Repository → Database
```

### Kiến trúc Serverless (AWS Lambda):
```
Request → API Gateway → Lambda Handler → Service → Repository → DynamoDB
```

**Lambda Handler = Controller**
- Mỗi Lambda function xử lý 1 endpoint cụ thể
- Không cần routing logic phức tạp (API Gateway đã handle)
- Mỗi function là một file riêng biệt

---

## Cấu trúc thư mục đầy đủ

```
cloud-racket-platform/
├── README.md
├── package.json                          # Root package.json cho shared scripts
├── serverless.yml                        # Main Serverless Framework config
├── .env.example                          # Environment variables template
├── .gitignore
│
├── docs/                                 # Documentation
│   ├── api/                             # API documentation (Swagger/OpenAPI)
│   ├── deployment/                      # Deployment guides
│   └── architecture/                    # Architecture diagrams
│
├── shared/                              # Shared libraries across services
│   ├── lib/                            # Common utilities
│   │   ├── aws-clients.ts              # AWS SDK clients (DynamoDB, S3, SES)
│   │   ├── logger.ts                   # Structured logging utility
│   │   ├── response-builder.ts         # API response formatter
│   │   ├── error-handler.ts            # Global error handling
│   │   └── validators.ts               # Common validation schemas (Joi/Zod)
│   │
│   ├── types/                          # Shared TypeScript types
│   │   ├── api.types.ts                # API request/response types
│   │   ├── database.types.ts           # DynamoDB entity types
│   │   └── aws.types.ts                # AWS service types
│   │
│   ├── constants/                      # Shared constants
│   │   ├── errors.ts                   # Error codes and messages
│   │   ├── dynamodb-tables.ts          # Table names and indexes
│   │   └── api-endpoints.ts            # API endpoint constants
│   │
│   └── middleware/                     # Shared Lambda middleware
│       ├── auth-middleware.ts          # JWT validation
│       ├── cors-middleware.ts          # CORS handling
│       └── error-middleware.ts         # Error handling
│
├── services/                           # Individual microservices
│   │
│   ├── auth-service/                   # Authentication & Authorization
│   │   ├── src/
│   │   │   ├── controllers/            # Lambda Controllers (API endpoints)
│   │   │   │   ├── register.controller.ts      # POST /auth/register
│   │   │   │   ├── login.controller.ts         # POST /auth/login
│   │   │   │   ├── refresh-token.controller.ts # POST /auth/refresh
│   │   │   │   └── user-profile.controller.ts  # GET/PUT /auth/user-profile
│   │   │   │
│   │   │   ├── services/               # Business logic
│   │   │   │   ├── cognito.service.ts  # Cognito integration
│   │   │   │   └── jwt.service.ts      # JWT token handling
│   │   │   │
│   │   │   ├── middleware/             # Lambda middleware
│   │   │   │   └── auth.middleware.ts  # JWT validation
│   │   │   │
│   │   │   └── types/                  # Service-specific types
│   │   │       └── auth.types.ts
│   │   │
│   │   ├── tests/                      # Unit tests
│   │   │   ├── controllers/
│   │   │   └── services/
│   │   │
│   │   ├── serverless.yml              # Service-specific config
│   │   ├── package.json
│   │   └── tsconfig.json
│   │
│   ├── court-service/                  # Court Management
│   │   ├── src/
│   │   │   ├── controllers/            # Lambda Controllers (API endpoints)
│   │   │   │   ├── create-court.controller.ts      # POST /courts
│   │   │   │   ├── get-court.controller.ts         # GET /courts/:id
│   │   │   │   ├── update-court.controller.ts      # PUT /courts/:id
│   │   │   │   ├── delete-court.controller.ts      # DELETE /courts/:id
│   │   │   │   ├── search-courts.controller.ts     # GET /courts (with filters)
│   │   │   │   ├── nearby-courts.controller.ts     # GET /courts/nearby
│   │   │   │   ├── upload-images.controller.ts     # POST /courts/:id/images
│   │   │   │   └── manage-availability.controller.ts # GET/PUT /courts/:id/availability
│   │   │   │
│   │   │   ├── services/
│   │   │   │   ├── court.service.ts    # Court business logic
│   │   │   │   ├── s3.service.ts       # S3 image upload
│   │   │   │   ├── location.service.ts # Amazon Location Service
│   │   │   │   └── dynamodb.service.ts # DynamoDB operations
│   │   │   │
│   │   │   ├── repositories/           # Data access layer
│   │   │   │   ├── court.repository.ts # Court CRUD operations
│   │   │   │   └── availability.repository.ts
│   │   │   │
│   │   │   └── types/
│   │   │       └── court.types.ts
│   │   │
│   │   ├── tests/
│   │   ├── serverless.yml
│   │   ├── package.json
│   │   └── tsconfig.json
│   │
│   ├── booking-service/                # Booking Management
│   │   ├── src/
│   │   │   ├── controllers/            # Lambda Controllers (API endpoints)
│   │   │   │   ├── create-booking.controller.ts   # POST /bookings
│   │   │   │   ├── get-booking.controller.ts      # GET /bookings/:id
│   │   │   │   ├── list-bookings.controller.ts    # GET /bookings
│   │   │   │   ├── cancel-booking.controller.ts   # PUT /bookings/:id/cancel
│   │   │   │   └── booking-stream.controller.ts   # DynamoDB Stream processor
│   │   │   │
│   │   │   ├── services/
│   │   │   │   ├── booking.service.ts  # Booking business logic
│   │   │   │   ├── availability.service.ts # Availability checking
│   │   │   │   ├── email.service.ts    # SES email sending
│   │   │   │   └── payment.service.ts  # Payment processing (future)
│   │   │   │
│   │   │   ├── repositories/
│   │   │   │   └── booking.repository.ts
│   │   │   │
│   │   │   └── types/
│   │   │       └── booking.types.ts
│   │   │
│   │   ├── tests/
│   │   ├── serverless.yml
│   │   ├── package.json
│   │   └── tsconfig.json
│   │
│   ├── review-service/                 # Reviews & Ratings
│   │   ├── src/
│   │   │   ├── controllers/            # Lambda Controllers (API endpoints)
│   │   │   │   ├── create-review.controller.ts    # POST /reviews
│   │   │   │   ├── get-reviews.controller.ts      # GET /reviews/court/:id
│   │   │   │   ├── rating-aggregator.controller.ts # DynamoDB Stream processor
│   │   │   │   └── sentiment-analyzer.controller.ts # Amazon Comprehend integration
│   │   │   │
│   │   │   ├── services/
│   │   │   │   ├── review.service.ts   # Review business logic
│   │   │   │   ├── rating.service.ts   # Rating calculation
│   │   │   │   └── comprehend.service.ts # Sentiment analysis
│   │   │   │
│   │   │   ├── repositories/
│   │   │   │   └── review.repository.ts
│   │   │   │
│   │   │   └── types/
│   │   │       └── review.types.ts
│   │   │
│   │   ├── tests/
│   │   ├── serverless.yml
│   │   ├── package.json
│   │   └── tsconfig.json
│   │
│   ├── recommendation-service/         # AI Recommendations
│   │   ├── src/
│   │   │   ├── controllers/            # Lambda Controllers (API endpoints)
│   │   │   │   ├── get-recommendations.controller.ts # GET /recommendations
│   │   │   │   ├── track-interaction.controller.ts   # POST /recommendations/track
│   │   │   │   ├── train-model.controller.ts         # EventBridge scheduled
│   │   │   │   └── batch-inference.controller.ts     # Batch recommendations
│   │   │   │
│   │   │   ├── services/
│   │   │   │   ├── personalize.service.ts # Amazon Personalize
│   │   │   │   ├── interaction.service.ts # Interaction tracking
│   │   │   │   └── cache.service.ts       # DynamoDB caching
│   │   │   │
│   │   │   ├── repositories/
│   │   │   │   └── interaction.repository.ts
│   │   │   │
│   │   │   └── types/
│   │   │       └── recommendation.types.ts
│   │   │
│   │   ├── tests/
│   │   ├── serverless.yml
│   │   ├── package.json
│   │   └── tsconfig.json
│   │
│   ├── dashboard-service/              # Analytics Dashboard
│   │   ├── src/
│   │   │   ├── controllers/            # Lambda Controllers (API endpoints)
│   │   │   │   ├── get-stats.controller.ts        # GET /dashboard/stats
│   │   │   │   ├── get-revenue.controller.ts      # GET /dashboard/revenue
│   │   │   │   ├── get-bookings.controller.ts     # GET /dashboard/bookings
│   │   │   │   └── generate-report.controller.ts  # EventBridge scheduled
│   │   │   │
│   │   │   ├── services/
│   │   │   │   ├── analytics.service.ts # Data aggregation
│   │   │   │   ├── report.service.ts    # Report generation
│   │   │   │   └── s3.service.ts        # S3 report storage
│   │   │   │
│   │   │   └── types/
│   │   │       └── dashboard.types.ts
│   │   │
│   │   ├── tests/
│   │   ├── serverless.yml
│   │   ├── package.json
│   │   └── tsconfig.json
│   │
│   ├── admin-service/                  # Admin Management
│   │   ├── src/
│   │   │   ├── controllers/            # Lambda Controllers (API endpoints)
│   │   │   │   ├── manage-users.controller.ts     # GET/PUT/DELETE /admin/users
│   │   │   │   ├── manage-courts.controller.ts    # GET/PUT/DELETE /admin/courts
│   │   │   │   ├── moderate-reviews.controller.ts # GET/PUT /admin/reviews
│   │   │   │   ├── view-logs.controller.ts        # GET /admin/logs
│   │   │   │   └── export-data.controller.ts      # POST /admin/reports/export
│   │   │   │
│   │   │   ├── services/
│   │   │   │   ├── admin.service.ts    # Admin business logic
│   │   │   │   ├── cognito-admin.service.ts # Cognito admin operations
│   │   │   │   └── cloudwatch.service.ts    # CloudWatch integration
│   │   │   │
│   │   │   └── types/
│   │   │       └── admin.types.ts
│   │   │
│   │   ├── tests/
│   │   ├── serverless.yml
│   │   ├── package.json
│   │   └── tsconfig.json
│   │
│   └── notification-service/           # Email & Notifications
│       ├── src/
│       │   ├── controllers/            # Lambda Controllers (Event handlers)
│       │   │   ├── booking-confirmation.controller.ts # DynamoDB Stream trigger
│       │   │   ├── booking-reminder.controller.ts     # EventBridge scheduled
│       │   │   ├── cancellation-email.controller.ts   # Manual trigger
│       │   │   └── monthly-report.controller.ts       # EventBridge scheduled
│       │   │
│       │   ├── services/
│       │   │   ├── ses.service.ts      # Amazon SES integration
│       │   │   ├── template.service.ts # Email template rendering
│       │   │   └── scheduler.service.ts # Reminder scheduling
│       │   │
│       │   ├── templates/              # Email templates
│       │   │   ├── booking-confirmation.html
│       │   │   ├── booking-reminder.html
│       │   │   └── cancellation.html
│       │   │
│       │   └── types/
│       │       └── notification.types.ts
│       │
│       ├── tests/
│       ├── serverless.yml
│       ├── package.json
│       └── tsconfig.json
│
├── infrastructure/                     # Infrastructure as Code
│   ├── cloudformation/                 # CloudFormation templates
│   │   ├── dynamodb-tables.yml         # DynamoDB tables
│   │   ├── cognito-user-pool.yml       # Cognito configuration
│   │   ├── s3-buckets.yml              # S3 buckets
│   │   └── iam-roles.yml               # IAM roles and policies
│   │
│   ├── terraform/                      # Terraform (alternative to CF)
│   │   ├── main.tf
│   │   ├── variables.tf
│   │   └── outputs.tf
│   │
│   └── scripts/                        # Deployment scripts
│       ├── deploy-all.sh               # Deploy all services
│       ├── deploy-service.sh           # Deploy single service
│       └── setup-aws-resources.sh      # Initial AWS setup
│
├── monitoring/                         # Monitoring & Observability
│   ├── cloudwatch/
│   │   ├── dashboards/                 # CloudWatch dashboard configs
│   │   │   ├── operational-dashboard.json
│   │   │   └── business-dashboard.json
│   │   │
│   │   ├── alarms/                     # CloudWatch alarm configs
│   │   │   ├── lambda-alarms.yml
│   │   │   ├── api-gateway-alarms.yml
│   │   │   └── dynamodb-alarms.yml
│   │   │
│   │   └── log-groups/                 # Log group configurations
│   │       └── log-retention.yml
│   │
│   └── x-ray/                          # X-Ray tracing configs
│       └── sampling-rules.json
│
└── tests/                              # Integration & E2E tests
    ├── e2e/                            # End-to-end tests
    │   ├── booking-flow.test.ts
    │   └── search-flow.test.ts
    │
    ├── integration/                    # Service integration tests
    │   ├── auth-court.test.ts
    │   └── booking-notification.test.ts
    │
    └── load/                           # Load testing scripts
        ├── artillery-config.yml
        └── jmeter-test-plan.jmx
```

---

## Chi tiết từng thành phần

### 1. Shared Libraries (`shared/`)

Chứa code dùng chung cho tất cả services để tránh duplicate code.

#### `shared/lib/aws-clients.ts`
```typescript
import { DynamoDBClient } from '@aws-sdk/client-dynamodb';
import { DynamoDBDocumentClient } from '@aws-sdk/lib-dynamodb';
import { S3Client } from '@aws-sdk/client-s3';
import { SESClient } from '@aws-sdk/client-ses';

export class AWSClients {
  private static dynamoClient: DynamoDBDocumentClient;
  private static s3Client: S3Client;
  private static sesClient: SESClient;

  static getDynamoClient(): DynamoDBDocumentClient {
    if (!this.dynamoClient) {
      const client = new DynamoDBClient({
        region: process.env.AWS_REGION || 'ap-southeast-1'
      });
      this.dynamoClient = DynamoDBDocumentClient.from(client);
    }
    return this.dynamoClient;
  }

  static getS3Client(): S3Client {
    if (!this.s3Client) {
      this.s3Client = new S3Client({
        region: process.env.AWS_REGION || 'ap-southeast-1'
      });
    }
    return this.s3Client;
  }

  static getSESClient(): SESClient {
    if (!this.sesClient) {
      this.sesClient = new SESClient({
        region: process.env.AWS_REGION || 'ap-southeast-1'
      });
    }
    return this.sesClient;
  }
}
```

#### `shared/lib/response-builder.ts`
```typescript
export class ResponseBuilder {
  static success(data: any, statusCode: number = 200) {
    return {
      statusCode,
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*',
      },
      body: JSON.stringify({
        success: true,
        data,
        timestamp: new Date().toISOString()
      })
    };
  }

  static error(error: any, statusCode: number = 500) {
    return {
      statusCode,
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*',
      },
      body: JSON.stringify({
        success: false,
        error: {
          code: error.code || 'INTERNAL_ERROR',
          message: error.message || 'An error occurred',
          details: error.details || {}
        },
        timestamp: new Date().toISOString()
      })
    };
  }
}
```

#### `shared/lib/logger.ts`
```typescript
export class Logger {
  constructor(private service: string) {}

  info(message: string, metadata?: any) {
    console.log(JSON.stringify({
      level: 'INFO',
      service: this.service,
      message,
      metadata,
      timestamp: new Date().toISOString()
    }));
  }

  error(message: string, error?: any) {
    console.error(JSON.stringify({
      level: 'ERROR',
      service: this.service,
      message,
      error: {
        message: error?.message,
        stack: error?.stack
      },
      timestamp: new Date().toISOString()
    }));
  }
}
```

---

### 2. Service Structure (Example: `auth-service/`)

Mỗi service có cấu trúc tương tự nhau:

#### `services/auth-service/src/controllers/login.controller.ts`
```typescript
import { APIGatewayProxyHandler } from 'aws-lambda';
import { CognitoService } from '../services/cognito.service';
import { ResponseBuilder } from '../../../../shared/lib/response-builder';
import { Logger } from '../../../../shared/lib/logger';

const logger = new Logger('auth-login');
const cognitoService = new CognitoService();

/**
 * Lambda Controller for user login
 * Endpoint: POST /auth/login
 */
export const handler: APIGatewayProxyHandler = async (event) => {
  try {
    logger.info('Login request received');
    
    const { email, password } = JSON.parse(event.body || '{}');
    
    // Validate input
    if (!email || !password) {
      return ResponseBuilder.error(
        { code: 'VALIDATION_ERROR', message: 'Email and password required' },
        400
      );
    }
    
    // Authenticate with Cognito
    const result = await cognitoService.authenticateUser(email, password);
    
    logger.info('Login successful', { userId: result.userId });
    
    return ResponseBuilder.success(result);
    
  } catch (error) {
    logger.error('Login failed', error);
    return ResponseBuilder.error(error);
  }
};
```

#### `services/auth-service/src/services/cognito.service.ts`
```typescript
import { 
  CognitoIdentityProviderClient,
  InitiateAuthCommand,
  SignUpCommand
} from '@aws-sdk/client-cognito-identity-provider';

export class CognitoService {
  private client: CognitoIdentityProviderClient;
  private userPoolId: string;
  private clientId: string;

  constructor() {
    this.client = new CognitoIdentityProviderClient({
      region: process.env.AWS_REGION || 'ap-southeast-1'
    });
    this.userPoolId = process.env.COGNITO_USER_POOL_ID!;
    this.clientId = process.env.COGNITO_CLIENT_ID!;
  }

  async authenticateUser(email: string, password: string) {
    const command = new InitiateAuthCommand({
      AuthFlow: 'USER_PASSWORD_AUTH',
      ClientId: this.clientId,
      AuthParameters: {
        USERNAME: email,
        PASSWORD: password
      }
    });

    const response = await this.client.send(command);
    
    return {
      accessToken: response.AuthenticationResult?.AccessToken,
      refreshToken: response.AuthenticationResult?.RefreshToken,
      idToken: response.AuthenticationResult?.IdToken,
      expiresIn: response.AuthenticationResult?.ExpiresIn
    };
  }

  async registerUser(email: string, password: string, name: string) {
    const command = new SignUpCommand({
      ClientId: this.clientId,
      Username: email,
      Password: password,
      UserAttributes: [
        { Name: 'email', Value: email },
        { Name: 'name', Value: name }
      ]
    });

    const response = await this.client.send(command);
    return { userId: response.UserSub };
  }
}
```

#### `services/auth-service/serverless.yml`
```yaml
service: cloud-racket-auth-service

frameworkVersion: '3'

provider:
  name: aws
  runtime: nodejs18.x
  region: ap-southeast-1
  stage: ${opt:stage, 'dev'}
  
  environment:
    STAGE: ${self:provider.stage}
    COGNITO_USER_POOL_ID: ${cf:cloud-racket-infrastructure-${self:provider.stage}.CognitoUserPoolId}
    COGNITO_CLIENT_ID: ${cf:cloud-racket-infrastructure-${self:provider.stage}.CognitoClientId}
  
  iam:
    role:
      statements:
        - Effect: Allow
          Action:
            - cognito-idp:AdminCreateUser
            - cognito-idp:AdminInitiateAuth
            - cognito-idp:AdminGetUser
          Resource: 
            - arn:aws:cognito-idp:${self:provider.region}:*:userpool/*

plugins:
  - serverless-webpack
  - serverless-offline

custom:
  webpack:
    webpackConfig: ../../webpack.config.js
    includeModules: true

functions:
  register:
    handler: src/controllers/register.controller.handler
    events:
      - http:
          path: auth/register
          method: post
          cors: true

  login:
    handler: src/controllers/login.controller.handler
    events:
      - http:
          path: auth/login
          method: post
          cors: true

  refreshToken:
    handler: src/controllers/refresh-token.controller.handler
    events:
      - http:
          path: auth/refresh
          method: post
          cors: true

  userProfile:
    handler: src/controllers/user-profile.controller.handler
    events:
      - http:
          path: auth/user-profile
          method: get
          cors: true
          authorizer:
            type: COGNITO_USER_POOLS
            authorizerId: !Ref CognitoAuthorizer
```

---

### 3. Repository Pattern (Data Access Layer)

#### `services/court-service/src/repositories/court.repository.ts`
```typescript
import { PutCommand, GetCommand, QueryCommand, UpdateCommand } from '@aws-sdk/lib-dynamodb';
import { AWSClients } from '../../../../shared/lib/aws-clients';
import { Court } from '../types/court.types';

export class CourtRepository {
  private tableName = process.env.COURTS_TABLE || 'Courts';
  private dynamoClient = AWSClients.getDynamoClient();

  async create(court: Court): Promise<Court> {
    const command = new PutCommand({
      TableName: this.tableName,
      Item: {
        ...court,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      }
    });

    await this.dynamoClient.send(command);
    return court;
  }

  async findById(courtId: string): Promise<Court | null> {
    const command = new GetCommand({
      TableName: this.tableName,
      Key: { courtId }
    });

    const result = await this.dynamoClient.send(command);
    return result.Item as Court || null;
  }

  async findByOwnerId(ownerId: string): Promise<Court[]> {
    const command = new QueryCommand({
      TableName: this.tableName,
      IndexName: 'ownerId-index',
      KeyConditionExpression: 'ownerId = :ownerId',
      ExpressionAttributeValues: {
        ':ownerId': ownerId
      }
    });

    const result = await this.dynamoClient.send(command);
    return result.Items as Court[] || [];
  }

  async update(courtId: string, updates: Partial<Court>): Promise<Court> {
    const command = new UpdateCommand({
      TableName: this.tableName,
      Key: { courtId },
      UpdateExpression: 'SET #name = :name, #address = :address, updatedAt = :updatedAt',
      ExpressionAttributeNames: {
        '#name': 'name',
        '#address': 'address'
      },
      ExpressionAttributeValues: {
        ':name': updates.name,
        ':address': updates.address,
        ':updatedAt': new Date().toISOString()
      },
      ReturnValues: 'ALL_NEW'
    });

    const result = await this.dynamoClient.send(command);
    return result.Attributes as Court;
  }
}
```

---

### 4. Infrastructure as Code

#### `infrastructure/cloudformation/dynamodb-tables.yml`
```yaml
AWSTemplateFormatVersion: '2010-09-09'
Description: DynamoDB tables for Cloud Racket Platform

Resources:
  CourtsTable:
    Type: AWS::DynamoDB::Table
    Properties:
      TableName: !Sub 'cloud-racket-courts-${Environment}'
      BillingMode: PAY_PER_REQUEST
      AttributeDefinitions:
        - AttributeName: courtId
          AttributeType: S
        - AttributeName: ownerId
          AttributeType: S
      KeySchema:
        - AttributeName: courtId
          KeyType: HASH
      GlobalSecondaryIndexes:
        - IndexName: ownerId-index
          KeySchema:
            - AttributeName: ownerId
              KeyType: HASH
          Projection:
            ProjectionType: ALL
      PointInTimeRecoverySpecification:
        PointInTimeRecoveryEnabled: true
      SSESpecification:
        SSEEnabled: true
      Tags:
        - Key: Environment
          Value: !Ref Environment
        - Key: Project
          Value: CloudRacket

  BookingsTable:
    Type: AWS::DynamoDB::Table
    Properties:
      TableName: !Sub 'cloud-racket-bookings-${Environment}'
      BillingMode: PAY_PER_REQUEST
      AttributeDefinitions:
        - AttributeName: bookingId
          AttributeType: S
        - AttributeName: userId
          AttributeType: S
        - AttributeName: courtId
          AttributeType: S
      KeySchema:
        - AttributeName: bookingId
          KeyType: HASH
      GlobalSecondaryIndexes:
        - IndexName: userId-index
          KeySchema:
            - AttributeName: userId
              KeyType: HASH
          Projection:
            ProjectionType: ALL
        - IndexName: courtId-index
          KeySchema:
            - AttributeName: courtId
              KeyType: HASH
          Projection:
            ProjectionType: ALL
      StreamSpecification:
        StreamViewType: NEW_AND_OLD_IMAGES
      PointInTimeRecoverySpecification:
        PointInTimeRecoveryEnabled: true
      SSESpecification:
        SSEEnabled: true

Parameters:
  Environment:
    Type: String
    Default: dev
    AllowedValues:
      - dev
      - staging
      - prod

Outputs:
  CourtsTableName:
    Value: !Ref CourtsTable
    Export:
      Name: !Sub '${AWS::StackName}-CourtsTable'
  
  BookingsTableName:
    Value: !Ref BookingsTable
    Export:
      Name: !Sub '${AWS::StackName}-BookingsTable'
```

---

### 5. Deployment Scripts

#### `infrastructure/scripts/deploy-all.sh`
```bash
#!/bin/bash

STAGE=${1:-dev}

echo "Deploying Cloud Racket Platform to $STAGE environment..."

# Deploy infrastructure first
echo "1. Deploying infrastructure..."
cd infrastructure/cloudformation
aws cloudformation deploy \
  --template-file dynamodb-tables.yml \
  --stack-name cloud-racket-infrastructure-$STAGE \
  --parameter-overrides Environment=$STAGE \
  --capabilities CAPABILITY_IAM

# Deploy each service
echo "2. Deploying auth-service..."
cd ../../services/auth-service
serverless deploy --stage $STAGE

echo "3. Deploying court-service..."
cd ../court-service
serverless deploy --stage $STAGE

echo "4. Deploying booking-service..."
cd ../booking-service
serverless deploy --stage $STAGE

echo "5. Deploying review-service..."
cd ../review-service
serverless deploy --stage $STAGE

echo "6. Deploying recommendation-service..."
cd ../recommendation-service
serverless deploy --stage $STAGE

echo "7. Deploying dashboard-service..."
cd ../dashboard-service
serverless deploy --stage $STAGE

echo "8. Deploying admin-service..."
cd ../admin-service
serverless deploy --stage $STAGE

echo "9. Deploying notification-service..."
cd ../notification-service
serverless deploy --stage $STAGE

echo "✅ Deployment complete!"
```

#### `infrastructure/scripts/deploy-service.sh`
```bash
#!/bin/bash

SERVICE=$1
STAGE=${2:-dev}

if [ -z "$SERVICE" ]; then
  echo "Usage: ./deploy-service.sh <service-name> [stage]"
  echo "Example: ./deploy-service.sh auth-service dev"
  exit 1
fi

echo "Deploying $SERVICE to $STAGE environment..."

cd services/$SERVICE
serverless deploy --stage $STAGE

echo "✅ $SERVICE deployed successfully!"
```

---

## Environment Configuration

### `.env.dev`
```bash
# AWS Configuration
AWS_REGION=ap-southeast-1
STAGE=dev

# Cognito
COGNITO_USER_POOL_ID=ap-southeast-1_xxxxxxxxx
COGNITO_CLIENT_ID=xxxxxxxxxxxxxxxxxxxxxxxxxx

# DynamoDB Tables
DYNAMODB_COURTS_TABLE=cloud-racket-courts-dev
DYNAMODB_BOOKINGS_TABLE=cloud-racket-bookings-dev
DYNAMODB_REVIEWS_TABLE=cloud-racket-reviews-dev
DYNAMODB_INTERACTIONS_TABLE=cloud-racket-interactions-dev

# S3 Buckets
S3_IMAGES_BUCKET=cloud-racket-images-dev
S3_REPORTS_BUCKET=cloud-racket-reports-dev

# SES
SES_FROM_EMAIL=noreply@cloudracket.com
SES_REGION=ap-southeast-1

# Amazon Personalize
PERSONALIZE_CAMPAIGN_ARN=arn:aws:personalize:ap-southeast-1:xxx:campaign/xxx

# Amazon Location Service
LOCATION_PLACE_INDEX=cloud-racket-place-index
```

---

## Lợi ích của cấu trúc này

### 1. **Service Independence**
- Mỗi service có thể deploy độc lập
- Không ảnh hưởng đến services khác khi update
- Dễ dàng scale từng service riêng biệt

### 2. **Code Reusability**
- Shared libraries tránh duplicate code
- Common types và utilities dùng chung
- Middleware và error handling nhất quán

### 3. **Clear Separation of Concerns**
- **Handlers**: Xử lý HTTP requests (như Controllers)
- **Services**: Business logic
- **Repositories**: Data access layer
- **Types**: TypeScript type definitions

### 4. **Testability**
- Mỗi layer có thể test riêng biệt
- Mock AWS services dễ dàng
- Unit tests và integration tests tách biệt

### 5. **Scalability**
- Lambda auto-scale theo traffic
- Mỗi service scale độc lập
- DynamoDB on-demand pricing

### 6. **Maintainability**
- Cấu trúc rõ ràng, dễ navigate
- Convention nhất quán giữa các services
- Documentation gần với code

### 7. **CI/CD Friendly**
- Mỗi service có pipeline riêng
- Deploy từng service hoặc deploy all
- Rollback dễ dàng

---

## Development Workflow

### 1. **Local Development**
```bash
# Install dependencies
cd services/auth-service
npm install

# Run locally with serverless-offline
npm run dev

# Test endpoint
curl http://localhost:3000/auth/login
```

### 2. **Testing**
```bash
# Unit tests
npm test

# Integration tests
npm run test:integration

# Coverage
npm run test:coverage
```

### 3. **Deployment**
```bash
# Deploy single service
cd services/auth-service
serverless deploy --stage dev

# Deploy all services
./infrastructure/scripts/deploy-all.sh dev
```

### 4. **Monitoring**
```bash
# View logs
serverless logs -f login --stage dev --tail

# View metrics in CloudWatch
aws cloudwatch get-metric-statistics \
  --namespace AWS/Lambda \
  --metric-name Invocations \
  --dimensions Name=FunctionName,Value=auth-service-dev-login
```

---

## So sánh với kiến trúc truyền thống

| Aspect | Traditional (Express.js) | Serverless (AWS Lambda) |
|--------|-------------------------|-------------------------|
| **Routing** | Express Router | API Gateway |
| **Controllers** | Controller classes | Lambda Handlers |
| **Server** | Always running | On-demand |
| **Scaling** | Manual/Auto-scaling groups | Automatic |
| **Cost** | Fixed (EC2/ECS) | Pay per request |
| **Deployment** | Single monolith | Multiple services |
| **Cold Start** | None | 100-500ms |
| **State** | In-memory | Stateless |

---

## Kết luận

Cấu trúc này được thiết kế đặc biệt cho **AWS Serverless Microservices** với:

✅ **Lambda Handlers thay thế Controllers**  
✅ **API Gateway handle routing**  
✅ **Shared libraries tránh duplicate**  
✅ **Repository pattern cho data access**  
✅ **Infrastructure as Code**  
✅ **CI/CD automation**  
✅ **Monitoring và logging tập trung**

Bạn có thể bắt đầu implement từng service một, test locally với `serverless-offline`, và deploy lên AWS khi sẵn sàng!


---

## Tại sao đổi từ `handlers/` sang `controllers/`?

### ✅ **Lợi ích:**

1. **Dễ hiểu hơn cho developers**
   - "Controller" là thuật ngữ quen thuộc trong MVC pattern
   - Rõ ràng đây là layer xử lý HTTP requests

2. **Nhất quán với kiến trúc truyền thống**
   - Dễ dàng chuyển đổi từ Express.js sang Lambda
   - Team không cần học thuật ngữ mới

3. **Phân biệt rõ với Middleware**
   - `controllers/` = Entry points (xử lý requests)
   - `middleware/` = Pre/post processing

4. **Convention rõ ràng**
   - File naming: `*.controller.ts`
   - Export: `handler` (vì Serverless Framework yêu cầu)

### 📝 **Naming Convention:**

```
controllers/
├── login.controller.ts          # Lambda Controller
├── register.controller.ts       # Lambda Controller
└── user-profile.controller.ts   # Lambda Controller

middleware/
├── auth.middleware.ts           # Lambda Middleware
└── validation.middleware.ts     # Lambda Middleware

services/
├── cognito.service.ts           # Business Logic
└── jwt.service.ts               # Business Logic

repositories/
└── user.repository.ts           # Data Access
```

### 🔄 **Request Flow với Controllers:**

```
API Gateway Request
       ↓
   CORS Middleware
       ↓
   Auth Middleware
       ↓
   Validation Middleware
       ↓
   CONTROLLER (login.controller.ts)
       ↓
   Service Layer (cognito.service.ts)
       ↓
   Repository Layer (user.repository.ts)
       ↓
   DynamoDB
```

### 💡 **Best Practices:**

1. **Controller chỉ xử lý HTTP concerns:**
   - Parse request body
   - Validate input (hoặc dùng middleware)
   - Call service layer
   - Format response

2. **Business logic nằm ở Service layer:**
   - Authentication logic
   - Business rules
   - Data transformation

3. **Data access nằm ở Repository layer:**
   - DynamoDB queries
   - S3 operations
   - External API calls

---

## Cập nhật Serverless.yml

Khi đổi sang `controllers/`, cần update path trong `serverless.yml`:

```yaml
functions:
  login:
    # OLD: handler: src/handlers/login.handler
    # NEW:
    handler: src/controllers/login.controller.handler
    events:
      - http:
          path: auth/login
          method: post
          cors: true
```

**Lưu ý:** Export name vẫn là `handler` vì Serverless Framework yêu cầu!


---

## API Gateway = Router (Routing Layer)

### **So sánh Express.js vs API Gateway**

#### **Express.js (Traditional)**
```typescript
// routes/auth.routes.ts
import express from 'express';
import { AuthController } from '../controllers/auth.controller';

const router = express.Router();

// Routing logic trong code
router.post('/auth/register', AuthController.register);
router.post('/auth/login', AuthController.login);
router.post('/auth/refresh', AuthController.refreshToken);
router.get('/auth/user-profile', authMiddleware, AuthController.getUserProfile);
router.put('/auth/user-profile', authMiddleware, AuthController.updateUserProfile);

export default router;
```

#### **API Gateway + Lambda (Serverless)**
```yaml
# serverless.yml - Routing logic trong config
functions:
  register:
    handler: src/controllers/register.controller.handler
    events:
      - http:
          path: auth/register      # Route path
          method: post             # HTTP method
          cors: true

  login:
    handler: src/controllers/login.controller.handler
    events:
      - http:
          path: auth/login
          method: post
          cors: true

  refreshToken:
    handler: src/controllers/refresh-token.controller.handler
    events:
      - http:
          path: auth/refresh
          method: post
          cors: true

  getUserProfile:
    handler: src/controllers/user-profile.controller.handler
    events:
      - http:
          path: auth/user-profile
          method: get
          cors: true
          authorizer:              # Middleware equivalent
            type: COGNITO_USER_POOLS
            arn: ${cf:CognitoUserPoolArn}

  updateUserProfile:
    handler: src/controllers/user-profile.controller.handler
    events:
      - http:
          path: auth/user-profile
          method: put
          cors: true
          authorizer:
            type: COGNITO_USER_POOLS
            arn: ${cf:CognitoUserPoolArn}
```

---

## **Mapping đầy đủ: Express.js → AWS Serverless**

| Express.js Component | AWS Serverless Equivalent | Mô tả |
|---------------------|---------------------------|-------|
| **Express Router** | **API Gateway** | Routing requests đến đúng handler |
| **app.use(router)** | **serverless.yml events** | Đăng ký routes |
| **Controller** | **Lambda Controller** | Xử lý business logic |
| **Middleware** | **Lambda Middleware / API Gateway Authorizer** | Pre/post processing |
| **Express Server** | **Lambda Runtime** | Execution environment |
| **Port 3000** | **API Gateway URL** | Entry point |
| **req, res** | **event, context** | Request/response objects |

---

## **API Gateway Features (Router++)**

API Gateway không chỉ là router, nó còn cung cấp nhiều tính năng:

### 1. **Routing (Core)**
```yaml
events:
  - http:
      path: /users/{id}        # Path parameters
      method: get
      request:
        parameters:
          paths:
            id: true             # Required path param
          querystrings:
            filter: false        # Optional query param
```

### 2. **Request Validation**
```yaml
events:
  - http:
      path: /bookings
      method: post
      request:
        schemas:
          application/json: ${file(schemas/create-booking.json)}
```

### 3. **Rate Limiting**
```yaml
provider:
  apiGateway:
    throttle:
      burstLimit: 200          # Max concurrent requests
      rateLimit: 100           # Requests per second
```

### 4. **Caching**
```yaml
events:
  - http:
      path: /courts
      method: get
      caching:
        enabled: true
        ttlInSeconds: 60       # Cache for 60 seconds
```

### 5. **CORS Configuration**
```yaml
events:
  - http:
      path: /auth/login
      method: post
      cors:
        origin: 'https://cloudracket.com'
        headers:
          - Content-Type
          - Authorization
        allowCredentials: true
```

### 6. **Authorization (Middleware)**
```yaml
events:
  - http:
      path: /bookings
      method: post
      authorizer:
        type: COGNITO_USER_POOLS
        arn: arn:aws:cognito-idp:region:account:userpool/poolId
        claims:
          - email
          - sub
```

### 7. **Custom Domain**
```yaml
custom:
  customDomain:
    domainName: api.cloudracket.com
    certificateName: '*.cloudracket.com'
    basePath: v1
    stage: ${self:provider.stage}
    createRoute53Record: true
```

---

## **Complete Architecture Mapping**

### **Express.js Architecture:**
```
┌─────────────────────────────────────────┐
│         Express Application             │
│                                         │
│  ┌───────────────────────────────────┐  │
│  │      Express Router               │  │
│  │  - app.use('/auth', authRoutes)   │  │
│  │  - app.use('/courts', courtRoutes)│  │
│  └───────────────────────────────────┘  │
│              ↓                          │
│  ┌───────────────────────────────────┐  │
│  │      Middleware Stack             │  │
│  │  - cors()                         │  │
│  │  - authMiddleware()               │  │
│  │  - validationMiddleware()         │  │
│  └───────────────────────────────────┘  │
│              ↓                          │
│  ┌───────────────────────────────────┐  │
│  │      Controllers                  │  │
│  │  - AuthController.login()         │  │
│  │  - CourtController.search()       │  │
│  └───────────────────────────────────┘  │
│              ↓                          │
│  ┌───────────────────────────────────┐  │
│  │      Services                     │  │
│  │  - AuthService                    │  │
│  │  - CourtService                   │  │
│  └───────────────────────────────────┘  │
│              ↓                          │
│  ┌───────────────────────────────────┐  │
│  │      Repositories                 │  │
│  │  - UserRepository                 │  │
│  │  - CourtRepository                │  │
│  └───────────────────────────────────┘  │
│              ↓                          │
│         Database (MongoDB/PostgreSQL)   │
└─────────────────────────────────────────┘
```

### **AWS Serverless Architecture:**
```
┌─────────────────────────────────────────┐
│         API Gateway (Router)            │
│                                         │
│  Routes defined in serverless.yml:     │
│  - POST /auth/login                     │
│  - GET  /courts                         │
│  - POST /bookings                       │
│                                         │
│  Features:                              │
│  - Request validation                   │
│  - Rate limiting                        │
│  - Caching                              │
│  - CORS                                 │
│  - Cognito Authorizer (Middleware)      │
└─────────────────────────────────────────┘
              ↓
┌─────────────────────────────────────────┐
│      Lambda Functions (Controllers)     │
│                                         │
│  ┌───────────────────────────────────┐  │
│  │  login.controller.ts              │  │
│  │  - Parse event                    │  │
│  │  - Call service                   │  │
│  │  - Return response                │  │
│  └───────────────────────────────────┘  │
│                                         │
│  Optional: Lambda Middleware            │
│  - Custom auth logic                    │
│  - Additional validation                │
└─────────────────────────────────────────┘
              ↓
┌─────────────────────────────────────────┐
│      Services (Business Logic)          │
│  - CognitoService                       │
│  - CourtService                         │
│  - BookingService                       │
└─────────────────────────────────────────┘
              ↓
┌─────────────────────────────────────────┐
│      Repositories (Data Access)         │
│  - UserRepository                       │
│  - CourtRepository                      │
│  - BookingRepository                    │
└─────────────────────────────────────────┘
              ↓
┌─────────────────────────────────────────┐
│         DynamoDB (Database)             │
└─────────────────────────────────────────┘
```

---

## **Routing Examples**

### **1. Simple Route**
```yaml
# serverless.yml
functions:
  getCourt:
    handler: src/controllers/get-court.controller.handler
    events:
      - http:
          path: courts/{id}
          method: get
```

```typescript
// src/controllers/get-court.controller.ts
export const handler: APIGatewayProxyHandler = async (event) => {
  const courtId = event.pathParameters?.id; // API Gateway extracts path param
  const court = await courtService.findById(courtId);
  return ResponseBuilder.success(court);
};
```

### **2. Route with Query Parameters**
```yaml
functions:
  searchCourts:
    handler: src/controllers/search-courts.controller.handler
    events:
      - http:
          path: courts
          method: get
          request:
            parameters:
              querystrings:
                city: false
                priceMin: false
                priceMax: false
```

```typescript
// src/controllers/search-courts.controller.ts
export const handler: APIGatewayProxyHandler = async (event) => {
  const { city, priceMin, priceMax } = event.queryStringParameters || {};
  const courts = await courtService.search({ city, priceMin, priceMax });
  return ResponseBuilder.success(courts);
};
```

### **3. Protected Route (with Authorizer)**
```yaml
functions:
  createBooking:
    handler: src/controllers/create-booking.controller.handler
    events:
      - http:
          path: bookings
          method: post
          authorizer:
            type: COGNITO_USER_POOLS
            arn: ${cf:CognitoUserPoolArn}
```

```typescript
// src/controllers/create-booking.controller.ts
export const handler: APIGatewayProxyHandler = async (event) => {
  // User info from Cognito Authorizer
  const userId = event.requestContext.authorizer?.claims.sub;
  
  const { courtId, date, timeSlot } = JSON.parse(event.body!);
  const booking = await bookingService.create({ userId, courtId, date, timeSlot });
  
  return ResponseBuilder.success(booking, 201);
};
```

---

## **Tóm tắt**

| Component | Express.js | AWS Serverless |
|-----------|-----------|----------------|
| **Router** | Express Router (code) | API Gateway (config) |
| **Route Definition** | `router.get('/path', handler)` | `serverless.yml events` |
| **Middleware** | `app.use(middleware)` | API Gateway Authorizer + Lambda Middleware |
| **Controller** | Controller class/function | Lambda Controller |
| **Request Object** | `req` | `event` |
| **Response Object** | `res` | Return object |
| **Server** | Express server on port | API Gateway URL |

**API Gateway = Router + Middleware + Load Balancer + Rate Limiter + Cache + Security**

Nó mạnh hơn Express Router rất nhiều! 🚀
