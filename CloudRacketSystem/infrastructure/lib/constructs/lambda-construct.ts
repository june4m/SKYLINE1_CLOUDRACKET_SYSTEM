import { Construct } from 'constructs';
import {
  Function,
  Runtime,
  Code,
  Tracing,
  LayerVersion,
  StartingPosition,
} from 'aws-cdk-lib/aws-lambda';
import { DynamoEventSource } from 'aws-cdk-lib/aws-lambda-event-sources';
import { Table } from 'aws-cdk-lib/aws-dynamodb';
import { PolicyStatement, Effect } from 'aws-cdk-lib/aws-iam';
import { Duration } from 'aws-cdk-lib';
import { RetentionDays } from 'aws-cdk-lib/aws-logs';
import * as path from 'path';

/**
 * Props interface for Lambda Construct
 * Contains all resource references needed by Lambda functions
 * Requirements: 7.1-7.13, 10.1-10.5, 13.1-13.9, 15.3
 */
export interface LambdaConstructProps {
  stage: string;
  dynamoDBTables: {
    courtsTable: Table;
    courtsTableName: string;
    courtsTableArn: string;
    availabilityTable: Table;
    availabilityTableName: string;
    availabilityTableArn: string;
    bookingsTable: Table;
    bookingsTableName: string;
    bookingsTableArn: string;
    bookingsStreamArn: string;
    reviewsTable: Table;
    reviewsTableName: string;
    reviewsTableArn: string;
    reviewsStreamArn: string;
    interactionsTable: Table;
    interactionsTableName: string;
    interactionsTableArn: string;
  };
  s3Buckets: {
    imagesBucketName: string;
    imagesBucketArn: string;
    reportsBucketName: string;
    reportsBucketArn: string;
  };
  cognito: {
    userPoolId: string;
    userPoolArn: string;
    userPoolClientId: string;
  };
  ses: {
    senderEmail: string;
    emailIdentityArn: string;
  };
  location: {
    placeIndexName: string;
    placeIndexArn: string;
  };
  lambdaLayers: {
    commonLayer: LayerVersion;
    utilsLayer: LayerVersion;
  };
}

/**
 * Lambda Functions Construct
 * Creates all Lambda functions for the Cloud Racket Platform microservices.
 * 
 * Requirements: 7.1-7.13, 10.1-10.5, 13.1-13.9, 15.3
 */
export class LambdaConstruct extends Construct {
  // Auth Functions
  public readonly registerFunction: Function;
  public readonly loginFunction: Function;
  public readonly refreshTokenFunction: Function;

  // Court Functions
  public readonly createCourtFunction: Function;
  public readonly getCourtFunction: Function;
  public readonly updateCourtFunction: Function;
  public readonly deleteCourtFunction: Function;
  public readonly searchCourtsFunction: Function;
  public readonly nearbyCourtsFunction: Function;
  public readonly uploadCourtImageFunction: Function;
  public readonly getAvailabilityFunction: Function;
  public readonly updateAvailabilityFunction: Function;

  // Booking Functions
  public readonly createBookingFunction: Function;
  public readonly getBookingFunction: Function;
  public readonly cancelBookingFunction: Function;
  public readonly listBookingsFunction: Function;
  public readonly bookingConfirmationFunction: Function;

  // Review Functions
  public readonly createReviewFunction: Function;
  public readonly getReviewsFunction: Function;
  public readonly aggregateRatingFunction: Function;

  // Recommendation Functions
  public readonly getRecommendationsFunction: Function;
  public readonly trackInteractionFunction: Function;

  // Dashboard Functions
  public readonly getStatsFunction: Function;
  public readonly getRevenueFunction: Function;
  public readonly getBookingTrendsFunction: Function;
  public readonly generateReportFunction: Function;

  // Admin Functions
  public readonly listUsersFunction: Function;
  public readonly updateUserFunction: Function;
  public readonly deleteUserFunction: Function;
  public readonly listAllCourtsFunction: Function;
  public readonly moderateReviewFunction: Function;

  // Scheduled Functions
  public readonly bookingReminderFunction: Function;
  public readonly cleanupFunction: Function;
  public readonly retrainingFunction: Function;
  public readonly monthlyReportFunction: Function;

