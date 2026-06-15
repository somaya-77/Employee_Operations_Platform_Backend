import { Request, Response } from "express";
import { getActivitiesService } from "../services/activity.service.js";
import { getAlertsService } from "../services/alert.service.js";

export const getActivities = async (req: Request, res: Response) => {
    try {
        const limit = Number(req.query.limit) || 10;
        const data = await getActivitiesService(limit);
        return res.status(200).json({ data });
    } catch (error) {
        return res.status(500).json({ message: error instanceof Error ? error.message : "An error occurred" });
    }
};

export const getAlerts = async (req: Request, res: Response) => {
    try {
        const data = await getAlertsService();
        return res.status(200).json({ data });
    } catch (error) {
        return res.status(500).json({ message: error instanceof Error ? error.message : "An error occurred" });
    }
};