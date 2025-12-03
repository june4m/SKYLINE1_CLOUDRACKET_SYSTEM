import * as cdk from 'aws-cdk-lib';
import { Template, Match } from 'aws-cdk-lib/assertions';
import { DynamoDBConstruct } from '../../lib/constructs/dynamodb-construct';

describe('DynamoDBConstruct', () => {
  let app: cdk.App;
  let stack: cdk.Stack;
  let template: Template;

  beforeEach(() => {
    app = new cdk.App();
    stack = new cdk.Stack(app, 'TestStack');
    new DynamoDBConstruct(stack, 'TestDynamoDB', {
      stage: 'test',
      removalPolicy: cdk.RemovalPolicy.DESTROY,
    });
    template = Template.fromStack(stack);
  });

  describe('Table Creation', () => {
    test('creates 5 DynamoDB tables', () => {
      template.resourceCountIs('AWS::DynamoDB::Table', 5);
    });

    test('Courts table has correct partition key', () => {
      template.hasResourceProperties('AWS::DynamoDB::Table', {
        TableName: 'test-courts',
        KeySchema: [{ AttributeName: 'courtId', KeyType: 'HASH' }],
      });
    });

    test('Availability table has correct partition key', () => {
      template.hasResourceProperties('AWS::DynamoDB::Table', {
        TableName: 'test-availability',
        KeySchema: [{ AttributeName: 'availabilityId', KeyType: 'HASH' }],
      });
    });

    test('Bookings table has correct partition key', () => {
      template.hasResourceProperties('AWS::DynamoDB::Table', {
        TableName: 'test-bookings',
        KeySchema: [{ AttributeName: 'bookingId', KeyType: 'HASH' }],
      });
    });

    test('Reviews table has correct partition key', () => {
      template.hasResourceProperties('AWS::DynamoDB::Table', {
        TableName: 'test-reviews',
        KeySchema: [{ AttributeName: 'reviewId', KeyType: 'HASH' }],
      });
    });

    test('Interactions table has correct partition key', () => {
      template.hasResourceProperties('AWS::DynamoDB::Table', {
        TableName: 'test-interactions',
        KeySchema: [{ AttributeName: 'interactionId', KeyType: 'HASH' }],
      });
    });

    test('all tables use on-demand billing', () => {
      template.hasResourceProperties('AWS::DynamoDB::Table', {
        BillingMode: 'PAY_PER_REQUEST',
      });
    });

    test('all tables have encryption enabled', () => {
      template.hasResourceProperties('AWS::DynamoDB::Table', {
        SSESpecification: { SSEEnabled: true },
      });
    });
  });

  describe('GSI Configurations', () => {
    test('Courts table has ownerId GSI', () => {
      template.hasResourceProperties('AWS::DynamoDB::Table', {
        TableName: 'test-courts',
        GlobalSecondaryIndexes: Match.arrayWith([
          Match.objectLike({
            IndexName: 'ownerId-index',
            KeySchema: [{ AttributeName: 'ownerId', KeyType: 'HASH' }],
            Projection: { ProjectionType: 'ALL' },
          }),
        ]),
      });
    });

    test('Availability table has courtId GSI with date sort key', () => {
      template.hasResourceProperties('AWS::DynamoDB::Table', {
        TableName: 'test-availability',
        GlobalSecondaryIndexes: Match.arrayWith([
          Match.objectLike({
            IndexName: 'courtId-index',
            KeySchema: Match.arrayWith([
              { AttributeName: 'courtId', KeyType: 'HASH' },
              { AttributeName: 'date', KeyType: 'RANGE' },
            ]),
          }),
        ]),
      });
    });

    test('Bookings table has userId and courtId GSIs', () => {
      template.hasResourceProperties('AWS::DynamoDB::Table', {
        TableName: 'test-bookings',
        GlobalSecondaryIndexes: Match.arrayWith([
          Match.objectLike({
            IndexName: 'userId-index',
            KeySchema: Match.arrayWith([
              { AttributeName: 'userId', KeyType: 'HASH' },
            ]),
          }),
          Match.objectLike({
            IndexName: 'courtId-index',
            KeySchema: Match.arrayWith([
              { AttributeName: 'courtId', KeyType: 'HASH' },
            ]),
          }),
        ]),
      });
    });

    test('Reviews table has userId and courtId GSIs', () => {
      template.hasResourceProperties('AWS::DynamoDB::Table', {
        TableName: 'test-reviews',
        GlobalSecondaryIndexes: Match.arrayWith([
          Match.objectLike({
            IndexName: 'userId-index',
            KeySchema: [{ AttributeName: 'userId', KeyType: 'HASH' }],
          }),
          Match.objectLike({
            IndexName: 'courtId-index',
            KeySchema: Match.arrayWith([
              { AttributeName: 'courtId', KeyType: 'HASH' },
            ]),
          }),
        ]),
      });
    });

    test('Interactions table has userId GSI with timestamp sort key', () => {
      template.hasResourceProperties('AWS::DynamoDB::Table', {
        TableName: 'test-interactions',
        GlobalSecondaryIndexes: Match.arrayWith([
          Match.objectLike({
            IndexName: 'userId-index',
            KeySchema: Match.arrayWith([
              { AttributeName: 'userId', KeyType: 'HASH' },
              { AttributeName: 'timestamp', KeyType: 'RANGE' },
            ]),
          }),
        ]),
      });
    });
  });

  describe('Stream Configurations', () => {
    test('Bookings table has DynamoDB Streams enabled with NEW_AND_OLD_IMAGES', () => {
      template.hasResourceProperties('AWS::DynamoDB::Table', {
        TableName: 'test-bookings',
        StreamSpecification: {
          StreamViewType: 'NEW_AND_OLD_IMAGES',
        },
      });
    });

    test('Reviews table has DynamoDB Streams enabled with NEW_AND_OLD_IMAGES', () => {
      template.hasResourceProperties('AWS::DynamoDB::Table', {
        TableName: 'test-reviews',
        StreamSpecification: {
          StreamViewType: 'NEW_AND_OLD_IMAGES',
        },
      });
    });
  });
});
