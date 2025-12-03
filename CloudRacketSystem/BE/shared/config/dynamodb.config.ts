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

      if (process.env.NODE_ENV === 'development') {
        clientConfig.endpoint = process.env.DYNAMODB_ENDPOINT || 'http://localhost:8000';
        
        // Only set credentials if both accessKeyId and secretAccessKey are available
        if (process.env.DYNAMODB_ACCESSKEYID) {
          clientConfig.credentials = {
            accessKeyId: process.env.DYNAMODB_ACCESSKEYID,
            secretAccessKey: process.env.DYNAMODB_SECRETACCESS
          };
        }
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