import { Construct } from 'constructs';
import {
  Table,
  AttributeType,
  BillingMode,
  TableEncryption,
  ProjectionType,
  StreamViewType,
  ITable,
} from 'aws-cdk-lib/aws-dynamodb';
import { RemovalPolicy, Stack } from 'aws-cdk-lib';

export interface DynamoDBConstructProps {
  stage: string;
  removalPolicy: RemovalPolicy;
}

export class DynamoDBConstruct extends Construct {
  public readonly courtsTable: ITable;
  public readonly availabilityTable: Table;
  public readonly bookingsTable: ITable;
  public readonly reviewsTable: Table;
  public readonly interactionsTable: Table;

  // Table names for Lambda environment variables
  public readonly courtsTableName: string;
  public readonly availabilityTableName: string;
  public readonly bookingsTableName: string;
  public readonly reviewsTableName: string;
  public readonly interactionsTableName: string;

  // Table ARNs for IAM permissions
  public readonly courtsTableArn: string;
  public readonly availabilityTableArn: string;
  public readonly bookingsTableArn: string;
  public readonly reviewsTableArn: string;
  public readonly interactionsTableArn: string;

  // Stream ARNs for Lambda event source mappings
  public readonly bookingsStreamArn: string;
  public readonly reviewsStreamArn: string;

  constructor(scope: Construct, id: string, props: DynamoDBConstructProps) {
    super(scope, id);

    const { stage, removalPolicy } = props;

    // Courts Table - Import existing table
    const accountId = Stack.of(this).account;
    const region = Stack.of(this).region;
    this.courtsTable = Table.fromTableArn(
      this,
      'CourtsTable',
      `arn:aws:dynamodb:${region}:${accountId}:table/CourtData`
    );

    // Availability Table
    this.availabilityTable = new Table(this, 'AvailabilityTable', {
      tableName: `${stage}-availability`,
      partitionKey: { name: 'availabilityId', type: AttributeType.STRING },
      billingMode: BillingMode.PAY_PER_REQUEST,
      encryption: TableEncryption.AWS_MANAGED,
      removalPolicy,
    });

    this.availabilityTable.addGlobalSecondaryIndex({
      indexName: 'courtId-index',
      partitionKey: { name: 'courtId', type: AttributeType.STRING },
      sortKey: { name: 'date', type: AttributeType.STRING },
      projectionType: ProjectionType.ALL,
    });

    // Bookings Table - Import existing table
    this.bookingsTable = Table.fromTableArn(
      this,
      'BookingsTable',
      `arn:aws:dynamodb:${region}:${accountId}:table/Booking`
    ) as Table;

    // Reviews Table (with streams for rating aggregation)
    this.reviewsTable = new Table(this, 'ReviewsTable', {
      tableName: `${stage}-reviews`,
      partitionKey: { name: 'reviewId', type: AttributeType.STRING },
      billingMode: BillingMode.PAY_PER_REQUEST,
      encryption: TableEncryption.AWS_MANAGED,
      removalPolicy,
      stream: StreamViewType.NEW_AND_OLD_IMAGES,
    });

    this.reviewsTable.addGlobalSecondaryIndex({
      indexName: 'userId-index',
      partitionKey: { name: 'userId', type: AttributeType.STRING },
      projectionType: ProjectionType.ALL,
    });

    this.reviewsTable.addGlobalSecondaryIndex({
      indexName: 'courtId-index',
      partitionKey: { name: 'courtId', type: AttributeType.STRING },
      sortKey: { name: 'createdAt', type: AttributeType.STRING },
      projectionType: ProjectionType.ALL,
    });

    // Interactions Table
    this.interactionsTable = new Table(this, 'InteractionsTable', {
      tableName: `${stage}-interactions`,
      partitionKey: { name: 'interactionId', type: AttributeType.STRING },
      billingMode: BillingMode.PAY_PER_REQUEST,
      encryption: TableEncryption.AWS_MANAGED,
      removalPolicy,
    });

    this.interactionsTable.addGlobalSecondaryIndex({
      indexName: 'userId-index',
      partitionKey: { name: 'userId', type: AttributeType.STRING },
      sortKey: { name: 'timestamp', type: AttributeType.NUMBER },
      projectionType: ProjectionType.ALL,
    });

    // Export table names
    this.courtsTableName = 'CourtData';  // Use existing table name
    this.availabilityTableName = this.availabilityTable.tableName;
    this.bookingsTableName = 'Booking';  // Use existing table name
    this.reviewsTableName = this.reviewsTable.tableName;
    this.interactionsTableName = this.interactionsTable.tableName;

    // Export table ARNs
    this.courtsTableArn = this.courtsTable.tableArn;
    this.availabilityTableArn = this.availabilityTable.tableArn;
    this.bookingsTableArn = this.bookingsTable.tableArn;
    this.reviewsTableArn = this.reviewsTable.tableArn;
    this.interactionsTableArn = this.interactionsTable.tableArn;

    // Export stream ARNs (empty for imported tables without streams)
    this.bookingsStreamArn = '';  // Imported table - no stream
    this.reviewsStreamArn = this.reviewsTable.tableStreamArn!;
  }
}
