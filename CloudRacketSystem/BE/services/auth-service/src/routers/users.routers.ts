import { Router } from 'express'
import { CourtController } from '../controllers/court.controllers'

const router = Router()

const courtController = new CourtController()

// GET /getCourt
console.log('Mount /getCourt route')
router.get('/getCourt', (req, res) => courtController.getCourt(req, res))
// router.get('/login',(req,res)=>userController.login(req,res))

export default router