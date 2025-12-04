/**
 * Get Court Lambda Handler
 * Requirements: 7.2, 13.2
 */
import { APIGatewayProxyEvent, APIGatewayProxyResult } from 'aws-lambda'
import { CourtService } from '../../shared/services/court.service'

const courtService = new CourtService()

export const handler = async (event: APIGatewayProxyEvent): Promise<APIGatewayProxyResult> => {
  try {
    console.log('getCourt - received event:', JSON.stringify(event))
    const court_id = event.pathParameters?.courtId || event.pathParameters?.court_id
    console.log('getCourt - pathParameters:', JSON.stringify(event.pathParameters))
    console.log('getCourt - court_id =', court_id)

    if (!court_id) {
      console.warn('getCourt - missing court_id')
      return {
        statusCode: 400,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message: 'court_id is required' })
      }
    }

    const court = await courtService.getCourtById(court_id)
    console.log('getCourt - service returned:', JSON.stringify(court))

    if (!court) {
      return {
        statusCode: 404,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message: 'Court not found' })
      }
    }

    return {
      statusCode: 200,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(court)
    }
  } catch (error: any) {
    console.error('getCourt Lambda error:', error)
    return {
      statusCode: 500,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ message: error.message })
    }
  }
}
