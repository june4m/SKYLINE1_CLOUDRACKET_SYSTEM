import * as cdk from 'aws-cdk-lib';
import { Construct } from 'constructs';
import { RemovalPolicy, CfnOutput, Stack } from 'aws-cdk-lib';

// Import all constructs
import { DynamoDBConstruct } from './constructs/dynamodb-construct';
import { S3Construct } from './constructs/s3-construct';
import { CognitoConstruct } from './constructs/cognito-construct';
import { SchedulerConstruct } from './constructs/scheduler-construct';
import { LocationConstruct } from './constructs/location-construct';
import { LambdaLayerConstruct } from './constructs/lambda-layer-construct';
import { LambdaConstruct } from './constructs/lambda-construct';
import { APIGatewayConstruct } from './constructs/api-gateway-construct';
import { EventBridgeConstruct } from './constructs/eventbridge-construct';
import { MonitoringConstruct } from './constructs/monitoring-construct';
import { WAFConstruct } from './constructs/waf-construct';

/**
 * Environment configuration interface loaded from CDK context
 * Requirements: 16.1, 16.2, 16.3
 */
export interface EnvironmentConfig {
  stage: string;
  removalPolicy: 'DESTROY' | 'RETAIN';
  enablePersonalize: boolean;
  lambdaMemory: number;
  lambdaTimeout: number;
  apiCacheEnabled: boolean;
  apiCacheTtl: number;
  logRetentionDays: number;
  enableTerminationProtection: boolean;
}

/**
 * Props interface for CloudRacketServerlessStack
 * Requirements: 16.4, 16.5
 */
export interface CloudRacketServerlessStackProps extends cdk.StackProps {
  stage: string;
  senderEmail: string;
  alarmEmail?: string;
}

/**
 * Main CloudRacket Serverless Stack
 * 
 * Instantiates all constructs in correct dependency order to avoid circular dependencies:
 * 1. DynamoDB Construct (no dependencies)
 * 2. S3 Construct (no dependencies)
 * 3. Cognito Construct (no dependencies)
 * 4. Scheduler Construct (no dependencies)
 * 5. Location Construct (no dependencies)
 * 6. Lambda Layer Construct (no dependencies)
 * 7. Lambda Construct (depends on: DynamoDB, S3, Cognito, Location, Lambda Layers)
 * 8. API Gateway Construct (depends on: Lambda, Cognito)
 * 9. EventBridge Construct (depends on: Lambda)
 * 10. Monitoring Construct (depends on: API Gateway, Lambda, DynamoDB)
 * 11. WAF Construct (depends on: API Gateway)
 * 
 * Requirements: 16.4, 16.5, 19.1, 19.2, 21.1-21.6
 */
export class CloudRacketServerlessStack extends cdk.Stack {
  // Expose constructs for testing and external access
  public readonly dynamoDB: DynamoDBConstruct;
  public readonly s3: S3Construct;
  public readonly cognito: CognitoConstruct;
  public readonly scheduler: SchedulerConstruct;
  public readonly location: LocationConstruct;
  public readonly lambdaLayers: LambdaLayerConstruct;
  public readonly lambda: LambdaConstruct;
  public readonly apiGateway: APIGatewayConstruct;
  public readonly eventBridge: EventBridgeConstruct;
  public readonly monitoring: MonitoringConstruct;
  public readonly waf: WAFConstruct;

