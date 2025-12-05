// src/controllers/club.controllers.ts
import { Request, Response } from 'express'
import { ClubService } from '../club-services/club.services'
import { ClubDTO } from '../club-services/club.schema'

const clubService = new ClubService()

export class ClubController {
  async createClub(req: Request, res: Response) {
    try {
      const payload: ClubDTO = req.body

      const created = await clubService.createClub(payload)
      res.status(201).json({ message: 'Club created', club: created })
    } catch (err: any) {
      res.status(400).json({ message: err.message })
    }
  }
}
