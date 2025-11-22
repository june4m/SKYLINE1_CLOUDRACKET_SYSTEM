# Design Document - Cloud Racket Platform

## Overview

Cloud Racket Platform là một nền tảng serverless được xây dựng hoàn toàn trên AWS, cho phép người dùng tìm kiếm, đặt sân cầu lông theo thời gian thực với gợi ý cá nhân hóa dựa trên AI. Hệ thống được thiết kế theo kiến trúc microservices với các Lambda functions độc lập, giao tiếp qua API Gateway, và sử dụng DynamoDB làm cơ sở dữ liệu chính.

### Design Principles

1. **Serverless First**: Sử dụng managed services để giảm operational overhead
2. **Security by Design**: Mã hóa dữ liệu, least privilege access, WAF protection
3. **Cost Optimization**: Sử dụng on-demand pricing, caching, batch processing
4. **Scalability**: Auto-scaling cho tất cả components
5. **Observability**: Comprehensive logging và monitoring với CloudWatch

## Architecture

### High-Level Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                         Users / Court Owners                     │
└────────────────────────────┬────────────────────────────────────┘
                             │
                             ▼
┌─────────────────────────────────────────────────────────────────┐
│                    AWS Amplify Hosting                           │
│              (React/Next.js Frontend + CI/CD)                    │
└────────────────────────────┬────────────────────────────────────┘
                             │
                             ▼
┌─────────────────────────────────────────────────────────────────┐
│                      Amazon CloudFront                           │
│                    (CDN + WAF Protection)                        │
└────────────────────────────┬────────────────────────────────────┘
                             │
                             ▼
┌─────────────────────────────────────────────────────────────────┐
│                    Amazon API Gateway                            │
│              (REST API + Rate Limiting + Caching)                │
└────────────────────────────┬────────────────────────────────────┘
                             │
                             ▼
┌─────────────────────────────────────────────────────────────────┐
│                      AWS Lambda Functions                        │
│  ┌──────────┬──────────┬──────────┬──────────┬──────────┐       │
│  │  Auth    │  Court   │ Booking  │  Rec.    │  Admin   │       │
│  │ Service  │ Service  │ Service  │ Service  │ Service  │       │
│  └──────────┴──────────┴──────────┴──────────┴──────────┘       │
└────────────────────────────┬────────────────────────────────────┘
                             │
                             ▼
┌─────────────────────────────────────────────────────────────────┐
│                     Data & Storage Layer                         │
│  ┌──────────────┬──────────────┬──────────────┬──────────────┐  │
│  │   DynamoDB   │   S3 Bucket  │   Cognito    │  Personalize │  │
│  │  (NoSQL DB)  │   (Images)   │   (Auth)     │  (ML Model)  │  │
│  └──────────────┴──────────────┴──────────────┴──────────────┘  │
└─────────────────────────────────────────────────────────────────┘
                             │
                             ▼
