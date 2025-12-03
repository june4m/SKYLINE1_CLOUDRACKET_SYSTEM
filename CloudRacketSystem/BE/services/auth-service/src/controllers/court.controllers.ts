import { Request, Response } from 'express'
import { CourtService } from '../services/court.services'

const courtService = new CourtService()

export class CourtController {
  async getCourt(req: Request, res: Response) {
    const court_id = req.query.court_id as string
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
      res.status(500).json({ message: error.message })
    }
  }
}