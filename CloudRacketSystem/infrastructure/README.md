# Cloud Racket Platform - AWS Serverless Infrastructure

Kiến trúc serverless hoàn chỉnh cho nền tảng đặt sân cầu lông Cloud Racket, sử dụng AWS CDK.

## 🏗️ Kiến Trúc

### AWS Services Được Sử Dụng

| Service | Mục đích | Trạng thái |
|---------|----------|------------|
| **AWS Lambda** | Serverless compute cho business logic | ✅ Implemented |
| **API Gateway** | REST API endpoints | ✅ Implemented |
| **DynamoDB** | NoSQL database | ✅ Implemented |
| **Cognito** | Authentication & Authorization | ✅ Implemented |
| **S3** | Lưu trữ hình ảnh sân & reports | ✅ Implemented |
| **SES** | Gửi email xác nhận | ✅ Implemented |
| **Location Service** | Tìm sân gần | ✅ Implemented |
| **EventBridge** | Scheduler & automation | ✅ Implemented |
| **CloudWatch** | Monitoring & logging | ✅ Implemented |
| **WAF** | Web Application Firewall | ✅ Implemented |
| **Personalize** | AI recommendations | ⏳ Optional |
| **Comprehend** | Sentiment analysis | ⏳ Optional |

## 📁 Cấu Trúc Thư Mục

```
infrastructure/
├── bin/
│   └── app.ts                          # CDK App entry point
├── lib/
│   ├── cloud-racket-serverless-stack.ts # Main serverless stack
│   └── constructs/
│       ├── dynamodb-construct.ts        # DynamoDB tables
│       ├── cognito-construct.ts         # User authentication
│       ├── s3-construct.ts              # File storage
│       ├── ses-construct.ts             # Email service
│       ├── location-construct.ts        # Geospatial service
│       ├── lambda-construct.ts          # Lambda functions
│       ├── api-gateway-construct.ts     # API endpoints
│       ├── eventbridge-construct.ts     # Automation rules
│       ├── monitoring-construct.ts      # CloudWatch monitoring
│       └── waf-construct.ts             # Security firewall
├── .env                                 # Environment variables
├── cdk.json                             # CDK configuration
├── package.json                         # Dependencies
└── tsconfig.json                        # TypeScript config
```

## 🚀 Deployment

### Prerequisites

1. **AWS CLI** đã được cấu hình:
```bash
aws configure
```

2. **Node.js** (v18 hoặc cao hơn):
```bash
node --version
```

3. **AWS CDK CLI**:
```bash
npm install -g aws-cdk
```

### Bước 1: Cài Đặt Dependencies

```bash
cd CloudRacketSystem/infrastructure
npm install
```

### Bước 2: Cấu Hình Environment Variables

Chỉnh sửa file `.env`:

```env
CDK_ACCOUNT=123456789012          # AWS Account ID của bạn
CDK_REGION=ap-southeast-1         # AWS Region
STAGE=dev                         # Environment: dev, staging, prod
SENDER_EMAIL=noreply@cloudracket.com  # Email đã verify trong SES
```

### Bước 3: Bootstrap CDK (Chỉ lần đầu)

```bash
npm run bootstrap
```

### Bước 4: Xem Preview Changes

```bash
npm run synth
npm run diff
```

### Bước 5: Deploy

#### Development Environment
```bash
npm run deploy:dev
```

#### Production Environment
```bash
npm run deploy:prod
```

### Bước 6: Verify Email trong SES

Sau khi deploy, bạn cần verify email trong Amazon SES:

1. Đăng nhập AWS Console
2. Vào **Amazon SES** > **Verified identities**
3. Tìm email của bạn và click **Verify**
4. Check email và click link xác nhận

## 📊 API Endpoints

Sau khi deploy, API Gateway URL sẽ được output. Ví dụ:
```
https://abc123xyz.execute-api.ap-southeast-1.amazonaws.com/dev
```

### Authentication Endpoints

| Method | Endpoint | Description | Auth Required |
|--------|----------|-------------|---------------|
| POST | `/auth/register` | Đăng ký user mới | ❌ |
| POST | `/auth/login` | Đăng nhập | ❌ |
| POST | `/auth/refresh-token` | Refresh access token | ❌ |

