import { Request, Response } from "express";
import { SubscriptionStatus } from "@prisma/client";
import { createNotificationService, createSubscriptionService, deleteNotificationService, getNotificationsService, getPlatformSettingsService, getPlatformStatsService, getSubscriptionsService, updateSettingsBulkService, updateSettingService, updateSubscriptionService } from "../services/super-admin.service.js";


// 1. PLATFORM STATISTICS
export const getPlatformStats = async (req: Request, res: Response) => {
    try {
        const data = await getPlatformStatsService();
        return res.status(200).json({ data });
    } catch (error) {
        return res.status(500).json({ message: error instanceof Error ? error.message : "Something went wrong" });
    }
};

//* ******************************************************************* */
// 2. SUBSCRIPTIONS
// GET SUBSCRIPTIONS
export const getSubscriptions = async (req: Request, res: Response) => {
    try {
        const { status } = req.query;
        const data = await getSubscriptionsService(status as SubscriptionStatus)

        return res.status(200).json({ data });
    } catch (error) {
        return res.status(500).json({ message: error instanceof Error ? error.message : "Something went wrong" })
    }
};

// CREATE SUBSCRIPTION
export const createSubscription = async (req: Request, res: Response) => {
    try {
        const { company_id, plan, expires_at, max_users, price_monthly } = req.body;
        if (!company_id || !plan) return res.status(400).json({ message: "Company id and plan are require" });

        const data = await createSubscriptionService({ company_id, plan, expires_at, max_users, price_monthly });

        return res.status(201).json({ message: "Subscription added" })
    } catch (error) {
        return res.status(500).json({ message: error instanceof Error ? error.message : "Something went wrong" })
    }
};

// UPDATE SUBSCRIPTION
export const updateSubscription = async (req: Request, res: Response) => {
    try {
        const rowId = req.params.id;
        const id = Array.isArray(rowId) ? rowId[0] : rowId;
        const data = await updateSubscriptionService(id, req.body);
        return res.status(201).json({ message: "Subscription updated", data })

    } catch (error) {
        return res.status(500).json({ message: error instanceof Error ? error.message : "Something went wrong" })
    }
};

//* ******************************************************************* */
// 3. NOTIFICATIONS
// GET NOTIFICATIONS
export const getNotifications = async (req: Request, res: Response) => {
    try {
        const data = await getNotificationsService();
        return res.status(200).json({ data });
    } catch (error) {
        return res.status(500).json({ message: error instanceof Error ? error.message : "Something went wrong" })
    }
};

// CREATE NOTIFICATION
export const createNotification = async (req: Request, res: Response) => {
    try {
        const { title, message, type, channel, target_role, company_id } = req.body;
        if (!title || !message) {
            return res.status(400).json({ message: "Message and title are require" });
        }
        const data = await createNotificationService({
            title, message, type, channel, target_role, company_id,
        });
        return res.status(201).json({ message: "Send the notification", data });
    } catch (error) {
        return res.status(400).json({ message: error instanceof Error ? error.message : "Something went wrong" })
    }
};

// DELETE NOTIFICATION
export const deleteNotification = async (req: Request, res: Response) => {
    try {
        const rowId = req.params.id;
        const id = Array.isArray(rowId) ? rowId[0] : rowId;
        await deleteNotificationService(id);
        return res.status(200).json({ message: "Deleted successfully" });
    } catch (error) {
        return res.status(400).json({
            message: error instanceof Error ? error.message : "Something went wrong",
        });
    }
};

//* ******************************************************************* */
// 4. PLATFORM SETTINGS
// GET PLATFORM SETTINGS
export const getSettings = async (req: Request, res: Response) => {
    try {
        const data = await getPlatformSettingsService();
        return res.status(200).json({ data });
    } catch (error) {
        return res.status(500).json({
            message: error instanceof Error ? error.message : "Something went wrong",
        });
    }
};

export const updateSetting = async (req: Request, res: Response) => {
    try {
        const rowKey = req.params.id;
        const key = Array.isArray(rowKey) ? rowKey[0] : rowKey;

        const { value } = req.body;
        if (value === undefined) {
            return res.status(400).json({ message: "value is required" });
        }
        const data = await updateSettingService(key, value);
        return res.status(200).json({ message: "Successfully updated", data });
    } catch (error) {
        return res.status(500).json({
            message: error instanceof Error ? error.message : "Something went wrong",
        });
    }
};

export const updateSettingsBulk = async (req: Request, res: Response) => {
    try {
        const { updates } = req.body;
        if (!Array.isArray(updates)) {
            return res.status(400).json({ message: "updates should be array" });
        }
        const data = await updateSettingsBulkService(updates);
        return res.status(200).json({ message: `success  ${data.updated} settings`, data });
    } catch (error) {
        console.error("updateSettingsBulk Error:", error);
        return res.status(500).json({
            message: error instanceof Error ? error.message : "Something went wrong",
        });
    }
};