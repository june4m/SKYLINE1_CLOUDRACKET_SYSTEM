import { Construct } from 'constructs';
import {
  CfnScheduleGroup,
  CfnSchedule,
} from 'aws-cdk-lib/aws-scheduler';
import { Role, ServicePrincipal, PolicyStatement, Effect } from 'aws-cdk-lib/aws-iam';
import { Stack } from 'aws-cdk-lib';

export interface SchedulerConstructProps {
  stage: string;
}

export class SchedulerConstruct extends Construct {
  // Scheduler Group
  public readonly schedulerGroup: CfnScheduleGroup;
  public readonly schedulerGroupArn: string;
  public readonly schedulerGroupName: string;

  // Schedule names
  public readonly bookingReminderScheduleName: string;
  public readonly dataCleanupScheduleName: string;
  public readonly monthlyReportScheduleName: string;

  // Schedules
  public readonly bookingReminderSchedule: CfnSchedule;
  public readonly dataCleanupSchedule: CfnSchedule;
  public readonly monthlyReportSchedule: CfnSchedule;

  // IAM Role for Scheduler
  public readonly schedulerRole: Role;

  constructor(scope: Construct, id: string, props: SchedulerConstructProps) {
    super(scope, id);

    const { stage } = props;
    const stack = Stack.of(this);

    // Create Scheduler Group for organizing schedules
    this.schedulerGroup = new CfnScheduleGroup(this, 'SchedulerGroup', {
      name: `${stage}-cloud-racket-schedules`,
    });

    this.schedulerGroupName = this.schedulerGroup.name!;
    this.schedulerGroupArn = `arn:aws:scheduler:${stack.region}:${stack.account}:schedule-group/${this.schedulerGroupName}`;

    // Create IAM Role for EventBridge Scheduler to invoke Lambda functions
    this.schedulerRole = new Role(this, 'SchedulerRole', {
      roleName: `${stage}-cloud-racket-scheduler-role`,
      assumedBy: new ServicePrincipal('scheduler.amazonaws.com'),
      description: 'IAM role for EventBridge Scheduler to invoke Lambda functions',
    });

    // Grant Lambda invoke permissions (will be updated when Lambda functions are created)
    this.schedulerRole.addToPolicy(new PolicyStatement({
      effect: Effect.ALLOW,
      actions: ['lambda:InvokeFunction'],
      resources: [`arn:aws:lambda:${stack.region}:${stack.account}:function:${stage}-*`],
    }));

    // Define schedule names
    this.bookingReminderScheduleName = `${stage}-booking-reminder`;
    this.dataCleanupScheduleName = `${stage}-data-cleanup`;
    this.monthlyReportScheduleName = `${stage}-monthly-report`;

    // Placeholder Lambda ARN (will be replaced when Lambda construct is created)
    const placeholderLambdaArn = `arn:aws:lambda:${stack.region}:${stack.account}:function:${stage}-booking-reminder`;
    const cleanupLambdaArn = `arn:aws:lambda:${stack.region}:${stack.account}:function:${stage}-cleanup`;
    const monthlyReportLambdaArn = `arn:aws:lambda:${stack.region}:${stack.account}:function:${stage}-monthly-report`;

    // Schedule for booking reminders - every hour
    // Sends reminder emails 24 hours before scheduled booking time
    this.bookingReminderSchedule = new CfnSchedule(this, 'BookingReminderSchedule', {
      name: this.bookingReminderScheduleName,
      groupName: this.schedulerGroupName,
      description: 'Send booking reminder emails every hour for bookings 24 hours away',
      scheduleExpression: 'rate(1 hour)',
      flexibleTimeWindow: {
        mode: 'FLEXIBLE',
        maximumWindowInMinutes: 15, // Cost optimization: allows 15-minute flexibility
      },
      state: 'ENABLED',
      target: {
        arn: placeholderLambdaArn,
        roleArn: this.schedulerRole.roleArn,
        retryPolicy: {
          maximumRetryAttempts: 2,
          maximumEventAgeInSeconds: 3600, // 1 hour
        },
      },
    });

    // Schedule for data cleanup - weekly on Sunday at 2 AM UTC
    // Cleans up expired bookings and old data
    this.dataCleanupSchedule = new CfnSchedule(this, 'DataCleanupSchedule', {
      name: this.dataCleanupScheduleName,
      groupName: this.schedulerGroupName,
      description: 'Clean up expired bookings and old data weekly on Sunday at 2 AM UTC',
      scheduleExpression: 'cron(0 2 ? * SUN *)',
      flexibleTimeWindow: {
        mode: 'FLEXIBLE',
        maximumWindowInMinutes: 30, // Cost optimization: allows 30-minute flexibility
      },
      state: 'ENABLED',
      target: {
        arn: cleanupLambdaArn,
        roleArn: this.schedulerRole.roleArn,
        retryPolicy: {
          maximumRetryAttempts: 2,
          maximumEventAgeInSeconds: 7200, // 2 hours
        },
      },
    });

    // Schedule for monthly reports - 1st day of month at 4 AM UTC
    // Generates monthly analytics and revenue reports
    this.monthlyReportSchedule = new CfnSchedule(this, 'MonthlyReportSchedule', {
      name: this.monthlyReportScheduleName,
      groupName: this.schedulerGroupName,
      description: 'Generate monthly analytics report on the 1st day of each month at 4 AM UTC',
      scheduleExpression: 'cron(0 4 1 * ? *)',
      flexibleTimeWindow: {
        mode: 'FLEXIBLE',
        maximumWindowInMinutes: 60, // Cost optimization: allows 1-hour flexibility
      },
      state: 'ENABLED',
      target: {
        arn: monthlyReportLambdaArn,
        roleArn: this.schedulerRole.roleArn,
        retryPolicy: {
          maximumRetryAttempts: 2,
          maximumEventAgeInSeconds: 14400, // 4 hours
        },
      },
    });

    // Add dependencies to ensure schedules are created after the group
    this.bookingReminderSchedule.addDependency(this.schedulerGroup);
    this.dataCleanupSchedule.addDependency(this.schedulerGroup);
    this.monthlyReportSchedule.addDependency(this.schedulerGroup);
  }

  /**
   * Updates the target Lambda ARN for the booking reminder schedule.
   * Call this method after Lambda functions are created.
   */
  public updateBookingReminderTarget(lambdaArn: string): void {
    this.bookingReminderSchedule.addPropertyOverride('Target.Arn', lambdaArn);
  }

  /**
   * Updates the target Lambda ARN for the data cleanup schedule.
   * Call this method after Lambda functions are created.
   */
  public updateDataCleanupTarget(lambdaArn: string): void {
    this.dataCleanupSchedule.addPropertyOverride('Target.Arn', lambdaArn);
  }

  /**
   * Updates the target Lambda ARN for the monthly report schedule.
   * Call this method after Lambda functions are created.
   */
  public updateMonthlyReportTarget(lambdaArn: string): void {
    this.monthlyReportSchedule.addPropertyOverride('Target.Arn', lambdaArn);
  }
}
