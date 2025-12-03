# Migration to Serverless Architecture - Checklist

Checklist chi tiết để migrate từ Express.js monolithic sang AWS Serverless architecture.

## 📅 Timeline Overview

| Phase | Duration | Status |
|-------|----------|--------|
| Phase 1: Infrastructure Setup | Week 1 | ⬜ Not Started |
| Phase 2: Core Functions Migration | Week 2-3 | ⬜ Not Started |
| Phase 3: Advanced Features | Week 4 | ⬜ Not Started |
| Phase 4: Automation & Monitoring | Week 5 | ⬜ Not Started |

---

## Phase 1: Infrastructure Setup (Week 1)

### ✅ AWS Account Preparation

- [ ] Verify AWS account access
- [ ] Configure AWS CLI with credentials
- [ ] Set up billing alerts
- [ ] Request SES production access (if needed)
- [ ] Enable required AWS services in region

### ✅ CDK Infrastructure Deployment

- [ ] Install AWS CDK CLI globally
- [ ] Install project dependencies
- [ ] Configure `.env` file with correct values
- [ ] Run `cdk bootstrap` (first time only)
- [ ] Review synthesized CloudFormation template
- [ ] Deploy infrastructure to dev environment
- [ ] Verify all resources created successfully

### ✅ DynamoDB Tables

- [ ] `dev-Courts` table created
- [ ] `dev-Availability` table created
- [ ] `dev-Bookings` table created
- [ ] `dev-Reviews` table created
- [ ] `dev-Interactions` table created
- [ ] All GSIs (Global Secondary Indexes) created
- [ ] Point-in-time recovery enabled
- [ ] Verify table schemas match requirements

### ✅ Cognito User Pool

- [ ] User Pool created with correct settings
- [ ] User Pool Client created
- [ ] User groups created (Users, CourtOwners, Admins)
- [ ] Password policy configured
- [ ] MFA settings configured
- [ ] Email verification enabled
- [ ] Test user registration flow

### ✅ S3 Buckets

- [ ] Court images bucket created
- [ ] Reports bucket created
- [ ] CORS configured for court images bucket
- [ ] Lifecycle policies configured
- [ ] Encryption enabled
- [ ] Test file upload/download

### ✅ SES Email Service

- [ ] Sender email verified
- [ ] Email templates created
  - [ ] Booking confirmation template
  - [ ] Booking cancellation template
  - [ ] Booking reminder template
- [ ] Test email sending
- [ ] Production access requested (if needed)

### ✅ Location Service

- [ ] Place Index created
- [ ] Test geospatial queries
- [ ] Verify data provider (Esri) working

### ✅ API Gateway

- [ ] REST API created
- [ ] Cognito authorizer configured
- [ ] CORS configured
- [ ] Usage plan created
- [ ] CloudWatch logging enabled
- [ ] Test API endpoints (without Lambda)

### ✅ Monitoring & Security

- [ ] CloudWatch dashboard created
- [ ] CloudWatch alarms configured
- [ ] SNS topic for alarms created
- [ ] WAF Web ACL created
- [ ] WAF rules configured
- [ ] Test alarm notifications

**Deliverables**:
- ✅ All AWS resources provisioned
- ✅ Infrastructure code in Git
- ✅ Environment variables documented
- ✅ Basic monitoring in place

---

## Phase 2: Core Functions Migration (Week 2-3)

### Week 2: Authentication & Courts

#### ✅ Backend Structure Setup

- [ ] Create `backend/` directory structure
- [ ] Create `backend/shared/` for common code
- [ ] Set up Lambda Layer for shared code
- [ ] Configure TypeScript for Lambda
- [ ] Set up build process (esbuild)

#### ✅ Shared Code (Lambda Layer)

- [ ] Migrate models from `BE/src/models/`
  - [ ] Court entity
  - [ ] Booking entity
  - [ ] Review entity
  - [ ] User schemas
- [ ] Create utility functions
  - [ ] DynamoDB client wrapper
  - [ ] S3 client wrapper
  - [ ] Cognito client wrapper
  - [ ] SES client wrapper
  - [ ] Input validators (Zod)
  - [ ] Error handlers
- [ ] Create constants
  - [ ] HTTP status codes
  - [ ] Error messages
  - [ ] Table names

#### ✅ Authentication Functions

- [ ] **Register Function** (`backend/functions/auth/register/`)
  - [ ] Create handler.ts
  - [ ] Implement Cognito user registration
  - [ ] Store user metadata in DynamoDB
  - [ ] Input validation
  - [ ] Error handling
  - [ ] Unit tests
  - [ ] Integration tests
  - [ ] Deploy and test

