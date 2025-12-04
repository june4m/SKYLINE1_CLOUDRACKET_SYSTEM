/**
 * Delete Court Lambda Handler
 * Xóa court theo court_id
 * Requirements: 7.2, 13.2, 13.3
 */
import { APIGatewayProxyEvent, APIGatewayProxyResult } from 'aws-lambda';
import { DynamoDBClient } from '@aws-sdk/client-dynamodb';
import { DynamoDBDocumentClient, DeleteCommand, GetCommand } from '@aws-sdk/lib-dynamodb';

const client = new DynamoDBClient({});
const dynamoClient = DynamoDBDocumentClient.from(client);

const TABLE_NAME = process.env.COURTS_TABLE_NAME || 'CourtData';

export const handler = async (event: APIGatewayProxyEvent): Promise<APIGatewayProxyResult> => {
  try {
    console.log('deleteCourt - received event:', JSON.stringify(event));

    const court_id = event.pathParameters?.courtId || event.pathParameters?.court_id;
    console.log('deleteCourt - pathParameters:', JSON.stringify(event.pathParameters));
    console.log('deleteCourt - court_id:', court_id);

    if (!court_id) {
      console.warn('deleteCourt - missing court_id');
      return {
        statusCode: 400,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message: 'court_id is required' }),
      };
    }

    // Lấy thông tin court trước khi xóa để log
    console.log('deleteCourt - fetching court before delete');
    const getCmd = new GetCommand({
      TableName: TABLE_NAME,
      Key: { court_id },
    });
    const existingCourt = await dynamoClient.send(getCmd);

    if (!existingCourt.Item) {
      console.warn('deleteCourt - court not found:', court_id);
      return {
        statusCode: 404,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message: 'Court not found' }),
      };
    }

    console.log('deleteCourt - court to delete:', JSON.stringify(existingCourt.Item));

    // Xóa court
    const deleteCmd = new DeleteCommand({
      TableName: TABLE_NAME,
      Key: { court_id },
      ReturnValues: 'ALL_OLD',
    });

    const result = await dynamoClient.send(deleteCmd);
    console.log('deleteCourt - SUCCESS! Deleted court:', JSON.stringify(result.Attributes));

    return {
      statusCode: 200,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        message: 'Court deleted successfully',
        deletedCourt: result.Attributes,
      }),
    };
  } catch (error: any) {
    console.error('deleteCourt Lambda error:', error);
    console.error('deleteCourt - error stack:', error.stack);
    return {
      statusCode: 500,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ message: error.message }),
    };
  }
};