### Court Endpoints

| Method | Endpoint | Description | Auth Required |
|--------|----------|-------------|---------------|
| POST | `/courts` | Tạo sân mới | ✅ |
| GET | `/courts/{courtId}` | Lấy thông tin sân | ❌ |
| GET | `/courts/search` | Tìm kiếm sân | ❌ |
| GET | `/courts/nearby` | Tìm sân gần | ❌ |
| POST | `/courts/{courtId}/images` | Upload hình ảnh | ✅ |

### Booking Endpoints

| Method | Endpoint | Description | Auth Required |
|--------|----------|-------------|---------------|
| POST | `/bookings` | Tạo booking mới | ✅ |
| GET | `/bookings/{bookingId}` | Lấy thông tin booking | ✅ |
| DELETE | `/bookings/{bookingId}` | Hủy booking | ✅ |

### Review Endpoints

| Method | Endpoint | Description | Auth Required |
|--------|----------|-------------|---------------|
| POST | `/reviews` | Tạo review mới | ✅ |
| GET | `/reviews` | Lấy danh sách reviews | ❌ |

### Recommendation Endpoints

| Method | Endpoint | Description | Auth Required |
|--------|----------|-------------|---------------|
| GET | `/recommendations` | Lấy gợi ý cá nhân hóa | ✅ |
| POST | `/recommendations/track` | Track user interaction | ✅ |

### Dashboard Endpoints

| Method | Endpoint | Description | Auth Required |
|--------|----------|-------------|---------------|
| GET | `/dashboard/stats` | Thống kê tổng quan | ✅ |
| GET | `/dashboard/revenue` | Phân tích doanh thu | ✅ |
| POST | `/dashboard/report` | Tạo báo cáo | ✅ |

### Admin Endpoints

| Method | Endpoint | Description | Auth Required |
|--------|----------|-------------|---------------|
| GET/POST/PUT/DELETE | `/admin/users` | Quản lý users | ✅ Admin |
| GET/POST/PUT/DELETE | `/admin/courts` | Quản lý courts | ✅ Admin |
| GET/POST/DELETE | `/admin/reviews` | Kiểm duyệt reviews | ✅ Admin |

## 🔐 Authentication

API sử dụng **Amazon Cognito** cho authentication:

1. **Register**: Tạo user mới
2. **Login**: Nhận `accessToken`, `idToken`, `refreshToken`
3. **Authenticated requests**: Thêm header:
```
Authorization: Bearer <accessToken>
```

## 📈 Monitoring

### CloudWatch Dashboard

Truy cập CloudWatch Dashboard:
```
AWS Console > CloudWatch > Dashboards > {stage}-cloud-racket-dashboard
```

Metrics được theo dõi:
- API Gateway requests
- API Gateway latency (p50, p95, p99)
- API Gateway errors (4xx, 5xx)
- Lambda invocations
- Lambda errors
- Lambda duration

### CloudWatch Alarms

Alarms được cấu hình cho:
- API 5xx errors > 2%
- API 4xx errors > 10%
- API latency p95 > 1000ms

Notifications được gửi qua SNS Topic.

### CloudWatch Logs

Logs được lưu tại:
- API Gateway: `/aws/apigateway/{stage}-cloud-racket`
- Lambda functions: `/aws/lambda/{stage}-{function-name}`

## 🤖 Automation (EventBridge)

### Scheduled Rules

| Rule | Schedule | Description |
|------|----------|-------------|
| Booking Reminder | Every hour | Gửi email nhắc nhở 24h trước booking |
| Daily Cleanup | 2 AM daily | Xóa expired bookings và old data |
| Weekly Retraining | Sunday 3 AM | Retrain Personalize model |
| Monthly Report | 1st day 4 AM | Tạo báo cáo tháng |

### Event-Driven Rules

| Event | Trigger | Action |
|-------|---------|--------|
| Booking Created | DynamoDB Stream | Gửi email xác nhận |
| Booking Cancelled | DynamoDB Stream | Gửi email hủy |
| Review Created | DynamoDB Stream | Phân tích sentiment |

