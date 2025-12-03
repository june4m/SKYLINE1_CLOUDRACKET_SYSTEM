import * as cdk from 'aws-cdk-lib';
import { Template, Match } from 'aws-cdk-lib/assertions';
import { S3Construct } from '../../lib/constructs/s3-construct';

describe('S3Construct', () => {
  let app: cdk.App;
  let stack: cdk.Stack;
  let template: Template;

  beforeEach(() => {
    app = new cdk.App();
    stack = new cdk.Stack(app, 'TestStack');
    new S3Construct(stack, 'TestS3', {
      stage: 'test',
      removalPolicy: cdk.RemovalPolicy.DESTROY,
    });
    template = Template.fromStack(stack);
  });

  describe('Bucket Creation', () => {
    test('creates 2 S3 buckets', () => {
      template.resourceCountIs('AWS::S3::Bucket', 2);
    });

    test('creates Images bucket with correct name', () => {
      template.hasResourceProperties('AWS::S3::Bucket', {
        BucketName: 'test-cloud-racket-images',
      });
    });

    test('creates Reports bucket with correct name', () => {
      template.hasResourceProperties('AWS::S3::Bucket', {
        BucketName: 'test-cloud-racket-reports',
      });
    });
  });

  describe('Encryption Settings', () => {
    test('Images bucket has S3 managed encryption', () => {
      template.hasResourceProperties('AWS::S3::Bucket', {
        BucketName: 'test-cloud-racket-images',
        BucketEncryption: {
          ServerSideEncryptionConfiguration: [
            {
              ServerSideEncryptionByDefault: {
                SSEAlgorithm: 'AES256',
              },
            },
          ],
        },
      });
    });

    test('Reports bucket has S3 managed encryption', () => {
      template.hasResourceProperties('AWS::S3::Bucket', {
        BucketName: 'test-cloud-racket-reports',
        BucketEncryption: {
          ServerSideEncryptionConfiguration: [
            {
              ServerSideEncryptionByDefault: {
                SSEAlgorithm: 'AES256',
              },
            },
          ],
        },
      });
    });
  });

  describe('Lifecycle Policies', () => {
    test('Images bucket transitions to Glacier after 90 days', () => {
      template.hasResourceProperties('AWS::S3::Bucket', {
        BucketName: 'test-cloud-racket-images',
        LifecycleConfiguration: {
          Rules: Match.arrayWith([
            Match.objectLike({
              Id: 'TransitionToGlacier',
              Status: 'Enabled',
              Transitions: [
                {
                  StorageClass: 'GLACIER',
                  TransitionInDays: 90,
                },
              ],
            }),
          ]),
        },
      });
    });

    test('Reports bucket expires after 365 days', () => {
      template.hasResourceProperties('AWS::S3::Bucket', {
        BucketName: 'test-cloud-racket-reports',
        LifecycleConfiguration: {
          Rules: Match.arrayWith([
            Match.objectLike({
              Id: 'DeleteOldReports',
              Status: 'Enabled',
              ExpirationInDays: 365,
            }),
          ]),
        },
      });
    });
  });

  describe('Images Bucket Configuration', () => {
    test('Images bucket has CORS configured', () => {
      template.hasResourceProperties('AWS::S3::Bucket', {
        BucketName: 'test-cloud-racket-images',
        CorsConfiguration: {
          CorsRules: Match.arrayWith([
            Match.objectLike({
              AllowedMethods: Match.arrayWith(['GET', 'PUT', 'POST']),
              AllowedOrigins: ['*'],
              AllowedHeaders: ['*'],
              MaxAge: 3000,
            }),
          ]),
        },
      });
    });

    test('Images bucket is not versioned', () => {
      template.hasResourceProperties('AWS::S3::Bucket', {
        BucketName: 'test-cloud-racket-images',
        VersioningConfiguration: Match.absent(),
      });
    });
  });

  describe('Reports Bucket Configuration', () => {
    test('Reports bucket has versioning enabled', () => {
      template.hasResourceProperties('AWS::S3::Bucket', {
        BucketName: 'test-cloud-racket-reports',
        VersioningConfiguration: {
          Status: 'Enabled',
        },
      });
    });

    test('Reports bucket blocks all public access', () => {
      template.hasResourceProperties('AWS::S3::Bucket', {
        BucketName: 'test-cloud-racket-reports',
        PublicAccessBlockConfiguration: {
          BlockPublicAcls: true,
          BlockPublicPolicy: true,
          IgnorePublicAcls: true,
          RestrictPublicBuckets: true,
        },
      });
    });
  });
});