┌─────────────────────────────────────────────────────────────────┐
│                   Supporting Services                            │
│  ┌──────────┬──────────┬──────────┬──────────┬──────────┐       │
│  │   SES    │ Location │CloudWatch│EventBridge│   KMS   │       │
│  │ (Email)  │ Service  │(Monitor) │(Scheduler)│(Encrypt)│       │
│  └──────────┴──────────┴──────────┴──────────┴──────────┘       │
└─────────────────────────────────────────────────────────────────┘
```

### Architecture Layers

#### 1. Presentation Layer
- **AWS Amplify**: Hosts React/Next.js frontend application
- **CloudFront**: CDN for static assets, reduces latency
- **AWS WAF**: Protects against common web exploits

#### 2. API Layer
- **API Gateway**: RESTful API endpoints with request validation
- **Cognito Authorizer**: JWT token validation for protected routes
- **Rate Limiting**: 100 requests/minute per user
- **Caching**: 60-second TTL for GET requests

#### 3. Business Logic Layer
- **Lambda Functions**: Serverless compute for each microservice
- **Node.js Runtime**: Primary runtime for all Lambda functions
- **Environment Variables**: Configuration management

#### 4. Data Layer
- **DynamoDB**: Primary database for all application data
- **S3**: Object storage for court images and reports
- **Cognito User Pool**: User authentication and management

#### 5. Integration Layer
- **Amazon Personalize**: ML-based recommendation engine
- **Amazon Location Service**: Geospatial queries and mapping
- **Amazon SES**: Transactional email delivery
- **Amazon Comprehend**: (Optional) Sentiment analysis

#### 6. Operations Layer
- **CloudWatch**: Centralized logging and monitoring
- **EventBridge**: Event-driven automation and scheduling
- **AWS IAM**: Identity and access management
- **AWS KMS**: Encryption key management

## Components and Interfaces

### 1. Authentication Service

**Purpose**: Manages user registration, login, and authorization

**Technology Stack**:
- Amazon Cognito User Pool
- AWS Lambda (Node.js)
- API Gateway

**API Endpoints**:

```
POST /auth/register
POST /auth/login
POST /auth/refresh
POST /auth/forgot-password
POST /auth/verify-email
GET  /auth/user-profile
PUT  /auth/user-profile
```

**Data Flow**:
1. User submits credentials to API Gateway
2. Lambda function validates input and calls Cognito
3. Cognito creates user or issues JWT token
4. Lambda returns token to client
5. Client stores token in localStorage/sessionStorage

**Security Considerations**:
- Password requirements: min 8 chars, uppercase, lowercase, number, special char
- MFA support via Cognito
- JWT tokens expire after 24 hours
- Refresh tokens valid for 30 days

### 2. Court Service

**Purpose**: Manages court information, search, and availability

**Technology Stack**:
- AWS Lambda (Node.js)
- DynamoDB (Courts table, Availability table)
- S3 (Court images)
- Amazon Location Service
- API Gateway

**API Endpoints**:
```
GET    /courts                    # Search courts with filters
GET    /courts/:id                # Get court details
POST   /courts                    # Create court (Court Owner only)
PUT    /courts/:id                # Update court (Court Owner only)
DELETE /courts/:id                # Delete court (Court Owner only)
GET    /courts/:id/availability   # Get availability for date range
PUT    /courts/:id/availability   # Update availability (Court Owner only)
POST   /courts/:id/images         # Upload court images
GET    /courts/nearby             # Get courts near location
```

**DynamoDB Schema - Courts Table**:
```json
{
  "courtId": "string (PK)",
  "ownerId": "string (GSI)",
  "name": "string",
  "address": "string",
  "latitude": "number",
  "longitude": "number",
  "description": "string",
  "facilities": ["string"],
  "pricePerHour": "number",
  "currency": "VND",
  "images": ["string"],
  "averageRating": "number",
  "totalReviews": "number",
  "status": "active|inactive",
  "createdAt": "string (ISO 8601)",
  "updatedAt": "string (ISO 8601)"
}
```

**DynamoDB Schema - Availability Table**:
```json
{
  "availabilityId": "string (PK: courtId#date#timeSlot)",
  "courtId": "string (GSI)",
  "date": "string (YYYY-MM-DD)",
  "timeSlot": "string (HH:mm-HH:mm)",
  "status": "available|booked|blocked",
  "bookingId": "string (optional)",
  "version": "number (for optimistic locking)"
}
```

**Geospatial Search Implementation**:
- Use DynamoDB with latitude/longitude attributes
- Implement haversine formula in Lambda for distance calculation
- Alternative: Amazon Location Service Place Index for advanced search

### 3. Booking Service

**Purpose**: Handles court bookings, cancellations, and booking history

**Technology Stack**:
- AWS Lambda (Node.js)
- DynamoDB (Bookings table)
- Amazon SES (Email notifications)
- EventBridge (Reminder scheduling)
- API Gateway

**API Endpoints**:
```
POST   /bookings              # Create new booking
GET    /bookings/:id          # Get booking details
GET    /bookings              # List user's bookings
PUT    /bookings/:id/cancel   # Cancel booking
GET    /bookings/history      # Get booking history
```

**DynamoDB Schema - Bookings Table**:
```json
{
  "bookingId": "string (PK)",
  "userId": "string (GSI)",
  "courtId": "string (GSI)",
  "courtName": "string",
  "date": "string (YYYY-MM-DD)",
  "timeSlot": "string (HH:mm-HH:mm)",
  "pricePerHour": "number",
  "totalPrice": "number",
  "status": "confirmed|cancelled|completed",
  "paymentStatus": "pending|paid|refunded",
  "createdAt": "string (ISO 8601)",
  "updatedAt": "string (ISO 8601)",
  "cancelledAt": "string (ISO 8601, optional)"
}
```

**Booking Flow**:
1. User selects court, date, and time slot
2. Lambda checks availability in DynamoDB (with optimistic locking)
3. If available, create booking record and update availability
4. Trigger SES to send confirmation email
5. Schedule reminder via EventBridge (24 hours before)
6. Return booking confirmation to user

**Concurrency Handling**:
- Use DynamoDB conditional writes with version attribute
- Implement retry logic with exponential backoff
- Return appropriate error if slot already booked

### 4. Recommendation Service

**Purpose**: Provides personalized court recommendations using ML

**Technology Stack**:
- AWS Lambda (Node.js)
- Amazon Personalize
- DynamoDB (Interactions table)
- API Gateway

**API Endpoints**:
```
GET  /recommendations          # Get personalized recommendations
POST /recommendations/track    # Track user interaction
```

**Amazon Personalize Setup**:

**Dataset Groups**:
1. **Users Dataset**: userId, location, preferences
2. **Items Dataset**: courtId, location, price, rating, facilities
3. **Interactions Dataset**: userId, courtId, eventType, timestamp

**Event Types**:
- `view`: User views court details
- `book`: User books a court
- `rate`: User rates a court
- `favorite`: User adds court to favorites

**Recipe**: `aws-user-personalization` (70% behavior + 30% metadata)

**Training Schedule**: Weekly via EventBridge + Lambda

**Inference Mode**: Batch inference (cost-effective)

**DynamoDB Schema - Interactions Table**:
```json
{
  "interactionId": "string (PK)",
  "userId": "string (GSI)",
  "courtId": "string",
  "eventType": "view|book|rate|favorite",
  "timestamp": "number (Unix timestamp)",
  "metadata": {
    "rating": "number (optional)",
    "duration": "number (optional)"
  }
}
```

### 5. Review Service

**Purpose**: Manages court reviews and ratings

**Technology Stack**:
- AWS Lambda (Node.js)
- DynamoDB (Reviews table)
- Amazon Comprehend (Optional sentiment analysis)
- API Gateway

**API Endpoints**:
```
POST   /reviews               # Submit review
GET    /reviews/court/:id     # Get court reviews
GET    /reviews/:id           # Get review details
PUT    /reviews/:id           # Update review
DELETE /reviews/:id           # Delete review (Admin only)
```

**DynamoDB Schema - Reviews Table**:
```json
{
  "reviewId": "string (PK)",
  "userId": "string (GSI)",
  "courtId": "string (GSI)",
  "bookingId": "string",
  "rating": "number (1-5)",
  "comment": "string",
  "sentimentScore": "number (optional, -1 to 1)",
  "status": "pending|approved|rejected",
  "createdAt": "string (ISO 8601)",
  "updatedAt": "string (ISO 8601)"
}
```

**Sentiment Analysis Flow** (Optional):
1. User submits review with Vietnamese text
2. Lambda sends comment to Amazon Comprehend
3. Comprehend returns sentiment (POSITIVE, NEGATIVE, NEUTRAL, MIXED)
4. Convert sentiment to score: Positive=1, Neutral=0, Negative=-1
5. Adjust court rating: `finalScore = (rating * 0.7) + (sentimentScore * 0.3)`

### 6. Dashboard Service

**Purpose**: Provides analytics and statistics for Court Owners

**Technology Stack**:
- AWS Lambda (Node.js)
- DynamoDB (aggregated queries)
- S3 (monthly reports)
- Chart.js (frontend visualization)
- API Gateway

**API Endpoints**:
```
GET  /dashboard/stats          # Get overall statistics
GET  /dashboard/revenue        # Get revenue by period
GET  /dashboard/bookings       # Get booking trends
GET  /dashboard/courts         # Get court performance
GET  /dashboard/reports/:month # Download monthly report
```

**Metrics Tracked**:
- Total revenue (daily, weekly, monthly)
- Number of bookings
- Average rating per court
- Occupancy rate
- Peak hours
- User retention rate

**Data Aggregation Strategy**:
- Real-time: Query DynamoDB directly for current day
- Historical: Pre-aggregated data stored in S3 (generated monthly)
- Use DynamoDB Streams + Lambda to update aggregates

### 7. Admin Service

**Purpose**: Administrative functions for platform management

**Technology Stack**:
- AWS Lambda (Node.js)
- DynamoDB (all tables)
- AWS Amplify Admin UI
- API Gateway

**API Endpoints**:
```
GET    /admin/users           # List all users
PUT    /admin/users/:id       # Update user
DELETE /admin/users/:id       # Delete user
GET    /admin/courts          # List all courts
PUT    /admin/courts/:id      # Update court
DELETE /admin/courts/:id      # Delete court
GET    /admin/reviews         # List pending reviews
PUT    /admin/reviews/:id     # Approve/reject review
GET    /admin/logs            # View system logs
GET    /admin/metrics         # View system metrics
POST   /admin/reports/export  # Export data
```

**Access Control**:
- Only users with `admin` role in Cognito can access
- API Gateway uses Cognito Authorizer with custom claims
- Lambda validates admin role before processing

## Data Models

### Entity Relationship Diagram

```
┌─────────────┐         ┌─────────────┐         ┌─────────────┐
│    User     │         │    Court    │         │   Booking   │
├─────────────┤         ├─────────────┤         ├─────────────┤
│ userId (PK) │────┐    │courtId (PK) │────┐    │bookingId(PK)│
│ email       │    │    │ ownerId     │    │    │ userId (FK) │
│ name        │    │    │ name        │    │    │ courtId(FK) │
│ phone       │    │    │ address     │    │    │ date        │
│ role        │    │    │ lat/lng     │    │    │ timeSlot    │
│ createdAt   │    │    │ price       │    │    │ status      │
└─────────────┘    │    │ rating      │    │    │ totalPrice  │
                   │    │ status      │    │    │ createdAt   │
                   │    └─────────────┘    │    └─────────────┘
                   │                       │
                   │    ┌─────────────┐    │
                   └───▶│   Review    │◀───┘
                        ├─────────────┤
                        │reviewId (PK)│
                        │ userId (FK) │
                        │ courtId(FK) │
                        │ rating      │
                        │ comment     │
                        │ sentiment   │
                        └─────────────┘