- [ ] **Login Function** (`backend/functions/auth/login/`)
  - [ ] Create handler.ts
  - [ ] Implement Cognito authentication
  - [ ] Return JWT tokens
  - [ ] Input validation
  - [ ] Error handling
  - [ ] Unit tests
  - [ ] Integration tests
  - [ ] Deploy and test

- [ ] **Refresh Token Function** (`backend/functions/auth/refresh-token/`)
  - [ ] Create handler.ts
  - [ ] Implement token refresh logic
  - [ ] Input validation
  - [ ] Error handling
  - [ ] Unit tests
  - [ ] Deploy and test

#### ✅ Court Functions (Basic CRUD)

- [ ] **Create Court Function** (`backend/functions/courts/create-court/`)
  - [ ] Create handler.ts
  - [ ] Implement DynamoDB PutItem
  - [ ] Validate court owner authorization
  - [ ] Input validation (Zod schema)
  - [ ] Generate courtId (UUID)
  - [ ] Unit tests
  - [ ] Integration tests
  - [ ] Deploy and test

- [ ] **Get Court Function** (`backend/functions/courts/get-court/`)
  - [ ] Create handler.ts
  - [ ] Implement DynamoDB GetItem
  - [ ] Handle court not found
  - [ ] Unit tests
  - [ ] Integration tests
  - [ ] Deploy and test

- [ ] **Update Court Function** (if needed)
  - [ ] Create handler.ts
  - [ ] Implement DynamoDB UpdateItem
  - [ ] Validate ownership
  - [ ] Unit tests
  - [ ] Deploy and test

- [ ] **Delete Court Function** (if needed)
  - [ ] Create handler.ts
  - [ ] Implement soft delete or hard delete
  - [ ] Validate ownership
  - [ ] Unit tests
  - [ ] Deploy and test

#### ✅ API Gateway Integration

- [ ] Connect auth functions to API Gateway
  - [ ] POST /auth/register
  - [ ] POST /auth/login
  - [ ] POST /auth/refresh-token
- [ ] Connect court functions to API Gateway
  - [ ] POST /courts (with Cognito auth)
  - [ ] GET /courts/{courtId}
  - [ ] PUT /courts/{courtId} (if implemented)
  - [ ] DELETE /courts/{courtId} (if implemented)
- [ ] Test all endpoints with Postman/Insomnia
- [ ] Document API in Postman collection

### Week 3: Bookings & Search

#### ✅ Booking Functions

- [ ] **Create Booking Function** (`backend/functions/bookings/create-booking/`)
  - [ ] Create handler.ts
  - [ ] Check court availability
  - [ ] Create booking in DynamoDB
  - [ ] Update availability table
  - [ ] Trigger booking confirmation email
  - [ ] Input validation
  - [ ] Unit tests
  - [ ] Integration tests
  - [ ] Deploy and test

- [ ] **Get Booking Function** (`backend/functions/bookings/get-booking/`)
  - [ ] Create handler.ts
  - [ ] Implement DynamoDB GetItem
  - [ ] Validate user authorization
  - [ ] Unit tests
  - [ ] Deploy and test

- [ ] **List Bookings Function** (if needed)
  - [ ] Create handler.ts
  - [ ] Query by userId or courtId
  - [ ] Pagination support
  - [ ] Unit tests
  - [ ] Deploy and test

- [ ] **Cancel Booking Function** (`backend/functions/bookings/cancel-booking/`)
  - [ ] Create handler.ts
  - [ ] Update booking status
  - [ ] Update availability
  - [ ] Trigger cancellation email
  - [ ] Validate authorization
  - [ ] Unit tests
  - [ ] Deploy and test

- [ ] **Send Confirmation Function** (`backend/functions/bookings/send-confirmation/`)
  - [ ] Create handler.ts
  - [ ] Use SES to send email
  - [ ] Use email template
  - [ ] Handle SES errors
  - [ ] Unit tests
  - [ ] Deploy and test

#### ✅ Court Search Functions

- [ ] **Search Courts Function** (`backend/functions/courts/search-courts/`)
  - [ ] Create handler.ts
  - [ ] Implement DynamoDB Scan with filters
  - [ ] Support filters: city, price range, rating
  - [ ] Pagination support
  - [ ] Unit tests
  - [ ] Deploy and test

