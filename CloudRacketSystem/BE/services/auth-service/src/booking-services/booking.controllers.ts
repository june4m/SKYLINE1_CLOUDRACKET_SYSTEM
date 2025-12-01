import { Request, Response } from 'express'
import { BookingService } from '../booking-services/booking.services'
import { BookingCreateDTO } from '../booking-services/booking.schema'

const bookingService = new BookingService()

export class BookingController {
  async bookCourt(req: Request, res: Response) {
    try {
      console.log('Payload received:', req.body)
      const payload: BookingCreateDTO = req.body

      // basic validation
      const { booking_date, club_id, court_id, duration, start_time, user_id } = payload
      if (!booking_date || !club_id || !court_id || duration === undefined || !start_time || !user_id) {
        return res.status(400).json({
          message:
            'Missing required fields. Required: booking_date, club_id, court_id, duration (hours), start_time (HH:MM), user_id'
        })
      }

      const durNum = typeof duration === 'string' ? parseInt(duration, 10) : duration
      if (!Number.isInteger(durNum) || durNum <= 0) {
        return res.status(400).json({ message: 'duration must be a positive integer (hours)' })
      }

      if (!/^\d{2}:\d{2}$/.test(start_time)) {
        return res.status(400).json({ message: 'start_time must be in HH:MM format (24h)' })
      }

      const [hhStr, mmStr] = start_time.split(':')
      const hh = Number(hhStr),
        mm = Number(mmStr)
      if (Number.isNaN(hh) || Number.isNaN(mm) || hh < 0 || hh > 23 || mm < 0 || mm > 59) {
        return res.status(400).json({ message: 'start_time must be a valid 24h time (HH:MM)' })
      }

      const created = await bookingService.createBooking({ ...payload, duration: durNum })
      return res.status(201).json({ message: 'Booking created', booking: created })
    } catch (err: any) {
      console.error('BookingController.bookCourt error:', err)
      const msg = err?.message ?? 'Internal server error'
      if (msg.includes('already booked')) return res.status(409).json({ message: msg })
      return res.status(500).json({ message: msg })
    }
  }

  async getAllBookings(req: Request, res: Response) {
    try {
      const result = await bookingService.getAllBookings()
      return res.status(200).json(result)
    } catch (err: any) {
      console.error('BookingController.getAllBookings error:', err)
      return res.status(500).json({ message: err.message })
    }
  }
}