```

### DynamoDB Table Design

**Access Patterns**:
1. Get user by userId
2. Get court by courtId
3. Get courts by ownerId
4. Get courts near location (lat/lng)
5. Get bookings by userId
6. Get bookings by courtId
7. Get reviews by courtId
8. Get reviews by userId
9. Get availability by courtId and date

**Table Strategy**: Single-table design vs Multiple tables

**Decision**: Use **multiple tables** for simplicity and clear separation:
- Users table (managed by Cognito)
- Courts table (PK: courtId, GSI: ownerId)
- Availability table (PK: courtId#date#timeSlot, GSI: courtId)
- Bookings table (PK: bookingId, GSI: userId, GSI: courtId)
- Reviews table (PK: reviewId, GSI: userId, GSI: courtId)
- Interactions table (PK: interactionId, GSI: userId)

**Indexes**:
- GSI for owner queries: `ownerId-index`
- GSI for user queries: `userId-index`
- GSI for court queries: `courtId-index`

## Error Handling

### Error Response Format

```json
{
  "error": {
    "code": "ERROR_CODE",
    "message": "Human-readable error message",
    "details": {},
    "timestamp": "2025-01-15T10:30:00Z",
    "requestId": "uuid"
  }
}
```

### Error Codes

| Code | HTTP Status | Description |
|------|-------------|-------------|
| AUTH_REQUIRED | 401 | Authentication required |
| FORBIDDEN | 403 | Insufficient permissions |
| NOT_FOUND | 404 | Resource not found |
| VALIDATION_ERROR | 400 | Invalid input data |
| CONFLICT | 409 | Resource conflict (e.g., double booking) |
| RATE_LIMIT_EXCEEDED | 429 | Too many requests |
| INTERNAL_ERROR | 500 | Server error |
| SERVICE_UNAVAILABLE | 503 | Service temporarily unavailable |

### Error Handling Strategy

**Lambda Functions**:
- Wrap all code in try-catch blocks
- Log errors to CloudWatch with context
- Return standardized error responses
- Implement circuit breaker for external services

**API Gateway**:
- Configure error mappings for common HTTP status codes
- Enable CORS for error responses
- Set up custom error pages

**DynamoDB**:
- Handle `ConditionalCheckFailedException` for optimistic locking
- Retry with exponential backoff for throttling errors
- Implement fallback for service unavailability

**External Services** (SES, Personalize, Location):
- Implement timeout (5 seconds)
- Retry failed requests (max 3 attempts)
- Log failures and continue processing
- Use dead letter queue (DLQ) for failed async operations

## Testing Strategy

### Unit Testing

**Framework**: Jest for Node.js Lambda functions

**Coverage Target**: 80% code coverage

**Test Cases**:
- Input validation
- Business logic
- Error handling
- Edge cases

**Mocking**:
- Mock AWS SDK calls using `aws-sdk-mock`
- Mock external API calls
- Use test fixtures for DynamoDB responses

### Integration Testing

**Approach**: Test Lambda functions with real AWS services in dev environment

**Test Scenarios**:
- End-to-end booking flow
- Authentication and authorization
- Court search with geolocation
- Email notification delivery
- Recommendation generation

**Tools**:
- AWS SAM Local for local Lambda testing
- Postman/Newman for API testing
- DynamoDB Local for database testing

### Load Testing

**Tool**: Artillery or Apache JMeter

**Scenarios**:
- 100 concurrent users searching courts
- 50 concurrent bookings
- 1000 requests per minute to API Gateway

**Metrics**:
- Response time (p50, p95, p99)
- Error rate
- Throughput
- Lambda cold start time

### Security Testing

**OWASP Top 10 Coverage**:
- SQL Injection (N/A for DynamoDB)
- XSS (input sanitization)
- CSRF (token validation)
- Authentication bypass
- Authorization flaws
- Sensitive data exposure

**Tools**:
- AWS WAF for automated protection
- OWASP ZAP for penetration testing
- Snyk for dependency scanning

### User Acceptance Testing (UAT)

**Participants**: 10-20 beta users (players and court owners)

**Duration**: 2 weeks

**Focus Areas**:
- Usability and user experience
- Feature completeness
- Performance in real-world scenarios
- Mobile responsiveness

## Security Architecture

### Authentication Flow

```
1. User enters credentials
2. Frontend sends to API Gateway
3. API Gateway forwards to Lambda
4. Lambda calls Cognito
5. Cognito validates and returns JWT
6. Lambda returns token to frontend
7. Frontend stores token
8. Subsequent requests include token in Authorization header
9. API Gateway validates token via Cognito Authorizer
10. If valid, request proceeds to Lambda
```

### Authorization Model

**Roles**:
- `user`: Regular users (players)
- `court_owner`: Court owners
- `admin`: Platform administrators

**Permissions**:
```
user:
  - Search courts
  - View court details
  - Create bookings
  - View own bookings
  - Submit reviews
  - View own profile

