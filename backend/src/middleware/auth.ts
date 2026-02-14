import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';

const SECRET = process.env.JWT_SECRET || 'secret';

export interface AuthRequest extends Request {
  user?: {
    id: string;
    email?: string;
  }; // <--- Telling TS that if 'user' exists, it definitely has an 'id' string
}
export const authenticate = (req: AuthRequest, res: Response, next: NextFunction) => {
  const token = req.headers['authorization']?.split(' ')[1];
  
  if (!token) return next(); // Allow anonymous, req.user will be undefined

  jwt.verify(token, SECRET, (err, user) => {
    if (!err) req.user = user as any;
    next();
  });
};