import { Router } from 'express'
import { z } from 'zod'
import { supabaseAdmin } from '../lib/supabase'
import { badRequest } from '../utils/http'

const itemSchema = z.object({
  product_id: z.string().uuid(),
  description: z.string(),
  quantity: z.number().positive(),
  unit_price: z.number().nonnegative(),
  vat_rate: z.number().min(0),
})

const invoiceSchema = z.object({
  company_id: z.string(),
  customer_id: z.string().uuid(),
  issue_date: z.string(),
  due_date: z.string().optional(),
  status: z.enum(['draft', 'unpaid', 'paid', 'cancelled']),
  items: z.array(itemSchema).min(1),
})

export const invoicesRouter = Router()

invoicesRouter.get('/', async (req, res) => {
  const { data } = await supabaseAdmin.from('invoices').select('*').eq('company_id', req.body.company_id).order('created_at', { ascending: false })
  res.json(data ?? [])
})

invoicesRouter.get('/:id', async (req, res) => {
  const invoice = await supabaseAdmin.from('invoices').select('*').eq('id', req.params.id).eq('company_id', req.body.company_id).single()
  const items = await supabaseAdmin.from('invoice_items').select('*').eq('invoice_id', req.params.id)
  if (invoice.error) return badRequest(res, invoice.error.message)
  res.json({ invoice: invoice.data, items: items.data ?? [] })
})

invoicesRouter.post('/', async (req, res) => {
  const parsed = invoiceSchema.safeParse(req.body)
  if (!parsed.success) return badRequest(res, parsed.error.issues[0].message)

  const subtotal = parsed.data.items.reduce((sum, item) => sum + item.quantity * item.unit_price, 0)
  const vat_total = parsed.data.items.reduce((sum, item) => sum + item.quantity * item.unit_price * (item.vat_rate / 100), 0)
  const grand_total = subtotal + vat_total

  const invoiceNumber = `INV-${Date.now()}`
  const { data: invoice, error } = await supabaseAdmin
    .from('invoices')
    .insert({ ...parsed.data, invoice_number: invoiceNumber, subtotal, vat_total, grand_total })
    .select('*')
    .single()

  if (error || !invoice) return badRequest(res, error?.message ?? 'Could not create invoice')

  const itemRows = parsed.data.items.map((item) => ({
    company_id: parsed.data.company_id,
    invoice_id: invoice.id,
    ...item,
    line_total: item.quantity * item.unit_price,
    vat_amount: item.quantity * item.unit_price * (item.vat_rate / 100),
  }))

  const insertItems = await supabaseAdmin.from('invoice_items').insert(itemRows)
  if (insertItems.error) return badRequest(res, insertItems.error.message)

  res.status(201).json(invoice)
})
