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
      const club_id = req.query.club_id as string | undefined
      const courts = await courtService.getAvailableCourts(club_id)
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
}
