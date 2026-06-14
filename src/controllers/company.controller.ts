// src/controllers/company.controller.ts
import { Request, Response } from "express";
import {
  createCompanyService,
  listCompaniesService,
  getStatsService,
  toggleCompanyStatusService,
} from "../services/company.service.js";

// ── POST /api/companies ───────────────────────────────
// Super Admin only

// Create company + admin user in one request
export const createCompany = async (req: Request, res: Response) => {
  try {
    const {
      company_name,
      company_domain,
      admin_first_name,
      admin_last_name,
      admin_email,
      admin_password,
    } = req.body;

    console.log("createCompany: called by", req.user?.role);

    const result = await createCompanyService({
      company_name,
      company_domain,
      admin_first_name,
      admin_last_name,
      admin_email,
      admin_password,
    });

    console.log("createCompany: success →", result.company.name);

    return res.status(201).json({
      message: "Successfully created company and admin user",
      data: result,
    });
  } catch (error) {
    console.error("createCompany Error:", error);
    return res.status(400).json({
      message: error instanceof Error ? error.message : "An error occurred",
    });
  }
};

// ── GET /api/companies ────────────────────────────────
export const listCompanies = async (req: Request, res: Response) => {
  try {
    const { status } = req.query;

    const companies = await listCompaniesService(status as string | undefined);

    return res.status(200).json({ data: companies });
  } catch (error) {
    console.error("listCompanies Error:", error);
    return res.status(500).json({
      message: error instanceof Error ? error.message : "An error occurred",
    });
  }
};

// ── GET /api/companies/stats ──────────────────────────
export const getStats = async (req: Request, res: Response) => {
  try {
    console.log("getStats: called");

    const stats = await getStatsService();

    return res.status(200).json({ data: stats });
  } catch (error) {
    console.error("getStats Error:", error);
    return res.status(500).json({
      message: error instanceof Error ? error.message : "An error occurred",
    });
  }
};

// ── PATCH /api/companies/:id/status ──────────────────
export const toggleStatus = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { status } = req.body;

    if (!["active", "suspended"].includes(status)) {
      return res.status(400).json({
        message: "status must be either active or suspended",
      });
    }

    const company = await toggleCompanyStatusService(id, status);

    console.log("toggleStatus:", company.name, "→", status);

    return res.status(200).json({
      message: `Successfully ${status === "active" ? "activated" : "suspended"} the company`,
      data: company,
    });
  } catch (error) {
    console.error("toggleStatus Error:", error);
    return res.status(400).json({
      message: error instanceof Error ? error.message : "An error occurred",
    });
  }
};
