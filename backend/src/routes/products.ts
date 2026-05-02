import { Router } from 'express'
import { z } from 'zod'
import { supabaseAdmin } from '../lib/supabase'
import { badRequest } from '../utils/http'

const schema = z.object({
  company_id: z.string(),
  name: z.string().min(2),
  type: z.enum(['product', 'service']),
  price: z.number().nonnegative(),
  vat_rate: z.number().min(0),
  stock_quantity: z.number().min(0),
  description: z.string().optional(),
})

export const productsRouter = Router()

productsRouter.get('/', async (req, res) => {
  const search = (req.query.search as string | undefined)?.trim()
  let query = supabaseAdmin.from('products').select('*').eq('company_id', req.body.company_id)
  if (search) query = query.ilike('name', `%${search}%`)
  const { data } = await query.order('created_at', { ascending: false })
  res.json(data ?? [])
})

productsRouter.post('/', async (req, res) => {
  const parsed = schema.safeParse(req.body)
  if (!parsed.success) return badRequest(res, parsed.error.issues[0].message)
  const { data, error } = await supabaseAdmin.from('products').insert(parsed.data).select('*').single()
  if (error) return badRequest(res, error.message)
  res.status(201).json(data)
})

productsRouter.put('/:id', async (req, res) => {
  const parsed = schema.partial().safeParse(req.body)
  if (!parsed.success) return badRequest(res, parsed.error.issues[0].message)
  const { data, error } = await supabaseAdmin.from('products').update(parsed.data).eq('id', req.params.id).eq('company_id', req.body.company_id).select('*').single()
  if (error) return badRequest(res, error.message)
  res.json(data)
})

productsRouter.delete('/:id', async (req, res) => {
  const { error } = await supabaseAdmin.from('products').delete().eq('id', req.params.id).eq('company_id', req.body.company_id)
  if (error) return badRequest(res, error.message)
  res.status(204).send()
})
