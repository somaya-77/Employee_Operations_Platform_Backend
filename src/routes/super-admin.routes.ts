import { Router } from "express";
import { requireRole, verifyToken } from "../lib/auth.middleware.js";
import { createNotification, createSubscription, deleteNotification, getNotifications, getPlatformStats, getSettings, getSubscriptions, updateSetting, updateSettingsBulk, updateSubscription } from "../controllers/super-admin.controller.js";


const router = Router();

router.use(verifyToken, requireRole("super_admin"));

// Statistics
router.get("/stats", getPlatformStats);

// Subscriptions 
router.get("/subscriptions", getSubscriptions);
router.post("/subscriptions", createSubscription);
router.patch("/subscriptions/:id", updateSubscription);

// Notifications 
router.get("/notifications", getNotifications);
router.post("/notifications", createNotification);
router.delete("/notifications/:id", deleteNotification);

// Settings 
router.get("/settings", getSettings);
router.patch("/settings/bulk", updateSettingsBulk);
router.patch("/settings/:key", updateSetting);

export default router;