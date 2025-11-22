# Implementation Plan - Cloud Racket Platform

## Overview
This implementation plan outlines the tasks to build the Cloud Racket Platform using AWS Serverless architecture with microservices pattern. Tasks are organized by role (DevOps, SecOps, Solution Architect) and service domain.

---

## Phase 1: Infrastructure Foundation & Security Setup

### 1. AWS Account & Security Configuration (SecOps + DevOps)

- [ ] 1.1 Configure AWS account and IAM foundation
  - Set up AWS Organizations with separate accounts for dev, staging, production
  - Create IAM roles with least privilege principle for each service
  - Enable AWS CloudTrail for audit logging across all accounts
  - Configure AWS Config for compliance monitoring
  - _Requirements: 11.1, 11.6_

- [ ] 1.2 Set up encryption and secrets management
  - Create AWS KMS keys for DynamoDB and S3 encryption
  - Configure AWS Secrets Manager for API keys and sensitive configuration
  - Enable encryption at rest for all DynamoDB tables
  - Enable default encryption for S3 buckets
  - _Requirements: 11.2, 11.3_

- [ ] 1.3 Configure AWS WAF and network security
  - Create WAF web ACL with rate limiting rules (100 req/min per IP)
  - Add WAF rules for SQL injection and XSS protection
  - Configure geo-blocking rules (optional for Vietnam only)
  - Attach WAF to API Gateway and CloudFront
  - _Requirements: 11.4, 11.5_


### 2. DynamoDB Tables Design & Setup (Solution Architect + DevOps)

- [ ] 2.1 Design and create DynamoDB tables with access patterns
  - Create Courts table with PK: courtId, GSI: ownerId-index, GSI: district-index
  - Create Availability table with PK: courtId#date#timeSlot, GSI: courtId-index
  - Create Bookings table with PK: bookingId, GSI: userId-index, GSI: courtId-index
  - Create Reviews table with PK: reviewId, GSI: userId-index, GSI: courtId-index
  - Create Interactions table with PK: interactionId, GSI: userId-index
  - Enable point-in-time recovery (PITR) for all tables
  - Configure on-demand billing mode
  - _Requirements: 3.1, 15.1, 15.2_

- [ ]* 2.2 Create DynamoDB table schemas and validation
  - Write TypeScript interfaces for all entity types
  - Implement data validation schemas using Zod or Joi
  - Create helper functions for DynamoDB marshalling/unmarshalling
  - _Requirements: 3.1, 4.4_

- [ ] 2.3 Set up DynamoDB Streams for event-driven architecture
  - Enable DynamoDB Streams on Bookings table for email triggers
  - Enable DynamoDB Streams on Reviews table for rating aggregation
  - Configure stream view type as NEW_AND_OLD_IMAGES
  - _Requirements: 16.2_


### 3. Amazon Cognito User Pool Setup (SecOps + DevOps)

- [ ] 3.1 Create and configure Cognito User Pool
  - Create Cognito User Pool with email as username
  - Configure password policy (min 8 chars, uppercase, lowercase, number, special char)
  - Enable MFA with TOTP authenticator apps
  - Configure email verification with Amazon SES
  - Set JWT token expiration to 24 hours, refresh token to 30 days
  - _Requirements: 1.1, 1.2, 1.3, 1.4_

- [ ] 3.2 Configure Cognito custom attributes and groups
  - Add custom attribute for user role (user, court_owner, admin)
  - Create Cognito groups: Users, CourtOwners, Admins
  - Configure group precedence and IAM role mapping
  - _Requirements: 1.5, 1.6_

- [ ] 3.3 Set up Cognito App Client for frontend
  - Create App Client with OAuth 2.0 flows
  - Configure callback URLs for dev, staging, production
  - Enable Cognito Hosted UI (optional)
  - Generate and securely store App Client ID and Secret
  - _Requirements: 1.1_


### 4. API Gateway & Lambda Foundation (DevOps + Solution Architect)

