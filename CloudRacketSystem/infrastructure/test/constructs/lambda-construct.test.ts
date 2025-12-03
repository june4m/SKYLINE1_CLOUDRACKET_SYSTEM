import * as cdk from 'aws-cdk-lib';
import { Template, Match } from 'aws-cdk-lib/assertions';
import { Table, AttributeType, BillingMode, StreamViewType } from 'aws-cdk-lib/aws-dynamodb';
import { LayerVersion, Runtime, Code } from 'aws-cdk-lib/aws-lambda';
import { LambdaConstruct } from '../../lib/constructs/lambda-construct';

describe('LambdaConstruct', () => {
  let app: cdk.App;
  let stack: cdk.Stack;
  let template: Template;

  // Mock DynamoDB tables
  let courtsTable: Table;
  let availabilityTable: Table;
  let bookingsTable: Table;
  let reviewsTable: Table;
  let interactionsTable: Table;

  // Mock Lambda Layers
  let commonLayer: LayerVersion;
  let utilsLayer: LayerVersion;

  beforeEach(() => {
    app = new cdk.App();
    stack = new cdk.Stack(app, 'TestStack');

    // Create mock DynamoDB tables
    courtsTable = new Table(stack, 'CourtsTable', {
      tableName: 'test-courts',
      partitionKey: { name: 'courtId', type: AttributeType.STRING },
      billingMode: BillingMode.PAY_PER_REQUEST,
    });

    availabilityTable = new Table(stack, 'AvailabilityTable', {
      tableName: 'test-availability',
      partitionKey: { name: 'availabilityId', type: AttributeType.STRING },
      billingMode: BillingMode.PAY_PER_REQUEST,
    });

    bookingsTable = new Table(stack, 'BookingsTable', {
      tableName: 'test-bookings',
      partitionKey: { name: 'bookingId', type: AttributeType.STRING },
      billingMode: BillingMode.PAY_PER_REQUEST,
      stream: StreamViewType.NEW_AND_OLD_IMAGES,
    });

    reviewsTable = new Table(stack, 'ReviewsTable', {
      tableName: 'test-reviews',
      partitionKey: { name: 'reviewId', type: AttributeType.STRING },
      billingMode: BillingMode.PAY_PER_REQUEST,
      stream: StreamViewType.NEW_AND_OLD_IMAGES,
    });

    interactionsTable = new Table(stack, 'InteractionsTable', {
      tableName: 'test-interactions',
      partitionKey: { name: 'interactionId', type: AttributeType.STRING },
      billingMode: BillingMode.PAY_PER_REQUEST,
    });

    // Create mock Lambda Layers
    commonLayer = new LayerVersion(stack, 'CommonLayer', {
      layerVersionName: 'test-common-layer',
      code: Code.fromAsset('lambda-layers/common'),
      compatibleRuntimes: [Runtime.NODEJS_18_X],
    });

    utilsLayer = new LayerVersion(stack, 'UtilsLayer', {
      layerVersionName: 'test-utils-layer',
      code: Code.fromAsset('lambda-layers/utils'),
      compatibleRuntimes: [Runtime.NODEJS_18_X],
    });

    // Create Lambda Construct
    new LambdaConstruct(stack, 'TestLambda', {
      stage: 'test',
      dynamoDBTables: {
        courtsTable,
        courtsTableName: 'test-courts',
        courtsTableArn: courtsTable.tableArn,
        availabilityTable,
        availabilityTableName: 'test-availability',
        availabilityTableArn: availabilityTable.tableArn,
        bookingsTable,
        bookingsTableName: 'test-bookings',
        bookingsTableArn: bookingsTable.tableArn,
        bookingsStreamArn: bookingsTable.tableStreamArn!,
        reviewsTable,
        reviewsTableName: 'test-reviews',
        reviewsTableArn: reviewsTable.tableArn,
        reviewsStreamArn: reviewsTable.tableStreamArn!,
        interactionsTable,
        interactionsTableName: 'test-interactions',
        interactionsTableArn: interactionsTable.tableArn,
      },
      s3Buckets: {
        imagesBucketName: 'test-images-bucket',
        imagesBucketArn: 'arn:aws:s3:::test-images-bucket',
        reportsBucketName: 'test-reports-bucket',
        reportsBucketArn: 'arn:aws:s3:::test-reports-bucket',
      },
      cognito: {
        userPoolId: 'test-user-pool-id',
        userPoolArn: 'arn:aws:cognito-idp:us-east-1:123456789012:userpool/test-user-pool-id',
        userPoolClientId: 'test-client-id',
      },
      ses: {
        senderEmail: 'test@example.com',
        emailIdentityArn: 'arn:aws:ses:us-east-1:123456789012:identity/test@example.com',
      },
      location: {
        placeIndexName: 'test-place-index',
        placeIndexArn: 'arn:aws:geo:us-east-1:123456789012:place-index/test-place-index',
      },
      lambdaLayers: {
        commonLayer,
        utilsLayer,
      },
    });

    template = Template.fromStack(stack);
  });


  describe('Function Creation', () => {
    test('creates all Auth Lambda functions', () => {
      template.hasResourceProperties('AWS::Lambda::Function', {
        FunctionName: 'test-register',
        Runtime: 'nodejs18.x',
      });
      template.hasResourceProperties('AWS::Lambda::Function', {
        FunctionName: 'test-login',
        Runtime: 'nodejs18.x',
      });
      template.hasResourceProperties('AWS::Lambda::Function', {
        FunctionName: 'test-refreshToken',
        Runtime: 'nodejs18.x',
      });
    });

    test('creates all Court Lambda functions', () => {
      const courtFunctions = [
        'test-createCourt',
        'test-getCourt',
        'test-updateCourt',
        'test-deleteCourt',
        'test-searchCourts',
        'test-nearbyCourts',
        'test-uploadCourtImage',
        'test-getAvailability',
        'test-updateAvailability',
      ];
      courtFunctions.forEach((funcName) => {
        template.hasResourceProperties('AWS::Lambda::Function', {
          FunctionName: funcName,
        });
      });
    });

    test('creates all Booking Lambda functions', () => {
      const bookingFunctions = [
        'test-createBooking',
        'test-getBooking',
        'test-cancelBooking',
        'test-listBookings',
        'test-bookingConfirmation',
      ];
      bookingFunctions.forEach((funcName) => {
        template.hasResourceProperties('AWS::Lambda::Function', {
          FunctionName: funcName,
        });
      });
    });

    test('creates all Review Lambda functions', () => {
      template.hasResourceProperties('AWS::Lambda::Function', {
        FunctionName: 'test-createReview',
      });
      template.hasResourceProperties('AWS::Lambda::Function', {
        FunctionName: 'test-getReviews',
      });
      template.hasResourceProperties('AWS::Lambda::Function', {
        FunctionName: 'test-aggregateRating',
      });
    });

    test('creates all Recommendation Lambda functions', () => {
      template.hasResourceProperties('AWS::Lambda::Function', {
        FunctionName: 'test-getRecommendations',
      });
      template.hasResourceProperties('AWS::Lambda::Function', {
        FunctionName: 'test-trackInteraction',
      });
    });

    test('creates all Dashboard Lambda functions', () => {
      const dashboardFunctions = [
        'test-getStats',
        'test-getRevenue',
        'test-getBookingTrends',
        'test-generateReport',
      ];
      dashboardFunctions.forEach((funcName) => {
        template.hasResourceProperties('AWS::Lambda::Function', {
          FunctionName: funcName,
        });
      });
    });

    test('creates all Admin Lambda functions', () => {
      const adminFunctions = [
        'test-listUsers',
        'test-updateUser',
        'test-deleteUser',
        'test-listAllCourts',
        'test-moderateReview',
      ];
      adminFunctions.forEach((funcName) => {
        template.hasResourceProperties('AWS::Lambda::Function', {
          FunctionName: funcName,
        });
      });
    });

    test('creates all Scheduled Lambda functions', () => {
      const scheduledFunctions = [
        'test-bookingReminder',
        'test-cleanup',
        'test-retraining',
        'test-monthlyReport',
      ];
      scheduledFunctions.forEach((funcName) => {
        template.hasResourceProperties('AWS::Lambda::Function', {
          FunctionName: funcName,
        });
      });
    });

    test('Lambda functions created by LambdaConstruct use Node.js 18.x runtime', () => {
      // Verify that at least one function from LambdaConstruct uses nodejs18.x
      template.hasResourceProperties('AWS::Lambda::Function', {
        FunctionName: 'test-register',
        Runtime: 'nodejs18.x',
      });
    });

    test('Lambda functions created by LambdaConstruct have X-Ray tracing enabled', () => {
      // Verify that functions from LambdaConstruct have tracing enabled
      template.hasResourceProperties('AWS::Lambda::Function', {
        FunctionName: 'test-register',
        TracingConfig: { Mode: 'Active' },
      });
    });

    test('functions have correct environment variables', () => {
      template.hasResourceProperties('AWS::Lambda::Function', {
        FunctionName: 'test-createCourt',
        Environment: {
          Variables: Match.objectLike({
            STAGE: 'test',
            COURTS_TABLE: 'test-courts',
            BOOKINGS_TABLE: 'test-bookings',
            REVIEWS_TABLE: 'test-reviews',
            IMAGES_BUCKET: 'test-images-bucket',
            USER_POOL_ID: 'test-user-pool-id',
          }),
        },
      });
    });
  });


  describe('IAM Permissions', () => {
    test('register function has Cognito admin permissions', () => {
      template.hasResourceProperties('AWS::IAM::Policy', {
        PolicyDocument: {
          Statement: Match.arrayWith([
            Match.objectLike({
              Action: Match.arrayWith([
                'cognito-idp:AdminCreateUser',
                'cognito-idp:AdminSetUserPassword',
                'cognito-idp:AdminAddUserToGroup',
              ]),
              Effect: 'Allow',
            }),
          ]),
        },
      });
    });

    test('createCourt function has DynamoDB PutItem permission', () => {
      template.hasResourceProperties('AWS::IAM::Policy', {
        PolicyDocument: {
          Statement: Match.arrayWith([
            Match.objectLike({
              Action: 'dynamodb:PutItem',
              Effect: 'Allow',
            }),
          ]),
        },
      });
    });

    test('uploadCourtImage function has S3 permissions', () => {
      template.hasResourceProperties('AWS::IAM::Policy', {
        PolicyDocument: {
          Statement: Match.arrayWith([
            Match.objectLike({
              Action: Match.arrayWith(['s3:PutObject', 's3:PutObjectAcl']),
              Effect: 'Allow',
            }),
          ]),
        },
      });
    });

    test('nearbyCourts function has Location Service permissions', () => {
      template.hasResourceProperties('AWS::IAM::Policy', {
        PolicyDocument: {
          Statement: Match.arrayWith([
            Match.objectLike({
              Action: Match.arrayWith([
                'geo:SearchPlaceIndexForPosition',
                'geo:SearchPlaceIndexForText',
              ]),
              Effect: 'Allow',
            }),
          ]),
        },
      });
    });

    test('createBooking function has SES permissions', () => {
      template.hasResourceProperties('AWS::IAM::Policy', {
        PolicyDocument: {
          Statement: Match.arrayWith([
            Match.objectLike({
              Action: Match.arrayWith(['ses:SendEmail', 'ses:SendTemplatedEmail']),
              Effect: 'Allow',
            }),
          ]),
        },
      });
    });

    test('generateReport function has S3 PutObject permission for reports bucket', () => {
      template.hasResourceProperties('AWS::IAM::Policy', {
        PolicyDocument: {
          Statement: Match.arrayWith([
            Match.objectLike({
              Action: 's3:PutObject',
              Effect: 'Allow',
            }),
          ]),
        },
      });
    });
  });

  describe('Event Source Mappings', () => {
    test('bookingConfirmation function has DynamoDB Stream event source', () => {
      template.hasResourceProperties('AWS::Lambda::EventSourceMapping', {
        BatchSize: 10,
        StartingPosition: 'LATEST',
        MaximumBatchingWindowInSeconds: 5,
        MaximumRetryAttempts: 2,
      });
    });

    test('aggregateRating function has DynamoDB Stream event source', () => {
      // There should be 2 event source mappings (bookings and reviews streams)
      template.resourceCountIs('AWS::Lambda::EventSourceMapping', 2);
    });

    test('event source mappings have correct batch configuration', () => {
      const mappings = template.findResources('AWS::Lambda::EventSourceMapping');
      Object.values(mappings).forEach((mapping: any) => {
        expect(mapping.Properties.BatchSize).toBe(10);
        expect(mapping.Properties.StartingPosition).toBe('LATEST');
        expect(mapping.Properties.MaximumRetryAttempts).toBe(2);
      });
    });
  });
});
