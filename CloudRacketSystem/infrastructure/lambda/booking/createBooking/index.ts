/**
 * Create Booking Lambda Handler
 * Requirements: 7.3, 10.1, 13.2, 13.4
 */
import { APIGatewayProxyEvent, APIGatewayProxyResult } from 'aws-lambda';
import { BookingService } from '../../shared/services/booking.service';

const bookingService = new BookingService();

export const handler = async (event: APIGatewayProxyEvent): Promise<APIGatewayProxyResult> => {
  try {
    const body = event.body ? JSON.parse(event.body) : {};
    const { booking_date, club_id, court_id, duration, start_time, user_id, rating_given, booking_status } = body;

    if (!booking_date || !club_id || !court_id || !duration || !start_time || !user_id) {
      return {
        statusCode: 400,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message: 'Missing required fields' }),
      };
    }

    const booking = await bookingService.createBooking({
      booking_date,
      club_id,
      court_id,
      duration,
      start_time,
      user_id,
      rating_given,
      booking_status,
    });

    return {
      statusCode: 201,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ message: 'Booking created', booking }),
    };
  } catch (error: any) {
    console.error('createBooking Lambda error:', error);
    return {
      statusCode: 500,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ message: error.message }),
    };
  }
};
