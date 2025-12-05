// src/services/booking.services.ts
import { PutCommand, ScanCommand, GetCommand, UpdateCommand } from '@aws-sdk/lib-dynamodb'
import { dynamoClient } from '../../../../shared/config/dynamodb.config'
import { v4 as uuidv4 } from 'uuid'
import { BookingCreateDTO, BookingItem, BookingFilterDTO } from '../booking-services/booking.schema'

// IMPORT services (chỉnh path nếu project bạn khác)
import { CourtService } from '../court-services/court.services'
import { ClubService } from '../club-services/club.services'

const TABLE_NAME = 'Booking'
const courtService = new CourtService()
const clubService = new ClubService()

function parseTimeToMinutes(t: string): number {
  if (!t) throw new Error('Time string is undefined')
  const [hh, mm] = t.split(':').map(Number)
  if (Number.isNaN(hh) || Number.isNaN(mm)) throw new Error('Invalid time format')
  return hh * 60 + mm
}

function minutesToTimeString(mins: number): string {
  const wrapped = ((mins % (24 * 60)) + 24 * 60) % (24 * 60)
  const hh = Math.floor(wrapped / 60)
  const mm = Math.floor(wrapped % 60)
  return `${String(hh).padStart(2, '0')}:${String(mm).padStart(2, '0')}`
}

export class BookingService {
  async hasConflict(court_id: string, booking_date: string, start_time: string, end_time: string) {
    try {
      console.log('Checking conflict:', court_id, booking_date, start_time, end_time)
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
        if (b.booking_status && b.booking_status !== 'booked') continue
        const existingStart = parseTimeToMinutes(b.start_time)
        const existingEnd = parseTimeToMinutes(b.end_time)
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

  async createBooking(payload: BookingCreateDTO): Promise<BookingItem> {
    console.log('createBooking Services')
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

    if (!booking_date || !club_id || !court_id || !duration || !start_time || !user_id) {
      throw new Error('Missing required fields in payload')
    }

    const startMins = parseTimeToMinutes(start_time)
    const end_time = minutesToTimeString(startMins + duration * 60)

    // 0) validate club exists
    const club = await clubService.getClubById(club_id)
    if (!club) throw new Error('Club not found')

    // 0.5) validate court exists & belongs to club
    const court = await courtService.getCourtById(court_id)
    if (!court) throw new Error('Court not found')
    if (court.club_id !== club_id) throw new Error('Court does not belong to the given club')

    // 1) check time conflict first
    const conflict = await this.hasConflict(court_id, booking_date, start_time, end_time)
    if (conflict) throw new Error('Time slot already booked for this court on the chosen date')

    // 2) atomically mark court as booked if available
    try {
      await courtService.markCourtBookedIfAvailable(court_id)
    } catch (err: any) {
      throw new Error(err?.message ?? 'Court cannot be booked')
    }

    // 3) create booking record
    const booking_id = uuidv4()
    const item: BookingItem = {
      booking_id,
      booking_date,
      booking_status,
      club_id,
      court_id,
      duration,
      start_time,
      end_time,
      user_id,
      rating_given,
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
      console.error('BookingService.createBooking PutCommand error:', err)
      // rollback court status (best-effort)
      await courtService.rollbackCourtToAvailable(court_id)

      if (err?.name === 'ConditionalCheckFailedException') {
        throw new Error('Booking ID conflict, try again')
      }
      throw new Error('Failed to create booking')
    }
  }

  async getAllBookings(filters?: BookingFilterDTO): Promise<BookingItem[]> {
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

  async getBookingById(booking_id: string): Promise<BookingItem | null> {
    if (!booking_id) throw new Error('booking_id is required')
    try {
      const cmd = new GetCommand({
        TableName: TABLE_NAME,
        Key: { booking_id }
      })
      const res = (await dynamoClient.send(cmd)) as any
      return res.Item || null
    } catch (err) {
      console.error('BookingService.getBookingById error:', err)
      throw new Error('Failed to fetch booking')
    }
  }

  async cancelBooking(booking_id: string): Promise<BookingItem> {
    if (!booking_id) throw new Error('booking_id is required')

    // 1. Lấy booking hiện tại
    const getCmd = new GetCommand({ TableName: TABLE_NAME, Key: { booking_id } })
    const res = (await dynamoClient.send(getCmd)) as any
    const booking = res.Item
    if (!booking) throw new Error('Booking not found')

    if (booking.booking_status === 'cancelled') {
      throw new Error('Booking is already cancelled')
    }

    // 2. Cập nhật booking_status = "cancelled"
    const updateCmd = new UpdateCommand({
      TableName: TABLE_NAME,
      Key: { booking_id },
      UpdateExpression: 'SET booking_status = :status',
      ExpressionAttributeValues: { ':status': 'cancelled' },
      ReturnValues: 'ALL_NEW'
    })
    const updated = (await dynamoClient.send(updateCmd)) as any

    // 3. Rollback court_status về "available"
    if (booking.court_id) {
      await courtService.rollbackCourtToAvailable(booking.court_id)
    }

    return updated.Attributes
  }
}
