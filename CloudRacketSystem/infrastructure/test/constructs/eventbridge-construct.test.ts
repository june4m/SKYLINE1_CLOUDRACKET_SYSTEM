import * as cdk from 'aws-cdk-lib';
import { Template, Match } from 'aws-cdk-lib/assertions';
import { Function, Runtime, Code } from 'aws-cdk-lib/aws-lambda';
import { EventBridgeConstruct } from '../../lib/constructs/eventbridge-construct';

describe('EventBridgeConstruct', () => {
  let app: cdk.App;
  let stack: cdk.Stack;

  // Helper function to create mock Lambda functions
  const createMockFunction = (stack: cdk.Stack, id: string): Function => {
    return new Function(stack, id, {
      functionName: `test-${id}`,
      runtime: Runtime.NODEJS_18_X,
      handler: 'index.handler',
      code: Code.fromInline('exports.handler = async () => {}'),
    });
  };

  describe('Without Retraining Function', () => {
    let template: Template;

    beforeEach(() => {
      app = new cdk.App();
      stack = new cdk.Stack(app, 'TestStack');

      new EventBridgeConstruct(stack, 'TestEventBridge', {
        stage: 'test',
        lambdaFunctions: {
          bookingReminder: createMockFunction(stack, 'bookingReminder'),
          cleanup: createMockFunction(stack, 'cleanup'),
          monthlyReport: createMockFunction(stack, 'monthlyReport'),
        },
      });

      template = Template.fromStack(stack);
    });

    describe('Rule Creation', () => {
      test('creates 3 EventBridge rules without retraining', () => {
        template.resourceCountIs('AWS::Events::Rule', 3);
      });

      test('creates booking reminder rule with correct name', () => {
        template.hasResourceProperties('AWS::Events::Rule', {
          Name: 'test-booking-reminder-rule',
        });
      });

      test('creates cleanup rule with correct name', () => {
        template.hasResourceProperties('AWS::Events::Rule', {
          Name: 'test-cleanup-rule',
        });
      });

      test('creates monthly report rule with correct name', () => {
        template.hasResourceProperties('AWS::Events::Rule', {
          Name: 'test-monthly-report-rule',
        });
      });
    });

    describe('Schedule Configurations', () => {
      test('booking reminder runs every hour', () => {
        template.hasResourceProperties('AWS::Events::Rule', {
          Name: 'test-booking-reminder-rule',
          ScheduleExpression: 'rate(1 hour)',
          State: 'ENABLED',
        });
      });

      test('cleanup runs weekly on Sunday at 2 AM UTC', () => {
        template.hasResourceProperties('AWS::Events::Rule', {
          Name: 'test-cleanup-rule',
          ScheduleExpression: 'cron(0 2 ? * SUN *)',
          State: 'ENABLED',
        });
      });

      test('monthly report runs on 1st day of month at 4 AM UTC', () => {
        template.hasResourceProperties('AWS::Events::Rule', {
          Name: 'test-monthly-report-rule',
          ScheduleExpression: 'cron(0 4 1 * ? *)',
          State: 'ENABLED',
        });
      });
    });

    describe('Lambda Targets', () => {
      test('rules have Lambda function targets', () => {
        template.hasResourceProperties('AWS::Events::Rule', {
          Targets: Match.arrayWith([
            Match.objectLike({
              Arn: Match.anyValue(),
            }),
          ]),
        });
      });

      test('Lambda functions have EventBridge invoke permissions', () => {
        template.hasResourceProperties('AWS::Lambda::Permission', {
          Action: 'lambda:InvokeFunction',
          Principal: 'events.amazonaws.com',
        });
      });

      test('creates 3 Lambda permissions for EventBridge', () => {
        const permissions = template.findResources('AWS::Lambda::Permission', {
          Properties: {
            Principal: 'events.amazonaws.com',
          },
        });
        expect(Object.keys(permissions).length).toBe(3);
      });
    });

    describe('Rule Descriptions', () => {
      test('booking reminder rule has description', () => {
        template.hasResourceProperties('AWS::Events::Rule', {
          Name: 'test-booking-reminder-rule',
          Description: Match.stringLikeRegexp('.*reminder.*'),
        });
      });

      test('cleanup rule has description', () => {
        template.hasResourceProperties('AWS::Events::Rule', {
          Name: 'test-cleanup-rule',
          Description: Match.stringLikeRegexp('.*[Cc]lean.*'),
        });
      });

      test('monthly report rule has description', () => {
        template.hasResourceProperties('AWS::Events::Rule', {
          Name: 'test-monthly-report-rule',
          Description: Match.stringLikeRegexp('.*report.*'),
        });
      });
    });
  });

  describe('With Retraining Function (Optional)', () => {
    let template: Template;

    beforeEach(() => {
      app = new cdk.App();
      stack = new cdk.Stack(app, 'TestStackWithRetraining');

      new EventBridgeConstruct(stack, 'TestEventBridgeWithRetraining', {
        stage: 'test',
        lambdaFunctions: {
          bookingReminder: createMockFunction(stack, 'bookingReminder'),
          cleanup: createMockFunction(stack, 'cleanup'),
          retraining: createMockFunction(stack, 'retraining'),
          monthlyReport: createMockFunction(stack, 'monthlyReport'),
        },
      });

      template = Template.fromStack(stack);
    });

    test('creates 4 EventBridge rules with retraining', () => {
      template.resourceCountIs('AWS::Events::Rule', 4);
    });

    test('creates retraining rule with correct name', () => {
      template.hasResourceProperties('AWS::Events::Rule', {
        Name: 'test-personalize-retraining-rule',
      });
    });

    test('retraining runs weekly on Sunday at 3 AM UTC', () => {
      template.hasResourceProperties('AWS::Events::Rule', {
        Name: 'test-personalize-retraining-rule',
        ScheduleExpression: 'cron(0 3 ? * SUN *)',
        State: 'ENABLED',
      });
    });

    test('creates 4 Lambda permissions for EventBridge', () => {
      const permissions = template.findResources('AWS::Lambda::Permission', {
        Properties: {
          Principal: 'events.amazonaws.com',
        },
      });
      expect(Object.keys(permissions).length).toBe(4);
    });
  });
});
