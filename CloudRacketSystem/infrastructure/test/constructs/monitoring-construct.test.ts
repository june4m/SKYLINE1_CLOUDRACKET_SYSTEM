import * as cdk from 'aws-cdk-lib';
import { Template, Match } from 'aws-cdk-lib/assertions';
import { Function, Runtime, Code } from 'aws-cdk-lib/aws-lambda';
import { MonitoringConstruct } from '../../lib/constructs/monitoring-construct';

describe('MonitoringConstruct', () => {
  let app: cdk.App;
  let stack: cdk.Stack;
  let template: Template;

  // Helper function to create mock Lambda functions
  const createMockFunction = (stack: cdk.Stack, id: string): Function => {
    return new Function(stack, id, {
      functionName: `test-${id}`,
      runtime: Runtime.NODEJS_18_X,
      handler: 'index.handler',
      code: Code.fromInline('exports.handler = async () => {}'),
    });
  };

  const defaultProps = (stack: cdk.Stack) => ({
    stage: 'test',
    apiGateway: {
      apiId: 'test-api-id',
      apiName: 'test-api',
      stageName: 'test',
    },
    lambdaFunctions: [
      createMockFunction(stack, 'Function1'),
      createMockFunction(stack, 'Function2'),
    ],
    dynamoDBTables: {
      courtsTableName: 'test-courts',
      availabilityTableName: 'test-availability',
      bookingsTableName: 'test-bookings',
      reviewsTableName: 'test-reviews',
      interactionsTableName: 'test-interactions',
    },
  });

  beforeEach(() => {
    app = new cdk.App();
    stack = new cdk.Stack(app, 'TestStack');
  });

  describe('Dashboard Creation', () => {
    beforeEach(() => {
      new MonitoringConstruct(stack, 'TestMonitoring', defaultProps(stack));
      template = Template.fromStack(stack);
    });

    test('creates CloudWatch Dashboard', () => {
      template.resourceCountIs('AWS::CloudWatch::Dashboard', 1);
    });

    test('dashboard has correct name', () => {
      template.hasResourceProperties('AWS::CloudWatch::Dashboard', {
        DashboardName: 'test-cloud-racket-dashboard',
      });
    });

    test('dashboard body contains API Gateway metrics', () => {
      template.hasResourceProperties('AWS::CloudWatch::Dashboard', {
        DashboardBody: Match.objectLike({
          'Fn::Join': Match.arrayWith([
            Match.arrayWith([Match.stringLikeRegexp('.*ApiGateway.*')]),
          ]),
        }),
      });
    });

    test('dashboard body contains Lambda metrics', () => {
      template.hasResourceProperties('AWS::CloudWatch::Dashboard', {
        DashboardBody: Match.objectLike({
          'Fn::Join': Match.arrayWith([
            Match.arrayWith([Match.stringLikeRegexp('.*Lambda.*')]),
          ]),
        }),
      });
    });

    test('dashboard body contains DynamoDB metrics', () => {
      template.hasResourceProperties('AWS::CloudWatch::Dashboard', {
        DashboardBody: Match.objectLike({
          'Fn::Join': Match.arrayWith([
            Match.arrayWith([Match.stringLikeRegexp('.*DynamoDB.*')]),
          ]),
        }),
      });
    });
  });

  describe('SNS Topic Creation', () => {
    beforeEach(() => {
      new MonitoringConstruct(stack, 'TestMonitoring', defaultProps(stack));
      template = Template.fromStack(stack);
    });

    test('creates SNS Topic for alarms', () => {
      template.resourceCountIs('AWS::SNS::Topic', 1);
    });

    test('SNS Topic has correct name', () => {
      template.hasResourceProperties('AWS::SNS::Topic', {
        TopicName: 'test-cloud-racket-alarms',
      });
    });
  });

  describe('SNS Email Subscription', () => {
    test('creates email subscription when alarmEmail is provided', () => {
      new MonitoringConstruct(stack, 'TestMonitoring', {
        ...defaultProps(stack),
        alarmEmail: 'test@example.com',
      });
      template = Template.fromStack(stack);

      template.hasResourceProperties('AWS::SNS::Subscription', {
        Protocol: 'email',
        Endpoint: 'test@example.com',
      });
    });

    test('does not create email subscription when alarmEmail is not provided', () => {
      new MonitoringConstruct(stack, 'TestMonitoring', defaultProps(stack));
      template = Template.fromStack(stack);

      template.resourceCountIs('AWS::SNS::Subscription', 0);
    });
  });

  describe('API Gateway Alarms', () => {
    beforeEach(() => {
      new MonitoringConstruct(stack, 'TestMonitoring', defaultProps(stack));
      template = Template.fromStack(stack);
    });

    test('creates API Gateway 5xx error alarm', () => {
      template.hasResourceProperties('AWS::CloudWatch::Alarm', {
        AlarmName: 'test-api-5xx-errors',
        MetricName: '5XXError',
        Namespace: 'AWS/ApiGateway',
        Threshold: 2,
        ComparisonOperator: 'GreaterThanThreshold',
      });
    });

    test('creates API Gateway 4xx error alarm', () => {
      template.hasResourceProperties('AWS::CloudWatch::Alarm', {
        AlarmName: 'test-api-4xx-errors',
        MetricName: '4XXError',
        Namespace: 'AWS/ApiGateway',
        Threshold: 10,
        ComparisonOperator: 'GreaterThanThreshold',
      });
    });

    test('API Gateway alarms have SNS action', () => {
      template.hasResourceProperties('AWS::CloudWatch::Alarm', {
        AlarmName: 'test-api-5xx-errors',
        AlarmActions: Match.anyValue(),
      });
    });
  });

  describe('Lambda Error Alarms', () => {
    beforeEach(() => {
      new MonitoringConstruct(stack, 'TestMonitoring', defaultProps(stack));
      template = Template.fromStack(stack);
    });

    test('creates Lambda error alarms for each function', () => {
      // 2 Lambda functions = 2 Lambda error alarms
      const alarms = template.findResources('AWS::CloudWatch::Alarm', {
        Properties: {
          Namespace: 'AWS/Lambda',
          MetricName: 'Errors',
        },
      });
      expect(Object.keys(alarms).length).toBe(2);
    });

    test('Lambda error alarms have correct threshold', () => {
      template.hasResourceProperties('AWS::CloudWatch::Alarm', {
        Namespace: 'AWS/Lambda',
        MetricName: 'Errors',
        Threshold: 5,
        ComparisonOperator: 'GreaterThanThreshold',
      });
    });
  });

  describe('DynamoDB Throttle Alarms', () => {
    beforeEach(() => {
      new MonitoringConstruct(stack, 'TestMonitoring', defaultProps(stack));
      template = Template.fromStack(stack);
    });

    test('creates DynamoDB throttle alarms for each table', () => {
      // 5 DynamoDB tables = 5 throttle alarms
      const alarms = template.findResources('AWS::CloudWatch::Alarm', {
        Properties: {
          Namespace: 'AWS/DynamoDB',
          MetricName: 'ThrottledRequests',
        },
      });
      expect(Object.keys(alarms).length).toBe(5);
    });

    test('DynamoDB throttle alarms have correct threshold', () => {
      template.hasResourceProperties('AWS::CloudWatch::Alarm', {
        Namespace: 'AWS/DynamoDB',
        MetricName: 'ThrottledRequests',
        Threshold: 10,
        ComparisonOperator: 'GreaterThanThreshold',
      });
    });
  });

  describe('CloudFormation Outputs', () => {
    beforeEach(() => {
      new MonitoringConstruct(stack, 'TestMonitoring', defaultProps(stack));
      template = Template.fromStack(stack);
    });

    test('exports Dashboard URL', () => {
      const outputs = template.findOutputs('*');
      const dashboardOutput = Object.values(outputs).find(
        (output: any) => output.Export?.Name === 'test-dashboard-url'
      );
      expect(dashboardOutput).toBeDefined();
    });

    test('exports Alarm Topic ARN', () => {
      const outputs = template.findOutputs('*');
      const alarmTopicOutput = Object.values(outputs).find(
        (output: any) => output.Export?.Name === 'test-alarm-topic-arn'
      );
      expect(alarmTopicOutput).toBeDefined();
    });
  });
});
