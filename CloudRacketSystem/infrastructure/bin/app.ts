#!/usr/bin/env node
import 'source-map-support/register';
import * as cdk from 'aws-cdk-lib';
import * as dotenv from 'dotenv';
import { CloudRacketServerlessStack } from '../lib/cloud-racket-serverless-stack';

/**
 * CDK App Entry Point for Cloud Racket Platform
 * 
 * This file initializes the CDK application and creates the main serverless stack.
 * It loads configuration from environment variables and CDK context.
 * 
 * Requirements: 16.1, 16.2
 * - Supports multiple environments (dev, staging, prod) through context variables
 * - Loads environment-specific configuration from .env files
 */

// Load environment variables from .env file
dotenv.config();

/**
 * Validate required environment variables
 * Throws an error if critical configuration is missing
 */
function validateEnvironment(): void {
  const requiredVars = ['CDK_ACCOUNT', 'CDK_REGION'];
  const missingVars = requiredVars.filter(
    (varName) => !process.env[varName] || process.env[varName] === `your-aws-account-id`
  );

  if (missingVars.length > 0) {
    console.warn(
      `Warning: Missing or unconfigured environment variables: ${missingVars.join(', ')}\n` +
      `Please update your .env file with valid AWS configuration.\n` +
      `Using default values for development.`
    );
  }
}

// Validate environment configuration
validateEnvironment();

// Initialize CDK App
const app = new cdk.App();

// Get environment/stage from context or environment variable
// Priority: CLI context > environment variable > default 'dev'
// Requirement: 16.1 - Accept environment parameter from context or environment variable
const stage = app.node.tryGetContext('env') || process.env.STAGE || 'dev';

// Validate stage value
const validStages = ['dev', 'staging', 'prod'];
if (!validStages.includes(stage)) {
  throw new Error(
    `Invalid stage '${stage}'. Valid stages are: ${validStages.join(', ')}`
  );
}

// Get sender email from environment or use default
const senderEmail = process.env.SENDER_EMAIL || 'noreply@cloudracket.com';

// Get alarm email from environment (optional)
const alarmEmail = process.env.ALARM_EMAIL;

// Get AWS account and region configuration
// Requirement: 16.2 - Configure AWS account and region
const account = process.env.CDK_ACCOUNT || process.env.CDK_DEFAULT_ACCOUNT;
const region = process.env.CDK_REGION || process.env.CDK_DEFAULT_REGION || 'ap-southeast-1';

// Create the main serverless stack
// Requirement: 16.2 - Prefix all resource names with environment identifier
const stack = new CloudRacketServerlessStack(app, `CloudRacket-${stage}-Serverless-Stack`, {
  env: {
    account,
    region,
  },
  stage,
  senderEmail,
  alarmEmail,
  description: `Cloud Racket Platform - ${stage.toUpperCase()} Serverless Environment`,
  
  // Add tags for resource management and cost allocation
  tags: {
    Project: 'CloudRacket',
    Environment: stage,
    ManagedBy: 'CDK',
  },
});

// Add additional tags to the stack
cdk.Tags.of(stack).add('Application', 'CloudRacketPlatform');
cdk.Tags.of(stack).add('CostCenter', `cloudracket-${stage}`);

// Output deployment information
console.log(`\n🏸 Cloud Racket CDK Deployment`);
console.log(`━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━`);
console.log(`Environment: ${stage}`);
console.log(`Region: ${region}`);
console.log(`Account: ${account || 'Not configured'}`);
console.log(`Stack: CloudRacket-${stage}-Serverless-Stack`);
console.log(`━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n`);
