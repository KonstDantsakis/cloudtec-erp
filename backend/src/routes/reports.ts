import { Router } from 'express'
import { callEdge, callEdgeText } from '../lib/edgeClient'

export const reportsRouter = Router()

reportsRouter.get('/summary', async (req, res) => {
  try {
    const month = (req.query.month as string | undefined) ?? new Date().toISOString().slice(0, 7)
    const data = await callEdge('get-reports-summary', req.user!.token, { company_id: req.body.company_id, month })
    res.json(data)
  } catch (e: any) {
    res.status(500).json({ message: e.message })
  }
})

reportsRouter.get('/export.csv', async (req, res) => {
  try {
    const month = (req.query.month as string | undefined) ?? new Date().toISOString().slice(0, 7)
    const csv = await callEdgeText('export-invoices-csv', req.user!.token, { company_id: req.body.company_id, month })
    res.setHeader('Content-Type', 'text/csv')
    res.send(csv)
  } catch (e: any) {
    res.status(500).json({ message: e.message })
  }
})
