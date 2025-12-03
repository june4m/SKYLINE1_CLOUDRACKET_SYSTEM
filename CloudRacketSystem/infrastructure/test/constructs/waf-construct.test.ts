import * as cdk from 'aws-cdk-lib';
import { Template, Match } from 'aws-cdk-lib/assertions';
import { WAFConstruct } from '../../lib/constructs/waf-construct';

describe('WAFConstruct', () => {
  let app: cdk.App;
  let stack: cdk.Stack;
  let template: Template;

  const defaultProps = {
    stage: 'test',
    apiGatewayArn: 'arn:aws:apigateway:ap-southeast-1::/restapis/abc123/stages/test',
  };

  beforeEach(() => {
    app = new cdk.App();
    stack = new cdk.Stack(app, 'TestStack');
    new WAFConstruct(stack, 'TestWAF', defaultProps);
    template = Template.fromStack(stack);
  });

  describe('Web ACL Creation', () => {
    test('creates Web ACL with correct name', () => {
      template.hasResourceProperties('AWS::WAFv2::WebACL', {
        Name: 'test-cloud-racket-waf',
      });
    });

    test('creates Web ACL with REGIONAL scope for API Gateway', () => {
      template.hasResourceProperties('AWS::WAFv2::WebACL', {
        Scope: 'REGIONAL',
      });
    });

    test('Web ACL has default allow action', () => {
      template.hasResourceProperties('AWS::WAFv2::WebACL', {
        DefaultAction: {
          Allow: {},
        },
      });
    });

    test('Web ACL has CloudWatch metrics enabled', () => {
      template.hasResourceProperties('AWS::WAFv2::WebACL', {
        VisibilityConfig: Match.objectLike({
          CloudWatchMetricsEnabled: true,
          SampledRequestsEnabled: true,
          MetricName: 'test-cloud-racket-waf-metrics',
        }),
      });
    });
  });

  describe('Rule Configurations', () => {
    test('creates 4 WAF rules', () => {
      template.hasResourceProperties('AWS::WAFv2::WebACL', {
        Rules: Match.arrayWith([
          Match.objectLike({ Name: 'RateLimitRule' }),
          Match.objectLike({ Name: 'AWSManagedRulesCommonRuleSet' }),
          Match.objectLike({ Name: 'AWSManagedRulesSQLiRuleSet' }),
          Match.objectLike({ Name: 'AWSManagedRulesKnownBadInputsRuleSet' }),
        ]),
      });
    });

    test('rate limit rule has correct configuration', () => {
      template.hasResourceProperties('AWS::WAFv2::WebACL', {
        Rules: Match.arrayWith([
          Match.objectLike({
            Name: 'RateLimitRule',
            Priority: 1,
            Statement: {
              RateBasedStatement: {
                Limit: 2000,
                AggregateKeyType: 'IP',
              },
            },
            Action: {
              Block: {},
            },
          }),
        ]),
      });
    });

    test('AWS Managed Rules Common Rule Set is configured', () => {
      template.hasResourceProperties('AWS::WAFv2::WebACL', {
        Rules: Match.arrayWith([
          Match.objectLike({
            Name: 'AWSManagedRulesCommonRuleSet',
            Priority: 2,
            Statement: {
              ManagedRuleGroupStatement: {
                VendorName: 'AWS',
                Name: 'AWSManagedRulesCommonRuleSet',
              },
            },
            OverrideAction: {
              None: {},
            },
          }),
        ]),
      });
    });

    test('AWS Managed Rules SQL Injection Rule Set is configured', () => {
      template.hasResourceProperties('AWS::WAFv2::WebACL', {
        Rules: Match.arrayWith([
          Match.objectLike({
            Name: 'AWSManagedRulesSQLiRuleSet',
            Priority: 3,
            Statement: {
              ManagedRuleGroupStatement: {
                VendorName: 'AWS',
                Name: 'AWSManagedRulesSQLiRuleSet',
              },
            },
          }),
        ]),
      });
    });

    test('AWS Managed Rules Known Bad Inputs Rule Set is configured', () => {
      template.hasResourceProperties('AWS::WAFv2::WebACL', {
        Rules: Match.arrayWith([
          Match.objectLike({
            Name: 'AWSManagedRulesKnownBadInputsRuleSet',
            Priority: 4,
            Statement: {
              ManagedRuleGroupStatement: {
                VendorName: 'AWS',
                Name: 'AWSManagedRulesKnownBadInputsRuleSet',
              },
            },
          }),
        ]),
      });
    });

    test('all rules have CloudWatch metrics enabled', () => {
      template.hasResourceProperties('AWS::WAFv2::WebACL', {
        Rules: Match.arrayWith([
          Match.objectLike({
            Name: 'RateLimitRule',
            VisibilityConfig: Match.objectLike({
              CloudWatchMetricsEnabled: true,
            }),
          }),
        ]),
      });
    });
  });

  describe('Web ACL Association', () => {
    test('creates Web ACL Association', () => {
      template.resourceCountIs('AWS::WAFv2::WebACLAssociation', 1);
    });

    test('Web ACL is associated with API Gateway', () => {
      template.hasResourceProperties('AWS::WAFv2::WebACLAssociation', {
        ResourceArn: defaultProps.apiGatewayArn,
      });
    });
  });

  describe('CloudFormation Outputs', () => {
    test('exports Web ACL ARN', () => {
      const outputs = template.findOutputs('*');
      const webAclArnOutput = Object.values(outputs).find(
        (output: any) => output.Export?.Name === 'test-waf-web-acl-arn'
      );
      expect(webAclArnOutput).toBeDefined();
    });

    test('exports Web ACL ID', () => {
      const outputs = template.findOutputs('*');
      const webAclIdOutput = Object.values(outputs).find(
        (output: any) => output.Export?.Name === 'test-waf-web-acl-id'
      );
      expect(webAclIdOutput).toBeDefined();
    });
  });
});
