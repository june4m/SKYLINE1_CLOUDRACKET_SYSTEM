import { Construct } from 'constructs';
import {
  RestApi,
  LambdaIntegration,
  AuthorizationType,
  CognitoUserPoolsAuthorizer,
  Cors,
  MethodLoggingLevel,
  LogGroupLogDestination,
  AccessLogFormat,
} from 'aws-cdk-lib/aws-apigateway';
import { Function } from 'aws-cdk-lib/aws-lambda';
import { UserPool } from 'aws-cdk-lib/aws-cognito';
import { LogGroup, RetentionDays } from 'aws-cdk-lib/aws-logs';
import { Duration } from 'aws-cdk-lib';

/**
 * Lambda functions interface for API Gateway integrations
 * Requirements: 8.1-8.14
 */
export interface LambdaFunctionsProps {
  // Auth Functions
  register: Function;
  login: Function;
  refreshToken: Function;
  // Court Functions
  createCourt: Function;
  getCourt: Function;
  updateCourt: Function;
  deleteCourt: Function;
  searchCourts: Function;
  nearbyCourts: Function;
  uploadCourtImage: Function;
  getAvailability: Function;
  updateAvailability: Function;
  // Booking Functions
  createBooking: Function;
  getBooking: Function;
  cancelBooking: Function;
  listBookings: Function;
  // Review Functions
  createReview: Function;
  getReviews: Function;
  // Recommendation Functions
  getRecommendations: Function;
  trackInteraction: Function;
  // Dashboard Functions
  getStats: Function;
  getRevenue: Function;
  getBookingTrends: Function;
  // Admin Functions
  listUsers: Function;
  updateUser: Function;
  deleteUser: Function;
  listAllCourts: Function;
  moderateReview: Function;
}

/**
 * Props interface for API Gateway Construct
 * Requirements: 8.1-8.14
 */
export interface APIGatewayConstructProps {
  stage: string;
  userPoolArn: string;
  lambdaFunctions: LambdaFunctionsProps;
}

/**
 * API Gateway Construct
 * Creates REST API with routes, integrations, and Cognito authorization.
 * 
 * Requirements: 8.1-8.14
 * - 8.1: REST API with stage-based deployment
 * - 8.2: Cognito User Pool Authorizer for protected endpoints
 * - 8.3: Auth endpoints (/auth/*)
 * - 8.4: Court endpoints (/courts/*)
 * - 8.5: Booking endpoints (/bookings/*)
 * - 8.6: Review endpoints (/reviews/*)
 * - 8.7: Recommendation endpoints (/recommendations/*)
 * - 8.8: Dashboard endpoints (/dashboard/*)
 * - 8.9: Admin endpoints (/admin/*)
 * - 8.10: CORS enabled for all endpoints
 * - 8.11: Throttling (100 req/min per user)
 * - 8.12: Caching (60s TTL) for GET endpoints
 * - 8.13: CloudWatch logging
 * - 8.14: Output API Gateway URL and API ID
 */
export class APIGatewayConstruct extends Construct {
  public readonly api: RestApi;
  public readonly apiUrl: string;
  public readonly apiId: string;
  public readonly apiArn: string;

