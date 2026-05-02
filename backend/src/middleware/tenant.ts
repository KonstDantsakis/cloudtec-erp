import { NextFunction, Request, Response } from 'express'

export function resolveTenant(req: Request, _res: Response, next: NextFunction) {
  if (!req.user) return next()

  const requestedCompany = (req.query.company_id as string | undefined) ?? req.body.company_id
  if (req.user.role === 'super_admin' && requestedCompany) {
    req.body.company_id = requestedCompany
  } else {
    req.body.company_id = req.user.company_id
  }

  next()
}
