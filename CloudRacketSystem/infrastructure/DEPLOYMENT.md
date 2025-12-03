# Cloud Racket Platform - Deployment Guide

Hướng dẫn chi tiết để deploy kiến trúc serverless lên AWS.

## 📋 Prerequisites Checklist

### 1. AWS Account Setup

- [ ] Có AWS Account với quyền Administrator
- [ ] AWS CLI đã được cài đặt và cấu hình
- [ ] Đã verify email trong Amazon SES (hoặc request production access)
- [ ] Đã enable các AWS services cần thiết trong region

### 2. Development Environment

- [ ] Node.js v18+ đã được cài đặt
- [ ] npm hoặc yarn đã được cài đặt
- [ ] AWS CDK CLI đã được cài đặt globally
- [ ] Git đã được cài đặt

### 3. Project Setup

- [ ] Clone repository
- [ ] Cài đặt dependencies
- [ ] Cấu hình environment variables
- [ ] Review và update configuration

## 🚀 Step-by-Step Deployment

### Step 1: Verify AWS Credentials

```bash
# Check AWS CLI configuration
aws sts get-caller-identity

# Expected output:
# {
#     "UserId": "AIDAXXXXXXXXXXXXXXXXX",
#     "Account": "123456789012",
#     "Arn": "arn:aws:iam::123456789012:user/your-username"
# }
```

### Step 2: Install Dependencies

```bash
cd CloudRacketSystem/infrastructure
npm install
```

### Step 3: Configure Environment

```bash
# Copy example env file
cp .env.example .env

# Edit .env file
nano .env  # or use your preferred editor
```

Update these values:
```env
CDK_ACCOUNT=123456789012          # Your AWS Account ID
CDK_REGION=ap-southeast-1         # Your preferred region
STAGE=dev                         # Environment name
SENDER_EMAIL=noreply@yourdomain.com  # Your verified email
```

### Step 4: Verify Email in SES

**Important**: Amazon SES starts in sandbox mode. You must verify your sender email.

#### Option A: Verify Single Email (Sandbox Mode)

1. Go to AWS Console > Amazon SES
2. Click "Verified identities" > "Create identity"
3. Select "Email address"
4. Enter your sender email
5. Click "Create identity"
6. Check your email and click verification link

#### Option B: Request Production Access (Recommended for Production)

1. Go to AWS Console > Amazon SES
2. Click "Account dashboard"
3. Click "Request production access"
4. Fill out the form with your use case
5. Wait for approval (usually 24-48 hours)

### Step 5: Bootstrap CDK (First Time Only)

```bash
npm run bootstrap
```

This creates necessary S3 buckets and IAM roles for CDK.

### Step 6: Review Infrastructure

```bash
# Synthesize CloudFormation template
npm run synth

# Review what will be created
npm run diff
```

### Step 7: Deploy to Development

```bash
npm run deploy:dev
```

This will:
1. Build TypeScript code
2. Package Lambda functions
3. Create CloudFormation stack
4. Deploy all resources
5. Output important values (API URL, User Pool ID, etc.)

**Expected deployment time**: 10-15 minutes

### Step 8: Save Outputs

After deployment, save these outputs:

```bash
# API Gateway URL
export API_URL="https://abc123xyz.execute-api.ap-southeast-1.amazonaws.com/dev"

# Cognito User Pool ID
export USER_POOL_ID="ap-southeast-1_XXXXXXXXX"

# Cognito Client ID
export CLIENT_ID="1234567890abcdefghijklmnop"
```

### Step 9: Test API

```bash
# Health check (if implemented)
curl $API_URL/health

# Test public endpoint
curl $API_URL/courts/search?city=Hanoi
```

### Step 10: Create Test User

