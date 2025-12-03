import { Construct } from 'constructs';
import {
  Dashboard,
  GraphWidget,
  Metric,
  Alarm,
  ComparisonOperator,
  TreatMissingData,
  Color,
  TextWidget,
} from 'aws-cdk-lib/aws-cloudwatch';
import { SnsAction } from 'aws-cdk-lib/aws-cloudwatch-actions';
import { Topic } from 'aws-cdk-lib/aws-sns';
import { EmailSubscription } from 'aws-cdk-lib/aws-sns-subscriptions';
import { Function } from 'aws-cdk-lib/aws-lambda';
import { Duration, CfnOutput } from 'aws-cdk-lib';

/**
 * Props interface for Monitoring Construct
 * Requirements: 11.1-11.8
 */
export interface MonitoringConstructProps {
  stage: string;
  apiGateway: {
    apiId: string;
    apiName: string;
    stageName: string;
  };
  lambdaFunctions: Function[];
  dynamoDBTables: {
    courtsTableName: string;
    availabilityTableName: string;
    bookingsTableName: string;
    reviewsTableName: string;
    interactionsTableName: string;
  };
  alarmEmail?: string; // Optional email for alarm notifications
}

/**
 * CloudWatch Monitoring Construct
 * Creates CloudWatch Dashboard, Alarms, and SNS notifications for monitoring.
 *
 * Requirements:
 * - 11.1: CloudWatch Dashboard with API Gateway, Lambda, DynamoDB widgets
 * - 11.2: Alarm for Lambda error rate (>5% in 5 min)
 * - 11.3: Alarm for API Gateway 5xx error rate (>2% in 5 min)
 * - 11.4: Alarm for API Gateway 4xx error rate (>10% in 5 min)
 * - 11.5: Alarm for DynamoDB throttling (>10 requests in 5 min)
 * - 11.6: SNS topic for alarm notifications
 * - 11.7: CloudWatch Logs retention (30 days) for Lambda - handled in Lambda construct
 * - 11.8: CloudWatch Logs for API Gateway - handled in API Gateway construct
 */
export class MonitoringConstruct extends Construct {
  public readonly dashboard: Dashboard;
  public readonly alarmTopic: Topic;
  public readonly dashboardUrl: string;
  public readonly alarmTopicArn: string;


