import { NextFunction, Request, Response } from 'express'
import { supabaseAuth } from '../lib/supabase'

declare global {
  namespace Express {
    interface Request {
      user?: {
        id: string
        role: 'super_admin' | 'company_admin' | 'employee'
        company_id: string | null
        email: string
      }
    }
  }
}

export async function requireAuth(req: Request, res: Response, next: NextFunction) {
  const authorization = req.headers.authorization
  const token = authorization?.startsWith('Bearer ') ? authorization.slice(7) : null
  if (!token) return res.status(401).json({ message: 'Missing token' })

  const { data, error } = await supabaseAuth.auth.getUser(token)
  if (error || !data.user) return res.status(401).json({ message: 'Invalid token' })

  req.user = {
    id: data.user.id,
    role: (data.user.user_metadata?.role as any) ?? 'employee',
    company_id: (data.user.user_metadata?.company_id as string | null) ?? null,
    email: data.user.email ?? '',
  }

  next()
}
