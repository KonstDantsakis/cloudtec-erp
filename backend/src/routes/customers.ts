import { Router } from 'express'
import { z } from 'zod'
import { supabaseAdmin } from '../lib/supabase'
import { badRequest } from '../utils/http'

const schema = z.object({
  name: z.string().min(2),
  email: z.string().email().optional().or(z.literal('')),
  phone: z.string().optional(),
  address: z.string().optional(),
  tax_number: z.string().optional(),
  notes: z.string().optional(),
  company_id: z.string(),
})

export const customersRouter = Router()

customersRouter.get('/', async (req, res) => {
  const search = (req.query.search as string | undefined)?.trim()
  let query = supabaseAdmin.from('customers').select('*').eq('company_id', req.body.company_id).order('created_at', { ascending: false })
  if (search) query = query.ilike('name', `%${search}%`)
  const { data } = await query
  res.json(data ?? [])
})

customersRouter.post('/', async (req, res) => {
  const parsed = schema.safeParse(req.body)
  if (!parsed.success) return badRequest(res, parsed.error.issues[0].message)
  const { data, error } = await supabaseAdmin.from('customers').insert(parsed.data).select('*').single()
  if (error) return badRequest(res, error.message)
  res.status(201).json(data)
})

customersRouter.put('/:id', async (req, res) => {
  const parsed = schema.partial().safeParse(req.body)
  if (!parsed.success) return badRequest(res, parsed.error.issues[0].message)

  const { data, error } = await supabaseAdmin
    .from('customers')
    .update(parsed.data)
    .eq('id', req.params.id)
    .eq('company_id', req.body.company_id)
    .select('*')
    .single()

  if (error) return badRequest(res, error.message)
  res.json(data)
})

customersRouter.delete('/:id', async (req, res) => {
  const { error } = await supabaseAdmin.from('customers').delete().eq('id', req.params.id).eq('company_id', req.body.company_id)
  if (error) return badRequest(res, error.message)
  res.status(204).send()
})
