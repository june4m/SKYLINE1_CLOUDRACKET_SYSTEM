import * as cdk from 'aws-cdk-lib';
import { Template, Match } from 'aws-cdk-lib/assertions';
import { Function, Runtime, Code } from 'aws-cdk-lib/aws-lambda';
import { APIGatewayConstruct, LambdaFunctionsProps } from '../../lib/constructs/api-gateway-construct';

describe('APIGatewayConstruct', () => {
  let app: cdk.App;
  let stack: cdk.Stack;
  let template: Template;
  let mockLambdaFunctions: LambdaFunctionsProps;

  // Helper function to create mock Lambda functions
  const createMockFunction = (stack: cdk.Stack, id: string): Function => {
    return new Function(stack, id, {
      functionName: `test-${id}`,
      runtime: Runtime.NODEJS_18_X,
      handler: 'index.handler',
      code: Code.fromInline('exports.handler = async () => {}'),
    });
  };

  beforeEach(() => {
    app = new cdk.App();
    stack = new cdk.Stack(app, 'TestStack');

    // Create mock Lambda functions for all API endpoints
    mockLambdaFunctions = {
      // Auth Functions
      register: createMockFunction(stack, 'register'),
      login: createMockFunction(stack, 'login'),
      refreshToken: createMockFunction(stack, 'refreshToken'),
      // Court Functions
      createCourt: createMockFunction(stack, 'createCourt'),
      getCourt: createMockFunction(stack, 'getCourt'),
      updateCourt: createMockFunction(stack, 'updateCourt'),
      deleteCourt: createMockFunction(stack, 'deleteCourt'),
      searchCourts: createMockFunction(stack, 'searchCourts'),
      nearbyCourts: createMockFunction(stack, 'nearbyCourts'),
      uploadCourtImage: createMockFunction(stack, 'uploadCourtImage'),
      getAvailability: createMockFunction(stack, 'getAvailability'),
      updateAvailability: createMockFunction(stack, 'updateAvailability'),
      // Booking Functions
      createBooking: createMockFunction(stack, 'createBooking'),
      getBooking: createMockFunction(stack, 'getBooking'),
      cancelBooking: createMockFunction(stack, 'cancelBooking'),
      listBookings: createMockFunction(stack, 'listBookings'),
      // Review Functions
      createReview: createMockFunction(stack, 'createReview'),
      getReviews: createMockFunction(stack, 'getReviews'),
      // Recommendation Functions
      getRecommendations: createMockFunction(stack, 'getRecommendations'),
      trackInteraction: createMockFunction(stack, 'trackInteraction'),
      // Dashboard Functions
      getStats: createMockFunction(stack, 'getStats'),
      getRevenue: createMockFunction(stack, 'getRevenue'),
      getBookingTrends: createMockFunction(stack, 'getBookingTrends'),
      // Admin Functions
      listUsers: createMockFunction(stack, 'listUsers'),
      updateUser: createMockFunction(stack, 'updateUser'),
      deleteUser: createMockFunction(stack, 'deleteUser'),
      listAllCourts: createMockFunction(stack, 'listAllCourts'),
      moderateReview: createMockFunction(stack, 'moderateReview'),
    };

    // Create API Gateway Construct
    new APIGatewayConstruct(stack, 'TestAPIGateway', {
      stage: 'test',
      userPoolArn: 'arn:aws:cognito-idp:us-east-1:123456789012:userpool/us-east-1_TestPool',
      lambdaFunctions: mockLambdaFunctions,
    });

    template = Template.fromStack(stack);
  });

  describe('REST API Creation', () => {
    test('creates a REST API with correct name', () => {
      template.hasResourceProperties('AWS::ApiGateway::RestApi', {
        Name: 'test-cloud-racket-api',
      });
    });

    test('creates exactly one REST API', () => {
      template.resourceCountIs('AWS::ApiGateway::RestApi', 1);
    });

    test('REST API has description', () => {
      template.hasResourceProperties('AWS::ApiGateway::RestApi', {
        Description: 'Cloud Racket Platform API - test',
      });
    });
  });

  describe('Stage Configuration', () => {
    test('creates a deployment stage with correct name', () => {
      template.hasResourceProperties('AWS::ApiGateway::Stage', {
        StageName: 'test',
      });
    });

    test('stage has throttling configured', () => {
      template.hasResourceProperties('AWS::ApiGateway::Stage', {
        MethodSettings: Match.arrayWith([
          Match.objectLike({
            ThrottlingRateLimit: 100,
            ThrottlingBurstLimit: 200,
          }),
        ]),
      });
    });

    test('stage has caching enabled', () => {
      template.hasResourceProperties('AWS::ApiGateway::Stage', {
        CacheClusterEnabled: true,
        CacheClusterSize: '0.5',
      });
    });

    test('stage has X-Ray tracing enabled', () => {
      template.hasResourceProperties('AWS::ApiGateway::Stage', {
        TracingEnabled: true,
      });
    });
  });

  describe('Cognito Authorizer Setup', () => {
    test('creates a Cognito User Pool Authorizer', () => {
      template.hasResourceProperties('AWS::ApiGateway::Authorizer', {
        Name: 'test-cognito-authorizer',
        Type: 'COGNITO_USER_POOLS',
        IdentitySource: 'method.request.header.Authorization',
      });
    });

    test('creates exactly one authorizer', () => {
      template.resourceCountIs('AWS::ApiGateway::Authorizer', 1);
    });
  });


  describe('Route Configurations', () => {
    test('creates auth routes', () => {
      // Auth routes should exist
      template.hasResourceProperties('AWS::ApiGateway::Resource', {
        PathPart: 'auth',
      });
      template.hasResourceProperties('AWS::ApiGateway::Resource', {
        PathPart: 'register',
      });
      template.hasResourceProperties('AWS::ApiGateway::Resource', {
        PathPart: 'login',
      });
      template.hasResourceProperties('AWS::ApiGateway::Resource', {
        PathPart: 'refresh-token',
      });
    });

    test('creates courts routes', () => {
      template.hasResourceProperties('AWS::ApiGateway::Resource', {
        PathPart: 'courts',
      });
      template.hasResourceProperties('AWS::ApiGateway::Resource', {
        PathPart: 'nearby',
      });
      template.hasResourceProperties('AWS::ApiGateway::Resource', {
        PathPart: '{courtId}',
      });
      template.hasResourceProperties('AWS::ApiGateway::Resource', {
        PathPart: 'images',
      });
      template.hasResourceProperties('AWS::ApiGateway::Resource', {
        PathPart: 'availability',
      });
    });

    test('creates bookings routes', () => {
      template.hasResourceProperties('AWS::ApiGateway::Resource', {
        PathPart: 'bookings',
      });
      template.hasResourceProperties('AWS::ApiGateway::Resource', {
        PathPart: '{bookingId}',
      });
    });

    test('creates reviews routes', () => {
      template.hasResourceProperties('AWS::ApiGateway::Resource', {
        PathPart: 'reviews',
      });
    });

    test('creates recommendations routes', () => {
      template.hasResourceProperties('AWS::ApiGateway::Resource', {
        PathPart: 'recommendations',
      });
      template.hasResourceProperties('AWS::ApiGateway::Resource', {
        PathPart: 'track',
      });
    });

    test('creates dashboard routes', () => {
      template.hasResourceProperties('AWS::ApiGateway::Resource', {
        PathPart: 'dashboard',
      });
      template.hasResourceProperties('AWS::ApiGateway::Resource', {
        PathPart: 'stats',
      });
      template.hasResourceProperties('AWS::ApiGateway::Resource', {
        PathPart: 'revenue',
      });
    });

    test('creates admin routes', () => {
      template.hasResourceProperties('AWS::ApiGateway::Resource', {
        PathPart: 'admin',
      });
      template.hasResourceProperties('AWS::ApiGateway::Resource', {
        PathPart: 'users',
      });
      template.hasResourceProperties('AWS::ApiGateway::Resource', {
        PathPart: '{userId}',
      });
      template.hasResourceProperties('AWS::ApiGateway::Resource', {
        PathPart: '{reviewId}',
      });
    });
  });

  describe('HTTP Methods', () => {
    test('creates POST methods for auth endpoints', () => {
      // Auth endpoints use POST
      const methods = template.findResources('AWS::ApiGateway::Method', {
        Properties: {
          HttpMethod: 'POST',
        },
      });
      expect(Object.keys(methods).length).toBeGreaterThan(0);
    });

    test('creates GET methods for public endpoints', () => {
      const methods = template.findResources('AWS::ApiGateway::Method', {
        Properties: {
          HttpMethod: 'GET',
        },
      });
      expect(Object.keys(methods).length).toBeGreaterThan(0);
    });

    test('creates PUT methods for update endpoints', () => {
      const methods = template.findResources('AWS::ApiGateway::Method', {
        Properties: {
          HttpMethod: 'PUT',
        },
      });
      expect(Object.keys(methods).length).toBeGreaterThan(0);
    });

    test('creates DELETE methods for delete endpoints', () => {
      const methods = template.findResources('AWS::ApiGateway::Method', {
        Properties: {
          HttpMethod: 'DELETE',
        },
      });
      expect(Object.keys(methods).length).toBeGreaterThan(0);
    });
  });

  describe('Authorization Configuration', () => {
    test('auth endpoints have no authorization', () => {
      // Auth endpoints should have NONE authorization
      template.hasResourceProperties('AWS::ApiGateway::Method', {
        HttpMethod: 'POST',
        AuthorizationType: 'NONE',
      });
    });

    test('protected endpoints use Cognito authorization', () => {
      // Protected endpoints should use COGNITO_USER_POOLS
      template.hasResourceProperties('AWS::ApiGateway::Method', {
        AuthorizationType: 'COGNITO_USER_POOLS',
      });
    });
  });

  describe('Lambda Integrations', () => {
    test('methods use AWS_PROXY integration type', () => {
      template.hasResourceProperties('AWS::ApiGateway::Method', {
        Integration: Match.objectLike({
          Type: 'AWS_PROXY',
        }),
      });
    });

    test('Lambda functions have API Gateway invoke permissions', () => {
      template.hasResourceProperties('AWS::Lambda::Permission', {
        Action: 'lambda:InvokeFunction',
        Principal: 'apigateway.amazonaws.com',
      });
    });
  });

  describe('CloudWatch Logging', () => {
    test('creates CloudWatch Log Group for API access logs', () => {
      template.hasResourceProperties('AWS::Logs::LogGroup', {
        LogGroupName: '/aws/apigateway/test-cloud-racket-api',
        RetentionInDays: 30,
      });
    });
  });

  describe('CORS Configuration', () => {
    test('creates OPTIONS methods for CORS preflight', () => {
      const methods = template.findResources('AWS::ApiGateway::Method', {
        Properties: {
          HttpMethod: 'OPTIONS',
        },
      });
      expect(Object.keys(methods).length).toBeGreaterThan(0);
    });
  });
});
