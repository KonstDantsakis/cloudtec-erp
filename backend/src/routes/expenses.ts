import { Router } from 'express'
import { z } from 'zod'
import { supabaseAdmin } from '../lib/supabase'
import { badRequest } from '../utils/http'

const schema = z.object({
  company_id: z.string(),
  supplier: z.string().min(2),
  category: z.string().min(2),
  amount: z.number().positive(),
  vat: z.number().min(0),
  date: z.string(),
  notes: z.string().optional(),
})

export const expensesRouter = Router()

expensesRouter.get('/', async (req, res) => {
  const { data } = await supabaseAdmin.from('expenses').select('*').eq('company_id', req.body.company_id).order('date', { ascending: false })
  res.json(data ?? [])
})

expensesRouter.post('/', async (req, res) => {
  const parsed = schema.safeParse(req.body)
  if (!parsed.success) return badRequest(res, parsed.error.issues[0].message)
  const { data, error } = await supabaseAdmin.from('expenses').insert(parsed.data).select('*').single()
  if (error) return badRequest(res, error.message)
  res.status(201).json(data)
})

expensesRouter.put('/:id', async (req, res) => {
  const parsed = schema.partial().safeParse(req.body)
  if (!parsed.success) return badRequest(res, parsed.error.issues[0].message)
  const { data, error } = await supabaseAdmin.from('expenses').update(parsed.data).eq('id', req.params.id).eq('company_id', req.body.company_id).select('*').single()
  if (error) return badRequest(res, error.message)
  res.json(data)
})

expensesRouter.delete('/:id', async (req, res) => {
  const { error } = await supabaseAdmin.from('expenses').delete().eq('id', req.params.id).eq('company_id', req.body.company_id)
  if (error) return badRequest(res, error.message)
  res.status(204).send()
})
