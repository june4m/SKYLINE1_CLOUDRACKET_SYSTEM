import { Construct } from 'constructs';
import { Rule, Schedule } from 'aws-cdk-lib/aws-events';
import { LambdaFunction } from 'aws-cdk-lib/aws-events-targets';
import { Function } from 'aws-cdk-lib/aws-lambda';
import { Duration } from 'aws-cdk-lib';

/**
 * Props interface for EventBridge Construct
 * Requirements: 9.1, 9.2, 9.3, 9.4, 9.5
 */
export interface EventBridgeConstructProps {
  stage: string;
  lambdaFunctions: {
    bookingReminder: Function;
    cleanup: Function;
    retraining?: Function; // Optional - for Personalize
    monthlyReport: Function;
  };
}

/**
 * EventBridge Construct
 * Creates EventBridge scheduled rules for automation tasks.
 * 
 * Requirements:
 * - 9.1: Create rule to trigger booking reminder Lambda every hour
 * - 9.2: Create rule to trigger cleanup Lambda weekly on Sunday at 2 AM
 * - 9.3: Create rule to trigger Personalize retraining Lambda weekly on Sunday at 3 AM (optional)
 * - 9.4: Create rule to trigger monthly report Lambda on 1st day of each month at 4 AM
 * - 9.5: Grant EventBridge permission to invoke target Lambda functions
 */
export class EventBridgeConstruct extends Construct {
  // Rules
  public readonly bookingReminderRule: Rule;
  public readonly cleanupRule: Rule;
  public readonly retrainingRule?: Rule;
  public readonly monthlyReportRule: Rule;

  // Rule ARNs
  public readonly bookingReminderRuleArn: string;
  public readonly cleanupRuleArn: string;
  public readonly retrainingRuleArn?: string;
  public readonly monthlyReportRuleArn: string;

  // Rule names
  public readonly bookingReminderRuleName: string;
  public readonly cleanupRuleName: string;
  public readonly retrainingRuleName?: string;
  public readonly monthlyReportRuleName: string;

  constructor(scope: Construct, id: string, props: EventBridgeConstructProps) {
    super(scope, id);

    const { stage, lambdaFunctions } = props;

    // ==========================================
    // BOOKING REMINDER RULE (Requirement 9.1)
    // Triggers every hour to send reminder emails 24 hours before scheduled booking time
    // ==========================================
    this.bookingReminderRuleName = `${stage}-booking-reminder-rule`;
    this.bookingReminderRule = new Rule(this, 'BookingReminderRule', {
      ruleName: this.bookingReminderRuleName,
      description: 'Send booking reminder emails every hour for bookings 24 hours away',
      schedule: Schedule.rate(Duration.hours(1)),
      enabled: true,
    });

    // Add Lambda target with retry policy (Requirement 9.5)
    this.bookingReminderRule.addTarget(
      new LambdaFunction(lambdaFunctions.bookingReminder, {
        retryAttempts: 2,
        maxEventAge: Duration.hours(1),
      })
    );
    this.bookingReminderRuleArn = this.bookingReminderRule.ruleArn;

    // ==========================================
    // CLEANUP RULE (Requirement 9.2)
    // Triggers weekly on Sunday at 2 AM UTC to clean up expired bookings and old data
    // ==========================================
    this.cleanupRuleName = `${stage}-cleanup-rule`;
    this.cleanupRule = new Rule(this, 'CleanupRule', {
      ruleName: this.cleanupRuleName,
      description: 'Clean up expired bookings and old data weekly on Sunday at 2 AM UTC',
      schedule: Schedule.cron({
        minute: '0',
        hour: '2',
        weekDay: 'SUN',
      }),
      enabled: true,
    });

    // Add Lambda target with retry policy (Requirement 9.5)
    this.cleanupRule.addTarget(
      new LambdaFunction(lambdaFunctions.cleanup, {
        retryAttempts: 2,
        maxEventAge: Duration.hours(2),
      })
    );
    this.cleanupRuleArn = this.cleanupRule.ruleArn;

    // ==========================================
    // PERSONALIZE RETRAINING RULE (Requirement 9.3 - Optional)
    // Triggers weekly on Sunday at 3 AM UTC to retrain recommendation model
    // Only created if retraining Lambda function is provided
    // ==========================================
    if (lambdaFunctions.retraining) {
      this.retrainingRuleName = `${stage}-personalize-retraining-rule`;
      this.retrainingRule = new Rule(this, 'RetrainingRule', {
        ruleName: this.retrainingRuleName,
        description: 'Retrain Amazon Personalize recommendation model weekly on Sunday at 3 AM UTC',
        schedule: Schedule.cron({
          minute: '0',
          hour: '3',
          weekDay: 'SUN',
        }),
        enabled: true,
      });

      // Add Lambda target with retry policy (Requirement 9.5)
      this.retrainingRule.addTarget(
        new LambdaFunction(lambdaFunctions.retraining, {
          retryAttempts: 2,
          maxEventAge: Duration.hours(2),
        })
      );
      this.retrainingRuleArn = this.retrainingRule.ruleArn;
    }

    // ==========================================
    // MONTHLY REPORT RULE (Requirement 9.4)
    // Triggers on the 1st day of each month at 4 AM UTC to generate monthly analytics report
    // ==========================================
    this.monthlyReportRuleName = `${stage}-monthly-report-rule`;
    this.monthlyReportRule = new Rule(this, 'MonthlyReportRule', {
      ruleName: this.monthlyReportRuleName,
      description: 'Generate monthly analytics report on the 1st day of each month at 4 AM UTC',
      schedule: Schedule.cron({
        minute: '0',
        hour: '4',
        day: '1',
      }),
      enabled: true,
    });

    // Add Lambda target with retry policy (Requirement 9.5)
    this.monthlyReportRule.addTarget(
      new LambdaFunction(lambdaFunctions.monthlyReport, {
        retryAttempts: 2,
        maxEventAge: Duration.hours(4),
      })
    );
    this.monthlyReportRuleArn = this.monthlyReportRule.ruleArn;
  }
}
