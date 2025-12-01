// src/services/booking.services.ts
import { PutCommand, ScanCommand } from '@aws-sdk/lib-dynamodb'
import { dynamoClient } from '../../../../shared/config/dynamodb.config'
import { v4 as uuidv4 } from 'uuid'

const TABLE_NAME = 'Booking'

function parseTimeToMinutes(t: string): number {
  const [hh, mm] = t.split(':').map(Number)
  return hh * 60 + mm
}

function minutesToTimeString(mins: number): string {
  // support mins beyond midnight by wrapping within 0..1439 if desired
  const wrapped = mins % (24 * 60)
  const hh = Math.floor(wrapped / 60)
  const mm = Math.floor(wrapped % 60)
  return `${String(hh).padStart(2, '0')}:${String(mm).padStart(2, '0')}`
}

export class BookingService {
  /**
   * Check if there is an overlapping booking for same court on same date.
   * This does a Scan with a filter (non optimal for large tables).
   */
  async hasConflict(court_id: string, booking_date: string, start_time: string, end_time: string) {
    try {
      const scanCmd = new ScanCommand({
        TableName: TABLE_NAME,
        FilterExpression: 'court_id = :cid AND booking_date = :bd',
        ExpressionAttributeValues: {
          ':cid': court_id,
          ':bd': booking_date
        },
        ProjectionExpression: 'booking_id, start_time, end_time, booking_status'
      })

      const res = (await dynamoClient.send(scanCmd)) as any
      const items = res.Items ?? []

      const reqStart = parseTimeToMinutes(start_time)
      const reqEnd = parseTimeToMinutes(end_time)

      for (const b of items) {
        if (!b.start_time || !b.end_time) continue
        const existingStart = parseTimeToMinutes(b.start_time)
        const existingEnd = parseTimeToMinutes(b.end_time)
        // overlap if start < existingEnd && existingStart < end
        if (reqStart < existingEnd && existingStart < reqEnd) {
          return true
        }
      }
      return false
    } catch (err) {
      console.error('BookingService.hasConflict error:', err)
      throw new Error('Failed to check booking conflicts')
    }
  }

  /**
   * Create a booking item.
   * Required fields: booking_date, club_id, court_id, duration (hours), start_time, user_id
   */
  async createBooking(payload: {
    booking_date: string
    club_id: string
    court_id: string
    duration: number // hours (integer)
    start_time: string // "HH:MM"
    user_id: string
    rating_given?: number | null
    booking_status?: string
  }) {
    const {
      booking_date,
      club_id,
      court_id,
      duration,
      start_time,
      user_id,
      rating_given = null,
      booking_status = 'booked'
    } = payload

    // compute end_time: duration(hours) -> minutes
    const startMins = parseTimeToMinutes(start_time)
    const endMins = startMins + duration * 60
    const end_time = minutesToTimeString(endMins)

    // conflict check
    const conflict = await this.hasConflict(court_id, booking_date, start_time, end_time)
    if (conflict) {
      throw new Error('Time slot already booked for this court on the chosen date')
    }

    const booking_id = uuidv4()
    const item = {
      booking_id,
      booking_date,
      booking_status,
      club_id,
      court_id,
      duration, // hours
      end_time,
      rating_given,
      start_time,
      user_id,
      created_at: new Date().toISOString()
    }

    try {
      const cmd = new PutCommand({
        TableName: TABLE_NAME,
        Item: item,
        ConditionExpression: 'attribute_not_exists(booking_id)'
      })

      await dynamoClient.send(cmd)
      return item
    } catch (err: any) {
      console.error('BookingService.createBooking error:', err)
      if (err?.name === 'ConditionalCheckFailedException') {
        throw new Error('Booking ID conflict, try again')
      }
      throw new Error('Failed to create booking')
    }
  }

  async getAllBookings(filters?: { user_id?: string; court_id?: string; club_id?: string; booking_date?: string }) {
    try {
      const ExpressionAttributeValues: Record<string, any> = {}
      const FilterParts: string[] = []

      if (filters?.user_id) {
        FilterParts.push('user_id = :uid')
        ExpressionAttributeValues[':uid'] = filters.user_id
      }

      if (filters?.court_id) {
        FilterParts.push('court_id = :cid')
        ExpressionAttributeValues[':cid'] = filters.court_id
      }

      if (filters?.club_id) {
        FilterParts.push('club_id = :clb')
        ExpressionAttributeValues[':clb'] = filters.club_id
      }

      if (filters?.booking_date) {
        FilterParts.push('booking_date = :bd')
        ExpressionAttributeValues[':bd'] = filters.booking_date
      }

      const cmdInput: any = { TableName: TABLE_NAME }
      if (FilterParts.length > 0) {
        cmdInput.FilterExpression = FilterParts.join(' AND ')
        cmdInput.ExpressionAttributeValues = ExpressionAttributeValues
      } else {
        // If you want to avoid scanning entire table when no filters, throw or return [].
        // throw new Error('No filters provided')
      }

      console.log('[BookingService.getAllBookings] cmdInput:', JSON.stringify(cmdInput))
      const cmd = new ScanCommand(cmdInput)
      const res = (await dynamoClient.send(cmd)) as any
      return res.Items ?? []
    } catch (err) {
      console.error('BookingService.getAllBookings error:', err)
      throw new Error('Failed to fetch bookings')
    }
  }
}
