import { Router } from 'express'
import { callEdge } from '../lib/edgeClient'
import { badRequest } from '../utils/http'

export const expensesRouter = Router()

expensesRouter.get('/', async (req, res) => {
  try {
    const data = await callEdge<any[]>('get-company-expenses', req.user!.token, { company_id: req.body.company_id })
    res.json(data)
  } catch (e: any) { return badRequest(res, e.message) }
})

expensesRouter.post('/', async (req, res) => {
  try {
    const data = await callEdge<any>('create-company-expense', req.user!.token, { ...req.body, company_id: req.body.company_id })
    res.status(201).json(data)
  } catch (e: any) { return badRequest(res, e.message) }
})

expensesRouter.put('/:id', async (req, res) => {
  try {
    const data = await callEdge<any>('update-company-expense', req.user!.token, { id: req.params.id, ...req.body, company_id: req.body.company_id })
    res.json(data)
  } catch (e: any) { return badRequest(res, e.message) }
})

expensesRouter.delete('/:id', async (req, res) => {
  try {
    await callEdge('delete-company-expense', req.user!.token, { id: req.params.id, company_id: req.body.company_id })
    res.status(204).send()
  } catch (e: any) { return badRequest(res, e.message) }
})
