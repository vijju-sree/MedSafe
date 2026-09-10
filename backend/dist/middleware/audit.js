"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.logAudit = logAudit;
const uuid_1 = require("uuid");
const db_1 = require("../database/db");
function logAudit(action, resource, getResourceId) {
    return (req, res, next) => {
        // Intercept finish to record status
        res.on('finish', () => {
            if (req.user) {
                const auditRecord = {
                    id: `aud-${(0, uuid_1.v4)().substring(0, 8)}`,
                    userId: req.user.id,
                    userName: req.user.name,
                    userRole: req.user.role,
                    action,
                    resource,
                    resourceId: getResourceId ? getResourceId(req) : req.params.id || req.body.id,
                    patientId: req.params.patientId || req.body.patientId || req.user.patientId,
                    timestamp: new Date().toISOString(),
                    ipAddress: req.ip || req.socket.remoteAddress,
                    userAgent: req.headers['user-agent'],
                    details: {
                        method: req.method,
                        path: req.originalUrl,
                        query: req.query,
                        statusCode: res.statusCode
                    },
                    result: res.statusCode < 400 ? 'SUCCESS' : 'FAILURE'
                };
                db_1.db.auditLogs.insert(auditRecord);
            }
        });
        next();
    };
}
