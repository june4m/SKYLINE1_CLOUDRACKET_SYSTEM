#!/usr/bin/env node
import 'source-map-support/register';
import * as cdk from 'aws-cdk-lib';
import * as dotenv from 'dotenv';
import { CloudRacketServerlessStack } from '../lib/cloud-racket-serverless-stack';

// Load environment variables
dotenv.config();

const app = new cdk.App();

// Get environment from context or default to 'dev'
const env = app.node.tryGetContext('env') || process.env.STAGE || 'dev';

// Get sender email from environment or use default
const senderEmail = process.env.SENDER_EMAIL || 'noreply@cloudracket.com';

// Serverless Stack
new CloudRacketServerlessStack(app, `CloudRacket-${env}-Serverless-Stack`, {
  env: {
    account: process.env.CDK_ACCOUNT,
    region: process.env.CDK_REGION || 'ap-southeast-1', // Singapore for Vietnam
  },
  stage: env,
  senderEmail,
  description: `Cloud Racket Platform - ${env.toUpperCase()} Serverless Envi
