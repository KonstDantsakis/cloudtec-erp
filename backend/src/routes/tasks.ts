import { Router } from 'express'
import { callEdge } from '../lib/edgeClient'
import { badRequest } from '../utils/http'

export const tasksRouter = Router()

tasksRouter.get('/', async (req, res) => {
  try {
    const data = await callEdge<any[]>('get-tasks', req.user!.token, { company_id: req.body.company_id })
    res.json(data)
  } catch (e: any) { return badRequest(res, e.message) }
})

tasksRouter.post('/', async (req, res) => {
  try {
    const data = await callEdge<any>('create-task', req.user!.token, { ...req.body, company_id: req.body.company_id })
    res.status(201).json(data)
  } catch (e: any) { return badRequest(res, e.message) }
})

tasksRouter.put('/:id', async (req, res) => {
  try {
    const data = await callEdge<any>('update-task', req.user!.token, { id: req.params.id, ...req.body, company_id: req.body.company_id })
    res.json(data)
  } catch (e: any) { return badRequest(res, e.message) }
})

tasksRouter.delete('/:id', async (req, res) => {
  try {
    await callEdge('delete-task', req.user!.token, { id: req.params.id, company_id: req.body.company_id })
    res.status(204).send()
  } catch (e: any) { return badRequest(res, e.message) }
})
