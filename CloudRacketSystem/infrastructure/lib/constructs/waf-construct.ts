import { Construct } from 'constructs';
import { CfnWebACL, CfnWebACLAssociation } from 'aws-cdk-lib/aws-wafv2';
import { CfnOutput } from 'aws-cdk-lib';

/**
 * Props interface for WAF Construct
 * Requirements: 12.1-12.7
 */
export interface WAFConstructProps {
  stage: string;
  apiGatewayArn: string;
}

/**
 * AWS WAF Construct
 * Creates Web ACL to protect API Gateway from common web attacks.
 *
 * Requirements:
 * - 12.1: Create Web ACL for API Gateway
 * - 12.2: Rate limiting rule (2000 requests per 5 min per IP)
 * - 12.3: AWS Managed Rules - Core Rule Set
 * - 12.4: AWS Managed Rules - SQL Injection protection
 * - 12.5: AWS Managed Rules - Known Bad Inputs
 * - 12.6: Associate Web ACL with API Gateway stage
 * - 12.7: Enable CloudWatch metrics for WAF
 */
export class WAFConstruct extends Construct {
  public readonly webAcl: CfnWebACL;
  public readonly webAclArn: string;
  public readonly webAclId: string;

  constructor(scope: Construct, id: string, props: WAFConstructProps) {
    super(scope, id);

    const { stage, apiGatewayArn } = props;

    // ==========================================
    // WEB ACL (Requirement 12.1)
    // ==========================================
    this.webAcl = new CfnWebACL(this, 'WebACL', {
      name: `${stage}-cloud-racket-waf`,
      scope: 'REGIONAL', // REGIONAL for API Gateway
      defaultAction: {
        allow: {},
      },
      visibilityConfig: {
        sampledRequestsEnabled: true,
        cloudWatchMetricsEnabled: true, // Requirement 12.7
        metricName: `${stage}-cloud-racket-waf-metrics`,
      },
      description: `WAF Web ACL for Cloud Racket Platform - ${stage}`,
      rules: [
        // ==========================================
        // RATE LIMITING RULE (Requirement 12.2)
        // 2000 requests per 5 minutes per IP
        // ==========================================
        {
          name: 'RateLimitRule',
          priority: 1,
          statement: {
            rateBasedStatement: {
              limit: 2000,
              aggregateKeyType: 'IP',
            },
          },
          action: {
            block: {},
          },
          visibilityConfig: {
            sampledRequestsEnabled: true,
            cloudWatchMetricsEnabled: true,
            metricName: `${stage}-rate-limit-rule`,
          },
        },
        // ==========================================
        // AWS MANAGED RULES - CORE RULE SET (Requirement 12.3)
        // Protects against common vulnerabilities
        // ==========================================
        {
          name: 'AWSManagedRulesCommonRuleSet',
          priority: 2,
          statement: {
            managedRuleGroupStatement: {
              vendorName: 'AWS',
              name: 'AWSManagedRulesCommonRuleSet',
              excludedRules: [],
            },
          },
          overrideAction: {
            none: {},
          },
          visibilityConfig: {
            sampledRequestsEnabled: true,
            cloudWatchMetricsEnabled: true,
            metricName: `${stage}-aws-common-rules`,
          },
        },
        // ==========================================
        // AWS MANAGED RULES - SQL INJECTION (Requirement 12.4)
        // Protects against SQL injection attacks
        // ==========================================
        {
          name: 'AWSManagedRulesSQLiRuleSet',
          priority: 3,
          statement: {
            managedRuleGroupStatement: {
              vendorName: 'AWS',
              name: 'AWSManagedRulesSQLiRuleSet',
              excludedRules: [],
            },
          },
          overrideAction: {
            none: {},
          },
          visibilityConfig: {
            sampledRequestsEnabled: true,
            cloudWatchMetricsEnabled: true,
            metricName: `${stage}-aws-sqli-rules`,
          },
        },
        // ==========================================
        // AWS MANAGED RULES - KNOWN BAD INPUTS (Requirement 12.5)
        // Protects against known bad inputs
        // ==========================================
        {
          name: 'AWSManagedRulesKnownBadInputsRuleSet',
          priority: 4,
          statement: {
            managedRuleGroupStatement: {
              vendorName: 'AWS',
              name: 'AWSManagedRulesKnownBadInputsRuleSet',
              excludedRules: [],
            },
          },
          overrideAction: {
            none: {},
          },
          visibilityConfig: {
            sampledRequestsEnabled: true,
            cloudWatchMetricsEnabled: true,
            metricName: `${stage}-aws-bad-inputs-rules`,
          },
        },
      ],
    });

    this.webAclArn = this.webAcl.attrArn;
    this.webAclId = this.webAcl.attrId;

    // ==========================================
    // WEB ACL ASSOCIATION (Requirement 12.6)
    // Associate Web ACL with API Gateway stage
    // ==========================================
    new CfnWebACLAssociation(this, 'WebACLAssociation', {
      resourceArn: apiGatewayArn,
      webAclArn: this.webAcl.attrArn,
    });

    // ==========================================
    // CLOUDFORMATION OUTPUTS
    // ==========================================
    new CfnOutput(this, 'WebAclArn', {
      value: this.webAclArn,
      description: 'WAF Web ACL ARN',
      exportName: `${stage}-waf-web-acl-arn`,
    });

    new CfnOutput(this, 'WebAclId', {
      value: this.webAclId,
      description: 'WAF Web ACL ID',
      exportName: `${stage}-waf-web-acl-id`,
    });
  }
}
