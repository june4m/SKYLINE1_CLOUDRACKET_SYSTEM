import * as cdk from 'aws-cdk-lib';
import { Template } from 'aws-cdk-lib/assertions';
import { LambdaLayerConstruct } from '../../lib/constructs/lambda-layer-construct';

describe('LambdaLayerConstruct', () => {
  let app: cdk.App;
  let stack: cdk.Stack;
  let template: Template;

  beforeEach(() => {
    app = new cdk.App();
    stack = new cdk.Stack(app, 'TestStack');
    new LambdaLayerConstruct(stack, 'TestLambdaLayers', {
      stage: 'test',
    });
    template = Template.fromStack(stack);
  });

  describe('Layer Creation', () => {
    test('creates 2 Lambda Layers', () => {
      template.resourceCountIs('AWS::Lambda::LayerVersion', 2);
    });

    test('creates Common Layer with correct name', () => {
      template.hasResourceProperties('AWS::Lambda::LayerVersion', {
        LayerName: 'test-cloud-racket-common',
        CompatibleRuntimes: ['nodejs18.x'],
      });
    });

    test('creates Utils Layer with correct name', () => {
      template.hasResourceProperties('AWS::Lambda::LayerVersion', {
        LayerName: 'test-cloud-racket-utils',
        CompatibleRuntimes: ['nodejs18.x'],
      });
    });
  });

  describe('Layer Configuration', () => {
    test('Common Layer has description', () => {
      template.hasResourceProperties('AWS::Lambda::LayerVersion', {
        LayerName: 'test-cloud-racket-common',
        Description: 'Common dependencies: AWS SDK v3, lodash, uuid, response helpers, logger',
      });
    });

    test('Utils Layer has description', () => {
      template.hasResourceProperties('AWS::Lambda::LayerVersion', {
        LayerName: 'test-cloud-racket-utils',
        Description: 'Utility functions: validation, formatting, error handling, pagination, geo utils',
      });
    });

    test('Layers use Node.js 18.x runtime', () => {
      const resources = template.findResources('AWS::Lambda::LayerVersion');
      const layerKeys = Object.keys(resources);
      
      layerKeys.forEach((key) => {
        expect(resources[key].Properties.CompatibleRuntimes).toContain('nodejs18.x');
      });
    });
  });
});