court_owner: (inherits user permissions)
  - Create courts
  - Update own courts
  - View court analytics
  - Manage court availability
  - View court bookings

admin: (full access)
  - All user and court_owner permissions
  - Manage all users
  - Manage all courts
  - Moderate reviews
  - View system logs
  - Export data
```

**Implementation**:
- Store role in Cognito custom attributes
- Lambda functions check role before processing
- API Gateway uses Cognito Authorizer with custom claims

### Data Encryption

**At Rest**:
- DynamoDB: Enable encryption using AWS KMS
- S3: Enable default encryption with SSE-S3 or SSE-KMS
- Secrets: Store in AWS Secrets Manager

**In Transit**:
- All API calls use HTTPS (TLS 1.2+)
- CloudFront enforces HTTPS
- Internal AWS service communication encrypted by default

### Network Security

**AWS WAF Rules**:
- Rate limiting: 100 requests/minute per IP
- Block common attack patterns (SQL injection, XSS)
- Geo-blocking (optional): Allow only Vietnam traffic
- IP reputation list

**API Gateway**:
- Enable request validation
- Configure throttling limits
- Enable CloudWatch logging

### Secrets Management

**AWS Secrets Manager**:
- Database credentials (if using RDS in future)
- Third-party API keys (Google Maps, etc.)
- JWT signing keys

**Environment Variables**:
- Non-sensitive configuration in Lambda environment variables
- Sensitive data retrieved from Secrets Manager at runtime

## Monitoring and Observability

### CloudWatch Metrics

**Lambda Metrics**:
- Invocations
- Errors
- Duration
- Throttles
- Concurrent executions
- Cold starts

**API Gateway Metrics**:
- Request count
- Latency (p50, p95, p99)
- 4xx errors
- 5xx errors
- Cache hit/miss rate

**DynamoDB Metrics**:
- Read/write capacity units consumed
- Throttled requests
- System errors
- Conditional check failures

**Custom Metrics**:
- Booking success rate
- Average booking value
- Daily active users
- Court occupancy rate
- Recommendation click-through rate

### CloudWatch Alarms

**Critical Alarms** (PagerDuty/SNS):
- Lambda error rate > 5% for 5 minutes
- API Gateway 5xx error rate > 2% for 5 minutes
- DynamoDB throttling > 10 requests in 5 minutes
- SES bounce rate > 10%

**Warning Alarms** (Email):
- Lambda duration > 3 seconds (p95)
- API Gateway latency > 1 second (p95)
- DynamoDB read/write capacity > 80%
- Daily cost > $10

### Logging Strategy

**Log Levels**:
- ERROR: Errors requiring immediate attention
- WARN: Potential issues
- INFO: Important business events
- DEBUG: Detailed diagnostic information

**Structured Logging Format**:
```json
{
  "timestamp": "2025-01-15T10:30:00Z",
  "level": "INFO",
  "service": "booking-service",
  "requestId": "uuid",
  "userId": "user123",
  "message": "Booking created successfully",
  "metadata": {
    "bookingId": "booking456",
    "courtId": "court789"
  }
}
```

**Log Retention**:
- Production: 30 days in CloudWatch, archive to S3 for 1 year
- Development: 7 days

### Distributed Tracing

**AWS X-Ray Integration**:
- Enable X-Ray for all Lambda functions
- Trace API Gateway requests
- Track DynamoDB queries
- Monitor external service calls

**Trace Analysis**:
- Identify bottlenecks
- Analyze cold start impact
- Debug errors in production

### Dashboards

**Operational Dashboard** (CloudWatch):
- API request rate and latency
- Lambda invocations and errors
- DynamoDB performance
- Cost trends

**Business Dashboard** (Custom):
- Total bookings (daily, weekly, monthly)
- Revenue trends
- User growth
- Court utilization
- Top-rated courts

## Deployment Strategy

### Environments

1. **Development**: For active development and testing
2. **Staging**: Pre-production environment for UAT
3. **Production**: Live environment for end users

### CI/CD Pipeline

**Frontend (AWS Amplify)**:
```
1. Developer pushes code to GitHub
2. Amplify detects commit
3. Amplify builds React/Next.js app
4. Amplify runs tests
5. If tests pass, deploy to environment
6. Amplify invalidates CloudFront cache
```

**Backend (AWS SAM/Serverless Framework)**:
```
1. Developer pushes code to GitHub
2. GitHub Actions triggers workflow
3. Run unit tests
4. Run linting and security scans
5. Build Lambda deployment packages
6. Deploy to AWS using SAM/Serverless
7. Run integration tests
8. If tests pass, promote to next environment
```

### Deployment Patterns

**Blue-Green Deployment**:
- Deploy new version alongside old version
- Route 10% traffic to new version
- Monitor metrics for 30 minutes
- If healthy, route 100% traffic to new version
- Keep old version for quick rollback

**Canary Deployment** (Lambda Aliases):
- Create new Lambda version
- Configure alias to route 10% to new version
- Monitor for errors
- Gradually increase to 50%, then 100%
- Automatic rollback if error rate increases

### Rollback Strategy

**Automated Rollback Triggers**:
- Error rate > 5%
- Latency increase > 50%
- Custom metric degradation

**Manual Rollback**:
- Revert to previous Lambda version
- Update API Gateway stage variables
- Redeploy previous Amplify build

### Infrastructure as Code

**AWS SAM Template** (backend):
```yaml
AWSTemplateFormatVersion: '2010-09-09'
Transform: AWS::Serverless-2016-10-31

