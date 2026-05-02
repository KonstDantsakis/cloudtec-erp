import { NextFunction, Request, Response } from 'express'
import { forbidden } from '../utils/http'

export function requireRole(roles: Array<'super_admin' | 'company_admin' | 'employee'>) {
  return (req: Request, res: Response, next: NextFunction) => {
    if (!req.user) return forbidden(res)
    if (!roles.includes(req.user.role)) return forbidden(res)
    next()
  }
}