  constructor(scope: Construct, id: string, props: LambdaConstructProps) {
    super(scope, id);

    const { stage, dynamoDBTables, s3Buckets, cognito, ses, location, lambdaLayers } = props;

    // Common environment variables for all Lambda functions
    const commonEnv = {
      STAGE: stage,
      COURTS_TABLE: dynamoDBTables.courtsTableName,
      AVAILABILITY_TABLE: dynamoDBTables.availabilityTableName,
      BOOKINGS_TABLE: dynamoDBTables.bookingsTableName,
      REVIEWS_TABLE: dynamoDBTables.reviewsTableName,
      INTERACTIONS_TABLE: dynamoDBTables.interactionsTableName,
      IMAGES_BUCKET: s3Buckets.imagesBucketName,
      REPORTS_BUCKET: s3Buckets.reportsBucketName,
      USER_POOL_ID: cognito.userPoolId,
      USER_POOL_CLIENT_ID: cognito.userPoolClientId,
      SENDER_EMAIL: ses.senderEmail,
      PLACE_INDEX_NAME: location.placeIndexName,
    };

    // Helper function to create Lambda functions with common settings
    const createLambdaFunction = (
      functionId: string,
      handlerPath: string,
      description: string,
      memorySize: number = 256,
      timeout: number = 30,
      additionalEnv: Record<string, string> = {}
    ): Function => {
      return new Function(this, functionId, {
        functionName: `${stage}-${functionId}`,
        runtime: Runtime.NODEJS_18_X,
        handler: 'index.handler',
        code: Code.fromAsset(path.join(__dirname, `../../lambda/${handlerPath}`)),
        memorySize,
        timeout: Duration.seconds(timeout),
        layers: [lambdaLayers.commonLayer, lambdaLayers.utilsLayer],
        environment: {
          ...commonEnv,
          ...additionalEnv,
        },
        tracing: Tracing.ACTIVE,
        logRetention: RetentionDays.ONE_MONTH,
        description,
      });
    };


    // ==========================================
    // AUTH FUNCTIONS (Requirements: 7.1, 13.5)
    // ==========================================

    this.registerFunction = createLambdaFunction(
      'register',
      'auth/register',
      'User registration handler'
    );
    this.registerFunction.addToRolePolicy(new PolicyStatement({
      effect: Effect.ALLOW,
      actions: [
        'cognito-idp:AdminCreateUser',
        'cognito-idp:AdminSetUserPassword',
        'cognito-idp:AdminAddUserToGroup',
        'cognito-idp:AdminUpdateUserAttributes',
      ],
      resources: [cognito.userPoolArn],
    }));

    this.loginFunction = createLambdaFunction(
      'login',
      'auth/login',
      'User login handler'
    );
    this.loginFunction.addToRolePolicy(new PolicyStatement({
      effect: Effect.ALLOW,
      actions: ['cognito-idp:AdminInitiateAuth', 'cognito-idp:AdminGetUser'],
      resources: [cognito.userPoolArn],
    }));

    this.refreshTokenFunction = createLambdaFunction(
      'refreshToken',
      'auth/refreshToken',
      'Token refresh handler'
    );
    this.refreshTokenFunction.addToRolePolicy(new PolicyStatement({
      effect: Effect.ALLOW,
      actions: ['cognito-idp:AdminInitiateAuth'],
      resources: [cognito.userPoolArn],
    }));

    // ==========================================
    // COURT FUNCTIONS (Requirements: 7.2, 13.2, 13.3, 13.6)
    // ==========================================

    this.createCourtFunction = createLambdaFunction(
      'createCourt',
      'court/createCourt',
      'Create new court handler'
    );
    this.createCourtFunction.addToRolePolicy(new PolicyStatement({
      effect: Effect.ALLOW,
      actions: ['dynamodb:PutItem'],
      resources: [dynamoDBTables.courtsTableArn],
    }));

    this.getCourtFunction = createLambdaFunction(
      'getCourt',
      'court/getCourt',
      'Get court details handler'
    );
    this.getCourtFunction.addToRolePolicy(new PolicyStatement({
      effect: Effect.ALLOW,
      actions: ['dynamodb:GetItem'],
      resources: [dynamoDBTables.courtsTableArn],
    }));

    this.updateCourtFunction = createLambdaFunction(
      'updateCourt',
      'court/updateCourt',
      'Update court handler'
    );
    this.updateCourtFunction.addToRolePolicy(new PolicyStatement({
      effect: Effect.ALLOW,
      actions: ['dynamodb:UpdateItem', 'dynamodb:GetItem'],
      resources: [dynamoDBTables.courtsTableArn],
    }));

    this.deleteCourtFunction = createLambdaFunction(
      'deleteCourt',
      'court/deleteCourt',
      'Delete court handler'
    );
    this.deleteCourtFunction.addToRolePolicy(new PolicyStatement({
      effect: Effect.ALLOW,
      actions: ['dynamodb:DeleteItem', 'dynamodb:GetItem'],
      resources: [dynamoDBTables.courtsTableArn],
    }));

    this.searchCourtsFunction = createLambdaFunction(
      'searchCourts',
      'court/searchCourts',
      'Search courts handler'
    );
    this.searchCourtsFunction.addToRolePolicy(new PolicyStatement({
      effect: Effect.ALLOW,
      actions: ['dynamodb:Scan', 'dynamodb:Query'],
      resources: [dynamoDBTables.courtsTableArn, `${dynamoDBTables.courtsTableArn}/index/*`],
    }));

    this.nearbyCourtsFunction = createLambdaFunction(
      'nearbyCourts',
      'court/nearbyCourts',
      'Find nearby courts handler'
    );
    this.nearbyCourtsFunction.addToRolePolicy(new PolicyStatement({
      effect: Effect.ALLOW,
      actions: ['dynamodb:Scan', 'dynamodb:Query'],
      resources: [dynamoDBTables.courtsTableArn, `${dynamoDBTables.courtsTableArn}/index/*`],
    }));
    this.nearbyCourtsFunction.addToRolePolicy(new PolicyStatement({
      effect: Effect.ALLOW,
      actions: ['geo:SearchPlaceIndexForPosition', 'geo:SearchPlaceIndexForText'],
      resources: [location.placeIndexArn],
    }));

    this.uploadCourtImageFunction = createLambdaFunction(
      'uploadCourtImage',
      'court/uploadCourtImage',
      'Upload court image handler',
      512
    );
    this.uploadCourtImageFunction.addToRolePolicy(new PolicyStatement({
      effect: Effect.ALLOW,
      actions: ['s3:PutObject', 's3:PutObjectAcl'],
      resources: [`${s3Buckets.imagesBucketArn}/*`],
    }));
    this.uploadCourtImageFunction.addToRolePolicy(new PolicyStatement({
      effect: Effect.ALLOW,
      actions: ['dynamodb:UpdateItem'],
      resources: [dynamoDBTables.courtsTableArn],
    }));

    this.getAvailabilityFunction = createLambdaFunction(
      'getAvailability',
      'court/getAvailability',
      'Get court availability handler'
    );
    this.getAvailabilityFunction.addToRolePolicy(new PolicyStatement({
      effect: Effect.ALLOW,
      actions: ['dynamodb:Query'],
      resources: [dynamoDBTables.availabilityTableArn, `${dynamoDBTables.availabilityTableArn}/index/*`],
    }));

    this.updateAvailabilityFunction = createLambdaFunction(
      'updateAvailability',
      'court/updateAvailability',
      'Update court availability handler'
    );
    this.updateAvailabilityFunction.addToRolePolicy(new PolicyStatement({
      effect: Effect.ALLOW,
      actions: ['dynamodb:PutItem', 'dynamodb:UpdateItem', 'dynamodb:DeleteItem', 'dynamodb:Query'],
      resources: [dynamoDBTables.availabilityTableArn, `${dynamoDBTables.availabilityTableArn}/index/*`],
    }));


    // ==========================================
    // BOOKING FUNCTIONS (Requirements: 7.3, 10.1-10.5, 13.2, 13.4)
    // ==========================================

    this.createBookingFunction = createLambdaFunction(
      'createBooking',
      'booking/createBooking',
      'Create booking handler'
    );
    this.createBookingFunction.addToRolePolicy(new PolicyStatement({
      effect: Effect.ALLOW,
      actions: ['dynamodb:PutItem', 'dynamodb:GetItem', 'dynamodb:UpdateItem', 'dynamodb:Query'],
      resources: [
        dynamoDBTables.bookingsTableArn,
        dynamoDBTables.availabilityTableArn,
        dynamoDBTables.courtsTableArn,
        `${dynamoDBTables.bookingsTableArn}/index/*`,
        `${dynamoDBTables.availabilityTableArn}/index/*`,
      ],
    }));
    this.createBookingFunction.addToRolePolicy(new PolicyStatement({
      effect: Effect.ALLOW,
      actions: ['ses:SendEmail', 'ses:SendTemplatedEmail'],
      resources: [ses.emailIdentityArn, 'arn:aws:ses:*:*:identity/*'],
    }));

    this.getBookingFunction = createLambdaFunction(
      'getBooking',
      'booking/getBooking',
      'Get booking details handler'
    );
    this.getBookingFunction.addToRolePolicy(new PolicyStatement({
      effect: Effect.ALLOW,
      actions: ['dynamodb:GetItem', 'dynamodb:Query'],
      resources: [
        dynamoDBTables.bookingsTableArn,
        dynamoDBTables.courtsTableArn,
        `${dynamoDBTables.bookingsTableArn}/index/*`,
      ],
    }));

    this.cancelBookingFunction = createLambdaFunction(
      'cancelBooking',
      'booking/cancelBooking',
      'Cancel booking handler'
    );
    this.cancelBookingFunction.addToRolePolicy(new PolicyStatement({
      effect: Effect.ALLOW,
      actions: ['dynamodb:UpdateItem', 'dynamodb:GetItem'],
      resources: [dynamoDBTables.bookingsTableArn, dynamoDBTables.availabilityTableArn],
    }));
    this.cancelBookingFunction.addToRolePolicy(new PolicyStatement({
      effect: Effect.ALLOW,
      actions: ['ses:SendEmail', 'ses:SendTemplatedEmail'],
      resources: [ses.emailIdentityArn, 'arn:aws:ses:*:*:identity/*'],
    }));

    this.listBookingsFunction = createLambdaFunction(
      'listBookings',
      'booking/listBookings',
      'List user bookings handler'
    );
    this.listBookingsFunction.addToRolePolicy(new PolicyStatement({
      effect: Effect.ALLOW,
      actions: ['dynamodb:Query'],
      resources: [dynamoDBTables.bookingsTableArn, `${dynamoDBTables.bookingsTableArn}/index/*`],
    }));

    this.bookingConfirmationFunction = createLambdaFunction(
      'bookingConfirmation',
      'booking/bookingConfirmation',
      'Booking confirmation email handler (Stream trigger)'
    );
    this.bookingConfirmationFunction.addToRolePolicy(new PolicyStatement({
      effect: Effect.ALLOW,
      actions: ['dynamodb:GetItem'],
      resources: [dynamoDBTables.courtsTableArn],
    }));
    this.bookingConfirmationFunction.addToRolePolicy(new PolicyStatement({
      effect: Effect.ALLOW,
      actions: ['ses:SendEmail', 'ses:SendTemplatedEmail'],
      resources: [ses.emailIdentityArn, 'arn:aws:ses:*:*:identity/*'],
    }));
    this.bookingConfirmationFunction.addToRolePolicy(new PolicyStatement({
      effect: Effect.ALLOW,
      actions: ['dynamodb:GetRecords', 'dynamodb:GetShardIterator', 'dynamodb:DescribeStream', 'dynamodb:ListStreams'],
      resources: [dynamoDBTables.bookingsStreamArn],
    }));

    // Add DynamoDB Stream event source for booking confirmation
    this.bookingConfirmationFunction.addEventSource(
      new DynamoEventSource(dynamoDBTables.bookingsTable, {
        startingPosition: StartingPosition.LATEST,
        batchSize: 10,
        maxBatchingWindow: Duration.seconds(5),
        retryAttempts: 2,
      })
    );

    // ==========================================
    // REVIEW FUNCTIONS (Requirements: 7.4, 10.2, 13.2)
    // ==========================================

    this.createReviewFunction = createLambdaFunction(
      'createReview',
      'review/createReview',
      'Create review handler'
    );
    this.createReviewFunction.addToRolePolicy(new PolicyStatement({
      effect: Effect.ALLOW,
      actions: ['dynamodb:PutItem', 'dynamodb:Query'],
      resources: [
        dynamoDBTables.reviewsTableArn,
        dynamoDBTables.bookingsTableArn,
        `${dynamoDBTables.reviewsTableArn}/index/*`,
        `${dynamoDBTables.bookingsTableArn}/index/*`,
      ],
    }));

    this.getReviewsFunction = createLambdaFunction(
      'getReviews',
      'review/getReviews',
      'Get reviews handler'
    );
    this.getReviewsFunction.addToRolePolicy(new PolicyStatement({
      effect: Effect.ALLOW,
      actions: ['dynamodb:Query'],
      resources: [dynamoDBTables.reviewsTableArn, `${dynamoDBTables.reviewsTableArn}/index/*`],
    }));

    this.aggregateRatingFunction = createLambdaFunction(
      'aggregateRating',
      'review/aggregateRating',
      'Aggregate court rating handler (Stream trigger)'
    );
    this.aggregateRatingFunction.addToRolePolicy(new PolicyStatement({
      effect: Effect.ALLOW,
      actions: ['dynamodb:UpdateItem', 'dynamodb:Query'],
      resources: [
        dynamoDBTables.courtsTableArn,
        dynamoDBTables.reviewsTableArn,
        `${dynamoDBTables.reviewsTableArn}/index/*`,
      ],
    }));
    this.aggregateRatingFunction.addToRolePolicy(new PolicyStatement({
      effect: Effect.ALLOW,
      actions: ['dynamodb:GetRecords', 'dynamodb:GetShardIterator', 'dynamodb:DescribeStream', 'dynamodb:ListStreams'],
      resources: [dynamoDBTables.reviewsStreamArn],
    }));

    // Add DynamoDB Stream event source for rating aggregation
    this.aggregateRatingFunction.addEventSource(
      new DynamoEventSource(dynamoDBTables.reviewsTable, {
        startingPosition: StartingPosition.LATEST,
        batchSize: 10,
        maxBatchingWindow: Duration.seconds(5),
        retryAttempts: 2,
      })
    );


    // ==========================================
    // RECOMMENDATION FUNCTIONS (Requirements: 7.5, 13.2)
    // ==========================================

    this.getRecommendationsFunction = createLambdaFunction(
      'getRecommendations',
      'recommendation/getRecommendations',
      'Get personalized recommendations handler'
    );
    this.getRecommendationsFunction.addToRolePolicy(new PolicyStatement({
      effect: Effect.ALLOW,
      actions: ['dynamodb:Query', 'dynamodb:Scan'],
      resources: [
        dynamoDBTables.interactionsTableArn,
        dynamoDBTables.courtsTableArn,
        dynamoDBTables.bookingsTableArn,
        `${dynamoDBTables.interactionsTableArn}/index/*`,
        `${dynamoDBTables.courtsTableArn}/index/*`,
        `${dynamoDBTables.bookingsTableArn}/index/*`,
      ],
    }));

    this.trackInteractionFunction = createLambdaFunction(
      'trackInteraction',
      'recommendation/trackInteraction',
      'Track user interaction handler'
    );
    this.trackInteractionFunction.addToRolePolicy(new PolicyStatement({
      effect: Effect.ALLOW,
      actions: ['dynamodb:PutItem'],
      resources: [dynamoDBTables.interactionsTableArn],
    }));

    // ==========================================
    // DASHBOARD FUNCTIONS (Requirements: 7.6, 13.2, 13.3)
    // ==========================================

    this.getStatsFunction = createLambdaFunction(
      'getStats',
      'dashboard/getStats',
      'Get dashboard statistics handler'
    );
    this.getStatsFunction.addToRolePolicy(new PolicyStatement({
      effect: Effect.ALLOW,
      actions: ['dynamodb:Query', 'dynamodb:Scan'],
      resources: [
        dynamoDBTables.courtsTableArn,
        dynamoDBTables.bookingsTableArn,
        dynamoDBTables.reviewsTableArn,
        `${dynamoDBTables.courtsTableArn}/index/*`,
        `${dynamoDBTables.bookingsTableArn}/index/*`,
        `${dynamoDBTables.reviewsTableArn}/index/*`,
      ],
    }));

    this.getRevenueFunction = createLambdaFunction(
      'getRevenue',
      'dashboard/getRevenue',
      'Get revenue analytics handler'
    );
    this.getRevenueFunction.addToRolePolicy(new PolicyStatement({
      effect: Effect.ALLOW,
      actions: ['dynamodb:Query'],
      resources: [dynamoDBTables.bookingsTableArn, `${dynamoDBTables.bookingsTableArn}/index/*`],
    }));

    this.getBookingTrendsFunction = createLambdaFunction(
      'getBookingTrends',
      'dashboard/getBookingTrends',
      'Get booking trends handler'
    );
    this.getBookingTrendsFunction.addToRolePolicy(new PolicyStatement({
      effect: Effect.ALLOW,
      actions: ['dynamodb:Query'],
      resources: [dynamoDBTables.bookingsTableArn, `${dynamoDBTables.bookingsTableArn}/index/*`],
    }));

    this.generateReportFunction = createLambdaFunction(
      'generateReport',
      'dashboard/generateReport',
      'Generate analytics report handler',
      512,
      60
    );
    this.generateReportFunction.addToRolePolicy(new PolicyStatement({
      effect: Effect.ALLOW,
      actions: ['dynamodb:Query', 'dynamodb:Scan'],
      resources: [
        dynamoDBTables.courtsTableArn,
        dynamoDBTables.bookingsTableArn,
        dynamoDBTables.reviewsTableArn,
        `${dynamoDBTables.courtsTableArn}/index/*`,
        `${dynamoDBTables.bookingsTableArn}/index/*`,
        `${dynamoDBTables.reviewsTableArn}/index/*`,
      ],
    }));
    this.generateReportFunction.addToRolePolicy(new PolicyStatement({
      effect: Effect.ALLOW,
      actions: ['s3:PutObject'],
      resources: [`${s3Buckets.reportsBucketArn}/*`],
    }));

    // ==========================================
    // ADMIN FUNCTIONS (Requirements: 7.7, 13.2, 13.5)
    // ==========================================

    this.listUsersFunction = createLambdaFunction(
      'listUsers',
      'admin/listUsers',
      'List all users handler (Admin)'
    );
    this.listUsersFunction.addToRolePolicy(new PolicyStatement({
      effect: Effect.ALLOW,
      actions: ['cognito-idp:ListUsers', 'cognito-idp:AdminListGroupsForUser'],
      resources: [cognito.userPoolArn],
    }));

    this.updateUserFunction = createLambdaFunction(
      'updateUser',
      'admin/updateUser',
      'Update user handler (Admin)'
    );
    this.updateUserFunction.addToRolePolicy(new PolicyStatement({
      effect: Effect.ALLOW,
      actions: [
        'cognito-idp:AdminUpdateUserAttributes',
        'cognito-idp:AdminAddUserToGroup',
        'cognito-idp:AdminRemoveUserFromGroup',
        'cognito-idp:AdminEnableUser',
        'cognito-idp:AdminDisableUser',
      ],
      resources: [cognito.userPoolArn],
    }));

    this.deleteUserFunction = createLambdaFunction(
      'deleteUser',
      'admin/deleteUser',
      'Delete user handler (Admin)'
    );
    this.deleteUserFunction.addToRolePolicy(new PolicyStatement({
      effect: Effect.ALLOW,
      actions: ['cognito-idp:AdminDeleteUser'],
      resources: [cognito.userPoolArn],
    }));

    this.listAllCourtsFunction = createLambdaFunction(
      'listAllCourts',
      'admin/listAllCourts',
      'List all courts handler (Admin)'
    );
    this.listAllCourtsFunction.addToRolePolicy(new PolicyStatement({
      effect: Effect.ALLOW,
      actions: ['dynamodb:Scan', 'dynamodb:Query'],
      resources: [dynamoDBTables.courtsTableArn, `${dynamoDBTables.courtsTableArn}/index/*`],
    }));

    this.moderateReviewFunction = createLambdaFunction(
      'moderateReview',
      'admin/moderateReview',
      'Moderate review handler (Admin)'
    );
    this.moderateReviewFunction.addToRolePolicy(new PolicyStatement({
      effect: Effect.ALLOW,
      actions: ['dynamodb:UpdateItem', 'dynamodb:DeleteItem', 'dynamodb:GetItem'],
      resources: [dynamoDBTables.reviewsTableArn],
    }));


    // ==========================================
    // SCHEDULED FUNCTIONS (Requirements: 7.8-7.13, 10.3-10.5)
    // ==========================================

    this.bookingReminderFunction = createLambdaFunction(
      'bookingReminder',
      'scheduled/bookingReminder',
      'Send booking reminder emails (Scheduled)'
    );
    this.bookingReminderFunction.addToRolePolicy(new PolicyStatement({
      effect: Effect.ALLOW,
      actions: ['dynamodb:Query', 'dynamodb:Scan'],
      resources: [
        dynamoDBTables.bookingsTableArn,
        dynamoDBTables.courtsTableArn,
        `${dynamoDBTables.bookingsTableArn}/index/*`,
      ],
    }));
    this.bookingReminderFunction.addToRolePolicy(new PolicyStatement({
      effect: Effect.ALLOW,
      actions: ['ses:SendEmail', 'ses:SendTemplatedEmail'],
      resources: [ses.emailIdentityArn, 'arn:aws:ses:*:*:identity/*'],
    }));
    this.bookingReminderFunction.addToRolePolicy(new PolicyStatement({
      effect: Effect.ALLOW,
      actions: ['cognito-idp:AdminGetUser'],
      resources: [cognito.userPoolArn],
    }));

    this.cleanupFunction = createLambdaFunction(
      'cleanup',
      'scheduled/cleanup',
      'Clean up expired bookings and old data (Scheduled)',
      512,
      300
    );
    this.cleanupFunction.addToRolePolicy(new PolicyStatement({
      effect: Effect.ALLOW,
      actions: ['dynamodb:Query', 'dynamodb:Scan', 'dynamodb:DeleteItem', 'dynamodb:UpdateItem'],
      resources: [
        dynamoDBTables.bookingsTableArn,
        dynamoDBTables.availabilityTableArn,
        dynamoDBTables.interactionsTableArn,
        `${dynamoDBTables.bookingsTableArn}/index/*`,
        `${dynamoDBTables.availabilityTableArn}/index/*`,
        `${dynamoDBTables.interactionsTableArn}/index/*`,
      ],
    }));

    this.retrainingFunction = createLambdaFunction(
      'retraining',
      'scheduled/retraining',
      'Retrain recommendation model (Scheduled)',
      512,
      300
    );
    this.retrainingFunction.addToRolePolicy(new PolicyStatement({
      effect: Effect.ALLOW,
      actions: ['dynamodb:Query', 'dynamodb:Scan'],
      resources: [
        dynamoDBTables.interactionsTableArn,
        dynamoDBTables.bookingsTableArn,
        `${dynamoDBTables.interactionsTableArn}/index/*`,
        `${dynamoDBTables.bookingsTableArn}/index/*`,
      ],
    }));

    this.monthlyReportFunction = createLambdaFunction(
      'monthlyReport',
      'scheduled/monthlyReport',
      'Generate monthly analytics report (Scheduled)',
      512,
      300
    );
    this.monthlyReportFunction.addToRolePolicy(new PolicyStatement({
      effect: Effect.ALLOW,
      actions: ['dynamodb:Query', 'dynamodb:Scan'],
      resources: [
        dynamoDBTables.courtsTableArn,
        dynamoDBTables.bookingsTableArn,
        dynamoDBTables.reviewsTableArn,
        `${dynamoDBTables.courtsTableArn}/index/*`,
        `${dynamoDBTables.bookingsTableArn}/index/*`,
        `${dynamoDBTables.reviewsTableArn}/index/*`,
      ],
    }));
    this.monthlyReportFunction.addToRolePolicy(new PolicyStatement({
      effect: Effect.ALLOW,
      actions: ['s3:PutObject'],
      resources: [`${s3Buckets.reportsBucketArn}/*`],
    }));
    this.monthlyReportFunction.addToRolePolicy(new PolicyStatement({
      effect: Effect.ALLOW,
      actions: ['ses:SendEmail', 'ses:SendTemplatedEmail'],
      resources: [ses.emailIdentityArn, 'arn:aws:ses:*:*:identity/*'],
    }));
  }
}