- [ ] **Nearby Courts Function** (`backend/functions/courts/nearby-courts/`)
  - [ ] Create handler.ts
  - [ ] Integrate with Location Service
  - [ ] Calculate distance using haversine formula
  - [ ] Sort by distance
  - [ ] Unit tests
  - [ ] Deploy and test

- [ ] **Upload Images Function** (`backend/functions/courts/upload-images/`)
  - [ ] Create handler.ts
  - [ ] Generate S3 presigned URLs
  - [ ] Return upload URLs to client
  - [ ] Validate file types
  - [ ] Unit tests
  - [ ] Deploy and test

#### ✅ API Gateway Integration

- [ ] Connect booking functions to API Gateway
  - [ ] POST /bookings (with Cognito auth)
  - [ ] GET /bookings/{bookingId} (with Cognito auth)
  - [ ] DELETE /bookings/{bookingId} (with Cognito auth)
- [ ] Connect search functions to API Gateway
  - [ ] GET /courts/search
  - [ ] GET /courts/nearby
  - [ ] POST /courts/{courtId}/images (with Cognito auth)
- [ ] Test all endpoints
- [ ] Update API documentation

**Deliverables**:
- ✅ 10-15 Lambda functions deployed
- ✅ API Gateway endpoints configured
- ✅ Basic functionality working
- ✅ Unit and integration tests passing

---

## Phase 3: Advanced Features (Week 4)

### ✅ Email Notifications (SES)

- [ ] **Booking Confirmation Email**
  - [ ] Triggered by booking creation
  - [ ] Use SES template
  - [ ] Include booking details
  - [ ] Test email delivery

- [ ] **Cancellation Notification Email**
  - [ ] Triggered by booking cancellation
  - [ ] Use SES template
  - [ ] Include refund information
  - [ ] Test email delivery

- [ ] **Reminder Emails**
  - [ ] EventBridge rule to trigger
  - [ ] Send 24 hours before booking
  - [ ] Use SES template
  - [ ] Test email delivery

### ✅ Reviews & Ratings

- [ ] **Create Review Function** (`backend/functions/reviews/create-review/`)
  - [ ] Create handler.ts
  - [ ] Validate user has booking
  - [ ] Store review in DynamoDB
  - [ ] Update court average rating
  - [ ] Trigger sentiment analysis
  - [ ] Unit tests
  - [ ] Deploy and test

- [ ] **Get Reviews Function** (`backend/functions/reviews/get-reviews/`)
  - [ ] Create handler.ts
  - [ ] Query reviews by courtId
  - [ ] Pagination support
  - [ ] Sort by date or rating
  - [ ] Unit tests
  - [ ] Deploy and test

- [ ] **Sentiment Analysis Function** (`backend/functions/reviews/sentiment-analysis/`)
  - [ ] Create handler.ts
  - [ ] Integrate with Amazon Comprehend
  - [ ] Analyze review text sentiment
  - [ ] Store sentiment score
  - [ ] Unit tests
  - [ ] Deploy and test

### ✅ Recommendations (Amazon Personalize)

**Note**: This is optional and can be implemented later.

- [ ] **Setup Personalize** (if implementing)
  - [ ] Create dataset group
  - [ ] Create datasets (users, items, interactions)
  - [ ] Import historical data
  - [ ] Create solution
  - [ ] Create campaign
  - [ ] Update Lambda environment variables

- [ ] **Get Recommendations Function** (`backend/functions/recommendations/get-recommendations/`)
  - [ ] Create handler.ts
  - [ ] Call Personalize API
  - [ ] Return recommended courts
  - [ ] Handle no recommendations case
  - [ ] Unit tests
  - [ ] Deploy and test

- [ ] **Track Interaction Function** (`backend/functions/recommendations/track-interaction/`)
  - [ ] Create handler.ts
  - [ ] Record user interactions
  - [ ] Send events to Personalize
  - [ ] Store in DynamoDB
  - [ ] Unit tests
  - [ ] Deploy and test

### ✅ Dashboard Analytics

- [ ] **Get Stats Function** (`backend/functions/dashboard/get-stats/`)
  - [ ] Create handler.ts
  - [ ] Query DynamoDB for statistics
  - [ ] Calculate metrics (total bookings, revenue, etc.)
  - [ ] Cache results if needed
  - [ ] Unit tests
  - [ ] Deploy and test

- [ ] **Get Revenue Function** (`backend/functions/dashboard/get-revenue/`)
  - [ ] Create handler.ts
  - [ ] Query bookings by date range
  - [ ] Calculate revenue by period
  - [ ] Group by court or owner
  - [ ] Unit tests
  - [ ] Deploy and test

