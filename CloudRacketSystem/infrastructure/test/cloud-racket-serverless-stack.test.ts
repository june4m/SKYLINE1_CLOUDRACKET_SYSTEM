import * as cdk from 'aws-cdk-lib';
import { Template, Match } from 'aws-cdk-lib/assertions';
import { CloudRacketServerlessStack } from '../lib/cloud-racket-serverless-stack';

describe('CloudRacketServerlessStack', () => {
  let app: cdk.App;
  let stack: CloudRacketServerlessStack;
  let template: Template;

  // Create stack once for all tests to avoid repeated synthesis issues
  beforeAll(() => {
    app = new cdk.App({
      context: {
        environments: {
          test: {
            stage: 'test',
            removalPolicy: 'DESTROY',
            enablePersonalize: false,
            lambdaMemory: 256,
            lambdaTimeout: 30,
            apiCacheEnabled: false,
            apiCacheTtl: 60,
            logRetentionDays: 14,
            enableTerminationProtection: false,
          },
        },
      },
    });

    stack = new CloudRacketServerlessStack(app, 'TestStack', {
      stage: 'test',
      senderEmail: 'test@example.com',
      alarmEmail: 'alarm@example.com',
      env: {
        account: '123456789012',
        region: 'ap-southeast-1',
      },
    });

    template = Template.fromStack(stack);
  });

  describe('Stack Creation', () => {
    test('stack is created successfully', () => {
      expect(stack).toBeDefined();
      expect(stack.stackName).toBeDefined();
    });

    test('all constructs are instantiated', () => {
      expect(stack.dynamoDB).toBeDefined();
      expect(stack.s3).toBeDefined();
      expect(stack.cognito).toBeDefined();
      expect(stack.scheduler).toBeDefined();
      expect(stack.location).toBeDefined();
      expect(stack.lambdaLayers).toBeDefined();
      expect(stack.lambda).toBeDefined();
      expect(stack.apiGateway).toBeDefined();
      expect(stack.eventBridge).toBeDefined();
      expect(stack.monitoring).toBeDefined();
      expect(stack.waf).toBeDefined();
    });

    test('stack uses correct environment configuration', () => {
      // Verify stack doesn't have termination protection for test env
      expect(stack.terminationProtection).toBeFalsy();
    });
  });

  describe('Resource Count', () => {
    test('creates 5 DynamoDB tables', () => {
      template.resourceCountIs('AWS::DynamoDB::Table', 5);
    });

    test('creates 2 S3 buckets', () => {
      template.resourceCountIs('AWS::S3::Bucket', 2);
    });

    test('creates Cognito User Pool', () => {
      template.resourceCountIs('AWS::Cognito::UserPool', 1);
    });

    test('creates Cognito User Pool Client', () => {
      template.resourceCountIs('AWS::Cognito::UserPoolClient', 1);
    });

    test('creates Location Service Place Index', () => {
      template.resourceCountIs('AWS::Location::PlaceIndex', 1);
    });

    test('creates Lambda Layers', () => {
      template.resourceCountIs('AWS::Lambda::LayerVersion', 2);
    });

    test('creates REST API', () => {
      template.resourceCountIs('AWS::ApiGateway::RestApi', 1);
    });

    test('creates WAF Web ACL', () => {
      template.resourceCountIs('AWS::WAFv2::WebACL', 1);
    });

    test('creates CloudWatch Dashboard', () => {
      template.resourceCountIs('AWS::CloudWatch::Dashboard', 1);
    });

    test('creates SNS Topic for alarms', () => {
      template.resourceCountIs('AWS::SNS::Topic', 1);
    });

    test('creates EventBridge Scheduler Group', () => {
      template.resourceCountIs('AWS::Scheduler::ScheduleGroup', 1);
    });
  });

  describe('CloudFormation Outputs', () => {
    test('outputs API Gateway URL', () => {
      template.hasOutput('ApiGatewayUrl', {
        Description: 'API Gateway URL for frontend integration',
        Export: { Name: 'test-api-gateway-url' },
      });
    });

    test('outputs API Gateway ID', () => {
      template.hasOutput('ApiGatewayId', {
        Description: 'API Gateway REST API ID',
        Export: { Name: 'test-api-gateway-id' },
      });
    });

    test('outputs Cognito User Pool ID', () => {
      template.hasOutput('CognitoUserPoolId', {
        Description: 'Cognito User Pool ID for authentication',
        Export: { Name: 'test-cognito-user-pool-id' },
      });
    });

    test('outputs Cognito App Client ID', () => {
      template.hasOutput('CognitoAppClientId', {
        Description: 'Cognito App Client ID for authentication',
        Export: { Name: 'test-cognito-app-client-id' },
      });
    });

    test('outputs Images Bucket Name', () => {
      template.hasOutput('ImagesBucketName', {
        Description: 'S3 bucket name for court images',
        Export: { Name: 'test-images-bucket-name' },
      });
    });

    test('outputs Reports Bucket Name', () => {
      template.hasOutput('ReportsBucketName', {
        Description: 'S3 bucket name for reports',
        Export: { Name: 'test-reports-bucket-name' },
      });
    });

    test('outputs CloudWatch Dashboard URL', () => {
      template.hasOutput('CloudWatchDashboardUrl', {
        Description: 'CloudWatch Dashboard URL for monitoring',
        Export: { Name: 'test-cloudwatch-dashboard-url' },
      });
    });

    test('outputs Stack Name', () => {
      template.hasOutput('StackName', {
        Description: 'CloudFormation stack name',
        Export: { Name: 'test-stack-name' },
      });
    });

    test('outputs Courts Table Name', () => {
      template.hasOutput('CourtsTableName', {
        Description: 'DynamoDB Courts table name',
        Export: { Name: 'test-courts-table-name' },
      });
    });

    test('outputs Bookings Table Name', () => {
      template.hasOutput('BookingsTableName', {
        Description: 'DynamoDB Bookings table name',
        Export: { Name: 'test-bookings-table-name' },
      });
    });

    test('outputs WAF Web ACL ARN', () => {
      template.hasOutput('WafWebAclArn', {
        Description: 'WAF Web ACL ARN',
        Export: { Name: 'test-waf-web-acl-arn' },
      });
    });

    test('outputs Place Index Name', () => {
      template.hasOutput('PlaceIndexName', {
        Description: 'Amazon Location Service Place Index name',
        Export: { Name: 'test-place-index-name' },
      });
    });
  });

  describe('Environment Configuration', () => {
    test('uses default config when environment not found in context', () => {
      const appWithoutContext = new cdk.App();
      const stackWithDefaults = new CloudRacketServerlessStack(appWithoutContext, 'DefaultStack', {
        stage: 'unknown',
        senderEmail: 'test@example.com',
        env: {
          account: '123456789012',
          region: 'ap-southeast-1',
        },
      });

      expect(stackWithDefaults).toBeDefined();
      expect(stackWithDefaults.terminationProtection).toBeFalsy();
    });

    test('enables termination protection for production', () => {
      const prodApp = new cdk.App({
        context: {
          environments: {
            prod: {
              stage: 'prod',
              removalPolicy: 'RETAIN',
              enablePersonalize: false,
              lambdaMemory: 512,
              lambdaTimeout: 30,
              apiCacheEnabled: true,
              apiCacheTtl: 60,
              logRetentionDays: 30,
              enableTerminationProtection: true,
            },
          },
        },
      });

      const prodStack = new CloudRacketServerlessStack(prodApp, 'ProdStack', {
        stage: 'prod',
        senderEmail: 'prod@example.com',
        env: {
          account: '123456789012',
          region: 'ap-southeast-1',
        },
      });

      expect(prodStack.terminationProtection).toBe(true);
    });
  });

  describe('Resource Naming', () => {
    test('DynamoDB tables are prefixed with stage', () => {
      template.hasResourceProperties('AWS::DynamoDB::Table', {
        TableName: Match.stringLikeRegexp('^test-'),
      });
    });

    test('S3 buckets are prefixed with stage', () => {
      template.hasResourceProperties('AWS::S3::Bucket', {
        BucketName: Match.stringLikeRegexp('^test-'),
      });
    });

    test('Cognito User Pool is prefixed with stage', () => {
      template.hasResourceProperties('AWS::Cognito::UserPool', {
        UserPoolName: Match.stringLikeRegexp('^test-'),
      });
    });
  });
});
