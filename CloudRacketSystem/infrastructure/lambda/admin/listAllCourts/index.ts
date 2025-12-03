/**
 * List All Courts Lambda Handler (Admin)
 * Requirements: 7.7, 13.2
 */
import { APIGatewayProxyEvent, APIGatewayProxyResult } from 'aws-lambda';

export const handler = async (event: APIGatewayProxyEvent): Promise<APIGatewayProxyResult> => {
  // TODO: Implement list all courts logic
  return {
    statusCode: 501,
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ message: 'Not implemented' }),
  };
};