  constructor(scope: Construct, id: string, props: CloudRacketServerlessStackProps) {
    super(scope, id, props);

    const { stage, senderEmail, alarmEmail } = props;

    // Load environment configuration from context
    // Requirements: 16.1, 16.2, 16.3
    const envConfig = this.loadEnvironmentConfig(stage);
    const removalPolicy = envConfig.removalPolicy === 'DESTROY' 
      ? RemovalPolicy.DESTROY 
      : RemovalPolicy.RETAIN;

    // Enable termination protection for production (Requirement 19.2)
    if (envConfig.enableTerminationProtection) {
      this.terminationProtection = true;
    }


    // ==========================================
    // 1. DYNAMODB CONSTRUCT (No dependencies)
    // Requirements: 2.1-2.8, 21.1
    // ==========================================
    this.dynamoDB = new DynamoDBConstruct(this, 'DynamoDB', {
      stage,
      removalPolicy,
    });

    // ==========================================
    // 2. S3 CONSTRUCT (No dependencies)
    // Requirements: 4.1-4.8, 21.1
    // ==========================================
    this.s3 = new S3Construct(this, 'S3', {
      stage,
      removalPolicy,
    });

    // ==========================================
    // 3. COGNITO CONSTRUCT (No dependencies)
    // Requirements: 3.1-3.8, 21.1
    // ==========================================
    this.cognito = new CognitoConstruct(this, 'Cognito', {
      stage,
    });

    // ==========================================
    // 4. SCHEDULER CONSTRUCT (No dependencies)
    // Requirements: 9.1-9.5, 21.1
    // ==========================================
    this.scheduler = new SchedulerConstruct(this, 'Scheduler', {
      stage,
    });

    // ==========================================
    // 5. LOCATION CONSTRUCT (No dependencies)
    // Requirements: 6.1-6.4, 21.1
    // ==========================================
    this.location = new LocationConstruct(this, 'Location', {
      stage,
    });

    // ==========================================
    // 6. LAMBDA LAYER CONSTRUCT (No dependencies)
    // Requirements: 15.1-15.5, 21.1
    // ==========================================
    this.lambdaLayers = new LambdaLayerConstruct(this, 'LambdaLayers', {
      stage,
    });

    // ==========================================
    // 7. LAMBDA CONSTRUCT
    // Dependencies: DynamoDB, S3, Cognito, Location, Lambda Layers
    // Pass resource references as strings to avoid circular dependencies (Requirement 21.2-21.4)
    // Requirements: 7.1-7.13, 10.1-10.5, 13.1-13.9, 15.3
    // ==========================================
    this.lambda = new LambdaConstruct(this, 'Lambda', {
      stage,
      dynamoDBTables: {
        courtsTable: this.dynamoDB.courtsTable,
        courtsTableName: this.dynamoDB.courtsTableName,
        courtsTableArn: this.dynamoDB.courtsTableArn,
        availabilityTable: this.dynamoDB.availabilityTable,
        availabilityTableName: this.dynamoDB.availabilityTableName,
        availabilityTableArn: this.dynamoDB.availabilityTableArn,
        bookingsTable: this.dynamoDB.bookingsTable,
        bookingsTableName: this.dynamoDB.bookingsTableName,
        bookingsTableArn: this.dynamoDB.bookingsTableArn,
        bookingsStreamArn: this.dynamoDB.bookingsStreamArn,
        reviewsTable: this.dynamoDB.reviewsTable,
        reviewsTableName: this.dynamoDB.reviewsTableName,
        reviewsTableArn: this.dynamoDB.reviewsTableArn,
        reviewsStreamArn: this.dynamoDB.reviewsStreamArn,
        interactionsTable: this.dynamoDB.interactionsTable,
        interactionsTableName: this.dynamoDB.interactionsTableName,
        interactionsTableArn: this.dynamoDB.interactionsTableArn,
      },
      s3Buckets: {
        imagesBucketName: this.s3.imagesBucketName,
        imagesBucketArn: this.s3.imagesBucketArn,
        reportsBucketName: this.s3.reportsBucketName,
        reportsBucketArn: this.s3.reportsBucketArn,
      },
      cognito: {
        userPoolId: this.cognito.userPoolId,
        userPoolArn: this.cognito.userPoolArn,
        userPoolClientId: this.cognito.userPoolClientId,
      },
      ses: {
        senderEmail,
        // SES email identity ARN - constructed from sender email
        emailIdentityArn: `arn:aws:ses:${Stack.of(this).region}:${Stack.of(this).account}:identity/${senderEmail}`,
      },
      location: {
        placeIndexName: this.location.placeIndexName,
        placeIndexArn: this.location.placeIndexArn,
      },
      lambdaLayers: {
        commonLayer: this.lambdaLayers.commonLayer,
        utilsLayer: this.lambdaLayers.utilsLayer,
      },
    });

    // Update Scheduler targets with actual Lambda ARNs
    // This avoids circular dependencies by using property overrides (Requirement 21.5)
    this.scheduler.updateBookingReminderTarget(this.lambda.bookingReminderFunction.functionArn);
    this.scheduler.updateDataCleanupTarget(this.lambda.cleanupFunction.functionArn);
    this.scheduler.updateMonthlyReportTarget(this.lambda.monthlyReportFunction.functionArn);

    // Grant Scheduler permission to invoke Lambda functions
    this.lambda.bookingReminderFunction.grantInvoke(this.scheduler.schedulerRole);
    this.lambda.cleanupFunction.grantInvoke(this.scheduler.schedulerRole);
    this.lambda.monthlyReportFunction.grantInvoke(this.scheduler.schedulerRole);


    // ==========================================
    // 8. API GATEWAY CONSTRUCT
    // Dependencies: Lambda, Cognito
    // Uses one-way references to avoid bidirectional dependencies (Requirement 21.5)
    // Requirements: 8.1-8.14
    // ==========================================
    this.apiGateway = new APIGatewayConstruct(this, 'APIGateway', {
      stage,
      userPoolArn: this.cognito.userPoolArn,
      lambdaFunctions: {
        // Auth Functions
        register: this.lambda.registerFunction,
        login: this.lambda.loginFunction,
        refreshToken: this.lambda.refreshTokenFunction,
        // Court Functions
        createCourt: this.lambda.createCourtFunction,
        getCourt: this.lambda.getCourtFunction,
        updateCourt: this.lambda.updateCourtFunction,
        deleteCourt: this.lambda.deleteCourtFunction,
        searchCourts: this.lambda.searchCourtsFunction,
        nearbyCourts: this.lambda.nearbyCourtsFunction,
        uploadCourtImage: this.lambda.uploadCourtImageFunction,
        getAvailability: this.lambda.getAvailabilityFunction,
        updateAvailability: this.lambda.updateAvailabilityFunction,
        // Booking Functions
        createBooking: this.lambda.createBookingFunction,
        getBooking: this.lambda.getBookingFunction,
        cancelBooking: this.lambda.cancelBookingFunction,
        listBookings: this.lambda.listBookingsFunction,
        // Review Functions
        createReview: this.lambda.createReviewFunction,
        getReviews: this.lambda.getReviewsFunction,
        // Recommendation Functions
        getRecommendations: this.lambda.getRecommendationsFunction,
        trackInteraction: this.lambda.trackInteractionFunction,
        // Dashboard Functions
        getStats: this.lambda.getStatsFunction,
        getRevenue: this.lambda.getRevenueFunction,
        getBookingTrends: this.lambda.getBookingTrendsFunction,
        // Admin Functions
        listUsers: this.lambda.listUsersFunction,
        updateUser: this.lambda.updateUserFunction,
        deleteUser: this.lambda.deleteUserFunction,
        listAllCourts: this.lambda.listAllCourtsFunction,
        moderateReview: this.lambda.moderateReviewFunction,
      },
    });

    // ==========================================
    // 9. EVENTBRIDGE CONSTRUCT
    // Dependencies: Lambda
    // Requirements: 9.1-9.5
    // ==========================================
    this.eventBridge = new EventBridgeConstruct(this, 'EventBridge', {
      stage,
      lambdaFunctions: {
        bookingReminder: this.lambda.bookingReminderFunction,
        cleanup: this.lambda.cleanupFunction,
        retraining: envConfig.enablePersonalize ? this.lambda.retrainingFunction : undefined,
        monthlyReport: this.lambda.monthlyReportFunction,
      },
    });

    // ==========================================
    // 10. MONITORING CONSTRUCT
    // Dependencies: API Gateway, Lambda, DynamoDB
    // Requirements: 11.1-11.8
    // ==========================================
    this.monitoring = new MonitoringConstruct(this, 'Monitoring', {
      stage,
      apiGateway: {
        apiId: this.apiGateway.apiId,
        apiName: `${stage}-cloud-racket-api`,
        stageName: stage,
      },
      lambdaFunctions: [
        // Auth Functions
        this.lambda.registerFunction,
        this.lambda.loginFunction,
        this.lambda.refreshTokenFunction,
        // Court Functions
        this.lambda.createCourtFunction,
        this.lambda.getCourtFunction,
        this.lambda.updateCourtFunction,
        this.lambda.deleteCourtFunction,
        this.lambda.searchCourtsFunction,
        this.lambda.nearbyCourtsFunction,
        this.lambda.uploadCourtImageFunction,
        this.lambda.getAvailabilityFunction,
        this.lambda.updateAvailabilityFunction,
        // Booking Functions
        this.lambda.createBookingFunction,
        this.lambda.getBookingFunction,
        this.lambda.cancelBookingFunction,
        this.lambda.listBookingsFunction,
        this.lambda.bookingConfirmationFunction,
        // Review Functions
        this.lambda.createReviewFunction,
        this.lambda.getReviewsFunction,
        this.lambda.aggregateRatingFunction,
        // Recommendation Functions
        this.lambda.getRecommendationsFunction,
        this.lambda.trackInteractionFunction,
        // Dashboard Functions
        this.lambda.getStatsFunction,
        this.lambda.getRevenueFunction,
        this.lambda.getBookingTrendsFunction,
        this.lambda.generateReportFunction,
        // Admin Functions
        this.lambda.listUsersFunction,
        this.lambda.updateUserFunction,
        this.lambda.deleteUserFunction,
        this.lambda.listAllCourtsFunction,
        this.lambda.moderateReviewFunction,
        // Scheduled Functions
        this.lambda.bookingReminderFunction,
        this.lambda.cleanupFunction,
        this.lambda.retrainingFunction,
        this.lambda.monthlyReportFunction,
      ],
      dynamoDBTables: {
        courtsTableName: this.dynamoDB.courtsTableName,
        availabilityTableName: this.dynamoDB.availabilityTableName,
        bookingsTableName: this.dynamoDB.bookingsTableName,
        reviewsTableName: this.dynamoDB.reviewsTableName,
        interactionsTableName: this.dynamoDB.interactionsTableName,
      },
      alarmEmail,
    });


    // ==========================================
    // 11. WAF CONSTRUCT
    // Dependencies: API Gateway
    // Requirements: 12.1-12.7
    // ==========================================
    this.waf = new WAFConstruct(this, 'WAF', {
      stage,
      apiGatewayArn: this.apiGateway.api.deploymentStage.stageArn,
    });

    // ==========================================
    // CLOUDFORMATION OUTPUTS (Requirement 20.1-20.5, 19.3)
    // ==========================================
    this.createOutputs(stage);
  }