Resources:
  # API Gateway
  ApiGateway:
    Type: AWS::Serverless::Api
    Properties:
      StageName: prod
      Auth:
        DefaultAuthorizer: CognitoAuthorizer
        Authorizers:
          CognitoAuthorizer:
            UserPoolArn: !GetAtt UserPool.Arn
  
  # Lambda Functions
  AuthFunction:
    Type: AWS::Serverless::Function
    Properties:
      Handler: auth.handler
      Runtime: nodejs18.x
      Environment:
        Variables:
          USER_POOL_ID: !Ref UserPool
  
  # DynamoDB Tables
  CourtsTable:
    Type: AWS::DynamoDB::Table
    Properties:
      TableName: Courts
      BillingMode: PAY_PER_REQUEST
      AttributeDefinitions:
        - AttributeName: courtId
          AttributeType: S
      KeySchema:
        - AttributeName: courtId
          KeyType: HASH
```

## Performance Optimization

### Caching Strategy

**API Gateway Caching**:
- Enable for GET endpoints
- TTL: 60 seconds for court search
- Cache key: query parameters
- Invalidate on court updates

**CloudFront Caching**:
- Static assets: 24 hours
- API responses: Disabled (handled by API Gateway)
- Court images: 7 days

**Application-Level Caching**:
- Cache Personalize recommendations in DynamoDB (TTL: 1 hour)
- Cache court details in Lambda memory (for warm starts)

### Lambda Optimization

**Memory Allocation**:
- Auth functions: 256 MB
- Court search: 512 MB (geospatial calculations)
- Booking functions: 256 MB
- Recommendation: 512 MB (ML inference)

**Cold Start Mitigation**:
- Use provisioned concurrency for critical functions
- Keep functions warm with EventBridge (every 5 minutes)
- Minimize deployment package size
- Use Lambda layers for shared dependencies

**Code Optimization**:
- Reuse AWS SDK clients
- Initialize connections outside handler
- Use async/await efficiently
- Minimize dependencies

### Database Optimization

**DynamoDB**:
- Use on-demand pricing initially
- Switch to provisioned capacity with auto-scaling at scale
- Implement efficient query patterns
- Use sparse indexes
- Enable DynamoDB Accelerator (DAX) if needed

**Query Patterns**:
- Avoid scans, use queries with indexes
- Use batch operations for multiple items
- Implement pagination for large result sets

## Cost Optimization

### Estimated Monthly Costs (After Free Tier)

| Service | Usage | Cost |
|---------|-------|------|
| AWS Amplify | 500 build minutes, 5GB transfer | $5.00 |
| Lambda | 1M requests, 128-512MB, 200ms avg | $0.20 |
| API Gateway | 1M requests | $3.50 |
| DynamoDB | 10GB storage, 1M reads, 500K writes | $2.50 |
| S3 | 20GB storage, 10K requests | $0.50 |
| CloudFront | 10GB transfer | $0.85 |
| SES | 5K emails | $0.50 |
| Personalize | Batch inference, weekly training | $8.00 |
| Location Service | 10K requests | $0.50 |
| CloudWatch | Logs, metrics, alarms | $2.00 |
| **Total** | | **~$23.55/month** |

### Cost Optimization Strategies

1. **Use Free Tier**: Maximize free tier usage in first 12 months
2. **Right-size Lambda**: Adjust memory based on actual usage
3. **DynamoDB On-Demand**: Pay only for actual reads/writes
4. **S3 Lifecycle**: Move old images to Glacier after 90 days
5. **CloudWatch Logs**: Set retention to 30 days, archive to S3
6. **Personalize Batch**: Use batch inference instead of real-time
7. **API Caching**: Reduce Lambda invocations
8. **Reserved Capacity**: Consider for predictable workloads

### Budget Alerts

**AWS Budgets Configuration**:
- Alert at 50% of $25 monthly budget
- Alert at 80% of $25 monthly budget
- Alert at 100% of $25 monthly budget
- Send notifications to email and Slack

## Disaster Recovery

### Backup Strategy

**DynamoDB**:
- Enable point-in-time recovery (PITR)
- Automated daily backups retained for 7 days
- On-demand backups before major changes

**S3**:
- Enable versioning
- Cross-region replication to backup region (optional)
- Lifecycle policy to transition old versions to Glacier

**Configuration**:
- Store IaC templates in Git
- Export Cognito user pool configuration
- Document manual configuration steps

### Recovery Procedures

**RTO (Recovery Time Objective)**: 4 hours
**RPO (Recovery Point Objective)**: 1 hour

**Disaster Scenarios**:

1. **DynamoDB Table Deletion**:
   - Restore from latest backup
   - Estimated time: 2 hours

2. **Lambda Function Corruption**:
   - Redeploy from Git repository
   - Estimated time: 30 minutes

3. **Region Failure**:
   - Failover to backup region (if configured)
   - Restore DynamoDB from backup
   - Update DNS to point to backup region
   - Estimated time: 4 hours

4. **Data Corruption**:
   - Identify corruption timestamp
   - Restore from PITR to point before corruption
   - Estimated time: 2 hours

### Testing

- Quarterly disaster recovery drills
- Document lessons learned
- Update procedures based on findings

## Scalability Considerations

### Current Capacity

- Support 1,000 concurrent users
- Handle 10,000 bookings per day
- Store 1,000 courts
- Process 100,000 API requests per day

### Scaling Triggers

**Horizontal Scaling** (automatic):
- Lambda: Auto-scales to 1,000 concurrent executions
- API Gateway: No limit on requests
- DynamoDB: Auto-scaling based on utilization

**Vertical Scaling** (manual):
- Increase Lambda memory if duration increases
- Switch DynamoDB to provisioned capacity with higher limits

### Future Scaling (10x growth)

- Implement DynamoDB global tables for multi-region
- Use CloudFront with multiple origins
- Consider Aurora Serverless for complex queries
- Implement read replicas for analytics
- Use ElastiCache for frequently accessed data

## Conclusion

This design provides a comprehensive, scalable, and cost-effective architecture for the Cloud Racket Platform. The serverless approach ensures minimal operational overhead while maintaining high availability and performance. The modular design allows for incremental development and easy maintenance.

Key design decisions:
- Serverless architecture for cost and scalability
- Multiple DynamoDB tables for clarity and flexibility
- Comprehensive security with encryption, WAF, and IAM
- Observability through CloudWatch and X-Ray
- CI/CD automation for rapid deployment
- Cost optimization strategies to stay within budget

Next steps: Proceed to implementation planning with detailed tasks.