## 🛡️ Security

### WAF Rules

- **Rate Limiting**: 2000 requests/5 minutes per IP
- **AWS Managed Rules**: Common vulnerabilities
- **SQL Injection Protection**: Block SQL injection attempts
- **Known Bad Inputs**: Block malicious patterns

### IAM Permissions

Lambda functions có least-privilege permissions:
- DynamoDB: Read/Write specific tables
- S3: Read/Write specific buckets
- Cognito: Admin operations
- SES: Send email
- Comprehend: Detect sentiment
- Location: Search places

### Encryption

- **DynamoDB**: AWS managed encryption
- **S3**: Server-side encryption (SSE-S3)
- **Cognito**: Encrypted at rest
- **API Gateway**: HTTPS only

## 💰 Cost Estimation

### Development Environment (Low Traffic)

| Service | Usage | Cost/Month |
|---------|-------|------------|
| Lambda | 100K invocations | $0.20 |
| API Gateway | 100K requests | $0.35 |
| DynamoDB | On-demand, 1GB | $1.25 |
| S3 | 5GB storage | $0.12 |
| Cognito | 1000 MAU | Free |
| SES | 1000 emails | Free |
| CloudWatch | Basic monitoring | $3.00 |
| **Total** | | **~$5/month** |

### Production Environment (Medium Traffic)

| Service | Usage | Cost/Month |
|---------|-------|------------|
| Lambda | 10M invocations | $20 |
| API Gateway | 10M requests | $35 |
| DynamoDB | On-demand, 10GB | $12.50 |
| S3 | 50GB storage | $1.15 |
| Cognito | 10K MAU | $27.50 |
| SES | 10K emails | $1.00 |
| CloudWatch | Advanced monitoring | $10 |
| WAF | 10M requests | $5 |
| **Total** | | **~$112/month** |

## 🧪 Testing

### Unit Tests

```bash
npm test
```

### Integration Tests

```bash
npm run test:integration
```

### Load Testing

Sử dụng Artillery hoặc k6:

```bash
# Install Artillery
npm install -g artillery

# Run load test
artillery quick --count 100 --num 10 https://your-api-url/courts
```

## 🔄 CI/CD

### GitHub Actions

Tạo file `.github/workflows/deploy.yml`:

```yaml
name: Deploy to AWS

on:
  push:
    branches: [main]

jobs:
  deploy:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      
      - name: Setup Node.js
        uses: actions/setup-node@v3
        with:
          node-version: '18'
      
      - name: Install dependencies
        run: |
          cd CloudRacketSystem/infrastructure
          npm ci
      
      - name: Deploy to AWS
        run: |
          cd CloudRacketSystem/infrastructure
          npx cdk deploy --all --require-approval never
        env:
          AWS_ACCESS_KEY_ID: ${{ secrets.AWS_ACCESS_KEY_ID }}
          AWS_SECRET_ACCESS_KEY: ${{ secrets.AWS_SECRET_ACCESS_KEY }}
          AWS_REGION: ap-southeast-1
```

## 🗑️ Cleanup

Để xóa toàn bộ infrastructure:

```bash
npm run destroy
```

⚠️ **Warning**: Lệnh này sẽ xóa tất cả resources. Trong production, các resources có `RemovalPolicy.RETAIN` sẽ không bị xóa.

## 📚 Tài Liệu Tham Khảo

- [AWS CDK Documentation](https://docs.aws.amazon.com/cdk/)
- [AWS Lambda Best Practices](https://docs.aws.amazon.com/lambda/latest/dg/best-practices.html)
- [API Gateway Documentation](https://docs.aws.amazon.com/apigateway/)
- [DynamoDB Best Practices](https://docs.aws.amazon.com/amazondynamodb/latest/developerguide/best-practices.html)
- [Cognito Documentation](https://docs.aws.amazon.com/cognito/)

## 🤝 Support

Nếu gặp vấn đề, vui lòng tạo issue hoặc liên hệ team.

---

**Version**: 2.0.0 (Serverless Architecture)  
**Last Updated**: 2025-01-24  
**Maintained by**: Cloud Racket Platform Team
