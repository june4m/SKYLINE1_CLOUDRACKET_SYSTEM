import { Router } from 'express'
import { CourtController } from '../court-services/court.controllers'
import { BookingController } from '~/booking-services/booking.controllers'
import { ClubController } from '~/club-services/club.controllers'

const router = Router()

const courtController = new CourtController()
const bookingController = new BookingController()
const clubController = new ClubController()

// COURT
router.get('/courts/id/:court_id', (req, res) => courtController.getCourt(req, res)) // Lấy 1 court theo ID
router.get('/courts', (req, res) => courtController.getAllCourts(req, res)) // Lấy tất cả courts
router.get('/courts/available', (req, res) => courtController.getAvailableCourts(req, res)) // Lấy courts có status 'available'
router.post('/courts/search', (req, res) => courtController.searchCourts(req, res)) // Search courts theo body { club_name, club_district, ... }
router.post('/courts', (req, res) => courtController.createCourt(req, res)) // Tạo court mới

// BOOKING
router.get('/bookings/:booking_id', (req, res) => bookingController.getBooking(req, res)) // Lấy 1 booking theo ID
router.post('/bookings', (req, res) => bookingController.bookCourt(req, res)) // Tạo booking
router.get('/bookings', (req, res) => bookingController.getAllBookings(req, res)) // Lấy all bookings\
router.put('/bookings/:booking_id/cancel', (req, res) => bookingController.cancelBooking(req, res))

// CLUB
router.post('/clubs', (req, res) => clubController.createClub(req, res)) // Tạo club mới

export default router
