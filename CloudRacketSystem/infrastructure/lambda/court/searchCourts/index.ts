/**
 * Search Courts Lambda Handler
 * Requirements: 7.2, 13.2
 */
import { APIGatewayProxyEvent, APIGatewayProxyResult } from 'aws-lambda';
import { CourtService } from '../../shared/services/court.service';

const courtService = new CourtService();

export const handler = async (event: APIGatewayProxyEvent): Promise<APIGatewayProxyResult> => {
  try {
    console.log('searchCourts - received event:', JSON.stringify(event));
    
    const body = event.body ? JSON.parse(event.body) : {};
    console.log('searchCourts - parsed body:', JSON.stringify(body));
    
    const { club_name, club_district, limit } = body;

    if (!club_name && !club_district) {
      console.warn('searchCourts - missing required params');
      return {
        statusCode: 400,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message: 'club_name or club_district is required' }),
      };
    }

    console.log('searchCourts - searching with:', { club_name, club_district, limit });
    const data = await courtService.searchCourtsByClubInfo({
      club_name,
      club_district,
      limitClubs: limit ?? 50,
    });

    console.log('searchCourts - SUCCESS! Found', data.length, 'results');
    console.log('searchCourts - data:', JSON.stringify(data));

    return {
      statusCode: 200,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        message: 'Search completed',
        count: data.length,
        results: data,
      }),
    };
  } catch (error: any) {
    console.error('searchCourts Lambda error:', error);
    console.error('searchCourts - error stack:', error.stack);
    return {
      statusCode: 500,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ message: error.message }),
    };
  }
};