- [ ] 4.1 Create API Gateway REST API with Cognito authorizer
  - Create REST API in API Gateway
  - Configure Cognito User Pool Authorizer
  - Set up custom domain name with ACM certificate
  - Enable CloudWatch logging for API Gateway
  - Configure CORS for frontend domains
  - _Requirements: 11.6, 14.2_

- [ ] 4.2 Configure API Gateway throttling and caching
  - Set account-level throttle limit to 10,000 requests per second
  - Configure per-method throttling (100 requests/minute per user)
  - Enable caching with 60-second TTL for GET endpoints
  - Configure cache key parameters
  - _Requirements: 11.5, 14.4_

- [ ] 4.3 Set up Lambda execution role and layers
  - Create IAM execution role for Lambda with DynamoDB, S3, SES permissions
  - Create Lambda layer for shared dependencies (AWS SDK, utilities)
  - Create Lambda layer for common business logic
  - Configure Lambda environment variables template
  - _Requirements: 11.1_

- [ ] 4.4 Configure Lambda monitoring and tracing
  - Enable AWS X-Ray tracing for all Lambda functions
  - Configure CloudWatch Logs retention to 30 days
  - Set up Lambda Insights for enhanced monitoring
  - Create CloudWatch dashboard for Lambda metrics
  - _Requirements: 10.1, 10.4_


---

## Phase 2: Core Microservices Implementation

### 5. Authentication Service (Lambda + API Gateway)

- [ ] 5.1 Implement user registration Lambda function
  - Create POST /auth/register endpoint in API Gateway
  - Write Lambda handler to validate registration input (email, password, name, phone)
  - Integrate with Cognito AdminCreateUser API
  - Send verification email through Cognito
  - Return success response with user details
  - _Requirements: 1.1, 1.2_

- [ ] 5.2 Implement user login Lambda function
  - Create POST /auth/login endpoint in API Gateway
  - Write Lambda handler to authenticate with Cognito InitiateAuth
  - Validate credentials and return JWT tokens
  - Handle MFA challenge if enabled
  - Log authentication attempts to CloudWatch
  - _Requirements: 1.3, 1.4, 11.6_

- [ ] 5.3 Implement token refresh and user profile endpoints
  - Create POST /auth/refresh endpoint for token refresh
  - Create GET /auth/user-profile endpoint to fetch user details from Cognito
  - Create PUT /auth/user-profile endpoint to update user attributes
  - Implement JWT token validation middleware
  - _Requirements: 1.3_

- [ ]* 5.4 Write unit tests for authentication service
  - Test registration with valid and invalid inputs
  - Test login success and failure scenarios
  - Test MFA flow
  - Mock Cognito SDK calls
  - _Requirements: 1.1, 1.2, 1.3_


### 6. Court Service (Lambda + API Gateway + DynamoDB)

- [ ] 6.1 Implement court CRUD operations
  - Create POST /courts endpoint for court creation (Court Owner only)
  - Create GET /courts/:id endpoint to fetch court details
  - Create PUT /courts/:id endpoint to update court (Court Owner only)
  - Create DELETE /courts/:id endpoint to soft-delete court (Court Owner only)
  - Implement authorization checks for owner-only operations
  - Write DynamoDB queries with proper error handling
  - _Requirements: 2.3, 6.4_

- [ ] 6.2 Implement court search with filters
  - Create GET /courts endpoint with query parameters (district, price range, rating, facilities)
  - Write Lambda function to query DynamoDB with filters
  - Implement pagination with limit and lastEvaluatedKey
  - Return courts sorted by rating or distance
  - _Requirements: 2.3_

- [ ] 6.3 Implement geospatial search for nearby courts
  - Create GET /courts/nearby endpoint with lat/lng parameters
  - Integrate Amazon Location Service Place Index for geospatial queries
  - Alternatively, implement haversine formula for distance calculation
  - Return courts within 10km radius sorted by distance
  - _Requirements: 2.1, 2.2_

- [ ] 6.4 Implement court image upload to S3
  - Create POST /courts/:id/images endpoint
  - Write Lambda function to generate pre-signed S3 upload URL
  - Validate image file type and size (max 5MB)
  - Store S3 image URLs in DynamoDB Courts table
  - Configure S3 bucket with public read access for images
  - _Requirements: 6.5_

