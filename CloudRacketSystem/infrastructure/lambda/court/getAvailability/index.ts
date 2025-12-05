/**
 * Get Available Courts Lambda Handler
 * Lấy danh sách các sân có court_status = "available"
 * Requirements: 7.2, 13.2
 */
import { APIGatewayProxyEvent, APIGatewayProxyResult } from 'aws-lambda';
import { CourtService } from '../../shared/services/court.service';

const courtService = new CourtService();

export const handler = async (event: APIGatewayProxyEvent): Promise<APIGatewayProxyResult> => {
  try {
    console.log('getAvailability - received event:', JSON.stringify(event));

    // Lấy tất cả court có status = available
    const availableCourts = await courtService.getAvailableCourts();

    console.log('getAvailability - SUCCESS! Found', availableCourts.length, 'available courts');
    console.log('getAvailability - data:', JSON.stringify(availableCourts));

    return {
      statusCode: 200,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        message: 'Available courts retrieved successfully',
        count: availableCourts.length,
        courts: availableCourts,
      }),
    };
  } catch (error: any) {
    console.error('getAvailability Lambda error:', error);
    console.error('getAvailability - error stack:', error.stack);
    return {
      statusCode: 500,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ message: error.message }),
    };
  }
};
