/**
 * Update Court Lambda Handler
 * Chỉ cho phép update court_name và court_status
 * Nếu field để trống thì giữ nguyên giá trị cũ
 * Requirements: 7.2, 13.2, 13.3
 */
import { APIGatewayProxyEvent, APIGatewayProxyResult } from 'aws-lambda';
import { DynamoDBClient } from '@aws-sdk/client-dynamodb';
import { DynamoDBDocumentClient, UpdateCommand, GetCommand } from '@aws-sdk/lib-dynamodb';

const client = new DynamoDBClient({});
const dynamoClient = DynamoDBDocumentClient.from(client);

const TABLE_NAME = process.env.COURTS_TABLE_NAME || 'CourtData';

export const handler = async (event: APIGatewayProxyEvent): Promise<APIGatewayProxyResult> => {
  try {
    console.log('updateCourt - received event:', JSON.stringify(event));

    const court_id = event.pathParameters?.courtId || event.pathParameters?.court_id;
    console.log('updateCourt - pathParameters:', JSON.stringify(event.pathParameters));
    console.log('updateCourt - court_id:', court_id);

    if (!court_id) {
      console.warn('updateCourt - missing court_id');
      return {
        statusCode: 400,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message: 'court_id is required' }),
      };
    }

    const body = event.body ? JSON.parse(event.body) : {};
    console.log('updateCourt - parsed body:', JSON.stringify(body));

    const { court_name, court_status } = body;

    // Kiểm tra xem có field nào để update không
    if (court_name === undefined && court_status === undefined) {
      console.warn('updateCourt - no fields to update');
      return {
        statusCode: 400,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message: 'At least one field (court_name or court_status) is required' }),
      };
    }

    // Kiểm tra court có tồn tại không
    console.log('updateCourt - checking if court exists');
    const getCmd = new GetCommand({
      TableName: TABLE_NAME,
      Key: { court_id },
    });
    const existingCourt = await dynamoClient.send(getCmd);

    if (!existingCourt.Item) {
      console.warn('updateCourt - court not found:', court_id);
      return {
        statusCode: 404,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message: 'Court not found' }),
      };
    }

    console.log('updateCourt - BEFORE UPDATE (old data):', JSON.stringify(existingCourt.Item));

    // Build update expression chỉ cho các field được cung cấp
    const updateExpressions: string[] = [];
    const expressionAttributeNames: Record<string, string> = {};
    const expressionAttributeValues: Record<string, any> = {};

    if (court_name !== undefined && court_name !== '') {
      updateExpressions.push('#court_name = :court_name');
      expressionAttributeNames['#court_name'] = 'court_name';
      expressionAttributeValues[':court_name'] = court_name;
    }

    if (court_status !== undefined && court_status !== '') {
      updateExpressions.push('#court_status = :court_status');
      expressionAttributeNames['#court_status'] = 'court_status';
      expressionAttributeValues[':court_status'] = court_status;
    }

    // Nếu không có gì để update (tất cả đều empty string)
    if (updateExpressions.length === 0) {
      console.log('updateCourt - no valid fields to update, returning existing court');
      return {
        statusCode: 200,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: 'No changes made',
          court: existingCourt.Item,
        }),
      };
    }

    console.log('updateCourt - updating with:', {
      updateExpressions,
      expressionAttributeNames,
      expressionAttributeValues,
    });

    const updateCmd = new UpdateCommand({
      TableName: TABLE_NAME,
      Key: { court_id },
      UpdateExpression: `SET ${updateExpressions.join(', ')}`,
      ExpressionAttributeNames: expressionAttributeNames,
      ExpressionAttributeValues: expressionAttributeValues,
      ReturnValues: 'ALL_NEW',
    });

    const result = await dynamoClient.send(updateCmd);
    console.log('updateCourt - AFTER UPDATE (new data):', JSON.stringify(result.Attributes));

    return {
      statusCode: 200,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        message: 'Court updated successfully',
        court: result.Attributes,
      }),
    };
  } catch (error: any) {
    console.error('updateCourt Lambda error:', error);
    console.error('updateCourt - error stack:', error.stack);
    return {
      statusCode: 500,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ message: error.message }),
    };
  }
};