- [ ] 6.5 Implement court availability management
  - Create GET /courts/:id/availability endpoint with date range
  - Create PUT /courts/:id/availability endpoint to update availability (Court Owner only)
  - Query Availability table by courtId and date range
  - Allow Court Owner to block specific time slots
  - _Requirements: 3.2, 6.6_

- [ ]* 6.6 Write unit tests for court service
  - Test CRUD operations with valid and invalid inputs
  - Test authorization for owner-only endpoints
  - Test geospatial search with various coordinates
  - Mock DynamoDB and S3 SDK calls
  - _Requirements: 2.3, 6.4_


### 7. Booking Service (Lambda + API Gateway + DynamoDB + SES)

- [ ] 7.1 Implement booking creation with concurrency control
  - Create POST /bookings endpoint
  - Write Lambda function to validate booking input (courtId, date, timeSlot, userId)
  - Check court availability in DynamoDB with conditional write (optimistic locking)
  - Create booking record in Bookings table
  - Update Availability table to mark slot as booked
  - Use DynamoDB transactions for atomicity
  - _Requirements: 4.1, 4.2, 3.3, 3.4_

- [ ] 7.2 Implement booking confirmation email via SES
  - Configure Amazon SES with verified sender email
  - Create email template for booking confirmation in Vietnamese
  - Trigger SES SendEmail from Lambda after successful booking
  - Include booking details (court name, date, time, price) in email
  - Handle SES errors gracefully and log failures
  - _Requirements: 4.3, 8.1, 8.2, 8.5_

- [ ] 7.3 Implement booking retrieval and history
  - Create GET /bookings/:id endpoint to fetch booking details
  - Create GET /bookings endpoint to list user's bookings with filters (status, date range)
  - Query Bookings table using userId GSI
  - Implement pagination for booking history
  - _Requirements: 4.4_

- [ ] 7.4 Implement booking cancellation
  - Create PUT /bookings/:id/cancel endpoint
  - Validate cancellation is at least 24 hours before booking time
  - Update booking status to 'cancelled' in DynamoDB
  - Update Availability table to mark slot as available
  - Send cancellation email via SES
  - _Requirements: 4.5, 8.4_

- [ ]* 7.5 Write unit tests for booking service
  - Test booking creation with available and unavailable slots
  - Test concurrent booking attempts (race condition)
  - Test cancellation within and outside allowed timeframe
  - Mock DynamoDB transactions and SES calls
  - _Requirements: 4.1, 4.2, 4.5_


### 8. Review & Rating Service (Lambda + API Gateway + DynamoDB)

- [ ] 8.1 Implement review submission
  - Create POST /reviews endpoint
  - Write Lambda function to validate review input (courtId, bookingId, rating 1-5, comment)
  - Verify user has completed booking before allowing review
  - Store review in Reviews table
  - Trigger rating aggregation update
  - _Requirements: 9.1, 9.2_

- [ ] 8.2 Implement review retrieval and filtering
  - Create GET /reviews/court/:id endpoint to fetch court reviews
  - Create GET /reviews/:id endpoint for single review details
  - Query Reviews table using courtId GSI
  - Implement pagination and sorting (newest first, highest rated)
  - _Requirements: 9.2_

- [ ] 8.3 Implement rating aggregation
  - Write Lambda function triggered by DynamoDB Stream on Reviews table
  - Calculate average rating for court
  - Update Courts table with new averageRating and totalReviews
  - Ensure aggregation completes within 1 minute
  - _Requirements: 9.3_

- [ ] 8.4 Integrate Amazon Comprehend for sentiment analysis (Optional)
  - Create Lambda function to call Comprehend DetectSentiment API
  - Process Vietnamese review comments
  - Convert sentiment to score (Positive=1, Neutral=0, Negative=-1)
  - Store sentimentScore in Reviews table
  - Adjust court rating: finalScore = (rating * 0.7) + (sentimentScore * 0.3)
  - _Requirements: 9.4, 9.5_

