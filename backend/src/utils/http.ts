import { Response } from 'express'

export function badRequest(res: Response, message: string) {
  return res.status(400).json({ message })
}

export function forbidden(res: Response, message = 'Forbidden') {
  return res.status(403).json({ message })
}
