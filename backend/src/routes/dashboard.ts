import { Router } from 'express'
import { callEdge } from '../lib/edgeClient'

export const dashboardRouter = Router()

dashboardRouter.get('/', async (req, res) => {
  try {
    const data = await callEdge('get-dashboard', req.user!.token, { company_id: req.body.company_id })
    res.json(data)
  } catch (e: any) {
    res.status(500).json({ message: e.message })
  }
})