- [ ] **Generate Report Function** (`backend/functions/dashboard/generate-report/`)
  - [ ] Create handler.ts
  - [ ] Query data from DynamoDB
  - [ ] Generate CSV or PDF report
  - [ ] Upload to S3
  - [ ] Return S3 presigned URL
  - [ ] Unit tests
  - [ ] Deploy and test

### ✅ Admin Functions

- [ ] **Manage Users Function** (`backend/functions/admin/manage-users/`)
  - [ ] Create handler.ts
  - [ ] List users (Cognito)
  - [ ] Update user attributes
  - [ ] Delete users
  - [ ] Add/remove from groups
  - [ ] Validate admin authorization
  - [ ] Unit tests
  - [ ] Deploy and test

- [ ] **Manage Courts Function** (`backend/functions/admin/manage-courts/`)
  - [ ] Create handler.ts
  - [ ] List all courts
  - [ ] Approve/reject courts
  - [ ] Update court status
  - [ ] Validate admin authorization
  - [ ] Unit tests
  - [ ] Deploy and test

- [ ] **Moderate Reviews Function** (`backend/functions/admin/moderate-reviews/`)
  - [ ] Create handler.ts
  - [ ] List flagged reviews
  - [ ] Approve/delete reviews
  - [ ] Validate admin authorization
  - [ ] Unit tests
  - [ ] Deploy and test

### ✅ API Gateway Integration

- [ ] Connect review functions
  - [ ] POST /reviews (with Cognito auth)
  - [ ] GET /reviews
- [ ] Connect recommendation functions (if implemented)
  - [ ] GET /recommendations (with Cognito auth)
  - [ ] POST /recommendations/track (with Cognito auth)
- [ ] Connect dashboard functions
  - [ ] GET /dashboard/stats (with Cognito auth)
  - [ ] GET /dashboard/revenue (with Cognito auth)
  - [ ] POST /dashboard/report (with Cognito auth)