```bash
# Using AWS CLI
aws cognito-idp sign-up \
  --client-id $CLIENT_ID \
  --username test@example.com \
  --password "TestPassword123!" \
  --user-attributes Name=email,Value=test@example.com Name=name,Value="Test User"

# Confirm user (admin action)
aws cognito-idp admin-confirm-sign-up \
  --user-pool-id $USER_POOL_ID \
  --username test@example.com
```

## 🔄 Update Deployment

When you make changes to infrastructure:

```bash
# Review changes
npm run diff

# Deploy updates
npm run deploy:dev

# For Lambda code changes only (faster)
cdk deploy --hotswap
```

## 🌍 Deploy to Production

### Prerequisites

- [ ] Tested thoroughly in development
- [ ] SES production access approved
- [ ] Custom domain configured (optional)
- [ ] Monitoring alerts configured
- [ ] Backup strategy in place

### Production Deployment

```bash
# Update .env for production
STAGE=prod
SENDER_EMAIL=noreply@cloudracket.com

# Deploy to production
npm run deploy:prod
```

**Important Production Considerations**:

1. **DynamoDB**: Tables will have `RemovalPolicy.RETAIN` (won't be deleted)
2. **S3**: Buckets will have `RemovalPolicy.RETAIN`
3. **Cognito**: User Pool will have `RemovalPolicy.RETAIN`
4. **Monitoring**: All alarms are enabled
5. **WAF**: Rate limiting and security rules active

## 📊 Post-Deployment Verification

### 1. Check CloudFormation Stack

```bash
aws cloudformation describe-stacks \
  --stack-name CloudRacket-dev-Serverless-Stack \
  --query 'Stacks[0].StackStatus'
```

Expected: `CREATE_COMPLETE` or `UPDATE_COMPLETE`

### 2. Verify Lambda Functions

```bash
aws lambda list-functions \
  --query 'Functions[?starts_with(FunctionName, `dev-`)].FunctionName'
```

Should list all Lambda functions.

### 3. Check API Gateway

```bash
aws apigateway get-rest-apis \
  --query 'items[?name==`dev-cloud-racket-api`]'
```

### 4. Verify DynamoDB Tables

```bash
aws dynamodb list-tables \
  --query 'TableNames[?starts_with(@, `dev-`)]'
```

Should show: `dev-Courts`, `dev-Bookings`, `dev-Reviews`, etc.

### 5. Test Email Sending

```bash
aws ses send-email \
  --from noreply@cloudracket.com \
  --destination ToAddresses=your-email@example.com \
  --message Subject={Data="Test Email"},Body={Text={Data="This is a test"}}
```

### 6. Check CloudWatch Logs

```bash
# List log groups
aws logs describe-log-groups \
  --log-group-name-prefix /aws/lambda/dev-

# View recent logs
aws logs tail /aws/lambda/dev-auth-register --follow
```

## 🔧 Troubleshooting

### Issue: CDK Bootstrap Failed

**Error**: `Unable to resolve AWS account to use`

**Solution**:
```bash
# Set AWS credentials explicitly
export AWS_ACCESS_KEY_ID=your-access-key
export AWS_SECRET_ACCESS_KEY=your-secret-key
export AWS_DEFAULT_REGION=ap-southeast-1

# Try bootstrap again
npm run bootstrap
```

### Issue: SES Email Not Sending

**Error**: `Email address is not verified`

**Solution**:
1. Go to SES Console
2. Verify the sender email
3. Wait for verification email
4. Click verification link

### Issue: Lambda Function Timeout

**Error**: `Task timed out after 30.00 seconds`

**Solution**:
Update timeout in `lambda-construct.ts`:
```typescript
timeout: cdk.Duration.minutes(1)  // Increase to 1 minute
```

### Issue: API Gateway 403 Forbidden

**Error**: `User is not authorized to access this resource`

**Solution**:
1. Check Cognito token is valid
2. Verify Authorization header format: `Bearer <token>`
3. Check user is in correct Cognito group

### Issue: DynamoDB Access Denied

**Error**: `User is not authorized to perform: dynamodb:PutItem`

**Solution**:
Lambda IAM role needs permissions. Check `lambda-construct.ts`:
```typescript
props.courtsTable.grantReadWriteData(fn);
```

## 🗑️ Cleanup / Destroy

### Development Environment

```bash
npm run destroy
```

This will delete all resources **except**:
- DynamoDB tables (if `RemovalPolicy.RETAIN`)
- S3 buckets with data
- Cognito User Pool

### Manual Cleanup

If some resources remain:

```bash
# Delete S3 buckets
aws s3 rb s3://dev-cloud-racket-court-images --force
aws s3 rb s3://dev-cloud-racket-reports --force

# Delete DynamoDB tables
aws dynamodb delete-table --table-name dev-Courts
aws dynamodb delete-table --table-name dev-Bookings
# ... repeat for other tables

# Delete Cognito User Pool
aws cognito-idp delete-user-pool --user-pool-id ap-southeast-1_XXXXXXXXX
```

## 📈 Monitoring After Deployment

### CloudWatch Dashboard

Access: AWS Console > CloudWatch > Dashboards > `dev-cloud-racket-dashboard`

Metrics to monitor:
- API Gateway request count
- API Gateway latency (p50, p95, p99)
- API Gateway errors (4xx, 5xx)
- Lambda invocations
- Lambda errors
- Lambda duration
- DynamoDB consumed capacity

### CloudWatch Alarms

Check: AWS Console > CloudWatch > Alarms

Configured alarms:
- API 5xx errors > 2%
- API 4xx errors > 10%
- API latency p95 > 1000ms

### CloudWatch Logs Insights

Useful queries:

```sql
# Find errors in Lambda logs
fields @timestamp, @message
| filter @message like /ERROR/
| sort @timestamp desc
| limit 20

# API Gateway access logs
fields @timestamp, requestTime, status, ip
| filter status >= 400
| sort @timestamp desc
| limit 50

# Lambda cold starts
fields @timestamp, @duration, @initDuration
| filter @type = "REPORT"
| stats avg(@duration), avg(@initDuration), count() by bin(5m)
```

## 🔐 Security Best Practices

### 1. Rotate AWS Credentials

```bash
# Create new access key
aws iam create-access-key --user-name your-username

# Update credentials
aws configure

# Delete old access key
aws iam delete-access-key --access-key-id OLD_KEY_ID --user-name your-username
```

### 2. Enable MFA for AWS Account

1. Go to IAM Console
2. Click your username
3. Security credentials tab
4. Assign MFA device

### 3. Review IAM Policies

```bash
# List Lambda execution roles
aws iam list-roles --query 'Roles[?contains(RoleName, `Lambda`)].RoleName'

# Review role policies
aws iam list-attached-role-policies --role-name CloudRacket-dev-Lambda-Role
```

### 4. Enable CloudTrail

```bash
aws cloudtrail create-trail \
  --name cloud-racket-trail \
  --s3-bucket-name my-cloudtrail-bucket

aws cloudtrail start-logging --name cloud-racket-trail
```

### 5. Configure WAF Rules

Review and adjust WAF rules in `waf-construct.ts`:
- Rate limiting threshold
- Geo-blocking rules
- Custom rules for your use case

## 📞 Support

If you encounter issues:

1. Check CloudFormation events for error details
2. Review CloudWatch logs
3. Check AWS Service Health Dashboard
4. Contact AWS Support (if you have support plan)

## 📚 Additional Resources

- [AWS CDK Documentation](https://docs.aws.amazon.com/cdk/)
- [AWS Lambda Best Practices](https://docs.aws.amazon.com/lambda/latest/dg/best-practices.html)
- [Amazon SES Documentation](https://docs.aws.amazon.com/ses/)
- [DynamoDB Best Practices](https://docs.aws.amazon.com/amazondynamodb/latest/developerguide/best-practices.html)

---

**Last Updated**: 2025-01-24  
**Version**: 2.0.0