- [ ]* 8.5 Write unit tests for review service
  - Test review submission with valid and invalid inputs
  - Test rating aggregation calculation
  - Test sentiment analysis integration
  - Mock DynamoDB and Comprehend SDK calls
  - _Requirements: 9.1, 9.2, 9.3_


### 9. Recommendation Service (Lambda + Amazon Personalize)

- [ ] 9.1 Set up Amazon Personalize dataset and schema
  - Create Personalize Dataset Group
  - Define Users dataset schema (userId, location, preferences)
  - Define Items dataset schema (courtId, location, price, rating, facilities)
  - Define Interactions dataset schema (userId, courtId, eventType, timestamp)
  - Upload initial seed data to S3
  - Import datasets into Personalize
  - _Requirements: 5.1, 5.2_

- [ ] 9.2 Implement interaction tracking
  - Create POST /recommendations/track endpoint
  - Write Lambda function to record user interactions (view, book, rate, favorite)
  - Store interactions in Interactions table
  - Send interaction events to Personalize PutEvents API
  - _Requirements: 5.5_

- [ ] 9.3 Train Personalize recommendation model
  - Create Solution using aws-user-personalization recipe
  - Configure hyperparameters (70% behavior + 30% metadata)
  - Create Solution Version (initial training)
  - Monitor training job status
  - Create Campaign for batch inference
  - _Requirements: 5.2_

- [ ] 9.4 Implement personalized recommendations endpoint
  - Create GET /recommendations endpoint
  - Write Lambda function to call Personalize GetRecommendations API
  - Return top 5 recommended courts for logged-in user
  - Cache recommendations in DynamoDB with 1-hour TTL
  - Handle cold-start for new users (fallback to popular courts)
  - _Requirements: 5.3_

- [ ] 9.5 Set up automated model retraining
  - Create EventBridge rule to trigger weekly (every Sunday)
  - Write Lambda function to create new Solution Version
  - Update Campaign to use new Solution Version
  - Monitor retraining job and send alerts on failure
  - _Requirements: 5.4, 16.3_

- [ ]* 9.6 Write unit tests for recommendation service
  - Test interaction tracking with various event types
  - Test recommendation retrieval with and without cache
  - Test cold-start fallback logic
  - Mock Personalize SDK calls
  - _Requirements: 5.3, 5.5_


### 10. Dashboard Service (Lambda + DynamoDB + S3)

- [ ] 10.1 Implement dashboard statistics endpoints
  - Create GET /dashboard/stats endpoint for overall statistics
  - Write Lambda function to aggregate data from Bookings and Courts tables
  - Calculate total revenue, total bookings, average rating
  - Return statistics for current month and comparison with previous month
  - _Requirements: 6.2, 6.3_

- [ ] 10.2 Implement revenue analytics
  - Create GET /dashboard/revenue endpoint with date range parameters
  - Query Bookings table filtered by ownerId and date range
  - Aggregate revenue by day, week, or month
  - Return data in format suitable for Chart.js visualization
  - _Requirements: 6.2, 6.3_

- [ ] 10.3 Implement booking trends analytics
  - Create GET /dashboard/bookings endpoint
  - Calculate booking trends (daily, weekly, monthly)
  - Calculate occupancy rate per court
  - Identify peak hours and days
  - _Requirements: 6.2_

- [ ] 10.4 Implement monthly report generation
  - Write Lambda function triggered by EventBridge on 1st of each month
  - Aggregate previous month's data (revenue, bookings, ratings)
  - Generate CSV report
  - Upload report to S3 bucket
  - Send email notification to Court Owner with S3 download link
  - _Requirements: 16.5_

- [ ]* 10.5 Write unit tests for dashboard service
  - Test statistics calculation with sample data
  - Test revenue aggregation for different date ranges
  - Test report generation and S3 upload
  - Mock DynamoDB queries and S3 SDK calls
  - _Requirements: 6.2, 6.3_


### 11. Admin Service (Lambda + API Gateway + DynamoDB)

