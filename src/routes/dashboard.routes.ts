import { Router } from "express";
import { requireRole, verifyToken } from "../lib/auth.middleware.js";
import { getActivities, getAlerts } from "../controllers/dashboard.controller.js";

const router = Router();

// GET /api/dashboard/activities
// GET /api/dashboard/alerts
router.get("/activities", verifyToken, requireRole("super_admin"), getActivities);
router.get("/alerts", verifyToken, requireRole("super_admin"), getAlerts);

export default router;

