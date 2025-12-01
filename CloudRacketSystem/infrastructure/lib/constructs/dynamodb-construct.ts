import { Construct } from 'constructs';
import {
  Table,
  AttributeType,
  BillingMode,
  TableEncryption,
  ProjectionType,
  StreamViewType,
} from 'aws-cdk-lib/aws-dynamodb';
import { RemovalPolicy } from 'aws-cdk-lib';

export interface DynamoDBConstructProps {
  stage: string;
  removalPolicy: RemovalPolicy;
}

export class DynamoDBConstruct extends Construct {
  public readonly courtsTable: Table;
  public readonly availabilityTable: Table;
  public readonly bookingsTable: Table;
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

    // Courts Table
    this.courtsTable = new Table(this, 'CourtsTable', {
      tableName: `${stage}-courts`,
      partitionKey: { name: 'courtId', type: AttributeType.STRING },
      billingMode: BillingMode.PAY_PER_REQUEST,
      encryption: TableEncryption.AWS_MANAGED,
      removalPolicy,
    });

    this.courtsTable.addGlobalSecondaryIndex({
      indexName: 'ownerId-index',
      partitionKey: { name: 'ownerId', type: AttributeType.STRING },
      projectionType: ProjectionType.ALL,
    });

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

    // Bookings Table (with streams for email notifications)
    this.bookingsTable = new Table(this, 'BookingsTable', {
      tableName: `${stage}-bookings`,
      partitionKey: { name: 'bookingId', type: AttributeType.STRING },
      billingMode: BillingMode.PAY_PER_REQUEST,
      encryption: TableEncryption.AWS_MANAGED,
      removalPolicy,
      stream: StreamViewType.NEW_AND_OLD_IMAGES,
    });

    this.bookingsTable.addGlobalSecondaryIndex({
      indexName: 'userId-index',
      partitionKey: { name: 'userId', type: AttributeType.STRING },
      sortKey: { name: 'createdAt', type: AttributeType.STRING },
      projectionType: ProjectionType.ALL,
    });

    this.bookingsTable.addGlobalSecondaryIndex({
      indexName: 'courtId-index',
      partitionKey: { name: 'courtId', type: AttributeType.STRING },
      sortKey: { name: 'date', type: AttributeType.STRING },
      projectionType: ProjectionType.ALL,
    });

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
    this.courtsTableName = this.courtsTable.tableName;
    this.availabilityTableName = this.availabilityTable.tableName;
    this.bookingsTableName = this.bookingsTable.tableName;
    this.reviewsTableName = this.reviewsTable.tableName;
    this.interactionsTableName = this.interactionsTable.tableName;

    // Export table ARNs
    this.courtsTableArn = this.courtsTable.tableArn;
    this.availabilityTableArn = this.availabilityTable.tableArn;
    this.bookingsTableArn = this.bookingsTable.tableArn;
    this.reviewsTableArn = this.reviewsTable.tableArn;
    this.interactionsTableArn = this.interactionsTable.tableArn;

    // Export stream ARNs
    this.bookingsStreamArn = this.bookingsTable.tableStreamArn!;
    this.reviewsStreamArn = this.reviewsTable.tableStreamArn!;
  }
}