- [ ] 11.1 Implement admin user management endpoints
  - Create GET /admin/users endpoint to list all users
  - Create PUT /admin/users/:id endpoint to update user attributes
  - Create DELETE /admin/users/:id endpoint to disable user account
  - Verify admin role from Cognito JWT claims
  - Query Cognito User Pool for user data
  - _Requirements: 7.2, 1.6_

- [ ] 11.2 Implement admin court management endpoints
  - Create GET /admin/courts endpoint to list all courts
  - Create PUT /admin/courts/:id endpoint to update any court
  - Create DELETE /admin/courts/:id endpoint to delete any court
  - Query Courts table with scan operation (paginated)
  - _Requirements: 7.2_

- [ ] 11.3 Implement review moderation
  - Create GET /admin/reviews endpoint to list pending reviews
  - Create PUT /admin/reviews/:id endpoint to approve or reject review
  - Update review status in Reviews table
  - Remove inappropriate reviews from court rating calculation
  - _Requirements: 7.3_

- [ ] 11.4 Implement system logs and metrics viewer
  - Create GET /admin/logs endpoint to fetch CloudWatch logs
  - Create GET /admin/metrics endpoint to fetch CloudWatch metrics
  - Use CloudWatch Logs Insights API for log queries
  - Return formatted logs and metrics for admin dashboard
  - _Requirements: 7.4_

- [ ] 11.5 Implement data export functionality
  - Create POST /admin/reports/export endpoint with entity type parameter
  - Write Lambda function to query DynamoDB and generate CSV
  - Upload CSV to S3 with pre-signed download URL
  - Return download URL to admin
  - _Requirements: 7.5_

- [ ]* 11.6 Write unit tests for admin service
  - Test admin authorization checks
  - Test user and court management operations
  - Test review moderation workflow
  - Mock Cognito, DynamoDB, and CloudWatch SDK calls
  - _Requirements: 7.2, 7.3_


---

## Phase 3: Automation & Event-Driven Features

### 12. Email Notification System (Lambda + SES + EventBridge)

- [ ] 12.1 Configure Amazon SES for email sending
  - Verify sender email domain in SES
  - Move SES out of sandbox mode (request production access)
  - Create email templates for booking confirmation, cancellation, reminder
  - Configure SES configuration set for tracking bounces and complaints
  - _Requirements: 8.1, 8.5_

- [ ] 12.2 Implement booking confirmation email
  - Write Lambda function triggered by DynamoDB Stream on Bookings table
  - Filter for new bookings with status 'confirmed'
  - Render email template with booking details
  - Send email via SES SendTemplatedEmail API
  - Log email delivery status to CloudWatch
  - _Requirements: 8.2_

- [ ] 12.3 Implement booking reminder scheduler
  - Create EventBridge rule to trigger Lambda every hour
  - Write Lambda function to query bookings scheduled in next 24 hours
  - Send reminder email via SES for each upcoming booking
  - Mark booking as 'reminder_sent' to avoid duplicates
  - _Requirements: 8.3, 16.4_

- [ ] 12.4 Implement cancellation email
  - Extend booking cancellation Lambda to trigger SES
  - Send cancellation confirmation email with refund details (if applicable)
  - _Requirements: 8.4_

- [ ]* 12.5 Write unit tests for email notification system
  - Test email template rendering with sample data
  - Test SES integration with mock SDK
  - Test reminder scheduler logic
  - _Requirements: 8.2, 8.3, 8.4_


### 13. Automated Maintenance Tasks (Lambda + EventBridge)

- [ ] 13.1 Implement expired booking cleanup
  - Create EventBridge rule to trigger Lambda weekly (every Sunday)
  - Write Lambda function to query bookings older than 90 days
  - Delete expired bookings from Bookings table
  - Log cleanup statistics to CloudWatch
  - _Requirements: 16.2_

- [ ] 13.2 Implement Personalize model retraining automation
  - Create EventBridge rule to trigger Lambda weekly (every Sunday)
  - Write Lambda function to export latest interactions from DynamoDB to S3
  - Trigger Personalize CreateSolutionVersion API
  - Monitor training job status
  - Update Campaign when training completes
  - Send SNS notification on training success or failure
  - _Requirements: 16.3_

