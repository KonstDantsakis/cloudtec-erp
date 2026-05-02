import express from 'express'
import cors from 'cors'
import { env } from './config/env'
import { requireAuth } from './middleware/auth'
import { resolveTenant } from './middleware/tenant'
import { requireRole } from './middleware/rbac'
import { dashboardRouter } from './routes/dashboard'
import { customersRouter } from './routes/customers'
import { productsRouter } from './routes/products'
import { invoicesRouter } from './routes/invoices'
import { expensesRouter } from './routes/expenses'
import { tasksRouter } from './routes/tasks'
import { reportsRouter } from './routes/reports'

const app = express()
app.use(cors())
app.use(express.json())

app.get('/health', (_req, res) => res.json({ status: 'ok' }))

app.use('/api', requireAuth, resolveTenant)
app.use('/api/dashboard', dashboardRouter)
app.use('/api/customers', customersRouter)
app.use('/api/products', productsRouter)
app.use('/api/invoices', invoicesRouter)
app.use('/api/expenses', expensesRouter)
app.use('/api/tasks', tasksRouter)
app.use('/api/reports', reportsRouter)

app.use('/api/admin', requireRole(['super_admin']))

app.listen(env.PORT, () => {
  console.log(`ERP API running on http://localhost:${env.PORT}`)
})
