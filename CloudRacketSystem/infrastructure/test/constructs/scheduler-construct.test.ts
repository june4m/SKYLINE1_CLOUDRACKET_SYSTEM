import * as cdk from 'aws-cdk-lib';
import { Template, Match } from 'aws-cdk-lib/assertions';
import { SchedulerConstruct } from '../../lib/constructs/scheduler-construct';

describe('SchedulerConstruct', () => {
  let app: cdk.App;
  let stack: cdk.Stack;
  let template: Template;

  beforeEach(() => {
    app = new cdk.App();
    stack = new cdk.Stack(app, 'TestStack', {
      env: { account: '123456789012', region: 'ap-southeast-1' },
    });
    new SchedulerConstruct(stack, 'TestScheduler', {
      stage: 'test',
    });
    template = Template.fromStack(stack);
  });

  describe('Scheduler Group Creation', () => {
    test('creates a Scheduler Group', () => {
      template.resourceCountIs('AWS::Scheduler::ScheduleGroup', 1);
    });

    test('Scheduler Group has correct name', () => {
      template.hasResourceProperties('AWS::Scheduler::ScheduleGroup', {
        Name: 'test-cloud-racket-schedules',
      });
    });
  });

  describe('Schedule Configurations', () => {
    test('creates 3 schedules', () => {
      template.resourceCountIs('AWS::Scheduler::Schedule', 3);
    });

    test('booking reminder schedule has correct configuration', () => {
      template.hasResourceProperties('AWS::Scheduler::Schedule', {
        Name: 'test-booking-reminder',
        GroupName: 'test-cloud-racket-schedules',
        ScheduleExpression: 'rate(1 hour)',
        State: 'ENABLED',
        FlexibleTimeWindow: {
          Mode: 'FLEXIBLE',
          MaximumWindowInMinutes: 15,
        },
      });
    });

    test('data cleanup schedule has correct configuration', () => {
      template.hasResourceProperties('AWS::Scheduler::Schedule', {
        Name: 'test-data-cleanup',
        GroupName: 'test-cloud-racket-schedules',
        ScheduleExpression: 'cron(0 2 ? * SUN *)',
        State: 'ENABLED',
        FlexibleTimeWindow: {
          Mode: 'FLEXIBLE',
          MaximumWindowInMinutes: 30,
        },
      });
    });

    test('monthly report schedule has correct configuration', () => {
      template.hasResourceProperties('AWS::Scheduler::Schedule', {
        Name: 'test-monthly-report',
        GroupName: 'test-cloud-racket-schedules',
        ScheduleExpression: 'cron(0 4 1 * ? *)',
        State: 'ENABLED',
        FlexibleTimeWindow: {
          Mode: 'FLEXIBLE',
          MaximumWindowInMinutes: 60,
        },
      });
    });
  });

  describe('Cron Expressions', () => {
    test('booking reminder runs every hour', () => {
      template.hasResourceProperties('AWS::Scheduler::Schedule', {
        Name: 'test-booking-reminder',
        ScheduleExpression: 'rate(1 hour)',
      });
    });

    test('data cleanup runs weekly on Sunday at 2 AM UTC', () => {
      template.hasResourceProperties('AWS::Scheduler::Schedule', {
        Name: 'test-data-cleanup',
        ScheduleExpression: 'cron(0 2 ? * SUN *)',
      });
    });

    test('monthly report runs on 1st day of month at 4 AM UTC', () => {
      template.hasResourceProperties('AWS::Scheduler::Schedule', {
        Name: 'test-monthly-report',
        ScheduleExpression: 'cron(0 4 1 * ? *)',
      });
    });
  });

  describe('IAM Role Configuration', () => {
    test('creates IAM role for scheduler', () => {
      template.resourceCountIs('AWS::IAM::Role', 1);
    });

    test('IAM role has correct assume role policy for scheduler service', () => {
      template.hasResourceProperties('AWS::IAM::Role', {
        RoleName: 'test-cloud-racket-scheduler-role',
        AssumeRolePolicyDocument: {
          Statement: Match.arrayWith([
            Match.objectLike({
              Action: 'sts:AssumeRole',
              Effect: 'Allow',
              Principal: {
                Service: 'scheduler.amazonaws.com',
              },
            }),
          ]),
        },
      });
    });

    test('IAM role has Lambda invoke permissions', () => {
      template.hasResourceProperties('AWS::IAM::Policy', {
        PolicyDocument: {
          Statement: Match.arrayWith([
            Match.objectLike({
              Action: 'lambda:InvokeFunction',
              Effect: 'Allow',
            }),
          ]),
        },
      });
    });
  });

  describe('Schedule Targets', () => {
    test('schedules have retry policy configured', () => {
      template.hasResourceProperties('AWS::Scheduler::Schedule', {
        Target: Match.objectLike({
          RetryPolicy: {
            MaximumRetryAttempts: 2,
          },
        }),
      });
    });

    test('schedules reference the scheduler role', () => {
      template.hasResourceProperties('AWS::Scheduler::Schedule', {
        Target: Match.objectLike({
          RoleArn: Match.anyValue(),
        }),
      });
    });
  });
});
