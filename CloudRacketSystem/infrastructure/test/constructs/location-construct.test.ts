import * as cdk from 'aws-cdk-lib';
import { Template } from 'aws-cdk-lib/assertions';
import { LocationConstruct } from '../../lib/constructs/location-construct';

describe('LocationConstruct', () => {
  let app: cdk.App;
  let stack: cdk.Stack;
  let template: Template;
  let construct: LocationConstruct;

  beforeEach(() => {
    app = new cdk.App();
    stack = new cdk.Stack(app, 'TestStack', {
      env: { account: '123456789012', region: 'ap-southeast-1' },
    });
    construct = new LocationConstruct(stack, 'TestLocation', {
      stage: 'test',
    });
    template = Template.fromStack(stack);
  });

  describe('Place Index Creation', () => {
    test('creates 1 Place Index', () => {
      template.resourceCountIs('AWS::Location::PlaceIndex', 1);
    });

    test('Place Index has correct name with stage prefix', () => {
      template.hasResourceProperties('AWS::Location::PlaceIndex', {
        IndexName: 'test-cloud-racket-places',
      });
    });

    test('Place Index uses Esri as data source', () => {
      template.hasResourceProperties('AWS::Location::PlaceIndex', {
        DataSource: 'Esri',
      });
    });

    test('Place Index has SingleUse intended use for cost optimization', () => {
      template.hasResourceProperties('AWS::Location::PlaceIndex', {
        DataSourceConfiguration: {
          IntendedUse: 'SingleUse',
        },
      });
    });

    test('Place Index has RequestBasedUsage pricing plan', () => {
      template.hasResourceProperties('AWS::Location::PlaceIndex', {
        PricingPlan: 'RequestBasedUsage',
      });
    });

    test('Place Index has description', () => {
      template.hasResourceProperties('AWS::Location::PlaceIndex', {
        Description: 'Place index for finding nearby badminton courts',
      });
    });
  });

  describe('Construct Outputs', () => {
    test('exposes placeIndexName', () => {
      expect(construct.placeIndexName).toBe('test-cloud-racket-places');
    });

    test('exposes placeIndexArn with correct format', () => {
      expect(construct.placeIndexArn).toBe(
        'arn:aws:geo:ap-southeast-1:123456789012:place-index/test-cloud-racket-places'
      );
    });
  });
});