  constructor(scope: Construct, id: string, props: APIGatewayConstructProps) {
    super(scope, id);

    const { stage, userPoolArn, lambdaFunctions } = props;

    // Create CloudWatch Log Group for API Gateway access logs
    // Requirement: 8.13
    const accessLogGroup = new LogGroup(this, 'APIAccessLogs', {
      logGroupName: `/aws/apigateway/${stage}-cloud-racket-api`,
      retention: RetentionDays.ONE_MONTH,
    });

    // Create REST API with stage-based deployment
    // Requirements: 8.1, 8.10, 8.11, 8.12, 8.13
    this.api = new RestApi(this, 'CloudRacketAPI', {
      restApiName: `${stage}-cloud-racket-api`,
      description: `Cloud Racket Platform API - ${stage}`,
      deployOptions: {
        stageName: stage,
        // Throttling: 100 req/min per user (Requirement: 8.11)
        throttlingRateLimit: 100,
        throttlingBurstLimit: 200,
        // CloudWatch logging (Requirement: 8.13)
        loggingLevel: MethodLoggingLevel.INFO,
        dataTraceEnabled: true,
        metricsEnabled: true,
        tracingEnabled: true, // X-Ray tracing
        // Caching: 60s TTL for GET endpoints (Requirement: 8.12)
        cachingEnabled: true,
        cacheClusterEnabled: true,
        cacheClusterSize: '0.5', // 0.5 GB cache
        cacheTtl: Duration.seconds(60),
        // Access logging
        accessLogDestination: new LogGroupLogDestination(accessLogGroup),
        accessLogFormat: AccessLogFormat.jsonWithStandardFields(),
      },
      // CORS enabled for all endpoints (Requirement: 8.10)
      defaultCorsPreflightOptions: {
        allowOrigins: Cors.ALL_ORIGINS,
        allowMethods: Cors.ALL_METHODS,
        allowHeaders: [
          'Content-Type',
          'X-Amz-Date',
          'Authorization',
          'X-Api-Key',
          'X-Amz-Security-Token',
        ],
        allowCredentials: true,
      },
      cloudWatchRole: true,
    });

    // Create Cognito User Pool Authorizer (Requirement: 8.2)
    const userPool = UserPool.fromUserPoolArn(this, 'UserPool', userPoolArn);
    const authorizer = new CognitoUserPoolsAuthorizer(this, 'CognitoAuthorizer', {
      cognitoUserPools: [userPool],
      authorizerName: `${stage}-cognito-authorizer`,
      identitySource: 'method.request.header.Authorization',
    });

    // ==========================================
    // AUTH ROUTES (Requirement: 8.3)
    // No authorization required
    // ==========================================
    const auth = this.api.root.addResource('auth');
    
    auth.addResource('register').addMethod(
      'POST',
      new LambdaIntegration(lambdaFunctions.register)
    );
    
    auth.addResource('login').addMethod(
      'POST',
      new LambdaIntegration(lambdaFunctions.login)
    );
    
    auth.addResource('refresh-token').addMethod(
      'POST',
      new LambdaIntegration(lambdaFunctions.refreshToken)
    );

    // ==========================================
    // COURT ROUTES (Requirement: 8.4)
    // Mixed authorization - some public, some protected
    // ==========================================
    const courts = this.api.root.addResource('courts');

    // Public: Search courts (GET /courts)
    courts.addMethod(
      'GET',
      new LambdaIntegration(lambdaFunctions.searchCourts),
      {
        requestParameters: {
          'method.request.querystring.district': false,
          'method.request.querystring.minPrice': false,
          'method.request.querystring.maxPrice': false,
          'method.request.querystring.rating': false,
        },
      }
    );

    // Protected: Create court (POST /courts)
    courts.addMethod(
      'POST',
      new LambdaIntegration(lambdaFunctions.createCourt),
      {
        authorizer,
        authorizationType: AuthorizationType.COGNITO,
      }
    );

    // Public: Find nearby courts (GET /courts/nearby)
    courts.addResource('nearby').addMethod(
      'GET',
      new LambdaIntegration(lambdaFunctions.nearbyCourts),
      {
        requestParameters: {
          'method.request.querystring.lat': true,
          'method.request.querystring.lng': true,
          'method.request.querystring.radius': false,
        },
      }
    );

    // Court by ID routes
    const courtById = courts.addResource('{courtId}');

    // Public: Get court details (GET /courts/{courtId})
    courtById.addMethod(
      'GET',
      new LambdaIntegration(lambdaFunctions.getCourt)
    );

    // Protected: Update court (PUT /courts/{courtId})
    courtById.addMethod(
      'PUT',
      new LambdaIntegration(lambdaFunctions.updateCourt),
      {
        authorizer,
        authorizationType: AuthorizationType.COGNITO,
      }
    );

    // Protected: Delete court (DELETE /courts/{courtId})
    courtById.addMethod(
      'DELETE',
      new LambdaIntegration(lambdaFunctions.deleteCourt),
      {
        authorizer,
        authorizationType: AuthorizationType.COGNITO,
      }
    );

    // Protected: Upload court image (POST /courts/{courtId}/images)
    courtById.addResource('images').addMethod(
      'POST',
      new LambdaIntegration(lambdaFunctions.uploadCourtImage),
      {
        authorizer,
        authorizationType: AuthorizationType.COGNITO,
      }
    );

    // Availability routes
    const availability = courtById.addResource('availability');

    // Public: Get availability (GET /courts/{courtId}/availability)
    availability.addMethod(
      'GET',
      new LambdaIntegration(lambdaFunctions.getAvailability),
      {
        requestParameters: {
          'method.request.querystring.startDate': true,
          'method.request.querystring.endDate': true,
        },
      }
    );

    // Protected: Update availability (PUT /courts/{courtId}/availability)
    availability.addMethod(
      'PUT',
      new LambdaIntegration(lambdaFunctions.updateAvailability),
      {
        authorizer,
        authorizationType: AuthorizationType.COGNITO,
      }
    );

    // ==========================================
    // BOOKING ROUTES (Requirement: 8.5)
    // All protected
    // ==========================================
    const bookings = this.api.root.addResource('bookings');

    // Protected: Create booking (POST /bookings)
    bookings.addMethod(
      'POST',
      new LambdaIntegration(lambdaFunctions.createBooking),
      {
        authorizer,
        authorizationType: AuthorizationType.COGNITO,
      }
    );

    // Protected: List user bookings (GET /bookings)
    bookings.addMethod(
      'GET',
      new LambdaIntegration(lambdaFunctions.listBookings),
      {
        authorizer,
        authorizationType: AuthorizationType.COGNITO,
      }
    );

    // Booking by ID routes
    const bookingById = bookings.addResource('{bookingId}');

    // Protected: Get booking details (GET /bookings/{bookingId})
    bookingById.addMethod(
      'GET',
      new LambdaIntegration(lambdaFunctions.getBooking),
      {
        authorizer,
        authorizationType: AuthorizationType.COGNITO,
      }
    );

    // Protected: Cancel booking (DELETE /bookings/{bookingId})
    bookingById.addMethod(
      'DELETE',
      new LambdaIntegration(lambdaFunctions.cancelBooking),
      {
        authorizer,
        authorizationType: AuthorizationType.COGNITO,
      }
    );

    // ==========================================
    // REVIEW ROUTES (Requirement: 8.6)
    // Mixed authorization
    // ==========================================
    const reviews = this.api.root.addResource('reviews');

    // Protected: Create review (POST /reviews)
    reviews.addMethod(
      'POST',
      new LambdaIntegration(lambdaFunctions.createReview),
      {
        authorizer,
        authorizationType: AuthorizationType.COGNITO,
      }
    );

    // Public: Get reviews (GET /reviews)
    reviews.addMethod(
      'GET',
      new LambdaIntegration(lambdaFunctions.getReviews),
      {
        requestParameters: {
          'method.request.querystring.courtId': false,
          'method.request.querystring.userId': false,
        },
      }
    );

    // ==========================================
    // RECOMMENDATION ROUTES (Requirement: 8.7)
    // All protected
    // ==========================================
    const recommendations = this.api.root.addResource('recommendations');

    // Protected: Get recommendations (GET /recommendations)
    recommendations.addMethod(
      'GET',
      new LambdaIntegration(lambdaFunctions.getRecommendations),
      {
        authorizer,
        authorizationType: AuthorizationType.COGNITO,
      }
    );

    // Protected: Track interaction (POST /recommendations/track)
    recommendations.addResource('track').addMethod(
      'POST',
      new LambdaIntegration(lambdaFunctions.trackInteraction),
      {
        authorizer,
        authorizationType: AuthorizationType.COGNITO,
      }
    );

    // ==========================================
    // DASHBOARD ROUTES (Requirement: 8.8)
    // All protected (court owners)
    // ==========================================
    const dashboard = this.api.root.addResource('dashboard');

    // Protected: Get stats (GET /dashboard/stats)
    dashboard.addResource('stats').addMethod(
      'GET',
      new LambdaIntegration(lambdaFunctions.getStats),
      {
        authorizer,
        authorizationType: AuthorizationType.COGNITO,
      }
    );

    // Protected: Get revenue (GET /dashboard/revenue)
    dashboard.addResource('revenue').addMethod(
      'GET',
      new LambdaIntegration(lambdaFunctions.getRevenue),
      {
        authorizer,
        authorizationType: AuthorizationType.COGNITO,
        requestParameters: {
          'method.request.querystring.startDate': true,
          'method.request.querystring.endDate': true,
        },
      }
    );

    // Protected: Get booking trends (GET /dashboard/bookings)
    dashboard.addResource('bookings').addMethod(
      'GET',
      new LambdaIntegration(lambdaFunctions.getBookingTrends),
      {
        authorizer,
        authorizationType: AuthorizationType.COGNITO,
      }
    );

    // ==========================================
    // ADMIN ROUTES (Requirement: 8.9)
    // All protected (admins only)
    // ==========================================
    const admin = this.api.root.addResource('admin');

    // Admin Users routes
    const adminUsers = admin.addResource('users');

    // Protected: List users (GET /admin/users)
    adminUsers.addMethod(
      'GET',
      new LambdaIntegration(lambdaFunctions.listUsers),
      {
        authorizer,
        authorizationType: AuthorizationType.COGNITO,
      }
    );

    // Admin User by ID routes
    const adminUserById = adminUsers.addResource('{userId}');

    // Protected: Update user (PUT /admin/users/{userId})
    adminUserById.addMethod(
      'PUT',
      new LambdaIntegration(lambdaFunctions.updateUser),
      {
        authorizer,
        authorizationType: AuthorizationType.COGNITO,
      }
    );

    // Protected: Delete user (DELETE /admin/users/{userId})
    adminUserById.addMethod(
      'DELETE',
      new LambdaIntegration(lambdaFunctions.deleteUser),
      {
        authorizer,
        authorizationType: AuthorizationType.COGNITO,
      }
    );

    // Admin Courts routes
    const adminCourts = admin.addResource('courts');

    // Protected: List all courts (GET /admin/courts)
    adminCourts.addMethod(
      'GET',
      new LambdaIntegration(lambdaFunctions.listAllCourts),
      {
        authorizer,
        authorizationType: AuthorizationType.COGNITO,
      }
    );

    // Admin Reviews routes
    const adminReviews = admin.addResource('reviews');
    const adminReviewById = adminReviews.addResource('{reviewId}');

    // Protected: Moderate review (PUT /admin/reviews/{reviewId})
    adminReviewById.addMethod(
      'PUT',
      new LambdaIntegration(lambdaFunctions.moderateReview),
      {
        authorizer,
        authorizationType: AuthorizationType.COGNITO,
      }
    );

    // Export outputs (Requirement: 8.14)
    this.apiUrl = this.api.url;
    this.apiId = this.api.restApiId;
    this.apiArn = this.api.arnForExecuteApi();
  }
}
