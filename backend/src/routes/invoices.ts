import { Router } from 'express'
import { callEdge } from '../lib/edgeClient'
import { badRequest } from '../utils/http'

export const invoicesRouter = Router()

invoicesRouter.get('/', async (req, res) => {
  try {
    const data = await callEdge<any[]>('get-invoices', req.user!.token, { company_id: req.body.company_id })
    res.json(data)
  } catch (e: any) { return badRequest(res, e.message) }
})

invoicesRouter.get('/:id', async (req, res) => {
  try {
    const data = await callEdge<any>('get-invoice', req.user!.token, { id: req.params.id, company_id: req.body.company_id })
    res.json(data)
  } catch (e: any) { return badRequest(res, e.message) }
})

invoicesRouter.post('/', async (req, res) => {
  try {
    const data = await callEdge<any>('create-invoice', req.user!.token, { ...req.body, company_id: req.body.company_id })
    res.status(201).json(data)
  } catch (e: any) { return badRequest(res, e.message) }
})
