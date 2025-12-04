/**
 * Get All Bookings Lambda Handler
 * Lấy tất cả các booking từ table Booking
 * Requirements: 7.3, 13.2
 */
import { APIGatewayProxyEvent, APIGatewayProxyResult } from 'aws-lambda';
import { DynamoDBClient } from '@aws-sdk/client-dynamodb';
import { DynamoDBDocumentClient, ScanCommand, GetCommand } from '@aws-sdk/lib-dynamodb';

const client = new DynamoDBClient({});
const dynamoClient = DynamoDBDocumentClient.from(client);

const TABLE_NAME = process.env.BOOKINGS_TABLE_NAME || 'Booking';

export const handler = async (event: APIGatewayProxyEvent): Promise<APIGatewayProxyResult> => {
  try {
    console.log('getBooking - received event:', JSON.stringify(event));

    const booking_id = event.pathParameters?.bookingId || event.pathParameters?.booking_id;
    console.log('getBooking - pathParameters:', JSON.stringify(event.pathParameters));

    // Nếu có booking_id thì lấy 1 booking cụ thể
    if (booking_id) {
      console.log('getBooking - fetching single booking:', booking_id);
      
      const getCmd = new GetCommand({
        TableName: TABLE_NAME,
        Key: { booking_id },
      });

      const result = await dynamoClient.send(getCmd);
      
      if (!result.Item) {
        console.warn('getBooking - booking not found:', booking_id);
        return {
          statusCode: 404,
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ message: 'Booking not found' }),
        };
      }

      console.log('getBooking - SUCCESS! Found booking:', JSON.stringify(result.Item));
      return {
        statusCode: 200,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(result.Item),
      };
    }

    // Nếu không có booking_id thì lấy tất cả bookings
    console.log('getBooking - fetching all bookings');
    
    const scanCmd = new ScanCommand({
      TableName: TABLE_NAME,
    });

    const result = await dynamoClient.send(scanCmd);
    const bookings = result.Items || [];

    console.log('getBooking - SUCCESS! Found', bookings.length, 'bookings');
    console.log('getBooking - data:', JSON.stringify(bookings));

    return {
      statusCode: 200,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        message: 'Bookings retrieved successfully',
        count: bookings.length,
        bookings,
      }),
    };
  } catch (error: any) {
    console.error('getBooking Lambda error:', error);
    console.error('getBooking - error stack:', error.stack);
    return {
      statusCode: 500,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ message: error.message }),
    };
  }
};