  /**
   * Load environment configuration from CDK context
   * Requirements: 16.1, 16.2, 16.3
   */
  private loadEnvironmentConfig(stage: string): EnvironmentConfig {
    const environments = this.node.tryGetContext('environments') as Record<string, EnvironmentConfig>;
    
    if (!environments || !environments[stage]) {
      // Return default dev configuration if not found
      return {
        stage,
        removalPolicy: 'DESTROY',
        enablePersonalize: false,
        lambdaMemory: 256,
        lambdaTimeout: 30,
        apiCacheEnabled: false,
        apiCacheTtl: 60,
        logRetentionDays: 14,
        enableTerminationProtection: false,
      };
    }

    return environments[stage];
  }

  /**
   * Create CloudFormation outputs for important resource identifiers
   * Requirements: 20.1-20.5, 19.3
   */
  private createOutputs(stage: string): void {
    // Output API Gateway URL (Requirement 20.1)
    new CfnOutput(this, 'ApiGatewayUrl', {
      value: this.apiGateway.apiUrl,
      description: 'API Gateway URL for frontend integration',
      exportName: `${stage}-api-gateway-url`,
    });

    // Output API Gateway ID
    new CfnOutput(this, 'ApiGatewayId', {
      value: this.apiGateway.apiId,
      description: 'API Gateway REST API ID',
      exportName: `${stage}-api-gateway-id`,
    });

    // Output Cognito User Pool ID (Requirement 20.2)
    new CfnOutput(this, 'CognitoUserPoolId', {
      value: this.cognito.userPoolId,
      description: 'Cognito User Pool ID for authentication',
      exportName: `${stage}-cognito-user-pool-id`,
    });

    // Output Cognito App Client ID (Requirement 20.2)
    new CfnOutput(this, 'CognitoAppClientId', {
      value: this.cognito.userPoolClientId,
      description: 'Cognito App Client ID for authentication',
      exportName: `${stage}-cognito-app-client-id`,
    });

    // Output S3 Images Bucket Name (Requirement 20.3)
    new CfnOutput(this, 'ImagesBucketName', {
      value: this.s3.imagesBucketName,
      description: 'S3 bucket name for court images',
      exportName: `${stage}-images-bucket-name`,
    });

    // Output S3 Reports Bucket Name (Requirement 20.3)
    new CfnOutput(this, 'ReportsBucketName', {
      value: this.s3.reportsBucketName,
      description: 'S3 bucket name for reports',
      exportName: `${stage}-reports-bucket-name`,
    });

    // Output CloudWatch Dashboard URL (Requirement 20.4)
    new CfnOutput(this, 'CloudWatchDashboardUrl', {
      value: this.monitoring.dashboardUrl,
      description: 'CloudWatch Dashboard URL for monitoring',
      exportName: `${stage}-cloudwatch-dashboard-url`,
    });

    // Output CloudFormation Stack Name (Requirement 19.3)
    new CfnOutput(this, 'StackName', {
      value: this.stackName,
      description: 'CloudFormation stack name',
      exportName: `${stage}-stack-name`,
    });

    // Output DynamoDB Table Names
    new CfnOutput(this, 'CourtsTableName', {
      value: this.dynamoDB.courtsTableName,
      description: 'DynamoDB Courts table name',
      exportName: `${stage}-courts-table-name`,
    });

    new CfnOutput(this, 'BookingsTableName', {
      value: this.dynamoDB.bookingsTableName,
      description: 'DynamoDB Bookings table name',
      exportName: `${stage}-bookings-table-name`,
    });

    // Note: WAF Web ACL ARN output is already defined in WAFConstruct

    // Output Location Service Place Index Name
    new CfnOutput(this, 'PlaceIndexName', {
      value: this.location.placeIndexName,
      description: 'Amazon Location Service Place Index name',
      exportName: `${stage}-place-index-name`,
    });
  }
}
