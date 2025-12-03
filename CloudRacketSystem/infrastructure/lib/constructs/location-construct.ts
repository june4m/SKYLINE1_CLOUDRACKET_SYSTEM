import { Construct } from 'constructs';
import { CfnPlaceIndex } from 'aws-cdk-lib/aws-location';
import { Stack } from 'aws-cdk-lib';

export interface LocationConstructProps {
  stage: string;
}

export class LocationConstruct extends Construct {
  public readonly placeIndex: CfnPlaceIndex;

  // Place Index name for Lambda environment variables
  public readonly placeIndexName: string;

  // Place Index ARN for IAM permissions
  public readonly placeIndexArn: string;

  constructor(scope: Construct, id: string, props: LocationConstructProps) {
    super(scope, id);

    const { stage } = props;

    // Create Place Index for geospatial searches
    // Using Esri as data provider - provides good coverage for Vietnam
    this.placeIndex = new CfnPlaceIndex(this, 'PlaceIndex', {
      indexName: `${stage}-cloud-racket-places`,
      dataSource: 'Esri',
      dataSourceConfiguration: {
        intendedUse: 'SingleUse', // Cost optimization - for one-time searches
      },
      description: 'Place index for finding nearby badminton courts',
      pricingPlan: 'RequestBasedUsage',
    });

    // Export Place Index name
    this.placeIndexName = this.placeIndex.indexName;

    // Export Place Index ARN
    // Format: arn:aws:geo:region:account-id:place-index/index-name
    this.placeIndexArn = `arn:aws:geo:${Stack.of(this).region}:${Stack.of(this).account}:place-index/${this.placeIndex.indexName}`;
  }
}