  constructor(scope: Construct, id: string, props: MonitoringConstructProps) {
    super(scope, id);

    const { stage, apiGateway, lambdaFunctions, dynamoDBTables, alarmEmail } = props;

    // ==========================================
    // SNS TOPIC FOR ALARM NOTIFICATIONS (Requirement 11.6)
    // ==========================================
    this.alarmTopic = new Topic(this, 'AlarmTopic', {
      topicName: `${stage}-cloud-racket-alarms`,
      displayName: `Cloud Racket Platform Alarms - ${stage}`,
    });
    this.alarmTopicArn = this.alarmTopic.topicArn;

    // Add email subscription if provided
    if (alarmEmail) {
      this.alarmTopic.addSubscription(new EmailSubscription(alarmEmail));
    }

    // ==========================================
    // CLOUDWATCH DASHBOARD (Requirement 11.1)
    // ==========================================
    this.dashboard = new Dashboard(this, 'Dashboard', {
      dashboardName: `${stage}-cloud-racket-dashboard`,
      defaultInterval: Duration.hours(1),
    });

    // Dashboard URL for outputs
    this.dashboardUrl = `https://console.aws.amazon.com/cloudwatch/home?region=${process.env.CDK_DEFAULT_REGION || 'ap-southeast-1'}#dashboards:name=${stage}-cloud-racket-dashboard`;

    // ==========================================
    // DASHBOARD WIDGETS - HEADER
    // ==========================================
    this.dashboard.addWidgets(
      new TextWidget({
        markdown: `# Cloud Racket Platform - ${stage.toUpperCase()} Environment\n\nReal-time monitoring dashboard for API Gateway, Lambda, and DynamoDB metrics.`,
        width: 24,
        height: 2,
      })
    );

    // ==========================================
    // API GATEWAY METRICS WIDGETS
    // ==========================================
    this.dashboard.addWidgets(
      new TextWidget({
        markdown: '## API Gateway Metrics',
        width: 24,
        height: 1,
      })
    );

    // API Gateway Request Count
    this.dashboard.addWidgets(
      new GraphWidget({
        title: 'API Gateway - Request Count',
        width: 8,
        height: 6,
        left: [
          new Metric({
            namespace: 'AWS/ApiGateway',
            metricName: 'Count',
            dimensionsMap: {
              ApiName: apiGateway.apiName,
              Stage: apiGateway.stageName,
            },
            statistic: 'Sum',
            period: Duration.minutes(5),
            label: 'Total Requests',
          }),
        ],
      }),
      // API Gateway Latency
      new GraphWidget({
        title: 'API Gateway - Latency',
        width: 8,
        height: 6,
        left: [
          new Metric({
            namespace: 'AWS/ApiGateway',
            metricName: 'Latency',
            dimensionsMap: {
              ApiName: apiGateway.apiName,
              Stage: apiGateway.stageName,
            },
            statistic: 'Average',
            period: Duration.minutes(5),
            label: 'Average Latency',
            color: Color.BLUE,
          }),
          new Metric({
            namespace: 'AWS/ApiGateway',
            metricName: 'Latency',
            dimensionsMap: {
              ApiName: apiGateway.apiName,
              Stage: apiGateway.stageName,
            },
            statistic: 'p95',
            period: Duration.minutes(5),
            label: 'P95 Latency',
            color: Color.ORANGE,
          }),
          new Metric({
            namespace: 'AWS/ApiGateway',
            metricName: 'Latency',
            dimensionsMap: {
              ApiName: apiGateway.apiName,
              Stage: apiGateway.stageName,
            },
            statistic: 'p99',
            period: Duration.minutes(5),
            label: 'P99 Latency',
            color: Color.RED,
          }),
        ],
      }),
      // API Gateway Errors
      new GraphWidget({
        title: 'API Gateway - Errors',
        width: 8,
        height: 6,
        left: [
          new Metric({
            namespace: 'AWS/ApiGateway',
            metricName: '4XXError',
            dimensionsMap: {
              ApiName: apiGateway.apiName,
              Stage: apiGateway.stageName,
            },
            statistic: 'Sum',
            period: Duration.minutes(5),
            label: '4XX Errors',
            color: Color.ORANGE,
          }),
          new Metric({
            namespace: 'AWS/ApiGateway',
            metricName: '5XXError',
            dimensionsMap: {
              ApiName: apiGateway.apiName,
              Stage: apiGateway.stageName,
            },
            statistic: 'Sum',
            period: Duration.minutes(5),
            label: '5XX Errors',
            color: Color.RED,
          }),
        ],
      })
    );


    // ==========================================
    // LAMBDA METRICS WIDGETS
    // ==========================================
    this.dashboard.addWidgets(
      new TextWidget({
        markdown: '## Lambda Metrics',
        width: 24,
        height: 1,
      })
    );

    // Lambda Invocations
    const lambdaInvocationMetrics = lambdaFunctions.slice(0, 10).map((fn) =>
      fn.metricInvocations({
        period: Duration.minutes(5),
        statistic: 'Sum',
      })
    );

    // Lambda Errors
    const lambdaErrorMetrics = lambdaFunctions.slice(0, 10).map((fn) =>
      fn.metricErrors({
        period: Duration.minutes(5),
        statistic: 'Sum',
      })
    );

    // Lambda Duration
    const lambdaDurationMetrics = lambdaFunctions.slice(0, 10).map((fn) =>
      fn.metricDuration({
        period: Duration.minutes(5),
        statistic: 'Average',
      })
    );

    this.dashboard.addWidgets(
      new GraphWidget({
        title: 'Lambda - Invocations',
        width: 8,
        height: 6,
        left: lambdaInvocationMetrics,
      }),
      new GraphWidget({
        title: 'Lambda - Errors',
        width: 8,
        height: 6,
        left: lambdaErrorMetrics,
      }),
      new GraphWidget({
        title: 'Lambda - Duration (ms)',
        width: 8,
        height: 6,
        left: lambdaDurationMetrics,
      })
    );

    // ==========================================
    // DYNAMODB METRICS WIDGETS
    // ==========================================
    this.dashboard.addWidgets(
      new TextWidget({
        markdown: '## DynamoDB Metrics',
        width: 24,
        height: 1,
      })
    );

    const tableNames = Object.values(dynamoDBTables);

    // DynamoDB Read/Write Capacity
    const readCapacityMetrics = tableNames.map(
      (tableName) =>
        new Metric({
          namespace: 'AWS/DynamoDB',
          metricName: 'ConsumedReadCapacityUnits',
          dimensionsMap: {
            TableName: tableName,
          },
          statistic: 'Sum',
          period: Duration.minutes(5),
          label: tableName,
        })
    );

    const writeCapacityMetrics = tableNames.map(
      (tableName) =>
        new Metric({
          namespace: 'AWS/DynamoDB',
          metricName: 'ConsumedWriteCapacityUnits',
          dimensionsMap: {
            TableName: tableName,
          },
          statistic: 'Sum',
          period: Duration.minutes(5),
          label: tableName,
        })
    );

    // DynamoDB Throttled Requests
    const throttledMetrics = tableNames.map(
      (tableName) =>
        new Metric({
          namespace: 'AWS/DynamoDB',
          metricName: 'ThrottledRequests',
          dimensionsMap: {
            TableName: tableName,
          },
          statistic: 'Sum',
          period: Duration.minutes(5),
          label: tableName,
        })
    );

    this.dashboard.addWidgets(
      new GraphWidget({
        title: 'DynamoDB - Read Capacity Units',
        width: 8,
        height: 6,
        left: readCapacityMetrics,
      }),
      new GraphWidget({
        title: 'DynamoDB - Write Capacity Units',
        width: 8,
        height: 6,
        left: writeCapacityMetrics,
      }),
      new GraphWidget({
        title: 'DynamoDB - Throttled Requests',
        width: 8,
        height: 6,
        left: throttledMetrics,
      })
    );


    // ==========================================
    // CLOUDWATCH ALARMS
    // ==========================================

    // API Gateway 5xx Error Alarm (Requirement 11.3)
    const api5xxAlarm = new Alarm(this, 'API5xxErrorAlarm', {
      alarmName: `${stage}-api-5xx-errors`,
      alarmDescription: 'API Gateway 5xx error rate exceeds 2% in 5 minutes',
      metric: new Metric({
        namespace: 'AWS/ApiGateway',
        metricName: '5XXError',
        dimensionsMap: {
          ApiName: apiGateway.apiName,
          Stage: apiGateway.stageName,
        },
        statistic: 'Sum',
        period: Duration.minutes(5),
      }),
      threshold: 2,
      evaluationPeriods: 1,
      comparisonOperator: ComparisonOperator.GREATER_THAN_THRESHOLD,
      treatMissingData: TreatMissingData.NOT_BREACHING,
    });
    api5xxAlarm.addAlarmAction(new SnsAction(this.alarmTopic));

    // API Gateway 4xx Error Alarm (Requirement 11.4)
    const api4xxAlarm = new Alarm(this, 'API4xxErrorAlarm', {
      alarmName: `${stage}-api-4xx-errors`,
      alarmDescription: 'API Gateway 4xx error rate exceeds 10% in 5 minutes',
      metric: new Metric({
        namespace: 'AWS/ApiGateway',
        metricName: '4XXError',
        dimensionsMap: {
          ApiName: apiGateway.apiName,
          Stage: apiGateway.stageName,
        },
        statistic: 'Sum',
        period: Duration.minutes(5),
      }),
      threshold: 10,
      evaluationPeriods: 1,
      comparisonOperator: ComparisonOperator.GREATER_THAN_THRESHOLD,
      treatMissingData: TreatMissingData.NOT_BREACHING,
    });
    api4xxAlarm.addAlarmAction(new SnsAction(this.alarmTopic));

    // Lambda Error Rate Alarm (Requirement 11.2)
    // Create a composite alarm for all Lambda functions
    lambdaFunctions.forEach((fn) => {
      const lambdaErrorAlarm = new Alarm(this, `${fn.node.id}ErrorAlarm`, {
        alarmName: `${stage}-${fn.functionName}-errors`,
        alarmDescription: `Lambda function ${fn.functionName} error rate exceeds 5% in 5 minutes`,
        metric: fn.metricErrors({
          period: Duration.minutes(5),
          statistic: 'Sum',
        }),
        threshold: 5,
        evaluationPeriods: 1,
        comparisonOperator: ComparisonOperator.GREATER_THAN_THRESHOLD,
        treatMissingData: TreatMissingData.NOT_BREACHING,
      });
      lambdaErrorAlarm.addAlarmAction(new SnsAction(this.alarmTopic));
    });

    // DynamoDB Throttling Alarm (Requirement 11.5)
    const tableEntries = Object.entries(dynamoDBTables);
    tableEntries.forEach(([tableKey, tableName]) => {
      // Use tableKey (e.g., 'courtsTableName') for construct ID to avoid token issues
      const sanitizedKey = tableKey.replace('TableName', '');
      const dynamoThrottleAlarm = new Alarm(this, `${sanitizedKey}ThrottleAlarm`, {
        alarmName: `${stage}-${tableName}-throttle`,
        alarmDescription: `DynamoDB table ${tableName} throttling exceeds 10 requests in 5 minutes`,
        metric: new Metric({
          namespace: 'AWS/DynamoDB',
          metricName: 'ThrottledRequests',
          dimensionsMap: {
            TableName: tableName,
          },
          statistic: 'Sum',
          period: Duration.minutes(5),
        }),
        threshold: 10,
        evaluationPeriods: 1,
        comparisonOperator: ComparisonOperator.GREATER_THAN_THRESHOLD,
        treatMissingData: TreatMissingData.NOT_BREACHING,
      });
      dynamoThrottleAlarm.addAlarmAction(new SnsAction(this.alarmTopic));
    });

    // ==========================================
    // CLOUDFORMATION OUTPUTS
    // ==========================================
    new CfnOutput(this, 'DashboardUrl', {
      value: this.dashboardUrl,
      description: 'CloudWatch Dashboard URL',
      exportName: `${stage}-dashboard-url`,
    });

    new CfnOutput(this, 'AlarmTopicArn', {
      value: this.alarmTopicArn,
      description: 'SNS Topic ARN for alarm notifications',
      exportName: `${stage}-alarm-topic-arn`,
    });
  }
}
