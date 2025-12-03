import { Construct } from 'constructs';
import { LayerVersion, Runtime, Code } from 'aws-cdk-lib/aws-lambda';
import * as path from 'path';

export interface LambdaLayerConstructProps {
  stage: string;
}

/**
 * Lambda Layer Construct
 * Creates Lambda Layers for common dependencies and business logic utilities.
 * 
 * Requirements: 15.1, 15.2, 15.3, 15.4, 15.5
 */
export class LambdaLayerConstruct extends Construct {
  /**
   * Common Layer - AWS SDK and shared utilities
   * Contains: AWS SDK v3 clients, uuid, lodash, response helpers, logger
   */
  public readonly commonLayer: LayerVersion;

  /**
   * Utils Layer - Business logic utilities
   * Contains: validators, date utils, string utils, error classes, pagination, geo utils
   */
  public readonly utilsLayer: LayerVersion;

  // Layer ARNs for reference
  public readonly commonLayerArn: string;
  public readonly utilsLayerArn: string;

  constructor(scope: Construct, id: string, props: LambdaLayerConstructProps) {
    super(scope, id);

    const { stage } = props;

    // Common Layer - AWS SDK and shared utilities
    this.commonLayer = new LayerVersion(this, 'CommonLayer', {
      layerVersionName: `${stage}-cloud-racket-common`,
      code: Code.fromAsset(path.join(__dirname, '../../lambda-layers/common')),
      compatibleRuntimes: [Runtime.NODEJS_18_X],
      description: 'Common dependencies: AWS SDK v3, lodash, uuid, response helpers, logger',
    });

    // Utils Layer - Business logic utilities
    this.utilsLayer = new LayerVersion(this, 'UtilsLayer', {
      layerVersionName: `${stage}-cloud-racket-utils`,
      code: Code.fromAsset(path.join(__dirname, '../../lambda-layers/utils')),
      compatibleRuntimes: [Runtime.NODEJS_18_X],
      description: 'Utility functions: validation, formatting, error handling, pagination, geo utils',
    });

    // Export Layer ARNs
    this.commonLayerArn = this.commonLayer.layerVersionArn;
    this.utilsLayerArn = this.utilsLayer.layerVersionArn;
  }
}
