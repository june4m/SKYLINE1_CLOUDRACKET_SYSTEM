# Deployment Order - Cloud Racket Platform

## Thứ tự triển khai đúng

### **Phase 1: Infrastructure Setup (Foundation)**

#### 1.1 Create DynamoDB Tables
```bash
cd infrastructure/cloudformation
aws cloudformation deploy \
  --template-file dynamodb-tables.yml \
  --stack-name cloud-racket-dynamodb-dev \
  --parameter-overrides Environment=dev
```

**Tables cần tạo:**
- ✅ Courts Table (PK: courtId, GSI: ownerId)
- ✅ Bookings Table (PK: bookingId, GSI: userId, courtId)
- ✅ Reviews Table (PK: reviewId, GSI: userId, courtId)
- ✅ Availability Table (PK: courtId#date#timeSlot)
- ✅ Interactions Table (PK: interactionId, GSI: userId)

#### 1.2 Create S3 Buckets
```bash
aws cloudformation deploy \
  --template-file s3-buckets.yml \
  --stack-name cloud-racket-s3-dev \
  --parameter-overrides Environment=dev
```

**Buckets cần tạo:**
- ✅ Court Images Bucket
- ✅ Reports Bucket

#### 1.3 Create Cognito User Pool
```bash
aws cloudformation deploy \
  --template-file cognito-user-pool.yml \
  --stack-name cloud-racket-cognito-dev \
  --parameter-overrides Environment=dev
```

#### 1.4 Create IAM Roles
```bash
aws cloudformation deploy \
  --template-file iam-roles.yml \
  --stack-name cloud-racket-iam-dev \
  --capabilities CAPABILITY_IAM
```

---

### **Phase 2: Shared Libraries**

#### 2.1 Setup Shared Folder
```bash
cd shared
npm init -y
npm install @aws-sdk/client-dynamodb @aws-sdk/lib-dynamodb @aws-sdk/client-s3 @aws-sdk/client-ses
npm install --save-dev typescript @types/node
```

#### 2.2 Create Shared Utilities
- ✅ `shared/lib/aws-clients.ts`
- ✅ `shared/lib/logger.ts`
- ✅ `shared/lib/response-builder.ts`
- ✅ `shared/lib/error-handler.ts`
- ✅ `shared/types/`
- ✅ `shared/constants/`

---

### **Phase 3: Deploy Services (One by One)**

#### 3.1 Auth Service (FIRST - vì các service khác cần auth)
```bash
cd services/auth-service
npm install
serverless deploy --stage dev
```

**Test endpoints:**
```bash
# Register
curl -X POST https://xxx.execute-api.ap-southeast-1.amazonaws.com/dev/auth/register \
  -H "Content-Type: application/json" \
  -d '{"email":"test@example.com","password":"Test123!","name":"Test User"}'

# Login
curl -X POST https://xxx.execute-api.ap-southeast-1.amazonaws.com/dev/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"test@example.com","password":"Test123!"}'
```

#### 3.2 Court Service
```bash
cd services/court-service
npm install
serverless deploy --stage dev
```

#### 3.3 Booking Service
```bash
cd services/booking-service
npm install
serverless deploy --stage dev
```

#### 3.4 Review Service
```bash
cd services/review-service
npm install
serverless deploy --stage dev
```

#### 3.5 Recommendation Service
```bash
cd services/recommendation-service
npm install
serverless deploy --stage dev
```

#### 3.6 Dashboard Service
```bash
cd services/dashboard-service
npm install
serverless deploy --stage dev
```

#### 3.7 Admin Service
```bash
cd services/admin-service
npm install
serverless deploy --stage dev
```

#### 3.8 Notification Service
```bash
cd services/notification-service
npm install
serverless deploy --stage dev
```

---

## **Quick Start Script**

### **deploy-all.sh**
```bash
#!/bin/bash

STAGE=${1:-dev}

echo "🚀 Deploying Cloud Racket Platform to $STAGE environment..."

# Phase 1: Infrastructure
echo "📦 Phase 1: Deploying Infrastructure..."
cd infrastructure/cloudformation

echo "  → Creating DynamoDB tables..."
aws cloudformation deploy \
  --template-file dynamodb-tables.yml \
  --stack-name cloud-racket-dynamodb-$STAGE \
  --parameter-overrides Environment=$STAGE

echo "  → Creating S3 buckets..."
aws cloudformation deploy \
  --template-file s3-buckets.yml \
  --stack-name cloud-racket-s3-$STAGE \
  --parameter-overrides Environment=$STAGE

echo "  → Creating Cognito User Pool..."
aws cloudformation deploy \
  --template-file cognito-user-pool.yml \
  --stack-name cloud-racket-cognito-$STAGE \
  --parameter-overrides Environment=$STAGE

echo "  → Creating IAM Roles..."
aws cloudformation deploy \
  --template-file iam-roles.yml \
  --stack-name cloud-racket-iam-$STAGE \
  --capabilities CAPABILITY_IAM

# Phase 2: Services
echo "🔧 Phase 2: Deploying Services..."

services=(
  "auth-service"
  "court-service"
  "booking-service"
  "review-service"
  "recommendation-service"
  "dashboard-service"
  "admin-service"
  "notification-service"
)

cd ../../services

for service in "${services[@]}"; do
  echo "  → Deploying $service..."
  cd $service
  npm install --silent
  serverless deploy --stage $STAGE
  cd ..
done

echo "✅ Deployment complete!"
echo "📝 API Gateway URL:"
aws cloudformation describe-stacks \
  --stack-name cloud-racket-auth-service-$STAGE \
  --query 'Stacks[0].Outputs[?OutputKey==`ServiceEndpoint`].OutputValue' \
  --output text
```

---

## **Local Development Order**

### **1. Setup DynamoDB Local (Optional)**
```bash
# Download DynamoDB Local
docker run -p 8000:8000 amazon/dynamodb-local

# Create tables locally
aws dynamodb create-table \
  --table-name Courts \
  --attribute-definitions AttributeName=courtId,AttributeType=S \
  --key-schema AttributeName=courtId,KeyType=HASH \
  --billing-mode PAY_PER_REQUEST \
  --endpoint-url http://localhost:8000
```

### **2. Run Service Locally**
```bash
cd services/auth-service
npm install
serverless offline start
```

### **3. Test Locally**
```bash
curl http://localhost:3000/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"test@example.com","password":"Test123!"}'
```

---

## **Verification Checklist**

### **After Phase 1 (Infrastructure):**
- [ ] DynamoDB tables created
- [ ] S3 buckets created
- [ ] Cognito User Pool created
- [ ] IAM roles created
- [ ] All CloudFormation stacks show CREATE_COMPLETE

### **After Phase 2 (Shared Libraries):**
- [ ] Shared folder has all utilities
- [ ] TypeScript compiles without errors
- [ ] Unit tests pass

### **After Phase 3 (Services):**
- [ ] All services deployed successfully
- [ ] API Gateway endpoints accessible
- [ ] Can register new user
- [ ] Can login and get JWT token
- [ ] Can create court (with auth)
- [ ] Can create booking
- [ ] CloudWatch logs show function invocations

---

## **Troubleshooting**

### **Issue: CloudFormation stack fails**
```bash
# Check stack events
aws cloudformation describe-stack-events \
  --stack-name cloud-racket-dynamodb-dev \
  --max-items 10

# Delete failed stack
aws cloudformation delete-stack \
  --stack-name cloud-racket-dynamodb-dev
```

### **Issue: Serverless deploy fails**
```bash
# Check serverless logs
serverless logs -f login --stage dev

# Remove and redeploy
serverless remove --stage dev
serverless deploy --stage dev
```

### **Issue: Lambda can't access DynamoDB**
- Check IAM role permissions
- Verify table name in environment variables
- Check VPC configuration (if using VPC)

---

## **Cost Estimation**

### **Phase 1 (Infrastructure):**
- DynamoDB: $0 (free tier: 25GB storage, 25 WCU, 25 RCU)
- S3: $0.023/GB (first 50GB)
- Cognito: $0 (free tier: 50,000 MAU)
- **Total: ~$0-5/month**

### **Phase 2 (Shared Libraries):**
- No cost (just code)

### **Phase 3 (Services):**
- Lambda: $0 (free tier: 1M requests, 400,000 GB-seconds)
- API Gateway: $3.50 per million requests
- **Total: ~$0-10/month** (with free tier)

**Grand Total: ~$0-15/month** for development environment

---

## **Next Steps After Deployment**

1. **Setup CI/CD Pipeline** (GitHub Actions)
2. **Configure Custom Domain** (Route53 + CloudFront)
3. **Setup Monitoring** (CloudWatch Dashboards)
4. **Configure Alarms** (SNS notifications)
5. **Setup Backup** (DynamoDB PITR)
6. **Load Testing** (Artillery/JMeter)
7. **Security Audit** (AWS WAF, Security Hub)

---

## **Recommended: Start Small**

Nếu bạn mới bắt đầu, tôi recommend:

### **Minimal Viable Product (MVP):**
1. ✅ DynamoDB: Courts + Bookings tables only
2. ✅ Cognito User Pool
3. ✅ Auth Service
4. ✅ Court Service
5. ✅ Booking Service

**Deploy 3 services này trước, test kỹ, rồi mới thêm các service khác!**

```bash
# MVP Deployment
./infrastructure/scripts/deploy-mvp.sh dev
```

Sau khi MVP chạy ổn, mới thêm:
- Review Service
- Recommendation Service
- Dashboard Service
- Admin Service
- Notification Service