- [ ] 13.3 Implement monthly analytics report generation
  - Create EventBridge rule to trigger Lambda on 1st of each month
  - Write Lambda function to aggregate previous month's data
  - Generate comprehensive report (bookings, revenue, users, courts)
  - Store report in S3 with organized folder structure (year/month/)
  - _Requirements: 16.5_

- [ ]* 13.4 Write unit tests for maintenance tasks
  - Test booking cleanup logic with various date ranges
  - Test Personalize retraining trigger
  - Test monthly report generation
  - Mock EventBridge, DynamoDB, and Personalize SDK calls
  - _Requirements: 16.2, 16.3, 16.5_


---

## Phase 4: Monitoring, Logging & Observability (DevOps)

### 14. CloudWatch Monitoring Setup

- [ ] 14.1 Configure CloudWatch Logs for all Lambda functions
  - Enable CloudWatch Logs for all Lambda functions
  - Set log retention to 30 days
  - Implement structured logging format (JSON) in Lambda code
  - Include requestId, userId, and context in all log entries
  - _Requirements: 10.1, 10.5_

- [ ] 14.2 Create CloudWatch alarms for critical metrics
  - Create alarm for Lambda error rate > 5% in 5 minutes
  - Create alarm for API Gateway 5xx errors > 2% in 5 minutes
  - Create alarm for DynamoDB throttling > 10 requests in 5 minutes
  - Create alarm for SES bounce rate > 10%
  - Configure SNS topic for alarm notifications
  - _Requirements: 10.2, 10.3_

- [ ] 14.3 Set up custom CloudWatch metrics
  - Implement custom metric for booking success rate
  - Implement custom metric for average API response time
  - Implement custom metric for daily active users
  - Publish metrics from Lambda using PutMetricData API
  - _Requirements: 10.4_

- [ ] 14.4 Create CloudWatch dashboards
  - Create operational dashboard with Lambda, API Gateway, DynamoDB metrics
  - Create business dashboard with booking trends, revenue, user growth
  - Add widgets for alarms status
  - Configure auto-refresh interval
  - _Requirements: 10.4_

- [ ] 14.5 Enable AWS X-Ray distributed tracing
  - Enable X-Ray for all Lambda functions
  - Enable X-Ray for API Gateway
  - Instrument DynamoDB calls with X-Ray SDK
  - Create X-Ray service map
  - Analyze traces for performance bottlenecks
  - _Requirements: 10.4_


### 15. Cost Monitoring & Optimization (Solution Architect + DevOps)

- [ ] 15.1 Configure AWS Budgets and cost alerts
  - Create monthly budget of $25 USD
  - Set up alerts at 50%, 80%, 100% of budget
  - Configure SNS notifications to email and Slack
  - Enable AWS Cost Explorer for cost analysis
  - _Requirements: 13.2_

- [ ] 15.2 Implement cost optimization for Lambda
  - Analyze Lambda execution duration and memory usage
  - Right-size Lambda memory allocation (128MB - 512MB)
  - Enable Lambda Power Tuning for optimal configuration
  - Reduce deployment package size by removing unused dependencies
  - _Requirements: 13.4_

- [ ] 15.3 Implement cost optimization for DynamoDB
  - Monitor DynamoDB capacity utilization
  - Configure auto-scaling for read/write capacity if switching to provisioned mode
  - Implement efficient query patterns to reduce RCU/WCU consumption
  - Use DynamoDB TTL for automatic data expiration
  - _Requirements: 13.1, 14.3_

- [ ] 15.4 Implement cost optimization for S3
  - Configure S3 Intelligent-Tiering for court images
  - Set up lifecycle policy to transition old images to Glacier after 90 days
  - Enable S3 request metrics to monitor access patterns
  - _Requirements: 13.3_

- [ ] 15.5 Implement cost optimization for Personalize
  - Use batch inference instead of real-time inference
  - Schedule batch inference jobs during off-peak hours
  - Limit training frequency to weekly instead of daily
  - Monitor Personalize costs and adjust usage accordingly
  - _Requirements: 13.5_

