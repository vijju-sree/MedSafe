import { Request, Response, NextFunction } from 'express';
import { v4 as uuidv4 } from 'uuid';
import { db } from '../database/db';
import { AuditLog } from '../models/types';

export function logAudit(action: string, resource: string, getResourceId?: (req: Request) => string | undefined) {
  return (req: Request, res: Response, next: NextFunction): void => {
    // Intercept finish to record status
    res.on('finish', () => {
      if (req.user) {
        const auditRecord: AuditLog = {
          id: `aud-${uuidv4().substring(0, 8)}`,
          userId: req.user.id,
          userName: req.user.name,
          userRole: req.user.role,
          action,
          resource,
          resourceId: getResourceId ? getResourceId(req) : req.params.id || req.body.id,
          patientId: req.params.patientId || req.body.patientId || req.user.patientId,
          timestamp: new Date().toISOString(),
          ipAddress: req.ip || req.socket.remoteAddress,
          userAgent: req.headers['user-agent'] as string,
          details: {
            method: req.method,
            path: req.originalUrl,
            query: req.query,
            statusCode: res.statusCode
          },
          result: res.statusCode < 400 ? 'SUCCESS' : 'FAILURE'
        };
        db.auditLogs.insert(auditRecord);
      }
    });
    next();
  };
}