- [ ] Connect admin functions
  - [ ] All /admin/* endpoints (with Cognito auth + admin check)
- [ ] Test all endpoints
- [ ] Update API documentation

**Deliverables**:
- ✅ All AWS services integrated
- ✅ Email system working
- ✅ AI recommendations functional (optional)
- ✅ Admin panel backend ready

---

## Phase 4: Automation & Monitoring (Week 5)

### ✅ EventBridge Schedulers

- [ ] **Booking Reminder Rule**
  - [ ] Configure EventBridge rule (hourly)
  - [ ] Create Lambda function to check upcoming bookings
  - [ ] Send reminder emails via SES
  - [ ] Test rule execution
  - [ ] Monitor CloudWatch logs

- [ ] **Daily Cleanup Rule**
  - [ ] Configure EventBridge rule (2 AM daily)
  - [ ] Create Lambda function for cleanup
  - [ ] Delete expired bookings
  - [ ] Archive old data
  - [ ] Test rule execution

- [ ] **Weekly Personalize Retraining Rule** (if using Personalize)
  - [ ] Configure EventBridge rule (Sunday 3 AM)
  - [ ] Create Lambda function to trigger retraining
  - [ ] Export interaction data
  - [ ] Start solution version creation
  - [ ] Test rule execution

- [ ] **Monthly Report Rule**
  - [ ] Configure EventBridge rule (1st day 4 AM)
  - [ ] Trigger report generation function
  - [ ] Send report to admins
  - [ ] Test rule execution

### ✅ Event-Driven Architecture

- [ ] **DynamoDB Streams**
  - [ ] Enable streams on Bookings table
  - [ ] Enable streams on Reviews table
  - [ ] Create Lambda triggers for streams

- [ ] **Booking Created Event**
  - [ ] Trigger email confirmation
  - [ ] Update analytics
  - [ ] Track interaction (Personalize)

- [ ] **Booking Cancelled Event**
  - [ ] Trigger cancellation email
  - [ ] Update availability
  - [ ] Update analytics

- [ ] **Review Created Event**
  - [ ] Trigger sentiment analysis
  - [ ] Update court rating
  - [ ] Notify court owner

### ✅ CloudWatch Monitoring

- [ ] **Dashboard Enhancements**
  - [ ] Add Lambda metrics
  - [ ] Add DynamoDB metrics
  - [ ] Add custom business metrics
  - [ ] Add cost metrics

- [ ] **Alarms Configuration**
  - [ ] Lambda error rate alarms
  - [ ] Lambda throttle alarms
  - [ ] DynamoDB throttle alarms
  - [ ] API Gateway latency alarms
  - [ ] Cost alarms

- [ ] **Log Insights Queries**
  - [ ] Create saved queries for common issues
  - [ ] Error analysis query
  - [ ] Performance analysis query
  - [ ] User activity query

### ✅ X-Ray Tracing (Optional)

- [ ] Enable X-Ray for Lambda functions
- [ ] Enable X-Ray for API Gateway
- [ ] Create service map
- [ ] Analyze traces for bottlenecks

### ✅ Cost Optimization

- [ ] **Lambda Optimization**
  - [ ] Review memory allocation
  - [ ] Optimize cold start times
  - [ ] Implement connection pooling
  - [ ] Use Lambda Layers effectively

- [ ] **DynamoDB Optimization**
  - [ ] Review on-demand vs provisioned capacity
  - [ ] Optimize GSI usage
  - [ ] Implement caching (DAX) if needed

- [ ] **S3 Optimization**
  - [ ] Configure lifecycle policies
  - [ ] Use Intelligent-Tiering
  - [ ] Enable S3 Transfer Acceleration if needed

- [ ] **API Gateway Optimization**
  - [ ] Enable caching for GET requests
  - [ ] Review usage plans
  - [ ] Optimize throttling limits

### ✅ Performance Tuning

- [ ] Load testing with Artillery or k6
- [ ] Identify bottlenecks
- [ ] Optimize slow Lambda functions
- [ ] Optimize DynamoDB queries
- [ ] Implement caching where appropriate

### ✅ Security Hardening

- [ ] **IAM Policies Review**
  - [ ] Ensure least privilege
  - [ ] Remove unused permissions
  - [ ] Document all policies

- [ ] **Secrets Management**
  - [ ] Move sensitive data to Secrets Manager
  - [ ] Rotate credentials regularly
  - [ ] Audit secret access

- [ ] **WAF Rules Review**
  - [ ] Test rate limiting
  - [ ] Review blocked requests
  - [ ] Adjust rules as needed

- [ ] **Encryption Verification**
  - [ ] Verify DynamoDB encryption
  - [ ] Verify S3 encryption
  - [ ] Verify data in transit (HTTPS)

### ✅ Documentation

- [ ] Update README.md
- [ ] Document all API endpoints
- [ ] Create architecture diagrams
- [ ] Document deployment process
- [ ] Create runbooks for common issues
- [ ] Document monitoring and alerting

### ✅ CI/CD Pipeline

- [ ] Set up GitHub Actions (or similar)
- [ ] Automated testing on PR
- [ ] Automated deployment to dev
- [ ] Manual approval for production
- [ ] Rollback strategy

**Deliverables**:
- ✅ Automated maintenance tasks
- ✅ Comprehensive monitoring
- ✅ Production-ready system
- ✅ Complete documentation

---

## 🎯 Final Checklist

### Pre-Production

- [ ] All unit tests passing
- [ ] All integration tests passing
- [ ] Load testing completed
- [ ] Security audit completed
- [ ] Documentation complete
- [ ] Monitoring and alerting configured
- [ ] Backup and disaster recovery plan
- [ ] Cost estimation reviewed
- [ ] SES production access approved
- [ ] Custom domain configured (if applicable)

### Production Deployment

- [ ] Deploy to production environment
- [ ] Verify all resources created
- [ ] Run smoke tests
- [ ] Monitor for 24 hours
- [ ] Verify email delivery
- [ ] Verify payment processing (if applicable)
- [ ] Check CloudWatch metrics
- [ ] Review CloudWatch logs
- [ ] Test disaster recovery

### Post-Production

- [ ] Monitor performance for 1 week
- [ ] Collect user feedback
- [ ] Optimize based on real usage
- [ ] Plan next iteration
- [ ] Document lessons learned

---

## 📊 Success Metrics

| Metric | Target | Current | Status |
|--------|--------|---------|--------|
| API Latency (p95) | < 500ms | - | ⬜ |
| API Error Rate | < 1% | - | ⬜ |
| Lambda Cold Start | < 1s | - | ⬜ |
| Email Delivery Rate | > 99% | - | ⬜ |
| Monthly Cost | < $100 | - | ⬜ |
| Uptime | > 99.9% | - | ⬜ |

---

**Last Updated**: 2025-01-24  
**Version**: 2.0.0  
**Status**: Ready for Phase 1
