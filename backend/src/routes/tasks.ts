import { Router } from 'express'
import { z } from 'zod'
import { supabaseAdmin } from '../lib/supabase'
import { badRequest } from '../utils/http'

const schema = z.object({
  company_id: z.string(),
  title: z.string().min(2),
  description: z.string().optional(),
  assigned_to: z.string().uuid().optional(),
  status: z.enum(['pending', 'in_progress', 'done']).default('pending'),
  due_date: z.string().optional(),
})

export const tasksRouter = Router()

tasksRouter.get('/', async (req, res) => {
  const { data } = await supabaseAdmin.from('tasks').select('*').eq('company_id', req.body.company_id).order('created_at', { ascending: false })
  res.json(data ?? [])
})

tasksRouter.post('/', async (req, res) => {
  const parsed = schema.safeParse(req.body)
  if (!parsed.success) return badRequest(res, parsed.error.issues[0].message)
  const { data, error } = await supabaseAdmin.from('tasks').insert(parsed.data).select('*').single()
  if (error) return badRequest(res, error.message)
  res.status(201).json(data)
})

tasksRouter.put('/:id', async (req, res) => {
  const parsed = schema.partial().safeParse(req.body)
  if (!parsed.success) return badRequest(res, parsed.error.issues[0].message)
  const { data, error } = await supabaseAdmin.from('tasks').update(parsed.data).eq('id', req.params.id).eq('company_id', req.body.company_id).select('*').single()
  if (error) return badRequest(res, error.message)
  res.json(data)
})

tasksRouter.delete('/:id', async (req, res) => {
  const { error } = await supabaseAdmin.from('tasks').delete().eq('id', req.params.id).eq('company_id', req.body.company_id)
  if (error) return badRequest(res, error.message)
  res.status(204).send()
})
