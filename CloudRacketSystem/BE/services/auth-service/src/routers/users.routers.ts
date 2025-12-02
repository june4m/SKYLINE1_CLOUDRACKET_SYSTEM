import { Router } from 'express'
import { CourtController } from '../court-services/court.controllers'
import { BookingController } from '~/booking-services/booking.controllers'
import { ClubController } from '~/club-services/club.controllers'
import { UserController } from '~/user-services/user.controllers'

const router = Router()

const courtController = new CourtController()
const bookingController = new BookingController()
const clubController = new ClubController()
const userController = new UserController()

// ============================================
// USER / AUTHENTICATION ROUTES
// ============================================
// Old paths (backwards compatible)
router.post('/users/register', (req, res) => userController.register(req, res)) // Đăng ký user mới
router.post('/users/login', (req, res) => userController.login(req, res)) // Đăng nhập
router.get('/users/profile', (req, res) => userController.getProfile(req, res)) // Lấy profile của user đang đăng nhập

// New / simplified endpoints required by spec
router.post('/login', (req, res) => userController.login(req, res))
router.post('/logout', (req, res) => userController.logout(req, res))
router.post('/register/customer', (req, res) => userController.registerCustomer(req, res))
router.post('/register/owner', (req, res) => userController.registerOwner(req, res))
router.get('/user/profile', (req, res) => userController.getProfile(req, res))
router.put('/user/profile', (req, res) => userController.updateProfile(req, res))
router.get('/users/id/:user_id', (req, res) => userController.getUser(req, res)) // Lấy 1 user theo ID
router.get('/users', (req, res) => userController.getAllUsers(req, res)) // Lấy tất cả users (có thể filter)
router.put('/users/:user_id', (req, res) => userController.updateUser(req, res)) // Cập nhật thông tin user
router.delete('/users/:user_id', (req, res) => userController.deleteUser(req, res)) // Xóa user (soft delete)

// ============================================
// COURT ROUTES
// ============================================
router.get('/courts/nearby', (req, res) => courtController.getNearbyCourts(req, res)) // Lấy courts gần vị trí user (phải đặt trước /courts/:id)
router.get('/courts/id/:court_id', (req, res) => courtController.getCourt(req, res)) // Lấy 1 court theo ID
router.get('/courts', (req, res) => courtController.getAllCourts(req, res)) // Lấy tất cả courts
router.get('/courts/available', (req, res) => courtController.getAvailableCourts(req, res)) // Lấy courts có status 'available'
router.post('/courts/search', (req, res) => courtController.searchCourts(req, res)) // Search courts theo body { club_name, club_district, ... }
router.post('/courts', (req, res) => courtController.createCourt(req, res)) // Tạo court mới

// ============================================
// BOOKING ROUTES
// ============================================
router.post('/bookings', (req, res) => bookingController.bookCourt(req, res)) // Tạo booking
router.get('/bookings', (req, res) => bookingController.getAllBookings(req, res)) // Lấy all bookings

// ============================================
// CLUB ROUTES
// ============================================
router.post('/clubs', (req, res) => clubController.createClub(req, res)) // Tạo club mới

export default router
