import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { config } from '../config';
import { UserRole } from '../models/types';

export interface AuthUser {
  id: string;
  email: string;
  role: UserRole;
  name: string;
  patientId?: string;
  doctorId?: string;
  caregiverId?: string;
  pharmacistId?: string;
  labId?: string;
  organizationId?: string;
  clinicId?: string;
  receptionistId?: string;
  hospitalId?: string;
  hospitalName?: string;
  councilRegistrationId?: string;
  verificationStatus?: string;
}

declare global {
  namespace Express {
    interface Request {
      user?: AuthUser;
    }
  }
}

export function authMiddleware(req: Request, res: Response, next: NextFunction): void {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    res.status(401).json({ success: false, message: 'Authentication required. No token provided.' });
    return;
  }

  const token = authHeader.split(' ')[1];
  try {
    const decoded = jwt.verify(token, config.jwtSecret) as AuthUser;
    req.user = decoded;
    next();
  } catch (error) {
    res.status(401).json({ success: false, message: 'Invalid or expired authentication token.' });
    return;
  }
}
