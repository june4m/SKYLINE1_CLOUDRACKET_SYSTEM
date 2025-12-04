/**
 * Create Court Lambda Handler
 * Requirements: 7.2, 13.2, 13.3
 */
import { APIGatewayProxyEvent, APIGatewayProxyResult } from 'aws-lambda';
import { CourtService } from '../../shared/services/court.service';

const courtService = new CourtService();

export const handler = async (event: APIGatewayProxyEvent): Promise<APIGatewayProxyResult> => {
  try {
    console.log('createCourt - received event:', JSON.stringify(event));
    
    const body = event.body ? JSON.parse(event.body) : {};
    console.log('createCourt - parsed body:', JSON.stringify(body));
    
    const { club_id, court_name, court_status } = body;

    if (!club_id || !court_name) {
      console.warn('createCourt - missing required fields:', { club_id, court_name });
      return {
        statusCode: 400,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message: 'club_id and court_name are required' }),
      };
    }

    console.log('createCourt - creating court with:', { club_id, court_name, court_status });
    const court = await courtService.createCourt({ club_id, court_name, court_status });
    
    console.log('createCourt - SUCCESS! Created court:', JSON.stringify(court));

    return {
      statusCode: 201,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ message: 'Court created', court }),
    };
  } catch (error: any) {
    console.error('createCourt Lambda error:', error);
    console.error('createCourt - error stack:', error.stack);
    return {
      statusCode: 500,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ message: error.message }),
    };
  }
};
