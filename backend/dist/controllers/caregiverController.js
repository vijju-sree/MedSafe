"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.caregiverController = void 0;
const db_1 = require("../database/db");
const adherenceService_1 = require("../services/adherenceService");
exports.caregiverController = {
    getAuthorizedPatients: async (req, res) => {
        try {
            const caregiverUserId = req.user?.id;
            const caregiver = db_1.db.caregivers.findOne(c => c.userId === caregiverUserId);
            // Consents granting access to this caregiver
            const consents = db_1.db.consents.find(c => c.granteeId === caregiverUserId && c.granteeRole === 'CAREGIVER' && c.status === 'ACTIVE');
            const patientIds = Array.from(new Set([
                ...(caregiver?.authorizedPatientIds || []),
                ...consents.map(c => c.patientId)
            ]));
            const patients = db_1.db.patients.find(p => patientIds.includes(p.patientId)).map(p => {
                const analytics = adherenceService_1.adherenceService.getPatientAnalytics(p.patientId);
                const todayStr = new Date().toISOString().split('T')[0];
                const missedToday = db_1.db.medicationSchedules.count(s => s.patientId === p.patientId && s.scheduledDate === todayStr && s.status === 'MISSED');
                return {
                    ...p,
                    adherencePercentage: analytics.adherencePercentage,
                    riskScore: analytics.riskScore,
                    missedDosesToday: missedToday
                };
            });
            res.json({ success: true, data: { patients } });
        }
        catch (error) {
            res.status(500).json({ success: false, message: error.message });
        }
    },
    getPatientOverview: async (req, res) => {
        try {
            const { patientId } = req.params;
            const caregiverUserId = req.user?.id;
            // Check active consent
            const hasConsent = db_1.db.consents.findOne(c => c.patientId === patientId && c.granteeId === caregiverUserId && c.status === 'ACTIVE');
            const caregiver = db_1.db.caregivers.findOne(c => c.userId === caregiverUserId);
            const isAuthorized = hasConsent || caregiver?.authorizedPatientIds.includes(patientId);
            if (!isAuthorized && req.user?.role !== 'ADMIN') {
                res.status(403).json({ success: false, message: 'Caregiver not authorized for this patient.' });
                return;
            }
            const patient = db_1.db.patients.findOne(p => p.patientId === patientId);
            if (!patient) {
                res.status(404).json({ success: false, message: 'Patient not found.' });
                return;
            }
            const todayStr = new Date().toISOString().split('T')[0];
            const todaySchedules = db_1.db.medicationSchedules.find(s => s.patientId === patientId && s.scheduledDate === todayStr).sort((a, b) => a.scheduledTime.localeCompare(b.scheduledTime));
            const analytics = adherenceService_1.adherenceService.getPatientAnalytics(patientId);
            const recentMissed = db_1.db.adherenceRecords.find(r => r.patientId === patientId && r.status === 'MISSED').slice(0, 5);
            const followUps = db_1.db.followUpActions.find(f => f.patientId === patientId && f.status !== 'RESOLVED');
            res.json({
                success: true,
                data: {
                    patient,
                    todaySchedules,
                    analytics,
                    recentMissed,
                    followUps
                }
            });
        }
        catch (error) {
            res.status(500).json({ success: false, message: error.message });
        }
    }
};
