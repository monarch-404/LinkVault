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

// --- NEW: Optional Auth ---
// This checks who the user is, but DOES NOT block them if they aren't logged in.
export const optionalAuth = (req: Request, res: Response, next: NextFunction) => {
  const authHeader = req.headers.authorization;
  
  if (authHeader && authHeader.startsWith('Bearer ')) {
    const token = authHeader.split(' ')[1];
    try {
      // Decode the user token and attach it to the request
      const decoded = jwt.verify(token, process.env.JWT_SECRET as string);
      (req as any).user = decoded;
    } catch (err) {
      // If the token is expired/invalid, we just ignore it and treat them as anonymous
    }
  }
  
  next(); // ALWAYS let them through to the controller!
};