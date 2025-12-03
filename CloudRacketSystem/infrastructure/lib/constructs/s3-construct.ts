import { Construct } from 'constructs';
import {
  Bucket,
  BucketEncryption,
  BlockPublicAccess,
  HttpMethods,
  StorageClass,
} from 'aws-cdk-lib/aws-s3';
import { RemovalPolicy, Duration } from 'aws-cdk-lib';

export interface S3ConstructProps {
  stage: string;
  removalPolicy: RemovalPolicy;
}

export class S3Construct extends Construct {
  public readonly imagesBucket: Bucket;
  public readonly reportsBucket: Bucket;

  // Bucket names for Lambda environment variables
  public readonly imagesBucketName: string;
  public readonly reportsBucketName: string;

  // Bucket ARNs for IAM permissions
  public readonly imagesBucketArn: string;
  public readonly reportsBucketArn: string;

  constructor(scope: Construct, id: string, props: S3ConstructProps) {
    super(scope, id);

    const { stage, removalPolicy } = props;

    // Images Bucket - Public read access for court images
    this.imagesBucket = new Bucket(this, 'ImagesBucket', {
      bucketName: `${stage}-cloud-racket-images`,
      encryption: BucketEncryption.S3_MANAGED,
      versioned: false,
      publicReadAccess: true,
      blockPublicAccess: new BlockPublicAccess({
        blockPublicAcls: false,
        blockPublicPolicy: false,
        ignorePublicAcls: false,
        restrictPublicBuckets: false,
      }),
      cors: [
        {
          allowedMethods: [
            HttpMethods.GET,
            HttpMethods.PUT,
            HttpMethods.POST,
          ],
          allowedOrigins: ['*'],
          allowedHeaders: ['*'],
          maxAge: 3000,
        },
      ],
      lifecycleRules: [
        {
          id: 'TransitionToGlacier',
          enabled: true,
          transitions: [
            {
              storageClass: StorageClass.GLACIER,
              transitionAfter: Duration.days(90),
            },
          ],
        },
      ],
      removalPolicy,
      autoDeleteObjects: removalPolicy === RemovalPolicy.DESTROY,
    });

    // Reports Bucket - Private access with versioning
    this.reportsBucket = new Bucket(this, 'ReportsBucket', {
      bucketName: `${stage}-cloud-racket-reports`,
      encryption: BucketEncryption.S3_MANAGED,
      versioned: true,
      publicReadAccess: false,
      blockPublicAccess: BlockPublicAccess.BLOCK_ALL,
      lifecycleRules: [
        {
          id: 'DeleteOldReports',
          enabled: true,
          expiration: Duration.days(365),
        },
      ],
      removalPolicy,
      autoDeleteObjects: removalPolicy === RemovalPolicy.DESTROY,
    });

    // Export bucket names
    this.imagesBucketName = this.imagesBucket.bucketName;
    this.reportsBucketName = this.reportsBucket.bucketName;

    // Export bucket ARNs
    this.imagesBucketArn = this.imagesBucket.bucketArn;
    this.reportsBucketArn = this.reportsBucket.bucketArn;
  }
}
