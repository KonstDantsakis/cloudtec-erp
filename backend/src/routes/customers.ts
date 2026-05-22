import { Router } from 'express'
import { callEdge } from '../lib/edgeClient'
import { badRequest } from '../utils/http'

export const customersRouter = Router()

customersRouter.get('/', async (req, res) => {
  try {
    const search = (req.query.search as string | undefined)?.trim()
    const data = await callEdge<any[]>('get-customers', req.user!.token, {
      company_id: req.body.company_id,
      ...(search ? { search } : {}),
    })
    res.json(data)
  } catch (e: any) { return badRequest(res, e.message) }
})

customersRouter.post('/', async (req, res) => {
  try {
    const data = await callEdge<any>('create-customer', req.user!.token, {
      ...req.body,
      company_id: req.body.company_id,
    })
    res.status(201).json(data)
  } catch (e: any) { return badRequest(res, e.message) }
})

customersRouter.put('/:id', async (req, res) => {
  try {
    const data = await callEdge<any>('update-customer', req.user!.token, {
      id: req.params.id,
      ...req.body,
      company_id: req.body.company_id,
    })
    res.json(data)
  } catch (e: any) { return badRequest(res, e.message) }
})

customersRouter.delete('/:id', async (req, res) => {
  try {
    await callEdge('delete-customer', req.user!.token, {
      id: req.params.id,
      company_id: req.body.company_id,
    })
    res.status(204).send()
  } catch (e: any) { return badRequest(res, e.message) }
})
