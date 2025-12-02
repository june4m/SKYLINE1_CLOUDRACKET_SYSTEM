import { DynamoDBClient } from '@aws-sdk/client-dynamodb';
import { DynamoDBDocumentClient } from '@aws-sdk/lib-dynamodb';
import dotenv from 'dotenv'
dotenv.config();
export class DynamoDBConfig {
  private static instance: DynamoDBDocumentClient;

  public static getInstance(): DynamoDBDocumentClient {
    if (!DynamoDBConfig.instance) {
      const clientConfig: any = {
        region: process.env.AWS_REGION || 'ap-southeast-1'
      };

      // If running in development or an explicit endpoint is set, use it and ensure credentials are present
      if (process.env.NODE_ENV === 'development' || process.env.DYNAMODB_ENDPOINT) {
        clientConfig.endpoint = process.env.DYNAMODB_ENDPOINT || 'http://localhost:8000';

        // Provide credentials for local DynamoDB if none are present (Dynamo local accepts any dummy creds)
        clientConfig.credentials = clientConfig.credentials || {
          accessKeyId: process.env.DYNAMODB_ACCESSKEYID || 'local_dummy_access_key',
          secretAccessKey: process.env.DYNAMODB_SECRETACCESS || 'local_dummy_secret'
        };
      }

      const client = new DynamoDBClient(clientConfig);

      DynamoDBConfig.instance = DynamoDBDocumentClient.from(client, {
        marshallOptions: {
          convertEmptyValues: false,
          removeUndefinedValues: true,
          convertClassInstanceToMap: false,
        },
        unmarshallOptions: {
          wrapNumbers: false,
        },
      });
    }

    return DynamoDBConfig.instance;
  }
}

export const dynamoClient = DynamoDBConfig.getInstance()