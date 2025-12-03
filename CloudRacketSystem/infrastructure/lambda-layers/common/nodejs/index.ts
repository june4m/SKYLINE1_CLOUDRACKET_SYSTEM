/**
 * Common Layer - AWS SDK and shared utilities
 * This layer provides common AWS SDK clients and utility functions
 * for all Lambda functions in the Cloud Racket Platform.
 */

declare const process: { env: Record<string, string | undefined> }

// Re-export AWS SDK clients as namespaces to avoid naming conflicts
export * as DynamoDB from '@aws-sdk/client-dynamodb'
export * as DynamoDBLib from '@aws-sdk/lib-dynamodb'
export * as S3 from '@aws-sdk/client-s3'
export * as SES from '@aws-sdk/client-ses'
export * as Cognito from '@aws-sdk/client-cognito-identity-provider'
export * as Location from '@aws-sdk/client-location'

// Re-export utility libraries
export { v4 as uuidv4 } from 'uuid'
export * as _ from 'lodash'

// Common response helper
export interface ApiResponse {
  statusCode: number
  headers: Record<string, string>
  body: string
}

export const createResponse = (
  statusCode: number,
  body: unknown,
  headers: Record<string, string> = {}
): ApiResponse => {
  return {
    statusCode,
    headers: {
      'Content-Type': 'application/json',
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Headers': 'Content-Type,X-Amz-Date,Authorization,X-Api-Key,X-Amz-Security-Token',
      'Access-Control-Allow-Methods': 'GET,POST,PUT,DELETE,OPTIONS',
      ...headers
    },
    body: JSON.stringify(body)
  }
}

// Success response helper
export const successResponse = (data: unknown, statusCode: number = 200): ApiResponse => {
  return createResponse(statusCode, { success: true, data })
}

// Error response helper
export const errorResponse = (message: string, statusCode: number = 500): ApiResponse => {
  return createResponse(statusCode, { success: false, error: message })
}

// Logger utility
export const logger = {
  info: (message: string, data?: unknown) => {
    console.log(JSON.stringify({ level: 'INFO', message, data, timestamp: new Date().toISOString() }))
  },
  error: (message: string, error?: unknown) => {
    console.error(JSON.stringify({ level: 'ERROR', message, error, timestamp: new Date().toISOString() }))
  },
  warn: (message: string, data?: unknown) => {
    console.warn(JSON.stringify({ level: 'WARN', message, data, timestamp: new Date().toISOString() }))
  },
  debug: (message: string, data?: unknown) => {
    if (process.env.DEBUG === 'true') {
      console.log(JSON.stringify({ level: 'DEBUG', message, data, timestamp: new Date().toISOString() }))
    }
  }
}
