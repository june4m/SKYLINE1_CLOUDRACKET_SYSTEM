import { Request, Response } from 'express'
import { CourtService } from './court.services'

const courtService = new CourtService()

export class CourtController {
  async getCourt(req: Request, res: Response) {
    console.log('getCourt Controller')
    // lấy từ path param
    const court_id = req.params.court_id as string
    console.log('Received request for court_id:', court_id)
    if (!court_id) {
      return res.status(400).json({ message: 'court_id is required' })
    }

    try {
      const court = await courtService.getCourtById(court_id)
      if (!court) {
        return res.status(404).json({ message: 'Court not found' })
      }
      res.status(200).json(court)
    } catch (error: any) {
      console.error('CourtController.getCourt error:', error)
      res.status(500).json({ message: error.message })
    }
  }

  async getAllCourts(req: Request, res: Response) {
    try {
      const courts = await courtService.getAllCourts()
      res.status(200).json(courts)
    } catch (error: any) {
      res.status(500).json({ message: error.message })
    }
  }

  async getAvailableCourts(req: Request, res: Response) {
    try {
      const courts = await courtService.getAvailableCourts()
      res.status(200).json(courts)
    } catch (error: any) {
      res.status(500).json({ message: error.message })
    }
  }

  async searchCourts(req: Request, res: Response) {
    try {
      const { club_name, club_district, limit } = req.body

      if (!club_name && !club_district) {
        return res.status(400).json({ message: 'club_name or club_district is required in request body' })
      }

      const data = await courtService.searchCourtsByClubInfo({
        club_name,
        club_district,
        limitClubs: limit ?? 50
      })

      res.status(200).json(data)
    } catch (err: any) {
      res.status(500).json({ message: err.message })
    }
  }

  async createCourt(req: Request, res: Response) {
    try {
      const { club_id, court_name, court_status } = req.body
      if (!club_id || !court_name) {
        return res.status(400).json({ message: 'club_id and court_name are required' })
      }

      const court = await courtService.createCourt({ club_id, court_name, court_status })
      res.status(201).json({ message: 'Court created', court })
    } catch (err: any) {
      res.status(500).json({ message: err.message })
    }
  }

  /**
   * Get nearby courts based on user location
   * GET /courts/nearby?latitude=10.762622&longitude=106.660172&radius=10
   */
  async getNearbyCourts(req: Request, res: Response) {
    try {
      const { latitude, longitude, radius } = req.query

      // Validate required parameters
      if (!latitude || !longitude) {
        return res.status(400).json({
          message: 'latitude and longitude are required query parameters'
        })
      }

      const lat = parseFloat(latitude as string)
      const lng = parseFloat(longitude as string)
      const radiusKm = radius ? parseFloat(radius as string) : 10 // Default 10km

      // Validate numeric values
      if (isNaN(lat) || isNaN(lng) || isNaN(radiusKm)) {
        return res.status(400).json({
          message: 'latitude, longitude, and radius must be valid numbers'
        })
      }

      // Validate latitude and longitude ranges
      if (lat < -90 || lat > 90) {
        return res.status(400).json({
          message: 'latitude must be between -90 and 90'
        })
      }

      if (lng < -180 || lng > 180) {
        return res.status(400).json({
          message: 'longitude must be between -180 and 180'
        })
      }

      console.log(`Searching for courts near (${lat}, ${lng}) within ${radiusKm}km`)

      const nearbyCourts = await courtService.getNearbyCourts(lat, lng, radiusKm)

      res.status(200).json({
        count: nearbyCourts.length,
        radius_km: radiusKm,
        user_location: { latitude: lat, longitude: lng },
        courts: nearbyCourts
      })
    } catch (error: any) {
      console.error('CourtController.getNearbyCourts error:', error)
      res.status(500).json({ message: error.message })
    }
  }
}
